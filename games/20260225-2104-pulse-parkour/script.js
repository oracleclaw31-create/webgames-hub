const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const W = canvas.width, H = canvas.height;
const keys = new Set();
const touchHeld = new Set();

const player = { x: 90, y: 420, w: 32, h: 38, vx: 0, vy: 0, onGround: false, dashes: 1 };
const gravity = 0.72, speed = 3.2, jumpPower = 12.6;
let cells = [{x:260,y:410,t:false},{x:520,y:330,t:false},{x:760,y:240,t:false}];
const gate = {x:890,y:126,w:24,h:54};
const plats = [
  {x:0,y:500,w:960,h:40},{x:180,y:450,w:180,h:18},{x:420,y:380,w:170,h:18},
  {x:690,y:300,w:160,h:18},{x:820,y:210,w:120,h:18}
];
let won = false;

function down(k){keys.add(k)}
function up(k){keys.delete(k)}
addEventListener('keydown',(e)=>{ if(['ArrowLeft','ArrowRight','a','d',' ','Shift','r'].includes(e.key)) e.preventDefault(); if(e.key===' ') down('Space'); else down(e.key); if(e.key.toLowerCase()==='r') reset(); });
addEventListener('keyup',(e)=>{ if(e.key===' ') up('Space'); else up(e.key); });

[['leftBtn','Left'],['rightBtn','Right'],['jumpBtn','Jump'],['dashBtn','Dash']].forEach(([id,key])=>{
  const el=document.getElementById(id);
  ['pointerdown','touchstart'].forEach(ev=>el.addEventListener(ev,(e)=>{e.preventDefault(); touchHeld.add(key);}));
  ['pointerup','pointercancel','touchend'].forEach(ev=>el.addEventListener(ev,(e)=>{e.preventDefault(); touchHeld.delete(key);}));
});

function overlap(a,b){return a.x<a.bx+b.bw && a.x+a.w>b.bx && a.y<a.by+b.bh && a.y+a.h>b.by}
function reset(){ player.x=90; player.y=420; player.vx=0; player.vy=0; player.dashes=1; won=false; cells.forEach(c=>c.t=false); }

function update(){
  const left = keys.has('ArrowLeft')||keys.has('a')||touchHeld.has('Left');
  const right = keys.has('ArrowRight')||keys.has('d')||touchHeld.has('Right');
  const jump = keys.has('Space')||touchHeld.has('Jump');
  const dash = keys.has('Shift')||touchHeld.has('Dash');

  if(left) player.vx = -speed; else if(right) player.vx = speed; else player.vx *= 0.8;
  if(jump && player.onGround){ player.vy = -jumpPower; player.onGround=false; }
  if(dash && player.dashes>0){ player.vx += (right?1:left?-1:1)*7; player.dashes=0; }

  player.vy += gravity;
  player.x += player.vx;
  player.y += player.vy;

  player.onGround = false;
  for(const p of plats){
    if(player.x < p.x + p.w && player.x + player.w > p.x && player.y < p.y + p.h && player.y + player.h > p.y){
      if(player.vy >= 0 && player.y + player.h - player.vy <= p.y + 3){
        player.y = p.y - player.h; player.vy = 0; player.onGround = true; player.dashes = 1;
      } else if(player.vx > 0){ player.x = p.x - player.w; player.vx = 0; }
      else if(player.vx < 0){ player.x = p.x + p.w; player.vx = 0; }
    }
  }
  if(player.y > H + 120) reset();

  for(const c of cells){
    if(!c.t && Math.hypot((player.x+16)-c.x,(player.y+16)-c.y) < 24) c.t = true;
  }
  const collected = cells.filter(c=>c.t).length;
  const atGate = player.x+player.w>gate.x && player.y+player.h>gate.y && player.y<gate.y+gate.h;
  won = collected===3 && atGate;
  statusEl.textContent = won ? 'Clear! Press R to replay.' : `Cells ${collected}/3 · Reach gate`;
}

function draw(){
  ctx.clearRect(0,0,W,H);
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#111b44'); g.addColorStop(1,'#0a0e1f'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#283b8f'; plats.forEach(p=>ctx.fillRect(p.x,p.y,p.w,p.h));
  ctx.fillStyle='#8df6ff'; cells.forEach(c=>{ if(!c.t){ ctx.beginPath(); ctx.arc(c.x,c.y,8,0,Math.PI*2); ctx.fill(); }});
  ctx.fillStyle = cells.every(c=>c.t)?'#66ff9a':'#4d5f96'; ctx.fillRect(gate.x,gate.y,gate.w,gate.h);
  ctx.fillStyle = won ? '#9bffbf' : '#ffd36f'; ctx.fillRect(player.x,player.y,player.w,player.h);
}
function loop(){ update(); draw(); requestAnimationFrame(loop); }
loop();
