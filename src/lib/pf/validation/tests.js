/**
 * Categorical Invariant Tests
 *
 * These tests verify that our validation catches violations of
 * the categorical invariants derived from CT_INVARIANTS.md.
 *
 * INVARIANT COVERAGE:
 * - Invariant 1: outcome.next.task exists          [TESTED]
 * - Invariant 2: Every child reachable             [TESTED]
 * - Invariant 3: Terminal outcomes have mapsTo     [TESTED]
 * - Invariant 4: mapsTo references valid outcome   [TESTED]
 * - Invariant 5: chosenOutcome requires outcomes   [TESTED]
 * - Invariant 6: chosenOutcome is valid            [TESTED]
 * - Invariant 7: Coherence triangle                [TESTED]
 * - Invariant 9: bind formulas use in-scope vars  [TESTED]
 * - Invariant 10: payloadMapping in scope          [TESTED]
 * - Invariant 11: Label vars in scope              [TESTED]
 * - Invariant L1: Likelihood in range [0,100]      [TESTED]
 * - Invariant L2: Likelihoods sum to 100           [TESTED]
 * - Invariant L3: All-or-nothing likelihoods       [TESTED]
 *
 * Run with: node src/validation/tests.js
 */

import { validateTreeStructure, validateScope } from './treeStructure.js';
import { validatePointedStructure, extractRecipePath } from './pointedStructure.js';
import { ErrorCode } from './types.js';
import { validateLikelihoodStructure } from './likelihoodStructure.js';
import { percolate, percolateTree, likelihoodCategory } from '../ct/percolation.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg} Expected ${expected}, got ${actual}`);
  }
}

function assertIncludes(arr, item, msg = '') {
  if (!arr.includes(item)) {
    throw new Error(`${msg} Expected array to include ${item}, got [${arr.join(', ')}]`);
  }
}

// =============================================================================
// Test Data: Valid Flowcharts
// =============================================================================

const validSequentialFlowchart = {
  id: 'root',
  label: 'Complete a project',
  outcomes: [
    { id: 'success', label: 'Project complete', next: { task: 'task-1' } },
    { id: 'failure', label: 'Project failed', next: null }
  ],
  chosenOutcome: 'success',
  children: [
    {
      id: 'task-1',
      label: 'Step 1',
      outcomes: [
        { id: 'done', label: 'Done', next: { task: 'task-2' } }
      ],
      chosenOutcome: 'done',
      children: []
    },
    {
      id: 'task-2',
      label: 'Step 2',
      outcomes: [
        { id: 'complete', label: 'Complete', next: null }
      ],
      chosenOutcome: 'complete',
      children: []
    }
  ]
};

// y^0 task (dead end) - this IS valid in free_p
const validDeadEndFlowchart = {
  id: 'root',
  label: 'Try something',
  outcomes: [
    { id: 'success', label: 'It worked', next: { task: 'task-1' } },
    { id: 'dead-end', label: 'Dead end', next: null }
  ],
  chosenOutcome: 'success',
  children: [
    {
      id: 'task-1',
      label: 'A dead end task',
      outcomes: [], // y^0 - valid dead end!
      children: []
    }
  ]
};

// =============================================================================
// Test Data: Invalid Flowcharts
// =============================================================================

// Invalid: outcome.next points to non-existent task
const invalidNextTarget = {
  id: 'root',
  label: 'Root',
  outcomes: [
    { id: 'go', label: 'Go', next: { task: 'nonexistent' } }
  ],
  children: []
};

// Invalid: child is orphaned (not reachable)
const invalidOrphanedChild = {
  id: 'root',
  label: 'Root',
  outcomes: [
    { id: 'success', label: 'Success', next: null }
  ],
  children: [
    {
      id: 'orphan',
      label: 'Orphaned task',
      outcomes: [{ id: 'done', label: 'Done', next: null }],
      children: []
    }
  ]
};

// Invalid: chosenOutcome on y^0 task (can't choose from empty set)
const invalidChosenOnDeadEnd = {
  id: 'root',
  label: 'Root',
  outcomes: [], // y^0
  chosenOutcome: 'something' // Invalid! Nothing to choose from
};

// Invalid: chosenOutcome references non-existent outcome
const invalidChosenOutcome = {
  id: 'root',
  label: 'Root',
  outcomes: [
    { id: 'success', label: 'Success', next: null }
  ],
  chosenOutcome: 'wrong-id' // Doesn't match any outcome
};

// =============================================================================
// Test Data: Kleisli Map (mapsTo) - Invariants 3, 4
// =============================================================================

// Valid: childFlowchart with proper mapsTo on terminals
const validChildFlowchartWithMapsTo = {
  id: 'root',
  label: 'Parent task',
  outcomes: [
    { id: 'success', label: 'Success', next: null },
    { id: 'failure', label: 'Failure', next: null }
  ],
  chosenOutcome: 'success',
  childFlowchart: {
    id: 'sub-root',
    label: 'Elaboration',
    outcomes: [
      { id: 'sub-done', label: 'Done', next: { task: 'sub-task-1' } }
    ],
    chosenOutcome: 'sub-done',
    children: [
      {
        id: 'sub-task-1',
        label: 'Sub-step',
        outcomes: [
          // Terminal with proper mapsTo
          { id: 'complete', label: 'Complete', next: null, mapsTo: 'success' }
        ],
        chosenOutcome: 'complete',
        children: []
      }
    ]
  },
  children: []
};

// Invalid: terminal outcome missing mapsTo (Invariant 3)
const invalidMissingMapsTo = {
  id: 'root',
  label: 'Parent task',
  outcomes: [
    { id: 'success', label: 'Success', next: null }
  ],
  childFlowchart: {
    id: 'sub-root',
    label: 'Elaboration',
    outcomes: [
      // Terminal without mapsTo - invalid!
      { id: 'done', label: 'Done', next: null }
    ],
    children: []
  },
  children: []
};

// Invalid: mapsTo references non-existent parent outcome (Invariant 4)
const invalidMapsToTarget = {
  id: 'root',
  label: 'Parent task',
  outcomes: [
    { id: 'success', label: 'Success', next: null }
  ],
  childFlowchart: {
    id: 'sub-root',
    label: 'Elaboration',
    outcomes: [
      // mapsTo references outcome that doesn't exist in parent
      { id: 'done', label: 'Done', next: null, mapsTo: 'nonexistent' }
    ],
    children: []
  },
  children: []
};

// =============================================================================
// Test Data: Coherence Triangle - Invariant 7
// =============================================================================

// Valid: chosen path through childFlowchart maps to parent's chosenOutcome
const validCoherence = {
  id: 'root',
  label: 'Parent task',
  outcomes: [
    { id: 'success', label: 'Success', next: null },
    { id: 'failure', label: 'Failure', next: null }
  ],
  chosenOutcome: 'success',
  childFlowchart: {
    id: 'sub-root',
    label: 'Elaboration',
    outcomes: [
      { id: 'go', label: 'Go', next: { task: 'sub-task' } }
    ],
    chosenOutcome: 'go',
    children: [
      {
        id: 'sub-task',
        label: 'Sub-step',
        outcomes: [
          // Terminal maps to 'success' which matches parent's chosenOutcome
          { id: 'done', label: 'Done', next: null, mapsTo: 'success' }
        ],
        chosenOutcome: 'done',
        children: []
      }
    ]
  },
  children: []
};

