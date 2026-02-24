const c = document.getElementById('game');
const x = c.getContext('2d');
const ui = {hp:hp, relays:relays, time:time, score:score, status};
const keys = new Set();
const touch = {left:false,right:false,up:false,down:false,fire:false};
let mouse = {x:c.width/2,y:c.height/2};
const p = {x:120,y:270,r:12,hp:100,cd:0};
let t = 90, scoreVal=0, won=false;
const rel = [{x:760,y:100,on:false},{x:830,y:280,on:false},{x:700,y:440,on:false}];
const enemies = Array.from({length:8},(_,i)=>({x:540+Math.random()*360,y:60+Math.random()*420,r:11,hp:26,spd:42+i*2}));
const bullets=[];
function aim(){const dx=mouse.x-p.x,dy=mouse.y-p.y,d=Math.hypot(dx,dy)||1;return {x:dx/d,y:dy/d};}
function burst(){if(p.cd>0)return; p.cd=.26; const a=aim(); for(let i=-1;i<=1;i++){const s=i*0.18,cs=Math.cos(s),sn=Math.sin(s); bullets.push({x:p.x,y:p.y,vx:(a.x*cs-a.y*sn)*420,vy:(a.x*sn+a.y*cs)*420,life:1});}}
function step(dt){if(won)return; t-=dt; if(t<=0||p.hp<=0){won=true; ui.status.textContent='Mission failed. Press R to retry.';}
const mx=(keys.has('a')||keys.has('arrowleft')||touch.left?-1:0)+(keys.has('d')||keys.has('arrowright')||touch.right?1:0);
const my=(keys.has('w')||keys.has('arrowup')||touch.up?-1:0)+(keys.has('s')||keys.has('arrowdown')||touch.down?1:0);
const m=Math.hypot(mx,my)||1; p.x=Math.max(18,Math.min(c.width-18,p.x+mx/m*220*dt)); p.y=Math.max(18,Math.min(c.height-18,p.y+my/m*220*dt));
if((keys.has(' ')||touch.fire)&&!won) burst(); if(p.cd>0)p.cd-=dt;
for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;} for(let i=bullets.length-1;i>=0;i--) if(bullets[i].life<=0||bullets[i].x<0||bullets[i].x>c.width||bullets[i].y<0||bullets[i].y>c.height) bullets.splice(i,1);
for(const e of enemies){if(e.hp<=0)continue; let tx=p.x,ty=p.y; const nearest=rel.filter(r=>!r.on).sort((a,b)=>Math.hypot(e.x-a.x,e.y-a.y)-Math.hypot(e.x-b.x,e.y-b.y))[0]; if(nearest){tx=nearest.x;ty=nearest.y;} const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy)||1; e.x+=dx/d*e.spd*dt; e.y+=dy/d*e.spd*dt;
  if(Math.hypot(e.x-p.x,e.y-p.y)<22) p.hp-=18*dt;
  for(const r of rel) if(!r.on && Math.hypot(e.x-r.x,e.y-r.y)<20){t-=10*dt;}
}
for(const b of bullets){for(const e of enemies){if(e.hp>0 && Math.hypot(b.x-e.x,b.y-e.y)<16){e.hp-=16; b.life=0; if(e.hp<=0) scoreVal+=25;}}}
for(const r of rel){if(!r.on && Math.hypot(p.x-r.x,p.y-r.y)<26){r.on=true; scoreVal+=100;}}
if(rel.every(r=>r.on)){won=true; ui.status.textContent='Extraction successful! Press R to play again.'; scoreVal += Math.max(0,Math.floor(t))*5;}
ui.hp.textContent=Math.max(0,Math.floor(p.hp)); ui.relays.textContent=`${rel.filter(r=>r.on).length}/3`; ui.time.textContent=Math.max(0,Math.floor(t)); ui.score.textContent=scoreVal;
}
function draw(){x.fillStyle='#050914';x.fillRect(0,0,c.width,c.height); x.strokeStyle='#12224f'; for(let i=0;i<18;i++){x.beginPath();x.moveTo(i*60,0);x.lineTo(i*60,c.height);x.stroke();}
for(const r of rel){x.fillStyle=r.on?'#43f0ad':'#2a4a9f';x.beginPath();x.arc(r.x,r.y,14,0,7);x.fill();}
for(const e of enemies){if(e.hp<=0)continue; x.fillStyle='#ff5b7f';x.beginPath();x.arc(e.x,e.y,e.r,0,7);x.fill();}
for(const b of bullets){x.fillStyle='#f9f08b';x.beginPath();x.arc(b.x,b.y,4,0,7);x.fill();}
const a=aim(); x.save(); x.translate(p.x,p.y); x.rotate(Math.atan2(a.y,a.x)); x.fillStyle='#8ac7ff'; x.fillRect(-10,-9,22,18); x.fillStyle='#dff4ff'; x.fillRect(7,-3,10,6); x.restore();}
let last=performance.now(); function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;step(dt);draw();requestAnimationFrame(loop);} requestAnimationFrame(loop);
addEventListener('keydown',e=>{keys.add(e.key.toLowerCase()); if(e.key.toLowerCase()==='r') location.reload();});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
c.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect(); mouse={x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height};});
c.addEventListener('pointerdown',e=>{const r=c.getBoundingClientRect(); mouse={x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height}; burst();});
document.querySelectorAll('.touch button').forEach(b=>{const k=b.dataset.k; b.onpointerdown=()=>touch[k]=true; b.onpointerup=()=>touch[k]=false; b.onpointerleave=()=>touch[k]=false;});
