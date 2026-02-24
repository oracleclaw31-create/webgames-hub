const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const startBtn = document.getElementById('startBtn');

const tagHud = document.getElementById('tagHud');
const grappleHud = document.getElementById('grappleHud');
const timeHud = document.getElementById('timeHud');

const W = canvas.width;
const H = canvas.height;
const gravity = 0.58;

const level = {
  spawn: { x: 84, y: 462 },
  exit: { x: 878, y: 64, w: 36, h: 56 },
  floors: [
    { x: 0, y: 508, w: 960, h: 32 },
    { x: 0, y: 0, w: 16, h: 540 },
    { x: 944, y: 0, w: 16, h: 540 },
    { x: 72, y: 445, w: 196, h: 20 },
    { x: 302, y: 390, w: 184, h: 20 },
    { x: 536, y: 328, w: 172, h: 20 },
    { x: 210, y: 274, w: 152, h: 20 },
    { x: 422, y: 218, w: 148, h: 20 },
    { x: 650, y: 162, w: 184, h: 20 }
  ],
  anchors: [
    { x: 288, y: 314 },
    { x: 472, y: 172 },
    { x: 712, y: 118 }
  ],
  beacons: [
    { x: 226, y: 242, tagged: false },
    { x: 546, y: 296, tagged: false },
    { x: 792, y: 128, tagged: false }
  ],
  hazards: [
    { x: 382, y: 492, w: 76, h: 16 },
    { x: 600, y: 492, w: 80, h: 16 }
  ]
};

const player = {
  x: level.spawn.x,
  y: level.spawn.y,
  w: 24,
  h: 30,
  vx: 0,
  vy: 0,
  accel: 0.56,
  maxSpeed: 5.4,
  jumpPower: -10.8,
  onGround: false,
  coyote: 0,
  grappleCd: 0,
  grappleLine: null
};

const input = {
  left: false,
  right: false,
  jumpHeld: false,
  jumpTap: false,
  grappleTap: false
};

const state = {
  running: false,
  won: false,
  startTime: 0,
  elapsed: 0,
  tags: 0
};

function intersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function showOverlay(title, text, btnText) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startBtn.textContent = btnText;
  overlay.classList.remove('hidden');
}

function resetRun() {
  player.x = level.spawn.x;
  player.y = level.spawn.y;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.coyote = 0;
  player.grappleCd = 0;
  player.grappleLine = null;

  state.won = false;
  state.elapsed = 0;
  state.tags = 0;
  level.beacons.forEach((b) => {
    b.tagged = false;
  });

  refreshHud();
}

function startRun() {
  resetRun();
  state.running = true;
  state.startTime = performance.now();
  overlay.classList.add('hidden');
}

startBtn.addEventListener('click', () => {
  startRun();
});

function pressJump() {
  if (!input.jumpHeld) input.jumpTap = true;
  input.jumpHeld = true;
}

function releaseJump() {
  input.jumpHeld = false;
}

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'a' || k === 'arrowleft') input.left = true;
  if (k === 'd' || k === 'arrowright') input.right = true;
  if (k === 'w' || k === 'arrowup' || k === ' ') {
    pressJump();
    e.preventDefault();
  }
  if (k === 'e' || k === 'shift') input.grappleTap = true;
  if (k === 'r') showOverlay('Run Reset', 'Press start for a fresh route.', 'Start Run');
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'a' || k === 'arrowleft') input.left = false;
  if (k === 'd' || k === 'arrowright') input.right = false;
  if (k === 'w' || k === 'arrowup' || k === ' ') releaseJump();
});

function bindTouch(selector, down, up) {
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

bindTouch('[data-btn="left"]', () => { input.left = true; }, () => { input.left = false; });
bindTouch('[data-btn="right"]', () => { input.right = true; }, () => { input.right = false; });
bindTouch('[data-btn="jump"]', pressJump, releaseJump);
bindTouch('[data-btn="grapple"]', () => { input.grappleTap = true; }, () => {});

function playerCenter() {
  return { x: player.x + player.w * 0.5, y: player.y + player.h * 0.5 };
}

function nearestAnchor() {
  const p = playerCenter();
  let best = null;
  let bestDistSq = 999999;
  for (const a of level.anchors) {
    const dx = a.x - p.x;
    const dy = a.y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      best = a;
    }
  }
  return { anchor: best, distSq: bestDistSq };
}

function tryGrapple() {
  if (player.grappleCd > 0) return;
  const info = nearestAnchor();
  if (!info.anchor || info.distSq > 220 * 220) return;

  const p = playerCenter();
  const dx = info.anchor.x - p.x;
  const dy = info.anchor.y - p.y;
  const len = Math.max(1, Math.hypot(dx, dy));

  player.vx += (dx / len) * 7.8;
  player.vy += (dy / len) * 7.8 - 2.2;
  player.grappleCd = 65;
  player.grappleLine = {
    x1: p.x,
    y1: p.y,
    x2: info.anchor.x,
    y2: info.anchor.y,
    life: 10
  };
}

