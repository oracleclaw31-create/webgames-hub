const c=document.getElementById('game'),x=c.getContext('2d');
const N=9,S=60,OX=90,OY=0;
const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
const base=[
'#########',
'#P..r...#',
'#.##.#..#',
'#..b.#E.#',
'#.##.#..#',
'#..g....#',
'#.##.##.#',
'#..C....#',
'#########'];
let map,player,moves,energy,history,msg;
function reset(){map=base.map(r=>r.split(''));for(let y=0;y<N;y++)for(let i=0;i<N;i++)if(map[y][i]=='P'){player={x:i,y};map[y][i]='.';}moves=0;energy=0;history=[];msg='Route power to core, then exit.';sync();}
function clone(){return {map:map.map(r=>r.slice()),player:{...player},moves,energy,msg};}
function restore(s){map=s.map.map(r=>r.slice());player={...s.player};moves=s.moves;energy=s.energy;msg=s.msg;sync();}
function tile(x,y){return map[y]?.[x]??'#';}
function powerAt(tx,ty){const seen=new Set(),q=[[tx,ty]];while(q.length){const [cx,cy]=q.shift(),k=cx+','+cy;if(seen.has(k))continue;seen.add(k);for(const[dX,dY]of dirs){const nx=cx+dX,ny=cy+dY,t=tile(nx,ny);if('rgb'.includes(t))energy++;if(t==='.'||t==='C'||t==='E'||'rgb'.includes(t))q.push([nx,ny]);}}
}
function act(a){history.push(clone());if(a==='undo'&&history.length>1){history.pop();restore(history.pop());return;}if(a==='reset'){reset();return;}if(a==='rotate'){const t=tile(player.x,player.y);if('rgb'.includes(t)){map[player.y][player.x]={r:'g',g:'b',b:'r'}[t];moves++;}sync();return;}
let dx=0,dy=0;if(a==='up')dy=-1;if(a==='down')dy=1;if(a==='left')dx=-1;if(a==='right')dx=1;
if(!dx&&!dy)return;const nx=player.x+dx,ny=player.y+dy,t=tile(nx,ny);if(t!=='#'){player.x=nx;player.y=ny;moves++;if(t==='C'){energy=0;powerAt(nx,ny);msg=energy>=3?'Core powered. Reach exit!':'Need 3+ energy nodes.';}if(t==='E'){msg=energy>=3?'ESCAPE SUCCESS':'Core not powered.';}}
sync();}
function sync(){document.getElementById('moves').textContent='Moves: '+moves;document.getElementById('energy').textContent='Energy: '+energy;document.getElementById('status').textContent=msg;draw();}
function draw(){x.clearRect(0,0,c.width,c.height);for(let y=0;y<N;y++)for(let i=0;i<N;i++){const t=map[y][i],px=OX+i*S,py=OY+y*S;x.fillStyle=t=='#'?'#25345f':'#111c3d';x.fillRect(px+1,py+1,S-2,S-2);if('rgb'.includes(t)){x.fillStyle=t;x.beginPath();x.arc(px+30,py+30,14,0,7);x.fill();}
if(t==='C'){x.fillStyle='#ffd166';x.fillRect(px+18,py+18,24,24);}if(t==='E'){x.strokeStyle='#7af';x.lineWidth=3;x.strokeRect(px+14,py+14,32,32);} }
x.fillStyle='#7cffd4';x.beginPath();x.arc(OX+player.x*S+30,OY+player.y*S+30,12,0,7);x.fill();}
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='arrowup'||k==='w')act('up');if(k==='arrowdown'||k==='s')act('down');if(k==='arrowleft'||k==='a')act('left');if(k==='arrowright'||k==='d')act('right');if(k==='q')act('rotate');if(k==='z')act('undo');if(k==='r')act('reset');});
document.querySelectorAll('button[data-a]').forEach(b=>b.addEventListener('click',()=>act(b.dataset.a)));
reset();history.push(clone());
