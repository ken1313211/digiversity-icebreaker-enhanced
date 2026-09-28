const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('app.js', 'utf8');
const code = source.slice(source.indexOf('async function activateBuffItem('), source.indexOf('const PLAYER_TUTORIAL_SLIDES ='));

function setup() {
  const player = { inventory: [{ type: 'shield' }, { type: 'speed_boost' }], shieldCount: 0 };
  let fail = false;
  let writes = 0;
  const messages = [];
  const context = vm.createContext({
    currentGamePin: '123456', myPlayerId: 'me', powerActionBusy: false, database: {},
    ref: (_, path) => path,
    normalizePowerupItem: item => ({ type: item?.type || 'unknown' }),
    runTransaction: async (_, callback) => {
      if (fail) throw new Error('Network unavailable');
      const next = callback(player);
      if (!next) return { committed: false };
      Object.assign(player, next);
      writes++;
      return { committed: true };
    },
    showShieldActiveLocalEffect: () => messages.push('shield'),
    showToast: message => messages.push(message),
    console: { error() {} },
  });
  vm.runInContext(code, context);
  return { context, player, messages, get writes() { return writes; }, setFail: value => { fail = value; } };
}

(async () => {
  const success = setup();
  await success.context.activateBuffItem(0, { type: 'shield', name: 'Defensive Shield' });
  assert.equal(success.writes, 1);
  assert.equal(success.player.inventory.length, 1);
  assert.equal(success.player.shieldCount, 1);
  assert.equal(success.player.shieldActive, true);
  assert.deepEqual(success.messages, ['shield']);

  const failed = setup();
  failed.setFail(true);
  await failed.context.activateBuffItem(0, { type: 'shield', name: 'Defensive Shield' });
  assert.equal(failed.player.inventory.length, 2, 'failed activation preserves the card');
  assert.equal(failed.player.shieldCount, 0);
  assert.equal(failed.context.powerActionBusy, false, 'activation can be retried');

  const stale = setup();
  await stale.context.activateBuffItem(1, { type: 'shield', name: 'Defensive Shield' });
  assert.equal(stale.writes, 0, 'a moved card cannot activate the wrong power');
  assert.equal(stale.player.inventory.length, 2);
  console.log('PASS: buff consumption, effect, failed-write preservation, stale-card guard');
})().catch(error => { console.error(error); process.exitCode = 1; });
