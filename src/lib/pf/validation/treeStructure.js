/**
 * Tree Structure Validation (free_p)
 *
 * Validates that a flowchart is a valid element of free_p:
 * - Well-founded tree structure
 * - All outcome.next pointers are valid
 * - All children are reachable via some outcome.next
 *
 * CATEGORICAL BASIS:
 * An element of free_p is a well-founded tree where:
 * - Internal nodes are p-tasks (monomials A·y^B)
 * - Each edge is labeled with a direction from B
 * - Leaves are terminal states (outcomes with next: null)
 *
 * Note: y^0 (task with outcomes: []) is structurally valid in bare free_p,
 * but invalid in free_{p_*} or free_{p/rand} because you can't point at or
 * distribute over the empty set. The POINTED validation level catches this.
 *
 * INVARIANTS ENFORCED (see docs/CT_INVARIANTS.md):
 * - Invariant 1: outcome.next.task must reference an existing task
 * - Invariant 2: Every child must be reachable via some outcome.next
 * - Invariant 3: Terminal outcomes in childFlowchart must have mapsTo
 * - Invariant 4: mapsTo must reference valid parent outcome
 * - Invariant 9: bind formulas must reference in-scope variables
 * - Invariant 10: payloadMapping must reference in-scope variables
 * - Invariant 11: Label variables must be in scope (fields or payload)
 */

import { ErrorCode, createError, createResult } from './types.js';

/**
 * Validate tree structure of a flowchart
 *
 * @param {Object} flowchart - Root of the flowchart
 * @param {Object} options - Validation options
 * @returns {ValidationResult}
 */
export function validateTreeStructure(flowchart, options = {}) {
  const result = createResult();

  if (!flowchart) {
    result.errors.push(createError(
      ErrorCode.MISSING_ROOT,
      'Flowchart is null or undefined'
    ));
    result.valid = false;
    return result;
  }

  // Validate recursively
  validateNode(flowchart, result, [], options);

  result.valid = result.errors.length === 0;
  return result;
}

/**
 * Validate a single node and its children
 *
 * Note: In the flowchart structure, children are siblings that can point to each other.
 * outcome.next can reference either a direct child OR a sibling.
 *
 * @param {Object} node - Current node to validate
 * @param {Object} result - Validation result accumulator
 * @param {Array} path - Path from root to current node
 * @param {Object} options - Validation options
 * @param {Set} siblingIds - IDs of sibling nodes (for cross-references)
 * @param {Array} parentOutcomeIds - Valid outcome IDs from parent (for mapsTo validation)
 */
function validateNode(node, result, path, options, siblingIds = new Set(), parentOutcomeIds = null) {
  const currentPath = [...path, node.label || node.id];
  result.stats.tasksChecked++;

  const children = node.children || [];
  const childIds = new Set(children.map(c => c.id));
  const outcomes = node.outcomes || [];

  // Valid targets for outcome.next: direct children OR siblings
  const validTargets = new Set([...childIds, ...siblingIds]);

  // Note: outcomes: [] is structurally valid in free_p (y^0 = dead end)
  // but invalid in p_* and p/rand — caught at POINTED validation level

  // Track which children are reachable from THIS node's outcomes
  const reachableFromThis = new Set();

  // Invariant 1: All outcome.next pointers must reference existing tasks
  // CT basis: Polynomial composition requires valid sender→receiver connection
  for (const outcome of outcomes) {
    result.stats.outcomesChecked++;

    if (outcome.next) {
      const nextTaskId = typeof outcome.next === 'string'
        ? outcome.next
        : outcome.next.task;

      if (nextTaskId) {
        if (validTargets.has(nextTaskId)) {
          if (childIds.has(nextTaskId)) {
            reachableFromThis.add(nextTaskId);
          }
          // Pointing to sibling is valid (will be tracked by parent)
        } else {
          // Polynomial composition is broken
          result.errors.push(createError(
            ErrorCode.INVALID_NEXT_TARGET,
            `Task "${node.label}" outcome "${outcome.label}" points to non-existent task "${nextTaskId}". This breaks polynomial composition.`,
            { taskId: node.id, taskLabel: node.label, outcomeId: outcome.id, targetId: nextTaskId }
          ));
        }
      }
    } else {
      // outcome.next === null means terminal
      // Invariant 3 & 4: If we're inside a childFlowchart, terminal must have valid mapsTo
      if (parentOutcomeIds !== null) {
        // Invariant 3: Terminal outcomes in childFlowchart must have mapsTo
        if (!outcome.mapsTo) {
          result.errors.push(createError(
            ErrorCode.MISSING_MAPS_TO,
            `Terminal outcome "${outcome.label}" in childFlowchart of "${node.label}" is missing mapsTo. Kleisli map requires all terminals to map back to parent outcomes.`,
            { taskId: node.id, taskLabel: node.label, outcomeId: outcome.id }
          ));
        } else {
          // Invariant 4: mapsTo must reference valid parent outcome
          if (!parentOutcomeIds.includes(outcome.mapsTo)) {
            result.errors.push(createError(
              ErrorCode.INVALID_MAPS_TO,
              `Terminal outcome "${outcome.label}" has mapsTo "${outcome.mapsTo}" but parent only has outcomes: [${parentOutcomeIds.join(', ')}].`,
              { taskId: node.id, taskLabel: node.label, outcomeId: outcome.id, mapsTo: outcome.mapsTo, validOutcomes: parentOutcomeIds }
            ));
          }
        }
      }
    }
  }

  // Invariant 2: All children must be reachable from some outcome (parent or sibling)
  // CT basis: Well-founded tree requires all nodes reachable from root
  // Build set of all tasks reachable from any sibling's outcomes
  const reachableFromSiblings = new Set();
  for (const child of children) {
    for (const outcome of (child.outcomes || [])) {
      if (outcome.next) {
        const nextTaskId = typeof outcome.next === 'string' ? outcome.next : outcome.next.task;
        if (nextTaskId && childIds.has(nextTaskId)) {
          reachableFromSiblings.add(nextTaskId);
        }
      }
    }
  }

  for (const child of children) {
    const isReachable = reachableFromThis.has(child.id) || reachableFromSiblings.has(child.id);
    if (!isReachable) {
      result.errors.push(createError(
        ErrorCode.ORPHANED_TASK,
        `Task "${child.label}" is not reachable from any outcome. Orphaned tasks break the tree structure.`,
        { taskId: child.id, taskLabel: child.label, parentId: node.id }
      ));
    }
  }

  // Recurse into children, passing sibling IDs so they can validate cross-references
  // Also pass parentOutcomeIds through if we're inside a childFlowchart
  for (const child of children) {
    validateNode(child, result, currentPath, options, childIds, parentOutcomeIds);
  }

  // Recurse into childFlowchart (elaboration)
  // Pass parent's outcome IDs for mapsTo validation (Invariants 3, 4)
  if (node.childFlowchart) {
    const parentOutcomes = outcomes.map(o => o.id);
    validateNode(node.childFlowchart, result, currentPath, options, new Set(), parentOutcomes);
  }
}

