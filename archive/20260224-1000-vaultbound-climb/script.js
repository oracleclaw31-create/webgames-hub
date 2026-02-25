const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ui = {
  level: document.getElementById("level"),
  shards: document.getElementById("shards"),
  time: document.getElementById("time"),
  status: document.getElementById("status")
};

const keys = new Set();
const touch = { left: false, right: false, jump: false, down: false };

const world = {
  gravity: 1900,
  friction: 0.86,
  platforms: [],
  shards: [],
  guards: [],
  gate: null,
  level: 1,
  timeLeft: 60,
  done: false,
  won: false
};

const player = {
  x: 80,
  y: 420,
  w: 34,
  h: 42,
  vx: 0,
  vy: 0,
  speed: 360,
  jump: 760,
  onGround: false,
  shardCount: 0,
  hitFlash: 0
};

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function makeLevel(level) {
  const basePlatforms = [
    { x: 0, y: 500, w: 960, h: 40, solid: true },
    { x: 90, y: 420, w: 190, h: 18, solid: true },
    { x: 340, y: 360, w: 180, h: 18, solid: true },
    { x: 560, y: 300, w: 150, h: 18, solid: true },
    { x: 770, y: 230, w: 140, h: 18, solid: true },
    { x: 520, y: 170, w: 150, h: 18, solid: true },
    { x: 210, y: 210, w: 120, h: 16, solid: false },
    { x: 120, y: 290, w: 120, h: 16, solid: false }
  ];

  world.platforms = basePlatforms.map((p) => ({ ...p }));
  world.shards = [
    { x: 170, y: 258, w: 18, h: 18, taken: false },
    { x: 820, y: 198, w: 18, h: 18, taken: false },
    { x: 570, y: 138, w: 18, h: 18, taken: false }
  ];

  world.guards = [
    { x: 420, y: 330, w: 28, h: 30, minX: 340, maxX: 490, speed: 95 + level * 12, dir: 1 },
    { x: 590, y: 270, w: 28, h: 30, minX: 560, maxX: 680, speed: 110 + level * 14, dir: -1 }
  ];

  if (level > 1) {
    world.guards.push({ x: 820, y: 470, w: 28, h: 30, minX: 640, maxX: 910, speed: 130 + level * 10, dir: -1 });
    world.timeLeft = 56;
  } else {
    world.timeLeft = 60;
  }

  player.x = 80;
  player.y = 450;
  player.vx = 0;
  player.vy = 0;
  player.shardCount = 0;
  world.gate = { x: 880, y: 452, w: 56, h: 48, open: false };
  world.done = false;
  world.won = false;
  setStatus("Collect all shards to unlock the vault gate.");
}

function setStatus(text) {
  ui.status.textContent = text;
}

function updateUI() {
  ui.level.textContent = String(world.level);
  ui.shards.textContent = `${player.shardCount}/${world.shards.length}`;
  ui.time.textContent = world.timeLeft.toFixed(1);
}

function applyInput(dt) {
  const left = keys.has("ArrowLeft") || keys.has("KeyA") || touch.left;
  const right = keys.has("ArrowRight") || keys.has("KeyD") || touch.right;
  const jump = keys.has("ArrowUp") || keys.has("KeyW") || keys.has("Space") || touch.jump;
  const down = keys.has("ArrowDown") || keys.has("KeyS") || touch.down;

  if (left) player.vx -= player.speed * dt;
  if (right) player.vx += player.speed * dt;
  if (!left && !right) player.vx *= world.friction;

  if (jump && player.onGround) {
    player.vy = -player.jump;
    player.onGround = false;
  }

  if (down && player.onGround) {
    const current = world.platforms.find((p) => !p.solid && rectsOverlap(player, { x: p.x, y: p.y - 3, w: p.w, h: 6 }));
    if (current) {
      player.y += 8;
      player.onGround = false;
    }
  }
}

function collidePlatforms(prevY) {
  player.onGround = false;
  for (const p of world.platforms) {
    if (!rectsOverlap(player, p)) continue;

    const landed = prevY + player.h <= p.y + 8 && player.vy >= 0;
    if (landed) {
      if (!p.solid && (keys.has("ArrowDown") || keys.has("KeyS") || touch.down)) {
        continue;
      }
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
      continue;
    }

    if (player.x + player.w / 2 < p.x + p.w / 2) {
      player.x = p.x - player.w;
    } else {
      player.x = p.x + p.w;
    }
    player.vx *= 0.4;
  }
}

