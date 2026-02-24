const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const startBtn = document.getElementById('startBtn');
const relicsEl = document.getElementById('relics');
const phaseEl = document.getElementById('phase');
const timeEl = document.getElementById('time');

const W = canvas.width;
const H = canvas.height;
const gravity = 0.62;

const level = {
  start: { x: 88, y: 430 },
  exit: { x: 865, y: 84, w: 42, h: 52 },
  solids: [
    { x: 0, y: 500, w: 960, h: 40 },
    { x: 0, y: 0, w: 16, h: 540 },
    { x: 944, y: 0, w: 16, h: 540 },
    { x: 80, y: 430, w: 210, h: 22 },
    { x: 328, y: 360, w: 190, h: 20 },
    { x: 560, y: 298, w: 220, h: 20 },
    { x: 142, y: 278, w: 120, h: 20 },
    { x: 420, y: 200, w: 130, h: 18 },
    { x: 710, y: 140, w: 200, h: 20 }
  ],
  phaseA: [
    { x: 252, y: 438, w: 84, h: 16 },
    { x: 522, y: 246, w: 78, h: 16 },
    { x: 656, y: 186, w: 96, h: 16 }
  ],
  phaseB: [
    { x: 230, y: 328, w: 84, h: 16 },
    { x: 592, y: 264, w: 88, h: 16 },
    { x: 805, y: 206, w: 86, h: 16 }
  ],
  relics: [
    { x: 230, y: 250, r: 11, got: false },
    { x: 628, y: 218, r: 11, got: false },
    { x: 842, y: 106, r: 11, got: false }
  ],
  hazards: [
    { x: 376, y: 486, w: 86, h: 14 },
    { x: 596, y: 486, w: 82, h: 14 }
  ]
};

const player = {
  x: level.start.x,
  y: level.start.y,
  w: 24,
  h: 30,
  vx: 0,
  vy: 0,
  speed: 0.58,
  maxSpeed: 5.2,
  jump: -11.3,
  onGround: false,
  wallCoyote: 0
};

const input = {
  left: false,
  right: false,
  jump: false,
  jumpPressed: false,
  phasePressed: false
};

const state = {
  running: false,
  phase: 0,
  relicCount: 0,
  startTime: 0,
  elapsed: 0,
  won: false
};

function resetRun() {
  player.x = level.start.x;
  player.y = level.start.y;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.wallCoyote = 0;

  state.phase = 0;
  state.relicCount = 0;
  state.elapsed = 0;
  state.won = false;
  level.relics.forEach((r) => {
    r.got = false;
  });

  refreshHud();
}

function startRun() {
  resetRun();
  state.running = true;
  state.startTime = performance.now();
  overlay.classList.add('hidden');
}

function showOverlay(title, msg, buttonText = 'Retry') {
  overlayTitle.textContent = title;
  overlayText.textContent = msg;
  startBtn.textContent = buttonText;
  overlay.classList.remove('hidden');
}

startBtn.addEventListener('click', () => {
  startRun();
});

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'a' || k === 'arrowleft') input.left = true;
  if (k === 'd' || k === 'arrowright') input.right = true;
  if (k === 'w' || k === 'arrowup' || k === ' ') {
    if (!input.jump) input.jumpPressed = true;
    input.jump = true;
    e.preventDefault();
  }
  if (k === 'e') input.phasePressed = true;
  if (k === 'r') showOverlay('Restart', 'Run reset. Press start to jump in again.', 'Start Run');
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'a' || k === 'arrowleft') input.left = false;
  if (k === 'd' || k === 'arrowright') input.right = false;
  if (k === 'w' || k === 'arrowup' || k === ' ') input.jump = false;
});

function bindTouchButton(selector, down, up) {
  const btn = document.querySelector(selector);
  if (!btn) return;
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    down();
  }, { passive: false });
  btn.addEventListener('touchend', (e) => {
    e.preventDefault();
    up();
  }, { passive: false });
  btn.addEventListener('mousedown', down);
  btn.addEventListener('mouseup', up);
  btn.addEventListener('mouseleave', up);
}

bindTouchButton('[data-key="left"]', () => { input.left = true; }, () => { input.left = false; });
bindTouchButton('[data-key="right"]', () => { input.right = true; }, () => { input.right = false; });
bindTouchButton('[data-key="jump"]', () => {
  if (!input.jump) input.jumpPressed = true;
  input.jump = true;
}, () => { input.jump = false; });
bindTouchButton('[data-key="phase"]', () => { input.phasePressed = true; }, () => {});

function rectsForPhase() {
  return state.phase === 0
    ? level.solids.concat(level.phaseA)
    : level.solids.concat(level.phaseB);
}

function intersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  if (!state.running) return;

  state.elapsed = (performance.now() - state.startTime) / 1000;

  if (input.phasePressed) {
    state.phase = state.phase === 0 ? 1 : 0;
    input.phasePressed = false;
  }

  if (input.left) player.vx -= player.speed;
  if (input.right) player.vx += player.speed;
  player.vx *= player.onGround ? 0.82 : 0.92;
  player.vx = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.vx));

  if (player.wallCoyote > 0) player.wallCoyote -= 1;

  if (input.jumpPressed) {
    if (player.onGround) {
      player.vy = player.jump;
      player.onGround = false;
    } else if (player.wallCoyote > 0) {
      player.vy = player.jump * 0.92;
      player.vx *= -1.1;
      player.wallCoyote = 0;
    }
    input.jumpPressed = false;
  }

  player.vy += gravity;
  player.vy = Math.min(14, player.vy);

  player.x += player.vx;
  let colliders = rectsForPhase();
  for (const r of colliders) {
    if (intersect(player, r)) {
      if (player.vx > 0) {
        player.x = r.x - player.w;
        player.wallCoyote = 8;
      } else if (player.vx < 0) {
        player.x = r.x + r.w;
        player.wallCoyote = 8;
      }
      player.vx = 0;
    }
  }

  player.y += player.vy;
  player.onGround = false;
  colliders = rectsForPhase();
  for (const r of colliders) {
    if (intersect(player, r)) {
      if (player.vy > 0) {
        player.y = r.y - player.h;
        player.onGround = true;
      } else if (player.vy < 0) {
        player.y = r.y + r.h;
      }
      player.vy = 0;
    }
  }

  for (const h of level.hazards) {
    if (intersect(player, h)) {
      state.running = false;
      showOverlay('Run Failed', 'You touched phase static. Retry and chain cleaner jumps.', 'Retry');
      return;
    }
  }

  for (const relic of level.relics) {
    if (!relic.got) {
      const dx = player.x + player.w / 2 - relic.x;
      const dy = player.y + player.h / 2 - relic.y;
      if (dx * dx + dy * dy < (relic.r + 12) * (relic.r + 12)) {
        relic.got = true;
        state.relicCount += 1;
      }
    }
  }

  if (state.relicCount === level.relics.length && intersect(player, level.exit)) {
    state.running = false;
    state.won = true;
    showOverlay('Vault Cleared', `Clear time ${state.elapsed.toFixed(1)}s. Tight route, nice wall-kicks.`, 'Run Again');
  }

  if (player.y > H + 50) {
    state.running = false;
    showOverlay('Run Failed', 'You fell into the lower shaft. Try a safer phase switch.', 'Retry');
  }

  refreshHud();
}

function refreshHud() {
  relicsEl.textContent = `Relics: ${state.relicCount}/${level.relics.length}`;
  phaseEl.textContent = `Phase: ${state.phase === 0 ? 'Solid' : 'Shifted'}`;
  timeEl.textContent = `Time: ${state.elapsed.toFixed(1)}s`;
}

function drawPlatform(r, color) {
  ctx.fillStyle = color;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
}

function render() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 60; i += 1) {
    ctx.fillRect((i * 151) % W, (i * 97) % H, 2, 2);
  }

  for (const r of level.solids) drawPlatform(r, '#3b4e9a');

  const visible = state.phase === 0 ? level.phaseA : level.phaseB;
  const hidden = state.phase === 0 ? level.phaseB : level.phaseA;
  for (const r of hidden) drawPlatform(r, 'rgba(76,95,160,0.2)');
  for (const r of visible) drawPlatform(r, '#73e5ff');

  for (const h of level.hazards) {
    ctx.fillStyle = '#ff7f7f';
    ctx.fillRect(h.x, h.y, h.w, h.h);
  }

  for (const relic of level.relics) {
    if (relic.got) continue;
    ctx.beginPath();
    ctx.fillStyle = '#ffdd7a';
    ctx.arc(relic.x, relic.y, relic.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff5c3';
    ctx.stroke();
  }

  ctx.fillStyle = state.relicCount === level.relics.length ? '#9ef6bc' : '#6d7db8';
  ctx.fillRect(level.exit.x, level.exit.y, level.exit.w, level.exit.h);
  ctx.strokeStyle = '#d4fbe2';
  ctx.strokeRect(level.exit.x + 0.5, level.exit.y + 0.5, level.exit.w - 1, level.exit.h - 1);
  ctx.fillStyle = '#0b132e';
  ctx.fillRect(level.exit.x + 10, level.exit.y + 10, 22, 32);

  ctx.fillStyle = '#f2f7ff';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = '#2d3f83';
  ctx.fillRect(player.x + 6, player.y + 7, 12, 9);
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

resetRun();
showOverlay('Phase Vault', 'Collect all relics and then enter the exit gate. Toggle phase to reveal different platforms.', 'Start Run');
loop();
