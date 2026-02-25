const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const state = {
  t: 0,
  over: false,
  win: false,
  score: 0,
  hp: 100,
  energy: 100,
  nodes: [
    { x: 160, y: 120, charge: 0 },
    { x: 800, y: 140, charge: 0 },
    { x: 210, y: 430, charge: 0 },
    { x: 760, y: 410, charge: 0 }
  ],
  player: { x: W / 2, y: H / 2, r: 14, vx: 0, vy: 0, speed: 2.8, dashCd: 0 },
  enemies: []
};

const keys = new Set();
const touchMove = { x: 0, y: 0 };

function spawnEnemy() {
  const edge = Math.floor(Math.random() * 4);
  const p = [{ x: Math.random() * W, y: -20 }, { x: W + 20, y: Math.random() * H }, { x: Math.random() * W, y: H + 20 }, { x: -20, y: Math.random() * H }][edge];
  state.enemies.push({ x: p.x, y: p.y, r: 11 + Math.random() * 8, speed: 1.1 + Math.random() * 1.1, hp: 20 });
}

function reset() {
  state.t = 0; state.over = false; state.win = false; state.score = 0; state.hp = 100; state.energy = 100;
  state.player = { x: W / 2, y: H / 2, r: 14, vx: 0, vy: 0, speed: 2.8, dashCd: 0 };
  state.enemies = [];
  state.nodes.forEach(n => n.charge = 0);
}

function inputVector() {
  let x = 0, y = 0;
  if (keys.has('arrowleft') || keys.has('a')) x -= 1;
  if (keys.has('arrowright') || keys.has('d')) x += 1;
  if (keys.has('arrowup') || keys.has('w')) y -= 1;
  if (keys.has('arrowdown') || keys.has('s')) y += 1;
  x += touchMove.x; y += touchMove.y;
  const m = Math.hypot(x, y) || 1;
  return { x: x / m, y: y / m, active: Math.hypot(x, y) > 0.05 };
}

function pulse() {
  if (state.energy < 28 || state.over) return;
  state.energy -= 28;
  state.enemies = state.enemies.filter(e => {
    const d = Math.hypot(e.x - state.player.x, e.y - state.player.y);
    if (d < 135) {
      e.hp -= 30;
      state.score += 8;
    }
    return e.hp > 0;
  });
}

function dash() {
  const p = state.player;
  if (p.dashCd > 0 || state.energy < 18 || state.over) return;
  const v = inputVector();
  if (!v.active) return;
  state.energy -= 18;
  p.x += v.x * 90;
  p.y += v.y * 90;
  p.x = Math.max(20, Math.min(W - 20, p.x));
  p.y = Math.max(20, Math.min(H - 20, p.y));
  p.dashCd = 1.2;
}

function update(dt) {
  if (state.over) return;
  state.t += dt;
  if (Math.random() < 0.03 + state.t * 0.00028) spawnEnemy();

  const v = inputVector();
  const p = state.player;
  p.x += v.x * p.speed * 60 * dt;
  p.y += v.y * p.speed * 60 * dt;
  p.x = Math.max(p.r, Math.min(W - p.r, p.x));
  p.y = Math.max(p.r, Math.min(H - p.r, p.y));
  p.dashCd = Math.max(0, p.dashCd - dt);
  state.energy = Math.min(100, state.energy + dt * 8.5);

  for (const n of state.nodes) {
    const d = Math.hypot(n.x - p.x, n.y - p.y);
    if (d < 70) n.charge = Math.min(100, n.charge + dt * 26);
    else n.charge = Math.max(0, n.charge - dt * 7);
  }

  for (const e of state.enemies) {
    const dx = p.x - e.x, dy = p.y - e.y;
    const m = Math.hypot(dx, dy) || 1;
    e.x += (dx / m) * e.speed;
    e.y += (dy / m) * e.speed;
    if (m < p.r + e.r) {
      state.hp -= dt * 23;
      state.score = Math.max(0, state.score - dt * 4);
    }
  }

  state.enemies = state.enemies.filter(e => e.hp > 0);
  state.score += dt * 3;

  const allFull = state.nodes.every(n => n.charge > 99.5);
  if (allFull) { state.win = true; state.over = true; }
  if (state.hp <= 0) { state.over = true; state.win = false; }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  for (const n of state.nodes) {
    const a = n.charge / 100;
    ctx.strokeStyle = '#4d6dff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(n.x, n.y, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = `rgba(100,220,255,${0.15 + a * 0.5})`;
    ctx.beginPath(); ctx.arc(n.x, n.y, 26 * a, 0, Math.PI * 2); ctx.fill();
  }

  for (const e of state.enemies) {
    ctx.fillStyle = '#ff4d8b';
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
  }

  const p = state.player;
  ctx.fillStyle = '#74f4ff';
  ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '18px system-ui';
  ctx.fillText(`HP ${Math.max(0, state.hp).toFixed(0)}   Energy ${state.energy.toFixed(0)}   Score ${state.score.toFixed(0)}`, 16, 28);
  ctx.fillText(`Nodes charged: ${state.nodes.filter(n => n.charge >= 100).length}/4`, 16, 52);

  if (state.over) {
    ctx.fillStyle = 'rgba(5,6,16,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 46px system-ui';
    ctx.fillText(state.win ? 'Containment Stable' : 'Quarantine Breached', 250, 250);
    ctx.font = '22px system-ui';
    ctx.fillText('Press R / Restart to play again', 330, 292);
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys.add(k);
  if (k === ' ') { e.preventDefault(); pulse(); }
  if (k === 'shift') dash();
  if (k === 'r') reset();
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));

for (const b of document.querySelectorAll('[data-dir]')) {
  const d = b.dataset.dir;
  const setDir = on => {
    if (!on) { touchMove.x = 0; touchMove.y = 0; return; }
    touchMove.x = d === 'left' ? -1 : d === 'right' ? 1 : 0;
    touchMove.y = d === 'up' ? -1 : d === 'down' ? 1 : 0;
  };
  b.addEventListener('pointerdown', () => setDir(true));
  b.addEventListener('pointerup', () => setDir(false));
  b.addEventListener('pointercancel', () => setDir(false));
}

document.getElementById('dashBtn').addEventListener('click', dash);
document.getElementById('pulseBtn').addEventListener('click', pulse);
document.getElementById('restartBtn').addEventListener('click', reset);

reset();
requestAnimationFrame(loop);
