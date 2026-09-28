const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('app.js', 'utf8');
const helpers = source.slice(source.indexOf('function getRegisteredPlayerEntries('), source.indexOf('function switchView('));
const records = {};
const disconnects = new Map();
const listeners = [];
const operations = [];
let key = 0;
function element(tag = 'div') { return {tagName:tag, dataset:{}, children: [],
  append(...items) {items.forEach(item => this.appendChild(item));},
  appendChild(item) {item.parent = this; this.children.push(item);},
  querySelector(tagName) {return this.children.find(child => child.tagName === tagName) || null;},
  remove() {if(this.parent) this.parent.children = this.parent.children.filter(child => child !== this);},
  setAttribute() {}, addEventListener() {}}; }
const elements = Object.fromEntries(['player-count', 'player-count-summary', 'player-list', 'btn-start-game'].map(id => [id, element()]));
const context = vm.createContext({
  console, database: {}, currentGamePin: 'room', teamModeEnabled: false, window: {},
  document: {getElementById: id => elements[id], createElement: element},
  ref: (_, path) => ({path}),
  push: ref => ({path: `${ref.path}/c${++key}`, key: `c${key}`}),
  onValue: (ref, callback) => {const entry = {ref, callback, active: true}; listeners.push(entry); return () => entry.active = false;},
  onDisconnect: ref => ({
    remove: async () => {disconnects.set(ref.path, true); operations.push('arm');},
    cancel: async () => {disconnects.delete(ref.path); operations.push('cancel');}
  }),
  remove: async ref => {const [id, , connection] = ref.path.split('/').slice(3); if (records[id]?.connections) delete records[id].connections[connection]; operations.push('remove');},
  get: async ref => {
    const id = ref.path.split('/')[3];
    return { exists: () => Boolean(records[id]), val: () => records[id] || null };
  },
  update: async (ref, changes) => {
    operations.push('publish');
    const id = ref.path.split('/')[3];
    if (!records[id]) throw new Error('Player missing');
    for (const [path, value] of Object.entries(changes)) {
      if (path.startsWith('connections/')) {
        records[id].connections ||= {};
        records[id].connections[path.slice('connections/'.length)] = value;
      } else records[id][path] = value;
    }
  },
  showToast() {}, formatTeamShort: x => x
});
vm.runInContext('let playerPresenceGeneration=0, playerPresenceUnsubscribe=null, currentPlayerConnectionRef=null, hostPlayersUnsubscribe=null, lobbyPlayers={};\n' + helpers, context);
const online = players => context.getOnlinePlayerEntries(players).length;
async function connected(value) {
  const listener = [...listeners].reverse().find(item => item.active && item.ref.path === '.info/connected');
  await listener.callback({val: () => value});
}
(async () => {
  assert.equal(online({a: {name:'Alex', online:true}, b:{name:'Sam', online:false}, ghost:{online:false}, bad:{name:123}, nil:null}), 1);
  assert.equal(online({a:{name:'Alex', presenceVersion:1, online:true}}), 0, 'empty connections overrides stale online flag');
  assert.equal(online({a:{name:'Alex', presenceVersion:1, online:false, connections:{tab1:true,tab2:true}}}), 1, 'two tabs count as one player');
  assert.equal(online({bot:{name:'Bot',isBot:true}}), 1, 'host-managed bots remain playable');
  assert.equal(online({old:{name:'Old player'}}), 0, 'missing presence is not proof of an active player');
  const crowd = Object.fromEntries(Array.from({length:500}, (_, i) => [i, {name:`Player ${i}`, presenceVersion:1, connections:i < 417 ? {a:true,b:true} : null}]));
  assert.equal(online(crowd), 417, 'large roster counts players, not connections');
  const round = {a:{name:'Alex',online:true,hasAnswered:true,answeredQuestionIndex:2},b:{name:'Sam',online:true,hasAnswered:false},c:{name:'Kai',online:false,hasAnswered:true,answeredQuestionIndex:2}};
  assert.equal(context.haveOnlinePlayersAnswered(round, 2), false, 'offline answers cannot substitute for an online player');
  round.b.hasAnswered = true;
  round.b.answeredQuestionIndex = 1;
  assert.equal(context.haveOnlinePlayersAnswered(round, 2), false, 'previous-round answers do not count');
  round.b.answeredQuestionIndex = 2;
  assert.equal(context.haveOnlinePlayersAnswered(round, 2), true);
  assert.equal(context.haveOnlinePlayersAnswered({}, 2), false);
  records.alex = {name:'Alex', presenceVersion:1, connections:{otherTab:true}};
  await context.setupPlayerPresence('room', 'alex');
  await connected(true);
  assert.deepEqual(operations.slice(0,2), ['arm', 'publish']);
  assert.equal(Object.keys(records.alex.connections).length, 2);
  await context.stopPlayerPresence();
  assert.deepEqual(Object.keys(records.alex.connections), ['otherTab'], 'leaving one connection retains the other');
  assert.equal(online(records), 1);
  delete records.alex.connections.otherTab;
  assert.equal(online(records), 0);
  await context.setupPlayerPresence('room', 'alex');
  await connected(true);
  assert.equal(online(records), 1, 'reconnect restores one player');
  // A kicked player cannot be recreated by a reconnect callback.
  delete records.alex;
  await connected(false);
  await connected(true);
  assert.equal(records.alex, undefined);
  await context.stopPlayerPresence();
  context.subscribeHostPlayers('room');
  const oldListener = listeners.at(-1);
  await oldListener.callback({val: () => ({a:{name:'Alex',online:true},b:{name:'Sam',online:false},ghost:{online:false}})});
  assert.equal(elements['player-count'].innerText, 1);
  assert.equal(elements['player-count-summary'].textContent, '2 joined · 1 offline');
  assert.equal(elements['btn-start-game'].disabled, false);
  context.currentGamePin = 'next';
  context.subscribeHostPlayers('next');
  assert.equal(oldListener.active, false, 'old room listener is detached');
  await oldListener.callback({val: () => crowd});
  assert.equal(elements['player-count'].innerText, 0, 'queued old-room callback cannot overwrite count');
  assert.equal(elements['btn-start-game'].disabled, true);
  console.log('PASS: roster validation, 500-player count, multiple tabs, cleanup ordering, reconnect, kick, room switching, count/summary/start-button consistency');
})().catch(error => {console.error(error); process.exitCode=1;});
