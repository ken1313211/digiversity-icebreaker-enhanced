const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('app.js', 'utf8');
const code = source.slice(source.indexOf('async function submitPlayerResponse('), source.indexOf('function renderPlayerQuestionInterface('));

function setup() {
  const now = 10_000;
  const question = { timeLimit: 20, isDoublePoints: false };
  const session = { state: 'question', currentQuestionIndex: 0, questionStartTime: now - 1000, questions: [question] };
  const player = { score: 100, streak: 0, inventory: [], speedBoostActive: true, multiplierActive: true };
  const context = vm.createContext({
    currentGamePin: '123456', myPlayerId: 'me', hasAnsweredThisRound: false,
    currentGameState: 'question', currentQuestionIndex: 0, questions: [question], database: {},
    Date: { now: () => now }, ref: (_, path) => path,
    get: async () => ({ exists: () => true, val: () => session }),
    runTransaction: async (_, callback) => {
      const next = callback(player);
      if (!next) return { committed: false };
      Object.assign(player, next);
      return { committed: true };
    },
    normalizeQuestionType: () => 'multiple_choice',
    isResponseCorrect: (_, response) => response.correct,
    awardRandomPowerupIfDeserving: (_, __, ___, inventory) => inventory,
    increment: value => value, update: async () => {},
    document: { getElementById: () => ({ classList: { remove() {} } }) },
    showToast() {},
  });
  vm.runInContext(code, context);
  return { context, player };
}

(async () => {
  const wrong = setup();
  assert.equal(await wrong.context.submitPlayerResponse({ correct: false }), true);
  assert.equal(wrong.player.lastPointsEarned, 0);
  assert.equal(wrong.player.speedBoostActive, true);
  assert.equal(wrong.player.multiplierActive, true);

  const correct = setup();
  assert.equal(await correct.context.submitPlayerResponse({ correct: true }), true);
  assert.equal(correct.player.lastPointsEarned, 2924);
  assert.equal(correct.player.speedBoostActive, false);
  assert.equal(correct.player.multiplierActive, false);
  assert.equal(correct.player.receiptSpeedBoost, true);
  assert.equal(correct.player.receiptMultiplier, true);
  console.log('PASS: boosts persist after wrong answers and score/receipt match after correct answers');
})().catch(error => { console.error(error); process.exitCode = 1; });
