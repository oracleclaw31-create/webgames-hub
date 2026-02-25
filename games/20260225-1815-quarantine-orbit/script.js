const c=document.getElementById('game'),x=c.getContext('2d');
const hpEl=document.getElementById('hp'),scoreEl=document.getElementById('score'),timeEl=document.getElementById('time'),pulseEl=document.getElementById('pulse');
const W=c.width,H=c.height,k={};let t0=performance.now(),last=t0,score=0,over=false,pulse=0;
const p={x:W/2,y:H/2,r:12,s:220,hp:100,vx:0,vy:0};
let enemies=[],cells=[],waves=1;
function spawnEnemy(){const a=Math.random()*Math.PI*2,d=340+Math.random()*120;enemies.push({x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d,r:10+Math.random()*10,s:70+waves*5,hp:20+waves*2});}
function spawnCell(){cells.push({x:40+Math.random()*(W-80),y:40+Math.random()*(H-80),r:6});}
for(let i=0;i<8;i++)spawnEnemy(); for(let i=0;i<6;i++)spawnCell();
addEventListener('keydown',e=>{k[e.code]=true;if(e.code==='KeyR'&&over)location.reload();});addEventListener('keyup',e=>k[e.code]=false);
document.querySelectorAll('#touch button').forEach(b=>{const code=b.dataset.k==='Space'?'Space':b.dataset.k;const dn=()=>k[code]=true,up=()=>k[code]=false;b.addEventListener('touchstart',e=>{e.preventDefault();dn();},{passive:false});b.addEventListener('touchend',up);b.addEventListener('mousedown',dn);b.addEventListener('mouseup',up);});
function step(ts){const dt=Math.min(0.033,(ts-last)/1000);last=ts;if(over)return draw(ts);
const ax=(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0), ay=(k.KeyS||k.ArrowDown?1:0)-(k.KeyW||k.ArrowUp?1:0);
const m=Math.hypot(ax,ay)||1; p.vx=ax/m*p.s; p.vy=ay/m*p.s; p.x=Math.max(14,Math.min(W-14,p.x+p.vx*dt)); p.y=Math.max(14,Math.min(H-14,p.y+p.vy*dt));
if(k.Space&&pulse>=100){pulse=0; enemies=enemies.filter(e=>Math.hypot(e.x-p.x,e.y-p.y)>110); score+=40;}
pulse=Math.min(100,pulse+16*dt);
enemies.forEach(e=>{const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;e.x+=dx/d*e.s*dt;e.y+=dy/d*e.s*dt;if(d<p.r+e.r){p.hp-=18*dt;}});
for(let i=cells.length-1;i>=0;i--){if(Math.hypot(cells[i].x-p.x,cells[i].y-p.y)<p.r+cells[i].r){cells.splice(i,1);score+=10;p.hp=Math.min(100,p.hp+6);spawnCell();}}
if(enemies.length<6+waves){spawnEnemy(); if(Math.random()<0.25)waves++;}
score+=dt*3; if(p.hp<=0)over=true; draw(ts); requestAnimationFrame(step);
}
function draw(ts){x.clearRect(0,0,W,H);x.fillStyle='#0e1324';x.fillRect(0,0,W,H);
for(const g of cells){x.fillStyle='#7fffd4';x.beginPath();x.arc(g.x,g.y,g.r,0,7);x.fill();}
for(const e of enemies){x.fillStyle='#ff647a';x.beginPath();x.arc(e.x,e.y,e.r,0,7);x.fill();}
x.fillStyle='#7ab3ff';x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill();
if(pulse>=100){x.strokeStyle='rgba(111,255,214,.8)';x.beginPath();x.arc(p.x,p.y,110,0,7);x.stroke();}
if(over){x.fillStyle='rgba(0,0,0,.5)';x.fillRect(0,0,W,H);x.fillStyle='#fff';x.font='bold 36px system-ui';x.fillText('GAME OVER',W/2-120,H/2);x.font='18px system-ui';x.fillText('Press R to restart',W/2-70,H/2+30);}
const sec=((ts-t0)/1000).toFixed(1);hpEl.textContent=Math.max(0,p.hp|0);scoreEl.textContent=Math.floor(score);timeEl.textContent=sec;pulseEl.textContent=(pulse|0)+'%';}
requestAnimationFrame(step);
