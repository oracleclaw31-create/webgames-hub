const c = document.getElementById('game');
const g = c.getContext('2d');
const uiLives = document.getElementById('lives');
const uiBricks = document.getElementById('bricks');

const keys = { left: false, right: false };
let s;
let loop;

function makeBricks() {
  const out = [];
  const cols = 10;
  const rows = 5;
  const w = 62;
  const h = 20;
  const ox = 24;
  const oy = 30;
  const gx = 8;
  const gy = 8;
  for (let r = 0; r < rows; r += 1) {
    for (let c2 = 0; c2 < cols; c2 += 1) {
      out.push({ x: ox + c2 * (w + gx), y: oy + r * (h + gy), w, h, alive: true });
    }
  }
  return out;
}

function reset() {
  s = {
    over: false,
    win: false,
    lives: 3,
    paddle: { x: 300, y: 440, w: 120, h: 14, v: 7 },
    ball: { x: 360, y: 320, r: 8, vx: 3.2, vy: -3.2 },
    bricks: makeBricks()
  };
}

function collide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  if (s.over) return;

  if (keys.left) s.paddle.x -= s.paddle.v;
  if (keys.right) s.paddle.x += s.paddle.v;
  s.paddle.x = Math.max(0, Math.min(c.width - s.paddle.w, s.paddle.x));

  s.ball.x += s.ball.vx;
  s.ball.y += s.ball.vy;

  if (s.ball.x < s.ball.r || s.ball.x > c.width - s.ball.r) s.ball.vx *= -1;
  if (s.ball.y < s.ball.r) s.ball.vy *= -1;

  const paddleRect = { x: s.paddle.x, y: s.paddle.y, w: s.paddle.w, h: s.paddle.h };
  const ballRect = { x: s.ball.x - s.ball.r, y: s.ball.y - s.ball.r, w: s.ball.r * 2, h: s.ball.r * 2 };
  if (collide(ballRect, paddleRect) && s.ball.vy > 0) {
    const hit = (s.ball.x - s.paddle.x) / s.paddle.w - 0.5;
    s.ball.vx = hit * 8;
    s.ball.vy = -Math.abs(s.ball.vy);
  }

  for (const b of s.bricks) {
    if (!b.alive) continue;
    if (collide(ballRect, b)) {
      b.alive = false;
      s.ball.vy *= -1;
      break;
    }
  }

  if (s.ball.y > c.height + 20) {
    s.lives -= 1;
    s.ball.x = 360; s.ball.y = 320; s.ball.vx = 3.2; s.ball.vy = -3.2;
    if (s.lives <= 0) {
      s.over = true;
      s.win = false;
    }
  }

  if (s.bricks.every((b) => !b.alive)) {
    s.over = true;
    s.win = true;
  }
}

function draw() {
  g.clearRect(0, 0, c.width, c.height);

  for (const b of s.bricks) {
    if (!b.alive) continue;
    g.fillStyle = `hsl(${(b.x + b.y) % 360} 80% 60%)`;
    g.fillRect(b.x, b.y, b.w, b.h);
  }

  g.fillStyle = '#e6e6ff';
  g.fillRect(s.paddle.x, s.paddle.y, s.paddle.w, s.paddle.h);

  g.fillStyle = '#ffda74';
  g.beginPath();
  g.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2);
  g.fill();

  uiLives.textContent = String(s.lives);
  uiBricks.textContent = String(s.bricks.filter((b) => b.alive).length);

  if (s.over) {
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#fff';
    g.font = '32px system-ui';
    g.fillText(s.win ? 'YOU WIN' : 'GAME OVER', 265, 250);
  }
}

function start() {
  reset();
  clearInterval(loop);
  loop = setInterval(() => {
    update();
    draw();
  }, 1000 / 60);
}

document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') keys.left = true;
  if (k === 'arrowright' || k === 'd') keys.right = true;
});

document.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') keys.left = false;
  if (k === 'arrowright' || k === 'd') keys.right = false;
});

for (const b of document.querySelectorAll('[data-dir]')) {
  b.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys[b.dataset.dir] = true;
  }, { passive: false });
  b.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys[b.dataset.dir] = false;
  }, { passive: false });
  b.addEventListener('mousedown', () => { keys[b.dataset.dir] = true; });
  b.addEventListener('mouseup', () => { keys[b.dataset.dir] = false; });
}

document.getElementById('resetBtn').addEventListener('click', start);
start();
