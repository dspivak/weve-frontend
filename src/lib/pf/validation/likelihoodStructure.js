/**
 * Likelihood Structure Validation (p/rand)
 *
 * Validates the Kan residual p/rand structure on outcomes.
 * Likelihoods are optional — but when present, they must form
 * a valid probability distribution (integers summing to 100).
 *
 * Invariants:
 *   L1: Each likelihood is an integer in [0, 100]
 *   L2: All likelihoods for a task's outcomes sum to 100
 *   L3: If any outcome has likelihood, ALL outcomes must (no partial distributions)
 */

import { ErrorCode, createError, createResult } from './types.js';

/**
 * Validate likelihood structure for a single task's outcomes.
 * Returns a ValidationResult.
 *
 * @param {Array<{id: string, label: string, likelihood?: number}>} outcomes
 * @param {string} taskId
 * @param {string} taskLabel
 * @returns {import('./types.js').ValidationResult}
 */
function validateTaskLikelihoods(outcomes, taskId, taskLabel) {
  const result = createResult();

  if (!outcomes || outcomes.length === 0) return result;

  const withLikelihood = outcomes.filter(o => o.likelihood != null);
  const withoutLikelihood = outcomes.filter(o => o.likelihood == null);

  // No likelihoods at all — valid (likelihoods are optional)
  if (withLikelihood.length === 0) return result;

  // L3: All-or-nothing — some but not all have likelihood
  if (withoutLikelihood.length > 0) {
    result.valid = false;
    result.errors.push(createError(
      ErrorCode.LIKELIHOOD_PARTIAL,
      `Task "${taskLabel}" (${taskId}): ${withLikelihood.length} of ${outcomes.length} outcomes have likelihood — must be all or none`,
      { taskId, taskLabel }
    ));
    return result; // No point checking L1/L2 if partial
  }

  // L1: Each likelihood in range [0, 100] and is integer
  for (const o of withLikelihood) {
    if (!Number.isInteger(o.likelihood) || o.likelihood < 0 || o.likelihood > 100) {
      result.valid = false;
      result.errors.push(createError(
        ErrorCode.LIKELIHOOD_OUT_OF_RANGE,
        `Task "${taskLabel}" (${taskId}), outcome "${o.id}": likelihood ${o.likelihood} is not an integer in [0, 100]`,
        { taskId, taskLabel, outcomeId: o.id }
      ));
    }
  }

  // L2: Likelihoods sum to 100
  const sum = withLikelihood.reduce((s, o) => s + o.likelihood, 0);
  if (sum !== 100) {
    result.valid = false;
    result.errors.push(createError(
      ErrorCode.LIKELIHOOD_SUM_MISMATCH,
      `Task "${taskLabel}" (${taskId}): outcome likelihoods sum to ${sum}, expected 100`,
      { taskId, taskLabel, actualSum: sum }
    ));
  }

  return result;
}

/**
 * Validate likelihood structure across an entire flowchart tree.
 * Walks all tasks recursively.
 *
 * @param {Object} flowchart - A TaskNode (root of full flowchart)
 * @returns {import('./types.js').ValidationResult}
 */
export function validateLikelihoodStructure(flowchart) {
  const result = createResult();

  if (!flowchart) return result;

  function walkTask(task) {
    if (!task) return;

    const taskResult = validateTaskLikelihoods(
      task.outcomes || [],
      task.id,
      task.label
    );
    if (!taskResult.valid) {
      result.valid = false;
      result.errors.push(...taskResult.errors);
    }
    result.warnings.push(...taskResult.warnings);

    // Walk children
    if (task.children) {
      for (const child of task.children) {
        walkTask(child);
      }
    }

    // Walk childFlowchart (elaboration)
    if (task.childFlowchart) {
      walkTask(task.childFlowchart);
    }
  }

  walkTask(flowchart);
  return result;
}
