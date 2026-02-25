const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = {
  stage: document.getElementById('stage'),
  moves: document.getElementById('moves'),
  lit: document.getElementById('lit'),
  status: document.getElementById('status')
};

const CELL = 60;
const OX = 180;
const OY = 60;
let cursor = {x:0,y:0};
const keys = new Set();

const levels = [
  {w:8,h:7,moves:18,sources:[{x:0,y:3,d:0}],targets:[{x:7,y:1},{x:7,y:5}],walls:[{x:3,y:3},{x:4,y:3}],pieces:[{x:2,y:3,t:'m',r:1},{x:5,y:2,t:'m',r:0},{x:5,y:4,t:'s',r:0}]},
  {w:8,h:7,moves:20,sources:[{x:0,y:1,d:0},{x:0,y:5,d:0}],targets:[{x:7,y:3},{x:6,y:0},{x:6,y:6}],walls:[{x:4,y:1},{x:4,y:5}],pieces:[{x:2,y:1,t:'m',r:0},{x:2,y:5,t:'m',r:0},{x:3,y:3,t:'s',r:1},{x:5,y:3,t:'m',r:1}]},
  {w:8,h:7,moves:22,sources:[{x:0,y:3,d:0}],targets:[{x:7,y:0},{x:7,y:3},{x:7,y:6}],walls:[{x:3,y:2},{x:3,y:4},{x:5,y:3}],pieces:[{x:2,y:3,t:'s',r:0},{x:4,y:1,t:'m',r:1},{x:4,y:5,t:'m',r:0},{x:6,y:3,t:'m',r:1}]}
];
let stage = 0;
let state;

function cloneLevel(i){
  const lv = levels[i];
  return {
    w: lv.w, h: lv.h, moves: lv.moves,
    pieces: lv.pieces.map(p=>({...p})),
    walls: lv.walls.map(w=>({...w})),
    sources: lv.sources.map(s=>({...s})),
    targets: lv.targets.map(t=>({...t,lit:false}))
  };
}
function at(arr,x,y){ return arr.find(o=>o.x===x&&o.y===y); }
function inside(x,y){ return x>=0 && y>=0 && x<state.w && y<state.h; }

function reset(){
  state = cloneLevel(stage);
  cursor = {x:1,y:3};
  trace();
  draw();
}

function stepBeam(x,y,d,segments){
  let cx=x, cy=y, cd=d;
  for(let i=0;i<60;i++){
    cx += [1,0,-1,0][cd];
    cy += [0,1,0,-1][cd];
    if(!inside(cx,cy)) return;
    segments.push({x:cx,y:cy});
    const wall = at(state.walls,cx,cy);
    if(wall) return;
    const target = at(state.targets,cx,cy);
    if(target) target.lit = true;
    const p = at(state.pieces,cx,cy);
    if(!p) continue;
    if(p.t==='m'){
      // / or \
      const slash = p.r%2===0;
      if(slash){ cd = [3,2,1,0][cd]; }
      else { cd = [1,0,3,2][cd]; }
      continue;
    }
    if(p.t==='s'){
      const split = p.r%2===0;
      if(split){
        stepBeam(cx,cy,(cd+1)%4,segments);
        stepBeam(cx,cy,(cd+3)%4,segments);
      }
      return;
    }
  }
}

let beamSegs = [];
function trace(){
  state.targets.forEach(t=>t.lit=false);
  beamSegs = [];
  for(const s of state.sources){ stepBeam(s.x,s.y,s.d,beamSegs); }
  ui.stage.textContent = String(stage+1);
  ui.moves.textContent = String(state.moves);
  const lit = state.targets.filter(t=>t.lit).length;
  ui.lit.textContent = `${lit}/${state.targets.length}`;
  if(lit===state.targets.length){
    ui.status.textContent = stage===levels.length-1 ? 'All stages clear! Press R to replay.' : 'Stage clear! Press N for next stage.';
  } else if(state.moves<=0){
    ui.status.textContent = 'Out of moves. Press Reset (or R).';
  }
}

