/**
 * CT Validation Bridge — re-exports from existing validation with typed wrappers.
 *
 * The existing validation lives in src/validation/ (JavaScript). Rather than
 * moving those files, this module provides typed imports and adds a new
 * validateConversion() function for the separated outer/inner structure.
 *
 * See docs/VALIDATION_SPEC.md for validation gates.
 * See docs/CT_INVARIANTS.md for the 11 invariants.
 */

import type { ConversionResult } from '../types';

// Re-export from existing validation (JavaScript)
// These provide the core validation functions:
//   validateFlowchart(fc, { level }) → ValidationResult
//   validateAndRepair(fc, { level }) → { flowchart, result, repairs }
//   canShowDiagram(fc) → boolean
//   canShowRecipe(fc) → boolean
// @ts-ignore - JS module without type declarations
export {
  validateFlowchart,
  validateAndRepair,
  canShowDiagram,
  canShowRecipe,
  logValidationResult,
} from '../../validation/index.js';

// @ts-ignore - JS module without type declarations
export { ValidationLevel, ErrorCode } from '../../validation/types.js';

// @ts-ignore - JS module import for use in validateConversion
import { validateAndRepair as _validateAndRepair } from '../../validation/index.js';
// @ts-ignore - JS module import
import { ValidationLevel as _ValidationLevel } from '../../validation/types.js';

/**
 * Validate a ConversionResult (the output of toFullFlowchart).
 *
 * Validates the inner flowchart at the POINTED level (tree + recipe),
 * which checks invariants 1-8:
 *   - Tree structure (next targets exist, children reachable, mapsTo valid)
 *   - Pointed structure (chosenOutcome valid, coherence triangle)
 *
 * @param result - ConversionResult from toFullFlowchart
 * @returns { valid, errors, warnings } from validation
 */
export function validateConversion(result: ConversionResult) {
  if (!result.innerFlowchart) {
    return { valid: true, errors: [], warnings: [], stats: { tasksChecked: 0, outcomesChecked: 0 } };
  }

  return _validateAndRepair(result.innerFlowchart.root, { level: _ValidationLevel.POINTED });
}
