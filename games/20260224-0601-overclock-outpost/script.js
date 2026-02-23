const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hud = {
  wave: document.getElementById("wave"),
  coreHp: document.getElementById("coreHp"),
  credits: document.getElementById("credits"),
  enemies: document.getElementById("enemies"),
  heat: document.getElementById("heat")
};

const pathPoints = [
  { x: 20, y: 90 },
  { x: 280, y: 90 },
  { x: 280, y: 250 },
  { x: 680, y: 250 },
  { x: 680, y: 430 },
  { x: 940, y: 430 }
];

const cell = 80;
const gridCols = 12;
const gridRows = 6;

const keys = new Set();
let lastTime = performance.now();
let enemyTimer = 0;

const state = {
  running: true,
  wave: 1,
  waveActive: false,
  toSpawn: 0,
  spawned: 0,
  coreHp: 20,
  credits: 120,
  selected: { c: 2, r: 2 },
  turrets: [],
  bullets: [],
  enemies: [],
  message: "Build before starting wave",
  gameOver: false
};

const balance = {
  buildCost: 35,
  sellRefund: 20,
  overclockCost: 15,
  maxWave: 10,
  waveSizeBase: 7,
  turretRange: 160,
  turretDamage: 14,
  turretCooldown: 0.75
};

function resetGame() {
  state.wave = 1;
  state.waveActive = false;
  state.toSpawn = 0;
  state.spawned = 0;
  state.coreHp = 20;
  state.credits = 120;
  state.turrets = [];
  state.bullets = [];
  state.enemies = [];
  state.message = "Build before starting wave";
  state.gameOver = false;
  state.selected = { c: 2, r: 2 };
}

function worldFromCell(c, r) {
  return { x: c * cell + cell / 2, y: r * cell + cell / 2 + 30 };
}

function cellFromWorld(x, y) {
  return {
    c: Math.max(0, Math.min(gridCols - 1, Math.floor(x / cell))),
    r: Math.max(0, Math.min(gridRows - 1, Math.floor((y - 30) / cell)))
  };
}

function getTurret(c, r) {
  return state.turrets.find((t) => t.c === c && t.r === r);
}

