const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const goldEl = document.getElementById('gold');
const livesEl = document.getElementById('lives');
const waveEl = document.getElementById('wave');

const path = [{x:20,y:460},{x:170,y:460},{x:170,y:140},{x:360,y:140},{x:360,y:380},{x:560,y:380},{x:560,y:180},{x:760,y:180},{x:760,y:460},{x:940,y:460}];
let towers = [], enemies = [], bullets = [];
let gold=120, lives=15, wave=1, spawnLeft=8, spawnTick=0, pulse=0, paused=false;
let selected=1;
const towerTypes = {
  1:{cost:40,range:120,rate:22,dmg:8,color:'#7be0ff'},
  2:{cost:70,range:180,rate:45,dmg:20,color:'#ffd36e'}
};

function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
function onPath(p){
  for (let i=0;i<path.length-1;i++){
    const a=path[i], b=path[i+1];
    const minX=Math.min(a.x,b.x)-18,maxX=Math.max(a.x,b.x)+18;
    const minY=Math.min(a.y,b.y)-18,maxY=Math.max(a.y,b.y)+18;
    if (p.x>=minX&&p.x<=maxX&&p.y>=minY&&p.y<=maxY) return true;
  }
  return false;
}
function canPlace(p){ return !onPath(p) && towers.every(t=>dist(t,p)>34); }

function spawnEnemy(){ enemies.push({x:path[0].x,y:path[0].y,seg:0,hp:30+wave*8,speed:1.05+wave*0.05,r:10,slow:0}); }
function stepEnemy(e){
  const t = path[e.seg+1];
  if(!t) return false;
  const dx=t.x-e.x, dy=t.y-e.y, len=Math.hypot(dx,dy)||1;
  const s=e.speed*(e.slow>0?0.55:1);
  e.x += dx/len*s; e.y += dy/len*s;
  if (Math.hypot(t.x-e.x,t.y-e.y)<5) e.seg++;
  if(e.slow>0) e.slow--;
  if (e.seg>=path.length-1){ lives--; return true; }
  return false;
}

function fireTower(t){
  if (t.cool>0){ t.cool--; return; }
  let target=null, score=-1;
  for(const e of enemies){
    const d=dist(t,e); if(d<t.type.range){ const s=e.seg*100-d; if(s>score){score=s; target=e;} }
  }
  if(!target) return;
  t.cool=t.type.rate;
  bullets.push({x:t.x,y:t.y,vx:(target.x-t.x)/18,vy:(target.y-t.y)/18,dmg:t.type.dmg,slow:t.type===towerTypes[1],life:70,c:t.type.color});
}

function update(){
  if (paused || lives<=0) return;
  spawnTick++;
  if (spawnLeft>0 && spawnTick%45===0){ spawnEnemy(); spawnLeft--; }
  if (spawnLeft===0 && enemies.length===0){ wave++; spawnLeft=7+wave*2; gold+=30; }

  for(let i=enemies.length-1;i>=0;i--){ if(stepEnemy(enemies[i])) enemies.splice(i,1); }
  for(const t of towers) fireTower(t);
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i]; b.x+=b.vx; b.y+=b.vy; b.life--;
    let hit=false;
    for(let j=enemies.length-1;j>=0;j--){
      const e=enemies[j];
      if (Math.hypot(b.x-e.x,b.y-e.y) < e.r+3){
        e.hp-=b.dmg; if(b.slow) e.slow=35;
        hit=true;
        if(e.hp<=0){ enemies.splice(j,1); gold+=8; }
        break;
      }
    }
    if (hit||b.life<=0) bullets.splice(i,1);
  }
  if (pulse>0) pulse--;
}

function drawPath(){
  ctx.lineWidth=28; ctx.lineJoin='round'; ctx.strokeStyle='#2e3f61';
  ctx.beginPath(); ctx.moveTo(path[0].x,path[0].y); for(let i=1;i<path.length;i++)ctx.lineTo(path[i].x,path[i].y); ctx.stroke();
  ctx.lineWidth=3; ctx.strokeStyle='#5f85c7'; ctx.stroke();
}
function render(){
  ctx.clearRect(0,0,W,H);
  drawPath();
  for(const t of towers){
    ctx.fillStyle=t.type.color; ctx.beginPath(); ctx.arc(t.x,t.y,12,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(170,210,255,.12)'; ctx.beginPath(); ctx.arc(t.x,t.y,t.type.range,0,Math.PI*2); ctx.stroke();
  }
  for(const e of enemies){ ctx.fillStyle='#ff7f9f'; ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#111'; ctx.fillRect(e.x-14,e.y-18,28,4); ctx.fillStyle='#6dff9f'; ctx.fillRect(e.x-14,e.y-18,Math.max(0,28*(e.hp/(30+wave*8))),4);
  }
  for(const b of bullets){ ctx.fillStyle=b.c; ctx.beginPath(); ctx.arc(b.x,b.y,3,0,Math.PI*2); ctx.fill(); }
  if(pulse>0){ ctx.strokeStyle=`rgba(120,255,255,${pulse/20})`; ctx.lineWidth=8-pulse/4; ctx.beginPath(); ctx.arc(W/2,H/2,180+(20-pulse)*6,0,Math.PI*2); ctx.stroke(); }

  goldEl.textContent=gold; livesEl.textContent=lives; waveEl.textContent=wave;
  if(lives<=0){ ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#fff'; ctx.font='bold 44px sans-serif'; ctx.fillText('Core Lost',W/2-110,H/2); }
}
function loop(){ update(); render(); requestAnimationFrame(loop); }

function placeAt(clientX, clientY){
  const r = canvas.getBoundingClientRect();
  const p = {x:(clientX-r.left)*W/r.width, y:(clientY-r.top)*H/r.height};
  const type=towerTypes[selected];
  if (gold>=type.cost && canPlace(p)){ towers.push({x:p.x,y:p.y,type,cool:0}); gold-=type.cost; }
}
canvas.addEventListener('pointerdown', e=>placeAt(e.clientX,e.clientY));
window.addEventListener('keydown', e=>{
  if(e.key==='1') selected=1;
  if(e.key==='2') selected=2;
  if(e.key.toLowerCase()==='p') paused=!paused;
  if(e.code==='Space'&&gold>=35){ gold-=35; pulse=20; for(const e of enemies){ if(dist(e,{x:W/2,y:H/2})<300){ e.hp-=18; e.slow=30; } } }
});
loop();
