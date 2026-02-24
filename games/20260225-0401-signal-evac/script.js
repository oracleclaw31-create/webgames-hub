const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const key = {up:0,down:0,left:0,right:0,fireUp:0,fireDown:0,fireLeft:0,fireRight:0,dash:0};
const bind = {
  w:'up', a:'left', s:'down', d:'right',
  ArrowUp:'fireUp', ArrowDown:'fireDown', ArrowLeft:'fireLeft', ArrowRight:'fireRight', Shift:'dash'
};

addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') reset();
  const k = bind[e.key]; if (k) { key[k]=1; e.preventDefault(); }
});
addEventListener('keyup', e => { const k = bind[e.key]; if (k) key[k]=0; });

document.querySelectorAll('#touch button').forEach(btn => {
  const k = btn.dataset.key;
  btn.onpointerdown = () => key[k]=1;
  btn.onpointerup = () => key[k]=0;
  btn.onpointercancel = () => key[k]=0;
  btn.onpointerleave = () => key[k]=0;
});

let player, civilians, enemies, bullets, score, rescued, hp, t, msg, over, dashCd;
function reset(){
  player = {x:120,y:270,r:14,s:3.1};
  civilians = Array.from({length:5},(_,i)=>({x:640+i*55,y:80+(i%3)*130,r:10,safe:false}));
  enemies = Array.from({length:7},(_,i)=>({x:540+(i%3)*120,y:60+(i%5)*90,r:12,vx:(i%2?1:-1)*1.4,vy:(i%3?1:-1)*1.1,hp:2}));
  bullets=[]; score=0; rescued=0; hp=5; t=0; msg='Escort civilians to left evac gate'; over=false; dashCd=0;
}

function spawnBullet(){
  const dx = (key.fireRight-key.fireLeft), dy = (key.fireDown-key.fireUp);
  if (!dx && !dy) return;
  const mag = Math.hypot(dx,dy)||1;
  bullets.push({x:player.x,y:player.y,vx:dx/mag*7.5,vy:dy/mag*7.5,r:4,life:70});
}

function hit(a,b){ return Math.hypot(a.x-b.x,a.y-b.y) < a.r + b.r; }

reset();
(function loop(){
  requestAnimationFrame(loop);
  t++;
  if (over){ draw(); return; }

  const mx = key.right-key.left, my = key.down-key.up;
  player.x += mx * player.s;
  player.y += my * player.s;

  if (key.dash && dashCd<=0){
    player.x += mx * 28; player.y += my * 28; dashCd = 55;
  }
  if (dashCd>0) dashCd--;

  player.x = Math.max(20,Math.min(940,player.x));
  player.y = Math.max(20,Math.min(520,player.y));

  if (t%7===0) spawnBullet();

  bullets.forEach(b=>{b.x+=b.vx;b.y+=b.vy;b.life--;});
  bullets = bullets.filter(b=>b.life>0 && b.x>0&&b.x<960&&b.y>0&&b.y<540);

  enemies.forEach(e=>{
    e.x += e.vx; e.y += e.vy;
    if (e.x<320||e.x>940) e.vx*=-1;
    if (e.y<20||e.y>520) e.vy*=-1;
    if (Math.random()<0.02){ const tx=player.x-e.x, ty=player.y-e.y; const m=Math.hypot(tx,ty)||1; e.vx += tx/m*0.06; e.vy += ty/m*0.06; }
  });

  bullets.forEach(b=>enemies.forEach(e=>{
    if (e.hp>0 && hit(b,e)){ e.hp--; b.life=0; if (e.hp<=0){ score+=120; e.x=-1000; } }
  }));

  civilians.forEach(c=>{
    if (c.safe) return;
    if (hit(player,c)){ c.follow=true; }
    if (c.follow){
      const tx = player.x-35-c.x, ty = player.y-c.y; const m=Math.hypot(tx,ty)||1;
      c.x += tx/m*1.9; c.y += ty/m*1.9;
    }
    enemies.forEach(e=>{ if (e.hp>0 && hit(c,e)){ c.follow=false; c.x+=Math.random()*30-15; c.y+=Math.random()*30-15; }});
    if (c.x<80){ c.safe=true; rescued++; score+=250; }
  });

  enemies.forEach(e=>{ if (e.hp>0 && hit(player,e)){ hp--; e.x+=30; if (hp<=0){ over=true; msg='Mission failed. Press R'; } } });

  if (rescued===civilians.length){ over=true; msg=`Evac complete in ${(t/60).toFixed(1)}s`; }

  draw();
})();

function draw(){
  ctx.fillStyle='#0f1730'; ctx.fillRect(0,0,960,540);
  ctx.fillStyle='#1f7a57'; ctx.fillRect(0,0,95,540);
  ctx.fillStyle='#d6fff0'; ctx.font='14px system-ui'; ctx.fillText('EVAC ZONE',12,24);

  civilians.forEach(c=>{ ctx.fillStyle=c.safe?'#70ff9e':'#ffe182'; ctx.beginPath(); ctx.arc(c.x,c.y,c.r,0,7); ctx.fill(); });
  enemies.forEach(e=>{ if(e.hp>0){ ctx.fillStyle='#ff5f80'; ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,7); ctx.fill(); }});
  bullets.forEach(b=>{ ctx.fillStyle='#87d0ff'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,7); ctx.fill(); });
  ctx.fillStyle='#9bd6ff'; ctx.beginPath(); ctx.arc(player.x,player.y,player.r,0,7); ctx.fill();

  ctx.fillStyle='#e9f1ff'; ctx.font='16px system-ui';
  ctx.fillText(`HP ${hp}  SCORE ${score}  RESCUED ${rescued}/${civilians.length}`,16,522);
  ctx.fillText(msg,620,522);
}
