/**
 * Utilities for converting flowchart data to React Flow format.
 *
 * =============================================================================
 * CATEGORY THEORY CONTEXT (see docs/CATEGORY_THEORY.md for full details)
 * =============================================================================
 *
 * A flowchart in Plausible Fiction is an element of free_p, the free monad on
 * a polynomial functor p. Each task card is a monomial A·y^B where:
 *   - A = fields (payload/input parameters)
 *   - B = outcomes (directions/branches)
 *
 * Key distinctions:
 *   - COMPOSITION (sender → receiver): outcome.next points to next task
 *     This is polynomial composition p ∘ q at a single flowchart level
 *   - ELABORATION (parent → child): childFlowchart replaces a task with a sub-tree
 *     This is the free monad structure, NOT composition
 *
 * The nested view shows tree-of-trees (free_{free_p})
 * The exploded view flattens via monad multiplication μ: free_{free_p} → free_p
 *
 * Formula bindings implement payload composition - if sender maps A → B via
 * outcome payload, and receiver takes B as input via bind, the composed flow
 * maps A directly to the receiver's computation.
 * =============================================================================
 */

import dagre from 'dagre';
import { normalizeNext } from './shared.js';
import { findNodeById } from './queries.js';

/**
 * Compute field provenance for a task.
 * Returns an object mapping field names to their provenance info:
 * { fieldName: { source: 'inherited' | 'bound' | 'declared', formula?: string, type: string } }
 *
 * CATEGORICAL NOTE: This tracks how the payload type A of a task monomial A·y^B
 * is populated. Fields can come from:
 *   - 'inherited': Scope propagation through the flowchart (functoriality)
 *   - 'bound': Explicit formula assignment from sender's outcome payload
 *   - 'declared': New field declared on this task
 *
 * The provenance chain represents the Kleisli composition of payload maps.
 */
function computeFieldProvenance(nodeFields, inheritedProvenance, incomingBind) {
  const provenance = {};

  // First, add all inherited fields
  for (const [name, info] of Object.entries(inheritedProvenance)) {
    provenance[name] = { ...info }; // Preserve provenance from ancestors
  }

  // Then add/override with bound fields from incoming edge
  if (incomingBind) {
    for (const [fieldName, formula] of Object.entries(incomingBind)) {
      provenance[fieldName] = {
        source: 'bound',
        formula: formula,
        type: nodeFields?.[fieldName]?.type || 'any'
      };
    }
  }

  // Finally, mark any declared fields that aren't already tracked as "declared"
  if (nodeFields) {
    for (const [name, def] of Object.entries(nodeFields)) {
      if (!provenance[name]) {
        provenance[name] = {
          source: 'declared',
          type: def.type || 'any'
        };
      }
    }
  }

  return provenance;
}

/**
 * Convert PF flowchart to React Flow nodes and edges.
 *
 * CATEGORICAL NOTE: This function renders an element of free_p (the free monad
 * on polynomial p). Each task node is a monomial A·y^B, and the React Flow
 * edges represent polynomial composition (sender → receiver direction).
 *
 * The viewContext parameter implements "drilling down" into an elaborated task,
 * which renders the childFlowchart - this is viewing a sub-tree of the free_p
 * element separately (the cooperad structure).
 *
 * @param flowchart - The full flowchart data (element of free_p)
 * @param viewContext - Optional task ID to "drill into". If provided, only renders
 *                      that task's childFlowchart (internal elaboration).
 * @param parentTask - Optional parent task info for outcome resolution
 * @param inheritedProvenance - Optional field provenance inherited from parent context
 */
