const c=document.getElementById('game'),x=c.getContext('2d'),hud=document.getElementById('hud');
const cell=50,cols=14,rows=9,ox=100,oy=55;
const path=[[0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3]];
const s={gold:120,hp:20,wave:1,cursor:[2,2],towers:[],enemies:[],tick:0,spawning:false,spawnLeft:0};
function key(p){return p[0]+','+p[1]} const pathSet=new Set(path.map(key));
function spawn(){s.enemies.push({i:0,prog:0,hp:28+s.wave*8,speed:0.009+s.wave*0.001});}
function build(){const p=s.cursor;if(pathSet.has(key(p)))return;let t=s.towers.find(t=>t.x===p[0]&&t.y===p[1]);if(!t&&s.gold>=40){s.gold-=40;s.towers.push({x:p[0],y:p[1],lv:1,cool:0});}}
function upgrade(){const p=s.cursor;let t=s.towers.find(t=>t.x===p[0]&&t.y===p[1]);if(t&&s.gold>=35*t.lv&&t.lv<3){s.gold-=35*t.lv;t.lv++;}}
function start(){if(!s.spawning&&s.enemies.length===0){s.spawning=true;s.spawnLeft=8+s.wave*2;}}
function input(){addEventListener('keydown',e=>{if(e.key==='ArrowLeft')s.cursor[0]=Math.max(0,s.cursor[0]-1);if(e.key==='ArrowRight')s.cursor[0]=Math.min(cols-1,s.cursor[0]+1);if(e.key==='ArrowUp')s.cursor[1]=Math.max(0,s.cursor[1]-1);if(e.key==='ArrowDown')s.cursor[1]=Math.min(rows-1,s.cursor[1]+1);if(e.key==='b'||e.key==='B')build();if(e.key==='u'||e.key==='U')upgrade();if(e.key===' ')start();});
for(const b of document.querySelectorAll('button'))b.onclick=()=>{if(b.dataset.act==='build')build();if(b.dataset.act==='upgrade')upgrade();if(b.dataset.act==='start')start();};
c.addEventListener('click',e=>{const r=c.getBoundingClientRect();const mx=(e.clientX-r.left)*(c.width/r.width),my=(e.clientY-r.top)*(c.height/r.height);const gx=Math.floor((mx-ox)/cell),gy=Math.floor((my-oy)/cell);if(gx>=0&&gy>=0&&gx<cols&&gy<rows)s.cursor=[gx,gy];});}
function upd(){s.tick++;if(s.spawning&&s.tick%45===0&&s.spawnLeft>0){spawn();s.spawnLeft--;}if(s.spawning&&s.spawnLeft===0&&s.enemies.length===0){s.spawning=false;s.wave++;s.gold+=35;}
for(const t of s.towers){if(t.cool>0)t.cool--;let best=null,bd=999;for(const e of s.enemies){const p=path[e.i],n=path[Math.min(e.i+1,path.length-1)];const ex=(p[0]+(n[0]-p[0])*e.prog)*cell+ox+25,ey=(p[1]+(n[1]-p[1])*e.prog)*cell+oy+25;const d=Math.hypot(ex-(t.x*cell+ox+25),ey-(t.y*cell+oy+25));if(d<bd){bd=d;best=e;}} if(best&&bd<130&&t.cool===0){best.hp-=7*t.lv;t.cool=22-3*t.lv;if(best.hp<=0){s.gold+=12;best.dead=true;}}}
for(const e of s.enemies){e.prog+=e.speed;if(e.prog>=1){e.i++;e.prog=0;if(e.i>=path.length-1){e.dead=true;s.hp--;}}}
s.enemies=s.enemies.filter(e=>!e.dead);if(s.hp<=0){s.hp=20;s.wave=1;s.gold=120;s.enemies=[];s.towers=[];s.spawning=false;}
}
function draw(){x.clearRect(0,0,c.width,c.height);for(let gx=0;gx<cols;gx++)for(let gy=0;gy<rows;gy++){x.fillStyle=pathSet.has(gx+','+gy)?'#5d7f55':'#1b2f52';x.fillRect(ox+gx*cell,oy+gy*cell,cell-2,cell-2);}for(const t of s.towers){x.fillStyle=['#8cd3ff','#58b5ff','#2287ff'][t.lv-1];x.beginPath();x.arc(ox+t.x*cell+25,oy+t.y*cell+25,10+t.lv*2,0,7);x.fill();}
for(const e of s.enemies){const p=path[e.i],n=path[Math.min(e.i+1,path.length-1)],ex=(p[0]+(n[0]-p[0])*e.prog)*cell+ox+25,ey=(p[1]+(n[1]-p[1])*e.prog)*cell+oy+25;x.fillStyle='#ff6f61';x.beginPath();x.arc(ex,ey,11,0,7);x.fill();}
x.strokeStyle='#ffe082';x.lineWidth=3;x.strokeRect(ox+s.cursor[0]*cell,oy+s.cursor[1]*cell,cell-2,cell-2);
hud.textContent=`Gold: ${s.gold} | Base HP: ${s.hp} | Wave: ${s.wave}`;}
function loop(){upd();draw();requestAnimationFrame(loop);}input();loop();
