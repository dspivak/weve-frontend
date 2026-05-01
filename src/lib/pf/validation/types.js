/**
 * Validation Types and Error Codes
 *
 * TRACEABILITY RULE:
 * Every ErrorCode must complete this chain before it can exist:
 *
 *   CATEGORY_THEORY.md definition  (the math)
 *           ↓ cites
 *   CT_INVARIANTS.md invariant     (the derived check)
 *           ↓ implements
 *   types.js ErrorCode             (this file)
 *           ↓ tests
 *   tests.js test case             (the verification)
 *
 * If you cannot cite a specific definition in CATEGORY_THEORY.md, the
 * ErrorCode is illegitimate. Operational concerns ("what if X is empty?")
 * are not valid justifications — only categorical structure is.
 *
 * Properties that FOLLOW from the math (theorems/corollaries) should not
 * get their own ErrorCode. They are already enforced by the checks on the
 * definitions they follow from.
 *
 * Example: "outcomes must be non-empty" is NOT a valid ErrorCode because
 * non-emptiness is a corollary of p/rand (Dist(0) = ∅). It's enforced
 * by L2 (likelihoods sum to 100), which IS a valid check on Dist(N).
 *
 * A meta-test in tests.js verifies that every ErrorCode here appears in
 * CT_INVARIANTS.md. This makes the traceability chain mechanically checked.
 */

// Error codes with categorical meaning
// Each code must have a corresponding entry in docs/CT_INVARIANTS.md
export const ErrorCode = {
  // free_p tree structure violations
  INVALID_NEXT_TARGET: 'INVALID_NEXT_TARGET', // Polynomial composition: next.task doesn't exist
  ORPHANED_TASK: 'ORPHANED_TASK',             // Task not reachable via any outcome.next
  MISSING_ROOT: 'MISSING_ROOT',               // No root node

  // Pointed polynomial (p_*) violations
  INVALID_CHOSEN_OUTCOME: 'INVALID_CHOSEN_OUTCOME', // chosenOutcome invalid or on y^0 task
  MISSING_CHOSEN_OUTCOME: 'MISSING_CHOSEN_OUTCOME', // No chosenOutcome (recipe ends here)

  // Kleisli map violations
  INVALID_MAPS_TO: 'INVALID_MAPS_TO',         // mapsTo points to non-existent outcome
  MISSING_MAPS_TO: 'MISSING_MAPS_TO',         // Terminal outcome without mapsTo

  // Coherence violations
  COHERENCE_MISMATCH: 'COHERENCE_MISMATCH',   // Triangle doesn't commute

  // Scope/binding violations
  INVALID_BIND_SCOPE: 'INVALID_BIND_SCOPE',   // bind formula references out-of-scope var
  INVALID_PAYLOAD_MAPPING_SCOPE: 'INVALID_PAYLOAD_MAPPING_SCOPE', // payloadMapping out of scope

  // Likelihood (p/rand) violations
  LIKELIHOOD_OUT_OF_RANGE: 'LIKELIHOOD_OUT_OF_RANGE',   // likelihood not integer in [0, 100]
  LIKELIHOOD_SUM_MISMATCH: 'LIKELIHOOD_SUM_MISMATCH',   // likelihoods don't sum to 100
  LIKELIHOOD_PARTIAL: 'LIKELIHOOD_PARTIAL',               // some but not all outcomes have likelihood
};

// Validation levels - what to check
export const ValidationLevel = {
  TREE: 'tree',           // Basic free_p structure (connectivity)
  POINTED: 'pointed',     // Recipe requirements (chosenOutcome)
  FULL: 'full',           // All checks including coherence
};

/**
 * @typedef {Object} ValidationError
 * @property {string} code - ErrorCode value
 * @property {string} message - Human-readable description
 * @property {string} [taskId] - ID of task with the error
 * @property {string} [taskLabel] - Label of task for display
 * @property {string} [path] - Path through tree to the error
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - True if all checks passed
 * @property {ValidationError[]} errors - List of errors found
 * @property {ValidationError[]} warnings - Non-fatal issues
 * @property {Object} stats - Validation statistics
 */

/**
 * Create a validation error
 */
export function createError(code, message, details = {}) {
  return { code, message, ...details };
}

/**
 * Create an empty validation result
 */
export function createResult() {
  return {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      tasksChecked: 0,
      outcomesChecked: 0,
    }
  };
}

/**
 * Merge multiple validation results
 */
export function mergeResults(...results) {
  const merged = createResult();
  for (const r of results) {
    merged.valid = merged.valid && r.valid;
    merged.errors.push(...r.errors);
    merged.warnings.push(...r.warnings);
    merged.stats.tasksChecked += r.stats?.tasksChecked || 0;
    merged.stats.outcomesChecked += r.stats?.outcomesChecked || 0;
  }
  return merged;
}
