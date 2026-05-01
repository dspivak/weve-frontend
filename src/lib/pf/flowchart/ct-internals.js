// ============================================================================
// CT primitives — internal helpers for the monad μ (exploded view).
// Not yet used in UI but part of the categorical design.
// ============================================================================
//
// CATEGORICAL NOTE: These functions implement monad multiplication
//   μ: free_{free_p} → free_p
//
// The nested view (tree-of-trees) shows elaborations as separate sub-flowcharts.
// The exploded view flattens this to a single tree where all tasks are siblings.
//
// Key operations:
//   - composeFormulas: Kleisli composition of payload maps
//   - resolveOutcomeChain: follows mapsTo chain to find actual receiver task
//   - explodeFlowchart: the μ operation - flattens nested structure
//
// The cooperad structure means this flattening is well-defined and associative.
// ============================================================================

import { normalizeNext } from './shared.js';

/**
 * Extract all terminal outcomes from the flowchart tree.
 * Terminal outcomes are those where next is null (no follow-up task).
 *
 * CATEGORICAL NOTE: Terminal outcomes are leaves in the free_p tree - they
 * represent completion states. In an elaborated task, terminals use `mapsTo`
 * to specify which parent outcome they correspond to (Kleisli map specification).
 */
function extractTerminalOutcomes(flowchart) {
  if (!flowchart) return [];

  const terminals = [];

  function walk(node, path = []) {
    const currentPath = [...path, node.label];

    (node.outcomes || []).forEach(outcome => {
      if (!outcome.next) {
        terminals.push({
          id: outcome.id,
          label: outcome.label,
          parentTask: node.label,
          path: currentPath,
          mapsTo: outcome.mapsTo || null, // Preserve mapping info
        });
      }
    });

    (node.children || []).forEach(child => walk(child, currentPath));

    if (node.childFlowchart) {
      walk(node.childFlowchart, currentPath);
    }
  }

  walk(flowchart);
  return terminals;
}

/**
 * Compose two formula mappings (Kleisli composition of payload maps).
 *
 * If inner maps { a: "{x} + {y}" } and outer maps { b: "{a} * 2" },
 * the composed result maps { b: "({x} + {y}) * 2" }.
 *
 * CATEGORICAL NOTE: This is Kleisli composition. If:
 *   - inner: A → B (maps A's fields to B's fields via formulas)
 *   - outer: B → C (maps B's fields to C's fields via formulas)
 * Then composed: A → C (directly maps A to C by substitution).
 *
 * This is used when resolving payload flow through elaboration chains:
 * terminal outcome's payloadMapping composes with parent outcome's bind.
 *
 * @param inner - The first mapping (applied first), e.g., payloadMapping from child
 * @param outer - The second mapping (applied second), e.g., bind from parent outcome
 * @returns Composed mapping where outer's variable references are substituted with inner's formulas
 */
function composeFormulas(inner, outer) {
  if (!outer) return inner || {};
  if (!inner) return outer;

  const composed = {};

  for (const [targetField, outerFormula] of Object.entries(outer)) {
    // Substitute each {var} in outerFormula with inner[var] if it exists
    let result = outerFormula;
    const varMatches = outerFormula.match(/\{([^}]+)\}/g) || [];

    for (const match of varMatches) {
      const varName = match.slice(1, -1);
      if (inner[varName]) {
        // Wrap inner formula in parens for safety in arithmetic
        const innerFormula = inner[varName];
        const needsParens = /[+\-*/]/.test(innerFormula) && /[+\-*/]/.test(result);
        const replacement = needsParens ? `(${innerFormula})` : innerFormula;
        result = result.replace(match, replacement);
      }
    }

    composed[targetField] = result;
  }

  return composed;
}

/**
 * Given a terminal outcome deep in a childFlowchart, resolve the chain:
 *   terminal outcome → mapsTo parent outcome → parent outcome's next → receiver task
 *
 * This follows the elaboration hierarchy upward until we find an outcome
 * that has a `next` pointing to an actual task (not another mapsTo).
 *
 * CATEGORICAL NOTE: This implements the resolution step of monad multiplication.
 * A terminal outcome's `mapsTo` is part of a Kleisli map specification:
 *   1·y^B → free_p
 * where B is the parent's outcomes. The mapsTo tells us which parent outcome
 * this terminal corresponds to, and we follow the chain until we find a
 * concrete receiver task (polynomial composition edge).
 *
 * The payloadMapping formulas are composed via Kleisli composition as we
 * traverse upward, resulting in a direct payload map from the deep terminal
 * to the ultimate receiver task.
 *
 * @param terminalOutcome - The terminal outcome (has mapsTo, no next)
 * @param _senderTask - The task containing this terminal outcome (unused but kept for API)
 * @param elaborationContext - Stack of { task, parentTask } representing elaboration ancestors
 * @returns { receiverTaskId, composedBind } or null if this is a true terminal (maps to root outcome)
 */
