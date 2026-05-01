/**
 * Query utilities for searching flowchart tree structures.
 *
 * CATEGORICAL NOTE: These functions traverse the free_p tree structure,
 * descending into both sender-direction children (polynomial composition)
 * and elaboration-direction children (free monad structure via childFlowchart).
 */

/**
 * Find a node by ID in the tree (including childFlowcharts).
 *
 * CATEGORICAL NOTE: This traverses the free_p tree structure, descending into
 * both sender-direction children (polynomial composition) and elaboration-direction
 * children (free monad structure via childFlowchart).
 */
export function findNodeById(flowchart, nodeId) {
  if (!flowchart) return null;
  if (flowchart.id === nodeId) return flowchart;

  // Search in regular children
  for (const child of flowchart.children || []) {
    const found = findNodeById(child, nodeId);
    if (found) return found;
  }

  // Search in childFlowchart (elaboration)
  if (flowchart.childFlowchart) {
    const found = findNodeById(flowchart.childFlowchart, nodeId);
    if (found) return found;
  }

  return null;
}

/**
 * Collect all tasks from the flowchart tree (flat list).
 * Useful for finding target tasks for bindings.
 *
 * CATEGORICAL NOTE: This extracts all monomials from the free_p tree into a flat
 * list, discarding the tree structure. Used for lookup operations that don't
 * depend on the hierarchical relationship between tasks.
 */
export function collectAllTasks(flowchart) {
  if (!flowchart) return [];

  const tasks = [];

  function walk(node) {
    tasks.push({
      id: node.id,
      label: node.label,
      fields: node.fields || null,
    });

    (node.children || []).forEach(child => walk(child));

    if (node.childFlowchart) {
      walk(node.childFlowchart);
    }
  }

  walk(flowchart);
  return tasks;
}
