const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const W = canvas.width, H = canvas.height;

const keys = {};
const state = {
  t: 0, score: 0, lives: 3, over: false,
  player: { x: W*0.3, y: H*0.5, vx: 0, vy: 0, r: 13, polarity: 1, pulseCd: 0 },
  anchor: { x: W*0.5, y: 90 },
  nodes: []
};

function spawnNode(){
  state.nodes.push({
    x: 520 + Math.random()*360,
    y: 130 + Math.random()*330,
    vx: (Math.random()-0.5)*1.3,
    vy: (Math.random()-0.5)*1.3,
    r: 14 + Math.random()*9,
    p: Math.random()<0.5?-1:1,
    hp: 3
  });
}

for(let i=0;i<8;i++) spawnNode();

addEventListener('keydown', e=>{ keys[e.key.toLowerCase()] = true; if(e.key===' ') flipPolarity(); if(e.key.toLowerCase()==='e') pulse(); if(state.over && e.key.toLowerCase()==='r') reset();});
addEventListener('keyup', e=> keys[e.key.toLowerCase()] = false);

document.querySelectorAll('#touchControls button').forEach(b=>{
  const a = b.dataset.act;
  b.addEventListener('touchstart', e=>{ e.preventDefault(); if(a==='left') keys.arrowleft=true; if(a==='right') keys.arrowright=true; if(a==='magnet') flipPolarity(); if(a==='pulse') pulse(); }, {passive:false});
  b.addEventListener('touchend', e=>{ e.preventDefault(); if(a==='left') keys.arrowleft=false; if(a==='right') keys.arrowright=false; }, {passive:false});
});

function flipPolarity(){ state.player.polarity *= -1; }
function pulse(){ if(state.player.pulseCd<=0){ state.player.pulseCd = 2.2; for(const n of state.nodes){ const dx=n.x-state.player.x,dy=n.y-state.player.y,d=Math.hypot(dx,dy)||1; if(d<180){ n.vx += dx/d*3; n.vy += dy/d*3; }} }}
function reset(){ location.reload(); }

function update(dt){
  if(state.over) return;
  state.t += dt;
  const p = state.player;
  p.pulseCd = Math.max(0,p.pulseCd-dt);

  const input = (keys.arrowleft||keys.a?-1:0)+(keys.arrowright||keys.d?1:0);
  p.vx += input*20*dt;

  const dxA = state.anchor.x-p.x, dyA = state.anchor.y-p.y;
  const distA = Math.hypot(dxA,dyA)||1;
  const spring = 0.016 * (distA-170);
  p.vx += dxA/distA*spring*80*dt;
  p.vy += dyA/distA*spring*80*dt;
  p.vy += 24*dt;
  p.vx *= 0.995; p.vy *= 0.995;
  p.x += p.vx; p.y += p.vy;

  if(p.x<20||p.x>W-20||p.y<20||p.y>H-20){ p.x=Math.min(W-20,Math.max(20,p.x)); p.y=Math.min(H-20,Math.max(20,p.y)); p.vx*=-0.7; p.vy*=-0.7; }

  for(const n of state.nodes){
    const dx=n.x-p.x, dy=n.y-p.y; const d=Math.hypot(dx,dy)||1;
    const mag = (p.polarity===n.p?-1:1) * 34 / (d*d*0.01+8);
    n.vx += dx/d*mag*dt*60; n.vy += dy/d*mag*dt*60;
    n.x += n.vx; n.y += n.vy;
    n.vx *= 0.995; n.vy *= 0.995;
    if(n.x<12||n.x>W-12) n.vx*=-1;
    if(n.y<12||n.y>H-12) n.vy*=-1;

    const hit = d < p.r+n.r;
    if(hit){
      const impact = Math.hypot(p.vx-n.vx,p.vy-n.vy);
      if(impact>2.6){ n.hp -= 1; p.vx -= dx/d*0.7; p.vy -= dy/d*0.7; if(n.hp<=0){ state.score += 120; n.dead=true; spawnNode(); } }
      else { state.lives -= 1; p.vx -= dx/d*1.8; p.vy -= dy/d*1.8; if(state.lives<=0) state.over=true; }
    }
  }
  state.nodes = state.nodes.filter(n=>!n.dead);
  if(state.t>120) state.over=true;
}

function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#8ea3ff';
  ctx.beginPath(); ctx.arc(state.anchor.x,state.anchor.y,8,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(180,200,255,.4)'; ctx.beginPath(); ctx.moveTo(state.anchor.x,state.anchor.y); ctx.lineTo(state.player.x,state.player.y); ctx.stroke();

  for(const n of state.nodes){
    ctx.fillStyle = n.p>0 ? '#ff5f7d' : '#68d9ff';
    ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fill();
  }

  const p=state.player;
  ctx.fillStyle = p.polarity>0 ? '#ffd36d' : '#92ffa2';
  ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();

  hud.textContent = `Score ${state.score} | Lives ${state.lives} | Polarity ${p.polarity>0?'+':'-'} | Pulse CD ${p.pulseCd.toFixed(1)}s`;
  if(state.over){ ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(0,0,W,H); ctx.fillStyle='#fff';ctx.font='bold 36px system-ui';ctx.fillText('Run Over',390,250); ctx.font='18px system-ui'; ctx.fillText('Press R to restart',405,285); }
}

let last=performance.now();
function loop(now){ const dt=Math.min(0.033,(now-last)/1000); last=now; update(dt); draw(); requestAnimationFrame(loop);} requestAnimationFrame(loop);
