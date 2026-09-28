const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('app.js', 'utf8');
const code = source.slice(source.indexOf('const BOSS_PORTRAITS ='), source.indexOf('function showHostLeaderboard()'));
const elements = {};
for (const surface of ['host', 'player']) {
  const frame = { dataset: {}, classList: { remove() {}, add() {} }, offsetWidth: 100 };
  const track = { attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } };
  elements[`${surface}-boss-portrait`] = { parentElement: frame };
  elements[`${surface}-boss-stage`] = {};
  elements[`${surface}-boss-hp-bar`] = { parentElement: track, style: {} };
  elements[`${surface}-boss-hp-text`] = {};
}
const context = vm.createContext({ document: { getElementById: id => elements[id] } });
vm.runInContext(code, context);

assert.equal(context.getBossStage(1000, 1000), 'confident');
assert.equal(context.getBossStage(601, 1000), 'confident');
assert.equal(context.getBossStage(600, 1000), 'worried');
assert.equal(context.getBossStage(251, 1000), 'worried');
assert.equal(context.getBossStage(250, 1000), 'alarmed');
assert.equal(context.getBossStage(1, 1000), 'alarmed');
assert.equal(context.getBossStage(0, 1000), 'defeated');

context.updateBossPresentation('host', 250, 1000);
assert.equal(elements['host-boss-portrait'].parentElement.dataset.stage, 'alarmed');
assert.match(elements['host-boss-portrait'].src, /alarmed\.png$/);
assert.equal(elements['host-boss-hp-bar'].style.width, '25%');
assert.equal(elements['host-boss-hp-text'].textContent, '250 / 1000 HP');
assert.equal(elements['host-boss-hp-bar'].parentElement.attributes['aria-valuenow'], '250');

context.updateBossPresentation('player', -10, 1000);
assert.equal(elements['player-boss-portrait'].parentElement.dataset.stage, 'defeated');
assert.equal(elements['player-boss-hp-bar'].style.width, '0%');
assert.equal(elements['player-boss-hp-text'].textContent, '0 / 1000 HP');
console.log('PASS: boss expression thresholds and synchronized host/player health displays');
