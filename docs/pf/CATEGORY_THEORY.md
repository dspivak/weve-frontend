# Category Theory Foundations of Plausible Fiction

This document explains the mathematical structure underlying Plausible Fiction flowcharts.

## Polynomial Functors

A **polynomial functor** `Set → Set` can be written as:

```
p = A · y^B
```

where `y^B := Set(B, -)` is the representable functor. A polynomial of this form is called a **monomial**.

### Tasks, Positions, and Directions

A monomial `A · y^B` represents a **task**:
- `A` = the **input type** (fields, parameters the task needs)
- `B` = the **outcome type** (possible results/branches)

**Example:** The task "Buy pants" might be:
```
BuyPants = (Size × Color) · y^{success, failure}
```
- Input: a size and a color
- Outcomes: success or failure

**Key terminology:**
- The **task** is the monomial `A · y^B` itself (e.g., "Buy pants")
- A **position** is an element `a ∈ A` — a specific invocation with concrete input values (e.g., "Buy pants(size=32, color=blue)")
- A **direction** is an element `b ∈ B` — a specific outcome (e.g., "success")

Think of it like a function:
- The task is the function signature: `buyPants: (Size × Color) → {success, failure}`
- A position is a function call: `buyPants(32, blue)`
- A direction is a return value: `success`

### Evaluating Polynomials

For a polynomial `p = A · y^B`, evaluating at a set X gives:
```
p(X) = A × X^B = A × Set(B, X)
```

This is the set of pairs: (a position, a function from outcomes to X).

**Evaluating at 1 (the one-element set):**
```
p(1) = A × 1^B = A
```
So `p(1)` is just the set of positions — the possible invocations of the task.

### Fibers: Outcomes at a Position

For a position `a ∈ p(1) = A`, the **fiber** `p[a]` is the set of directions available at that position.

For a monomial `A · y^B`, the fiber at any position is just `B`:
```
p[a] = B   for all a ∈ A
```

All invocations of the same task have the same outcome set.

**More general polynomials:** A general polynomial `p = Σᵢ Aᵢ · y^{Bᵢ}` is a sum of monomials. Different positions can have different direction sets. In PF, each task card defines its own fields and outcomes, so the full system is really a coproduct (sum) of monomials — one for each task type.

## Polynomial Maps

A **polynomial map** `f : p → q` between polynomials consists of:
1. **On positions:** A function `f₁ : p(1) → q(1)` (each p-position maps to a q-position)
2. **On directions:** For each position `a ∈ p(1)`, a function `f_a : q[f₁(a)] → p[a]`

**Critical insight:** Directions map **backward**! If position `a` maps to position `f₁(a)`, then the directions at `f₁(a)` map back to directions at `a`.

**Why backward?** Think of it as: "if the target task produces outcome X, what outcome does the source task report?" The target's outcomes determine the source's outcomes.

**Example:** Suppose task P has outcomes {success, failure} and maps to task Q with outcomes {done, error, retry}. The direction map might be:
- done → success
- error → failure
- retry → failure

This says: "if Q finishes with 'done', report 'success'; if Q has 'error' or 'retry', report 'failure'."

## Composition of Polynomials

Given `p = A · y^B` and `q = C · y^D`, their **composition** `p ∘ q` represents: "do a p-task, then for each p-outcome, do a q-task."

**Positions of `p ∘ q`:**
```
(p ∘ q)(1) = A × C^B
```
A position is: a p-invocation `a ∈ A`, plus a q-invocation `c_b ∈ C` for each p-outcome `b ∈ B`.

**Directions of `p ∘ q`:**
```
(p ∘ q)[a, (c_b)_{b∈B}] = Σ_{b∈B} D = B × D
```
A direction is: which p-outcome fired (`b ∈ B`), AND which q-outcome resulted (`d ∈ D`).

**Interpretation for PF:** This is **sender → receiver** chaining:
- A task (sender) has outcomes
- Each outcome can lead to a next task (receiver)
- The final outcome remembers: which sender-outcome, plus which receiver-outcome

The `bind` operation implements this: outcome payload from sender becomes field input to receiver.

## The Free Monad

The **free monad** on `p` is:

```
free_p := colim_{n∈ℕ} pₙ
```

where:
- `p₀ := y` (the identity — just return immediately)
- `pₙ₊₁ := y + p ∘ pₙ` (either return, or do a p-task then continue with a pₙ-tree)

### Elements of free_p

An element `T ∈ free_p(1)` is a **well-founded tree**:
- **Leaves** are terminals (return points)
- **Internal nodes** are task invocations (positions in p)
- **Edges** are labeled with outcomes (directions in p)
- **Children** of a node are the sub-trees for each outcome

A **flowchart** is exactly this: a tree where each node is a task invocation, each edge is an outcome, and leaves are terminal states.

