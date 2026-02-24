const c = document.getElementById('game');
const x = c.getContext('2d');
const ui={time:time,hp:hp,score:score,dash:dash};
const S={w:c.width,h:c.height,t:0,score:0,over:false,wave:1,perkChoices:['HP+20','FireRate+','Speed+']};
const P={x:480,y:270,r:14,hp:100,speed:210,dashCd:0,fireCd:0,fireGap:0.22,vx:0,vy:0};
const K={}; const mobs=[]; const bullets=[];
let touchMove={x:0,y:0}; let perkOpen=false;
function spawn(n=2+S.wave){for(let i=0;i<n;i++){const e=Math.floor(Math.random()*4);let ex=0,ey=0;if(e===0){ex=Math.random()*S.w;ey=-20}else if(e===1){ex=S.w+20;ey=Math.random()*S.h}else if(e===2){ex=Math.random()*S.w;ey=S.h+20}else{ex=-20;ey=Math.random()*S.h}mobs.push({x:ex,y:ey,r:11+Math.random()*8,hp:20+S.wave*6,sp:50+Math.random()*30+S.wave*2});}}
function nearest(){let best=null,bd=1e9;for(const m of mobs){const d=(m.x-P.x)**2+(m.y-P.y)**2;if(d<bd){bd=d;best=m;}}return best;}
function fire(dt){P.fireCd-=dt;if(P.fireCd>0)return;const n=nearest();if(!n)return;const a=Math.atan2(n.y-P.y,n.x-P.x);bullets.push({x:P.x,y:P.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,r:4,d:18});P.fireCd=P.fireGap;}
function move(dt){let mx=(K['ArrowRight']||K['d']?1:0)-(K['ArrowLeft']||K['a']?1:0)+touchMove.x;let my=(K['ArrowDown']||K['s']?1:0)-(K['ArrowUp']||K['w']?1:0)+touchMove.y;const ml=Math.hypot(mx,my)||1;mx/=ml;my/=ml;P.x=Math.max(P.r,Math.min(S.w-P.r,P.x+mx*P.speed*dt));P.y=Math.max(P.r,Math.min(S.h-P.r,P.y+my*P.speed*dt));}
function dashNow(){if(P.dashCd>0)return;let mx=(K['ArrowRight']||K['d']?1:0)-(K['ArrowLeft']||K['a']?1:0)+touchMove.x;let my=(K['ArrowDown']||K['s']?1:0)-(K['ArrowUp']||K['w']?1:0)+touchMove.y;const ml=Math.hypot(mx,my)||1;P.x=Math.max(P.r,Math.min(S.w-P.r,P.x+(mx/ml)*95));P.y=Math.max(P.r,Math.min(S.h-P.r,P.y+(my/ml)*95));P.dashCd=2.2;}
function perkPick(){if(!perkOpen)return;const pick=S.perkChoices[Math.floor(Math.random()*S.perkChoices.length)];if(pick==='HP+20')P.hp=Math.min(140,P.hp+20);if(pick==='FireRate+')P.fireGap=Math.max(0.11,P.fireGap-0.03);if(pick==='Speed+')P.speed+=20;perkOpen=false;}
function tick(ts){if(!S.last)S.last=ts;const dt=Math.min(0.033,(ts-S.last)/1000);S.last=ts;if(!S.over){S.t+=dt;P.dashCd=Math.max(0,P.dashCd-dt);move(dt);fire(dt);if(mobs.length<2+S.wave)spawn(1);
for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.d-=dt*60;}for(let i=bullets.length-1;i>=0;i--)if(bullets[i].d<=0||bullets[i].x<0||bullets[i].x>S.w||bullets[i].y<0||bullets[i].y>S.h)bullets.splice(i,1);
for(const m of mobs){const a=Math.atan2(P.y-m.y,P.x-m.x);m.x+=Math.cos(a)*m.sp*dt;m.y+=Math.sin(a)*m.sp*dt;}
for(let mi=mobs.length-1;mi>=0;mi--){const m=mobs[mi];for(let bi=bullets.length-1;bi>=0;bi--){const b=bullets[bi];if((m.x-b.x)**2+(m.y-b.y)**2<(m.r+b.r)**2){m.hp-=b.d;bullets.splice(bi,1);if(m.hp<=0){S.score+=10;mobs.splice(mi,1);break;}}}
if((m.x-P.x)**2+(m.y-P.y)**2<(m.r+P.r)**2){P.hp-=22*dt;}}
if(S.t>S.wave*12){S.wave++;perkOpen=true;}
if(P.hp<=0)S.over=true;}
render();requestAnimationFrame(tick);}
function render(){x.clearRect(0,0,S.w,S.h);x.fillStyle='#091122';x.fillRect(0,0,S.w,S.h);for(let i=0;i<90;i++){x.fillStyle='rgba(140,170,255,0.08)';x.fillRect((i*53+S.t*20)%S.w,(i*29)%S.h,2,2);}x.fillStyle='#61f2ff';x.beginPath();x.arc(P.x,P.y,P.r,0,7);x.fill();for(const m of mobs){x.fillStyle='#ff5f7a';x.beginPath();x.arc(m.x,m.y,m.r,0,7);x.fill();}x.fillStyle='#ffe082';for(const b of bullets){x.beginPath();x.arc(b.x,b.y,b.r,0,7);x.fill();}
if(perkOpen){x.fillStyle='rgba(0,0,0,0.5)';x.fillRect(0,0,S.w,S.h);x.fillStyle='#fff';x.font='28px system-ui';x.fillText('Perk Ready! Press Enter/PICK',280,260);}if(S.over){x.fillStyle='rgba(0,0,0,0.6)';x.fillRect(0,0,S.w,S.h);x.fillStyle='#fff';x.font='34px system-ui';x.fillText('Downed - Press R to Retry',290,260);}ui.time.textContent=`Time ${S.t.toFixed(1)}s`;ui.hp.textContent=`HP ${Math.max(0,P.hp|0)}`;ui.score.textContent=`Score ${S.score}`;ui.dash.textContent=P.dashCd>0?`Dash ${P.dashCd.toFixed(1)}s`:'Dash Ready';}
addEventListener('keydown',e=>{K[e.key]=1;if(e.key===' ')dashNow();if(e.key==='Enter')perkPick();if(e.key.toLowerCase()==='r'&&S.over)location.reload();});
addEventListener('keyup',e=>K[e.key]=0);
let tStart=null;c.addEventListener('touchstart',e=>{const t=e.touches[0];tStart={x:t.clientX,y:t.clientY};});
c.addEventListener('touchmove',e=>{if(!tStart)return;const t=e.touches[0];touchMove.x=Math.max(-1,Math.min(1,(t.clientX-tStart.x)/50));touchMove.y=Math.max(-1,Math.min(1,(t.clientY-tStart.y)/50));});
c.addEventListener('touchend',()=>{touchMove={x:0,y:0};tStart=null;});
dashBtn.onclick=dashNow;perkBtn.onclick=perkPick;
spawn(8);requestAnimationFrame(tick);
