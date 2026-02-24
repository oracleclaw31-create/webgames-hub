const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const state = {
  round: 1,
  score: 0,
  solved: 0,
  failed: 0,
  target: 0,
  current: 0,
  start: 0,
  nums: [],
  maxMoves: 3,
  movesLeft: 3,
  selectedNum: -1,
  selectedOp: '+',
  msg: '',
  canNext: false,
  buttons: { nums: [], ops: [] }
};

const OPS = ['+','-','×','÷'];
const KEY_TO_OP = { q:'+', w:'-', e:'×', r:'÷' };

function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

function generateRound(){
  const pool = Array.from({length:4},()=>randInt(1,9));
  let cur = randInt(2,12);
  const used = [];
  for(let i=0;i<3;i++){
    const idx = randInt(0,pool.length-1);
    const n = pool.splice(idx,1)[0];
    const op = OPS[randInt(0,3)];
    cur = applyOp(cur,n,op,true);
    used.push(n);
  }
  const remain = pool.concat(used.slice(3));
  state.start = randInt(2,12);
  state.current = state.start;
  state.target = Math.max(1,Math.min(99,Math.round(cur)));
  state.nums = Array.from({length:4},()=>randInt(1,9));
  state.movesLeft = state.maxMoves;
  state.selectedNum = -1;
  state.selectedOp = '+';
  state.msg = '숫자 카드와 연산을 선택해 목표값을 맞추세요';
  state.canNext = false;
}

function applyOp(a,b,op,safe=false){
  if(op==='+') return a+b;
  if(op==='-') return a-b;
  if(op==='×') return a*b;
  if(op==='÷'){
    if(b===0) return a;
    const v = a/b;
    return safe?Math.round(v):Math.round(v*10)/10;
  }
  return a;
}

function useMove(){
  if(state.canNext || state.selectedNum<0 || state.movesLeft<=0) return;
  const n = state.nums[state.selectedNum];
  state.current = applyOp(state.current,n,state.selectedOp,false);
  state.nums.splice(state.selectedNum,1);
  state.selectedNum = -1;
  state.movesLeft--;

  if(Math.abs(state.current - state.target) < 0.001){
    state.score += 100 + state.movesLeft*20;
    state.solved++;
    state.msg = '정답! Space 또는 Next Round';
    state.canNext = true;
  } else if(state.movesLeft<=0 || state.nums.length===0){
    state.failed++;
    state.msg = `실패! 목표:${state.target}, 결과:${state.current}`;
    state.canNext = true;
  } else {
    state.msg = `남은 기회 ${state.movesLeft}번`;
  }
}

function nextRound(){
  if(!state.canNext) return;
  state.round++;
  generateRound();
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  drawPanel(22,20,916,90);
  drawText('Number Nexus',44,56,34,'#eaf2ff','700');
  drawText(`Round ${state.round}   Score ${state.score}   Solved ${state.solved}/${state.solved+state.failed}`,44,88,22,'#9cb0e0');

  drawPanel(22,126,420,180);
  drawText(`Target`,44,168,24,'#9cb0e0');
  drawText(`${state.target}`,44,230,68,'#79e7ff','800');

  drawPanel(458,126,480,180);
  drawText('Current',480,168,24,'#9cb0e0');
  drawText(`${state.current}`,480,230,68,'#ffd27f','800');
  drawText(`Moves Left: ${state.movesLeft}`,480,278,22,'#c9d7ff');

  drawPanel(22,324,916,194);
  drawText('Number Cards',44,360,24,'#b6c6f2');

  state.buttons.nums = [];
  const sx = 44, sy = 378, w=150, h=118, g=20;
  for(let i=0;i<state.nums.length;i++){
    const x = sx + i*(w+g);
    const selected = state.selectedNum===i;
    roundRect(x,sy,w,h,16,selected?'#2b8bb3':'#1b2b59','#3656a4');
    drawText(String(state.nums[i]), x+58, sy+78, 56, '#f4fbff', '800');
    state.buttons.nums.push({x,y:sy,w,h,i});
  }

  drawText('Operation',700,360,24,'#b6c6f2');
  state.buttons.ops = [];
  const ox=700, oy=378, ow=52, oh=52;
  for(let i=0;i<OPS.length;i++){
    const y = oy + i*34;
    const op = OPS[i];
    const on = state.selectedOp===op;
    roundRect(ox,y,ow,oh,12,on?'#6f49d9':'#2b2f60','#7d8de0');
    drawText(op, ox+17, y+35, 30, '#fff', '700');
    state.buttons.ops.push({x:ox,y,w:ow,h:oh,op});
  }

  roundRect(770,380,152,50,12,state.canNext?'#1e7a53':'#2b3a69','#4bc08d');
  drawText('Next Round',798,413,22,'#ebfff6','700');
  state.buttons.next = {x:770,y:380,w:152,h:50};

  roundRect(770,444,152,50,12,'#7b4f1f','#cc9442');
  drawText('Apply Move',802,477,22,'#fff3dc','700');
  state.buttons.apply = {x:770,y:444,w:152,h:50};

  drawText(state.msg,44,510,22,'#9db0de');

  requestAnimationFrame(draw);
}

function drawPanel(x,y,w,h){ roundRect(x,y,w,h,16,'#111a3a','#2f448d'); }
function drawText(t,x,y,size,color,weight='600'){
  ctx.fillStyle=color; ctx.font=`${weight} ${size}px system-ui`; ctx.fillText(t,x,y);
}
function roundRect(x,y,w,h,r,fill,stroke){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle=stroke; ctx.lineWidth=2; ctx.stroke();
}

function onPointer(px,py){
  for(const b of state.buttons.nums){ if(hit(b,px,py)){ state.selectedNum=b.i; return; } }
  for(const b of state.buttons.ops){ if(hit(b,px,py)){ state.selectedOp=b.op; return; } }
  if(hit(state.buttons.apply,px,py)) useMove();
  if(hit(state.buttons.next,px,py)) nextRound();
}
function hit(b,x,y){ return b && x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h; }

canvas.addEventListener('pointerdown', e=>{
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  onPointer((e.clientX-rect.left)*sx, (e.clientY-rect.top)*sy);
});

window.addEventListener('keydown', e=>{
  const k = e.key.toLowerCase();
  if(k>='1' && k<='4'){
    const idx = Number(k)-1;
    if(idx < state.nums.length) state.selectedNum = idx;
  } else if(KEY_TO_OP[k]){
    state.selectedOp = KEY_TO_OP[k];
  } else if(k==='enter') useMove();
  else if(k===' '){ e.preventDefault(); if(state.canNext) nextRound(); }
});

generateRound();
requestAnimationFrame(draw);