function update() {
  if (!state.running) return;

  state.elapsed = (performance.now() - state.startTime) / 1000;

  if (input.left) player.vx -= player.accel;
  if (input.right) player.vx += player.accel;
  player.vx *= player.onGround ? 0.82 : 0.91;
  if (player.vx > player.maxSpeed) player.vx = player.maxSpeed;
  if (player.vx < -player.maxSpeed) player.vx = -player.maxSpeed;

  if (player.coyote > 0) player.coyote -= 1;
  if (player.grappleCd > 0) player.grappleCd -= 1;

  if (input.jumpTap) {
    if (player.onGround || player.coyote > 0) {
      player.vy = player.jumpPower;
      player.onGround = false;
      player.coyote = 0;
    }
    input.jumpTap = false;
  }

  if (input.grappleTap) {
    tryGrapple();
    input.grappleTap = false;
  }

  player.vy += gravity;
  if (player.vy > 13) player.vy = 13;

  player.x += player.vx;
  for (const f of level.floors) {
    if (intersect(player, f)) {
      if (player.vx > 0) player.x = f.x - player.w;
      if (player.vx < 0) player.x = f.x + f.w;
      player.vx = 0;
    }
  }

  player.y += player.vy;
  player.onGround = false;
  for (const f of level.floors) {
    if (intersect(player, f)) {
      if (player.vy > 0) {
        player.y = f.y - player.h;
        player.vy = 0;
        player.onGround = true;
        player.coyote = 6;
      } else if (player.vy < 0) {
        player.y = f.y + f.h;
        player.vy = 0;
      }
    }
  }

  for (const h of level.hazards) {
    if (intersect(player, h)) {
      state.running = false;
      showOverlay('Run Failed', 'You touched plasma rails. Reset and route higher.', 'Retry');
      return;
    }
  }

  for (const b of level.beacons) {
    if (b.tagged) continue;
    const px = player.x + player.w * 0.5;
    const py = player.y + player.h * 0.5;
    const dx = px - b.x;
    const dy = py - b.y;
    if (dx * dx + dy * dy < 20 * 20) {
      b.tagged = true;
      state.tags += 1;
    }
  }

  if (state.tags === level.beacons.length && intersect(player, level.exit)) {
    state.running = false;
    state.won = true;
    showOverlay('Route Complete', `Clear in ${state.elapsed.toFixed(1)}s. Grapple timing was clean.`, 'Run Again');
  }

  if (player.y > H + 48) {
    state.running = false;
    showOverlay('Run Failed', 'You dropped below the shaft. Retry and preserve momentum.', 'Retry');
  }

  if (player.grappleLine) {
    player.grappleLine.life -= 1;
    if (player.grappleLine.life <= 0) player.grappleLine = null;
  }

  refreshHud();
}

function refreshHud() {
  tagHud.textContent = `Tags ${state.tags}/${level.beacons.length}`;
  grappleHud.textContent = player.grappleCd > 0 ? `Grapple ${Math.ceil(player.grappleCd / 10) / 10}s` : 'Grapple Ready';
  timeHud.textContent = `Time ${state.elapsed.toFixed(1)}s`;
}

function drawPlatform(r, color) {
  ctx.fillStyle = color;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
}

function render() {
  ctx.clearRect(0, 0, W, H);

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0d2340');
  sky.addColorStop(1, '#05101d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(149, 213, 255, 0.08)';
  for (let i = 0; i < 80; i += 1) {
    ctx.fillRect((i * 117) % W, (i * 73) % H, 2, 2);
  }

  for (const f of level.floors) drawPlatform(f, '#315888');

  for (const a of level.anchors) {
    ctx.beginPath();
    ctx.fillStyle = '#78dfff';
    ctx.arc(a.x, a.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d7f9ff';
    ctx.stroke();
  }

  for (const b of level.beacons) {
    ctx.beginPath();
    ctx.fillStyle = b.tagged ? '#7effb3' : '#ffd36f';
    ctx.arc(b.x, b.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = b.tagged ? '#e5fff0' : '#fff2bf';
    ctx.stroke();
  }

  for (const h of level.hazards) {
    ctx.fillStyle = '#f97183';
    ctx.fillRect(h.x, h.y, h.w, h.h);
  }

  ctx.fillStyle = state.tags === level.beacons.length ? '#97f4b8' : '#6d8ec2';
  ctx.fillRect(level.exit.x, level.exit.y, level.exit.w, level.exit.h);
  ctx.strokeStyle = '#e6fff0';
  ctx.strokeRect(level.exit.x + 0.5, level.exit.y + 0.5, level.exit.w - 1, level.exit.h - 1);

  if (player.grappleLine) {
    ctx.strokeStyle = '#9feaff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.grappleLine.x1, player.grappleLine.y1);
    ctx.lineTo(player.grappleLine.x2, player.grappleLine.y2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  ctx.fillStyle = '#f3f7ff';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = '#224166';
  ctx.fillRect(player.x + 5, player.y + 8, 14, 8);
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

resetRun();
showOverlay('Anchor Ascent', 'Tag every beacon, then enter the gate. Use Grapple to bridge long jumps.', 'Start Run');
loop();
