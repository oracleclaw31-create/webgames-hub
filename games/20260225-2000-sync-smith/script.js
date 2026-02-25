const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=canvas.width,H=canvas.height,cx=W/2,cy=H/2;
let ring=0,score=0,combo=0,hp=5,beat=0,last=0,phase=0,done=0;
const bpm=124,beatSec=60/bpm,songBeats=48;
const windows=[0,Math.PI*0.5,Math.PI,Math.PI*1.5];
const keys={};
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=1;if(e.key===' ')hit();if(e.key.toLowerCase()==='r')reset();});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);
function btn(id,fn){document.getElementById(id).addEventListener('touchstart',e=>{e.preventDefault();fn();},{passive:false});document.getElementById(id).addEventListener('click',fn)}
btn('leftBtn',()=>ring-=0.18); btn('rightBtn',()=>ring+=0.18); btn('hitBtn',hit);
function reset(){ring=0;score=0;combo=0;hp=5;beat=0;last=0;phase=0;done=0;}
function target(){return windows[beat%windows.length] + Math.sin(beat*0.35)*0.25;}
function hit(){
  if(done) return;
  const err=Math.abs(norm((ring-target())));
  const good=err<0.24;
  if(good){combo++; score+=100+combo*20; phase=Math.min(1,phase+0.08);} else {combo=0;hp--;phase=Math.max(0,phase-0.12);} 
  if(hp<=0) done=-1;
}
function norm(a){a=(a+Math.PI)%(Math.PI*2); if(a<0)a+=Math.PI*2; return a-Math.PI;}
function draw(t){
  const dt=(t-last)/1000||0; last=t;
  if(keys['a']||keys['arrowleft']) ring-=2.2*dt;
  if(keys['d']||keys['arrowright']) ring+=2.2*dt;
  if(!done){
    const prev=Math.floor(beat); beat=t/1000/beatSec;
    if(Math.floor(beat)>prev && combo===0) hp=Math.max(0,hp-0.05);
    if(beat>=songBeats && phase>=0.8) done=1;
    if(hp<=0) done=-1;
  }
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#11182e';ctx.fillRect(0,0,W,H);
  const pulse=1+Math.sin(t/1000*Math.PI*2/beatSec)*0.04;
  ctx.save();ctx.translate(cx,cy);ctx.scale(pulse,pulse);
  ctx.strokeStyle='#2d3e7a';ctx.lineWidth=24;ctx.beginPath();ctx.arc(0,0,170,0,Math.PI*2);ctx.stroke();
  windows.forEach((w,i)=>{ctx.strokeStyle=i===(Math.floor(beat)%4)?'#4cf0ff':'#7f8bd9';ctx.lineWidth=16;ctx.beginPath();ctx.arc(0,0,170,w-0.12,w+0.12);ctx.stroke();});
  const a=target();ctx.rotate(a);ctx.strokeStyle='#ffd166';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,-120);ctx.lineTo(0,-220);ctx.stroke();ctx.rotate(-a);
  ctx.rotate(ring);ctx.strokeStyle='#ff5ac4';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(0,-110);ctx.lineTo(0,-235);ctx.stroke();ctx.restore();
  ctx.fillStyle='#dbe7ff';ctx.font='24px system-ui';ctx.fillText(`Score ${score}`,24,38);ctx.fillText(`Combo ${combo}`,24,70);ctx.fillText(`Forge ${(phase*100|0)}%`,24,102);ctx.fillText(`HP ${hp.toFixed(1)}`,24,134);
  if(done){ctx.fillStyle='rgba(8,10,20,.75)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.font='48px system-ui';ctx.fillText(done>0?'SONG COMPLETED':'FORGE BROKEN',W/2-190,H/2);ctx.font='22px system-ui';ctx.fillText('Press R to retry',W/2-70,H/2+42);} 
  requestAnimationFrame(draw);
}
reset();requestAnimationFrame(draw);