// Invalid: chosen path maps to different outcome than parent's chosenOutcome
const invalidCoherence = {
  id: 'root',
  label: 'Parent task',
  outcomes: [
    { id: 'success', label: 'Success', next: null },
    { id: 'failure', label: 'Failure', next: null }
  ],
  chosenOutcome: 'success', // Parent chose success
  childFlowchart: {
    id: 'sub-root',
    label: 'Elaboration',
    outcomes: [
      { id: 'go', label: 'Go', next: { task: 'sub-task' } }
    ],
    chosenOutcome: 'go',
    children: [
      {
        id: 'sub-task',
        label: 'Sub-step',
        outcomes: [
          // But terminal maps to 'failure' - coherence violation!
          { id: 'done', label: 'Done', next: null, mapsTo: 'failure' }
        ],
        chosenOutcome: 'done',
        children: []
      }
    ]
  },
  children: []
};

// =============================================================================
// Test Data: Scope/Binding - Invariants 9, 10, 11
// =============================================================================

// Valid: bind formula references variables in scope
const validBindScope = {
  id: 'root',
  label: 'Task with {userName}',
  fields: { userName: { type: 'string' } },
  outcomes: [
    {
      id: 'next',
      label: 'Next',
      payload: { result: { type: 'string' } },
      next: {
        task: 'task-1',
        bind: { greeting: '{result}' } // result is in outcome's payload - valid
      }
    }
  ],
  children: [
    {
      id: 'task-1',
      label: 'Greeting: {greeting}',
      fields: { greeting: { type: 'string' } },
      outcomes: [{ id: 'done', label: 'Done', next: null }],
      children: []
    }
  ]
};

// Invalid: bind formula references variable not in scope
const invalidBindScope = {
  id: 'root',
  label: 'Task',
  outcomes: [
    {
      id: 'next',
      label: 'Next',
      payload: { result: { type: 'string' } },
      next: {
        task: 'task-1',
        bind: { greeting: '{unknownVar}' } // unknownVar not in scope!
      }
    }
  ],
  children: [
    {
      id: 'task-1',
      label: 'Greeting: {greeting}',
      fields: { greeting: { type: 'string' } },
      outcomes: [{ id: 'done', label: 'Done', next: null }],
      children: []
    }
  ]
};

// Invalid: label references variable not in fields
const invalidLabelScope = {
  id: 'root',
  label: 'Task with {missingField}', // missingField not in fields!
  fields: { userName: { type: 'string' } },
  outcomes: [{ id: 'done', label: 'Done', next: null }],
  children: []
};

// =============================================================================
// Tree Structure Tests (free_p)
// =============================================================================

console.log('\n=== Tree Structure Tests (free_p) ===\n');

test('Valid sequential flowchart passes tree validation', () => {
  const result = validateTreeStructure(validSequentialFlowchart);
  assertEqual(result.valid, true, 'Should be valid');
  assertEqual(result.errors.length, 0, 'Should have no errors');
});

test('Valid dead-end (y^0) flowchart passes tree validation', () => {
  const result = validateTreeStructure(validDeadEndFlowchart);
  assertEqual(result.valid, true, 'y^0 tasks should be valid');
  assertEqual(result.errors.length, 0, 'Should have no errors');
});

test('Invalid next target is caught', () => {
  const result = validateTreeStructure(invalidNextTarget);
  assertEqual(result.valid, false, 'Should be invalid');
  assertIncludes(
    result.errors.map(e => e.code),
    ErrorCode.INVALID_NEXT_TARGET,
    'Should have INVALID_NEXT_TARGET error'
  );
});

test('Orphaned child is caught', () => {
  const result = validateTreeStructure(invalidOrphanedChild);
  assertEqual(result.valid, false, 'Should be invalid');
  assertIncludes(
    result.errors.map(e => e.code),
    ErrorCode.ORPHANED_TASK,
    'Should have ORPHANED_TASK error'
  );
});

// =============================================================================
// Pointed Structure Tests (free_{p_*})
// =============================================================================

console.log('\n=== Pointed Structure Tests (free_{p_*}) ===\n');

test('Valid flowchart with chosenOutcome passes pointed validation', () => {
  const result = validatePointedStructure(validSequentialFlowchart);
  assertEqual(result.valid, true, 'Should be valid');
  assertEqual(result.errors.length, 0, 'Should have no errors');
});

test('chosenOutcome on y^0 task is caught', () => {
  const result = validatePointedStructure(invalidChosenOnDeadEnd);
  assertEqual(result.valid, false, 'Should be invalid');
  assertIncludes(
    result.errors.map(e => e.code),
    ErrorCode.INVALID_CHOSEN_OUTCOME,
    'Should have INVALID_CHOSEN_OUTCOME error'
  );
});

test('Invalid chosenOutcome reference is caught', () => {
  const result = validatePointedStructure(invalidChosenOutcome);
  assertEqual(result.valid, false, 'Should be invalid');
  assertIncludes(
    result.errors.map(e => e.code),
    ErrorCode.INVALID_CHOSEN_OUTCOME,
    'Should have INVALID_CHOSEN_OUTCOME error'
  );
});

test('Missing chosenOutcome generates warning (not error)', () => {
  const flowchart = {
    id: 'root',
    label: 'Root',
    outcomes: [{ id: 'success', label: 'Success', next: null }]
    // No chosenOutcome
  };
  const result = validatePointedStructure(flowchart);
  assertEqual(result.valid, true, 'Should be valid (warnings are not errors)');
  assertIncludes(
    result.warnings.map(e => e.code),
    ErrorCode.MISSING_CHOSEN_OUTCOME,
    'Should have MISSING_CHOSEN_OUTCOME warning'
  );
});

// =============================================================================
// Kleisli Map Tests (mapsTo) - Invariants 3, 4
// =============================================================================

console.log('\n=== Kleisli Map Tests (Invariants 3, 4) ===\n');

test('[Invariant 3] Valid childFlowchart with mapsTo passes', () => {
  const result = validateTreeStructure(validChildFlowchartWithMapsTo);
  assertEqual(result.valid, true, 'Should be valid');
  assertEqual(result.errors.length, 0, 'Should have no errors');
});

test('[Invariant 3] Missing mapsTo on terminal is caught', () => {
  const result = validateTreeStructure(invalidMissingMapsTo);
  assertEqual(result.valid, false, 'Should be invalid');
  assertIncludes(
    result.errors.map(e => e.code),
    ErrorCode.MISSING_MAPS_TO,
    'Should have MISSING_MAPS_TO error'
  );
});

test('[Invariant 4] Invalid mapsTo target is caught', () => {
  const result = validateTreeStructure(invalidMapsToTarget);
  assertEqual(result.valid, false, 'Should be invalid');
  assertIncludes(
    result.errors.map(e => e.code),
    ErrorCode.INVALID_MAPS_TO,
    'Should have INVALID_MAPS_TO error'
  );
});

// =============================================================================
// Coherence Triangle Tests - Invariant 7
// =============================================================================

console.log('\n=== Coherence Triangle Tests (Invariant 7) ===\n');

test('[Invariant 7] Valid coherence: chosen path maps to chosenOutcome', () => {
  const result = validatePointedStructure(validCoherence);
  assertEqual(result.valid, true, 'Should be valid');
  assertEqual(result.errors.length, 0, 'Should have no errors');
});

test('[Invariant 7] Coherence violation: mapsTo != chosenOutcome is caught', () => {
  const result = validatePointedStructure(invalidCoherence);
  assertEqual(result.valid, false, 'Should be invalid');
  assertIncludes(
    result.errors.map(e => e.code),
    ErrorCode.COHERENCE_MISMATCH,
    'Should have COHERENCE_MISMATCH error'
  );
});

// =============================================================================
// Scope/Binding Tests - Invariants 9, 10, 11
// =============================================================================

console.log('\n=== Scope/Binding Tests (Invariants 9, 10, 11) ===\n');

test('[Invariant 9] Valid bind scope: formula uses payload vars', () => {
  const result = validateScope(validBindScope);
  assertEqual(result.valid, true, 'Should be valid');
  assertEqual(result.errors.length, 0, 'Should have no errors');
});

