/**
 * Flowchart Validation Module
 *
 * Central entry point for all flowchart validation.
 * Validates that flowcharts conform to the categorical structure.
 *
 * VALIDATION LEVELS:
 * - 'tree': Basic free_p structure (required for diagram view)
 * - 'pointed': Recipe requirements (required for recipe view)
 * - 'full': All checks including coherence (required for export)
 *
 * CALL SITES:
 * - localStorage load: validate + repair
 * - LLM extraction: validate before applying
 * - View switch: validate before showing
 * - Export/save: validate before persisting
 *
 * See docs/VALIDATION_SPEC.md for the mapping from category theory to checks.
 */

import { ValidationLevel, mergeResults, createResult } from './types.js';
import { validateTreeStructure, repairTreeStructure, hasValidTreeStructure, validateScope, extractVariables } from './treeStructure.js';
import { validatePointedStructure, validateRecipeCompleteness, extractRecipePath, countTotalTasks } from './pointedStructure.js';
import { validateLikelihoodStructure } from './likelihoodStructure.js';

// Re-export types and utilities
export { ErrorCode, ValidationLevel, createError, createResult } from './types.js';
export { repairTreeStructure, hasValidTreeStructure, validateScope, extractVariables } from './treeStructure.js';
export { extractRecipePath, countTotalTasks } from './pointedStructure.js';
export { validateLikelihoodStructure } from './likelihoodStructure.js';

/**
 * Main validation entry point
 *
 * @param {Object} flowchart - The flowchart to validate
 * @param {Object} options - Validation options
 * @param {string} options.level - Validation level: 'tree', 'pointed', or 'full'
 * @param {boolean} options.strict - If true, warnings become errors
 * @returns {ValidationResult}
 */
export function validateFlowchart(flowchart, options = {}) {
  const { level = ValidationLevel.FULL, strict = false } = options;

  if (!flowchart) {
    return createResult(); // Empty is valid
  }

  const results = [];

  // Level 1: Tree structure (always run)
  const treeResult = validateTreeStructure(flowchart);
  results.push(treeResult);

  // Level 2: Pointed structure (if level >= pointed)
  if (level === ValidationLevel.POINTED || level === ValidationLevel.FULL) {
    const pointedResult = validatePointedStructure(flowchart);
    results.push(pointedResult);

    // Also check recipe completeness
    const completenessResult = validateRecipeCompleteness(flowchart);
    results.push(completenessResult);
  }

  // Level 3: Full checks including scope (if level === full)
  // Note: mapsTo (Invariants 3,4) and coherence (Invariant 7) are now checked
  // in treeStructure and pointedStructure respectively
  if (level === ValidationLevel.FULL) {
    // Scope validation (Invariants 9, 10, 11)
    const scopeResult = validateScope(flowchart);
    results.push(scopeResult);

    // Likelihood validation (Invariants L1, L2, L3 — p/rand structure)
    const likelihoodResult = validateLikelihoodStructure(flowchart);
    results.push(likelihoodResult);
  }

  // Merge all results
  const merged = mergeResults(...results);

  // In strict mode, promote warnings to errors
  if (strict) {
    merged.errors.push(...merged.warnings);
    merged.warnings = [];
    merged.valid = merged.errors.length === 0;
  }

  return merged;
}

/**
 * Validate and repair a flowchart
 * Returns a valid flowchart or null if unrepairable
 *
 * @param {Object} flowchart
 * @param {Object} options
 * @returns {{ flowchart: Object|null, result: ValidationResult, repairs: string[] }}
 */
export function validateAndRepair(flowchart, options = {}) {
  if (!flowchart) {
    return { flowchart: null, result: createResult(), repairs: [] };
  }

  // First validation
  const initialResult = validateFlowchart(flowchart, options);

  if (initialResult.valid) {
    return { flowchart, result: initialResult, repairs: [] };
  }

  // Attempt repair
  const { repaired, repairs } = repairTreeStructure(flowchart);

  // Validate again after repair
  const repairedResult = validateFlowchart(repaired, options);

  return { flowchart: repaired, result: repairedResult, repairs };
}

/**
 * Quick validation for specific purposes
 */

/**
 * Can this flowchart be shown in diagram view?
 * Requires valid tree structure.
 */
export function canShowDiagram(flowchart) {
  const result = validateFlowchart(flowchart, { level: ValidationLevel.TREE });
  return result.valid;
}

/**
 * Can this flowchart be shown in recipe view?
 * Requires valid tree + pointed structure.
 */
export function canShowRecipe(flowchart) {
  const result = validateFlowchart(flowchart, { level: ValidationLevel.POINTED });
  // Recipe view can show partial recipes, so only check for errors, not warnings
  return result.valid;
}

/**
 * Is this flowchart ready for export/publish?
 * Requires full validation with no warnings.
 */
export function canExport(flowchart) {
  const result = validateFlowchart(flowchart, { level: ValidationLevel.FULL, strict: true });
  return result.valid;
}

/**
 * Log validation results (no-op in production)
 */
export function logValidationResult(result, label = 'Validation') {
  // Intentionally empty in production
}
