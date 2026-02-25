const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const hud=document.getElementById('hud');
const W=canvas.width,H=canvas.height;
let lane=1,score=0,combo=0,mult=1,phase=1,life=100,beat=0,t=0,gameOver=false;
const lanes=[W*0.25,W*0.5,W*0.75];
let notes=[];
const bpm=118,beatSec=60/bpm,hitY=H-90;
function spawn(){const l=Math.floor(Math.random()*3);const kind=Math.random()<0.2?'hold':'tap';notes.push({lane:l,y:-20,v:230,kind,ttl:kind==='hold'?1.8:0.2,hit:false});}
function reset(){lane=1;score=0;combo=0;mult=1;phase=1;life=100;beat=0;t=0;gameOver=false;notes=[];}
reset();
const keys={};
addEventListener('keydown',e=>{keys[e.key]=1;if([' ','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();if(e.key==='r'||e.key==='R')reset();});
addEventListener('keyup',e=>keys[e.key]=0);
function hit(){if(gameOver)return;let best=-1,dist=999;
for(let i=0;i<notes.length;i++){const n=notes[i];if(n.lane!==lane||n.hit)continue;const d=Math.abs(n.y-hitY);if(d<dist){dist=d;best=i;}}
if(best>=0&&dist<45){const n=notes[best];n.hit=true;combo++;mult=1+Math.floor(combo/8);score+=100*mult;life=Math.min(100,life+2);}else{combo=0;mult=1;life-=6;}}
setInterval(()=>{if(!gameOver)spawn();},beatSec*1000);
const touch=document.getElementById('touch');
touch.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return; if(b.dataset.move==='left')lane=Math.max(0,lane-1); if(b.dataset.move==='right')lane=Math.min(2,lane+1); if(b.dataset.hit)hit();});
function update(dt){if(gameOver)return; t+=dt;beat+=dt/beatSec;
if(keys['a']||keys['A']||keys['ArrowLeft'])lane=Math.max(0,lane-1),keys['ArrowLeft']=0,keys['a']=0;
if(keys['d']||keys['D']||keys['ArrowRight'])lane=Math.min(2,lane+1),keys['ArrowRight']=0,keys['d']=0;
if(keys[' ']){keys[' ']=0;hit();}
for(const n of notes){n.y+=n.v*dt*(1+phase*0.08);if(n.kind==='hold'&&n.hit){n.ttl-=dt;score+=12*mult*dt*60;life=Math.min(100,life+0.8*dt*60);}}
notes=notes.filter(n=>{if(n.kind==='hold'&&n.hit&&n.ttl<=0)return false;if(!n.hit&&n.y>hitY+50){life-=10;combo=0;mult=1;return false;}return n.y<H+40;});
phase=1+Math.floor(score/1800);
if(life<=0)gameOver=true;
}
function draw(){ctx.clearRect(0,0,W,H);
for(let i=0;i<3;i++){ctx.strokeStyle=i===lane?'#8ee3ff':'#2a427d';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(lanes[i],40);ctx.lineTo(lanes[i],H-30);ctx.stroke();}
ctx.strokeStyle='#ffd166';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(120,hitY);ctx.lineTo(W-120,hitY);ctx.stroke();
for(const n of notes){ctx.fillStyle=n.kind==='hold'?'#9bffb0':'#ff7fd6';if(n.hit)ctx.fillStyle='#62f3ff';ctx.beginPath();ctx.arc(lanes[n.lane],n.y,n.kind==='hold'?18:14,0,Math.PI*2);ctx.fill();}
ctx.fillStyle='#ecf1ff';ctx.font='20px system-ui';ctx.fillText(`PHASE ${phase}`,20,34);
ctx.fillText(`SCORE ${Math.floor(score)}`,20,62);
ctx.fillText(`COMBO ${combo}  x${mult}`,20,90);
ctx.fillStyle=life>40?'#7dffad':'#ff6d6d';ctx.fillRect(W-260,20,Math.max(0,life)*2.2,18);ctx.strokeStyle='#d7e2ff';ctx.strokeRect(W-260,20,220,18);
if(gameOver){ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.font='bold 44px system-ui';ctx.fillText('SYSTEM DOWN',W/2-160,H/2-10);ctx.font='22px system-ui';ctx.fillText('Press R to restart',W/2-90,H/2+30);} 
hud.textContent=`Life ${Math.max(0,Math.floor(life))}% · Phase ${phase} · Rhythm Window ±45px`;}
let last=performance.now();function loop(now){const dt=Math.min(0.033,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop);}requestAnimationFrame(loop);