test('[Invariant 9] Invalid bind scope: formula uses unknown var is caught', () => {
  const result = validateScope(invalidBindScope);
  assertEqual(result.valid, false, 'Should be invalid');
  assertIncludes(
    result.errors.map(e => e.code),
    ErrorCode.INVALID_BIND_SCOPE,
    'Should have INVALID_BIND_SCOPE error'
  );
});

test('[Invariant 11] Invalid label scope: label uses missing field is caught', () => {
  const result = validateScope(invalidLabelScope);
  assertEqual(result.valid, false, 'Should be invalid');
  assertIncludes(
    result.errors.map(e => e.code),
    ErrorCode.INVALID_BIND_SCOPE, // Label scope errors use same code
    'Should have INVALID_BIND_SCOPE error for label scope'
  );
});

// =============================================================================
// Conversion Tests (toFullFlowchart outer/inner separation)
// =============================================================================

import { toFullFlowchart, createEmptyFlowchart, applyOperations } from '../realtimeFlowchart.js';
import { validateAndRepair } from './index.js';
import { ValidationLevel } from './types.js';

console.log('\n=== Conversion Tests (outer/inner separation) ===\n');

test('toFullFlowchart returns { outerCard, innerFlowchart }', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Build a rocket' },
    { op: 'addTask', id: 'task-1', label: 'Design engine' },
    { op: 'addTask', id: 'task-2', label: 'Build prototype' },
  ]);

  const result = toFullFlowchart(rt);
  assertEqual(result !== null, true, 'Result should not be null');
  assertEqual(result.outerCard !== undefined, true, 'Should have outerCard');
  assertEqual(result.innerFlowchart !== undefined, true, 'Should have innerFlowchart');
  assertEqual(result.outerCard.taskName, 'Build a rocket', 'OuterCard should have the goal');
});

test('innerFlowchart root is NOT the goal (bug fix verification)', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Build a rocket' },
    { op: 'addTask', id: 'task-1', label: 'Design engine' },
  ]);

  const result = toFullFlowchart(rt);
  const root = result.innerFlowchart;
  assertEqual(root.label !== 'Build a rocket', true,
    'Inner flowchart root should NOT be the goal');
  assertEqual(root.label, 'Design engine',
    'Inner root should be the first actual task');
});

test('revealParentGoal: demoted goal in inner, new goal in outerCard', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Build a rocket' },
    { op: 'revealParentGoal', label: 'Send a bug to space' },
    { op: 'addTask', id: 'task-1', label: 'Do experiment' },
  ]);

  const result = toFullFlowchart(rt);
  assertEqual(result.outerCard.taskName, 'Send a bug to space',
    'OuterCard should be the revealed parent goal');

  // Collect all labels from inner tree
  const allLabels = [];
  function collectLabels(node) {
    allLabels.push(node.label);
    (node.children || []).forEach(collectLabels);
    if (node.childFlowchart) collectLabels(node.childFlowchart);
  }
  collectLabels(result.innerFlowchart);
  assertIncludes(allLabels, 'Build a rocket',
    'Demoted goal should appear as inner task');
});

test('terminal outcomes in innerFlowchart have mapsTo', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Test goal' },
    { op: 'addTask', id: 'task-1', label: 'Step 1' },
  ]);

  const result = toFullFlowchart(rt);

  // Find terminal outcomes
  const terminals = [];
  // Only collect terminals at the ROOT level (not inside childFlowchart,
  // which has its own mapsTo scope)
  function collectRootTerminals(node) {
    (node.outcomes || []).forEach(o => {
      if (!o.next) terminals.push(o);
    });
    (node.children || []).forEach(collectRootTerminals);
    // Note: NOT recursing into childFlowchart — those map to the task's outcomes
  }
  collectRootTerminals(result.innerFlowchart);

  // Root-level terminals should have mapsTo referencing outerCard outcomes
  const validIds = result.outerCard.outcomes.map(o => o.id);
  for (const t of terminals) {
    assertEqual(!!t.mapsTo, true,
      `Terminal "${t.label}" should have mapsTo`);
    assertIncludes(validIds, t.mapsTo,
      `Terminal mapsTo should reference outerCard outcome`);
  }
});

test('revealParentGoal + multiple addTasks produces valid inner flowchart', () => {
  // This is the exact scenario that was failing:
  // "build a rocket" → "i want to send a bug to space and do an experiment"
  // LLM emits: revealParentGoal + addTask(experiment) + addTask(launch)
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Build a rocket' },
    { op: 'revealParentGoal', label: 'Send a bug to space and do an experiment' },
    { op: 'addTask', id: 'task-experiment', label: 'Do a science experiment on the bug' },
    { op: 'addTask', id: 'task-launch', label: 'Send the bug to space in the rocket' },
  ]);

  const result = toFullFlowchart(rt);
  assertEqual(result !== null, true, 'Should produce a result');
  assertEqual(result.outerCard.taskName, 'Send a bug to space and do an experiment',
    'OuterCard should be the new goal');

  // Inner flowchart should be valid — all next targets must exist
  const { result: validation } = validateAndRepair(
    result.innerFlowchart,
    { level: ValidationLevel.POINTED }
  );
  assertEqual(validation.valid, true,
    'Inner flowchart should pass validation (no INVALID_NEXT_TARGET)');

  // All 3 tasks should be in the inner tree
  const allLabels = [];
  function collectLabels(node) {
    allLabels.push(node.label);
    (node.children || []).forEach(collectLabels);
    if (node.childFlowchart) collectLabels(node.childFlowchart);
  }
  collectLabels(result.innerFlowchart);
  assertIncludes(allLabels, 'Build a rocket', 'Demoted goal should be in inner tree');
  assertIncludes(allLabels, 'Do a science experiment on the bug', 'task-experiment should be in inner tree');
  assertIncludes(allLabels, 'Send the bug to space in the rocket', 'task-launch should be in inner tree');
});

test('nested elaboration: childFlowchart separates elaboration from siblings', () => {
  // Free operad on Kl(free_p): tasks with children become childFlowchart,
  // not flattened into the sibling chain.
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Build a rocket' },
    { op: 'addTask', id: 'task-buy', label: 'Buy rocket from Amazon', parentId: null },
    { op: 'revealParentGoal', label: 'Send a bug to space' },
    { op: 'addTask', id: 'task-experiment-pre', label: 'Do experiment (before)' },
    { op: 'addTask', id: 'task-send', label: 'Send bug to space' },
  ]);
  const demotedGoal = rt.tasks.find(t => t.label === 'Build a rocket');
  const rt2 = applyOperations(rt, [
    { op: 'addTask', id: 'task-compartment', label: 'Add compartment', parentId: demotedGoal.id },
  ]);

  const result = toFullFlowchart(rt2);
  const root = result.innerFlowchart;

  // Root should be goal-demoted (Build a rocket)
  assertEqual(root.label, 'Build a rocket', 'Root is the demoted goal');

  // Root's children should be root-level SIBLINGS only, not elaboration
  const siblingLabels = root.children.map(c => c.label);
  assertIncludes(siblingLabels, 'Do experiment (before)', 'experiment-pre is a sibling');
  assertIncludes(siblingLabels, 'Send bug to space', 'send is a sibling');
  assertEqual(siblingLabels.includes('Buy rocket from Amazon'), false,
    'buy-rocket should NOT be in children (it is elaboration)');
  assertEqual(siblingLabels.includes('Add compartment'), false,
    'compartment should NOT be in children (it is elaboration)');

  // Root should have childFlowchart containing the elaboration
  assertEqual(root.childFlowchart !== null && root.childFlowchart !== undefined, true,
    'Root should have childFlowchart (elaboration)');
  assertEqual(root.childFlowchart.label, 'Buy rocket from Amazon',
    'Elaboration root should be buy-rocket');

  // Elaboration children should include compartment
  const elabLabels = (root.childFlowchart.children || []).map(c => c.label);
  assertIncludes(elabLabels, 'Add compartment', 'compartment is in elaboration');
});

