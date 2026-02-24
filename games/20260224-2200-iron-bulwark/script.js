const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const stats = document.getElementById('stats');

const W = canvas.width;
const H = canvas.height;
const cols = 12;
const rows = 7;
const cell = 64;
const ox = 96;
const oy = 46;

const state = {
  gold: 140,
  hp: 20,
  wave: 0,
  score: 0,
  cursor: { c: 2, r: 3 },
  buildType: 0,
  priority: 0,
  inWave: false,
  waveLeft: 0,
  spawnTick: 0,
  enemies: [],
  projectiles: [],
  towers: [],
  keys: {}
};

const towerTypes = [
  { name: 'Bolt', cost: 60, range: 120, rate: 28, dmg: 14, color: '#6ee7ff' },
  { name: 'Splash', cost: 80, range: 96, rate: 45, dmg: 22, color: '#ffb347' }
];
const priorities = ['first', 'near-base'];

const path = [];
for (let c = 0; c < cols; c++) path.push({ c, r: 3 });

function cellToXY(c, r) {
  return { x: ox + c * cell + cell / 2, y: oy + r * cell + cell / 2 };
}

function startWave() {
  if (state.inWave) return;
  state.wave += 1;
  state.inWave = true;
  state.waveLeft = 8 + state.wave * 2;
  state.spawnTick = 0;
}

function buildOrUpgrade() {
  const { c, r } = state.cursor;
  if (r === 3) return;
  const existing = state.towers.find(t => t.c === c && t.r === r);
  if (!existing) {
    const type = towerTypes[state.buildType];
    if (state.gold < type.cost) return;
    state.gold -= type.cost;
    state.towers.push({ c, r, type: state.buildType, level: 1, cd: 0, priority: state.priority });
    return;
  }
  const up = 40 + existing.level * 30;
  if (state.gold < up || existing.level >= 3) return;
  state.gold -= up;
  existing.level += 1;
}

function findTarget(tower) {
  const pos = cellToXY(tower.c, tower.r);
  const type = towerTypes[tower.type];
  const range = type.range + tower.level * 16;
  let best = null;
  for (const e of state.enemies) {
    const dx = e.x - pos.x;
    const dy = e.y - pos.y;
    if (dx * dx + dy * dy > range * range) continue;
    if (!best) best = e;
    else {
      if (tower.priority === 0 && e.pathI > best.pathI) best = e;
      if (tower.priority === 1 && e.pathI < best.pathI) best = e;
    }
  }
  return best;
}

function spawnEnemy() {
  const p = cellToXY(path[0].c, path[0].r);
  state.enemies.push({ x: p.x, y: p.y, hp: 42 + state.wave * 11, speed: 0.75 + state.wave * 0.03, pathI: 0 });
}

