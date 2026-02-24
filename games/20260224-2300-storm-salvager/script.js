const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const keys = {};
const p = { x: W/2, y: H/2, r: 14, hp: 100, emp: 0, score: 0 };
const beacons = [{x:180,y:120,a:0},{x:780,y:130,a:0},{x:500,y:430,a:0}];
const enemies = [];
let t = 0, over = false;

function spawn() {
  const side = Math.floor(Math.random()*4);
  let x=0,y=0;
  if(side===0){x=Math.random()*W;y=-20;} if(side===1){x=W+20;y=Math.random()*H;}
  if(side===2){x=Math.random()*W;y=H+20;} if(side===3){x=-20;y=Math.random()*H;}
  enemies.push({x,y,r:10,s:1.3+Math.random()*1.2,hp:2});
}

function input(dt){
  const sp=220*dt; let dx=0,dy=0;
  if(keys.ArrowUp||keys.KeyW)dy-=1; if(keys.ArrowDown||keys.KeyS)dy+=1;
  if(keys.ArrowLeft||keys.KeyA)dx-=1; if(keys.ArrowRight||keys.KeyD)dx+=1;
  const n=Math.hypot(dx,dy)||1; p.x+=dx/n*sp; p.y+=dy/n*sp;
  p.x=Math.max(15,Math.min(W-15,p.x)); p.y=Math.max(15,Math.min(H-15,p.y));
}

function attackSweep(){
  for(const e of enemies){ if(Math.hypot(e.x-p.x,e.y-p.y)<85) e.hp-=2; }
}
function emp(){ if(p.emp<=0){ p.emp=8; for(const e of enemies){ if(Math.hypot(e.x-p.x,e.y-p.y)<170) e.hp=0; } } }

window.addEventListener('keydown',e=>{ keys[e.code]=true; if(e.code==='Space') attackSweep(); if(e.code==='ShiftLeft') emp(); if(e.code==='KeyE') activate(); });
window.addEventListener('keyup',e=>keys[e.code]=false);

function activate(){
  for(const b of beacons){ if(!b.a && Math.hypot(b.x-p.x,b.y-p.y)<42){ b.a=1; p.score+=100; } }
}

for(const btn of document.querySelectorAll('button[data-key]')){
  const k=btn.dataset.key;
  const down=(e)=>{e.preventDefault(); btn.classList.add('active'); keys[k]=true; if(k==='Space')attackSweep(); if(k==='ShiftLeft')emp(); if(k==='KeyE')activate();};
  const up=(e)=>{e.preventDefault(); btn.classList.remove('active'); keys[k]=false;};
  btn.addEventListener('touchstart',down,{passive:false}); btn.addEventListener('touchend',up,{passive:false});
  btn.addEventListener('mousedown',down); btn.addEventListener('mouseup',up); btn.addEventListener('mouseleave',up);
}

function update(dt){
  if(over) return;
  t+=dt; if(t>0.8){ spawn(); t=0; }
  input(dt); if(p.emp>0) p.emp-=dt;
  for(const e of enemies){
    const dx=p.x-e.x, dy=p.y-e.y, n=Math.hypot(dx,dy)||1; e.x+=dx/n*e.s; e.y+=dy/n*e.s;
    if(Math.hypot(dx,dy)<p.r+e.r){ p.hp-=20*dt; }
  }
  for(let i=enemies.length-1;i>=0;i--){ if(enemies[i].hp<=0){ enemies.splice(i,1); p.score+=20; } }
  if(p.hp<=0) over=true;
  if(beacons.every(b=>b.a)) over=true;
}

function draw(){
  ctx.fillStyle='#081015'; ctx.fillRect(0,0,W,H);
  for(const b of beacons){ ctx.fillStyle=b.a?'#5df2c4':'#3b5560'; ctx.beginPath(); ctx.arc(b.x,b.y,20,0,7); ctx.fill(); }
  ctx.fillStyle='#ff6b6b'; for(const e of enemies){ ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,7); ctx.fill(); }
  ctx.fillStyle='#9be7ff'; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fill();
  ctx.fillStyle='#dff5ff'; ctx.font='16px sans-serif';
  ctx.fillText(`HP ${Math.max(0,p.hp|0)}  SCORE ${p.score}  EMP ${Math.max(0,p.emp).toFixed(1)}`,16,24);
  if(over){ ctx.font='28px sans-serif'; ctx.fillText(beacons.every(b=>b.a)?'ALL BEACONS ONLINE':'MISSION FAILED',W/2-140,H/2); }
}
let last=performance.now(); function loop(now){ const dt=Math.min(0.033,(now-last)/1000); last=now; update(dt); draw(); requestAnimationFrame(loop);} requestAnimationFrame(loop);