/**
 * Check if a flowchart has basic tree structure (quick check)
 * Returns true/false without detailed errors
 */
export function hasValidTreeStructure(flowchart) {
  if (!flowchart) return false;
  const result = validateTreeStructure(flowchart);
  return result.valid;
}

/**
 * Attempt to repair a flowchart with broken tree structure
 * Returns a new flowchart with sequential connections added
 *
 * REPAIR STRATEGY:
 * - Tasks with empty outcomes get a default "Continue" or "Done" outcome
 * - Sequential connections are created based on children order
 *
 * @param {Object} flowchart - Flowchart to repair
 * @returns {{ repaired: Object, repairs: string[] }}
 */
export function repairTreeStructure(flowchart) {
  if (!flowchart) return { repaired: null, repairs: [] };

  const repairs = [];

  function repairNode(node, siblings = []) {
    const repaired = { ...node };
    const children = [...(node.children || [])];
    const siblingIds = siblings.map(s => s.id);
    const currentIndex = siblingIds.indexOf(node.id);
    const nextSibling = currentIndex >= 0 && currentIndex < siblings.length - 1
      ? siblings[currentIndex + 1]
      : null;

    // Repair empty outcomes
    if (!repaired.outcomes || repaired.outcomes.length === 0) {
      if (!node._atomicTask) {
        // Add default outcome
        const isLastSibling = !nextSibling;
        repaired.outcomes = [{
          id: isLastSibling ? 'done' : 'continue',
          label: isLastSibling ? 'Done' : 'Continue',
          next: nextSibling ? { task: nextSibling.id } : null
        }];
        repaired.chosenOutcome = repaired.outcomes[0].id;
        repairs.push(`Added default "${repaired.outcomes[0].label}" outcome to "${node.label}"`);
      }
    }

    // Repair children recursively
    if (children.length > 0) {
      repaired.children = children.map((child, idx) =>
        repairNode(child, children)
      );
    }

    // Repair childFlowchart
    if (node.childFlowchart) {
      const { repaired: repairedChild, repairs: childRepairs } = repairTreeStructure(node.childFlowchart);
      repaired.childFlowchart = repairedChild;
      repairs.push(...childRepairs);
    }

    return repaired;
  }

  const repaired = repairNode(flowchart);

  // Also ensure root has proper connections to first child
  if (repaired.children && repaired.children.length > 0) {
    const firstChild = repaired.children[0];
    const successOutcome = (repaired.outcomes || []).find(o => o.id === 'success' || o.label === 'Success');
    if (successOutcome && !successOutcome.next) {
      successOutcome.next = { task: firstChild.id };
      repairs.push(`Connected root "Success" outcome to first task "${firstChild.label}"`);
    }
    if (!repaired.chosenOutcome && repaired.outcomes?.length > 0) {
      repaired.chosenOutcome = repaired.outcomes[0].id;
      repairs.push(`Set root chosenOutcome to "${repaired.outcomes[0].id}"`);
    }
  }

  return { repaired, repairs };
}