function update() {
  if (state.keys.ArrowLeft || state.keys.a) state.cursor.c = Math.max(0, state.cursor.c - 1);
  if (state.keys.ArrowRight || state.keys.d) state.cursor.c = Math.min(cols - 1, state.cursor.c + 1);
  if (state.keys.ArrowUp || state.keys.w) state.cursor.r = Math.max(0, state.cursor.r - 1);
  if (state.keys.ArrowDown || state.keys.s) state.cursor.r = Math.min(rows - 1, state.cursor.r + 1);
  state.keys = {};

  if (state.inWave) {
    state.spawnTick++;
    if (state.waveLeft > 0 && state.spawnTick % 35 === 0) {
      spawnEnemy();
      state.waveLeft--;
    }
    if (state.waveLeft <= 0 && state.enemies.length === 0) {
      state.inWave = false;
      state.gold += 35 + state.wave * 4;
    }
  }

  for (const tower of state.towers) {
    tower.cd = Math.max(0, tower.cd - 1);
    const target = findTarget(tower);
    if (!target || tower.cd > 0) continue;
    const tp = towerTypes[tower.type];
    const p = cellToXY(tower.c, tower.r);
    const ang = Math.atan2(target.y - p.y, target.x - p.x);
    state.projectiles.push({
      x: p.x, y: p.y,
      vx: Math.cos(ang) * 5.5,
      vy: Math.sin(ang) * 5.5,
      dmg: tp.dmg + tower.level * 6,
      splash: tower.type === 1 ? 38 : 0
    });
    tower.cd = Math.max(8, tp.rate - tower.level * 4);
  }

  for (const e of state.enemies) {
    const nextIdx = Math.min(path.length - 1, e.pathI + 1);
    const t = cellToXY(path[nextIdx].c, path[nextIdx].r);
    const dx = t.x - e.x, dy = t.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    e.x += (dx / d) * e.speed;
    e.y += (dy / d) * e.speed;
    if (d < 2 && e.pathI < path.length - 1) e.pathI++;
    if (e.pathI >= path.length - 1 && d < 8) {
      e.hp = -999;
      state.hp -= 1;
    }
  }

  for (const p of state.projectiles) {
    p.x += p.vx; p.y += p.vy;
    for (const e of state.enemies) {
      const dx = e.x - p.x, dy = e.y - p.y;
      if (dx * dx + dy * dy < 180) {
        if (p.splash > 0) {
          for (const other of state.enemies) {
            const sx = other.x - p.x, sy = other.y - p.y;
            if (sx * sx + sy * sy < p.splash * p.splash) other.hp -= p.dmg;
          }
        } else {
          e.hp -= p.dmg;
        }
        p.hit = true;
        break;
      }
    }
  }

  state.projectiles = state.projectiles.filter(p => !p.hit && p.x > 0 && p.x < W && p.y > 0 && p.y < H);

  let kills = 0;
  state.enemies = state.enemies.filter(e => {
    if (e.hp <= 0) { kills++; return false; }
    return true;
  });
  if (kills) {
    state.gold += kills * 8;
    state.score += kills * 10;
  }
}

function draw() {
  ctx.fillStyle = '#0e1822';
  ctx.fillRect(0, 0, W, H);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ox + c * cell, y = oy + r * cell;
      ctx.fillStyle = r === 3 ? '#25384a' : '#142230';
      ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    }
  }

  for (const t of state.towers) {
    const p = cellToXY(t.c, t.r);
    const tt = towerTypes[t.type];
    ctx.fillStyle = tt.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, 16 + t.level * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(String(t.level), p.x - 3, p.y + 4);
  }

  for (const e of state.enemies) {
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath(); ctx.arc(e.x, e.y, 11, 0, Math.PI * 2); ctx.fill();
  }

  for (const p of state.projectiles) {
    ctx.fillStyle = '#f7f7f7';
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
  }

  const cur = cellToXY(state.cursor.c, state.cursor.r);
  ctx.strokeStyle = '#6ee7ff';
  ctx.lineWidth = 3;
  ctx.strokeRect(cur.x - cell / 2 + 4, cur.y - cell / 2 + 4, cell - 8, cell - 8);

  stats.textContent = `HP ${state.hp} | Gold ${state.gold} | Wave ${state.wave}${state.inWave ? ' (in progress)' : ''} | Type ${towerTypes[state.buildType].name} | Priority ${priorities[state.priority]} | Score ${state.score}`;
  if (state.hp <= 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('Defeat - Refresh to Retry', 260, 280);
  }
}

function loop() {
  if (state.hp > 0) update();
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener('keydown', (e) => {
  const k = e.key;
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(k)) state.keys[k] = true;
  if (k === ' ' || k === 'Spacebar') buildOrUpgrade();
  if (k === 't' || k === 'T') state.buildType = (state.buildType + 1) % towerTypes.length;
  if (k === 'p' || k === 'P') state.priority = (state.priority + 1) % priorities.length;
  if (k === 'n' || k === 'N') startWave();
});

document.querySelectorAll('button[data-act]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const a = btn.getAttribute('data-act');
    if (a === 'left') state.cursor.c = Math.max(0, state.cursor.c - 1);
    if (a === 'right') state.cursor.c = Math.min(cols - 1, state.cursor.c + 1);
    if (a === 'up') state.cursor.r = Math.max(0, state.cursor.r - 1);
    if (a === 'down') state.cursor.r = Math.min(rows - 1, state.cursor.r + 1);
    if (a === 'build') buildOrUpgrade();
    if (a === 'type') state.buildType = (state.buildType + 1) % towerTypes.length;
    if (a === 'priority') state.priority = (state.priority + 1) % priorities.length;
    if (a === 'wave') startWave();
  });
});

loop();