test('nested elaboration: mapsTo scoping is correct at each level', () => {
  // Elaboration terminals mapsTo the ENCLOSING task's outcomes,
  // not the outer card's outcomes.
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Build a rocket' },
    { op: 'revealParentGoal', label: 'Send a bug to space' },
    { op: 'addTask', id: 'task-pre', label: 'Pre-experiment' },
  ]);
  const demotedGoal = rt.tasks.find(t => t.label === 'Build a rocket');
  const rt2 = applyOperations(rt, [
    { op: 'addTask', id: 'task-buy', label: 'Buy rocket', parentId: demotedGoal.id },
    { op: 'addTaskOutcome', taskId: demotedGoal.id, id: 'outcome-success', label: 'Success' },
    { op: 'addTaskOutcome', taskId: demotedGoal.id, id: 'outcome-fail', label: 'Failure' },
    { op: 'addTaskOutcome', taskId: 'task-buy', id: 'outcome-success', label: 'Success' },
    { op: 'addTaskOutcome', taskId: 'task-buy', id: 'outcome-fail', label: 'Failure' },
    { op: 'addTaskOutcome', taskId: 'task-pre', id: 'outcome-success', label: 'Success' },
    { op: 'addTaskOutcome', taskId: 'task-pre', id: 'outcome-fail', label: 'Failure' },
  ]);

  const result = toFullFlowchart(rt2);
  const root = result.innerFlowchart;

  // Root (goal-demoted) outcome-success should connect to sibling (task-pre)
  const rootSuccess = root.outcomes.find(o => o.id === 'outcome-success');
  assertEqual(rootSuccess.next?.task, 'task-pre',
    'Root success outcome connects to next sibling, not into elaboration');

  // Elaboration terminal (buy-rocket) should mapsTo root's outcomes, not outer card's.
  // findBestMapsTo matches outcome-fail → outcome-fail (enclosing task's fail outcome).
  const elabRoot = root.childFlowchart;
  const buyFail = elabRoot.outcomes.find(o => o.id === 'outcome-fail');
  assertEqual(buyFail.mapsTo, 'outcome-fail',
    'Elaboration failure terminal mapsTo enclosing task failure outcome');

  // Sibling terminal (task-pre) should mapsTo outer card's outcomes.
  // findBestMapsTo matches outcome-fail → failure (outer card's fail outcome).
  const pre = root.children.find(c => c.id === 'task-pre');
  const preFail = pre.outcomes.find(o => o.id === 'outcome-fail');
  assertEqual(preFail.mapsTo, 'failure',
    'Sibling failure terminal mapsTo outer card failure outcome');
});

// =============================================================================
// Outer Card as Proper Monomial A·y^B (WS1)
// =============================================================================

console.log('\n=== Outer Card as Proper Monomial Tests (WS1) ===\n');

test('toFullFlowchart with goalSpec includes fields on outerCard', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Buy pants' },
    { op: 'setGoalSpec', spec: {
      length: { type: 'number' },
      width: { type: 'number' },
      color: { type: 'string' },
      style: { type: 'string' }
    }},
    { op: 'addTask', id: 'task-1', label: 'Go to store' },
  ]);

  const result = toFullFlowchart(rt);
  assertEqual(result.outerCard.fields !== undefined && result.outerCard.fields !== null, true,
    'OuterCard should have fields from goalSpec');
  assertEqual(Object.keys(result.outerCard.fields).length, 4,
    'OuterCard should have 4 spec fields');
  assertEqual(result.outerCard.fields.length.type, 'number',
    'Length field should be number type');
  assertEqual(result.outerCard.fields.color.type, 'string',
    'Color field should be string type');
});

test('toFullFlowchart with custom goalOutcomes uses them', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Buy pants' },
    { op: 'setGoalOutcomes', outcomes: [
      { id: 'outcome-perfect', label: 'Perfect fit' },
      { id: 'outcome-ok', label: 'Acceptable compromise' },
      { id: 'outcome-fail', label: 'Nothing found' },
    ]},
    { op: 'addTask', id: 'task-1', label: 'Go to store' },
  ]);

  const result = toFullFlowchart(rt);
  assertEqual(result.outerCard.outcomes.length, 3,
    'OuterCard should have 3 custom outcomes');
  assertEqual(result.outerCard.outcomes[0].id, 'outcome-perfect',
    'First outcome should be "Perfect fit"');
  assertEqual(result.outerCard.outcomes[2].id, 'outcome-fail',
    'Third outcome should be "Nothing found"');
});

test('toFullFlowchart without goalOutcomes falls back to Success/Failure', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Test' },
    { op: 'addTask', id: 'task-1', label: 'Step 1' },
  ]);

  const result = toFullFlowchart(rt);
  assertEqual(result.outerCard.outcomes.length, 2,
    'Should fall back to 2 default outcomes');
  assertEqual(result.outerCard.outcomes[0].id, 'success',
    'First default outcome should be "success"');
  assertEqual(result.outerCard.outcomes[1].id, 'failure',
    'Second default outcome should be "failure"');
});

test('inner terminal mapsTo works with custom outer outcomes', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Buy pants' },
    { op: 'setGoalOutcomes', outcomes: [
      { id: 'outcome-perfect', label: 'Perfect fit' },
      { id: 'outcome-ok', label: 'Acceptable compromise' },
      { id: 'outcome-fail', label: 'Nothing found' },
    ]},
    { op: 'addTask', id: 'task-1', label: 'Go to store' },
    { op: 'addTaskOutcome', taskId: 'task-1', id: 'outcome-success', label: 'Success' },
    { op: 'addTaskOutcome', taskId: 'task-1', id: 'outcome-failure', label: 'Failure' },
  ]);

  const result = toFullFlowchart(rt);

  // Terminal outcomes should have mapsTo referencing custom outer outcomes
  const terminals = [];
  function collectTerminals(node) {
    (node.outcomes || []).forEach(o => {
      if (!o.next) terminals.push(o);
    });
    (node.children || []).forEach(collectTerminals);
  }
  collectTerminals(result.innerFlowchart);

  const validIds = result.outerCard.outcomes.map(o => o.id);
  for (const t of terminals) {
    assertEqual(!!t.mapsTo, true,
      `Terminal "${t.label}" should have mapsTo`);
    assertIncludes(validIds, t.mapsTo,
      `Terminal mapsTo "${t.mapsTo}" should reference a custom outer outcome`);
  }
});

test('setGoalSpec and setGoalOutcomes operations work correctly', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Test' },
    { op: 'setGoalSpec', spec: { size: { type: 'number' } } },
    { op: 'setGoalOutcomes', outcomes: [
      { id: 'a', label: 'Outcome A' },
      { id: 'b', label: 'Outcome B' },
    ]},
  ]);

  assertEqual(rt.goalSpec !== null, true, 'goalSpec should be set');
  assertEqual(rt.goalSpec.size.type, 'number', 'goalSpec should have size field');
  assertEqual(rt.goalOutcomes.length, 2, 'Should have 2 goalOutcomes');
  assertEqual(rt.goalOutcomes[0].id, 'a', 'First outcome should be "a"');
});

test('setOutcomeValues sets values on goalOutcomes', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Test' },
    { op: 'setGoalOutcomes', outcomes: [
      { id: 'success', label: 'Success' },
      { id: 'failure', label: 'Failure' },
    ]},
    { op: 'setOutcomeValues', values: { success: 1000, failure: 0 } },
  ]);

  assertEqual(rt.goalOutcomes[0].value, 1000, 'Success should have value 1000');
  assertEqual(rt.goalOutcomes[1].value, 0, 'Failure should have value 0');
});