export function flowchartToReactFlow(flowchart, viewContext = null, parentTask = null, inheritedProvenance = {}) {
  if (!flowchart || !flowchart.id) {
    return { nodes: [], edges: [] };
  }

  // If we have a viewContext, find that task and render its childFlowchart
  let rootToRender = flowchart;
  if (viewContext) {
    const contextTask = findNodeById(flowchart, viewContext);
    if (contextTask && contextTask.childFlowchart) {
      rootToRender = contextTask.childFlowchart;
    }
  }

  const nodes = [];
  const edges = [];

  // Build a map of child ID -> bind info from parent outcomes
  function getBindForChild(parentNode, childId) {
    for (const outcome of (parentNode.outcomes || [])) {
      if (!outcome.next) continue;
      const nextTaskId = typeof outcome.next === 'string' ? outcome.next : outcome.next.task;
      if (nextTaskId === childId) {
        return typeof outcome.next === 'object' ? (outcome.next.bind || null) : null;
      }
    }
    return null;
  }

  // First pass: build nodes and edges with provenance tracking
  function processNode(node, currentProvenance = {}) {
    // Compute this node's field provenance
    const nodeFields = node.fields || {};
    const fieldProvenance = computeFieldProvenance(nodeFields, currentProvenance, null);

    nodes.push({
      id: node.id,
      type: 'taskNode',
      position: { x: 0, y: 0 }, // Will be set by dagre
      data: {
        label: node.label,
        fields: node.fields || null, // Task input fields
        fieldProvenance: fieldProvenance, // NEW: provenance info for tooltips
        outcomes: node.outcomes || [],
        hasChildren: !!(node.children && node.children.length > 0),
        childFlowchart: node.childFlowchart || null,
        isElaborated: !!node.childFlowchart, // Flag for styling
        parentTask: parentTask, // Pass parent task for outcome resolution
        pendingNarrative: node.pendingNarrative || null, // Pre-assigned narrative for later elaboration
        derivedValue: node.derivedValue ?? null, // Value from inward propagation (WS2)
        valueCurrency: parentTask?.valueCurrency || null, // Currency for value display
        taskId: node.id, // For spotlight toggle dispatch
        spotlight: node.spotlight || false, // WS3: task spotlighted for help
        bountyDescription: node.bountyDescription || null, // WS3: bounty description
      },
    });

    // Only process regular children - childFlowcharts are accessed via drill-down
    const allChildren = [...(node.children || [])];

    // Create edges only for non-terminal outcomes
    (node.outcomes || []).forEach((outcome, i) => {
      const outcomeHandleId = `outcome-${outcome.id || i}`;
      const normalized = normalizeNext(outcome.next);

      if (normalized) {
        // Edge to child task - from outcome handle to child's top
        edges.push({
          id: `${node.id}-${outcomeHandleId}->${normalized.task}`,
          source: node.id,
          sourceHandle: outcomeHandleId,
          target: normalized.task,
          targetHandle: 'target',
          type: 'default',
          style: { stroke: '#5eb3a8', strokeWidth: 2 },
          animated: false,
          // Include binding info if present
          data: normalized.bind ? { bind: normalized.bind } : undefined,
        });
      }
      // Terminal outcomes have no edges - they're clickable instead
    });

    // Process children recursively with updated provenance
    allChildren.forEach((child) => {
      // Get bind info for this child
      const bindForChild = getBindForChild(node, child.id);

      // Build child's inherited provenance: current provenance + node's own fields
      const childInheritedProvenance = { ...fieldProvenance };

      // Mark parent's fields as inherited for child
      for (const [name, info] of Object.entries(fieldProvenance)) {
        if (info.source !== 'inherited') {
          childInheritedProvenance[name] = { ...info, source: 'inherited' };
        }
      }

      // Apply bind formulas to child's provenance
      const childProvenance = computeFieldProvenance(
        child.fields || {},
        childInheritedProvenance,
        bindForChild
      );

      processNode(child, childProvenance);
    });
  }

  processNode(rootToRender, inheritedProvenance);

  // Second pass: use dagre to compute layout (only for task nodes)
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'TB',  // Top to bottom
    nodesep: 100,   // Horizontal spacing between nodes
    ranksep: 150,   // Vertical spacing between ranks
  });

  // Add nodes to dagre with their dimensions
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: 200,   // Match max-width from CSS
      height: 120,  // Estimate - will vary but dagre handles it
    });
  });

  // Add non-terminal edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWithPosition.width / 2,
      y: nodeWithPosition.y - nodeWithPosition.height / 2,
    };
  });

  return { nodes, edges };
}

// ============================================================================
// RECIPE UTILITIES (POINTED POLYNOMIALS)
// ============================================================================
//
// CATEGORICAL NOTE: These functions work with pointed polynomials (p_*) and
// the free monad on pointed polynomials (free_{p_*}).
//
// A pointed task has a chosenOutcome field, representing the preferred/expected
// outcome. Following chosenOutcome at each node traces the "recipe" - the
// planned path through the flowchart.
//
// Key operations:
//   - extractRecipe: follows chosenOutcome at each node, returns the path
//   - validateRecipeCoherence: checks that elaborations respect chosen outcomes
//
// See docs/CATEGORY_THEORY.md "Pointed Polynomials and Recipes" section.
// ============================================================================

/**
 * Extract the recipe (chosen path) from a flowchart.
 *
 * Starting from the root, follows `chosenOutcome` at each task until reaching
 * a terminal outcome. Returns the sequence of tasks along the chosen path.
 *
 * CATEGORICAL NOTE: This implements the extraction part of the canonical map
 *   free_{p_*} → (free_p)_*
 *
 * The result is the "chosen path" - the linear sequence that represents the
 * recipe/plan embedded in the flowchart.
 *
 * @param flowchart - The root of a free_{p_*} element (flowchart with chosenOutcome)
 * @returns { tasks: Array<{ task, chosenOutcome }>, terminalOutcome: Outcome | null }
 */
export function extractRecipe(flowchart) {
  if (!flowchart) return { tasks: [], terminalOutcome: null };

  const tasks = [];
  let current = flowchart;
  // Track siblings context: outcome.next can point to siblings stored in the
  // parent's children[]. Start with root's children as the initial sibling set.
  let siblings = flowchart.children || [];

  while (current) {
    if (!current.chosenOutcome) {
      // No chosen outcome - path ends here (but not at a terminal)
      tasks.push({ task: current, chosenOutcome: null });
      return { tasks, terminalOutcome: null };
    }

    // Find the chosen outcome
    const chosenOutcome = (current.outcomes || []).find(o => o.id === current.chosenOutcome);

    if (!chosenOutcome) {
      // Invalid chosenOutcome reference
      tasks.push({ task: current, chosenOutcome: current.chosenOutcome, error: 'invalid chosenOutcome' });
      return { tasks, terminalOutcome: null };
    }

    // Add this task to the path
    tasks.push({ task: current, chosenOutcome: chosenOutcome });

    if (!chosenOutcome.next) {
      // Terminal outcome - we've reached the end
      return { tasks, terminalOutcome: chosenOutcome };
    }

    // Non-terminal - follow to next task (children first, then siblings)
    const nextTaskId = typeof chosenOutcome.next === 'string' ? chosenOutcome.next : chosenOutcome.next.task;
    const currentChildren = current.children || [];
    let nextTask = currentChildren.find(c => c.id === nextTaskId);

    if (!nextTask) {
      // Try siblings (stored in parent's children[])
      nextTask = siblings.find(c => c.id === nextTaskId);
    }

    if (!nextTask) {
      // Can't find next task
      return { tasks, terminalOutcome: null };
    }

    // Update siblings context: if we descended into children, they become siblings
    if (currentChildren.find(c => c.id === nextTaskId)) {
      siblings = currentChildren;
    }

    current = nextTask;
  }

  return { tasks, terminalOutcome: null };
}
