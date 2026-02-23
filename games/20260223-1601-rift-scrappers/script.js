const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = {
  hp: document.getElementById('hp'), time: document.getElementById('time'), scrap: document.getElementById('scrap'),
  pulse: document.getElementById('pulse'), kills: document.getElementById('kills'), wave: document.getElementById('wave')
};
const restartBtn = document.getElementById('restartBtn');

let s, keys = {}, touches = { move:null, dash:false, pulse:false };

function reset(){
  s = {
    t:0, hp:100, scrap:0, kills:0, pulse:0, over:false,
    p:{x:450,y:260,r:14,vx:0,vy:0,dashCd:0,dash:0,inv:0,speed:170},
    mobs:[], scraps:[], wave:1, spawn:0, pick:null
  };
}

function spawnMob(){
  const side = Math.floor(Math.random()*4);
  let x=0,y=0;
  if(side===0){x=Math.random()*900;y=-20}
  if(side===1){x=920;y=Math.random()*520}
  if(side===2){x=Math.random()*900;y=540}
  if(side===3){x=-20;y=Math.random()*520}
  const sp = 45 + s.wave*8 + Math.random()*20;
  s.mobs.push({x,y,r:10+Math.random()*5,hp:2+Math.floor(s.wave/2),sp});
}

function dropScrap(x,y,n=1){ for(let i=0;i<n;i++) s.scraps.push({x:x+(Math.random()-0.5)*16,y:y+(Math.random()-0.5)*16,r:5}); }

function update(dt){
  if(s.over) return;
  s.t += dt;
  s.wave = 1 + Math.floor(s.t/20);
  const p=s.p;
  p.dashCd = Math.max(0,p.dashCd-dt);
  p.dash = Math.max(0,p.dash-dt);
  p.inv = Math.max(0,p.inv-dt);

  let mx=0,my=0;
  if(keys['ArrowLeft']||keys['a'])mx-=1;
  if(keys['ArrowRight']||keys['d'])mx+=1;
  if(keys['ArrowUp']||keys['w'])my-=1;
  if(keys['ArrowDown']||keys['s'])my+=1;
  if(touches.move){mx += touches.move.x; my += touches.move.y;}
  const mlen = Math.hypot(mx,my)||1;
  const speed = p.dash>0 ? 340 : p.speed;
  p.vx = (mx/mlen)*speed; p.vy = (my/mlen)*speed;
  p.x = Math.max(16,Math.min(884,p.x+p.vx*dt));
  p.y = Math.max(16,Math.min(504,p.y+p.vy*dt));

  if((keys[' ']||keys['Shift']||touches.dash) && p.dashCd<=0){ p.dash=0.22; p.dashCd=1.2; p.inv=0.18; touches.dash=false; }
  if((keys['e']||keys['f']||touches.pulse) && s.pulse>=100){
    s.pulse=0; touches.pulse=false;
    s.mobs = s.mobs.filter(m=>{
      const d=Math.hypot(m.x-p.x,m.y-p.y);
      if(d<120){ dropScrap(m.x,m.y,2); s.kills++; return false; }
      return true;
    });
  }

  s.spawn -= dt;
  if(s.spawn<=0){ s.spawn = Math.max(0.18, 0.8 - s.wave*0.03); spawnMob(); }

  for(const m of s.mobs){
    const dx=p.x-m.x, dy=p.y-m.y, d=Math.hypot(dx,dy)||1;
    m.x += (dx/d)*m.sp*dt; m.y += (dy/d)*m.sp*dt;
    if(d < p.r + m.r){
      if(p.inv<=0){ s.hp -= 8; p.inv = 0.5; if(s.hp<=0) s.over=true; }
      if(p.dash>0){ m.hp -= 2; if(m.hp<=0){ m.dead=true; s.kills++; dropScrap(m.x,m.y,2); } }
    }
  }
  s.mobs = s.mobs.filter(m=>!m.dead);

  for(const sc of s.scraps){
    const d = Math.hypot(sc.x-p.x,sc.y-p.y);
    if(d<30){ sc.x += (p.x-sc.x)*0.2; sc.y += (p.y-sc.y)*0.2; }
    if(d<p.r+sc.r){ sc.got=true; s.scrap++; s.pulse=Math.min(100,s.pulse+6); }
  }
  s.scraps = s.scraps.filter(v=>!v.got);

  if(!s.pick && s.scrap>=30){
    s.pick = true;
    const c = prompt('Upgrade! 1) +HP20  2) +Speed20  3) Pulse+15 (type 1/2/3)') || '1';
    if(c==='1') s.hp = Math.min(140,s.hp+20);
    if(c==='2') s.p.speed += 20;
    if(c==='3') s.pulse = Math.min(100,s.pulse+15);
    s.scrap -= 30; s.pick = false;
  }

  ui.hp.textContent = Math.max(0,Math.floor(s.hp));
  ui.time.textContent = s.t.toFixed(1)+'s';
  ui.scrap.textContent = s.scrap;
  ui.pulse.textContent = Math.floor(s.pulse)+'%';
  ui.kills.textContent = s.kills;
  ui.wave.textContent = s.wave;
}