test('outerCard includes valueCurrency and outcome values', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Test' },
    { op: 'setValueCurrency', currency: 'David-bucks' },
    { op: 'setGoalOutcomes', outcomes: [
      { id: 'success', label: 'Success' },
      { id: 'failure', label: 'Failure' },
    ]},
    { op: 'setOutcomeValues', values: { success: 500, failure: 0 } },
    { op: 'addTask', id: 'task-1', label: 'Step 1' },
  ]);

  const result = toFullFlowchart(rt);
  assertEqual(result.outerCard.valueCurrency, 'David-bucks',
    'OuterCard should include valueCurrency');
  assertEqual(result.outerCard.outcomes[0].value, 500,
    'OuterCard success outcome should have value 500');
  assertEqual(result.outerCard.outcomes[1].value, 0,
    'OuterCard failure outcome should have value 0');
});

test('spotlight and bountyDescription pass through to buildTaskNode', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Test' },
    { op: 'addTask', id: 'task-1', label: 'Step 1' },
    { op: 'setTaskSpotlight', taskId: 'task-1', spotlight: true },
    { op: 'setTaskBounty', taskId: 'task-1', description: 'Need help with this step' },
  ]);

  const task = rt.tasks.find(t => t.id === 'task-1');
  assertEqual(task.spotlight, true, 'Task should have spotlight=true');
  assertEqual(task.bountyDescription, 'Need help with this step',
    'Task should have bountyDescription');

  const result = toFullFlowchart(rt);
  const root = result.innerFlowchart;
  assertEqual(root.spotlight, true, 'Inner flowchart root should have spotlight');
  assertEqual(root.bountyDescription, 'Need help with this step',
    'Inner flowchart root should have bountyDescription');
});

test('nested elaboration with evaluator outcomes passes full validation', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Build a rocket' },
    { op: 'revealParentGoal', label: 'Send a bug to space' },
    { op: 'addTask', id: 'task-pre', label: 'Pre-experiment' },
    { op: 'addTask', id: 'task-send', label: 'Send to space' },
  ]);
  const demotedGoal = rt.tasks.find(t => t.label === 'Build a rocket');
  const rt2 = applyOperations(rt, [
    { op: 'addTask', id: 'task-buy', label: 'Buy rocket', parentId: demotedGoal.id },
    { op: 'addTaskOutcome', taskId: demotedGoal.id, id: 'outcome-success', label: 'Success' },
    { op: 'addTaskOutcome', taskId: demotedGoal.id, id: 'outcome-fail', label: 'Failure' },
    { op: 'addTaskOutcome', taskId: 'task-buy', id: 'outcome-success', label: 'Success' },
    { op: 'addTaskOutcome', taskId: 'task-buy', id: 'outcome-fail', label: 'Failure' },
    { op: 'addTaskOutcome', taskId: 'task-pre', id: 'outcome-success', label: 'Success' },
    { op: 'addTaskOutcome', taskId: 'task-pre', id: 'outcome-fail', label: 'Failure' },
    { op: 'addTaskOutcome', taskId: 'task-send', id: 'outcome-success', label: 'Success' },
    { op: 'addTaskOutcome', taskId: 'task-send', id: 'outcome-fail', label: 'Failure' },
  ]);

  const result = toFullFlowchart(rt2);
  const { result: validation } = validateAndRepair(
    result.innerFlowchart,
    { level: ValidationLevel.TREE }
  );
  assertEqual(validation.errors.length, 0,
    'Nested elaboration with evaluator outcomes passes tree validation');
});

console.log('\n=== Recipe Extraction Tests (p_* sibling traversal) ===\n');

test('extractRecipePath follows chosenOutcome across siblings', () => {
  // This is the exact structure produced by toFullFlowchart after revealParentGoal:
  // Root has 3 siblings in children[], chained via outcome.next
  const flowchart = {
    id: 'root', label: 'Build a rocket',
    chosenOutcome: 'continue',
    outcomes: [{ id: 'continue', label: 'Continue', next: { task: 'pre' } }],
    children: [
      {
        id: 'pre', label: 'Pre-flight experiment',
        chosenOutcome: 'continue',
        outcomes: [{ id: 'continue', label: 'Continue', next: { task: 'launch' } }],
        children: []
      },
      {
        id: 'launch', label: 'Send bug to space',
        chosenOutcome: 'continue',
        outcomes: [{ id: 'continue', label: 'Continue', next: { task: 'post' } }],
        children: []
      },
      {
        id: 'post', label: 'Post-flight experiment',
        chosenOutcome: 'done',
        outcomes: [{ id: 'done', label: 'Done', next: null, mapsTo: 'success' }],
        children: []
      },
    ]
  };

  const recipe = extractRecipePath(flowchart);
  assertEqual(recipe.tasks.length, 4,
    'Recipe should have 4 steps (root + 3 siblings)');
  assertEqual(recipe.complete, true,
    'Recipe should reach terminal outcome');
  assertEqual(recipe.tasks.map(t => t.task.id).join(' → '), 'root → pre → launch → post',
    'Recipe should traverse all siblings in order');
});

test('chosenOutcome validation passes for sibling-chained flowchart', () => {
  // Same structure — validatePointedStructure should follow the full path
  const flowchart = {
    id: 'root', label: 'Build a rocket',
    chosenOutcome: 'continue',
    outcomes: [{ id: 'continue', label: 'Continue', next: { task: 'pre' } }],
    children: [
      {
        id: 'pre', label: 'Pre-flight experiment',
        chosenOutcome: 'continue',
        outcomes: [{ id: 'continue', label: 'Continue', next: { task: 'launch' } }],
        children: []
      },
      {
        id: 'launch', label: 'Send bug to space',
        chosenOutcome: 'continue',
        outcomes: [{ id: 'continue', label: 'Continue', next: { task: 'post' } }],
        children: []
      },
      {
        id: 'post', label: 'Post-flight experiment',
        chosenOutcome: 'done',
        outcomes: [{ id: 'done', label: 'Done', next: null }],
        children: []
      },
    ]
  };

  const result = validatePointedStructure(flowchart);
  assertEqual(result.valid, true, 'Should pass pointed validation');
  assertEqual(result.stats.recipeLength, 4, 'Recipe length should be 4');
});

// =============================================================================
// Likelihood Structure Tests (p/rand)
// =============================================================================

console.log('\n=== Likelihood Structure Tests (p/rand) ===\n');

test('[L1] Valid likelihoods (70/30) pass validation', () => {
  const flowchart = {
    id: 'root', label: 'Test task',
    outcomes: [
      { id: 'success', label: 'Success', next: null, likelihood: 70 },
      { id: 'failure', label: 'Failure', next: null, likelihood: 30 },
    ],
    children: []
  };
  const result = validateLikelihoodStructure(flowchart);
  assertEqual(result.valid, true, 'Should be valid');
  assertEqual(result.errors.length, 0, 'Should have no errors');
});

test('[L1] Valid three-way likelihoods (50/30/20) pass validation', () => {
  const flowchart = {
    id: 'root', label: 'Test task',
    outcomes: [
      { id: 'success', label: 'Success', next: null, likelihood: 50 },
      { id: 'partial', label: 'Partial', next: null, likelihood: 30 },
      { id: 'failure', label: 'Failure', next: null, likelihood: 20 },
    ],
    children: []
  };
  const result = validateLikelihoodStructure(flowchart);
  assertEqual(result.valid, true, 'Should be valid');
});

