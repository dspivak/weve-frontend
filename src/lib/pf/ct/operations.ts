/**
 * CT Operations — pure functions for building hierarchy levels.
 *
 * CATEGORICAL NOTE: These functions centralize the construction of hierarchy
 * stack levels, ensuring the outer card (Kleisli source) and inner flowchart
 * (Kleisli target) are always properly separated.
 *
 * The original bug was caused by constructing hierarchy levels inline in UI
 * code, where the parentTask was accidentally omitted. By centralizing this
 * logic here, we prevent the bug from recurring.
 *
 * See docs/CT_INVARIANTS.md for the invariants these functions enforce.
 */

import type {
  ConversionResult,
  HierarchyLevel,
  TaskNode,
  OuterCard,
} from './types';

/**
 * Build a hierarchy stack level from a conversion result.
 *
 * This is the SINGLE place that constructs a properly-separated hierarchy
 * level from a realtime flowchart conversion. It ensures:
 * - The flowchart contains ONLY the inner elaboration (Kleisli target)
 * - The parentTask contains the outer card info (Kleisli source)
 * - The goal NEVER appears as a node inside the flowchart
 *
 * @param conversion - Result from toFullFlowchart()
 * @returns HierarchyLevel with proper outer/inner separation
 */
export function buildHierarchyLevel(conversion: ConversionResult): HierarchyLevel {
  const { outerCard, innerFlowchart } = conversion;
  return {
    flowchart: innerFlowchart?.root ?? null,
    viewContext: null,
    label: outerCard.taskName,
    originalRootCard: outerCard,
    parentTask: {
      label: outerCard.taskName,
      fields: outerCard.fields ?? null,
      outcomes: outerCard.outcomes,
    },
  };
}

/**
 * Build a hierarchy level for drilling into an elaborated task.
 *
 * CATEGORICAL NOTE: This constructs a level for viewing a sub-tree of
 * the free_p element. The parentTask (the elaborated task) becomes the
 * outer card at this level, and its childFlowchart is the inner flowchart.
 *
 * @param parentTask - The task being drilled into (has childFlowchart)
 * @param childFlowchart - The task's childFlowchart (element of free_p)
 * @returns HierarchyLevel for the drill-down view
 */
export function buildElaborationLevel(
  parentTask: TaskNode,
  childFlowchart: TaskNode,
): HierarchyLevel {
  return {
    flowchart: childFlowchart,
    viewContext: null,
    label: parentTask.label,
    parentTask: {
      label: parentTask.label,
      fields: parentTask.fields ?? null,
      outcomes: parentTask.outcomes,
    },
  };
}

/**
 * Build a hierarchy level for card view (zooming out past the root).
 *
 * CATEGORICAL NOTE: This shows the entire flowchart as a single monomial
 * (viewing free_p "from outside" as if it were just p). The card view
 * shows the outer card with its outcomes.
 *
 * @param flowchartLevel - The level being viewed as a card
 * @returns HierarchyLevel for card view
 */
export function buildCardViewLevel(flowchartLevel: HierarchyLevel): HierarchyLevel {
  return {
    flowchart: null,
    viewContext: null,
    label: 'Card View',
    cardViewOf: flowchartLevel,
  };
}