function draw(){
  ctx.clearRect(0,0,900,520);
  for(let y=0;y<520;y+=40){ for(let x=0;x<900;x+=40){ ctx.strokeStyle='rgba(90,140,255,.1)'; ctx.strokeRect(x,y,40,40); } }

  for(const sc of s.scraps){ ctx.fillStyle='#ffd66b'; ctx.beginPath(); ctx.arc(sc.x,sc.y,sc.r,0,Math.PI*2); ctx.fill(); }
  for(const m of s.mobs){ ctx.fillStyle='#ff6a7a'; ctx.beginPath(); ctx.arc(m.x,m.y,m.r,0,Math.PI*2); ctx.fill(); }

  const p=s.p;
  ctx.fillStyle = p.inv>0 ? '#88e8ff' : '#4df0ff';
  ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();

  ctx.strokeStyle='rgba(77,240,255,.25)'; ctx.lineWidth=6;
  ctx.beginPath(); ctx.arc(p.x,p.y,26+s.pulse*0.7,0,Math.PI*2*(s.pulse/100)); ctx.stroke();

  if(s.over){
    ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,0,900,520);
    ctx.fillStyle='#fff'; ctx.font='bold 42px sans-serif'; ctx.fillText('Rift Collapsed',320,240);
    ctx.font='24px sans-serif'; ctx.fillText('Press R or Restart',350,285);
  }
}

let last=performance.now();
function loop(now){
  const dt=Math.min(0.033,(now-last)/1000); last=now;
  update(dt); draw(); requestAnimationFrame(loop);
}

window.addEventListener('keydown',e=>{ keys[e.key]=true; if(e.key==='r'||e.key==='R') reset(); });
window.addEventListener('keyup',e=>{ keys[e.key]=false; });
restartBtn.onclick=()=>reset();
canvas.addEventListener('pointerdown',e=>{
  const r=canvas.getBoundingClientRect(); const x=(e.clientX-r.left)*(900/r.width), y=(e.clientY-r.top)*(520/r.height);
  if(x<300){ touches.move={id:e.pointerId,sx:x,sy:y,x:0,y:0}; }
  else if(y<260){ touches.dash=true; }
  else { touches.pulse=true; }
});
canvas.addEventListener('pointermove',e=>{
  if(!touches.move || touches.move.id!==e.pointerId) return;
  const r=canvas.getBoundingClientRect(); const x=(e.clientX-r.left)*(900/r.width), y=(e.clientY-r.top)*(520/r.height);
  touches.move.x=Math.max(-1,Math.min(1,(x-touches.move.sx)/70));
  touches.move.y=Math.max(-1,Math.min(1,(y-touches.move.sy)/70));
});
canvas.addEventListener('pointerup',e=>{ if(touches.move && touches.move.id===e.pointerId) touches.move=null; });

reset(); requestAnimationFrame(loop);
