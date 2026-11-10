/** Beispielspiel 1 – im CMS als "Code" gepflegt. */
export const pansenPuzzleHtml = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Pansen-Puzzle</title>
<style>
  :root{--green:#1C6B4C;--lime:#8DBF3F;--sand:#F1F8F4}
  *{box-sizing:border-box}
  /* Füllt immer genau die verfügbare Fläche: Kopf oben, Fuß unten, das Raster nimmt den Rest. */
  html,body{height:100%}
  body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--sand);color:#101915;
    display:flex;flex-direction:column;gap:clamp(8px,2vmin,16px);padding:clamp(10px,3vmin,24px);overflow:hidden}
  header{display:flex;align-items:center;justify-content:space-between;gap:12px}
  h1{font-size:clamp(16px,3vmin,24px);margin:0}
  .who{font-size:clamp(11px,1.8vmin,14px);color:#5B6B63;background:#fff;border-radius:999px;padding:4px 10px;white-space:nowrap}
  .bar{flex:none;height:8px;border-radius:999px;background:#DCEFE5;overflow:hidden}
  .bar>i{display:block;height:100%;width:0;background:var(--lime);transition:width .2s}
  /* Querformat 3 × 2, Hochformat 2 × 3. Begrenzte Breite, damit Kacheln nicht zu flachen Streifen werden. */
  .grid{flex:1;min-height:0;width:100%;max-width:calc(150vh);margin:0 auto;display:grid;
    grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);gap:clamp(6px,2vmin,14px)}
  @media (orientation:portrait){.grid{grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(3,1fr)}}
  .tile{min-width:0;min-height:0;width:100%;height:100%;border-radius:16px;border:2px solid #DCEFE5;background:#fff;cursor:pointer;
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(2px,1vmin,8px);
    font-size:clamp(12px,2.6vmin,20px);font-weight:600;color:#2C3A33;padding:6px;transition:transform .12s,border-color .12s;
    container-type:size}
  .tile:hover{transform:translateY(-2px);border-color:var(--green)}
  .tile b{font-size:clamp(20px,9vmin,72px);line-height:1}
  /* Emoji und Beschriftung wachsen mit der Kachel, nicht mit dem Fenster. */
  @supports (font-size:1cqmin){.tile{font-size:clamp(12px,8cqmin,20px)}.tile b{font-size:clamp(20px,38cqmin,110px)}}
  /* Kästchen links oben: zeigt immer, was angekreuzt ist – auch nach der Auswertung. */
  .tile{position:relative}
  .box{position:absolute;top:clamp(6px,1.4vmin,10px);left:clamp(6px,1.4vmin,10px);width:clamp(18px,3.4vmin,26px);height:clamp(18px,3.4vmin,26px);
    border:2px solid #8A9A92;border-radius:4px;background:#fff;display:grid;place-items:center;color:#fff;font-size:.8em;line-height:1}
  .tile.picked{border-color:#2C4F7C;box-shadow:inset 0 0 0 2px #2C4F7C}
  .tile.picked .box{background:#2C4F7C;border-color:#2C4F7C}
  .tile.picked .box::after{content:"✓";font-weight:700}
  /* Auswertung – zusätzlich in Worten, nicht nur über Farbe. */
  .verdict{display:none;font-size:clamp(11px,1.8vmin,14px);font-weight:700;border-radius:999px;padding:2px 8px;white-space:nowrap}
  .tile.hit,.tile.miss{border-color:var(--green);background:#E8F5EE;box-shadow:none}
  .tile.wrong{border-color:#B4372C;background:#FBEAE8;box-shadow:none}
  .tile.miss{border-style:dashed}
  .tile.hit .verdict{display:inline-block;background:var(--green);color:#fff}
  .tile.wrong .verdict{display:inline-block;background:#B4372C;color:#fff}
  .tile.miss .verdict{display:inline-block;border:2px solid var(--green);color:var(--green);background:#fff}
  .tile:disabled{cursor:default;transform:none}
  footer{flex:none;display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:10px}
  button{border:0;border-radius:12px;padding:clamp(8px,1.6vmin,12px) clamp(14px,2.4vmin,20px);font-weight:600;font-size:clamp(13px,2vmin,16px);cursor:pointer;background:var(--green);color:#fff}
  button.ghost{background:#fff;color:var(--green);border:1px solid #DCEFE5}
  #msg{font-size:clamp(12px,2vmin,16px);color:#5B6B63;flex:1 1 220px}
  @media (max-width:480px){#msg{flex-basis:100%}}
  /* Sehr niedrige Flächen: lieber scrollen als unlesbar klein. */
  @media (max-height:240px){body{overflow:auto}.grid{flex:none;height:200px}}
  @media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
  <header>
    <h1>Pansen-Puzzle</h1>
    <span class="who">Spieler: <b id="who">…</b></span>
  </header>
  <div class="bar"><i id="bar"></i></div>
  <div class="grid" id="board"></div>
  <footer>
    <span id="msg">Finde drei Bausteine, die Methan reduzieren.</span>
    <button class="ghost" id="reset">Neu</button>
    <button id="check">Prüfen</button>
  </footer>

<script>
  var send = function (type, payload) {
    parent.postMessage({ source: 'ntk-game', type: type, payload: payload || {} }, '*');
  };

  var TILES = [
    { emoji: '🌾', label: 'Fasern', good: false },
    { emoji: '🫒', label: 'Ölsaat', good: true },
    { emoji: '💧', label: 'Wasser', good: false },
    { emoji: '🌿', label: 'Heu', good: false },
    { emoji: '🧪', label: 'Additiv', good: true },
    { emoji: '🥬', label: 'Frischgras', good: true }
  ];

  var picked = {};
  var done = false;
  var points = 0;
  var player = { name: 'Gast' };

  function render() {
    var board = document.getElementById('board');
    board.innerHTML = '';
    TILES.forEach(function (t, i) {
      var b = document.createElement('button');
      b.className = 'tile';
      b.innerHTML = '<span class="box" aria-hidden="true"></span><b>' + t.emoji + '</b>' + t.label + '<span class="verdict"></span>';
      b.setAttribute('aria-pressed', picked[i] ? 'true' : 'false');
      b.onclick = function () { pick(i); };
      if (picked[i]) b.classList.add('picked');
      board.appendChild(b);
    });
    var count = Object.keys(picked).length;
    document.getElementById('bar').style.width = (count / 3) * 100 + '%';
  }

  function pick(i) {
    if (done) return;
    if (picked[i]) { delete picked[i]; }
    else if (Object.keys(picked).length < 3) { picked[i] = true; }
    points = Object.keys(picked).reduce(function (sum, k) {
      return sum + (TILES[k].good ? 40 : -20);
    }, 0);
    send('SCORE', { points: Math.max(0, points), maxPoints: 200 });
    render();
  }

  function check() {
    if (done) return;
    done = true;
    var hits = Object.keys(picked).filter(function (k) { return TILES[k].good; }).length;
    points = Math.max(0, hits * 60 - (Object.keys(picked).length - hits) * 20);
    document.getElementById('msg').textContent =
      hits + ' von 3 richtig – ' + points + ' Punkte';
    document.querySelectorAll('.tile').forEach(function (el, i) {
      var v = el.querySelector('.verdict');
      el.disabled = true;
      if (picked[i] && TILES[i].good) { el.classList.add('hit'); v.textContent = '✓ Richtig gewählt'; }
      else if (picked[i]) { el.classList.add('wrong'); v.textContent = '✗ Falsch gewählt'; }
      else if (TILES[i].good) { el.classList.add('miss'); v.textContent = 'Richtige Antwort'; }
    });
    send('COMPLETE', { points: points, maxPoints: 200, durationMs: 45000 });
  }

  function reset() {
    picked = {}; done = false; points = 0;
    document.getElementById('msg').textContent = 'Finde drei Bausteine, die Methan reduzieren.';
    render();
    send('SCORE', { points: 0, maxPoints: 200 });
  }

  document.getElementById('check').onclick = check;
  document.getElementById('reset').onclick = reset;

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.source !== 'ntk-platform') return;
    if (d.type === 'INIT') {
      player = d.payload.player || player;
      document.getElementById('who').textContent = player.name;
      send('READY');
    }
    if (d.type === 'RESET') reset();
  });

  render();
  send('READY');
<\/script>
</body>
</html>`;

/** Beispielspiel 2 – als komplettes HTML importiert. */
export const stallklimaHtml = `<!doctype html>
<html lang="de">
<head><meta charset="utf-8"><title>Stallklima-Simulator</title>
<style>
  body{font-family:Inter,system-ui,sans-serif;margin:0;padding:18px;background:#FBF9F3;color:#101915}
  h1{font-size:18px;margin:0 0 4px}
  p{color:#5B6B63;font-size:13px;margin:0 0 16px}
  label{display:block;font-size:13px;font-weight:600;margin:14px 0 4px}
  input{width:100%}
  .row{display:flex;justify-content:space-between;font-size:12px;color:#5B6B63}
  .out{margin-top:16px;background:#fff;border:1px solid #E7E0CE;border-radius:14px;padding:14px}
  .val{font-size:28px;font-weight:700;font-family:Bitter,serif}
  button{margin-top:12px;border:0;border-radius:12px;padding:10px 16px;font-weight:600;background:#1C6B4C;color:#fff;cursor:pointer}
</style></head>
<body>
  <h1>Stallklima-Simulator</h1>
  <p>Stelle Temperatur und Luftfeuchte so ein, dass sich die Schweine wohlfühlen.</p>
  <label>Temperatur <span id="tv">22 °C</span></label>
  <input id="temp" type="range" min="10" max="34" value="22">
  <label>Luftfeuchte <span id="hv">65 %</span></label>
  <input id="hum" type="range" min="30" max="95" value="65">
  <div class="out">
    <div class="val" id="status">Noch nicht geprüft</div>
    <div id="hint">Optimal: 20–24 °C und 55–70 % Feuchte.</div>
    <button id="check">Prüfen</button>
  </div>
<script>
  var send=function(t,p){parent.postMessage({source:'ntk-game',type:t,payload:p||{}},'*')};
  var player={name:'Gast'};
  var t=document.getElementById('temp'),h=document.getElementById('hum');
  function sync(){document.getElementById('tv').textContent=t.value+' °C';
    document.getElementById('hv').textContent=h.value+' %';}
  t.oninput=sync;h.oninput=sync;sync();
  window.addEventListener('message',function(e){
    var d=e.data;if(!d||d.source!=='ntk-platform')return;
    if(d.type==='INIT'){player=d.payload.player;send('READY');}
  });
  document.getElementById('check').onclick=function(){
    var T=+t.value,H=+h.value;
    var okT=T>=20&&T<=24, okH=H>=55&&H<=70;
    var pts=(okT?75:20)+(okH?75:20);
    document.getElementById('status').textContent=pts+' / 150 Punkte';
    document.getElementById('hint').textContent =
      (!okT?'Temperatur außerhalb des Optimums. ':'')+
      (!okH?'Luftfeuchte außerhalb des Optimums.':'')||'Perfekt eingestellt!';
    send('COMPLETE',{points:pts,maxPoints:150,durationMs:60000});
  };
  send('READY');
<\/script>
</body></html>`;