function resolveOutcomeChain(terminalOutcome, _senderTask, elaborationContext) {
  if (!terminalOutcome.mapsTo) {
    // True terminal - no mapping, this is an endpoint
    return null;
  }

  // Start with the payloadMapping from this terminal outcome
  let composedMapping = terminalOutcome.payloadMapping || {};

  // Walk up the elaboration hierarchy
  for (let i = elaborationContext.length - 1; i >= 0; i--) {
    const { task: elaboratedTask } = elaborationContext[i];

    // Find the parent outcome that this maps to
    const parentOutcome = (elaboratedTask.outcomes || []).find(
      o => o.id === (i === elaborationContext.length - 1 ? terminalOutcome.mapsTo : currentMapsTo)
    );

    if (!parentOutcome) {
      return null;
    }

    // Compose the payloadMapping
    if (parentOutcome.payloadMapping) {
      composedMapping = composeFormulas(composedMapping, parentOutcome.payloadMapping);
    }

    // Check if this parent outcome has a next (receiver task)
    const normalized = normalizeNext(parentOutcome.next);
    if (normalized) {
      // Found a receiver! Compose the bind with our accumulated mapping
      const composedBind = composeFormulas(composedMapping, normalized.bind || {});
      return {
        receiverTaskId: normalized.task,
        composedBind,
        // Include the path for debugging
        chainLength: elaborationContext.length - i,
      };
    }

    // This parent outcome also maps up - continue the chain
    var currentMapsTo = parentOutcome.mapsTo;
    if (!currentMapsTo) {
      // Parent outcome is terminal with no mapping - true endpoint
      return null;
    }
  }

  // Walked all the way up - this maps to a root-level terminal outcome
  return null;
}

/**
 * Build a complete map of all tasks in the flowchart, including those in childFlowcharts.
 * Each entry includes the elaboration context (stack of ancestor elaborations).
 *
 * CATEGORICAL NOTE: This indexes all monomials in the free_p tree, preserving the
 * elaboration hierarchy as context. The elaborationContext stack represents the
 * path through the tree-of-trees structure, needed for resolving mapsTo chains.
 *
 * This is preparation for the μ operation (monad multiplication) - we need to
 * know each task's position in the nested structure to correctly compose formulas.
 *
 * @param flowchart - The root flowchart (element of free_p)
 * @returns Map of taskId → { task, elaborationContext, containingFlowchartId }
 */
function buildTaskMap(flowchart) {
  const taskMap = new Map();

  function walk(node, elaborationContext = [], containingFlowchartId = null) {
    taskMap.set(node.id, {
      task: node,
      elaborationContext: [...elaborationContext],
      containingFlowchartId,
    });

    // Walk sender-direction children (same flowchart level)
    for (const child of node.children || []) {
      walk(child, elaborationContext, containingFlowchartId);
    }

    // Walk elaboration-direction child (childFlowchart)
    if (node.childFlowchart) {
      const newContext = [...elaborationContext, { task: node, parentTask: null }];
      walk(node.childFlowchart, newContext, node.id);
    }
  }

  walk(flowchart, [], null);
  return taskMap;
}

/**
 * Flatten the nested flowchart structure into a single-level flowchart.
 * This is the "exploded" view - all tasks become siblings, and edges
 * from terminal outcomes are resolved through the mapsTo chain.
 *
 * CATEGORICAL NOTE: This is the monad multiplication μ: free_{free_p} → free_p
 *
 * The input (nested structure) is an element of free_{free_p} - a tree where
 * some nodes contain entire sub-trees (childFlowcharts).
 *
 * The output is an element of free_p - a single flattened tree where:
 *   - All tasks from all levels become siblings
 *   - Terminal outcomes with mapsTo are resolved to their ultimate receivers
 *   - Payload formulas are composed via Kleisli composition
 *
 * The nested and exploded views represent the SAME flowchart - μ is an
 * isomorphism at the level of execution semantics. The cooperad structure
 * ensures this flattening is well-defined and associative.
 *
 * @param flowchart - The root flowchart with nested elaborations (free_{free_p} element)
 * @returns { tasks: Task[], edges: Edge[] } - Flat representation (free_p element)
 */
export function explodeFlowchart(flowchart) {
  if (!flowchart) return { tasks: [], edges: [] };

  const tasks = [];
  const edges = [];
  const taskMap = buildTaskMap(flowchart);

  // Collect all tasks (flattened)
  for (const [taskId, { task, elaborationContext }] of taskMap) {
    tasks.push({
      id: taskId,
      label: task.label,
      fields: task.fields || null,
      outcomes: task.outcomes || [],
      // Track depth for potential styling
      elaborationDepth: elaborationContext.length,
      // Track if this task is elaborated (has its own childFlowchart)
      isElaborated: !!task.childFlowchart,
    });
  }

  // Build edges - this is where the magic happens
  for (const [taskId, { task, elaborationContext }] of taskMap) {
    for (const outcome of task.outcomes || []) {
      const normalized = normalizeNext(outcome.next);

      if (normalized) {
        // Regular edge within same flowchart level
        edges.push({
          id: `${taskId}:${outcome.id}->${normalized.task}`,
          sourceTaskId: taskId,
          sourceOutcomeId: outcome.id,
          targetTaskId: normalized.task,
          bind: normalized.bind || null,
          // Flag as same-level edge
          crossLevel: false,
        });
      } else if (outcome.mapsTo) {
        // Terminal outcome - need to resolve the chain
        const resolved = resolveOutcomeChain(outcome, task, elaborationContext);

        if (resolved) {
          edges.push({
            id: `${taskId}:${outcome.id}->>${resolved.receiverTaskId}`,
            sourceTaskId: taskId,
            sourceOutcomeId: outcome.id,
            targetTaskId: resolved.receiverTaskId,
            bind: resolved.composedBind,
            // Flag as cross-level edge (resolved through mapsTo chain)
            crossLevel: true,
            chainLength: resolved.chainLength,
          });
        }
        // If resolved is null, this is a true terminal (maps to root outcome)
      }
      // Outcomes with neither next nor mapsTo are true terminals at root level
    }
  }

  return { tasks, edges };
}
