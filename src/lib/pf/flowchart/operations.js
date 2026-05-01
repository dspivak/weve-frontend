/**
 * Mutation operations for flowchart tree structures.
 *
 * CATEGORICAL NOTE: These functions modify elements of free_p (the free monad
 * on polynomial p) by adding sub-trees or updating individual monomials.
 * All operations return new copies (immutable updates).
 */

/**
 * Add a sub-flowchart to a node (searches including nested childFlowcharts).
 *
 * CATEGORICAL NOTE: This implements task elaboration - replacing a task node
 * (monomial) with an entire sub-tree (element of free_p). The result goes from
 * a height-1 tree (single node) to a height-n tree. This is the key operation
 * that builds up the free monad structure.
 *
 * The terminal outcomes in the subFlowchart must map back to the original task's
 * outcomes via `mapsTo` - this is part of the Kleisli map specification.
 */
export function addSubFlowchart(flowchart, nodeId, subFlowchart) {
  const clone = JSON.parse(JSON.stringify(flowchart));

  function findAndUpdate(node) {
    if (node.id === nodeId) {
      node.childFlowchart = subFlowchart;
      return true;
    }
    // Search in regular children
    for (const child of node.children || []) {
      if (findAndUpdate(child)) return true;
    }
    // Search in existing childFlowchart
    if (node.childFlowchart && findAndUpdate(node.childFlowchart)) {
      return true;
    }
    return false;
  }

  findAndUpdate(clone);
  return clone;
}

/**
 * Update a task node in the flowchart tree.
 * Returns a new flowchart with the updated task.
 *
 * CATEGORICAL NOTE: This modifies a single monomial A·y^B in the free_p tree
 * without changing the overall tree structure. Changes to fields (A) or
 * outcomes (B) may affect validity of bindings and mapsTo specifications.
 */
export function updateTaskInFlowchart(flowchart, taskId, updates) {
  const clone = JSON.parse(JSON.stringify(flowchart));

  function findAndUpdate(node) {
    if (node.id === taskId) {
      Object.assign(node, updates);
      return true;
    }
    for (const child of node.children || []) {
      if (findAndUpdate(child)) return true;
    }
    if (node.childFlowchart && findAndUpdate(node.childFlowchart)) {
      return true;
    }
    return false;
  }

  findAndUpdate(clone);
  return clone;
}