### Directions of free_p

For a tree `T ∈ free_p(1)`, what are its directions? The **leaves**!

```
free_p[T] = { leaves of T }
```

Each leaf is a terminal outcome of the entire flowchart. This is crucial for understanding elaboration.

## Elaboration as a Polynomial Map

When you **elaborate** a task into a sub-flowchart, you're defining a polynomial map:

```
p → free_{q₁ + q₂ + ... + qₖ}
```

where:
- `p` is the parent task (being elaborated)
- `q₁, q₂, ..., qₖ` are the inner task types used in the sub-flowchart
- `q₁ + ... + qₖ` is their coproduct (sum) — tasks in the sub-flowchart can be any of these types

**What this map does:**
1. **On positions:** Each p-invocation maps to a tree (the sub-flowchart)
2. **On directions:** The tree's leaves map **backward** to p's outcomes

**This backward map is exactly `mapsTo`!**

Each terminal outcome (leaf) in the sub-flowchart has a `mapsTo` field indicating which parent outcome it corresponds to. This is the direction component of the polynomial map.

**Example:**
```
Task "Hire employee" with outcomes {hired, rejected}
    ↓ elaborates to
Sub-flowchart with tasks: [Post job, Screen candidates, Interview, Make offer]
    ↓ has terminals
- "Offer accepted" → mapsTo: hired
- "Offer declined" → mapsTo: rejected
- "No qualified candidates" → mapsTo: rejected
- "Position cancelled" → mapsTo: rejected
```

The sub-flowchart has 4 terminal outcomes, but they all map back to the parent's 2 outcomes.

## free_{-} as a Monad on Poly

The construction `free_{-} : Poly → Poly` is itself a monad:

**Unit:** `η_p : p → free_p`
- Embeds a single task as a height-1 tree (one node, leaves for each outcome)
- In PF: a task card that hasn't been elaborated yet

**Multiplication:** `μ_p : free_{free_p} → free_p`
- Flattens a tree-of-trees into a single tree
- In PF: **THE EXPLODE OPERATION**

When you have nested elaborations (a tree where some nodes contain sub-trees), the monad multiplication `μ` flattens them into one big tree. The exploded view is the monad multiplication!

## The Children Array

In the JSON structure, a task has a `innerFlowchart` array. Here's what it represents:

A map `p → free_{q₁ + ... + qₖ}` sends each p-invocation to a tree. The **innerFlowchart** are the task invocations that appear in that tree.

```javascript
{
  "id": "hire-employee",           // This task is position in p
  "label": "Hire employee",
  "outcomes": [
    { "id": "hired", ... },
    { "id": "rejected", ... }
  ],
  "innerFlowchart": [                    // These are positions in q₁, q₂, etc.
    { "id": "post-job", ... },
    { "id": "screen", ... },
    { "id": "interview", ... },
    { "id": "make-offer", ... }
  ]
}
```

The `innerFlowchart` array is a flat list of all task invocations in the sub-flowchart. The tree structure is determined by `outcome.next` pointers:
- `outcome.next = { task: "inner-task-id" }` creates an edge to that inner task
- `outcome.next = null` makes the outcome terminal (a leaf)

**Important:** The number of innerFlowchart (k task types, or n task invocations) has **nothing to do with** the number of parent outcomes. A task with 2 outcomes might elaborate into a sub-flowchart with 10 tasks. A task with 5 outcomes might elaborate into a sub-flowchart with 2 tasks.

## mapsTo and Kleisli Maps

The `mapsTo` field on terminal outcomes specifies the **direction component** of the polynomial map.

When elaborating task T into sub-flowchart E:

```
T : p(1)           -- T is a position (invocation) of task p
E : free_q(1)      -- E is a tree of q-tasks
mapsTo : free_q[E] → p[T]   -- leaves of E map back to outcomes of T
```

Every terminal outcome in E must have `mapsTo` pointing to one of T's outcomes. This is what makes E a valid elaboration of T — it's the data of a polynomial map.

## Nested Elaboration: The Free Operad on Kl(free_p)

A single elaboration is a Kleisli arrow: `T → free_p(B)`. But tasks within the elaboration can themselves be elaborated — each containing its own sub-flowchart with terminals mapping back to that task's outcomes.

The full data structure is an element of the **free operad on the Kleisli category** of the free monad. Concretely:

- Level 0: The **outer card** T₀ = A₀ · y^{B₀} — a proper monomial where
  A₀ is the task specification data (what you need to know to invoke the goal,
  e.g. `{ length, width, color, style }` for "Buy pants") and B₀ is the set
  of possible outcomes (e.g. `{ perfect_fit, acceptable, nothing_found }`).
  When A₀ and B₀ are not specified, defaults apply: A₀ = 1 (no parameters)
  and B₀ = {success, failure}.
