const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const keys = new Set();
const player = {x:120,y:270,r:12,hp:100,cool:0};
const relays=[{x:760,y:150,hack:0},{x:820,y:360,hack:0}];
let drones=[]; let bullets=[]; let score=0; let t=0; let over=false;

function spawn(){
  drones.push({x:900+Math.random()*60,y:80+Math.random()*380,r:10,mark:0,speed:1.2+Math.random()*1.2});
}
for(let i=0;i<6;i++) spawn();

addEventListener('keydown',e=>keys.add(e.code));
addEventListener('keyup',e=>keys.delete(e.code));

for (const b of document.querySelectorAll('[data-k]')) {
  const code=b.dataset.k;
  const on=()=>keys.add(code), off=()=>keys.delete(code);
  b.addEventListener('touchstart',e=>{e.preventDefault();on();},{passive:false});
  b.addEventListener('touchend',off);
  b.addEventListener('mousedown',on); b.addEventListener('mouseup',off); b.addEventListener('mouseleave',off);
}

function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function update(){
  if(over) return;
  t++;
  const sp=3;
  if(keys.has('ArrowUp')||keys.has('KeyW')) player.y-=sp;
  if(keys.has('ArrowDown')||keys.has('KeyS')) player.y+=sp;
  if(keys.has('ArrowLeft')||keys.has('KeyA')) player.x-=sp;
  if(keys.has('ArrowRight')||keys.has('KeyD')) player.x+=sp;
  player.x=Math.max(20,Math.min(940,player.x));
  player.y=Math.max(20,Math.min(520,player.y));

  if(player.cool>0) player.cool--;
  if((keys.has('Space')) && player.cool===0){
    const target=drones[0]||{x:940,y:player.y};
    const ang=Math.atan2(target.y-player.y,target.x-player.x);
    bullets.push({x:player.x,y:player.y,vx:Math.cos(ang)*6,vy:Math.sin(ang)*6});
    player.cool=10;
  }

  for(const d of drones){
    d.x-=d.speed; d.mark=Math.max(0,d.mark-1);
    if(d.x<40){player.hp-=8; d.x=920; d.y=80+Math.random()*380;}
    if(dist(d,player)<22){player.hp-=0.15; d.mark=60;} // strafe mark risk
  }

  for(const b of bullets){b.x+=b.vx; b.y+=b.vy;}
  bullets=bullets.filter(b=>b.x>-10&&b.x<970&&b.y>-10&&b.y<550);

  for(const b of bullets){
    for(const d of drones){
      if(dist(b,d)<d.r+3){d.mark=80; b.x=-99;}
    }
  }

  if(keys.has('KeyE')){
    for(const r of relays){
      if(dist(player,r)<60){r.hack=Math.min(100,r.hack+0.8);} // hack
    }
    for(const d of drones){if(d.mark>0&&dist(player,d)<120){d.x=-100; score+=12;}} // detonate marked
  }

  drones=drones.filter(d=>d.x>-50);
  while(drones.length<8) spawn();
  if(relays.every(r=>r.hack>=100)){score+=500; over=true;}
  if(player.hp<=0) over=true;
}

function draw(){
  ctx.fillStyle='#020814'; ctx.fillRect(0,0,960,540);
  for(const r of relays){ctx.strokeStyle='#5ef'; ctx.lineWidth=3; ctx.strokeRect(r.x-20,r.y-20,40,40); ctx.fillStyle='#2a6'; ctx.fillRect(r.x-20,r.y+26,0.4*r.hack,6);}
  ctx.fillStyle='#9cf'; ctx.beginPath(); ctx.arc(player.x,player.y,player.r,0,7); ctx.fill();
  for(const d of drones){ctx.fillStyle=d.mark>0?'#f6f':'#f66'; ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,7); ctx.fill();}
  ctx.fillStyle='#fffa'; for(const b of bullets){ctx.fillRect(b.x-2,b.y-2,4,4)}
  hud.textContent=`HP ${player.hp.toFixed(0)} | Score ${score} | Relay ${relays.map(r=>r.hack.toFixed(0)).join('% / ')}% ${over?'| GAME OVER (R reload)':''}`;
}

addEventListener('keydown',e=>{if(e.code==='KeyR'&&over) location.reload();});
(function loop(){update();draw();requestAnimationFrame(loop);})();
