/**
 * Pointed Structure Validation (free_{p_*})
 *
 * Validates that a flowchart is a valid element of free_{p_*}:
 * - Every task has a valid chosenOutcome
 * - The chosen path is well-defined from root to terminal
 *
 * CATEGORICAL BASIS:
 * A pointed polynomial p_* = A×B · y^B adds a "chosen direction" to each task.
 * The position type changes from A to A×B - we have both the fields AND
 * a designated outcome.
 *
 * For the recipe (chosen path) to be well-defined:
 * - chosenOutcome must exist and reference a valid outcome
 * - Following chosenOutcome from root must reach a terminal
 *
 * INVARIANTS ENFORCED (see docs/CT_INVARIANTS.md):
 * - Invariant 5: chosenOutcome requires outcomes (y^0)_* = 0
 * - Invariant 6: chosenOutcome must reference valid outcome ID
 * - Invariant 7: Coherence triangle for childFlowchart
 */

import { ErrorCode, createError, createResult } from './types.js';

/**
 * Validate pointed structure of a flowchart
 *
 * @param {Object} flowchart - Root of the flowchart
 * @param {Object} options - Validation options
 * @returns {ValidationResult}
 */
export function validatePointedStructure(flowchart, options = {}) {
  const result = createResult();

  if (!flowchart) {
    return result; // Empty is valid for pointed (just no recipe)
  }

  // Validate each node has valid chosenOutcome
  validateNodePointing(flowchart, result, []);

  // Validate the chosen path is complete
  validateChosenPath(flowchart, result);

  result.valid = result.errors.length === 0;
  return result;
}

/**
 * Validate chosenOutcome at each node
 *
 * CATEGORICAL BASIS:
 * - p_* = A×B · y^B requires choosing an element of B
 * - If B = ∅ (no outcomes), then (y^0)_* = 0 - the task vanishes under pointing
 * - So: chosenOutcome can only exist if outcomes exist
 */
function validateNodePointing(node, result, path) {
  const currentPath = [...path, node.label || node.id];
  const outcomes = node.outcomes || [];

  // Invariant 5: chosenOutcome requires outcomes (because (y^0)_* = 0)
  // Note: Empty outcomes (y^0) are not checked here as a standalone invariant.
  // Non-emptiness is a CONSEQUENCE of p/rand: Dist(0) = ∅, so L2 (sum to 100)
  // is unsatisfiable for empty outcome sets. The evaluator LLM ensures every
  // task gets outcomes with a valid distribution.
  // CT basis: Constants vanish under pointing - can't choose from empty set
  if (node.chosenOutcome && outcomes.length === 0) {
    result.errors.push(createError(
      ErrorCode.INVALID_CHOSEN_OUTCOME,
      `Task "${node.label}" has chosenOutcome "${node.chosenOutcome}" but no outcomes to choose from. In CT terms: (y^0)_* = 0, constants vanish under pointing.`,
      { taskId: node.id, taskLabel: node.label, chosenOutcome: node.chosenOutcome }
    ));
  }

  // CHECK 2: If task has outcomes but no chosenOutcome, warn (recipe ends here)
  if (outcomes.length > 0 && !node.chosenOutcome) {
    result.warnings.push(createError(
      ErrorCode.MISSING_CHOSEN_OUTCOME,
      `Task "${node.label}" has outcomes but no chosenOutcome. Recipe path will end here.`,
      { taskId: node.id, taskLabel: node.label, path: currentPath.join(' → ') }
    ));
  }

  // Invariant 6: chosenOutcome must reference a valid outcome ID
  // CT basis: p_* position type is A×B, so chosen element must be in B
  if (node.chosenOutcome && outcomes.length > 0) {
    const validOutcome = outcomes.find(o => o.id === node.chosenOutcome);
    if (!validOutcome) {
      result.errors.push(createError(
        ErrorCode.INVALID_CHOSEN_OUTCOME,
        `Task "${node.label}" has chosenOutcome "${node.chosenOutcome}" but no matching outcome exists. Valid outcomes: [${outcomes.map(o => o.id).join(', ')}]`,
        { taskId: node.id, taskLabel: node.label, chosenOutcome: node.chosenOutcome, validOutcomes: outcomes.map(o => o.id) }
      ));
    }
  }

  // Recurse into children
  for (const child of (node.children || [])) {
    validateNodePointing(child, result, currentPath);
  }

  // Recurse into childFlowchart
  if (node.childFlowchart) {
    validateNodePointing(node.childFlowchart, result, currentPath);

    // Invariant 7: Coherence triangle - chosen path through childFlowchart
    // must map to parent's chosenOutcome
    if (node.chosenOutcome) {
      validateCoherence(node, result, currentPath);
    }
  }
}