function segmentDistance(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLenSq = abx * abx + aby * aby;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  const dx = px - cx;
  const dy = py - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

function isPathCell(c, r) {
  const p = worldFromCell(c, r);
  for (let i = 0; i < pathPoints.length - 1; i += 1) {
    const a = pathPoints[i];
    const b = pathPoints[i + 1];
    if (segmentDistance(p.x, p.y, a.x, a.y, b.x, b.y) < 38) return true;
  }
  return false;
}

function buildOrSell() {
  if (state.gameOver) return;
  const { c, r } = state.selected;
  const existing = getTurret(c, r);
  if (existing) {
    state.turrets = state.turrets.filter((t) => t !== existing);
    state.credits += balance.sellRefund;
    state.message = "Turret sold";
    return;
  }

  if (isPathCell(c, r)) {
    state.message = "Cannot build on enemy route";
    return;
  }

  if (state.credits < balance.buildCost) {
    state.message = "Not enough credits";
    return;
  }

  state.credits -= balance.buildCost;
  state.turrets.push({
    c,
    r,
    heat: 0,
    cooldown: 0,
    overclock: 0
  });
  state.message = "Turret built";
}

function ventSelected() {
  if (state.gameOver) return;
  const t = getTurret(state.selected.c, state.selected.r);
  if (!t) {
    state.message = "Select a turret first";
    return;
  }
  t.heat = Math.max(0, t.heat - 45);
  state.message = "Manual vent activated";
}

function overclockSelected() {
  if (state.gameOver) return;
  const t = getTurret(state.selected.c, state.selected.r);
  if (!t) {
    state.message = "Select a turret first";
    return;
  }
  if (state.credits < balance.overclockCost) {
    state.message = "Need more credits for overclock";
    return;
  }
  state.credits -= balance.overclockCost;
  t.overclock = Math.max(t.overclock, 4);
  t.heat += 20;
  state.message = "Turret overclocked";
}

function startWave() {
  if (state.gameOver || state.waveActive) return;
  state.waveActive = true;
  state.spawned = 0;
  state.toSpawn = balance.waveSizeBase + state.wave * 2;
  state.message = `Wave ${state.wave} started`;
}

function spawnEnemy() {
  const hp = 40 + state.wave * 14;
  const speed = 48 + state.wave * 4;
  state.enemies.push({ x: pathPoints[0].x, y: pathPoints[0].y, hp, maxHp: hp, speed, segment: 0, alive: true });
}

function updateEnemies(dt) {
  state.enemies.forEach((e) => {
    if (!e.alive) return;
    const next = pathPoints[e.segment + 1];
    if (!next) return;

    const dx = next.x - e.x;
    const dy = next.y - e.y;
    const dist = Math.hypot(dx, dy);

    if (dist < e.speed * dt) {
      e.x = next.x;
      e.y = next.y;
      e.segment += 1;
      if (e.segment >= pathPoints.length - 1) {
        e.alive = false;
        state.coreHp -= 1;
        state.message = "Core hit";
      }
    } else {
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * e.speed * dt;
    }
  });

  state.enemies = state.enemies.filter((e) => e.alive && e.hp > 0);
}

function updateTurrets(dt) {
  state.turrets.forEach((t) => {
    t.cooldown -= dt;
    t.overclock = Math.max(0, t.overclock - dt);
    t.heat = Math.max(0, t.heat - dt * 6);

    if (t.heat >= 100) {
      t.cooldown = Math.max(t.cooldown, 1.2);
      return;
    }

    if (t.cooldown > 0) return;

    const pos = worldFromCell(t.c, t.r);
    let target = null;
    let best = Infinity;
    state.enemies.forEach((e) => {
      const d = Math.hypot(e.x - pos.x, e.y - pos.y);
      if (d < balance.turretRange && d < best) {
        best = d;
        target = e;
      }
    });

    if (!target) return;

    const fireRate = t.overclock > 0 ? 0.4 : balance.turretCooldown;
    const heatGain = t.overclock > 0 ? 18 : 10;

    t.cooldown = fireRate;
    t.heat += heatGain;

    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    const norm = Math.hypot(dx, dy);

    state.bullets.push({
      x: pos.x,
      y: pos.y,
      vx: (dx / norm) * 340,
      vy: (dy / norm) * 340,
      damage: t.overclock > 0 ? balance.turretDamage + 7 : balance.turretDamage
    });
  });
}

function updateBullets(dt) {
  state.bullets.forEach((b) => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    state.enemies.forEach((e) => {
      if (!e.alive) return;
      const d = Math.hypot(e.x - b.x, e.y - b.y);
      if (d < 16) {
        e.hp -= b.damage;
        b.hit = true;
        if (e.hp <= 0) {
          e.alive = false;
          state.credits += 7;
        }
      }
    });
  });

  state.bullets = state.bullets.filter((b) => !b.hit && b.x >= 0 && b.x <= canvas.width && b.y >= 0 && b.y <= canvas.height);
}

function updateWave(dt) {
  if (!state.waveActive) return;
  enemyTimer -= dt;

  if (state.spawned < state.toSpawn && enemyTimer <= 0) {
    spawnEnemy();
    state.spawned += 1;
    enemyTimer = Math.max(0.3, 0.95 - state.wave * 0.03);
  }

  const allSpawned = state.spawned >= state.toSpawn;
  if (allSpawned && state.enemies.length === 0) {
    state.waveActive = false;
    state.wave += 1;
    state.credits += 30;
    state.message = "Wave cleared. Build phase.";

    if (state.wave > balance.maxWave) {
      state.message = "Victory! Restart for another run.";
      state.gameOver = true;
    }
  }
}

function updateInput(dt) {
  if (state.gameOver) return;
  const step = Math.max(1, Math.floor(10 * dt));
  if (keys.has("arrowleft") || keys.has("a")) state.selected.c = Math.max(0, state.selected.c - step);
  if (keys.has("arrowright") || keys.has("d")) state.selected.c = Math.min(gridCols - 1, state.selected.c + step);
  if (keys.has("arrowup") || keys.has("w")) state.selected.r = Math.max(0, state.selected.r - step);
  if (keys.has("arrowdown") || keys.has("s")) state.selected.r = Math.min(gridRows - 1, state.selected.r + step);
}

function drawGrid() {
  ctx.fillStyle = "#0a1322";
  ctx.fillRect(0, 30, canvas.width, canvas.height - 30);

  for (let c = 0; c < gridCols; c += 1) {
    for (let r = 0; r < gridRows; r += 1) {
      const x = c * cell;
      const y = r * cell + 30;
      const blocked = isPathCell(c, r);
      ctx.strokeStyle = blocked ? "#3f2830" : "#203850";
      ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
      if (blocked) {
        ctx.fillStyle = "rgba(190, 60, 70, 0.18)";
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      }
    }
  }

  const selX = state.selected.c * cell;
  const selY = state.selected.r * cell + 30;
  ctx.strokeStyle = "#8de7ff";
  ctx.lineWidth = 3;
  ctx.strokeRect(selX + 3, selY + 3, cell - 6, cell - 6);
  ctx.lineWidth = 1;
}