- Level 1: A tree elaborating T₀, with tasks having outcome sets B₁₁, B₁₂, ...
- Level 2: Some of those tasks are elaborated, giving trees-within-trees
- Level n: Arbitrary depth

```
T₀ ──Kleisli──→ tree containing T₁
                 └──Kleisli──→ tree containing T₂
                                └──Kleisli──→ ...
```

Each Kleisli arrow has its own mapsTo scope: terminals at level k map back to the enclosing task at level k-1, not to the outermost card.

In the JSON, this is:
- `children[]`: sibling tasks at the same level, connected via `outcome.next`
- `childFlowchart`: the elaboration (a nested Kleisli arrow), stored separately

The monad multiplication `μ : free_{free_p} → free_p` flattens these nested levels into a single tree. The UI supports both views:
- **Collapsed**: Task appears as a single node (the Kleisli source)
- **Expanded**: Task shows its elaboration (the full Kleisli arrow)
- **Flattened**: All levels composed via μ into one tree

## Pointed Polynomials and Recipes

### The Pointed Polynomial p_*

Given a task `p = A · y^B`, its **pointed** variant is:

```
p_* = (A × B) · y^B
```

The input type changes from `A` to `A × B`. Each invocation now includes:
- The field values `a ∈ A`
- A **chosen outcome** `b ∈ B` (the expected/planned result)

The outcome type remains `B` — all outcomes are still possible.

**Interpretation:** A pointed task invocation is: "Buy pants(size=32, color=blue), expecting success." The chosen outcome is the plan; the actual outcome might differ.

### free_{p_*} and Recipes

An element of `free_{p_*}(1)` is a tree where each node has:
- Field values (element of A)
- **Chosen outcome** (element of B)
- Outcomes (indexed by B), each leading to a subtree or terminal

**The Recipe:** Following the chosen outcome at each node traces a single path from root to leaf — this is the **recipe view**. It shows the planned/expected sequence.

**The Flowchart:** The full tree with all outcomes is the **flowchart view**. It shows all contingencies.

A recipe is embedded in a flowchart. The recipe is "what I plan to do"; the flowchart is "what I'll do if things go differently."

### Coherence with Elaboration

When a task T has both `chosenOutcome` and a sub-flowchart E:

```
     p_* ────────→ free_{q_*}
      │               │
      │               │ canonical
      │               ↓
      │           (free_q)_*
      │               │
      ↓               ↓
      y ←──────────── y
```

Both paths to `y` must agree:
- **Left:** Extract the chosen outcome from T
- **Right:** Follow the chosen path through E to a terminal, extract its `mapsTo`

**Coherence condition:** The terminal reached by following the chosen path through the sub-flowchart must have `mapsTo === chosenOutcome`.

This ensures the recipe path is well-defined through elaborations.

## The Kan Residual p/q

### Definition

For polynomials `p` and `q`, the **Kan residual** `p/q` (also written `p ⌢ ⌊p/q⌋`) is:

```
p/q ≅ Σ_{I:p(1)} Σ_{J:q(1)} Σ_{d: q[J]→p[I]} y^{p[I]}
```

A position in `p/q` is: a position in `p`, a position in `q`, and a function from `q`'s directions to `p`'s directions. The direction set at such a position is just `p[I]` — the same directions as `p`.

Intuitively, `p/q` adds the *structure of q* at each node of `p`. Each node carries not just its own data but also "q-shaped" information about its outcomes.

### p/y = p_* (Pointing is a Special Case)

When `q = y`, we have `y(1) = 1` and `y[*] = 1`, so:

```
p/y ≅ Σ_{I:p(1)} Σ_{*:1} Σ_{d: 1→p[I]} y^{p[I]}
     = Σ_{I:p(1)} p[I] · y^{p[I]}
     = p_*
```

So pointing (choosing an outcome) is the simplest Kan residual. The `chosenOutcome` field is exactly `p/y` structure.

### p/rand (Probability Distribution over Outcomes)

The **rand monad** is:

```
rand := Σ_{N:ℕ} Σ_{P:Δ_N} y^N
```

where `Δ_N` is the probability simplex on N elements.

The residual `p/rand` equips each node's outcomes with a probability distribution:

```
p/rand = Σ_{I:p(1)} Σ_{N:ℕ} Σ_{P:Δ_N} Σ_{d: N→p[I]} y^{p[I]}
```

In PF, this is the `likelihood` field on outcomes: integer 0-100 on each outcome, summing to 100.

### p/(y × rand) = (p/y)/rand

Combining recipe (pointing) and likelihood (probability):

```
(p/y)/rand ≅ p/(y × rand)
```

This is the full residual structure in PF: each node has both a `chosenOutcome` (p/y) and `likelihood` values on its outcomes (p/rand). Future residuals can be composed in the same way.

### Percolation: free_{p/q} → (free_p)/q

