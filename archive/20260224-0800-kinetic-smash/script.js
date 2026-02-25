const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const W = canvas.width, H = canvas.height;

let aim = {x:1,y:0};
let charging = false;
let charge = 0;
let score = 0;
let lives = 3;
let shards = [];
let walls = [];
let core;
let gameOver = false;

function reset(){
  core = {x:W*0.2,y:H*0.5,vx:0,vy:0,r:14};
  shards = Array.from({length:14}, (_,i)=>({x:W*0.55 + (i%7)*48,y:130 + Math.floor(i/7)*64,r:16,hp:2}));
  walls = [
    {x:420,y:250,w:20,h:190},
    {x:620,y:100,w:20,h:190},
  ];
  score=0;lives=3;gameOver=false;charge=0;charging=false;
}

const keys = {};
window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key===' ')charging=true;if(e.key.toLowerCase()==='r')reset();});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.key===' '&&charging)launch();if(e.key===' ')charging=false;});

canvas.addEventListener('pointerdown',e=>{charging=true;setAim(e);});
canvas.addEventListener('pointermove',e=>{if(charging) setAim(e);});
canvas.addEventListener('pointerup',()=>{if(charging)launch();charging=false;});

for (const b of document.querySelectorAll('#touchControls button')){
  b.addEventListener('touchstart',e=>{e.preventDefault();const d=b.dataset.dir;if(d)tapDir(d,true);if(b.dataset.charge)charging=true;});
  b.addEventListener('touchend',e=>{e.preventDefault();const d=b.dataset.dir;if(d)tapDir(d,false);if(b.dataset.charge&&charging){launch();charging=false;}});
}
function tapDir(d,on){if(d==='up')keys['arrowup']=on;if(d==='down')keys['arrowdown']=on;if(d==='left')keys['arrowleft']=on;if(d==='right')keys['arrowright']=on;}
function setAim(e){const r=canvas.getBoundingClientRect();const x=(e.clientX-r.left)*(W/r.width);const y=(e.clientY-r.top)*(H/r.height);const dx=x-core.x,dy=y-core.y;const m=Math.hypot(dx,dy)||1;aim={x:dx/m,y:dy/m};}

function launch(){
  const p = Math.min(18, 5 + charge*0.22);
  core.vx += aim.x*p;
  core.vy += aim.y*p;
  charge = 0;
}

function update(){
  if(gameOver)return;
  if(keys['arrowup']||keys['w']) aim.y-=0.08;
  if(keys['arrowdown']||keys['s']) aim.y+=0.08;
  if(keys['arrowleft']||keys['a']) aim.x-=0.08;
  if(keys['arrowright']||keys['d']) aim.x+=0.08;
  const am=Math.hypot(aim.x,aim.y)||1;aim.x/=am;aim.y/=am;

  if(charging) charge = Math.min(60, charge+1.2);

  core.x += core.vx; core.y += core.vy;
  core.vx *= 0.992; core.vy *= 0.992;

  if(core.x<core.r||core.x>W-core.r){core.vx*=-0.92;core.x=Math.max(core.r,Math.min(W-core.r,core.x));}
  if(core.y<core.r||core.y>H-core.r){core.vy*=-0.92;core.y=Math.max(core.r,Math.min(H-core.r,core.y));}

  for(const w of walls){
    if(core.x+core.r>w.x&&core.x-core.r<w.x+w.w&&core.y+core.r>w.y&&core.y-core.r<w.y+w.h){
      core.vx*=-0.88; core.vy*=-0.88; lives--; if(lives<=0) gameOver=true;
    }
  }

  for(const s of shards){
    if(s.hp>0){
      const dx=core.x-s.x,dy=core.y-s.y,dist=Math.hypot(dx,dy);
      if(dist < core.r+s.r){
        s.hp--; core.vx += dx*0.03; core.vy += dy*0.03; score += s.hp===0?150:40;
      }
    }
  }

  if(shards.every(s=>s.hp===0)) gameOver = true;
}

function draw(){
  ctx.clearRect(0,0,W,H);
  walls.forEach(w=>{ctx.fillStyle='#20366e';ctx.fillRect(w.x,w.y,w.w,w.h);});
  shards.forEach(s=>{if(s.hp<=0)return;ctx.fillStyle=s.hp===2?'#ff74c3':'#ffd166';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();});

  ctx.strokeStyle='#7cd8ff';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(core.x,core.y);ctx.lineTo(core.x+aim.x*(30+charge*2),core.y+aim.y*(30+charge*2));ctx.stroke();

  ctx.fillStyle='#7bf5ff';ctx.beginPath();ctx.arc(core.x,core.y,core.r,0,Math.PI*2);ctx.fill();

  hud.textContent = `Score ${score} | Lives ${lives} | Charge ${charge.toFixed(0)} | ${gameOver ? (shards.every(s=>s.hp===0)?'CLEAR! Press R':'GAME OVER - Press R') : 'Smash all shards'}`;
}

function loop(){update();draw();requestAnimationFrame(loop);} reset();loop();
