(() => {
const c = document.getElementById('game'); const x = c.getContext('2d');
const keys = {left:false,right:false,jump:false,dash:false};
const p = {x:80,y:420,w:26,h:34,vx:0,vy:0,on:false,dashCd:0,face:1};
const g=0.55, sp=3.1, jv=-10.7;
const plats=[{x:0,y:500,w:960,h:40},{x:120,y:430,w:140,h:16},{x:320,y:370,w:120,h:16},{x:500,y:320,w:140,h:16},{x:700,y:260,w:140,h:16},{x:760,y:430,w:120,h:16},{x:560,y:430,w:120,h:16}];
const relays=[{x:190,y:390,a:false},{x:560,y:280,a:false},{x:790,y:220,a:false}];
const hazards=[{x:270,y:486,w:40,h:14},{x:450,y:486,w:42,h:14},{x:660,y:486,w:42,h:14}];
const exit={x:890,y:456,w:30,h:44}; let deaths=0, t=0, won=false;
function reset(full=false){p.x=80;p.y=420;p.vx=p.vy=0;p.dashCd=0;won=false;if(full){deaths=0;t=0;relays.forEach(r=>r.a=false);}}
function hit(a,b){return a.x<a2(b)&&a.x+a.w>b.x&&a.y<a.y+a.h&&a.y+a.h>b.y; function a2(o){return o.x+o.w;}}
function step(){if(won)return; t++;
  p.vx=(keys.left?-sp:0)+(keys.right?sp:0); if(p.vx!==0)p.face=Math.sign(p.vx);
  if(keys.dash&&p.dashCd<=0){p.vx += 7*p.face; p.dashCd=80;} if(p.dashCd>0)p.dashCd--;
  if(keys.jump&&p.on){p.vy=jv; p.on=false;}
  p.vy+=g; p.x+=p.vx; p.y+=p.vy; p.on=false;
  for(const f of plats){ if(p.x+p.w>f.x&&p.x<f.x+f.w&&p.y+p.h>=f.y&&p.y+p.h<=f.y+18&&p.vy>=0){p.y=f.y-p.h;p.vy=0;p.on=true;} }
  if(p.y>560||hazards.some(h=>p.x+p.w>h.x&&p.x<h.x+h.w&&p.y+p.h>h.y)){deaths++;reset(false);}
  for(const r of relays){ if(!r.a && Math.hypot((p.x+13)-r.x,(p.y+17)-r.y)<22) r.a=true; }
  if(relays.every(r=>r.a) && p.x<exit.x+exit.w&&p.x+p.w>exit.x&&p.y<exit.y+exit.h&&p.y+p.h>exit.y) won=true;
}
function draw(){x.clearRect(0,0,960,540);x.fillStyle='#101a34';x.fillRect(0,0,960,540);
  x.fillStyle='#2a3d70'; plats.forEach(f=>x.fillRect(f.x,f.y,f.w,f.h));
  hazards.forEach(h=>{x.fillStyle='#e45757';x.fillRect(h.x,h.y,h.w,h.h);});
  relays.forEach(r=>{x.fillStyle=r.a?'#7df0a5':'#ffd166';x.beginPath();x.arc(r.x,r.y,10,0,7);x.fill();});
  x.fillStyle=relays.every(r=>r.a)?'#9be7ff':'#555'; x.fillRect(exit.x,exit.y,exit.w,exit.h);
  x.fillStyle='#ffffff';x.fillRect(p.x,p.y,p.w,p.h);
  x.fillStyle='#dce7ff';x.fillText(`Relays ${relays.filter(r=>r.a).length}/3  Deaths ${deaths}  Time ${Math.floor(t/60)}s  DashCD ${Math.ceil(Math.max(0,p.dashCd)/60*10)/10}s`,16,22);
  if(won){x.fillStyle='rgba(0,0,0,.6)';x.fillRect(220,180,520,140);x.fillStyle='#fff';x.font='28px sans-serif';x.fillText('Relay Ruins Cleared!',330,250);x.font='18px sans-serif';x.fillText('Press R to replay',390,290);} }
function loop(){step();draw();requestAnimationFrame(loop)}; loop();
addEventListener('keydown',e=>{if(e.key==='ArrowLeft')keys.left=true;if(e.key==='ArrowRight')keys.right=true;if(e.key===' ')keys.jump=true;if(e.key==='Shift')keys.dash=true;if(e.key.toLowerCase()==='r')reset(true);});
addEventListener('keyup',e=>{if(e.key==='ArrowLeft')keys.left=false;if(e.key==='ArrowRight')keys.right=false;if(e.key===' ')keys.jump=false;if(e.key==='Shift')keys.dash=false;});
function hold(id,k){const b=document.getElementById(id);['pointerdown'].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();keys[k]=true;}));['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false));}
hold('leftBtn','left');hold('rightBtn','right');hold('jumpBtn','jump');hold('dashBtn','dash');document.getElementById('restartBtn').onclick=()=>reset(true);
})();
