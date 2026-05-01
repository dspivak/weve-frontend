/**
 * CT Construction — builds valid flowchart structures from realtime data.
 *
 * CATEGORICAL NOTE: This module implements the construction of elements of free_p
 * (the free monad on polynomial functors) from the simpler realtime flowchart
 * format. The key invariant: the outer card (Kleisli source) and inner flowchart
 * (Kleisli target) are ALWAYS returned separately in a ConversionResult.
 *
 * This prevents the original bug where the goal appeared as a node inside
 * its own inner flowchart.
 *
 * See docs/CATEGORY_THEORY.md for the mathematical model.
 */

import type {
  RealtimeFlowchart,
  RealtimeTask,
  ConversionResult,
  OuterCard,
  InnerFlowchart,
  TaskNode,
  Outcome,
} from './types';

/**
 * Convert a realtime flowchart to the full flowchart structure.
 *
 * Returns { outerCard, innerFlowchart } where:
 *   - outerCard: the goal as a parent task card (Kleisli source monomial)
 *   - innerFlowchart: the tree of tasks (element of free_p, Kleisli target)
 *
 * Terminal outcomes in the inner flowchart have mapsTo pointing to outer card
 * outcomes, completing the Kleisli arrow specification.
 *
 * Returns null if no goal is set.
 *
 * @param rt - The realtime flowchart (simple incremental structure)
 * @returns ConversionResult with separated outer card and inner flowchart, or null
 */
export function toFullFlowchart(rt: RealtimeFlowchart): ConversionResult | null {
  if (!rt.goal) {
    return null;
  }

  const tasks = rt.tasks || [];

  // Build the outer card — the goal as a parent task (Kleisli source)
  const outerCard: OuterCard = {
    _tag: 'OuterCard',
    taskName: rt.goal,
    source: rt.goalSource,
    outcomes: [
      { id: 'success', label: 'Success' },
      { id: 'failure', label: 'Failure' },
    ],
  };

  // Get root-level tasks (direct children of goal)
  const getChildren = (parentId: string | null): RealtimeTask[] =>
    tasks.filter(t => t.parentId === parentId);

  const rootChildren = getChildren(null);

  if (rootChildren.length === 0) {
    return { outerCard, innerFlowchart: null };
  }

  const parentOutcomeIds = outerCard.outcomes.map(o => o.id);

  // Recursively build a task node with its nested children
  const buildTaskNode = (
    task: RealtimeTask,
    siblings: RealtimeTask[],
    outerOutcomeIds: string[],
  ): TaskNode => {
    const idx = siblings.indexOf(task);
    const isLast = idx === siblings.length - 1;
    const nextSibling = isLast ? null : siblings[idx + 1];
    const children = getChildren(task.id);

    // Build outcomes
    let outcomes: Outcome[];
    if (task.outcomes && task.outcomes.length > 0) {
      outcomes = task.outcomes.map(o => ({
        id: o.id,
        label: o.label,
        source: o.source,
        next: (o as any).next || null,
        // Terminal outcomes need mapsTo to close the Kleisli arrow
        ...((!(o as any).next && outerOutcomeIds.length > 0)
          ? { mapsTo: outerOutcomeIds[0] }
          : {}),
      }));
    } else if (children.length > 0) {
      // Has children: outcome leads to first child
      outcomes = [
        {
          id: 'continue',
          label: 'Continue',
          next: { task: children[0].id },
        },
      ];
    } else if (nextSibling) {
      // Non-last leaf: connect to next sibling
      outcomes = [
        {
          id: 'continue',
          label: 'Continue',
          next: { task: nextSibling.id },
        },
      ];
    } else {
      // True terminal leaf — close the Kleisli arrow with mapsTo
      outcomes = [
        {
          id: 'done',
          label: 'Done',
          next: null,
          ...(outerOutcomeIds.length > 0 ? { mapsTo: outerOutcomeIds[0] } : {}),
        },
      ];
    }

    return {
      id: task.id,
      label: task.label,
      source: task.source,
      plausibility: task.plausibility,
      outcomes,
      chosenOutcome: outcomes[0]?.id || null,
      children: children.map(child =>
        buildTaskNode(child, children, outerOutcomeIds)
      ),
    };
  };

  // Build inner flowchart: first root task is root, rest are siblings
  const innerRoot = buildTaskNode(rootChildren[0], rootChildren, parentOutcomeIds);

  const innerFlowchart: InnerFlowchart = {
    _tag: 'InnerFlowchart',
    root: innerRoot,
  };

  return { outerCard, innerFlowchart };
}
