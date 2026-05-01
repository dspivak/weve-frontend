# Category Theory Invariants for Plausible Fiction

This document derives validation requirements directly from the category theory,
mapped to the actual JSON structure used in the codebase.

**Prerequisites:** Read `docs/CATEGORY_THEORY.md` first for the mathematical foundations.

## How to Add Invariants

Every invariant and its corresponding test must trace to a specific categorical
definition. Before adding a new validation check, complete this chain:

```
1. Identify the CT definition in CATEGORY_THEORY.md
   (e.g., "Dist(N) requires components to sum to 1")

2. Derive the invariant in THIS file (CT_INVARIANTS.md)
   (e.g., "L2: likelihoods sum to 100")

3. Add the ErrorCode in src/validation/types.js
   (e.g., LIKELIHOOD_SUM_MISMATCH)

4. Implement the check in src/validation/*.js
   (e.g., likelihoodStructure.js)

5. Add the test in src/validation/tests.js
   (e.g., "[L2] Likelihoods not summing to 100 is caught")
```

**Rules:**
- If you cannot cite a definition in CATEGORY_THEORY.md, the check is illegitimate.
- Properties that FOLLOW from the math (theorems/corollaries) do not get their own
  invariant. They are already enforced by the checks on the definitions they follow from.
- Operational concerns ("what if X is empty?") are not valid justifications.
- Example: "outcomes must be non-empty" is NOT a valid invariant. Non-emptiness is a
  corollary of Dist(0) = ∅. It is enforced by L2 (sum to 100), which IS a check on
  the definition of Dist(N).

A meta-test in `tests.js` mechanically verifies that every ErrorCode in `types.js`
appears in this document. If the chain is broken, the test fails.

## Core Concepts Recap

### Tasks, Positions, and Directions

- A **task** is a monomial `A · y^B` (e.g., "Buy pants")
- A **position** is an element `a ∈ A` — a specific invocation with field values
- A **direction** is an element `b ∈ B` — a specific outcome

### Polynomial Maps and the Backward Direction

A polynomial map `f : p → q` has:
- On positions: `p(1) → q(1)` (forward)
- On directions: `q[f(a)] → p[a]` (backward!)

**This backward map is `mapsTo`.** Terminal outcomes in a sub-flowchart map back to parent outcomes.

### Flowcharts as Trees

A flowchart is an element of `free_p(1)` — a well-founded tree where:
- Internal nodes are task invocations (positions)
- Edges are labeled with outcomes (directions)
- Leaves are terminal outcomes

The directions of a tree ARE its leaves: `free_p[T] = { leaves of T }`

## JSON Structure (from SYSTEM_PROMPT)

```javascript
{
  "id": "task-id",
  "label": "Task label with {fieldName} inline variables",

  // Position data (input parameters)
  "fields": {
    "fieldName": { "type": "string|number|boolean|date" }
  },

  // Pointed structure: chosen direction
  "chosenOutcome": "outcome-id",

  // Directions (outcomes)
  "outcomes": [
    {
      "id": "outcome-1",
      "label": "Outcome with {payloadName}",
      "payload": { "payloadName": { "type": "..." } },
      "next": { "task": "inner-task-id", "bind": {...} },   // Edge to inner task
      "mapsTo": "parent-outcome-id",                    // Backward map (terminals only)
      "payloadMapping": { "parentField": "{formula}" }  // Backward map data
    }
  ],

  // Children: task invocations in the sub-flowchart
  "innerFlowchart": [...]
}
```

## Invariants from Polynomial Maps

### Invariant 1: Terminal outcomes must have `mapsTo`

**Category theory:** A polynomial map `p → free_q` requires a direction map `free_q[E] → p[a]`. Every leaf of the sub-flowchart must map back to a parent outcome.

**JSON check:** `outcome.next === null ⟹ outcome.mapsTo exists`

**Error:** `MISSING_MAPS_TO`

### Invariant 2: `mapsTo` must reference valid parent outcome

**Category theory:** The direction map goes to `p[a]`, the parent's outcome set. When elaboration is nested (free operad on Kl(free_p)), each Kleisli level has its own mapsTo scope: terminals map to the **enclosing task's** outcomes, not the outermost card's.

**JSON check:** `outcome.mapsTo ∈ enclosingTask.outcomes[].id`

