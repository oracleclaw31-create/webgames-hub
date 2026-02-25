const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const keys = {up:0,down:0,left:0,right:0,shoot:0,dash:0};

const W = canvas.width, H = canvas.height;
const state = {
  p:{x:120,y:270,r:14,vx:0,vy:0,dashCd:0,hp:5},
  enemies:[], bullets:[], civs:[], rescued:0,
  t:0, score:0, over:false, win:false,
  beacon:{x:890,y:70,r:24,active:false}
};

function reset(){
  state.p={x:120,y:270,r:14,vx:0,vy:0,dashCd:0,hp:5};
  state.enemies=[]; state.bullets=[]; state.civs=[];
  state.rescued=0; state.t=0; state.score=0; state.over=false; state.win=false;
  state.beacon.active=false;
  for(let i=0;i<3;i++) state.civs.push({x:460+i*170,y:120+((i%2)*220),r:10,rescued:false});
}

function spawnEnemy(){
  const y=40+Math.random()*(H-80);
  const side=Math.random()<0.5?0:W;
  const x=side===0?20:W-20;
  state.enemies.push({x,y,r:12,hp:2,speed:1.1+Math.random()*0.7});
}

function mapKey(e,v){
  const k=e.key.toLowerCase();
  if(k==='w'||k==='arrowup') keys.up=v;
  if(k==='s'||k==='arrowdown') keys.down=v;
  if(k==='a'||k==='arrowleft') keys.left=v;
  if(k==='d'||k==='arrowright') keys.right=v;
  if(k===' ') keys.shoot=v;
  if(k==='shift') keys.dash=v;
}
addEventListener('keydown',e=>{mapKey(e,1);if(e.key.toLowerCase()==='r') reset(); if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();});
addEventListener('keyup',e=>mapKey(e,0));
document.querySelectorAll('.touch button[data-k]').forEach(b=>{
  const k=b.dataset.k;
  b.onpointerdown=()=>keys[k]=1;
  b.onpointerup=()=>keys[k]=0;
  b.onpointercancel=()=>keys[k]=0;
});

function update(){
  if(state.over) return;
  state.t++;
  const p=state.p;
  const ax=(keys.right-keys.left), ay=(keys.down-keys.up);
  const mag=Math.hypot(ax,ay)||1;
  const speed=2.4;
  p.vx=ax/mag*speed; p.vy=ay/mag*speed;
  if(keys.dash && p.dashCd<=0){ p.vx*=3.4; p.vy*=3.4; p.dashCd=70; }
  if(p.dashCd>0) p.dashCd--;
  p.x=Math.max(20,Math.min(W-20,p.x+p.vx));
  p.y=Math.max(20,Math.min(H-20,p.y+p.vy));

  if(keys.shoot && state.t%8===0){
    const target=state.enemies[0] || {x:W-40,y:H/2};
    const dx=target.x-p.x, dy=target.y-p.y, d=Math.hypot(dx,dy)||1;
    state.bullets.push({x:p.x,y:p.y,vx:dx/d*6,vy:dy/d*6,r:4,life:80});
  }

  if(state.t%45===0 && state.enemies.length<12) spawnEnemy();

  for(const b of state.bullets){ b.x+=b.vx; b.y+=b.vy; b.life--; }
  state.bullets=state.bullets.filter(b=>b.life>0&&b.x>0&&b.y>0&&b.x<W&&b.y<H);

  for(const e of state.enemies){
    const civ = state.civs.find(c=>!c.rescued) || state.p;
    const dx=civ.x-e.x, dy=civ.y-e.y, d=Math.hypot(dx,dy)||1;
    e.x += dx/d*e.speed; e.y += dy/d*e.speed;
    if(Math.hypot(e.x-p.x,e.y-p.y)<e.r+p.r){ state.p.hp--; e.hp=0; }
    for(const c of state.civs){ if(!c.rescued && Math.hypot(e.x-c.x,e.y-c.y)<e.r+c.r){ state.over=true; hud.textContent='A civilian was lost. Press R to retry.'; }}
  }

  for(const b of state.bullets){
    for(const e of state.enemies){
      if(e.hp>0 && Math.hypot(b.x-e.x,b.y-e.y)<e.r+b.r){ e.hp--; b.life=0; if(e.hp<=0) state.score+=10; }
    }
  }
  state.enemies=state.enemies.filter(e=>e.hp>0);

  for(const c of state.civs){
    if(!c.rescued && Math.hypot(c.x-p.x,c.y-p.y)<c.r+p.r+4){ c.rescued=true; state.rescued++; state.score+=30; }
  }
  state.beacon.active = state.rescued===3;
  if(state.beacon.active && Math.hypot(state.p.x-state.beacon.x,state.p.y-state.beacon.y)<state.beacon.r+state.p.r){
    state.win=true; state.over=true; hud.textContent='Extraction complete! Press R to play again.';
  }
  if(state.p.hp<=0){ state.over=true; hud.textContent='You were overwhelmed. Press R to retry.'; }

  if(!state.over){
    hud.textContent = `HP ${state.p.hp} · Rescued ${state.rescued}/3 · Score ${state.score}` + (state.beacon.active?' · Beacon active!':'');
  }
}

function draw(){
  ctx.fillStyle='#090d18'; ctx.fillRect(0,0,W,H);
  for(let i=0;i<40;i++){ ctx.fillStyle='rgba(92,225,230,0.08)'; ctx.fillRect((i*97+state.t)%W,(i*53)%H,2,2); }

  // beacon
  ctx.beginPath(); ctx.arc(state.beacon.x,state.beacon.y,state.beacon.r,0,Math.PI*2);
  ctx.fillStyle=state.beacon.active?'#5ce1e6':'#2a3148'; ctx.fill();

  // civilians
  for(const c of state.civs){
    ctx.beginPath(); ctx.arc(c.x,c.y,c.r,0,Math.PI*2);
    ctx.fillStyle=c.rescued?'#7cff9b':'#f7d154'; ctx.fill();
  }

  // entities
  for(const e of state.enemies){ ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fillStyle='#ff6b6b'; ctx.fill(); }
  for(const b of state.bullets){ ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fillStyle='#d8f9ff'; ctx.fill(); }
  ctx.beginPath(); ctx.arc(state.p.x,state.p.y,state.p.r,0,Math.PI*2); ctx.fillStyle='#7aa2ff'; ctx.fill();
  if(state.p.dashCd>55){ ctx.strokeStyle='#5ce1e6'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(state.p.x,state.p.y,state.p.r+5,0,Math.PI*2); ctx.stroke(); }
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
reset(); loop();
