(() => {
const c=document.getElementById('game'),x=c.getContext('2d'),hud=document.getElementById('hud');
const s={t:0,score:0,wave:1,hp:100,keys:{},touch:{},bullets:[],enemies:[],orbs:[],player:{x:480,y:270,r:12,v:220,dash:0,cd:0,face:0},state:'play'};
function spawnWave(){for(let i=0;i<5+s.wave*2;i++){const a=Math.random()*Math.PI*2,d=280+Math.random()*180;s.enemies.push({x:480+Math.cos(a)*d,y:270+Math.sin(a)*d,r:11,hp:22+s.wave*6,v:55+s.wave*7});}}
function spawnOrbs(){s.orbs=[];for(let i=0;i<3;i++)s.orbs.push({x:140+i*320,y:120+Math.random()*300,c:0});}
function reset(){Object.assign(s,{t:0,score:0,wave:1,hp:100,bullets:[],enemies:[],state:'play'});s.player={x:480,y:270,r:12,v:220,dash:0,cd:0,face:0};spawnWave();spawnOrbs();}
function fire(){if(s.player.cd>0||s.state!=='play')return;const a=s.player.face;s.bullets.push({x:s.player.x,y:s.player.y,vx:Math.cos(a)*460,vy:Math.sin(a)*460,t:1.2});s.player.cd=.14;}
function dash(){if(s.player.dash<=0&&s.state==='play'){s.player.dash=.22;}}
addEventListener('keydown',e=>{s.keys[e.key.toLowerCase()]=1;if(e.key===' ')fire();if(e.key==='Shift')dash();if(e.key.toLowerCase()==='r')reset();});
addEventListener('keyup',e=>s.keys[e.key.toLowerCase()]=0);
[['left','a',-1,0],['right','d',1,0],['up','w',0,-1],['down','s',0,1]].forEach(([id,k])=>{const b=document.getElementById(id);b.onpointerdown=()=>s.touch[k]=1;b.onpointerup=()=>s.touch[k]=0;b.onpointercancel=()=>s.touch[k]=0;});
document.getElementById('fire').onpointerdown=fire;document.getElementById('dash').onpointerdown=dash;
function tick(dt){s.t+=dt;const p=s.player;let mx=(s.keys.a||s.keys.arrowleft||s.touch.a? -1:0)+(s.keys.d||s.keys.arrowright||s.touch.d?1:0);let my=(s.keys.w||s.keys.arrowup||s.touch.w?-1:0)+(s.keys.s||s.keys.arrowdown||s.touch.s?1:0);
const m=Math.hypot(mx,my)||1;mx/=m;my/=m;if(mx||my)p.face=Math.atan2(my,mx);const sp=p.v*(p.dash>0?2.8:1);p.x=Math.max(20,Math.min(940,p.x+mx*sp*dt));p.y=Math.max(20,Math.min(520,p.y+my*sp*dt));p.dash=Math.max(0,p.dash-dt);p.cd=Math.max(0,p.cd-dt);
s.bullets=s.bullets.filter(b=>(b.t-=dt)>0&&(b.x+=b.vx*dt,b.y+=b.vy*dt,b.x>0&&b.x<960&&b.y>0&&b.y<540));
for(const e of s.enemies){const a=Math.atan2(p.y-e.y,p.x-e.x);e.x+=Math.cos(a)*e.v*dt;e.y+=Math.sin(a)*e.v*dt;if(Math.hypot(e.x-p.x,e.y-p.y)<e.r+p.r){s.hp-=18*dt*(p.dash>0?0.3:1);} }
for(const b of s.bullets){for(const e of s.enemies){if(e.hp>0&&Math.hypot(b.x-e.x,b.y-e.y)<e.r+4){e.hp-=20;b.t=0; if(e.hp<=0)s.score+=10;}}}
s.enemies=s.enemies.filter(e=>e.hp>0);
for(const o of s.orbs){if(Math.hypot(o.x-p.x,o.y-p.y)<42)o.c=Math.min(100,o.c+35*dt);} 
if(s.enemies.length===0){if(s.orbs.every(o=>o.c>=100)){s.wave++;s.score+=50;spawnWave();spawnOrbs();}else{spawnWave();}}
if(s.hp<=0)s.state='down';
}
function draw(){x.clearRect(0,0,960,540);x.fillStyle='#0b1830';x.fillRect(0,0,960,540);
for(const o of s.orbs){x.fillStyle='rgba(91,172,255,.25)';x.beginPath();x.arc(o.x,o.y,34,0,7);x.fill();x.fillStyle=o.c>=100?'#5fffb2':'#5bacff';x.fillRect(o.x-26,o.y+40,52*(o.c/100),6);} 
for(const b of s.bullets){x.fillStyle='#ffe27a';x.beginPath();x.arc(b.x,b.y,4,0,7);x.fill();}
for(const e of s.enemies){x.fillStyle='#ff6a6a';x.beginPath();x.arc(e.x,e.y,e.r,0,7);x.fill();}
const p=s.player;x.save();x.translate(p.x,p.y);x.rotate(p.face);x.fillStyle='#82d7ff';x.fillRect(-10,-10,20,20);x.fillStyle='#d6f5ff';x.fillRect(0,-3,14,6);x.restore();
if(s.state==='down'){x.fillStyle='rgba(0,0,0,.5)';x.fillRect(0,0,960,540);x.fillStyle='#fff';x.font='bold 38px system-ui';x.fillText('Signal Lost - Press R',300,270);} 
hud.textContent=`HP ${Math.max(0,s.hp|0)} | Score ${s.score} | Wave ${s.wave} | Objective: capture 3 uplinks then clear wave`;
}
let last=performance.now();function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;if(s.state==='play')tick(dt);draw();requestAnimationFrame(loop);}reset();requestAnimationFrame(loop);
})();
