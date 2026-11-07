/** Beispielspiel 1 – im CMS als "Code" gepflegt. */
export const pansenPuzzleHtml = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Pansen-Puzzle</title>
<style>
  :root{--green:#1C6B4C;--lime:#8DBF3F;--sand:#F1F8F4}
  *{box-sizing:border-box}
  body{margin:0;font-family:Inter,system-ui,sans-serif;background:var(--sand);color:#101915;padding:18px}
  header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
  h1{font-size:18px;margin:0}
  .who{font-size:12px;color:#5B6B63;background:#fff;border-radius:999px;padding:4px 10px}
  .bar{height:8px;border-radius:999px;background:#DCEFE5;overflow:hidden;margin-bottom:16px}
  .bar>i{display:block;height:100%;width:0;background:var(--lime);transition:width .2s}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .tile{aspect-ratio:1;border-radius:16px;border:2px solid #DCEFE5;background:#fff;cursor:pointer;
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-size:13px;
    font-weight:600;color:#2C3A33;padding:6px;transition:transform .12s,border-color .12s}
  .tile:hover{transform:translateY(-2px);border-color:var(--green)}
  .tile b{font-size:26px}
  .tile.ok{border-color:var(--green);background:#E8F5EE}
  .tile.bad{border-color:#B4372C;background:#FBEAE8}
  footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:16px}
  button{border:0;border-radius:12px;padding:10px 16px;font-weight:600;font-size:14px;cursor:pointer;background:var(--green);color:#fff}
  button.ghost{background:#fff;color:var(--green);border:1px solid #DCEFE5}
  #msg{font-size:13px;color:#5B6B63;flex:1}
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
      b.innerHTML = '<b>' + t.emoji + '</b>' + t.label;
      b.onclick = function () { pick(i); };
      if (picked[i]) b.classList.add('ok');
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
    done = true;
    var hits = Object.keys(picked).filter(function (k) { return TILES[k].good; }).length;
    points = Math.max(0, hits * 60 - (Object.keys(picked).length - hits) * 20);
    document.getElementById('msg').textContent =
      hits + ' von 3 richtig – ' + points + ' Punkte';
    document.querySelectorAll('.tile').forEach(function (el, i) {
      el.classList.remove('ok');
      if (TILES[i].good) el.classList.add('ok');
      else if (picked[i]) el.classList.add('bad');
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
  send('RESIZE', { height: 460 });
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
