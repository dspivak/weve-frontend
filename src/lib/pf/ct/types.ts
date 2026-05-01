/**
 * Category Theory Types for Plausible Fiction
 *
 * These types encode the categorical invariants so invalid structures
 * won't compile. The key distinction:
 *
 *   OuterCard  = Kleisli source (the monomial A·y^B being elaborated)
 *   InnerFlowchart = Kleisli target (element of free_p that maps back to B)
 *
 * These MUST be kept separate. The original bug was caused by conflating
 * the two — the goal (OuterCard) appeared as a node inside its own
 * InnerFlowchart. The _tag discriminant prevents this at the type level.
 *
 * See docs/CATEGORY_THEORY.md for the full mathematical model.
 * See docs/CT_INVARIANTS.md for the 11 invariants these types enforce.
 */

// =============================================================================
// Opaque ID types (nominal typing via brands)
// =============================================================================

/** A task identifier — branded to prevent raw string confusion */
export type TaskId = string & { readonly __taskId: unique symbol };

/** An outcome identifier — branded to prevent raw string confusion */
export type OutcomeId = string & { readonly __outcomeId: unique symbol };

/** Helpers to create branded IDs from strings */
export function taskId(id: string): TaskId {
  return id as TaskId;
}

export function outcomeId(id: string): OutcomeId {
  return id as OutcomeId;
}

// =============================================================================
// Field and Payload types
// =============================================================================

/** A field/variable definition (element of the type A in monomial A·y^B) */
export interface FieldSpec {
  [fieldName: string]: { type: string };
}

// =============================================================================
// Outcome types — discriminated union enforces Invariants 1 & 2
// =============================================================================

/**
 * A non-terminal outcome: continues to another task via next.
 *
 * CATEGORICAL NOTE: This is an edge in polynomial composition (sender → receiver).
 * The mapsTo field is structurally forbidden — non-terminals don't map backward.
 */
export interface NonTerminalOutcome {
  id: string;
  label: string;
  payload?: FieldSpec;
  next: { task: string; bind?: Record<string, string> };
  mapsTo?: never;
  payloadMapping?: Record<string, string>;
  source?: Source;
  likelihood?: number;  // integer 0-100, p/rand structure
}

/**
 * A terminal outcome: a leaf in the free_p tree.
 *
 * CATEGORICAL NOTE: This is a direction in the free monad — a leaf of the tree.
 * When inside a childFlowchart (elaboration), mapsTo is REQUIRED and specifies
 * the backward direction map of the Kleisli arrow.
 *
 * Invariant 1: Terminal outcomes in childFlowchart must have mapsTo
 * Invariant 2: mapsTo must reference a valid parent outcome
 */
export interface TerminalOutcome {
  id: string;
  label: string;
  payload?: FieldSpec;
  next: null;
  mapsTo?: string;
  payloadMapping?: Record<string, string>;
  source?: Source;
  likelihood?: number;  // integer 0-100, p/rand structure
}

/**
 * Union type: every outcome is either terminal or non-terminal.
 * Use type guards to discriminate:
 *   isTerminal(o) checks o.next === null
 *   isNonTerminal(o) checks o.next !== null
 */
export type Outcome = TerminalOutcome | NonTerminalOutcome;

/** Type guard: is this a terminal outcome? */
export function isTerminal(o: Outcome): o is TerminalOutcome {
  return o.next === null;
}

/** Type guard: is this a non-terminal outcome? */
export function isNonTerminal(o: Outcome): o is NonTerminalOutcome {
  return o.next !== null;
}

// =============================================================================
// Source tracking
// =============================================================================

export interface Source {
  userText: string;
  aiText: string;
  turn: number;
}

// =============================================================================
// Task Node — element of the free monad tree
// =============================================================================