// =============================================================================
// Scope Validation (Invariants 9, 10, 11)
// =============================================================================

/**
 * Extract variable references from a string like "Hello {name}, you are {age}"
 * Returns array of variable names: ['name', 'age']
 */
export function extractVariables(str) {
  if (!str || typeof str !== 'string') return [];
  const matches = str.match(/\{([^}]+)\}/g) || [];
  return matches.map(m => m.slice(1, -1)); // Remove { and }
}

/**
 * Validate scope of all formulas in a flowchart
 *
 * Invariant 9: bind formulas must reference variables in scope (outcome payload)
 * Invariant 10: payloadMapping must reference variables in scope (task fields/payload)
 * Invariant 11: Label variables must be in scope (fields for tasks, payload for outcomes)
 *
 * @param {Object} flowchart - Root of the flowchart
 * @returns {ValidationResult}
 */
export function validateScope(flowchart) {
  const result = createResult();

  if (!flowchart) return result;

  validateNodeScope(flowchart, result, []);

  result.valid = result.errors.length === 0;
  return result;
}

/**
 * Validate scope for a single node and recurse
 */
function validateNodeScope(node, result, path) {
  const currentPath = [...path, node.label || node.id];
  const fields = node.fields || {};
  const fieldNames = Object.keys(fields);

  // Invariant 11: Validate label variables are in fields
  const labelVars = extractVariables(node.label);
  for (const varName of labelVars) {
    if (!fieldNames.includes(varName)) {
      result.errors.push(createError(
        ErrorCode.INVALID_BIND_SCOPE, // Reusing error code for scope violations
        `Task "${node.label}" label references "{${varName}}" but no such field exists. Valid fields: [${fieldNames.join(', ')}]`,
        { taskId: node.id, taskLabel: node.label, variable: varName, validFields: fieldNames }
      ));
    }
  }

  // Validate each outcome
  for (const outcome of (node.outcomes || [])) {
    const payload = outcome.payload || {};
    const payloadNames = Object.keys(payload);

    // Invariant 11: Validate outcome label variables are in payload
    const outcomeLabelVars = extractVariables(outcome.label);
    for (const varName of outcomeLabelVars) {
      if (!payloadNames.includes(varName)) {
        result.warnings.push(createError(
          ErrorCode.INVALID_BIND_SCOPE,
          `Outcome "${outcome.label}" label references "{${varName}}" but no such payload field exists. Valid payload: [${payloadNames.join(', ')}]`,
          { taskId: node.id, outcomeId: outcome.id, variable: varName, validPayload: payloadNames }
        ));
      }
    }

    // Invariant 9: Validate bind formulas reference outcome payload
    if (outcome.next && outcome.next.bind) {
      for (const [targetField, formula] of Object.entries(outcome.next.bind)) {
        const bindVars = extractVariables(formula);
        for (const varName of bindVars) {
          // In scope: outcome payload OR ancestor fields (simplified: just payload for now)
          if (!payloadNames.includes(varName) && !fieldNames.includes(varName)) {
            result.errors.push(createError(
              ErrorCode.INVALID_BIND_SCOPE,
              `Outcome "${outcome.label}" bind.${targetField} references "{${varName}}" but it's not in scope. In scope: payload [${payloadNames.join(', ')}], fields [${fieldNames.join(', ')}]`,
              { taskId: node.id, outcomeId: outcome.id, targetField, variable: varName }
            ));
          }
        }
      }
    }

    // Invariant 10: Validate payloadMapping references task fields/payload
    if (outcome.payloadMapping) {
      for (const [targetField, formula] of Object.entries(outcome.payloadMapping)) {
        const mappingVars = extractVariables(formula);
        for (const varName of mappingVars) {
          // In scope: task fields and outcome payload
          if (!fieldNames.includes(varName) && !payloadNames.includes(varName)) {
            result.errors.push(createError(
              ErrorCode.INVALID_PAYLOAD_MAPPING_SCOPE,
              `Outcome "${outcome.label}" payloadMapping.${targetField} references "{${varName}}" but it's not in scope. In scope: fields [${fieldNames.join(', ')}], payload [${payloadNames.join(', ')}]`,
              { taskId: node.id, outcomeId: outcome.id, targetField, variable: varName }
            ));
          }
        }
      }
    }
  }

  // Recurse into children
  for (const child of (node.children || [])) {
    validateNodeScope(child, result, currentPath);
  }

  // Recurse into childFlowchart
  if (node.childFlowchart) {
    validateNodeScope(node.childFlowchart, result, currentPath);
  }
}
