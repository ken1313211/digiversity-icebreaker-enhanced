const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('app.js', 'utf8');
const code = source.slice(source.indexOf('let sandboxActive = false;'), source.indexOf('function setSandboxStatus(msg)'));
const session = {
  state: 'question', currentQuestionIndex: 0, questionStartTime: Date.now() - 2000,
  questions: [{ type: 'multiple-choice', correct: 2, options: ['A', 'B', 'C', 'D'], timeLimit: 20 }],
  players: Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`bot${i}`, {
    name: `Bot ${i + 1}`, isBot: true, answeredQuestionIndex: -1, score: 0, streak: 0
  }]))
};
let lastUpdates;
let lastAttack;
const context = vm.createContext({
  currentGamePin: '123456', database: {}, Date, Math,
  ref: (_, path) => path, get: async () => ({ val: () => session }),
  update: async (_, changes) => { lastUpdates = changes; },
  push: path => `${path}/attack1`,
  set: async (path, attack) => { lastAttack = { path, ...attack }; },
  increment: delta => ({ delta }),
  normalizeQuestionType: q => q.type,
  isResponseCorrect: (q, response) => response.optionIndex === q.correct,
  setSandboxStatus() {}, document: { getElementById: () => ({ checked: true, value: 'blur' }) },
  clearTimeout, setTimeout,
});
vm.runInContext(code, context);

(async () => {
  const count = await context.answerSandboxBots();
  assert.equal(count, 80);
  assert.equal(lastUpdates.totalAnswers.delta, 80, 'answer total increments for every bot');
  assert.equal(Object.keys(lastUpdates).filter(key => key.startsWith('answers/')).length, 80);
  assert.equal(Object.entries(lastUpdates).filter(([key]) => key.startsWith('answersCount/')).reduce((sum, [, value]) => sum + value.delta, 0), 80);
  for (let i = 0; i < 80; i++) {
    assert.equal(lastUpdates[`players/bot${i}/hasAnswered`], true);
    assert.equal(lastUpdates[`players/bot${i}/answeredQuestionIndex`], 0);
    assert.ok(lastUpdates[`answers/bot${i}`]);
    session.players[`bot${i}`].answeredQuestionIndex = 0;
  }
  assert.equal(await context.answerSandboxBots(), 0, 'same round cannot answer twice');
  const dashboard = context.sandboxBotResponse({ type: 'dashboard', dashboardData: { correctIndex: 3, labels: ['A', 'B', 'C', 'D'] } }, true);
  assert.equal(dashboard.optionIndex, 3);
  session.players.demo = { name: 'DemoPlayer', isSim: true };
  await context.sendSandboxBotAttack();
  assert.match(lastAttack.path, /\/attacks\/attack1$/);
  assert.equal(lastAttack.attackerId, 'bot0');
  assert.equal(lastAttack.targetId, 'demo');
  assert.equal(lastAttack.type, 'blur');
  session.state = 'leaderboard';
  await context.sendSandboxBotAttack();
  assert.match(lastAttack.path, /\/queuedAttacks\/attack1$/);
  console.log('PASS: 80 bots answer once, count accurately, and attack the demo phone');
})().catch(error => { console.error(error); process.exitCode = 1; });