/**
 * Invariant 7: Coherence Triangle Validation
 *
 * When a task has both chosenOutcome and childFlowchart, following the
 * chosen path through the childFlowchart to a terminal must yield:
 *   terminal.mapsTo === task.chosenOutcome
 *
 * This ensures the elaboration (childFlowchart) is coherent with the
 * parent's chosen direction.
 */
function validateCoherence(node, result, path) {
  const childFlowchart = node.childFlowchart;
  if (!childFlowchart) return;

  // Follow the chosen path through childFlowchart to find terminal
  const terminalOutcome = followChosenPathToTerminal(childFlowchart);

  if (!terminalOutcome) {
    // No terminal reached - this might be a warning but not necessarily a coherence error
    // Could be incomplete childFlowchart
    return;
  }

  // Check if terminal's mapsTo matches parent's chosenOutcome
  if (terminalOutcome.mapsTo !== node.chosenOutcome) {
    result.errors.push(createError(
      ErrorCode.COHERENCE_MISMATCH,
      `Coherence violation: Task "${node.label}" has chosenOutcome "${node.chosenOutcome}" but childFlowchart's terminal maps to "${terminalOutcome.mapsTo}". The triangle must commute.`,
      {
        taskId: node.id,
        taskLabel: node.label,
        chosenOutcome: node.chosenOutcome,
        terminalMapsTo: terminalOutcome.mapsTo,
        path: path.join(' → ')
      }
    ));
  }
}

/**
 * Follow the chosen path through a flowchart to find the terminal outcome
 * Returns the terminal outcome or null if path doesn't complete
 */
function followChosenPathToTerminal(flowchart) {
  let current = flowchart;
  let siblings = flowchart.children || [];
  const visited = new Set();

  while (current) {
    // Cycle detection
    if (visited.has(current.id)) return null;
    visited.add(current.id);

    const outcomes = current.outcomes || [];
    if (outcomes.length === 0) return null; // Dead end

    if (!current.chosenOutcome) return null; // No chosen outcome

    const chosenOutcome = outcomes.find(o => o.id === current.chosenOutcome);
    if (!chosenOutcome) return null; // Invalid chosen outcome

    if (!chosenOutcome.next) {
      // Terminal - return this outcome
      return chosenOutcome;
    }

    // Follow to next task (children first, then siblings)
    const nextTaskId = typeof chosenOutcome.next === 'string'
      ? chosenOutcome.next
      : chosenOutcome.next.task;

    const currentChildren = current.children || [];
    let nextTask = currentChildren.find(c => c.id === nextTaskId);

    if (!nextTask) {
      nextTask = siblings.find(c => c.id === nextTaskId);
    }

    if (currentChildren.find(c => c.id === nextTaskId)) {
      siblings = currentChildren;
    }

    current = nextTask;
  }

  return null;
}

/**
 * Validate that the chosen path is complete (reaches a terminal)
 *
 * Note: In PF flowchart structure, siblings are stored in parent.children
 * and can point to each other. We need to track siblings when following the path.
 */