function drawPath() {
  ctx.strokeStyle = "#f8768a";
  ctx.lineWidth = 22;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (let i = 1; i < pathPoints.length; i += 1) {
    ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
  }
  ctx.stroke();

  ctx.strokeStyle = "#ffd9df";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (let i = 1; i < pathPoints.length; i += 1) {
    ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
  }
  ctx.stroke();
}

function drawTurrets() {
  state.turrets.forEach((t) => {
    const p = worldFromCell(t.c, t.r);
    const pct = Math.min(1, t.heat / 100);

    ctx.fillStyle = t.overclock > 0 ? "#ffcd4d" : "#78c7ff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#0a1324";
    ctx.stroke();

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(p.x - 20, p.y + 20, 40, 6);
    ctx.fillStyle = pct > 0.9 ? "#ff5f5f" : "#71ffa3";
    ctx.fillRect(p.x - 20, p.y + 20, 40 * pct, 6);
  });
}

function drawEnemies() {
  state.enemies.forEach((e) => {
    ctx.fillStyle = "#ff788d";
    ctx.beginPath();
    ctx.arc(e.x, e.y, 14, 0, Math.PI * 2);
    ctx.fill();

    const ratio = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = "#122337";
    ctx.fillRect(e.x - 15, e.y - 22, 30, 4);
    ctx.fillStyle = "#91ffd7";
    ctx.fillRect(e.x - 15, e.y - 22, 30 * ratio, 4);
  });
}

function drawBullets() {
  ctx.fillStyle = "#c8f0ff";
  state.bullets.forEach((b) => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawTopBar() {
  ctx.fillStyle = "#09101d";
  ctx.fillRect(0, 0, canvas.width, 30);
  ctx.fillStyle = "#d5e2ff";
  ctx.font = "14px Trebuchet MS";
  ctx.fillText(state.message, 10, 20);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawPath();
  drawTurrets();
  drawEnemies();
  drawBullets();
  drawTopBar();
}

function updateHud() {
  hud.wave.textContent = String(state.wave);
  hud.coreHp.textContent = String(state.coreHp);
  hud.credits.textContent = String(state.credits);
  hud.enemies.textContent = String(state.enemies.length);

  const t = getTurret(state.selected.c, state.selected.r);
  hud.heat.textContent = t ? `${Math.round(t.heat)}%` : "-";
}

function tick(now) {
  if (!state.running) return;
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  updateInput(dt);

  if (!state.gameOver) {
    updateWave(dt);
    updateEnemies(dt);
    updateTurrets(dt);
    updateBullets(dt);

    if (state.coreHp <= 0) {
      state.coreHp = 0;
      state.gameOver = true;
      state.waveActive = false;
      state.message = "Core destroyed. Press R to retry.";
    }
  }

  updateHud();
  draw();
  requestAnimationFrame(tick);
}

function setupInput() {
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "enter"].includes(key)) e.preventDefault();

    if (key === " ") buildOrSell();
    if (key === "e") overclockSelected();
    if (key === "q") ventSelected();
    if (key === "enter") startWave();
    if (key === "r") resetGame();

    keys.add(key);
  });

  window.addEventListener("keyup", (e) => {
    keys.delete(e.key.toLowerCase());
  });

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const cellPos = cellFromWorld(x, y);
    state.selected = cellPos;
  });

  document.getElementById("startWave").addEventListener("click", startWave);
  document.getElementById("buildSell").addEventListener("click", buildOrSell);
  document.getElementById("overclock").addEventListener("click", overclockSelected);
  document.getElementById("vent").addEventListener("click", ventSelected);
  document.getElementById("restart").addEventListener("click", resetGame);

  const moveButtons = [
    ["left", -1, 0],
    ["right", 1, 0],
    ["up", 0, -1],
    ["down", 0, 1]
  ];

  moveButtons.forEach(([id, dx, dy]) => {
    const btn = document.getElementById(id);
    const apply = () => {
      state.selected.c = Math.max(0, Math.min(gridCols - 1, state.selected.c + dx));
      state.selected.r = Math.max(0, Math.min(gridRows - 1, state.selected.r + dy));
    };

    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      apply();
      btn._timer = setInterval(apply, 120);
    });
    btn.addEventListener("pointerup", () => clearInterval(btn._timer));
    btn.addEventListener("pointerleave", () => clearInterval(btn._timer));
    btn.addEventListener("pointercancel", () => clearInterval(btn._timer));
  });
}

setupInput();
updateHud();
requestAnimationFrame(tick);
