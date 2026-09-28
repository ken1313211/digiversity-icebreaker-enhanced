const fs = require('node:fs');
const base = fs.readFileSync('index.html', 'utf8')
  .replace('<script type="module" src="firebase-config.js"></script>', '')
  .replace('<script type="module" src="app.js"></script>', '')
  .replace('href="style.css"', 'href="../style.css"')
  .replace('href="arena-ui.css"', 'href="../arena-ui.css"')
  .replaceAll('src="assets/boss/', 'src="../assets/boss/');
const host = base
  .replace('id="host-boss-battle-overlay" class="modal boss-overlay hidden"', 'id="host-boss-battle-overlay" class="modal boss-overlay"')
  .replace('id="host-boss-portrait" src="../assets/boss/jose-mari-chan-confident.png"', 'id="host-boss-portrait" src="../assets/boss/jose-mari-chan-alarmed.png"')
  .replace('id="host-boss-stage">READY FOR BATTLE', 'id="host-boss-stage">FINAL STRETCH')
  .replace('id="host-boss-hp-text">1000 / 1000 HP', 'id="host-boss-hp-text">250 / 1000 HP')
  .replace('id="host-boss-hp-bar" class="boss-hp-fill"', 'id="host-boss-hp-bar" class="boss-hp-fill" style="width:25%"');
const player = base
  .replace('id="player-boss-battle-overlay" class="modal boss-overlay hidden"', 'id="player-boss-battle-overlay" class="modal boss-overlay"')
  .replace('id="player-boss-portrait" src="../assets/boss/jose-mari-chan-confident.png"', 'id="player-boss-portrait" src="../assets/boss/jose-mari-chan-worried.png"')
  .replace('id="player-boss-stage">READY FOR BATTLE', 'id="player-boss-stage">GETTING WORRIED')
  .replace('id="player-boss-hp-text">1000 / 1000 HP', 'id="player-boss-hp-text">600 / 1000 HP')
  .replace('id="player-boss-hp-bar" class="boss-hp-fill"', 'id="player-boss-hp-bar" class="boss-hp-fill" style="width:60%"');
fs.writeFileSync('qa/boss-host-preview.html', host);
fs.writeFileSync('qa/boss-player-preview.html', player);
