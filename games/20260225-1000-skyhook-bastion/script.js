const c=document.getElementById('game'),x=c.getContext('2d');
const keys={left:0,right:0,jump:0,hook:0,drop:0};
addEventListener('keydown',e=>{if(e.key==='ArrowLeft')keys.left=1;if(e.key==='ArrowRight')keys.right=1;if(e.key==='z'||e.key==='Z')keys.jump=1;if(e.key==='x'||e.key==='X')keys.hook=1;if(e.key==='ArrowDown')keys.drop=1;if(e.key==='r'||e.key==='R')reset();});
addEventListener('keyup',e=>{if(e.key==='ArrowLeft')keys.left=0;if(e.key==='ArrowRight')keys.right=0;if(e.key==='z'||e.key==='Z')keys.jump=0;if(e.key==='x'||e.key==='X')keys.hook=0;if(e.key==='ArrowDown')keys.drop=0;});
document.querySelectorAll('#touch button[data-k]').forEach(b=>{const k=b.dataset.k;b.onpointerdown=()=>keys[k]=1;b.onpointerup=()=>keys[k]=0;b.onpointercancel=()=>keys[k]=0;});
document.getElementById('restart').onclick=()=>reset();
const plats=[{x:0,y:500,w:960,h:40,drop:0},{x:80,y:430,w:180,h:18,drop:0},{x:330,y:390,w:170,h:18,drop:1},{x:560,y:340,w:170,h:18,drop:0},{x:760,y:280,w:150,h:18,drop:1},{x:620,y:220,w:120,h:16,drop:0}];
const gates=[{x:920,y:245,w:18,h:55,on:0},{x:500,y:355,w:18,h:35,on:0}],switches=[{x:150,y:412,w:22,h:8,id:0},{x:790,y:262,w:22,h:8,id:1}],hooks=[{x:210,y:280},{x:420,y:240},{x:690,y:180},{x:860,y:140}];
let p,t,msg,goal;
function reset(){p={x:30,y:460,w:24,h:34,vx:0,vy:0,on:0,coyote:0};t=0;msg='Trigger both switches, then reach the exit';goal={x:935,y:225,w:20,h:20};gates.forEach(g=>g.on=0)}
function hit(a,b){return a.x<a.w+b.x&&a.x+a.w>b.x&&a.y<a.h+b.y&&a.y+a.h>b.y}
reset();
(function loop(){requestAnimationFrame(loop);t++;p.vx+=(keys.right-keys.left)*0.7;p.vx*=0.84;p.vy+=0.55;if(p.on)p.coyote=6;else p.coyote=Math.max(0,p.coyote-1);if(keys.jump&&p.coyote>0){p.vy=-10.8;p.coyote=0;}if(keys.hook){let h=hooks.reduce((m,q)=>((q.x-p.x)**2+(q.y-p.y)**2<m.d?{q,d:(q.x-p.x)**2+(q.y-p.y)**2}:m),{q:null,d:1e9}).q;if(h){p.vx+=(h.x-p.x)*0.0036;p.vy+=(h.y-p.y)*0.0032;}}p.x+=p.vx;p.y+=p.vy;p.on=0;const b={x:p.x,y:p.y,w:p.w,h:p.h};for(const g of plats){if(hit(b,{x:g.x,y:g.y,w:g.w,h:g.h})&&p.vy>=0&&b.y+b.h-p.vy<=g.y+4){if(!(g.drop&&keys.drop)){p.y=g.y-p.h;p.vy=0;p.on=1;}}}for(const s of switches){if(p.x+p.w>s.x&&p.x<s.x+s.w&&p.y+p.h>=s.y&&p.y+p.h<=s.y+20){gates[s.id].on=1;}}if(gates.every(g=>g.on)&&hit(b,{x:goal.x,y:goal.y,w:goal.w,h:goal.h})){msg='Clear '+(t/60).toFixed(1)+'s';}
if(p.y>560){msg='Fall detected — press R';}
x.clearRect(0,0,960,540);x.fillStyle='#8dc3ff';for(const h of hooks){x.beginPath();x.arc(h.x,h.y,5,0,7);x.fill();}for(const g of plats){x.fillStyle=g.drop?'#5166c8':'#334283';x.fillRect(g.x,g.y,g.w,g.h)}for(const s of switches){x.fillStyle=gates[s.id].on?'#67f5b0':'#f0cc55';x.fillRect(s.x,s.y,s.w,s.h)}for(const g of gates){x.fillStyle=g.on?'#50d48f':'#d94f66';x.fillRect(g.x,g.y,g.w,g.h)}x.fillStyle='#ffd86d';x.fillRect(goal.x,goal.y,goal.w,goal.h);x.fillStyle='#8ff7ff';x.fillRect(p.x,p.y,p.w,p.h);x.fillStyle='#eaf0ff';x.font='16px sans-serif';x.fillText(msg,16,24);x.fillText('Switches: '+gates.filter(g=>g.on).length+'/2',16,46);
})();
