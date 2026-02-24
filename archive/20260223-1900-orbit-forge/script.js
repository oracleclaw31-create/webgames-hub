const c = document.getElementById('game'); const x = c.getContext('2d'); const hud = document.getElementById('hud');
const keys = Object.create(null);
addEventListener('keydown',e=>keys[e.code]=true); addEventListener('keyup',e=>keys[e.code]=false);
document.querySelectorAll('.touch button').forEach(b=>{
  const k=b.dataset.k; const on=e=>{e.preventDefault();keys[k]=true}; const off=e=>{e.preventDefault();keys[k]=false};
  b.addEventListener('touchstart',on,{passive:false}); b.addEventListener('touchend',off,{passive:false});
  b.addEventListener('mousedown',on); b.addEventListener('mouseup',off); b.addEventListener('mouseleave',off);
});
const S={t:0,score:0,wave:1,energy:100,player:{x:120,y:270,r:12,vx:0,vy:0,cd:0,boost:0},shots:[],enemies:[],cores:[],state:'play'};
function spawnWave(){ S.enemies=[]; S.cores=[]; for(let i=0;i<3;i++)S.cores.push({x:520+i*120,y:140+(i%2)*220,r:24,hp:80,phase:Math.random()*6}); for(let i=0;i<6+S.wave*2;i++)S.enemies.push({x:620+Math.random()*280,y:60+Math.random()*420,r:10,hp:24,spd:1.1+Math.random()*0.8}); }
spawnWave();
function shoot(){ if(S.player.cd>0||S.energy<8) return; const p=S.player; let tx=p.x,ty=p.y; const near=S.cores.reduce((a,b)=>((p.x-b.x)**2+(p.y-b.y)**2< (p.x-a.x)**2+(p.y-a.y)**2?b:a),S.cores[0]); if(near){tx=near.x;ty=near.y;} const dx=tx-p.x,dy=ty-p.y,m=Math.hypot(dx,dy)||1; S.shots.push({x:p.x,y:p.y,vx:dx/m*6,vy:dy/m*6,r:4,life:90}); S.player.cd=14; S.energy-=8; }
function tick(){ const p=S.player; S.t++; if(S.state!=='play')return;
  let ax=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0); let ay=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
  let boost=keys.ShiftLeft&&S.energy>0; const sp=boost?3.6:2.4; if(boost) S.energy=Math.max(0,S.energy-0.45); else S.energy=Math.min(100,S.energy+0.22);
  p.vx=(p.vx+ax*0.7)*0.82; p.vy=(p.vy+ay*0.7)*0.82; p.x=Math.max(15,Math.min(c.width-15,p.x+p.vx*sp)); p.y=Math.max(15,Math.min(c.height-15,p.y+p.vy*sp));
  if(keys.Space) shoot(); if(p.cd>0)p.cd--;
  for(const s of S.shots){ s.x+=s.vx; s.y+=s.vy; s.life--; }
  S.shots=S.shots.filter(s=>s.life>0&&s.x>-10&&s.x<c.width+10&&s.y>-10&&s.y<c.height+10);
  for(const e of S.enemies){ const t=S.cores.reduce((a,b)=> (Math.hypot(e.x-b.x,e.y-b.y)<Math.hypot(e.x-a.x,e.y-a.y)?b:a),S.cores[0]); const dx=t.x-e.x,dy=t.y-e.y,m=Math.hypot(dx,dy)||1; e.x+=dx/m*e.spd; e.y+=dy/m*e.spd; if(m<t.r+e.r){t.hp-=0.35; e.hp=0;} }
  for(const s of S.shots){ for(const e of S.enemies){ if(e.hp>0&&Math.hypot(s.x-e.x,s.y-e.y)<s.r+e.r){e.hp-=12; s.life=0; if(e.hp<=0)S.score+=10; }}
    for(const core of S.cores){ if(core.hp>0&&Math.hypot(s.x-core.x,s.y-core.y)<s.r+core.r){ core.hp=Math.max(0,core.hp-4); s.life=0; S.score+=2; }} }
  S.enemies=S.enemies.filter(e=>e.hp>0);
  if(S.cores.every(c=>c.hp<=0)){ S.wave++; S.score+=120; spawnWave(); }
  if(S.cores.some(c=>c.hp<=0)&&S.wave>4){ S.state='win'; }
}
function draw(){
  x.fillStyle='#0d1330'; x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<80;i++){ x.fillStyle=`rgba(120,160,255,${0.08+((i*17)%9)/80})`; x.fillRect((i*87)%c.width, (i*53+S.t*0.1)%c.height,2,2); }
  for(const core of S.cores){ x.beginPath(); x.arc(core.x,core.y,core.r+8,0,7); x.strokeStyle='rgba(124,223,255,.45)'; x.stroke(); x.beginPath(); x.arc(core.x,core.y,core.r,0,7); x.fillStyle=core.hp>0?'#48d6ff':'#2a304f'; x.fill(); x.fillStyle='#00131f'; x.fillText(Math.ceil(core.hp),core.x-8,core.y+4); }
  for(const e of S.enemies){ x.beginPath(); x.arc(e.x,e.y,e.r,0,7); x.fillStyle='#ff6f7f'; x.fill(); }
  for(const s of S.shots){ x.beginPath(); x.arc(s.x,s.y,s.r,0,7); x.fillStyle='#fff6aa'; x.fill(); }
  const p=S.player; x.beginPath(); x.arc(p.x,p.y,p.r,0,7); x.fillStyle='#9ef0ff'; x.fill();
  x.fillStyle='#e8ecff'; x.fillText('Energy',20,20); x.fillStyle='#4bf8bf'; x.fillRect(70,10,S.energy*1.7,12); x.strokeStyle='#6b78a8'; x.strokeRect(70,10,170,12);
  hud.textContent = `Wave ${S.wave} · Score ${S.score} · Core loop: orbit-charge-discharge-overload` + (S.state==='win'?' · CLEAR!':'');
}
(function loop(){tick();draw();requestAnimationFrame(loop)})();
