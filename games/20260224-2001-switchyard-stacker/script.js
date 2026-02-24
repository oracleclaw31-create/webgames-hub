const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = {
  level: document.getElementById('level'), total: document.getElementById('total'),
  moves: document.getElementById('moves'), switches: document.getElementById('switches'),
  best: document.getElementById('best'), status: document.getElementById('status')
};

const CELL = 48;
const OFFX = 160;
const OFFY = 72;

const levels = [
  [
    '##########',
    '#..s.....#',
    '#..b..s..#',
    '#..p.....#',
    '#..b..e..#',
    '#........#',
    '##########'
  ],
  [
    '##########',
    '#...s....#',
    '#.bb..#..#',
    '#..p..#e.#',
    '#...s....#',
    '#........#',
    '##########'
  ]
];

let state, levelIndex = 0;
const best = JSON.parse(localStorage.getItem('switchyardBest') || '{}');

function parseLevel(map){
  const g = map.map(r=>r.split(''));
  let player = {x:0,y:0}, exit = {x:0,y:0}, switches = [];
  for(let y=0;y<g.length;y++) for(let x=0;x<g[y].length;x++){
    const c = g[y][x];
    if(c==='p'){ player={x,y}; g[y][x]='.'; }
    if(c==='e'){ exit={x,y}; g[y][x]='e'; }
    if(c==='s') switches.push({x,y});
  }
  return {grid:g, player, exit, switches, moves:0, history:[]};
}

function reset(){ state = parseLevel(levels[levelIndex]); sync(); draw(); }
function sync(){
  const on = state.switches.filter(s=>state.grid[s.y][s.x]==='b').length;
  ui.level.textContent = levelIndex+1; ui.total.textContent = levels.length;
  ui.moves.textContent = state.moves; ui.switches.textContent = `${on}/${state.switches.length}`;
  ui.best.textContent = best[levelIndex+1] ?? '-';
}

function isOpen(x,y){ return state.grid[y] && state.grid[y][x] && state.grid[y][x] !== '#'; }

function move(dx,dy){
  const nx=state.player.x+dx, ny=state.player.y+dy;
  if(!isOpen(nx,ny)) return;
  const c = state.grid[ny][nx];
  if(c==='b'){
    const bx=nx+dx, by=ny+dy;
    if(!isOpen(bx,by) || state.grid[by][bx]==='b') return;
    state.history.push(JSON.stringify(state));
    state.grid[by][bx]='b'; state.grid[ny][nx]='.';
  } else state.history.push(JSON.stringify(state));
  state.player={x:nx,y:ny}; state.moves++; checkWin(); sync(); draw();
}

function undo(){ if(state.history.length){ state = JSON.parse(state.history.pop()); sync(); draw(); } }
function checkWin(){
  const allOn = state.switches.every(s=>state.grid[s.y][s.x]==='b');
  if(allOn && state.player.x===state.exit.x && state.player.y===state.exit.y){
    ui.status.textContent = 'Cleared! Press N for next level';
    const lv = levelIndex+1; best[lv]=Math.min(best[lv]||999,state.moves); localStorage.setItem('switchyardBest',JSON.stringify(best));
  } else ui.status.textContent = allOn ? 'Exit unlocked!' : 'Power all switches';
}

function next(){ if(levelIndex < levels.length-1){ levelIndex++; reset(); } }

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#07111c'; ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let y=0;y<state.grid.length;y++) for(let x=0;x<state.grid[y].length;x++){
    const px = OFFX+x*CELL, py=OFFY+y*CELL, c=state.grid[y][x];
    ctx.fillStyle = c==='#' ? '#22364c' : '#102030'; ctx.fillRect(px,py,CELL-2,CELL-2);
    if(c==='s'){ ctx.fillStyle='#f0a'; ctx.beginPath(); ctx.arc(px+24,py+24,10,0,7); ctx.fill(); }
    if(c==='b'){ ctx.fillStyle='#d8a14a'; ctx.fillRect(px+8,py+8,32,32); }
    if(c==='e'){ ctx.strokeStyle='#56d7ff'; ctx.strokeRect(px+8,py+8,32,32); }
  }
  ctx.fillStyle='#7ef0bc'; ctx.fillRect(OFFX+state.player.x*CELL+10,OFFY+state.player.y*CELL+10,28,28);
}

window.addEventListener('keydown',e=>{
  if(e.key==='ArrowUp'||e.key==='w') move(0,-1);
  if(e.key==='ArrowDown'||e.key==='s') move(0,1);
  if(e.key==='ArrowLeft'||e.key==='a') move(-1,0);
  if(e.key==='ArrowRight'||e.key==='d') move(1,0);
  if(e.key==='z') undo(); if(e.key==='r') reset(); if(e.key==='n') next();
});

document.querySelectorAll('.touch button').forEach(b=>b.addEventListener('click',()=>{
  const a=b.dataset.act;
  if(a==='up') move(0,-1); if(a==='down') move(0,1); if(a==='left') move(-1,0); if(a==='right') move(1,0);
  if(a==='undo') undo(); if(a==='reset') reset();
}));

reset();