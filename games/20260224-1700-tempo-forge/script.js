const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = k => document.getElementById(k);
let t=0,last=performance.now(),hold=false,charge=0,score=0,combo=0,hp=5,heat=0,timeLeft=90;
const bpm=120,beat=60/bpm; // rhythm timing
const pulses=[];
function spawnPulse(){const y=80+Math.random()*380; pulses.push({x:canvas.width+20,y,r:16,v:180+Math.random()*80,alive:true});}
function releaseStrike(){
  const beatPos=(t%beat)/beat; const err=Math.min(Math.abs(beatPos),Math.abs(1-beatPos));
  let quality='MISS', power=0;
  if(err<0.08){quality='PERFECT'; power=38; combo++; score+=120+combo*8; heat=Math.max(0,heat-12);} 
  else if(err<0.16){quality='GOOD'; power=24; combo++; score+=70+combo*4; heat=Math.max(0,heat-6);} 
  else {combo=0; heat+=15; hp-=1;}
  const strikeX=220+Math.min(140,charge*2);
  for(const p of pulses){ if(p.alive && Math.abs(p.x-strikeX)<(power+p.r) && Math.abs(p.y-270)<180){ p.alive=false; score+=40; }}
  charge=0;
  flash(quality);
}
let flashText=''; let flashTimer=0;
function flash(msg){flashText=msg; flashTimer=0.45;}
function update(dt){
  t+=dt; timeLeft=Math.max(0,timeLeft-dt);
  if(Math.random()<dt*2.1)spawnPulse();
  if(hold){charge=Math.min(80,charge+70*dt); heat=Math.min(100,heat+10*dt);} else {charge=Math.max(0,charge-50*dt);}
  for(const p of pulses){if(!p.alive)continue; p.x-=p.v*dt; if(p.x<130){p.alive=false; hp--; combo=0;}}
  while(pulses.length>0 && (!pulses[0].alive || pulses[0].x<-40)) pulses.shift();
  if(heat>=100){hp=Math.max(0,hp-1); heat=55; combo=0; flash('OVERHEAT');}
  flashTimer=Math.max(0,flashTimer-dt);
}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#0e1c2b'; for(let i=0;i<8;i++){const x=((t*120+i*140)%1200)-120; ctx.fillRect(x,0,2,540);} 
  const beatX=220; ctx.fillStyle='#66f0ff'; ctx.fillRect(beatX-2,0,4,540);
  const bp=(t%beat)/beat; ctx.fillStyle='rgba(102,240,255,.2)'; ctx.fillRect(beatX-40+80*bp,0,6,540);
  ctx.fillStyle='#ffcc66'; ctx.beginPath(); ctx.arc(beatX+charge*1.7,270,18+charge*0.15,0,Math.PI*2); ctx.fill();
  for(const p of pulses){ if(!p.alive)continue; ctx.fillStyle='#ff667a'; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }
  if(flashTimer>0){ctx.fillStyle='#fff';ctx.font='bold 38px system-ui';ctx.fillText(flashText,380,70);}
}
function renderUI(){ui('hp').textContent=hp;ui('heat').textContent=Math.round(heat);ui('combo').textContent=combo;ui('score').textContent=score;ui('time').textContent=Math.ceil(timeLeft);} 
function loop(now){const dt=Math.min(0.033,(now-last)/1000);last=now; if(hp>0&&timeLeft>0){update(dt);draw();renderUI();requestAnimationFrame(loop);} else end();}
function end(){draw();ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,0,960,540);ctx.fillStyle='#fff';ctx.font='bold 42px system-ui';ctx.fillText(hp>0?'FORGE COMPLETE':'FORGE FAILED',290,250);ctx.font='24px system-ui';ctx.fillText('Press R to restart',360,300);} 
addEventListener('keydown',e=>{if(e.code==='Space')hold=true; if(e.key==='r'||e.key==='R')location.reload();});
addEventListener('keyup',e=>{if(e.code==='Space'&&hold){hold=false;releaseStrike();}});
const hb=document.getElementById('holdBtn'), rb=document.getElementById('releaseBtn');
hb.addEventListener('touchstart',e=>{e.preventDefault();hold=true;},{passive:false});
hb.addEventListener('touchend',e=>{e.preventDefault();hold=false;},{passive:false});
rb.addEventListener('touchstart',e=>{e.preventDefault(); if(hold){hold=false;} releaseStrike();},{passive:false});
hb.addEventListener('mousedown',()=>hold=true);hb.addEventListener('mouseup',()=>hold=false);rb.addEventListener('mousedown',()=>{if(hold)hold=false;releaseStrike();});
requestAnimationFrame(loop);
