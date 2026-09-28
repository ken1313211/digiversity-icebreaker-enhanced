const fs = require('node:fs');
let html = fs.readFileSync('index.html','utf8')
  .replace('<script type="module" src="firebase-config.js"></script>','')
  .replace('<script type="module" src="app.js"></script>','')
  .replace('href="style.css"','href="../style.css"')
  .replace('href="arena-ui.css"','href="../arena-ui.css"')
  .replace('class="view active"','class="view"');
const player = html.replace('id="view-player-question" class="view player-game-view"','id="view-player-question" class="view active player-game-view"')
  .replace('</body>', `<script>
const slots=document.getElementById('player-slots-container');
slots.innerHTML='<button class="inventory-slot power-card power-card-buff"><span class="inventory-emoji">🛡️</span><span class="power-card-copy"><strong>Defensive Shield</strong><small>Blocks the next attack</small></span></button><button class="inventory-slot power-card power-card-attack"><span class="inventory-emoji">🌫️</span><span class="power-card-copy"><strong>Foggy Window</strong><small>Obscure an opponent’s screen</small></span></button><div class="inventory-slot empty">EMPTY SLOT</div>';
document.getElementById('player-question-text').textContent='Which DAX function adds values across a column?';
['COUNT()','SUM()','FILTER()','RELATED()'].forEach((answer,index)=>document.getElementById('player-answer-'+index).textContent=answer);
document.getElementById('player-score-display').textContent='2,450';
document.getElementById('player-potential-points').textContent='1,000';
</script></body>`);
const host = html.replace('id="view-host-question" class="view host-layout"','id="view-host-question" class="view active host-layout"')
  .replace('</body>', `<script>
document.getElementById('host-question-text').textContent='Which DAX function adds values across a column?';
['COUNT()','SUM()','FILTER()','RELATED()'].forEach((answer,index)=>document.getElementById('host-ans-'+index).textContent=answer);
document.getElementById('host-timer').textContent='20';
document.getElementById('answers-count').textContent='18 Answers';
</script></body>`);
const power = player.replace('</body>', `<script>
const modal=document.getElementById('player-target-modal');modal.classList.remove('hidden');
document.getElementById('target-power-title').textContent='Foggy Window';
document.getElementById('target-power-description').textContent='Obscure an opponent’s screen. Select a target below.';
const list=document.getElementById('player-target-list');
['Leader — Alex','Random player','Sam','Riley','Morgan','Kai'].forEach((name,index)=>{const button=document.createElement('button');button.className='btn btn-secondary target-btn'+(index===0?' is-selected':'');button.textContent=name;list.appendChild(button);});
document.getElementById('target-selection-summary').textContent='Foggy Window → Alex · fires now';
document.getElementById('btn-use-target').disabled=false;
</script></body>`);
const lobby = html.replace('id="view-host-lobby" class="view"','id="view-host-lobby" class="view active"')
  .replace('</body>', `<script>
document.getElementById('display-game-pin').textContent='482916';
document.getElementById('display-join-url').innerHTML='Join at <strong>digiversity.game</strong> with PIN:';
document.getElementById('player-count').textContent='6';
document.getElementById('player-count-summary').textContent='7 joined · 1 offline';
document.getElementById('btn-start-game').disabled=false;
['Alex','Jamie','Sam','Riley','Morgan','Kai'].forEach(name=>{const tag=document.createElement('div');tag.className='player-tag';tag.textContent=name;document.getElementById('player-list').appendChild(tag);});
new QRCode(document.getElementById('qr-code-container'),{text:'https://digiversity.game/?pin=482916',width:150,height:150});
</script></body>`);
const result = html.replace('id="view-player-result" class="view"','id="view-player-result" class="view active"')
  .replace('</body>', `<script>
document.getElementById('player-result-title').textContent='Correct!';
document.querySelector('#view-player-result .points-badge').classList.add('result-correct');
document.getElementById('player-points-earned').textContent='900';
document.getElementById('player-points-breakdown').classList.remove('hidden');
document.getElementById('player-rank-number').textContent='3';
document.getElementById('player-rank-total').textContent='24';
document.getElementById('player-total-score').textContent='3,450';
</script></body>`);
const dashboard = html.replace('id="view-player-dashboard" class="view player-dashboard-view"','id="view-player-dashboard" class="view active player-dashboard-view"')
  .replace('</body>', `<script>
document.getElementById('player-dash-question').textContent='Which region has the highest sales?';
document.getElementById('player-dash-score').textContent='2,450';
document.getElementById('player-dash-potential-points').textContent='1,000';
document.getElementById('player-chart-canvas').classList.add('hidden');
const kpi=document.getElementById('player-kpi-container');kpi.classList.remove('hidden');
['North 76K','South 62K','East 91K','West 84K'].forEach(label=>{const card=document.createElement('button');card.className='kpi-card';card.textContent=label;kpi.appendChild(card);});
document.getElementById('player-dash-slots-container').innerHTML='<button class="inventory-slot power-card power-card-buff"><span class="inventory-emoji">🛡️</span><span class="power-card-copy"><strong>Defensive Shield</strong><small>Blocks the next attack</small></span></button><button class="inventory-slot power-card power-card-attack"><span class="inventory-emoji">🌫️</span><span class="power-card-copy"><strong>Foggy Window</strong><small>Obscure an opponent’s screen</small></span></button><div class="inventory-slot empty">EMPTY SLOT</div>';
document.getElementById('player-dash-locked').classList.remove('hidden');
</script></body>`);
fs.writeFileSync('qa/player-preview.html',player);
fs.writeFileSync('qa/host-preview.html',host);
fs.writeFileSync('qa/power-preview.html',power);
fs.writeFileSync('qa/lobby-preview.html',lobby);
fs.writeFileSync('qa/result-preview.html',result);
fs.writeFileSync('qa/dashboard-preview.html',dashboard);
