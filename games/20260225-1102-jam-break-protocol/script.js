const c=document.getElementById('game'),x=c.getContext('2d');
const keys={left:0,right:0,up:0,down:0,shoot:0,dash:0};
const mapKey=(e,v)=>{const k=e.key.toLowerCase();if(k==='arrowleft'||k==='a')keys.left=v;if(k==='arrowright'||k==='d')keys.right=v;if(k==='arrowup'||k==='w')keys.up=v;if(k==='arrowdown'||k==='s')keys.down=v;if(k===' ')keys.shoot=v;if(k==='shift')keys.dash=v};
addEventListener('keydown',e=>{mapKey(e,1);if(e.key==='r'||e.key==='R')reset();});
addEventListener('keyup',e=>mapKey(e,0));
document.querySelectorAll('#touch button[data-k]').forEach(b=>{const k=b.dataset.k;b.onpointerdown=()=>keys[k]=1;b.onpointerup=()=>keys[k]=0;b.onpointercancel=()=>keys[k]=0;});
document.getElementById('restart').onclick=()=>reset();

let p,enemies,shots,sparks,t,score,wave,msg,heat;
const rng=(a,b)=>a+Math.random()*(b-a);
function reset(){
  p={x:480,y:270,r:14,vx:0,vy:0,hp:100,dash:0,cool:0};
  enemies=[];shots=[];sparks=[];t=0;score=0;wave=1;heat=0;msg='Survive and purge jammer nodes';
}
function spawnWave(){
  const n=4+wave*2;
  for(let i=0;i<n;i++)enemies.push({x:rng(40,920),y:rng(40,500),r:12+Math.random()*8,hp:20+wave*4,spd:0.7+Math.random()*0.5+wave*0.05});
}
function shoot(){
  const target=enemies[0]||{x:p.x+1,y:p.y};
  const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy)||1;
  shots.push({x:p.x,y:p.y,vx:dx/d*8,vy:dy/d*8,life:60});
  p.cool=8;heat=Math.min(100,heat+6);
}
reset();spawnWave();
(function loop(){requestAnimationFrame(loop);t++;
  const ax=(keys.right-keys.left)*0.6,ay=(keys.down-keys.up)*0.6;
  const speed=keys.dash&&p.dash<=0?1.9:1;
  if(keys.dash&&p.dash<=0)p.dash=70;
  p.vx=(p.vx+ax*speed)*0.84;p.vy=(p.vy+ay*speed)*0.84;
  p.x=Math.max(20,Math.min(940,p.x+p.vx));p.y=Math.max(20,Math.min(520,p.y+p.vy));
  p.dash=Math.max(0,p.dash-1);p.cool=Math.max(0,p.cool-1);heat=Math.max(0,heat-0.12);
  if(keys.shoot&&p.cool===0)shoot();

  for(const s of shots){s.x+=s.vx;s.y+=s.vy;s.life--;}
  shots=shots.filter(s=>s.life>0&&s.x>-10&&s.x<970&&s.y>-10&&s.y<550);

  for(const e of enemies){
    const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;
    e.x+=dx/d*e.spd;e.y+=dy/d*e.spd;
    if(d<e.r+p.r){p.hp-=0.22+wave*0.02;}
  }

  for(const s of shots){for(const e of enemies){const d=Math.hypot(s.x-e.x,s.y-e.y);if(d<e.r){e.hp-=10;s.life=0;sparks.push({x:e.x,y:e.y,life:20});score+=1;}}}
  enemies=enemies.filter(e=>e.hp>0);
  sparks.forEach(k=>k.life--);sparks=sparks.filter(k=>k.life>0);
  if(enemies.length===0){wave++;msg='Wave '+wave;spawnWave();score+=10;}
  if(p.hp<=0){msg='Signal lost — press R';}

  x.clearRect(0,0,960,540);
  x.fillStyle='#0f1a37';x.fillRect(0,0,960,540);
  for(let gx=0;gx<960;gx+=48){x.strokeStyle='rgba(90,130,240,.12)';x.beginPath();x.moveTo(gx,0);x.lineTo(gx,540);x.stroke();}
  for(let gy=0;gy<540;gy+=48){x.strokeStyle='rgba(90,130,240,.12)';x.beginPath();x.moveTo(0,gy);x.lineTo(960,gy);x.stroke();}

  for(const e of enemies){x.fillStyle='#f56a8e';x.beginPath();x.arc(e.x,e.y,e.r,0,7);x.fill();}
  for(const s of shots){x.fillStyle='#8cf4ff';x.beginPath();x.arc(s.x,s.y,4,0,7);x.fill();}
  for(const k of sparks){x.fillStyle='rgba(255,220,120,'+(k.life/20)+')';x.fillRect(k.x-3,k.y-3,6,6);}
  x.fillStyle='#79f0c2';x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill();

  x.fillStyle='#dfe8ff';x.font='16px sans-serif';
  x.fillText('HP: '+Math.max(0,p.hp|0),14,24);
  x.fillText('Wave: '+wave,14,46);
  x.fillText('Score: '+score,14,68);
  x.fillText('Heat: '+(heat|0)+'%',14,90);
  x.fillText(msg,14,114);
})();
