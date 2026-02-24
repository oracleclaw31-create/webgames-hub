const c=document.getElementById('game'),x=c.getContext('2d');
const ui={hp:hp,rifts:rifts,link:link,time:time,state:state};
let k={},t=0,last=0,spawn=0,over=0,win=0;
const p={x:480,y:270,r:12,hp:100,s:220,cool:0},d={x:560,y:270,r:8,link:100};
let shots=[],enemies=[],riftsData=[{x:130,y:90,sealed:0},{x:840,y:130,sealed:0},{x:510,y:430,sealed:0}];
addEventListener('keydown',e=>k[e.key.toLowerCase()]=1);addEventListener('keyup',e=>k[e.key.toLowerCase()]=0);
function fire(){if(p.cool>0||over||win)return;p.cool=.17;const a=Math.atan2(d.y-p.y,d.x-p.x);shots.push({x:p.x,y:p.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,r:4});}
function linkBoost(){if(d.link<10)return;d.link-=10;const a=Math.atan2(d.y-p.y,d.x-p.x);d.x+=Math.cos(a)*40;d.y+=Math.sin(a)*40;}
function touch(){const m=touchMove,f=touchFire,l=touchLink;let start=null;
m.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};m.setPointerCapture(e.pointerId);});
m.addEventListener('pointermove',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;k.a=dx<-10;k.d=dx>10;k.w=dy<-10;k.s=dy>10;});
['pointerup','pointercancel'].forEach(ev=>m.addEventListener(ev,()=>{start=null;k.w=k.a=k.s=k.d=0;}));
['pointerdown'].forEach(ev=>f.addEventListener(ev,fire));['pointerdown'].forEach(ev=>l.addEventListener(ev,linkBoost));}
touch();
function step(ts){if(!last)last=ts;const dt=Math.min(.033,(ts-last)/1000);last=ts;t+=dt;if(!over&&!win)update(dt);draw();requestAnimationFrame(step);}requestAnimationFrame(step);
function update(dt){let ax=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0),ay=(k.s||k.arrowdown?1:0)-(k.w||k.arrowup?1:0);const l=Math.hypot(ax,ay)||1;p.x+=ax/l*p.s*dt;p.y+=ay/l*p.s*dt;p.x=Math.max(12,Math.min(948,p.x));p.y=Math.max(12,Math.min(528,p.y));
const da=Math.atan2(p.y-d.y,p.x-d.x);d.x+=Math.cos(da)*150*dt;d.y+=Math.sin(da)*150*dt;d.link=Math.max(0,Math.min(100,d.link+6*dt-(Math.hypot(d.x-p.x,d.y-p.y)>170?10*dt:0)));
if(k[' ']||k.enter)fire(); if(k.e)linkBoost(); if(k.r&&(over||win))location.reload();
p.cool=Math.max(0,p.cool-dt); spawn-=dt; if(spawn<=0){spawn=1.1-Math.min(.6,t/60);const a=Math.random()*6.28,r=350+Math.random()*120;enemies.push({x:480+Math.cos(a)*r,y:270+Math.sin(a)*r,r:10,hp:2,s:70+Math.random()*40});}
shots=shots.filter(s=>{s.x+=s.vx*dt;s.y+=s.vy*dt;return s.x>-20&&s.x<980&&s.y>-20&&s.y<560;});
enemies=enemies.filter(e=>{const a=Math.atan2(d.y-e.y,d.x-e.x);e.x+=Math.cos(a)*e.s*dt;e.y+=Math.sin(a)*e.s*dt;for(const s of shots){if((e.x-s.x)**2+(e.y-s.y)**2<180){e.hp--;s.x=-999;}}if((e.x-d.x)**2+(e.y-d.y)**2<260){d.link-=25*dt;p.hp-=8*dt;}return e.hp>0;});
for(const r of riftsData){if(!r.sealed && Math.hypot(d.x-r.x,d.y-r.y)<26 && enemies.length<8){r.sealed=1;d.link=Math.min(100,d.link+20);} }
if(p.hp<=0||d.link<=0)over=1; if(riftsData.every(r=>r.sealed)&&t>20)win=1;
ui.hp.textContent=Math.max(0,p.hp|0); ui.rifts.textContent=`${riftsData.filter(r=>r.sealed).length}/3`; ui.link.textContent=Math.max(0,d.link|0); ui.time.textContent=t.toFixed(1); ui.state.textContent=win?'EXTRACTED':over?'FAILED':'IN MISSION';}
function draw(){x.fillStyle='#030910';x.fillRect(0,0,960,540);for(let i=0;i<60;i++){x.fillStyle='#0b2233';x.fillRect((i*157)%960,(i*97)%540,2,2);}for(const r of riftsData){x.beginPath();x.arc(r.x,r.y,18,0,7);x.strokeStyle=r.sealed?'#53ffa8':'#aa44ff';x.lineWidth=3;x.stroke();}
for(const s of shots){x.beginPath();x.arc(s.x,s.y,4,0,7);x.fillStyle='#ffd166';x.fill();}
for(const e of enemies){x.beginPath();x.arc(e.x,e.y,e.r,0,7);x.fillStyle='#ff6b6b';x.fill();}
x.beginPath();x.arc(d.x,d.y,d.r,0,7);x.fillStyle='#3dd2ff';x.fill();x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fillStyle='#e5f0ff';x.fill();}
