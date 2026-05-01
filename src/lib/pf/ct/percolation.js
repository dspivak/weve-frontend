/**
 * Percolation Algorithm for p/rand structure
 *
 * Implements the canonical map: free_{p/rand} → (free_p)/rand
 *
 * When a task has an elaboration (childFlowchart), the inner likelihoods
 * compose through the tree to determine outer likelihoods:
 *   1. Enumerate all paths from root to terminal outcomes in the elaboration
 *   2. Path probability = product of likelihoods along the path (each / 100)
 *   3. Group terminal outcomes by their mapsTo target
 *   4. Sum probabilities for each group
 *   5. Normalize to integers summing to 100
 *
 * This is the probability-specific instance of the general pattern:
 *   free_{p/q} → (free_p)/q
 * where q = rand and the combine operation is product, aggregate is sum.
 */

/**
 * Percolate likelihoods from a childFlowchart up to the parent's outcomes.
 *
 * @param {Object} task - A TaskNode with childFlowchart
 * @returns {Record<string, number> | null} - Map from parent outcome ID → computed likelihood,
 *          or null if the childFlowchart has no likelihoods
 */
export function percolate(task) {
  if (!task || !task.childFlowchart) return null;

  const paths = enumeratePaths(task.childFlowchart);

  if (paths.length === 0) return null;

  // Check if any path has likelihoods; if none do, return null
  const hasAnyLikelihood = paths.some(p =>
    p.likelihoods.length > 0 && p.likelihoods.every(l => l != null)
  );
  if (!hasAnyLikelihood) return null;

  // Compute path probabilities and group by mapsTo target
  const targetProbs = {};

  for (const path of paths) {
    if (!path.mapsTo) continue; // Skip paths without mapsTo

    // Path probability = product of likelihoods / 100 at each step
    let prob = 1;
    for (const l of path.likelihoods) {
      if (l == null) {
        prob = null;
        break;
      }
      prob *= l / 100;
    }

    if (prob == null) continue; // Skip paths with missing likelihoods

    if (!targetProbs[path.mapsTo]) {
      targetProbs[path.mapsTo] = 0;
    }
    targetProbs[path.mapsTo] += prob;
  }

  // If no targets accumulated, no percolation possible
  const targets = Object.keys(targetProbs);
  if (targets.length === 0) return null;

  // Normalize to integers summing to 100
  return normalizeToIntegers(targetProbs);
}

/**
 * Enumerate all root-to-terminal paths in a flowchart tree.
 * Each path records the likelihoods encountered and the terminal's mapsTo.
 *
 * @param {Object} root - Root TaskNode of the flowchart
 * @returns {Array<{likelihoods: number[], mapsTo: string|null}>}
 */
function enumeratePaths(root) {
  const paths = [];
  const taskIndex = buildTaskIndex(root);

  function walk(taskNode, currentLikelihoods) {
    const outcomes = taskNode.outcomes || [];

    for (const outcome of outcomes) {
      const newLikelihoods = [...currentLikelihoods];
      if (outcome.likelihood != null) {
        newLikelihoods.push(outcome.likelihood);
      }

      if (outcome.next && outcome.next.task) {
        // Non-terminal: follow to next task
        const nextTask = taskIndex[outcome.next.task];
        if (nextTask) {
          walk(nextTask, newLikelihoods);
        }
      } else {
        // Terminal outcome: record the path
        paths.push({
          likelihoods: newLikelihoods,
          mapsTo: outcome.mapsTo || null
        });
      }
    }
  }

  walk(root, []);
  return paths;
}

/**
 * Build an index of all tasks in the tree by ID for O(1) lookup.
 *
 * @param {Object} root - Root TaskNode
 * @returns {Record<string, Object>}
 */
function buildTaskIndex(root) {
  const index = {};

  function collect(task) {
    if (!task) return;
    index[task.id] = task;
    if (task.children) {
      for (const child of task.children) {
        collect(child);
      }
    }
  }

  collect(root);
  return index;
}

/**
 * Normalize a map of probabilities (0-1 floats) to integers summing to 100.
 * Uses largest-remainder method for fair rounding.
 *
 * @param {Record<string, number>} probs - Map from key → probability (0-1)
 * @returns {Record<string, number>} - Map from key → integer (sum = 100)
 */
function normalizeToIntegers(probs) {
  const keys = Object.keys(probs);
  const total = keys.reduce((s, k) => s + probs[k], 0);

  if (total === 0) {
    // Uniform distribution if total is 0
    const each = Math.floor(100 / keys.length);
    const result = {};
    keys.forEach((k, i) => {
      result[k] = i < 100 % keys.length ? each + 1 : each;
    });
    return result;
  }

  // Scale to 100 and take floors
  const scaled = keys.map(k => ({
    key: k,
    exact: (probs[k] / total) * 100,
    floor: Math.floor((probs[k] / total) * 100)
  }));

  const floorSum = scaled.reduce((s, e) => s + e.floor, 0);
  let remainder = 100 - floorSum;

  // Distribute remainder to entries with largest fractional parts
  scaled.sort((a, b) => (b.exact - b.floor) - (a.exact - a.floor));

  const result = {};
  for (const entry of scaled) {
    result[entry.key] = entry.floor + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }

  return result;
}

/**
 * Recursively percolate likelihoods through an entire tree.
 * Post-order traversal: percolate deepest elaborations first.
 * Returns a new tree (immutable).
 *
 * @param {Object} node - Root TaskNode
 * @returns {Object} - New TaskNode with percolated likelihoods
 */
export function percolateTree(node) {
  if (!node) return node;

  // First, recursively process children and childFlowchart
  let newNode = { ...node };

  if (newNode.children) {
    newNode.children = newNode.children.map(child => percolateTree(child));
  }

  if (newNode.childFlowchart) {
    newNode.childFlowchart = percolateTree(newNode.childFlowchart);

    // Now percolate from childFlowchart to this node's outcomes
    const percolated = percolate(newNode);
    if (percolated) {
      newNode.outcomes = (newNode.outcomes || []).map(o => {
        if (percolated[o.id] != null) {
          return { ...o, likelihood: percolated[o.id] };
        }
        return o;
      });
    }
  }

  return newNode;
}

/**
 * Categorize a likelihood value.
 *
 * @param {number} n - Likelihood 0-100
 * @returns {'easy' | 'plausible' | 'unlikely'}
 */
export function likelihoodCategory(n) {
  if (n > 90) return 'easy';
  if (n > 5) return 'plausible';
  return 'unlikely';
}
