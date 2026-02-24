const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = {
  time: document.getElementById('time'), carry: document.getElementById('carry'),
  banked: document.getElementById('banked'), hp: document.getElementById('hp'), msg: document.getElementById('msg')
};

const grid = 14;
const size = canvas.width / grid;
const base = { x: 1, y: 1 };
let state;
let tick;

function newState() {
  return {
    t: 45, hp: 3, carry: 0, banked: 0,
    player: { x: 1, y: 1 },
    shards: spawnShards(10),
    drones: [{ x: 11, y: 2, dx: -1, dy: 0 }, { x: 9, y: 11, dx: 0, dy: -1 }],
    over: false
  };
}

function spawnShards(n) {
  const list = [];
  while (list.length < n) {
    const x = 1 + Math.floor(Math.random() * (grid - 2));
    const y = 1 + Math.floor(Math.random() * (grid - 2));
    if ((x === 1 && y === 1) || list.some(s => s.x === x && s.y === y)) continue;
    list.push({ x, y });
  }
  return list;
}

function move(dx, dy) {
  if (state.over) return;
  const nx = Math.max(0, Math.min(grid - 1, state.player.x + dx));
  const ny = Math.max(0, Math.min(grid - 1, state.player.y + dy));
  state.player.x = nx; state.player.y = ny;
  collectCheck();
  hitCheck();
}

function collectCheck() {
  const i = state.shards.findIndex(s => s.x === state.player.x && s.y === state.player.y);
  if (i >= 0) {
    state.shards.splice(i, 1);
    state.carry += 1;
    ui.msg.textContent = 'Shard collected!';
  }
  if (state.shards.length < 6) state.shards.push(...spawnShards(1));
}

function bank() {
  if (state.over) return;
  if (state.player.x === base.x && state.player.y === base.y && state.carry > 0) {
    state.banked += state.carry;
    state.carry = 0;
    ui.msg.textContent = 'Banked safely.';
    if (state.banked >= 20) finish(true);
  } else {
    ui.msg.textContent = 'Return to base to bank.';
  }
}

function moveDrones() {
  for (const d of state.drones) {
    if (Math.random() < 0.25) {
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
      d.dx = dx; d.dy = dy;
    }
    d.x += d.dx; d.y += d.dy;
    if (d.x <= 0 || d.x >= grid - 1) { d.dx *= -1; d.x += d.dx; }
    if (d.y <= 0 || d.y >= grid - 1) { d.dy *= -1; d.y += d.dy; }
  }
}

function hitCheck() {
  if (state.drones.some(d => d.x === state.player.x && d.y === state.player.y)) {
    state.hp -= 1;
    state.carry = 0;
    state.player.x = 1; state.player.y = 1;
    ui.msg.textContent = 'Hit! Lost carried shards.';
    if (state.hp <= 0) finish(false);
  }
}

function finish(win) {
  state.over = true;
  clearInterval(tick);
  ui.msg.textContent = win ? 'You win! Neon vault filled.' : 'You lost. Try another run.';
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      ctx.fillStyle = (x === 0 || y === 0 || x === grid - 1 || y === grid - 1) ? '#111a3b' : '#0d1330';
      ctx.fillRect(x * size, y * size, size - 1, size - 1);
    }
  }
  ctx.fillStyle = '#39f0ff';
  ctx.fillRect(base.x * size + 6, base.y * size + 6, size - 12, size - 12);

  for (const s of state.shards) {
    ctx.fillStyle = '#7ef7c8';
    ctx.beginPath();
    ctx.arc(s.x * size + size / 2, s.y * size + size / 2, size / 5, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const d of state.drones) {
    ctx.fillStyle = '#ff5e9a';
    ctx.fillRect(d.x * size + 8, d.y * size + 8, size - 16, size - 16);
  }

  ctx.fillStyle = '#ffe082';
  ctx.beginPath();
  ctx.arc(state.player.x * size + size / 2, state.player.y * size + size / 2, size / 3, 0, Math.PI * 2);
  ctx.fill();

  ui.time.textContent = state.t;
  ui.carry.textContent = state.carry;
  ui.banked.textContent = state.banked;
  ui.hp.textContent = state.hp;
}

function start() {
  state = newState();
  clearInterval(tick);
  tick = setInterval(() => {
    if (state.over) return;
    state.t -= 1;
    moveDrones();
    hitCheck();
    if (state.t <= 0) finish(state.banked >= 20);
    draw();
  }, 1000);
  draw();
}

document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'arrowup' || k === 'w') move(0, -1);
  if (k === 'arrowdown' || k === 's') move(0, 1);
  if (k === 'arrowleft' || k === 'a') move(-1, 0);
  if (k === 'arrowright' || k === 'd') move(1, 0);
  if (k === ' ' || k === 'enter') bank();
  draw();
});

for (const btn of document.querySelectorAll('[data-dir]')) {
  btn.addEventListener('click', () => {
    const d = btn.dataset.dir;
    if (d === 'up') move(0, -1);
    if (d === 'down') move(0, 1);
    if (d === 'left') move(-1, 0);
    if (d === 'right') move(1, 0);
    draw();
  });
}

document.getElementById('bankBtn').addEventListener('click', () => { bank(); draw(); });
document.getElementById('resetBtn').addEventListener('click', start);

start();