function rotateAt(x,y,toggle=false){
  if(state.moves<=0) return;
  const p = at(state.pieces,x,y);
  if(!p) return;
  if(toggle && p.t==='s') p.r = (p.r+1)%2;
  else p.r = (p.r+1)%2;
  state.moves--;
  trace();
  draw();
}

function drawCell(x,y,col){
  ctx.fillStyle = col;
  ctx.fillRect(OX+x*CELL, OY+y*CELL, CELL-2, CELL-2);
}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#06102b';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let y=0;y<state.h;y++){
    for(let x=0;x<state.w;x++) drawCell(x,y,'#101c44');
  }
  for(const w of state.walls) drawCell(w.x,w.y,'#22315f');
  for(const t of state.targets){ drawCell(t.x,t.y,t.lit?'#2f9c6f':'#7b3351'); }
  for(const s of state.sources){ drawCell(s.x,s.y,'#3a73cc'); }

  for(const b of beamSegs){
    ctx.fillStyle = 'rgba(255,225,120,.55)';
    ctx.fillRect(OX+b.x*CELL+16, OY+b.y*CELL+16, CELL-34, CELL-34);
  }

  for(const p of state.pieces){
    const px = OX+p.x*CELL+CELL/2, py = OY+p.y*CELL+CELL/2;
    ctx.strokeStyle = p.t==='m' ? '#d6e4ff' : '#9ae2ff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    if(p.t==='m'){
      if(p.r%2===0){ ctx.moveTo(px-18,py+18); ctx.lineTo(px+18,py-18); }
      else { ctx.moveTo(px-18,py-18); ctx.lineTo(px+18,py+18); }
    } else {
      ctx.moveTo(px-18,py); ctx.lineTo(px+18,py);
      if(p.r%2===0){ ctx.moveTo(px,py-18); ctx.lineTo(px,py+18); }
    }
    ctx.stroke();
  }

  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.strokeRect(OX+cursor.x*CELL+2, OY+cursor.y*CELL+2, CELL-6, CELL-6);
}

function moveCursor(dx,dy){
  cursor.x = Math.max(0,Math.min(state.w-1,cursor.x+dx));
  cursor.y = Math.max(0,Math.min(state.h-1,cursor.y+dy));
  draw();
}

window.addEventListener('keydown', e=>{
  const k = e.key.toLowerCase();
  keys.add(k);
  if(['arrowup','arrowdown','arrowleft','arrowright',' ','enter'].includes(e.key)) e.preventDefault();
  if(k==='arrowup'||k==='w') moveCursor(0,-1);
  if(k==='arrowdown'||k==='s') moveCursor(0,1);
  if(k==='arrowleft'||k==='a') moveCursor(-1,0);
  if(k==='arrowright'||k==='d') moveCursor(1,0);
  if(k===' '||k==='enter') rotateAt(cursor.x,cursor.y,false);
  if(k==='shift') rotateAt(cursor.x,cursor.y,true);
  if(k==='r') reset();
  if(k==='n' && state.targets.every(t=>t.lit) && stage<levels.length-1){ stage++; reset(); }
  if(k==='n' && state.targets.every(t=>t.lit) && stage===levels.length-1){ stage=0; reset(); }
});
window.addEventListener('keyup', e=> keys.delete(e.key.toLowerCase()));

document.getElementById('resetBtn').onclick = reset;
for(const btn of document.querySelectorAll('.touch button')){
  btn.addEventListener('click', ()=>{
    const a = btn.dataset.act;
    if(a==='up') moveCursor(0,-1);
    if(a==='down') moveCursor(0,1);
    if(a==='left') moveCursor(-1,0);
    if(a==='right') moveCursor(1,0);
    if(a==='rotate') rotateAt(cursor.x,cursor.y,false);
    if(a==='toggle') rotateAt(cursor.x,cursor.y,true);
  });
}

reset();