function validateChosenPath(flowchart, result) {
  const path = [];
  let current = flowchart;
  let siblings = flowchart.children || []; // Start with root's children as potential targets
  const visited = new Set();

  while (current) {
    // Cycle detection
    if (visited.has(current.id)) {
      result.errors.push(createError(
        ErrorCode.COHERENCE_MISMATCH,
        `Chosen path contains a cycle at task "${current.label}". Recipe cannot complete.`,
        { taskId: current.id, path: path.map(p => p.label).join(' → ') }
      ));
      return;
    }
    visited.add(current.id);
    path.push(current);

    const outcomes = current.outcomes || [];
    if (outcomes.length === 0) {
      // No outcomes - path ends (y^0 dead end)
      break;
    }

    if (!current.chosenOutcome) {
      // No chosen outcome - path ends here
      break;
    }

    const chosenOutcome = outcomes.find(o => o.id === current.chosenOutcome);
    if (!chosenOutcome) {
      // Invalid chosen outcome - already reported in validateNodePointing
      break;
    }

    if (!chosenOutcome.next) {
      // Terminal outcome - path complete
      result.stats.recipeLength = path.length;
      return;
    }

    // Follow to next task
    const nextTaskId = typeof chosenOutcome.next === 'string'
      ? chosenOutcome.next
      : chosenOutcome.next.task;

    // Look for next task in: current's children OR siblings
    const currentChildren = current.children || [];
    let nextTask = currentChildren.find(c => c.id === nextTaskId);

    if (!nextTask) {
      // Try siblings
      nextTask = siblings.find(c => c.id === nextTaskId);
    }

    if (!nextTask) {
      result.errors.push(createError(
        ErrorCode.INVALID_NEXT_TARGET,
        `Chosen path broken: task "${current.label}" chosenOutcome points to "${nextTaskId}" but task not found.`,
        { taskId: current.id, targetId: nextTaskId }
      ));
      break;
    }

    // Update siblings context for next iteration
    // If we went into a child, siblings are now current's children
    // If we went to a sibling, siblings stay the same
    if (currentChildren.find(c => c.id === nextTaskId)) {
      siblings = currentChildren;
    }

    current = nextTask;
  }

  result.stats.recipeLength = path.length;
}

/**
 * Extract the recipe path from a flowchart
 * Returns the sequence of tasks following chosenOutcome
 *
 * @param {Object} flowchart
 * @returns {{ tasks: Array, complete: boolean, terminalOutcome: Object|null }}
 */
export function extractRecipePath(flowchart) {
  const tasks = [];
  let current = flowchart;
  let siblings = flowchart?.children || [];
  let terminalOutcome = null;

  while (current) {
    const outcomes = current.outcomes || [];
    const chosenOutcome = current.chosenOutcome
      ? outcomes.find(o => o.id === current.chosenOutcome)
      : null;

    tasks.push({ task: current, chosenOutcome });

    if (!chosenOutcome || !chosenOutcome.next) {
      terminalOutcome = chosenOutcome;
      break;
    }

    const nextTaskId = typeof chosenOutcome.next === 'string'
      ? chosenOutcome.next
      : chosenOutcome.next.task;

    const currentChildren = current.children || [];
    let nextTask = currentChildren.find(c => c.id === nextTaskId);

    if (!nextTask) {
      nextTask = siblings.find(c => c.id === nextTaskId);
    }

    if (currentChildren.find(c => c.id === nextTaskId)) {
      siblings = currentChildren;
    }

    current = nextTask;
  }

  return {
    tasks,
    complete: terminalOutcome !== null && terminalOutcome.next === null,
    terminalOutcome
  };
}

/**
 * Count total tasks in the tree (for comparison with recipe length)
 */
export function countTotalTasks(flowchart) {
  if (!flowchart) return 0;

  let count = 1; // Count this node
  for (const child of (flowchart.children || [])) {
    count += countTotalTasks(child);
  }
  if (flowchart.childFlowchart) {
    count += countTotalTasks(flowchart.childFlowchart);
  }
  return count;
}

/**
 * Validate recipe completeness - recipe should cover all sequential tasks
 * This catches the case where recipe has fewer steps than the flowchart
 */
export function validateRecipeCompleteness(flowchart) {
  const result = createResult();

  if (!flowchart) return result;

  const { tasks: recipeTasks, complete } = extractRecipePath(flowchart);
  const recipeLength = recipeTasks.length;

  // Count children at root level (the main sequence)
  const mainSequenceLength = 1 + (flowchart.children?.length || 0);

  // For a simple sequential flowchart, recipe should cover all tasks
  // Recipe length should be: root + all children in sequence
  if (recipeLength < mainSequenceLength) {
    result.warnings.push(createError(
      ErrorCode.MISSING_CHOSEN_OUTCOME,
      `Recipe path has ${recipeLength} steps but flowchart has ${mainSequenceLength} tasks in main sequence. Some tasks may not have chosenOutcome or connections.`,
      { recipeLength, mainSequenceLength }
    ));
  }

  if (!complete) {
    result.warnings.push(createError(
      ErrorCode.MISSING_CHOSEN_OUTCOME,
      `Recipe path does not reach a terminal outcome. The path ends prematurely.`,
      { recipeLength }
    ));
  }

  result.valid = result.errors.length === 0;
  return result;
}
