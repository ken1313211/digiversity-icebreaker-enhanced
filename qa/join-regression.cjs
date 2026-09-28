const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('app.js', 'utf8');
const start = source.indexOf("document.getElementById('form-join')?.addEventListener('submit'");
const end = source.indexOf("        onValue(ref(database, `sessions/${pin}/players/${myPlayerId}`)", start);
const code = source.slice(start, end) + ' listenerReached = true; });';
async function join(pin, players, fail = false) {
  let handler;
  const alerts = [];
  const fields = { 'input-pin': {value: pin}, 'input-nickname': {value: 'Alex'}, 'btn-join-submit': {} };
  const context = { listenerReached: false, isFirebaseEnabled: true, IS_SIMULATOR_CLIENT: true,
    document: { getElementById: id => id === 'form-join' ? {addEventListener: (_, fn) => handler = fn} : fields[id] },
    alert: message => alerts.push(message), console: {error() {}}, database: {},
    ref: (_, path) => path, get: async () => { if (fail) throw Error('Connection failed'); return {exists: () => true, val: () => ({players, state: 'question'})}; },
    getPlayerDeviceId: () => 'device', showToast() {},
  };
  vm.runInNewContext(code, context);
  await handler({preventDefault() {}});
  return {context, alerts, button: fields['btn-join-submit']};
}
(async () => {
  const malformed = await join('123456', {a: {name: 123}, b: {}, c: null, d: 'old record'});
  assert.deepEqual(malformed.alerts, ['Game has already started! You cannot join as a new player.']);
  const failed = await join('123456', {}, true);
  assert.equal(failed.context.listenerReached, false);
  assert.equal(failed.button.disabled, false);
  const invalid = await join('123/45', {});
  assert.match(invalid.alerts[0], /6-digit/);
  const duplicate = await join('123456', {a: {name: 'aLeX', deviceId: 'other'}});
  assert.match(duplicate.alerts[0], /another device/);
  console.log('PASS: malformed names, failed-join cleanup, PIN validation, case-insensitive duplicate check');
})();
