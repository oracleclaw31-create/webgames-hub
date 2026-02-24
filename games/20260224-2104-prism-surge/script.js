const c=document.getElementById('game'),x=c.getContext('2d');
const scoreEl=document.getElementById('score'),livesEl=document.getElementById('lives'),phaseEl=document.getElementById('phase');
let paddle={x:190,y:680,w:100,h:14,s:7},ball={x:240,y:660,vx:0,vy:0,r:8,stuck:true};
let score=0,lives=3,phase=1,charge=0,keys={},touch=0;
const rows=6,cols=8,bw=54,bh=22,pad=4,ox=12,oy=70;let bricks=[];
function resetBricks(){bricks=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const hp=r<2?2:1;bricks.push({x:ox+c*(bw+pad),y:oy+r*(bh+pad),w:bw,h:bh,hp});}}
resetBricks();
function launch(){if(ball.stuck){ball.stuck=false;const p=Math.min(charge,60)/60;ball.vx=(Math.random()*2-1)*2;ball.vy=-(4+p*4);charge=0;}}
function update(){if(keys.ArrowLeft||touch<0)paddle.x-=paddle.s;if(keys.ArrowRight||touch>0)paddle.x+=paddle.s;
paddle.x=Math.max(0,Math.min(c.width-paddle.w,paddle.x));
if(ball.stuck){ball.x=paddle.x+paddle.w/2;ball.y=paddle.y-ball.r-2;if(keys.Space)charge=Math.min(60,charge+1);}else{ball.x+=ball.vx;ball.y+=ball.vy;}
if(ball.x<ball.r||ball.x>c.width-ball.r)ball.vx*=-1;if(ball.y<ball.r)ball.vy*=-1;
if(ball.y>c.height+20){lives--;ball.stuck=true;ball.vx=0;ball.vy=0;if(lives<=0){lives=3;score=0;phase=1;resetBricks();}}
if(ball.y+ball.r>paddle.y&&ball.x>paddle.x&&ball.x<paddle.x+paddle.w&&ball.vy>0){const hit=(ball.x-(paddle.x+paddle.w/2))/(paddle.w/2);ball.vx=hit*5;ball.vy=-Math.abs(ball.vy)-0.1*phase;}
for(const b of bricks){if(!b.hp)continue;if(ball.x>b.x&&ball.x<b.x+b.w&&ball.y>b.y&&ball.y<b.y+b.h){b.hp--;ball.vy*=-1;if(!b.hp){score+=10;}}}
if(bricks.every(b=>!b.hp)){phase++;resetBricks();ball.stuck=true;}
scoreEl.textContent=`Score: ${score}`;livesEl.textContent=`Lives: ${lives}`;phaseEl.textContent=`Phase: ${phase}`;}
function draw(){x.clearRect(0,0,c.width,c.height);x.fillStyle='#5fe1ff';x.fillRect(paddle.x,paddle.y,paddle.w,paddle.h);
x.beginPath();x.fillStyle='#ffd166';x.arc(ball.x,ball.y,ball.r,0,Math.PI*2);x.fill();
for(const b of bricks){if(!b.hp)continue;x.fillStyle=b.hp===2?'#ff6b8a':'#7ee787';x.fillRect(b.x,b.y,b.w,b.h);}if(ball.stuck&&charge>0){x.fillStyle='#fff';x.fillRect(10,10,charge*2,8);}requestAnimationFrame(loop);}
function loop(){update();draw();}
window.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Space')e.preventDefault();});
window.addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='Space')launch();});
document.querySelectorAll('button').forEach(b=>{b.onpointerdown=()=>{const a=b.dataset.act;if(a==='left')touch=-1;if(a==='right')touch=1;if(a==='launch'){charge=60;launch();}};b.onpointerup=()=>{touch=0;};});
loop();