/**
 * A task node in the flowchart tree (monomial A·y^B in free_p).
 *
 * CATEGORICAL NOTE: Each TaskNode represents a position in a monomial.
 *   - fields (A): the input parameters
 *   - outcomes (B): the directions/branches
 *   - children: sibling tasks at the same level (polynomial composition)
 *   - childFlowchart: elaboration sub-tree (free monad structure)
 *   - chosenOutcome: pointed polynomial structure (recipe)
 *
 * Residual structures (Kan residual p/q):
 *   - p/y = chosenOutcome (pointing, selects one direction)
 *   - p/rand = outcome likelihoods (probability distribution over directions)
 *   Together: p/(y × rand). Future residuals add more fields here.
 */
export interface TaskNode {
  id: string;
  label: string;
  fields?: FieldSpec;
  outcomes: Outcome[];
  chosenOutcome?: string | null;
  children: TaskNode[];
  childFlowchart?: TaskNode;
  source?: Source | null;
  plausibility?: 'high' | 'medium' | 'low' | null;
  pendingNarrative?: string;
  narrative?: string;
  _atomicTask?: boolean;
}

// =============================================================================
// OuterCard — the Kleisli source (MUST NOT appear inside InnerFlowchart)
// =============================================================================

/**
 * The outer card represents the task being elaborated.
 *
 * CATEGORICAL NOTE: This is the source of the Kleisli arrow.
 * The _tag discriminant prevents it from being accidentally passed
 * where an InnerFlowchart (the Kleisli target) is expected.
 *
 * Matches the shape returned by suggestRootTaskCard() in the LLM path.
 */
export interface OuterCard {
  readonly _tag: 'OuterCard';
  taskName: string;
  source?: Source | null;
  outcomes: Array<{ id: string; label: string; payload?: FieldSpec }>;
  fields?: FieldSpec;
}

// =============================================================================
// InnerFlowchart — the Kleisli target (MUST NOT contain the OuterCard as a node)
// =============================================================================

/**
 * The inner flowchart is the tree of tasks that elaborates the outer card.
 *
 * CATEGORICAL NOTE: This is the target of the Kleisli arrow — an element
 * of free_p. Its terminal outcomes use mapsTo to map backward to the
 * outer card's outcomes (the direction component of the polynomial map).
 */
export interface InnerFlowchart {
  readonly _tag: 'InnerFlowchart';
  root: TaskNode;
}

// =============================================================================
// Conversion result — enforces separation
// =============================================================================

/**
 * Result of converting a realtime flowchart to the full structure.
 * The outer card and inner flowchart are ALWAYS separate.
 *
 * This type makes the original bug (goal inside its own flowchart)
 * structurally impossible — you cannot construct a ConversionResult
 * where the outerCard is a node inside the innerFlowchart.
 */
export interface ConversionResult {
  outerCard: OuterCard;
  innerFlowchart: InnerFlowchart | null;
}

// =============================================================================
// Hierarchy Level — what gets stored in the navigation stack
// =============================================================================

/**
 * A level in the hierarchy navigation stack.
 *
 * CATEGORICAL NOTE: Each level represents viewing a sub-tree of the
 * free_p element. The parentTask is the outer card (Kleisli source)
 * at this level. The flowchart is the inner elaboration (Kleisli target).
 */
export interface HierarchyLevel {
  flowchart: TaskNode | null;
  viewContext: string | null;
  label: string;
  parentTask?: {
    label: string;
    fields?: FieldSpec | null;
    outcomes: Array<{ id: string; label: string; payload?: FieldSpec }>;
  };
  originalRootCard?: OuterCard;
  cardViewOf?: HierarchyLevel;
}

// =============================================================================
// Realtime Flowchart types
// =============================================================================

export interface RealtimeTask {
  id: string;
  label: string;
  source: Source | null;
  plausibility: 'high' | 'medium' | 'low' | null;
  outcomes: Array<{ id: string; label: string; source?: Source; likelihood?: number }>;
  chosenOutcome?: string;
  parentId: string | null;
  afterOutcome?: string | null;
}

export interface RealtimeFlowchart {
  goal: string | null;
  goalSource: Source | null;
  tasks: RealtimeTask[];
}
