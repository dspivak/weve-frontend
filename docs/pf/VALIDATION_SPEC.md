# Validation Specification

This document maps categorical requirements to validation checks and code locations.

**Prerequisites:** Read `docs/CATEGORY_THEORY.md` for foundations and `docs/CT_INVARIANTS.md` for the invariant list.

## Overview

Every flowchart in Plausible Fiction must be a valid element of `free_p(1)` — a well-founded tree of task invocations. This document specifies:

1. **What** categorical properties must hold
2. **How** we check them (validation functions)
3. **Where** checks are called (validation gates)
4. **When** we repair vs. reject invalid data

## Quick Reference

| Invariant | CT Basis | Error Code | Validator |
|-----------|----------|------------|-----------|
| Terminals have mapsTo | Direction map of poly map | `MISSING_MAPS_TO` | `treeStructure.js` |
| mapsTo valid | Direction map target | `INVALID_MAPS_TO` | `treeStructure.js` |
| next.task exists | Tree edges | `INVALID_NEXT_TARGET` | `treeStructure.js` |
| No orphans | Well-founded tree | `ORPHANED_TASK` | `treeStructure.js` |
| Root exists | Tree has root | `MISSING_ROOT` | `treeStructure.js` |
| chosenOutcome valid | p_* position type | `INVALID_CHOSEN_OUTCOME` | `pointedStructure.js` |
| No choice from ∅ | (y^0)_* = 0 | `INVALID_CHOSEN_OUTCOME` | `pointedStructure.js` |
| Coherence | Triangle commutes | `COHERENCE_MISMATCH` | `pointedStructure.js` |
| bind scope | Functoriality | `INVALID_BIND_SCOPE` | `treeStructure.js` |
| payloadMapping scope | Functoriality | `INVALID_PAYLOAD_MAPPING_SCOPE` | `treeStructure.js` |

## Validation Gates (Where Checks Run)

### 1. localStorage Load

**File:** `src/contexts/FlowchartContext.jsx` - `loadState()`

**What:** Validates and repairs flowcharts loaded from localStorage

**Level:** TREE (repairs disconnected tasks with default outcomes)

**Behavior:**
- If invalid: attempt repair via `repairTreeStructure()`
- If still invalid: reconvert from `realtimeFlowchart`
- If still invalid: log warning, use invalid data (graceful degradation)

### 2. View Mode Toggle

**File:** `src/components/PFWorkspace.jsx` - `handleViewModeToggle()`

**What:** Validates before showing flowchart views

**Level:** POINTED (tree + recipe requirements)

**Behavior:**
- If invalid: reconvert from `realtimeFlowchart`
- If still invalid: block switch, show error message
- For recipe view: downgrade to diagram view if recipe invalid

### 3. LLM Extraction

**File:** `src/llm.js` - `chat()` returns operations

**File:** `src/components/PFWorkspace.jsx` - `handleConversationSubmit()`

**What:** Operations from LLM are applied to `realtimeFlowchart`

**Level:** N/A (realtime flowchart has looser structure)

**Note:** Validation happens at conversion time (view toggle), not at operation time. The realtime flowchart is a "working draft" that gets validated when finalized.

### 4. Export/Publish (TODO)

**File:** TBD

**What:** Full validation before persisting externally

**Level:** FULL (all checks, strict mode)

**Behavior:**
- If any errors or warnings: block export
- User must fix issues before publishing

## Validation Levels

```javascript
import { validateFlowchart, ValidationLevel } from '@/validation';

// Level 1: Tree structure only (for diagram view)
validateFlowchart(fc, { level: ValidationLevel.TREE });

// Level 2: Tree + pointed (for recipe view)
validateFlowchart(fc, { level: ValidationLevel.POINTED });

// Level 3: All checks (for export)
validateFlowchart(fc, { level: ValidationLevel.FULL, strict: true });
```

## Repair Strategies

### `repairTreeStructure(flowchart)`

Fixes common tree structure issues:

1. **Empty outcomes:** Adds default "Continue" → next sibling or "Done" for last task
2. **Missing chosenOutcome:** Sets to first outcome ID
3. **Disconnected root:** Connects root's "Success" to first inner task
4. **Missing mapsTo:** Adds mapsTo pointing to parent's first outcome

### `toFullFlowchart(realtimeFlowchart)`

Converts realtime draft to valid full flowchart:

1. Creates sequential "Continue" outcomes between tasks
2. Sets "Done" outcome for final task
3. Sets `chosenOutcome` on each task
4. Connects root to first task

## Error Messages

Error messages include categorical context to help debugging:

```
Terminal outcome "Offer declined" in sub-flowchart is missing mapsTo.
Category theory: The direction map of a polynomial map p → free_q requires
every leaf (terminal) to map back to a direction of p.
```

## Adding New Validations

1. Identify the categorical property being violated
2. Add error code to `src/validation/types.js`
3. Implement check in appropriate validator file
4. Add to the appropriate validation level
5. Document in `CT_INVARIANTS.md`

## File Structure

```
src/validation/
├── index.js              # Main entry point, validateFlowchart()
├── types.js              # Error codes, ValidationResult type
├── treeStructure.js      # free_p validation (tree structure, poly maps)
├── pointedStructure.js   # free_{p_*} validation (recipes, coherence)
└── kleisliMaps.js        # (TODO) Additional Kleisli composition checks
```

## See Also

- `docs/CATEGORY_THEORY.md` - Full categorical foundations
- `docs/CT_INVARIANTS.md` - Complete invariant list with CT basis
- `src/validation/` - Implementation
- `src/realtimeFlowchart.js` - `toFullFlowchart()` conversion