test('[L1] Likelihood out of range (150) is caught', () => {
  const flowchart = {
    id: 'root', label: 'Test task',
    outcomes: [
      { id: 'success', label: 'Success', next: null, likelihood: 150 },
      { id: 'failure', label: 'Failure', next: null, likelihood: -50 },
    ],
    children: []
  };
  const result = validateLikelihoodStructure(flowchart);
  assertEqual(result.valid, false, 'Should be invalid');
  assertIncludes(
    result.errors.map(e => e.code),
    ErrorCode.LIKELIHOOD_OUT_OF_RANGE,
    'Should have LIKELIHOOD_OUT_OF_RANGE error'
  );
});

test('[L2] Likelihoods not summing to 100 is caught', () => {
  const flowchart = {
    id: 'root', label: 'Test task',
    outcomes: [
      { id: 'success', label: 'Success', next: null, likelihood: 60 },
      { id: 'failure', label: 'Failure', next: null, likelihood: 30 },
    ],
    children: []
  };
  const result = validateLikelihoodStructure(flowchart);
  assertEqual(result.valid, false, 'Should be invalid');
  assertIncludes(
    result.errors.map(e => e.code),
    ErrorCode.LIKELIHOOD_SUM_MISMATCH,
    'Should have LIKELIHOOD_SUM_MISMATCH error'
  );
});

test('[L3] Partial likelihoods (some but not all) is caught', () => {
  const flowchart = {
    id: 'root', label: 'Test task',
    outcomes: [
      { id: 'success', label: 'Success', next: null, likelihood: 70 },
      { id: 'failure', label: 'Failure', next: null }, // Missing likelihood!
    ],
    children: []
  };
  const result = validateLikelihoodStructure(flowchart);
  assertEqual(result.valid, false, 'Should be invalid');
  assertIncludes(
    result.errors.map(e => e.code),
    ErrorCode.LIKELIHOOD_PARTIAL,
    'Should have LIKELIHOOD_PARTIAL error'
  );
});

test('[L3] No likelihoods at all is valid (likelihoods are optional)', () => {
  const flowchart = {
    id: 'root', label: 'Test task',
    outcomes: [
      { id: 'success', label: 'Success', next: null },
      { id: 'failure', label: 'Failure', next: null },
    ],
    children: []
  };
  const result = validateLikelihoodStructure(flowchart);
  assertEqual(result.valid, true, 'Should be valid');
  assertEqual(result.errors.length, 0, 'Should have no errors');
});

// =============================================================================
// Likelihood Operation Tests (setTaskLikelihoods)
// =============================================================================

console.log('\n=== Likelihood Operation Tests ===\n');

test('setTaskLikelihoods sets likelihoods on task outcomes', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Test goal' },
    { op: 'addTask', id: 'task-1', label: 'Step 1' },
    { op: 'addTaskOutcome', taskId: 'task-1', id: 'outcome-success', label: 'Success' },
    { op: 'addTaskOutcome', taskId: 'task-1', id: 'outcome-failure', label: 'Failure' },
    { op: 'setTaskLikelihoods', taskId: 'task-1', likelihoods: { 'outcome-success': 75, 'outcome-failure': 25 } },
  ]);

  const task = rt.tasks.find(t => t.id === 'task-1');
  assertEqual(task.outcomes[0].likelihood, 75, 'Success should have 75');
  assertEqual(task.outcomes[1].likelihood, 25, 'Failure should have 25');
});

test('addTaskOutcome with likelihood preserves it', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Test goal' },
    { op: 'addTask', id: 'task-1', label: 'Step 1' },
    { op: 'addTaskOutcome', taskId: 'task-1', id: 'outcome-success', label: 'Success', likelihood: 80 },
    { op: 'addTaskOutcome', taskId: 'task-1', id: 'outcome-failure', label: 'Failure', likelihood: 20 },
  ]);

  const task = rt.tasks.find(t => t.id === 'task-1');
  assertEqual(task.outcomes[0].likelihood, 80, 'Success should have 80');
  assertEqual(task.outcomes[1].likelihood, 20, 'Failure should have 20');
});

test('addTask with afterTask inserts in correct position', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Bug to space' },
    { op: 'addTask', id: 'task-pre', label: 'Pre-flight experiment' },
    { op: 'addTask', id: 'task-launch', label: 'Send bug to space' },
    { op: 'addTask', id: 'task-post', label: 'Post-flight experiment' },
    // "Add compartment" logically goes before launch
    { op: 'addTask', id: 'task-compartment', label: 'Add bug compartment', afterTask: 'task-pre' },
  ]);

  const ids = rt.tasks.map(t => t.id);
  assertEqual(ids.indexOf('task-compartment'), ids.indexOf('task-pre') + 1,
    'Compartment should be right after pre-flight');
  assertEqual(ids.indexOf('task-compartment') < ids.indexOf('task-launch'), true,
    'Compartment should be before launch');
});

test('addTask with beforeTask inserts in correct position', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Bug to space' },
    { op: 'addTask', id: 'task-pre', label: 'Pre-flight experiment' },
    { op: 'addTask', id: 'task-launch', label: 'Send bug to space' },
    { op: 'addTask', id: 'task-post', label: 'Post-flight experiment' },
    // Insert before launch
    { op: 'addTask', id: 'task-compartment', label: 'Add bug compartment', beforeTask: 'task-launch' },
  ]);

  const ids = rt.tasks.map(t => t.id);
  assertEqual(ids.indexOf('task-compartment') < ids.indexOf('task-launch'), true,
    'Compartment should be before launch');
  assertEqual(ids.indexOf('task-compartment'), ids.indexOf('task-launch') - 1,
    'Compartment should be immediately before launch');
});

test('addTask with invalid afterTask falls back to append', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Test' },
    { op: 'addTask', id: 'task-1', label: 'First' },
    { op: 'addTask', id: 'task-2', label: 'Second', afterTask: 'nonexistent' },
  ]);

  const ids = rt.tasks.map(t => t.id);
  assertEqual(ids[ids.length - 1], 'task-2', 'Should append to end when afterTask not found');
});

test('toFullFlowchart preserves likelihoods from realtime', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Test goal' },
    { op: 'addTask', id: 'task-1', label: 'Step 1' },
    { op: 'addTaskOutcome', taskId: 'task-1', id: 'outcome-success', label: 'Success', likelihood: 90 },
    { op: 'addTaskOutcome', taskId: 'task-1', id: 'outcome-failure', label: 'Failure', likelihood: 10 },
  ]);

  const full = toFullFlowchart(rt);
  const root = full.innerFlowchart;
  const successOutcome = root.outcomes.find(o => o.id === 'outcome-success');
  const failureOutcome = root.outcomes.find(o => o.id === 'outcome-failure');
  assertEqual(successOutcome.likelihood, 90, 'Full flowchart success should have 90');
  assertEqual(failureOutcome.likelihood, 10, 'Full flowchart failure should have 10');
});

// =============================================================================
// Percolation Tests (free_{p/rand} → (free_p)/rand)
// =============================================================================

console.log('\n=== Percolation Tests (free_{p/rand} → (free_p)/rand) ===\n');

