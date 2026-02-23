const c = document.getElementById('game');
const x = c.getContext('2d');
const keys = new Set();
const p = {x:480,y:270,r:14,s:240,hp:100,dash:0,cd:0};
let bullets=[], enemies=[], t=0, score=0, over=false, wave=1;
function spawn(){
  const a=Math.random()*Math.PI*2, d=420+Math.random()*120;
  enemies.push({x:480+Math.cos(a)*d,y:270+Math.sin(a)*d,r:12+Math.random()*8,s:60+Math.random()*40,hp:30+wave*4});
}
for(let i=0;i<8;i++) spawn();
addEventListener('keydown',e=>keys.add(e.key));
addEventListener('keyup',e=>keys.delete(e.key));
document.querySelectorAll('[data-k]').forEach(b=>{
  b.addEventListener('touchstart',e=>{e.preventDefault();keys.add(b.dataset.k)});
  b.addEventListener('touchend',e=>{e.preventDefault();keys.delete(b.dataset.k)});
});
function shoot(){
  const target=enemies[0]; if(!target) return;
  const dx=target.x-p.x, dy=target.y-p.y, m=Math.hypot(dx,dy)||1;
  bullets.push({x:p.x,y:p.y,vx:dx/m*460,vy:dy/m*460,r:4,d:1.2});
}
function step(dt){
  if(over){ if(keys.has('r')||keys.has('R')) location.reload(); return; }
  let vx=(keys.has('a')||keys.has('ArrowLeft')?-1:0)+(keys.has('d')||keys.has('ArrowRight')?1:0);
  let vy=(keys.has('w')||keys.has('ArrowUp')?-1:0)+(keys.has('s')||keys.has('ArrowDown')?1:0);
  const mm=Math.hypot(vx,vy)||1; vx/=mm; vy/=mm;
  const dashMul=(keys.has('Shift')&&p.dash<=0)?2.4:1; if(dashMul>2) p.dash=1.2;
  p.x=Math.max(16,Math.min(c.width-16,p.x+vx*p.s*dashMul*dt));
  p.y=Math.max(16,Math.min(c.height-16,p.y+vy*p.s*dashMul*dt));
  p.dash=Math.max(0,p.dash-dt);
  if((keys.has(' ')||keys.has('Spacebar'))&&p.cd<=0){shoot(); p.cd=0.18;}
  p.cd=Math.max(0,p.cd-dt);
  bullets=bullets.filter(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.d-=dt;return b.d>0&&b.x>0&&b.y>0&&b.x<c.width&&b.y<c.height});
  enemies.forEach(e=>{
    const dx=p.x-e.x,dy=p.y-e.y,m=Math.hypot(dx,dy)||1; e.x+=dx/m*e.s*dt; e.y+=dy/m*e.s*dt;
    if(m<e.r+p.r){p.hp-=18*dt;}
  });
  for(const b of bullets){
    for(const e of enemies){
      const d=Math.hypot(b.x-e.x,b.y-e.y);
      if(d<e.r+b.r){e.hp-=20; b.d=0; if(e.hp<=0){score+=10; e.dead=1;} break;}
    }
  }
  enemies=enemies.filter(e=>!e.dead);
  if(enemies.length===0){wave++; for(let i=0;i<8+wave*2;i++) spawn(); p.hp=Math.min(100,p.hp+12);}
  if(p.hp<=0) over=true;
}
function draw(){
  x.fillStyle='#050915'; x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<90;i++){x.fillStyle=`rgba(110,160,255,${(i%7)/18})`;x.fillRect((i*97+t*22)%c.width,(i*53)%c.height,2,2)}
  x.strokeStyle='#39c5ff'; x.lineWidth=2; x.beginPath(); x.arc(p.x,p.y,p.r,0,7); x.stroke();
  x.fillStyle='#66d9ff'; bullets.forEach(b=>{x.beginPath();x.arc(b.x,b.y,b.r,0,7);x.fill();});
  enemies.forEach(e=>{x.strokeStyle='#ff5da2';x.beginPath();x.arc(e.x,e.y,e.r,0,7);x.stroke();});
  x.fillStyle='#dbe7ff'; x.font='18px system-ui'; x.fillText(`HP ${Math.max(0,p.hp|0)}  SCORE ${score}  WAVE ${wave}`,18,28);
  if(over){x.fillStyle='rgba(5,9,21,.65)';x.fillRect(0,0,c.width,c.height);x.fillStyle='#fff';x.font='42px system-ui';x.fillText('GAME OVER',360,260);x.font='22px system-ui';x.fillText('Press R to restart',375,300);}
}
let last=performance.now();
(function loop(now){const dt=Math.min(.033,(now-last)/1000); last=now; t+=dt; step(dt); draw(); requestAnimationFrame(loop)})(last);