**Scoping:** If a task T has `childFlowchart`, terminal outcomes within that childFlowchart must mapsTo T's outcome IDs. Terminal outcomes in the root-level inner flowchart mapsTo the outer card's outcome IDs. Each nesting level scopes independently.

**Error:** `INVALID_MAPS_TO`

## Invariants from Tree Structure (free_p)

### Invariant 3: `outcome.next.task` must reference existing inner task

**Category theory:** Edges in the tree must connect to actual nodes.

**JSON check:** `outcome.next.task ∈ innerFlowchart[].id`

**Error:** `INVALID_NEXT_TARGET`

### Invariant 4: Every inner task must be reachable

**Category theory:** A well-founded tree has no orphaned nodes.

**JSON check:** `∀ innerTask ∃ outcome: outcome.next.task = innerTask.id`

**Error:** `ORPHANED_TASK`

### Invariant 5: Root must exist

**Category theory:** A tree has a root.

**JSON check:** `flowchart !== null`

**Error:** `MISSING_ROOT`

## Invariants from Pointed Structure (free_{p_*})

### Invariant 6: `chosenOutcome` must reference valid outcome

**Category theory:** A position in `p_* = (A×B) · y^B` includes an element of B.

**JSON check:** `task.chosenOutcome ∈ task.outcomes[].id`

**Error:** `INVALID_CHOSEN_OUTCOME`

### Invariant 6b: Tasks with outcomes should have `chosenOutcome`

**Category theory:** A position in `p_* = (A×B) · y^B` includes an element of B. If B is non-empty, a choice must be made for the recipe to be well-defined.

**JSON check:** `task.outcomes.length > 0 ⟹ task.chosenOutcome exists`

**Warning:** `MISSING_CHOSEN_OUTCOME`

**Note:** This is a warning, not an error — a task may not yet have a chosen outcome during construction. But the recipe path will end at that task.

### Invariant 7: Tasks with no outcomes cannot have `chosenOutcome`

**Category theory:** If B = ∅, then (y^0)_* = 0 — there's nothing to choose.

**JSON check:** `task.outcomes.length === 0 ⟹ task.chosenOutcome === null`

**Error:** `INVALID_CHOSEN_OUTCOME`

**Note:** Empty outcomes (y^0) are not checked as a standalone invariant. Non-emptiness is a *consequence* of p/rand: `rand = Σ_{N:Nat} Σ_{D:Dist(N)} y^N`, and `Dist(0) = ∅` (no distribution on the empty set sums to 100). The evaluator LLM enforces this by ensuring every task has outcomes with a valid distribution. Invariant L2 (likelihoods sum to 100) makes empty outcomes unsatisfiable.

### Invariant 8: Coherence triangle must commute

**Category theory:** When a task has both `chosenOutcome` and a sub-flowchart:
```
p_* → free_{q_*} → y   must equal   p_* → y
```

Following the chosen path through the sub-flowchart to a terminal, the terminal's `mapsTo` must equal the parent's `chosenOutcome`.

**JSON check:** `followChosenPath(innerFlowchart).terminalOutcome.mapsTo === task.chosenOutcome`

**Error:** `COHERENCE_MISMATCH`

## Invariants from Scope (Functoriality)

### Invariant 9: `bind` formulas must reference in-scope variables

**Category theory:** The position map is functorial — it can only use available data.