For any `p` and `q`, there is a canonical map:

```
free_{p/q} → (free_p)/(free_q) → (free_p)/q
```

The second arrow uses the monad map `free_q → q` (when `q` is a monad).

**For q = y (pointing):** This gives `free_{p_*} → (free_p)_*`, the coherence triangle — following `chosenOutcome` through an elaboration yields the parent's `chosenOutcome`.

**For q = rand (probability):** This gives `free_{p/rand} → (free_p)/rand` — probability percolation. When a task has an elaboration (childFlowchart) with likelihoods on inner outcomes:

1. Enumerate all paths from root to terminal outcomes in the childFlowchart
2. Path probability = product of likelihoods along the path
3. Group terminal outcomes by their `mapsTo` target
4. Sum probabilities for each group
5. Normalize to integers summing to 100

Multiple inner paths to the same outer outcome have their probabilities summed. This is how inner detail "percolates outward" to determine outer likelihoods.

### Value Propagation: The Dual Direction

While probabilities percolate **outward** (inner → outer, via `free_{p/rand} → (free_p)/rand`),
values propagate **inward** (outer → inner). This is the reverse martingale
(see "Martingale reverse induction as monad adjunction", Spivak).

When a user assigns values to outer card outcomes (e.g., "Success = $1000, Failure = $0"):

1. Inner terminal outcomes inherit values via `mapsTo` (a terminal mapping to "success" gets value 1000)
2. Non-terminal outcomes inherit the `derivedValue` of the receiving task (the task pointed to by `outcome.next`)
3. At each node, `derivedValue = Σ (likelihood/100 × value)` across outcomes (backward induction)
4. For elaborated tasks (childFlowchart), the task's outcome values become the outer values for the elaboration, propagating recursively inward

This gives every inner task a `derivedValue` — the expected value of completing that task,
which serves as a natural "bounty" for gap-filling in collaborative flowcharts.

The decomposition `T(G × -) → G × Bal_G` separates the expected value (G component)
from the balanced probability fluctuation (Bal_G component). The `derivedValue` is exactly
the G component at each node.

### Extensibility: Future /q's

The pattern for any new residual `p/q`:
1. **Field:** Add optional field to Outcome or TaskNode
2. **Operation:** Add to `applyOperation` in realtimeFlowchart.js
3. **Percolation:** Implement in `src/ct/percolation.js` — same tree-walk structure, different combine/aggregate operations (product+sum for probability, sum+sum for cost, max+max for time, etc.)
4. **Validation:** New file in `src/validation/`
5. **LLM:** Add operation to extraction prompt
6. **UI:** Badges in CardComponent, aggregates in RecipeView

## Summary: PF Concepts ↔ Category Theory

| PF Concept | Category Theory |
|------------|-----------------|
| Task (e.g., "Buy pants") | Monomial `A · y^B` |
| Task invocation (with field values) | Position `a ∈ A = p(1)` |
| Outcomes of a task | Direction set `B = p[a]` |
| Pointed task (with chosen outcome) | Position in `p_* = (A×B) · y^B` |
| Flowchart | Element of `free_p(1)` (a tree) |
| Terminal outcomes (leaves) | Directions `free_p[T]` |
| Elaboration | Polynomial map `p → free_q` |
| `mapsTo` on terminals | Direction map `free_q[E] → p[T]` (backward!) |
| Children array | Task invocations in the sub-flowchart |
| `outcome.next` | Tree structure (edges) |
| Recipe | Chosen path through `free_{p_*}` |
| Explode operation | Monad multiplication `μ : free_{free_p} → free_p` |
| `bind` | Position component of composition |
| `payloadMapping` | Direction component (backward) |
| Outcome likelihood | `p/rand` structure (Kan residual) |
| Percolation | `free_{p/rand} → (free_p)/rand` |
| Kan residual | `p/q` adds extra structure at each node |
| `chosenOutcome` + `likelihood` | `p/(y × rand)` (combined residual) |
| Value propagation (inward) | Reverse martingale: `T(G × -) → G × Bal_G` |
| `derivedValue` on a task | Expected value at that node (G component) |

## Why This Matters

Understanding the category theory ensures correctness:

1. **Validation:** The structure must be a valid polynomial map. `mapsTo` must exist on all terminals and point to valid parent outcomes (this is the direction map).

2. **Directions go backward:** When A elaborates to B, B's terminals determine A's outcomes, not vice versa. This is fundamental to polynomial maps.

3. **Explode:** Flattening is monad multiplication. It must preserve all paths and compose the direction maps correctly.

4. **Recipes:** The coherence triangle ensures local choices (chosenOutcome at each node) determine a consistent global path.

5. **Children ≠ Outcomes:** The number of innerFlowchart in a sub-flowchart is independent of the number of parent outcomes. They're unrelated concepts.
