/**
 * Realtime Flowchart Operations
 *
 * This module handles the "live" flowchart that gets built incrementally
 * during conversation. It uses a simpler structure than the full flowchart
 * format, which can be converted later when the user wants to finalize.
 *
 * Structure:
 * {
 *   goal: "Main goal label",
 *   goalSource: { userText, aiText, turn },  // Source text that established the goal
 *   goalSpec: { fieldName: { type } },        // A type: task specification data
 *   goalOutcomes: [{ id, label, source }],    // B type: possible outcomes (custom, replaces default Success/Failure)
 *   valueCurrency: "david-bucks",             // Unit for outcome values
 *   tasks: [{
 *     id,
 *     label,
 *     source: { userText, aiText, turn },    // Source text that created this task
 *     plausibility: "high" | "medium" | "low",
 *     outcomes: [{ id, label, source, likelihood?, value? }],
 *     chosenOutcome?,
 *     parentId?,
 *     spotlight?,                             // Explicitly marked as needing help
 *     bountyDescription?                      // Free-text bounty ("$500", "personal thank you")
 *   }]
 * }
 *
 * The `source` field on each element tracks the verbatim conversation text
 * that generated it, for auditability.
 */

import { percolate, percolateTree } from './ct/percolation.js';
import { propagateValues } from './ct/valuation.js';

/**
 * Create an empty realtime flowchart
 */
export function createEmptyFlowchart() {
  return {
    goal: null,
    goalSource: null,
    goalSpec: null,
    goalOutcomes: null,
    valueCurrency: null,
    tasks: []
  };
}

/**
 * Apply a single operation to the flowchart
 * Returns a new flowchart object (immutable)
 *
 * All operations can include a `source` field with { userText, aiText, turn }
 * to track the conversation that generated the change.
 */
