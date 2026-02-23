const c = document.getElementById('game');
const g = c.getContext('2d');
const ui = {
  hp: document.getElementById('hp'),
  score: document.getElementById('score'),
  time: document.getElementById('time')
};

const keys = { up: false, down: false, left: false, right: false };
let s;
let loop;

function reset() {
  s = {
    t: 60,
    over: false,
    player: { x: 320, y: 320, r: 12, hp: 3, dir: { x: 0, y: -1 } },
    enemies: [],
    bullets: [],
    score: 0,
    spawnCd: 0,
    fireCd: 0
  };
}

function spawnEnemy() {
  const e = Math.floor(Math.random() * 4);
  const m = 20;
  if (e === 0) s.enemies.push({ x: Math.random() * c.width, y: -m, r: 12, v: 1.2 });
  if (e === 1) s.enemies.push({ x: c.width + m, y: Math.random() * c.height, r: 12, v: 1.2 });
  if (e === 2) s.enemies.push({ x: Math.random() * c.width, y: c.height + m, r: 12, v: 1.2 });
  if (e === 3) s.enemies.push({ x: -m, y: Math.random() * c.height, r: 12, v: 1.2 });
}

function fire() {
  if (s.over || s.fireCd > 0) return;
  const d = s.player.dir;
  s.bullets.push({ x: s.player.x, y: s.player.y, vx: d.x * 7, vy: d.y * 7, r: 4 });
  s.fireCd = 10;
}

function update() {
  if (s.over) return;

  let dx = 0, dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  const mag = Math.hypot(dx, dy) || 1;
  dx /= mag; dy /= mag;

  s.player.x += dx * 3.2;
  s.player.y += dy * 3.2;
  s.player.x = Math.max(12, Math.min(c.width - 12, s.player.x));
  s.player.y = Math.max(12, Math.min(c.height - 12, s.player.y));
  if (dx !== 0 || dy !== 0) s.player.dir = { x: dx, y: dy };

  for (const b of s.bullets) {
    b.x += b.vx;
    b.y += b.vy;
  }
  s.bullets = s.bullets.filter(b => b.x > -10 && b.x < c.width + 10 && b.y > -10 && b.y < c.height + 10);

  for (const e of s.enemies) {
    const vx = s.player.x - e.x;
    const vy = s.player.y - e.y;
    const d = Math.hypot(vx, vy) || 1;
    e.x += (vx / d) * e.v;
    e.y += (vy / d) * e.v;
  }

  for (let i = s.enemies.length - 1; i >= 0; i -= 1) {
    const e = s.enemies[i];
    let hit = false;
    for (let j = s.bullets.length - 1; j >= 0; j -= 1) {
      const b = s.bullets[j];
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) {
        s.enemies.splice(i, 1);
        s.bullets.splice(j, 1);
        s.score += 1;
        hit = true;
        break;
      }
    }
    if (hit) continue;

    if (Math.hypot(e.x - s.player.x, e.y - s.player.y) < e.r + s.player.r) {
      s.enemies.splice(i, 1);
      s.player.hp -= 1;
      if (s.player.hp <= 0) {
        s.over = true;
      }
    }
  }

  s.spawnCd -= 1;
  if (s.spawnCd <= 0) {
    spawnEnemy();
    s.spawnCd = Math.max(12, 30 - Math.floor(s.score / 3));
  }

  if (s.fireCd > 0) s.fireCd -= 1;
}

function draw() {
  g.clearRect(0, 0, c.width, c.height);

  g.strokeStyle = '#17445c';
  for (let i = 0; i <= c.width; i += 40) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, c.height);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i);
    g.lineTo(c.width, i);
    g.stroke();
  }

  g.fillStyle = '#90f6ff';
  g.beginPath();
  g.arc(s.player.x, s.player.y, s.player.r, 0, Math.PI * 2);
  g.fill();

  g.strokeStyle = '#fff';
  g.beginPath();
  g.moveTo(s.player.x, s.player.y);
  g.lineTo(s.player.x + s.player.dir.x * 22, s.player.y + s.player.dir.y * 22);
  g.stroke();

  g.fillStyle = '#ffd27a';
  for (const b of s.bullets) {
    g.beginPath();
    g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    g.fill();
  }

  g.fillStyle = '#ff6f6f';
  for (const e of s.enemies) {
    g.beginPath();
    g.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    g.fill();
  }

  ui.hp.textContent = s.player.hp;
  ui.score.textContent = s.score;
  ui.time.textContent = s.t;

  if (s.over || s.t <= 0) {
    g.fillStyle = 'rgba(0,0,0,0.6)';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#fff';
    g.font = '32px system-ui';
    const win = s.score >= 25 && s.player.hp > 0;
    g.fillText(win ? 'WIN' : 'GAME OVER', 250, 300);
  }
}

function start() {
  reset();
  clearInterval(loop);
  loop = setInterval(() => {
    if (!s.over) {
      s.t -= 1 / 60;
      if (s.t <= 0) {
        s.t = 0;
        s.over = true;
      }
      update();
    }
    draw();
  }, 1000 / 60);
}

function setKey(code, v) {
  if (code === 'arrowup' || code === 'w') keys.up = v;
  if (code === 'arrowdown' || code === 's') keys.down = v;
  if (code === 'arrowleft' || code === 'a') keys.left = v;
  if (code === 'arrowright' || code === 'd') keys.right = v;
}

document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  setKey(k, true);
  if (k === ' ') fire();
});
document.addEventListener('keyup', (e) => setKey(e.key.toLowerCase(), false));

document.getElementById('fireBtn').addEventListener('click', fire);
document.getElementById('resetBtn').addEventListener('click', start);
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

start();
