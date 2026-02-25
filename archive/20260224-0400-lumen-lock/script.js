const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const touch = document.getElementById('touch');

const SIZE = 5;
let cursor = {x:2,y:2};
let level = 1;
let score = 0;
let time = 45;
let over = false;
let board = [], target=[];

function makeGrid() {
  board = Array.from({length:SIZE},()=>Array.from({length:SIZE},()=>0));
  target = Array.from({length:SIZE},()=>Array.from({length:SIZE},()=>0));
  const flips = 6 + level*2;
  for (let i=0;i<flips;i++) toggle(Math.floor(Math.random()*SIZE), Math.floor(Math.random()*SIZE), target);
}

function toggle(x,y,arr=board){
  [[x,y],[x+1,y],[x-1,y],[x,y+1],[x,y-1]].forEach(([a,b])=>{
    if(a>=0&&a<SIZE&&b>=0&&b<SIZE) arr[b][a] = arr[b][a]?0:1;
  });
}

function solved(){
  for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++) if(board[y][x]!==target[y][x]) return false;
  return true;
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const pad=40, cell=80;
  ctx.fillStyle='#9bb0ff'; ctx.font='20px system-ui';
  ctx.fillText('Target',40,35); ctx.fillText('Board',40,335);
  for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++){
    drawCell(x,y,target[y][x],40,50,cell,false);
    drawCell(x,y,board[y][x],40,350,cell, cursor.x===x&&cursor.y===y);
  }
  hud.textContent=`Level ${level} | Score ${score} | Time ${time}s`;
  if(over){
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,480,640);
    ctx.fillStyle='#fff'; ctx.font='28px system-ui'; ctx.fillText('Game Over',160,300);
    ctx.font='18px system-ui'; ctx.fillText('Press R / Tap RESTART',140,340);
  }
}

function drawCell(x,y,on,ox,oy,cell,focus){
  ctx.fillStyle=on?'#5de2ff':'#1b2b52';
  ctx.fillRect(ox+x*cell, oy+y*cell, cell-6, cell-6);
  if(focus){ctx.strokeStyle='#ffd25d';ctx.lineWidth=3;ctx.strokeRect(ox+x*cell, oy+y*cell, cell-6, cell-6);}
}

function act(){ if(over) return; toggle(cursor.x,cursor.y,board); score+=10; if(solved()){ level++; score+=100; time=Math.min(60,time+8); makeGrid(); } }

function key(e){
  if(e.key==='ArrowLeft'||e.key==='a') cursor.x=Math.max(0,cursor.x-1);
  if(e.key==='ArrowRight'||e.key==='d') cursor.x=Math.min(SIZE-1,cursor.x+1);
  if(e.key==='ArrowUp'||e.key==='w') cursor.y=Math.max(0,cursor.y-1);
  if(e.key==='ArrowDown'||e.key==='s') cursor.y=Math.min(SIZE-1,cursor.y+1);
  if(e.key===' '||e.key==='Enter') act();
  if(e.key==='r') reset();
}
document.addEventListener('keydown', key);

canvas.addEventListener('touchstart', (e)=>{
  const r=canvas.getBoundingClientRect();
  const t=e.touches[0];
  const x=Math.floor((t.clientX-r.left)/(r.width/6))-1;
  const y=Math.floor(((t.clientY-r.top)-350*(r.height/640))/((80)*(r.height/640)));
  if(x>=0&&x<SIZE&&y>=0&&y<SIZE){cursor={x,y};act();}
});

[['←',()=>cursor.x=Math.max(0,cursor.x-1)],['↑',()=>cursor.y=Math.max(0,cursor.y-1)],['→',()=>cursor.x=Math.min(SIZE-1,cursor.x+1)],['↓',()=>cursor.y=Math.min(SIZE-1,cursor.y+1)],['TOGGLE',act],['RESTART',reset]].forEach(([t,fn])=>{
  const b=document.createElement('button');b.textContent=t;b.onclick=fn;touch.appendChild(b);
});

function reset(){cursor={x:2,y:2};level=1;score=0;time=45;over=false;makeGrid();}
setInterval(()=>{if(!over){time--;if(time<=0)over=true;draw();}},1000/2);
reset();draw();
