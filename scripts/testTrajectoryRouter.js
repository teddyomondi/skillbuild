import {
  resolveTrajectoryDomain,
  startStruggleEpisode,
  recordTrajectoryOutcome,
  buildWinningDetourNode,
  loadTrajectoryDomains
} from '../src/services/pedagogicalTrajectoryRouter.js';

async function runTests() {
  console.log('--- RUNNING PEDAGOGICAL TRAJECTORY ROUTER TESTS ---');

  // 1. Closures Struggle Test
  const closureDomain = resolveTrajectoryDomain('js-closures-state', 'closures');
  console.log('✓ Closures Domain Resolved:', closureDomain.id, '-', closureDomain.title);
  
  const ep1 = startStruggleEpisode({
    learnerId: 'test-student-1',
    nodeId: 'js-closures-state',
    conceptTag: 'closures',
    struggleSignature: 'ast:scope-leak'
  });
  console.log('✓ Episode 1 (Closures) Selected Arm:', ep1.selectedArmLabel);
  if (ep1.selectedArmKey !== 'detour-b') throw new Error('Expected Detour B to win for closures!');
  
  const closureDetour = buildWinningDetourNode(ep1.detourNodeId);
  console.log('✓ Detour B Generated:', closureDetour.title);
  const closureCode = `
    function createVault(initialBalance) {
      let balance = initialBalance;
      return {
        withdraw(amount) {
          balance -= amount;
          return balance;
        }
      };
    }
  `;
  const closureEval = closureDetour.challengeSpec.evaluateSubmission(closureCode);
  console.log('✓ Closure Detour Evaluation Passed:', closureEval.passed);
  if (!closureEval.passed) throw new Error('Closure challenge evaluation failed!');

  // 2. Async Event Loop Struggle Test
  const asyncDomain = resolveTrajectoryDomain('js-async-event-loop', 'promises-async');
  console.log('✓ Async Event Loop Domain Resolved:', asyncDomain.id);
  
  const ep2 = startStruggleEpisode({
    learnerId: 'test-student-2',
    nodeId: 'js-async-event-loop',
    conceptTag: 'promises-async',
    struggleSignature: 'unhandled-promise'
  });
  console.log('✓ Episode 2 (Async) Selected Arm:', ep2.selectedArmLabel);
  if (ep2.selectedArmKey !== 'detour-b') throw new Error('Expected Detour B to win for async!');

  const asyncDetour = buildWinningDetourNode(ep2.detourNodeId);
  console.log('✓ Detour B Generated:', asyncDetour.title);
  const asyncCode = `
    async function runSequence() {
      const res = await Promise.resolve("Done");
      console.log(res);
    }
  `;
  const asyncEval = asyncDetour.challengeSpec.evaluateSubmission(asyncCode);
  console.log('✓ Async Detour Evaluation Passed:', asyncEval.passed);
  if (!asyncEval.passed) throw new Error('Async challenge evaluation failed!');

  // 3. Coordinate Geometry Struggle Test
  const mathDomain = resolveTrajectoryDomain('math-vectors-coordinate-geometry', 'vectors-geometry');
  console.log('✓ Coordinate Geometry Domain Resolved:', mathDomain.id);

  const ep3 = startStruggleEpisode({
    learnerId: 'test-student-3',
    nodeId: 'math-vectors-coordinate-geometry',
    conceptTag: 'vectors-geometry',
    struggleSignature: 'vector-sum-error'
  });
  console.log('✓ Episode 3 (Math) Selected Arm:', ep3.selectedArmLabel);
  if (ep3.selectedArmKey !== 'detour-b') throw new Error('Expected Detour B to win for coordinate geometry!');

  const mathDetour = buildWinningDetourNode(ep3.detourNodeId);
  console.log('✓ Detour B Generated:', mathDetour.title);
  const mathEval = mathDetour.challengeSpec.evaluateSubmission('R = (6, 2)');
  console.log('✓ Coordinate Geometry Detour Passed:', mathEval.passed);
  if (!mathEval.passed) throw new Error('Coordinate geometry evaluation failed!');

  // 4. Outcome Tracking and Bayesian Updates
  const initialArmTrials = closureDomain.arms['detour-b'].trials;
  recordTrajectoryOutcome(ep1.episodeId, { passed: true, customDurationSec: 88 });
  const updatedDomains = loadTrajectoryDomains();
  const updatedArmTrials = updatedDomains['closures-state'].arms['detour-b'].trials;
  console.log(`✓ Outcome recorded: Detour B trials updated from ${initialArmTrials} -> ${updatedArmTrials}`);
  if (updatedArmTrials !== initialArmTrials + 1) throw new Error('Trials counter did not increment!');

  console.log('\n======================================================');
  console.log('SUCCESS: All Pedagogical Trajectory Router tests passed!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