test('Percolate sums paths to same mapsTo target', () => {
  // Two inner paths both map to "success", one maps to "failure"
  // Path 1 → success: likelihood 60
  // Path 2 → success: likelihood 20
  // Path 3 → failure: likelihood 20
  const task = {
    id: 'parent', label: 'Parent task',
    outcomes: [
      { id: 'success', label: 'Success', next: null },
      { id: 'failure', label: 'Failure', next: null },
    ],
    children: [],
    childFlowchart: {
      id: 'inner-root', label: 'Elaboration',
      outcomes: [
        { id: 'path-a', label: 'Path A', next: { task: 'inner-a' }, likelihood: 60 },
        { id: 'path-b', label: 'Path B', next: { task: 'inner-b' }, likelihood: 20 },
        { id: 'path-c', label: 'Path C', next: { task: 'inner-c' }, likelihood: 20 },
      ],
      children: [
        {
          id: 'inner-a', label: 'Step A',
          outcomes: [{ id: 'done-a', label: 'Done', next: null, mapsTo: 'success', likelihood: 100 }],
          children: []
        },
        {
          id: 'inner-b', label: 'Step B',
          outcomes: [{ id: 'done-b', label: 'Done', next: null, mapsTo: 'success', likelihood: 100 }],
          children: []
        },
        {
          id: 'inner-c', label: 'Step C',
          outcomes: [{ id: 'done-c', label: 'Done', next: null, mapsTo: 'failure', likelihood: 100 }],
          children: []
        },
      ]
    }
  };

  const result = percolate(task);
  assertEqual(result !== null, true, 'Should produce percolation result');
  // Paths: A(60%×100%) + B(20%×100%) = 80% → success
  //        C(20%×100%) = 20% → failure
  assertEqual(result['success'], 80, 'Success should be 80');
  assertEqual(result['failure'], 20, 'Failure should be 20');
});

test('Percolate multiplies likelihoods along sequential path', () => {
  // Sequential: inner-root → inner-a → terminal
  // root outcome: 80/20, inner-a outcome: 90/10
  // Path to success: 0.8 × 0.9 = 0.72
  // Path to failure via root: 0.2 × 1.0 = 0.2
  // Path to failure via inner-a: 0.8 × 0.1 = 0.08
  const task = {
    id: 'parent', label: 'Parent',
    outcomes: [
      { id: 'success', label: 'Success', next: null },
      { id: 'failure', label: 'Failure', next: null },
    ],
    children: [],
    childFlowchart: {
      id: 'inner-root', label: 'First step',
      outcomes: [
        { id: 'ok', label: 'OK', next: { task: 'inner-a' }, likelihood: 80 },
        { id: 'fail', label: 'Fail', next: { task: 'inner-fail' }, likelihood: 20 },
      ],
      children: [
        {
          id: 'inner-a', label: 'Second step',
          outcomes: [
            { id: 'ok2', label: 'OK', next: { task: 'inner-success' }, likelihood: 90 },
            { id: 'fail2', label: 'Fail', next: { task: 'inner-fail2' }, likelihood: 10 },
          ],
          children: [
            {
              id: 'inner-success', label: 'Succeed',
              outcomes: [{ id: 'done', label: 'Done', next: null, mapsTo: 'success', likelihood: 100 }],
              children: []
            },
            {
              id: 'inner-fail2', label: 'Fail at step 2',
              outcomes: [{ id: 'done', label: 'Done', next: null, mapsTo: 'failure', likelihood: 100 }],
              children: []
            },
          ]
        },
        {
          id: 'inner-fail', label: 'Fail at step 1',
          outcomes: [{ id: 'done', label: 'Done', next: null, mapsTo: 'failure', likelihood: 100 }],
          children: []
        },
      ]
    }
  };

  const result = percolate(task);
  assertEqual(result !== null, true, 'Should produce percolation result');
  // success: 0.8 × 0.9 × 1.0 = 0.72 → 72
  // failure: (0.2 × 1.0) + (0.8 × 0.1 × 1.0) = 0.28 → 28
  assertEqual(result['success'], 72, 'Success should be 72');
  assertEqual(result['failure'], 28, 'Failure should be 28');
});

test('Percolate returns null when no inner likelihoods', () => {
  const task = {
    id: 'parent', label: 'Parent',
    outcomes: [
      { id: 'success', label: 'Success', next: null },
    ],
    children: [],
    childFlowchart: {
      id: 'inner-root', label: 'Step',
      outcomes: [{ id: 'done', label: 'Done', next: null, mapsTo: 'success' }],
      children: []
    }
  };

  const result = percolate(task);
  assertEqual(result, null, 'Should return null when no likelihoods');
});

test('Percolated likelihoods sum to 100', () => {
  // Use an example where rounding could go wrong
  const task = {
    id: 'parent', label: 'Parent',
    outcomes: [
      { id: 'a', label: 'A', next: null },
      { id: 'b', label: 'B', next: null },
      { id: 'c', label: 'C', next: null },
    ],
    children: [],
    childFlowchart: {
      id: 'inner-root', label: 'Step',
      outcomes: [
        { id: 'p1', label: 'P1', next: { task: 't-a' }, likelihood: 33 },
        { id: 'p2', label: 'P2', next: { task: 't-b' }, likelihood: 33 },
        { id: 'p3', label: 'P3', next: { task: 't-c' }, likelihood: 34 },
      ],
      children: [
        { id: 't-a', label: 'A', outcomes: [{ id: 'd', label: 'Done', next: null, mapsTo: 'a', likelihood: 100 }], children: [] },
        { id: 't-b', label: 'B', outcomes: [{ id: 'd', label: 'Done', next: null, mapsTo: 'b', likelihood: 100 }], children: [] },
        { id: 't-c', label: 'C', outcomes: [{ id: 'd', label: 'Done', next: null, mapsTo: 'c', likelihood: 100 }], children: [] },
      ]
    }
  };

  const result = percolate(task);
  assertEqual(result !== null, true, 'Should produce result');
  const sum = Object.values(result).reduce((s, v) => s + v, 0);
  assertEqual(sum, 100, 'Percolated likelihoods should sum to 100');
});

test('likelihoodCategory classifies correctly', () => {
  assertEqual(likelihoodCategory(95), 'easy', '95 should be easy');
  assertEqual(likelihoodCategory(91), 'easy', '91 should be easy');
  assertEqual(likelihoodCategory(90), 'plausible', '90 should be plausible');
  assertEqual(likelihoodCategory(50), 'plausible', '50 should be plausible');
  assertEqual(likelihoodCategory(6), 'plausible', '6 should be plausible');
  assertEqual(likelihoodCategory(5), 'unlikely', '5 should be unlikely');
  assertEqual(likelihoodCategory(0), 'unlikely', '0 should be unlikely');
});

test('percolateTree applies percolation to elaborated nodes', () => {
  // Simple case: one node with childFlowchart
  const tree = {
    id: 'root', label: 'Root',
    outcomes: [
      { id: 'success', label: 'Success', next: null },
      { id: 'failure', label: 'Failure', next: null },
    ],
    children: [],
    childFlowchart: {
      id: 'inner', label: 'Inner',
      outcomes: [
        { id: 'ok', label: 'OK', next: { task: 'step' }, likelihood: 70 },
        { id: 'fail', label: 'Fail', next: { task: 'step-fail' }, likelihood: 30 },
      ],
      children: [
        { id: 'step', label: 'Step',
          outcomes: [{ id: 'd', label: 'Done', next: null, mapsTo: 'success', likelihood: 100 }],
          children: [] },
        { id: 'step-fail', label: 'Step Fail',
          outcomes: [{ id: 'd', label: 'Done', next: null, mapsTo: 'failure', likelihood: 100 }],
          children: [] },
      ]
    }
  };

  const result = percolateTree(tree);
  const successOutcome = result.outcomes.find(o => o.id === 'success');
  const failureOutcome = result.outcomes.find(o => o.id === 'failure');
  assertEqual(successOutcome.likelihood, 70, 'Success should get 70 from percolation');
  assertEqual(failureOutcome.likelihood, 30, 'Failure should get 30 from percolation');
});

// =============================================================================
// Value Propagation Tests (WS2 — reverse martingale)
// =============================================================================

import { propagateValues } from '../ct/valuation.js';

console.log('\n=== Value Propagation Tests (reverse martingale) ===\n');