**JSON check:** Variables in `outcome.next.bind` come from:
- `outcome.payload` (the current outcome's payload)
- `task.fields` (the current task's fields)
- Ancestor fields (via scope chain)

**Error:** `INVALID_BIND_SCOPE`

### Invariant 10: `payloadMapping` must reference in-scope variables

**Category theory:** The direction map (backward) can only use data available at that point.

**JSON check:** Variables in `outcome.payloadMapping` come from:
- `task.fields`
- `outcome.payload`

**Error:** `INVALID_PAYLOAD_MAPPING_SCOPE`

### Invariant 11: Label variables must be in scope

**JSON check:**
- Task label variables: `vars(task.label) ⊆ task.fields`
- Outcome label variables: `vars(outcome.label) ⊆ outcome.payload`

**Error:** `INVALID_BIND_SCOPE`

## Summary Table

### Tree Structure (free_p)

| # | Invariant | JSON Check | Error Code |
|---|-----------|------------|------------|
| 1 | Terminals have mapsTo | `next === null ⟹ mapsTo exists` | `MISSING_MAPS_TO` |
| 2 | mapsTo is valid | `mapsTo ∈ parent.outcomes[].id` | `INVALID_MAPS_TO` |
| 3 | next.task exists | `next.task ∈ innerFlowchart[].id` | `INVALID_NEXT_TARGET` |
| 4 | No orphaned inner tasks | `∀ innerTask ∃ outcome pointing to it` | `ORPHANED_TASK` |
| 5 | Root exists | `flowchart !== null` | `MISSING_ROOT` |

### Pointed Structure (free_{p_*})

| # | Invariant | JSON Check | Error Code |
|---|-----------|------------|------------|
| 6 | chosenOutcome valid | `chosenOutcome ∈ outcomes[].id` | `INVALID_CHOSEN_OUTCOME` |
| 7 | No choice from empty | `outcomes.length === 0 ⟹ !chosenOutcome` | `INVALID_CHOSEN_OUTCOME` |
| 8 | Coherence | `terminalMapsTo === chosenOutcome` | `COHERENCE_MISMATCH` |

### Scope (Functoriality)

| # | Invariant | JSON Check | Error Code |
|---|-----------|------------|------------|
| 9 | bind scope | `vars(bind) ⊆ payload ∪ fields` | `INVALID_BIND_SCOPE` |
| 10 | payloadMapping scope | `vars(payloadMapping) ⊆ fields ∪ payload` | `INVALID_PAYLOAD_MAPPING_SCOPE` |
| 11 | label scope | `vars(label) ⊆ appropriate scope` | `INVALID_BIND_SCOPE` |

## Likelihood Structure (p/rand)

These invariants ensure outcome likelihoods form valid probability distributions.
Likelihoods are optional — but when present on any outcome of a task, they must satisfy all three invariants.

### Invariant L1: Likelihood in range

**Category theory:** Each component of the probability simplex Δ_N is in [0, 1]. Using integer encoding: [0, 100].

**JSON check:** `0 ≤ outcome.likelihood ≤ 100` and `Number.isInteger(outcome.likelihood)`

**Error:** `LIKELIHOOD_OUT_OF_RANGE`

### Invariant L2: Likelihoods sum to 100

**Category theory:** The probability simplex Δ_N requires components to sum to 1. Using integer encoding: sum to 100.

**JSON check:** `Σ task.outcomes[].likelihood === 100`

**Error:** `LIKELIHOOD_SUM_MISMATCH`

### Invariant L3: All-or-nothing

**Category theory:** A probability distribution is defined on all outcomes or none — partial distributions are meaningless.

**JSON check:** If any outcome of a task has `likelihood`, all outcomes must have `likelihood`.

**Error:** `LIKELIHOOD_PARTIAL`

### Summary Table (Likelihood)

| # | Invariant | JSON Check | Error Code |
|---|-----------|------------|------------|
| L1 | Likelihood in range | `0 ≤ likelihood ≤ 100, integer` | `LIKELIHOOD_OUT_OF_RANGE` |
| L2 | Likelihoods sum to 100 | `Σ task.outcomes[].likelihood = 100` | `LIKELIHOOD_SUM_MISMATCH` |
| L3 | All-or-nothing | `some have likelihood ⟹ all have likelihood` | `LIKELIHOOD_PARTIAL` |

## Validation Levels

| Level | What it validates | When to use |
|-------|-------------------|-------------|
| `TREE` | Invariants 1-5 | Diagram view, basic structure |
| `POINTED` | Tree + Invariants 6-8 | Recipe view |
| `FULL` | All invariants (1-11, L1-L3) | Export, publish |

## Common Bugs and Their CT Explanation

### Bug: Recipe shows fewer steps than flowchart

**Symptoms:** Flowchart has 5 tasks, recipe shows 2.

**CT explanation:** Either:
1. Some tasks lack `chosenOutcome` — the chosen path ends early
2. Some tasks have `outcomes: []` — dead ends can't continue
3. `outcome.next` pointers don't form a connected path

### Bug: "mapsTo invalid" error

**Symptoms:** Validation fails with `INVALID_MAPS_TO`.

**CT explanation:** The direction map of the polynomial map is malformed. A terminal outcome claims to map to a parent outcome that doesn't exist.

**Fix:** Ensure all terminal `mapsTo` values reference actual outcome IDs of the parent task.

### Bug: Orphaned tasks

**Symptoms:** Tasks appear in diagram but are disconnected.

**CT explanation:** The tree structure is broken. Some task invocations exist in `innerFlowchart` but no edge (outcome.next) leads to them.

**Fix:** Ensure every inner task is the target of some `outcome.next`.

## Implementation Files

```
src/validation/
├── index.js                  # Main entry point
├── types.js                  # Error codes, ValidationResult
├── treeStructure.js          # Invariants 1-5
├── pointedStructure.js       # Invariants 6-8
├── likelihoodStructure.js    # Invariants L1-L3 (p/rand)
└── tests.js                  # All invariant tests

src/ct/
└── percolation.js            # free_{p/rand} → (free_p)/rand
```

## Tree View and Elaboration

### Visual Nesting = Categorical Nesting

The "Your Story" panel and recipe view display flowcharts as **nested trees**:

```
▼ Find love
  └─▼ Get Sam to like me
      └─ Give Sam a dog ⚠
```

This visual nesting directly corresponds to the categorical structure:

| Visual | JSON | Category Theory |
|--------|------|-----------------|
| Outer node | Parent task | Source of Kleisli arrow |
| Inner nodes | `childFlowchart` | Target tree of Kleisli arrow |
| Sibling nodes | `children[]` | Sibling tasks at the same level |
| Expand [+] | Has `childFlowchart` | Task is elaborated |
| Collapse [-] | Hide elaboration | Show only the Kleisli source |

### Elaboration as Kleisli Arrows

When a task T is elaborated:

1. **T has a `chosenOutcome`** (position in p_*)
2. **T.childFlowchart** contains the sub-tree (element of free_{q_*})
3. **T.children[]** contains sibling tasks at T's level (connected via `outcome.next`)
4. **Coherence**: Following chosenOutcome through childFlowchart reaches a terminal whose `mapsTo === T.chosenOutcome`

```
T (chosenOutcome: "success")
├── outcome "success" → next sibling S     ← sibling connection
└── childFlowchart                         ← elaboration (separate Kleisli arrow)
    ├── subtask1 (chosenOutcome: "done")
    │   └── terminal outcome (mapsTo: "success")  ← maps to T's outcome, not outer card
    └── subtask2 ...
```

Elaboration nests arbitrarily: subtask1 can itself have a `childFlowchart`. Each nesting level has its own mapsTo scope (see Invariant 2). This structure is an element of the free operad on Kl(free_p) — see CATEGORY_THEORY.md.

### revealParentGoal and Kleisli Composition

During conversation, users may reveal deeper goals:

```
Turn 1: "I want to get Sam to like me"     → goal: "Get Sam to like me"
Turn 2: "I'll give them a dog"             → task: "Give Sam a dog"
Turn 3: "Because I want to find love"      → revealParentGoal: "Find love"
```

The `revealParentGoal` operation restructures the tree:

**Before:**
```
goal: "Get Sam to like me"
tasks: [{ id: "task-1", label: "Give Sam a dog", parentId: null }]
```

**After:**
```
goal: "Find love"
tasks: [
  { id: "goal-demoted-xxx", label: "Get Sam to like me", parentId: null },
  { id: "task-1", label: "Give Sam a dog", parentId: "goal-demoted-xxx" }
]
```

**Categorical interpretation:** We learned that our tree was actually a sub-tree of a larger tree. The operation adds an outer Kleisli arrow:

```
"Find love" ──Kleisli──→ tree containing "Get Sam to like me"
                         └──Kleisli──→ tree containing "Give Sam a dog"
```

The full picture is the **Kleisli composite** of these arrows.

### Expand/Collapse and Monad Multiplication

- **Collapsed view**: Shows the task as a single node (the Kleisli source)
- **Expanded view**: Shows the task with its elaboration (the full Kleisli arrow)
- **Fully expanded**: Shows `free_{free_p}` — tree-of-trees before μ
- **Flattened (explode)**: Applies monad multiplication μ : free_{free_p} → free_p

The recipe view follows `chosenOutcome` at each level, tracing the "expected path" through all nested elaborations.