export function applyOperation(flowchart, operation) {
  const fc = { ...flowchart };
  const source = operation.source || null;

  switch (operation.op) {
    case 'setGoal':
      fc.goal = operation.label;
      fc.goalSource = source;
      break;

    case 'setGoalSpec':
      // CATEGORICAL: Set the A type (specification data) of the outer monomial A·y^B
      fc.goalSpec = operation.spec || null;
      break;

    case 'setGoalOutcomes':
      // CATEGORICAL: Set the B type (possible outcomes) of the outer monomial A·y^B
      fc.goalOutcomes = (operation.outcomes || []).map(o => ({
        id: o.id,
        label: o.label,
        source: source || null,
        ...(o.value != null ? { value: o.value } : {})
      }));
      break;

    case 'setValueCurrency':
      fc.valueCurrency = operation.currency;
      break;

    case 'setOutcomeValues':
      // Set values on goalOutcomes (outer card outcomes) for inward propagation
      if (fc.goalOutcomes) {
        fc.goalOutcomes = fc.goalOutcomes.map(o => ({
          ...o,
          value: operation.values[o.id] != null ? operation.values[o.id] : o.value
        }));
      }
      break;

    case 'setTaskSpotlight':
      fc.tasks = fc.tasks.map(t =>
        t.id === operation.taskId
          ? { ...t, spotlight: operation.spotlight }
          : t
      );
      break;

    case 'setTaskBounty':
      fc.tasks = fc.tasks.map(t =>
        t.id === operation.taskId
          ? { ...t, bountyDescription: operation.description }
          : t
      );
      break;

    case 'addTask':
      if (!fc.tasks.find(t => t.id === operation.id)) {
        const newTask = {
          id: operation.id,
          label: operation.label,
          source,
          plausibility: null,
          outcomes: [],
          parentId: operation.parentId || null,
          afterOutcome: operation.afterOutcome || null
        };
        if (operation.afterTask) {
          // Insert after the specified task
          const idx = fc.tasks.findIndex(t => t.id === operation.afterTask);
          if (idx !== -1) {
            const copy = [...fc.tasks];
            copy.splice(idx + 1, 0, newTask);
            fc.tasks = copy;
          } else {
            fc.tasks = [...fc.tasks, newTask];
          }
        } else if (operation.beforeTask) {
          // Insert before the specified task
          const idx = fc.tasks.findIndex(t => t.id === operation.beforeTask);
          if (idx !== -1) {
            const copy = [...fc.tasks];
            copy.splice(idx, 0, newTask);
            fc.tasks = copy;
          } else {
            fc.tasks = [...fc.tasks, newTask];
          }
        } else {
          fc.tasks = [...fc.tasks, newTask];
        }
      }
      break;

    case 'removeTask':
      fc.tasks = fc.tasks.filter(t => t.id !== operation.id);
      break;

    case 'updateTask':
      fc.tasks = fc.tasks.map(t =>
        t.id === operation.id
          ? { ...t, label: operation.label, source: source || t.source }
          : t
      );
      break;

    case 'setPlausibility':
      fc.tasks = fc.tasks.map(t =>
        t.id === operation.taskId
          ? { ...t, plausibility: operation.level, source: source || t.source }
          : t
      );
      break;

    case 'addTaskOutcome':
      fc.tasks = fc.tasks.map(t => {
        if (t.id === operation.taskId) {
          const outcomes = t.outcomes || [];
          if (!outcomes.find(o => o.id === operation.id)) {
            const newOutcome = { id: operation.id, label: operation.label, source };
            if (operation.likelihood != null) {
              newOutcome.likelihood = operation.likelihood;
            }
            return {
              ...t,
              outcomes: [...outcomes, newOutcome]
            };
          }
        }
        return t;
      });
      break;

    case 'updateOutcome':
      fc.tasks = fc.tasks.map(t => ({
        ...t,
        outcomes: (t.outcomes || []).map(o =>
          o.id === operation.id
            ? { ...o, label: operation.label, source: source || o.source }
            : o
        )
      }));
      break;

    case 'removeOutcome':
      fc.tasks = fc.tasks.map(t => ({
        ...t,
        outcomes: (t.outcomes || []).filter(o => o.id !== operation.id)
      }));
      break;

    case 'setChosenOutcome':
      fc.tasks = fc.tasks.map(t =>
        t.id === operation.taskId ? { ...t, chosenOutcome: operation.outcomeId } : t
      );
      break;

    case 'setTaskLikelihoods':
      // CATEGORICAL BASIS: p/rand structure — probability distribution over directions.
      // Atomically sets likelihoods for all outcomes of a task (must sum to 100).
      fc.tasks = fc.tasks.map(t => {
        if (t.id === operation.taskId && operation.likelihoods) {
          return {
            ...t,
            outcomes: (t.outcomes || []).map(o => ({
              ...o,
              likelihood: operation.likelihoods[o.id] != null
                ? operation.likelihoods[o.id]
                : o.likelihood
            }))
          };
        }
        return t;
      });
      break;

    case 'revealParentGoal':
      // CATEGORICAL BASIS: This operation implements Kleisli composition structure.
      // When the user reveals a deeper goal, we learn that the current tree is
      // actually a sub-tree (elaboration) of a parent task.
      if (fc.goal) {
        // Demote current goal to a task
        const demotedGoalId = operation.demotedGoalId || `goal-demoted-${Date.now()}`;
        const demotedGoal = {
          id: demotedGoalId,
          label: fc.goal,
          source: fc.goalSource,
          plausibility: null,
          outcomes: [],
          parentId: null,
          afterOutcome: null
        };
        // Re-parent existing root-level tasks under the demoted goal
        fc.tasks = fc.tasks.map(t =>
          t.parentId === null ? { ...t, parentId: demotedGoalId } : t
        );
        fc.tasks = [demotedGoal, ...fc.tasks];
      }
      // Set new (deeper) goal
      fc.goal = operation.label;
      fc.goalSource = source;
      break;

    case 'clear':
      return createEmptyFlowchart();

    default:
      console.warn('Unknown operation:', operation.op);
  }

  return fc;
}

/**
 * Apply multiple operations in sequence
 */
export function applyOperations(flowchart, operations) {
  return operations.reduce((fc, op) => applyOperation(fc, op), flowchart);
}

/**
 * Check if the flowchart has any content
 */
export function hasContent(flowchart) {
  if (!flowchart) return false;
  return flowchart.goal || (flowchart.tasks && flowchart.tasks.length > 0);
}

/**
 * Convert realtime flowchart to the full flowchart structure
 * This is used when the user wants to "finalize" and work with the full editor
 *
 * CATEGORICAL NOTE: This builds a proper tree (element of free_p) from the
 * realtime sketch. The parentId relationships become nested children[] with
 * proper outcome.next connections between siblings at each level.
 */
