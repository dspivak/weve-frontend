/**
 * Value Propagation Algorithm (Reverse Martingale)
 *
 * The dual of percolation (src/ct/percolation.js):
 *   - Percolation: likelihoods propagate OUTWARD (inner → outer)
 *     free_{p/rand} → (free_p)/rand
 *   - Valuation: values propagate INWARD (outer → inner)
 *
 * User assigns values to outer card outcomes → inner terminal outcomes
 * inherit values via mapsTo → expected values (derivedValue) computed at
 * each inner node via backward induction.
 *
 * Within each elaboration level, computation is post-order: need receiving
 * task values before computing sending task expected values.
 *
 * Reference: "Martingale reverse induction as monad adjunction" (Spivak)
 *   T(G × -) → G × Bal_G
 * where G carries value, Bal_G carries balanced probability.
 */

/**
 * Propagate values inward through an entire tree.
 *
 * @param {Object} outerCard - The outer card with outcomes that have values
 * @param {Object} innerRoot - The root of the inner flowchart tree
 * @returns {Object} - New tree with derivedValue on each node and value on outcomes
 */
export function propagateValues(outerCard, innerRoot) {
  if (!outerCard || !innerRoot) return innerRoot;

  // Build value map from outer card outcomes: { outcomeId: value }
  const outerValues = {};
  let hasAnyValue = false;
  for (const o of (outerCard.outcomes || [])) {
    if (o.value != null) {
      outerValues[o.id] = o.value;
      hasAnyValue = true;
    }
  }

  if (!hasAnyValue) return innerRoot;

  // Propagate inward: assign values to terminal outcomes via mapsTo,
  // then backward induction to compute derivedValue at each node
  return propagateInward(innerRoot, outerValues);
}

/**
 * Recursive inward propagation within one elaboration level.
 *
 * 1. Assign values to terminal outcomes via mapsTo lookup
 * 2. For non-terminal outcomes (sender → receiver via outcome.next),
 *    outcome value = derivedValue of the receiving task
 * 3. For elaborated tasks (childFlowchart), propagate values further inward
 * 4. Compute derivedValue at each node = Σ (likelihood/100 × outcome_value)
 *
 * Processing order: post-order (process receivers before senders) to ensure
 * that when we compute a sender's outcome value from a receiver's derivedValue,
 * the receiver already has its derivedValue computed.
 *
 * @param {Object} root - Root node of this elaboration level
 * @param {Record<string, number>} outerValues - Map from outer outcome ID → value
 * @returns {Object} - New tree with values assigned
 */
function propagateInward(root, outerValues) {
  // Build task index for this level (root + children)
  const taskIndex = {};
  function indexTasks(node) {
    if (!node) return;
    taskIndex[node.id] = node;
    for (const child of (node.children || [])) {
      indexTasks(child);
    }
  }
  indexTasks(root);

  // Determine processing order: reverse topological (post-order).
  // Process tasks that are "last" in the chain first.
  const order = getPostOrder(root, taskIndex);

  // Deep-clone the tree so we don't mutate the original
  const cloned = deepClone(root);
  const clonedIndex = {};
  function indexCloned(node) {
    if (!node) return;
    clonedIndex[node.id] = node;
    for (const child of (node.children || [])) {
      indexCloned(child);
    }
  }
  indexCloned(cloned);

  // Process in post-order (last tasks first)
  for (const taskId of order) {
    const task = clonedIndex[taskId];
    if (!task) continue;

    // Step 1: Assign values to outcomes
    for (const outcome of (task.outcomes || [])) {
      if (!outcome.next) {
        // Terminal outcome: inherit value from outer via mapsTo
        if (outcome.mapsTo && outerValues[outcome.mapsTo] != null) {
          outcome.value = outerValues[outcome.mapsTo];
        }
      } else {
        // Non-terminal outcome: value = derivedValue of receiving task
        const receiverId = outcome.next.task || outcome.next;
        const receiver = clonedIndex[receiverId];
        if (receiver && receiver.derivedValue != null) {
          outcome.value = receiver.derivedValue;
        }
      }
    }

    // Step 2: If this task has a childFlowchart, propagate values further inward
    if (task.childFlowchart) {
      // The task's outcome values become the outer values for the elaboration
      const taskOutcomeValues = {};
      for (const o of (task.outcomes || [])) {
        if (o.value != null) {
          taskOutcomeValues[o.id] = o.value;
        }
      }
      if (Object.keys(taskOutcomeValues).length > 0) {
        task.childFlowchart = propagateInward(task.childFlowchart, taskOutcomeValues);
      }
    }

    // Step 3: Compute derivedValue = Σ (likelihood/100 × outcome_value)
    task.derivedValue = computeExpectedValue(task.outcomes);
  }

  return cloned;
}

/**
 * Compute expected value from outcomes.
 * derivedValue = Σ (likelihood/100 × value) across all outcomes.
 * Returns null if any outcome is missing likelihood or value.
 *
 * @param {Array} outcomes - Array of outcome objects
 * @returns {number | null}
 */
function computeExpectedValue(outcomes) {
  if (!outcomes || outcomes.length === 0) return null;

  let sum = 0;
  for (const o of outcomes) {
    if (o.likelihood == null || o.value == null) return null;
    sum += (o.likelihood / 100) * o.value;
  }

  // Round to 2 decimal places for display
  return Math.round(sum * 100) / 100;
}

/**
 * Get task IDs in post-order (last tasks first).
 * This ensures receivers are processed before senders.
 *
 * @param {Object} root - Root node
 * @param {Record<string, Object>} taskIndex - Index of all tasks
 * @returns {string[]} - Task IDs in reverse topological order
 */
function getPostOrder(root, taskIndex) {
  const visited = new Set();
  const order = [];

  function visit(taskId) {
    if (visited.has(taskId)) return;
    visited.add(taskId);

    const task = taskIndex[taskId];
    if (!task) return;

    // Visit receivers first (tasks pointed to by non-terminal outcomes)
    for (const outcome of (task.outcomes || [])) {
      if (outcome.next) {
        const receiverId = outcome.next.task || outcome.next;
        visit(receiverId);
      }
    }

    order.push(taskId);
  }

  // Start from root, then visit all children
  visit(root.id);
  for (const child of (root.children || [])) {
    visit(child.id);
  }

  return order;
}

/**
 * Deep clone a tree node (outcomes, children, childFlowchart).
 */
function deepClone(node) {
  if (!node) return node;
  return {
    ...node,
    outcomes: (node.outcomes || []).map(o => ({ ...o })),
    children: (node.children || []).map(c => deepClone(c)),
    ...(node.childFlowchart ? { childFlowchart: deepClone(node.childFlowchart) } : {})
  };
}