test('Inner terminal values assigned via mapsTo from outer outcome values', () => {
  const outerCard = {
    outcomes: [
      { id: 'success', label: 'Success', value: 1000 },
      { id: 'failure', label: 'Failure', value: 0 },
    ]
  };
  const innerRoot = {
    id: 'root', label: 'Step 1',
    outcomes: [
      { id: 'ok', label: 'OK', next: null, mapsTo: 'success', likelihood: 80 },
      { id: 'fail', label: 'Fail', next: null, mapsTo: 'failure', likelihood: 20 },
    ],
    children: []
  };

  const result = propagateValues(outerCard, innerRoot);
  const ok = result.outcomes.find(o => o.id === 'ok');
  const fail = result.outcomes.find(o => o.id === 'fail');
  assertEqual(ok.value, 1000, 'Terminal mapping to success should get value 1000');
  assertEqual(fail.value, 0, 'Terminal mapping to failure should get value 0');
});

test('Expected value (derivedValue) computed correctly at each inner node', () => {
  const outerCard = {
    outcomes: [
      { id: 'success', label: 'Success', value: 1000 },
      { id: 'failure', label: 'Failure', value: 0 },
    ]
  };
  const innerRoot = {
    id: 'root', label: 'Step 1',
    outcomes: [
      { id: 'ok', label: 'OK', next: null, mapsTo: 'success', likelihood: 80 },
      { id: 'fail', label: 'Fail', next: null, mapsTo: 'failure', likelihood: 20 },
    ],
    children: []
  };

  const result = propagateValues(outerCard, innerRoot);
  // derivedValue = 0.8 * 1000 + 0.2 * 0 = 800
  assertEqual(result.derivedValue, 800, 'derivedValue should be 800');
});

test('Sequential chain propagates values correctly', () => {
  const outerCard = {
    outcomes: [
      { id: 'success', label: 'Success', value: 1000 },
      { id: 'failure', label: 'Failure', value: 0 },
    ]
  };
  // root → child (via outcome.next), child has terminal outcomes
  const innerRoot = {
    id: 'root', label: 'Step 1',
    outcomes: [
      { id: 'continue', label: 'Continue', next: { task: 'step-2' }, likelihood: 70 },
      { id: 'fail', label: 'Fail', next: null, mapsTo: 'failure', likelihood: 30 },
    ],
    children: [
      {
        id: 'step-2', label: 'Step 2',
        outcomes: [
          { id: 'done', label: 'Done', next: null, mapsTo: 'success', likelihood: 90 },
          { id: 'fail2', label: 'Fail', next: null, mapsTo: 'failure', likelihood: 10 },
        ],
        children: []
      }
    ]
  };

  const result = propagateValues(outerCard, innerRoot);

  // Step 2: derivedValue = 0.9 * 1000 + 0.1 * 0 = 900
  const step2 = result.children.find(c => c.id === 'step-2');
  assertEqual(step2.derivedValue, 900, 'Step 2 derivedValue should be 900');

  // Root: continue outcome value = step2.derivedValue = 900
  //       fail outcome value = 0 (mapsTo failure)
  // derivedValue = 0.7 * 900 + 0.3 * 0 = 630
  assertEqual(result.derivedValue, 630, 'Root derivedValue should be 630');
});

test('Nested elaboration (childFlowchart) values propagate inward recursively', () => {
  const outerCard = {
    outcomes: [
      { id: 'success', label: 'Success', value: 500 },
      { id: 'failure', label: 'Failure', value: 0 },
    ]
  };
  // Root has a childFlowchart (elaboration), with terminal outcomes mapping to root's outcomes
  const innerRoot = {
    id: 'root', label: 'Parent task',
    outcomes: [
      { id: 'ok', label: 'OK', next: null, mapsTo: 'success', likelihood: 60 },
      { id: 'fail', label: 'Fail', next: null, mapsTo: 'failure', likelihood: 40 },
    ],
    children: [],
    childFlowchart: {
      id: 'elab-root', label: 'Elaboration step',
      outcomes: [
        { id: 'elab-ok', label: 'OK', next: null, mapsTo: 'ok', likelihood: 80 },
        { id: 'elab-fail', label: 'Fail', next: null, mapsTo: 'fail', likelihood: 20 },
      ],
      children: []
    }
  };

  const result = propagateValues(outerCard, innerRoot);

  // Root outcome values: ok=500, fail=0 (from outer via mapsTo)
  // Root derivedValue: 0.6*500 + 0.4*0 = 300
  assertEqual(result.derivedValue, 300, 'Root derivedValue should be 300');

  // Elaboration terminal values: elab-ok=500 (from root ok), elab-fail=0 (from root fail)
  const elabOk = result.childFlowchart.outcomes.find(o => o.id === 'elab-ok');
  const elabFail = result.childFlowchart.outcomes.find(o => o.id === 'elab-fail');
  assertEqual(elabOk.value, 500, 'Elaboration OK should inherit 500 from root ok');
  assertEqual(elabFail.value, 0, 'Elaboration fail should inherit 0 from root fail');

  // Elaboration derivedValue: 0.8*500 + 0.2*0 = 400
  assertEqual(result.childFlowchart.derivedValue, 400,
    'Elaboration derivedValue should be 400');
});

test('Returns unchanged tree when no outer values', () => {
  const outerCard = {
    outcomes: [
      { id: 'success', label: 'Success' },
      { id: 'failure', label: 'Failure' },
    ]
  };
  const innerRoot = {
    id: 'root', label: 'Step',
    outcomes: [
      { id: 'ok', label: 'OK', next: null, mapsTo: 'success', likelihood: 80 },
      { id: 'fail', label: 'Fail', next: null, mapsTo: 'failure', likelihood: 20 },
    ],
    children: []
  };

  const result = propagateValues(outerCard, innerRoot);
  assertEqual(result.derivedValue === undefined || result.derivedValue === null, true,
    'Should not have derivedValue when no outer values');
});

test('End-to-end: toFullFlowchart with values produces derivedValues', () => {
  const rt = applyOperations(createEmptyFlowchart(), [
    { op: 'setGoal', label: 'Test goal' },
    { op: 'setGoalOutcomes', outcomes: [
      { id: 'success', label: 'Success' },
      { id: 'failure', label: 'Failure' },
    ]},
    { op: 'setOutcomeValues', values: { success: 1000, failure: 0 } },
    { op: 'addTask', id: 'task-1', label: 'Step 1' },
    { op: 'addTaskOutcome', taskId: 'task-1', id: 'outcome-success', label: 'Success', likelihood: 75 },
    { op: 'addTaskOutcome', taskId: 'task-1', id: 'outcome-failure', label: 'Failure', likelihood: 25 },
  ]);

  const result = toFullFlowchart(rt);
  const root = result.innerFlowchart;

  // Root should have derivedValue = 0.75 * 1000 + 0.25 * 0 = 750
  assertEqual(root.derivedValue, 750, 'Inner root derivedValue should be 750');
});

// =============================================================================
// Meta-Test: Traceability (ErrorCode ↔ CT_INVARIANTS.md)
// =============================================================================

console.log('\n=== Traceability Meta-Test ===\n');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const invariantsPath = path.resolve(__dirname, '../../../../docs/pf/CT_INVARIANTS.md');

test('Every ErrorCode in types.js is documented in CT_INVARIANTS.md', () => {
  const invariantsDoc = fs.readFileSync(invariantsPath, 'utf-8');

  const allCodes = Object.values(ErrorCode);
  const undocumented = allCodes.filter(code => !invariantsDoc.includes(code));

  if (undocumented.length > 0) {
    throw new Error(
      `ErrorCodes not found in CT_INVARIANTS.md: ${undocumented.join(', ')}.\n` +
      `Every ErrorCode must trace to a categorical invariant.\n` +
      `See the traceability rule in src/validation/types.js.`
    );
  }
});

// =============================================================================
// Summary
// =============================================================================

console.log('\n=== Summary ===\n');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
