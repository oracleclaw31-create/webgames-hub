const c=document.getElementById('game'),x=c.getContext('2d');
const keys={left:0,right:0,jump:0,grapple:0};
addEventListener('keydown',e=>{if(e.key==='ArrowLeft')keys.left=1;if(e.key==='ArrowRight')keys.right=1;if(e.key==='z')keys.jump=1;if(e.key==='x')keys.grapple=1;if(e.key==='r')reset();});
addEventListener('keyup',e=>{if(e.key==='ArrowLeft')keys.left=0;if(e.key==='ArrowRight')keys.right=0;if(e.key==='z')keys.jump=0;if(e.key==='x')keys.grapple=0;});
document.querySelectorAll('#touch button').forEach(b=>{const k=b.dataset.k;b.onpointerdown=()=>keys[k]=1;b.onpointerup=()=>keys[k]=0;b.onpointercancel=()=>keys[k]=0;});
const plats=[{x:0,y:500,w:960,h:40},{x:120,y:430,w:180,h:20},{x:420,y:380,w:180,h:20},{x:700,y:320,w:160,h:20},{x:560,y:250,w:120,h:18}];
const hooks=[{x:210,y:290},{x:500,y:230},{x:800,y:180}];
let p,goal,t=0,msg='';
function reset(){p={x:40,y:460,vx:0,vy:0,on:0};goal={x:890,y:280,w:28,h:28};msg='Reach the relic';t=0}
function hit(a,b){return a.x<a.w+b.x&&a.x+a.w>b.x&&a.y<a.h+b.y&&a.y+a.h>b.y}
reset();
(function loop(){requestAnimationFrame(loop);t++;
  p.vx+=(keys.right-keys.left)*0.55; p.vx*=0.86; p.vy+=0.52;
  if(keys.jump&&p.on){p.vy=-11;p.on=0}
  if(keys.grapple){let h=hooks.reduce((m,q)=>((q.x-p.x)**2+(q.y-p.y)**2)<m.d?{q,d:((q.x-p.x)**2+(q.y-p.y)**2)}:m,{q:null,d:1e9}).q; if(h){p.vx+=(h.x-p.x)*0.0027; p.vy+=(h.y-p.y)*0.0027;}}
  p.x+=p.vx;p.y+=p.vy;p.on=0;
  const box={x:p.x,y:p.y,w:26,h:34};
  for(const g of plats){if(hit(box,{...g,h:g.h,w:g.w})&&p.vy>=0&&box.y+box.h-p.vy<=g.y+4){p.y=g.y-34;p.vy=0;p.on=1;}}
  if(p.y>560){msg='Fell! Press R';}
  if(hit(box,{x:goal.x,y:goal.y,w:goal.w,h:goal.h})){msg='Cleared in '+(t/60).toFixed(1)+'s';}
  x.clearRect(0,0,960,540);x.fillStyle='#0d1738';x.fillRect(0,0,960,540);
  x.fillStyle='#2b3d84';plats.forEach(g=>x.fillRect(g.x,g.y,g.w,g.h));
  x.fillStyle='#8fd3ff';hooks.forEach(h=>{x.beginPath();x.arc(h.x,h.y,7,0,7);x.fill();});
  x.fillStyle='#ffd75b';x.fillRect(goal.x,goal.y,goal.w,goal.h);
  x.fillStyle='#8bff9b';x.fillRect(p.x,p.y,26,34);
  x.fillStyle='#fff';x.font='18px system-ui';x.fillText('Core loop: run-jump-grapple-route-relic-extract',20,28);x.fillText(msg,20,52);
})();