function updateGuards(dt) {
  for (const g of world.guards) {
    g.x += g.speed * g.dir * dt;
    if (g.x < g.minX) {
      g.x = g.minX;
      g.dir = 1;
    }
    if (g.x + g.w > g.maxX) {
      g.x = g.maxX - g.w;
      g.dir = -1;
    }

    if (!world.done && rectsOverlap(player, g)) {
      player.hitFlash = 0.25;
      world.timeLeft -= 7;
      player.x = 80;
      player.y = 450;
      player.vx = 0;
      player.vy = 0;
      setStatus("Guard caught you. Time penalty applied.");
    }
  }
}

function updateShards() {
  for (const shard of world.shards) {
    if (!shard.taken && rectsOverlap(player, shard)) {
      shard.taken = true;
      player.shardCount += 1;
      setStatus(`Shard secured (${player.shardCount}/${world.shards.length}).`);
    }
  }

  if (player.shardCount === world.shards.length) {
    world.gate.open = true;
  }
}

function updateGate() {
  if (!world.gate.open) return;
  if (rectsOverlap(player, world.gate)) {
    if (world.level === 1) {
      world.level = 2;
      makeLevel(2);
      setStatus("Vault deeper now. Climb again with tighter time.");
    } else {
      world.done = true;
      world.won = true;
      setStatus("Vault recovered. Run complete.");
    }
  }
}

function update(dt) {
  if (world.done) return;

  world.timeLeft -= dt;
  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    world.done = true;
    world.won = false;
    setStatus("Lockdown triggered. Press R to retry.");
  }

  const prevY = player.y;
  applyInput(dt);
  player.vy += world.gravity * dt;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;
  if (player.y > canvas.height + 80) {
    player.x = 80;
    player.y = 450;
    player.vx = 0;
    player.vy = 0;
    world.timeLeft -= 4;
    setStatus("You fell. Time penalty applied.");
  }

  collidePlatforms(prevY);
  updateGuards(dt);
  updateShards();
  updateGate();

  player.hitFlash = Math.max(0, player.hitFlash - dt);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#1a335a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < canvas.width; i += 120) {
    ctx.fillStyle = "rgba(120,180,255,0.09)";
    ctx.fillRect(i + 30, 0, 24, canvas.height);
  }

  for (const p of world.platforms) {
    ctx.fillStyle = p.solid ? "#4f709f" : "#3b5475";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    if (!p.solid) {
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(p.x, p.y, p.w, 2);
    }
  }

  for (const shard of world.shards) {
    if (shard.taken) continue;
    ctx.fillStyle = "#5dff8e";
    ctx.beginPath();
    ctx.moveTo(shard.x + 9, shard.y);
    ctx.lineTo(shard.x + 18, shard.y + 9);
    ctx.lineTo(shard.x + 9, shard.y + 18);
    ctx.lineTo(shard.x, shard.y + 9);
    ctx.closePath();
    ctx.fill();
  }

  for (const g of world.guards) {
    ctx.fillStyle = "#ff6e74";
    ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.fillStyle = "#ffd3d6";
    ctx.fillRect(g.x + 5, g.y + 6, 18, 6);
  }

  ctx.fillStyle = world.gate.open ? "#5fd4ff" : "#775d25";
  ctx.fillRect(world.gate.x, world.gate.y, world.gate.w, world.gate.h);
  ctx.fillStyle = "#e7f4ff";
  ctx.font = "14px sans-serif";
  ctx.fillText(world.gate.open ? "OPEN" : "LOCK", world.gate.x + 8, world.gate.y + 28);

  ctx.fillStyle = player.hitFlash > 0 ? "#fff4f4" : "#ffe082";
  ctx.fillRect(player.x, player.y, player.w, player.h);

  if (world.done) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText(world.won ? "Vault Cleared" : "Lockdown", 340, 240);
    ctx.font = "20px sans-serif";
    ctx.fillText("Press R to restart", 380, 285);
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  update(dt);
  updateUI();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  keys.add(e.code);
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code)) {
    e.preventDefault();
  }
  if (e.code === "KeyR") {
    makeLevel(1);
  }
});

window.addEventListener("keyup", (e) => {
  keys.delete(e.code);
});

for (const btn of document.querySelectorAll("[data-touch]")) {
  const key = btn.getAttribute("data-touch");
  const start = (e) => {
    e.preventDefault();
    touch[key] = true;
    btn.classList.add("active");
  };
  const end = (e) => {
    e.preventDefault();
    touch[key] = false;
    btn.classList.remove("active");
  };
  btn.addEventListener("touchstart", start, { passive: false });
  btn.addEventListener("touchend", end, { passive: false });
  btn.addEventListener("touchcancel", end, { passive: false });
  btn.addEventListener("mousedown", start);
  btn.addEventListener("mouseup", end);
  btn.addEventListener("mouseleave", end);
}

makeLevel(1);
requestAnimationFrame(loop);
