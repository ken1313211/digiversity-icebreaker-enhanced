const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('app.js', 'utf8');
const code = source.slice(source.indexOf('async function showPlayerTargetSelector('), source.indexOf('function showShieldActiveLocalEffect('));
function node(tag = 'div') {
  let html = '';
  const classes = new Set();
  return {tag, children: [], dataset: {}, style: {}, disabled:false,
    get innerHTML(){return html;}, set innerHTML(value){html=value;this.children=[];},
    classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x),contains:x=>classes.has(x)},
    appendChild(child){this.children.push(child);return child;},
    querySelectorAll(selector){return this.children.filter(child => child.className?.includes(selector.slice(1)));},
    setAttribute() {}, addEventListener(event,handler){this[`on${event}`]=handler;}, blur() {}, focus() {}
  };
}
function setup(state = 'question', team = null) {
  const elements = Object.fromEntries(['player-target-modal','player-target-list','btn-use-target','target-selection-summary','target-power-title','target-power-description','input-target-search'].map(id=>[id,node()]));
  const session = {state, players:{me:{name:'Me',online:true,team,inventory:[{type:'blur'},{type:'blur'}],score:20},rival:{name:'Rival',online:true,team:team?'blue':null,score:100}}};
  const writes = [];
  let rejectWrite = false, nextKey = 0;
  const context = vm.createContext({
    database:{}, currentGamePin:'123456', currentGameState:state, myPlayerId:'me', myNickname:'Me', selectedInventoryIndex:0,
    TEAM_COLORS:[{key:'red'},{key:'blue',color:'#0078d2'}], POWERUP_HINTS:{blur:'Obscure an opponent’s screen'},
    document:{activeElement:null,getElementById:id=>elements[id],createElement:node},
    ref:(_,path)=>({path}), push:ref=>({key:`a${++nextKey}`,path:`${ref.path}/a${nextKey}`}),
    get:async()=>({val:()=>session}), update:async(_,changes)=>{if(rejectWrite)throw Error('Network unavailable');writes.push(changes);},
    getOnlinePlayerEntries:players=>Object.entries(players).filter(([,p])=>p?.online===true&&typeof p.name==='string'),
    getRegisteredPlayerEntries:players=>Object.entries(players).filter(([,p])=>typeof p?.name==='string'),
    normalizePowerupItem:item=>({type:item?.type||'unknown'}),getTeamLabel:key=>key,showToast(){},
  });
  vm.runInContext(code,context);
  return {context,elements,session,writes,setReject:value=>rejectWrite=value};
}
async function selectAndUse(test, targetText) {
  await test.context.showPlayerTargetSelector('blur','Foggy Window',0,false);
  const button = test.elements['player-target-list'].children.find(child=>(child.textContent || child.innerHTML)?.includes(targetText));
  assert.ok(button, `target ${targetText} offered`);
  test.context.document.activeElement=button;
  button.onclick();
  assert.equal(test.elements['btn-use-target'].disabled,false);
  await test.elements['btn-use-target'].onclick();
}
(async()=>{
  const live=setup();
  await selectAndUse(live,'Leader');
  assert.equal(live.writes.length,1);
  assert.deepEqual(Array.from(live.writes[0]['players/me/inventory']).map(x=>x.type),['blur']);
  assert.ok(live.writes[0]['attacks/a1']);
  assert.equal(live.writes[0]['queuedAttacks/a1'],undefined);
  assert.equal(live.elements['player-target-modal'].classList.contains('hidden'),true);

  const failed=setup();failed.setReject(true);
  await selectAndUse(failed,'Leader');
  assert.equal(failed.writes.length,0);
  assert.equal(failed.session.players.me.inventory.length,2,'failed send keeps inventory');
  assert.equal(failed.elements['btn-use-target'].disabled,false,'retry remains available');

  const queued=setup('leaderboard');
  await selectAndUse(queued,'Leader');
  assert.ok(queued.writes[0]['queuedAttacks/a1']);
  assert.equal(queued.writes[0]['attacks/a1'],undefined);

  const team=setup('question','red');
  await selectAndUse(team,'Sabotage blue');
  assert.equal(team.writes[0]['players/me/inventory'].length,0,'team attack costs two matching powers');
  assert.equal(team.writes[0]['attacks/a1'].targetId,'rival');
  console.log('PASS: live attack, queued attack, atomic cost/event write, failed-send retry, team attack cost');
})().catch(error=>{console.error(error);process.exitCode=1;});