export function toFullFlowchart(realtimeFlowchart) {
  if (!realtimeFlowchart.goal) {
    return null;
  }

  const tasks = realtimeFlowchart.tasks || [];

  // CATEGORICAL NOTE: The outerCard is the monomial A·y^B being elaborated.
  // A = goalSpec (task specification data), B = goalOutcomes (possible outcomes).
  // The innerFlowchart is an element of free_p that maps back to B via mapsTo.
  // This separation prevents the Kleisli source from appearing inside the target.
  const outerCard = {
    taskName: realtimeFlowchart.goal,
    source: realtimeFlowchart.goalSource,
    ...(realtimeFlowchart.goalSpec ? { fields: realtimeFlowchart.goalSpec } : {}),
    outcomes: realtimeFlowchart.goalOutcomes && realtimeFlowchart.goalOutcomes.length > 0
      ? realtimeFlowchart.goalOutcomes.map(o => ({ id: o.id, label: o.label, ...(o.value != null ? { value: o.value } : {}) }))
      : [
          { id: 'success', label: 'Success' },
          { id: 'failure', label: 'Failure' }
        ],
    ...(realtimeFlowchart.valueCurrency ? { valueCurrency: realtimeFlowchart.valueCurrency } : {})
  };

  // Helper: get children of a given parentId
  const getChildren = (parentId) => tasks.filter(t => t.parentId === parentId);

  // Get root-level tasks (direct children of goal)
  const rootChildren = getChildren(null);

  if (rootChildren.length === 0) {
    return { outerCard, innerFlowchart: null };
  }

  // Helper: match a terminal outcome to the best parent outcome by type.
  // The direction map free_q[leaves] → p[directions] should send success-like
  // terminals to success, failure-like to failure, partial to partial (or failure).
  const findBestMapsTo = (outcomeId, parentIds) => {
    if (!parentIds || parentIds.length === 0) return undefined;
    if (parentIds.length === 1) return parentIds[0];

    const id = outcomeId.toLowerCase();
    const isSuccess = id.includes('success') || id === 'done' || id === 'continue';
    const isFail = id.includes('fail');
    const isPartial = id.includes('partial') || id.includes('delayed');

    if (isSuccess) {
      return parentIds.find(p => p.toLowerCase().includes('success')) || parentIds[0];
    }
    if (isPartial) {
      return parentIds.find(p => p.toLowerCase().includes('partial'))
        || parentIds.find(p => p.toLowerCase().includes('fail'))
        || parentIds[parentIds.length - 1];
    }
    if (isFail) {
      return parentIds.find(p => p.toLowerCase().includes('fail'))
        || parentIds[parentIds.length - 1];
    }
    // Unknown type — default to last (failure-like, safer than claiming success)
    return parentIds[parentIds.length - 1];
  };

  // CATEGORICAL NOTE: This builds an element of the free operad on Kl(free_p).
  // Each task can be elaborated (a Kleisli arrow), and tasks within that
  // elaboration can themselves be elaborated — nesting arbitrarily.
  //
  // The tree has two composition directions:
  //   - children[]: sibling tasks at the same level, connected via outcome.next
  //   - childFlowchart: elaboration (a nested Kleisli arrow), with terminals
  //     mapping back to the enclosing task's outcomes via mapsTo
  //
  // The continuation parameter is NOT used — elaboration terminals close
  // the Kleisli arrow via mapsTo, and the enclosing task's outcome.next
  // connects to the next sibling. No cross-boundary stitching.
  const buildTaskNode = (task, siblings, parentOutcomeIds) => {
    const idx = siblings.indexOf(task);
    const isLast = idx === siblings.length - 1;
    const nextSibling = isLast ? null : siblings[idx + 1];
    const elaborationChildren = getChildren(task.id);

    // Build outcomes — success connects to next SIBLING, not into elaboration.
    // The elaboration is a separate Kleisli arrow accessed via childFlowchart.
    let outcomes;
    let taskOutcomeIds; // This task's outcome IDs (for elaboration mapsTo scoping)

    if (task.outcomes && task.outcomes.length > 0) {
      taskOutcomeIds = task.outcomes.map(o => o.id);
      const successNext = nextSibling ? { task: nextSibling.id } : null;

      outcomes = task.outcomes.map(o => {
        const isSuccessOutcome = o.id === 'outcome-success' || o.id === 'continue';
        const next = o.next || (isSuccessOutcome ? successNext : null);
        return {
          id: o.id,
          label: o.label,
          source: o.source,
          next,
          // Terminal outcomes need mapsTo to close the Kleisli arrow
          ...((!next && parentOutcomeIds) ? { mapsTo: findBestMapsTo(o.id, parentOutcomeIds) } : {}),
          // Carry p/rand likelihood through conversion
          ...(o.likelihood != null ? { likelihood: o.likelihood } : {})
        };
      });
    } else if (elaborationChildren.length > 0) {
      // No explicit outcomes but has elaboration — generate Success/Failure.
      // The elaboration is a Kleisli arrow whose terminals mapsTo these outcomes.
      // "Continue" would lose all nuance; Success/Failure gives meaningful targets.
      taskOutcomeIds = ['outcome-success', 'outcome-fail'];
      outcomes = [
        {
          id: 'outcome-success',
          label: 'Success',
          next: nextSibling ? { task: nextSibling.id } : null,
          ...(!nextSibling && parentOutcomeIds ? { mapsTo: findBestMapsTo('outcome-success', parentOutcomeIds) } : {})
        },
        {
          id: 'outcome-fail',
          label: 'Failure',
          next: null,
          ...(parentOutcomeIds ? { mapsTo: findBestMapsTo('outcome-fail', parentOutcomeIds) } : {})
        }
      ];
    } else if (nextSibling) {
      // No explicit outcomes, no elaboration, has next sibling — generate continue
      taskOutcomeIds = ['continue'];
      outcomes = [
        {
          id: 'continue',
          label: 'Continue',
          next: { task: nextSibling.id }
        }
      ];
    } else {
      // True terminal — close the Kleisli arrow with mapsTo
      taskOutcomeIds = ['done'];
      outcomes = [
        {
          id: 'done',
          label: 'Done',
          next: null,
          ...(parentOutcomeIds ? { mapsTo: findBestMapsTo('done', parentOutcomeIds) } : {})
        }
      ];
    }

    // Build elaboration as childFlowchart (nested Kleisli arrow).
    // Terminals in the elaboration mapsTo THIS task's outcome IDs,
    // not the outer card's — each Kleisli level has its own scope.
    let childFlowchart = null;
    if (elaborationChildren.length > 0) {
      const elabRoot = buildTaskNode(
        elaborationChildren[0], elaborationChildren, taskOutcomeIds
      );
      if (elaborationChildren.length > 1) {
        const elabSiblings = elaborationChildren.slice(1).map(
          s => buildTaskNode(s, elaborationChildren, taskOutcomeIds)
        );
        elabRoot.children = [...(elabRoot.children || []), ...elabSiblings];
      }
      childFlowchart = elabRoot;
    }

    return {
      id: task.id,
      label: task.label,
      source: task.source,
      plausibility: task.plausibility,
      spotlight: task.spotlight || false,
      bountyDescription: task.bountyDescription || null,
      outcomes,
      chosenOutcome: outcomes[0]?.id || null,
      children: [], // filled by parent with sibling nodes
      ...(childFlowchart ? { childFlowchart } : {})
    };
  };

  // Build inner flowchart: first root task is the root, rest are siblings.
  // Siblings are stored in innerRoot.children[], connected via outcome.next.
  const parentOutcomeIds = outerCard.outcomes.map(o => o.id);
  const innerRoot = buildTaskNode(rootChildren[0], rootChildren, parentOutcomeIds);

  if (rootChildren.length > 1) {
    const siblingNodes = rootChildren.slice(1).map(
      sibling => buildTaskNode(sibling, rootChildren, parentOutcomeIds)
    );
    innerRoot.children = siblingNodes;
  }

  // CATEGORICAL: Percolate likelihoods upward through the tree.
  // free_{p/rand} → (free_p)/rand — inner likelihoods compose to outer.
  const percolatedInner = percolateTree(innerRoot);

  // Compute outer card likelihoods from percolated inner tree.
  // Create a virtual task wrapping the inner tree so percolate() can work.
  const virtualTask = {
    outcomes: outerCard.outcomes.map(o => ({ ...o })),
    childFlowchart: percolatedInner
  };
  const outerLikelihoods = percolate(virtualTask);
  if (outerLikelihoods) {
    outerCard.outcomes = outerCard.outcomes.map(o => ({
      ...o,
      ...(outerLikelihoods[o.id] != null ? { likelihood: outerLikelihoods[o.id] } : {})
    }));
  }

  // CATEGORICAL: Propagate values INWARD through the tree (reverse martingale).
  // Dual of percolation: outer outcome values → inner task derivedValues.
  // Requires likelihoods (from percolation above) for expected value computation.
  const valuedInner = propagateValues(outerCard, percolatedInner);

  return { outerCard, innerFlowchart: valuedInner };
}

/**
 * Create a simple visualization-friendly structure
 * Returns { nodes: [], edges: [] } for rendering
 */
export function toVisualization(realtimeFlowchart) {
  const nodes = [];
  const edges = [];

  if (realtimeFlowchart.goal) {
    // Goal node
    nodes.push({
      id: 'goal',
      type: 'goal',
      label: realtimeFlowchart.goal,
      source: realtimeFlowchart.goalSource
    });

    // Task nodes
    realtimeFlowchart.tasks.forEach((task, idx) => {
      nodes.push({
        id: task.id,
        type: 'task',
        label: task.label,
        source: task.source,
        plausibility: task.plausibility,
        outcomes: task.outcomes || [],
        chosenOutcome: task.chosenOutcome
      });

      // Edge from goal to first task (or between tasks)
      if (idx === 0) {
        edges.push({ from: 'goal', to: task.id });
      } else {
        edges.push({ from: realtimeFlowchart.tasks[idx - 1].id, to: task.id });
      }
    });
  }

  return { nodes, edges };
}
