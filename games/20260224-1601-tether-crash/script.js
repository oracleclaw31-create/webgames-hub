const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const ui = {
  time: document.getElementById('time'),
  hp: document.getElementById('hp'),
  cores: document.getElementById('cores'),
  speed: document.getElementById('speed')
};

const BTN = {
  grapple: document.getElementById('grappleBtn'),
  brake: document.getElementById('brakeBtn')
};

const world = {
  w: canvas.width,
  h: canvas.height,
  timeLeft: 75,
  destroyed: 0,
  target: 6,
  over: false,
  win: false,
  lastTs: 0
};

const player = {
  x: world.w * 0.5,
  y: world.h * 0.5,
  vx: 0,
  vy: 0,
  r: 12,
  hp: 100
};

const controls = {
  keys: Object.create(null),
  touchMove: { x: 0, y: 0 },
  grappling: false,
  braking: false,
  touchStart: null,
  touchId: null
};

const anchors = Array.from({ length: 9 }, (_, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  return {
    x: 160 + col * 320,
    y: 90 + row * 180,
    pulse: Math.random() * Math.PI * 2
  };
});

const cores = [];
for (let i = 0; i < world.target; i += 1) {
  spawnCore(i);
}

const tether = {
  active: false,
  anchorX: 0,
  anchorY: 0,
  length: 0,
  targetCore: null
};

function spawnCore(seed) {
  const edge = seed % 4;
  let x = 0;
  let y = 0;
  if (edge === 0) {
    x = 30 + Math.random() * (world.w - 60);
    y = 20;
  } else if (edge === 1) {
    x = world.w - 20;
    y = 30 + Math.random() * (world.h - 60);
  } else if (edge === 2) {
    x = 30 + Math.random() * (world.w - 60);
    y = world.h - 20;
  } else {
    x = 20;
    y = 30 + Math.random() * (world.h - 60);
  }

  const vx = (Math.random() * 2 - 1) * 35;
  const vy = (Math.random() * 2 - 1) * 35;
  cores.push({
    x,
    y,
    vx,
    vy,
    r: 20 + Math.random() * 8,
    hp: 100,
    wobble: Math.random() * Math.PI * 2
  });
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function getMoveInput() {
  let x = 0;
  let y = 0;

  if (controls.keys.ArrowLeft || controls.keys.a || controls.keys.A) x -= 1;
  if (controls.keys.ArrowRight || controls.keys.d || controls.keys.D) x += 1;
  if (controls.keys.ArrowUp || controls.keys.w || controls.keys.W) y -= 1;
  if (controls.keys.ArrowDown || controls.keys.s || controls.keys.S) y += 1;

  x += controls.touchMove.x;
  y += controls.touchMove.y;

  const mag = Math.hypot(x, y);
  if (mag > 1) {
    x /= mag;
    y /= mag;
  }

  return { x, y };
}

function nearestAnchorOrCore() {
  let best = null;
  let bestDist = 260;

  for (const a of anchors) {
    const d = Math.hypot(a.x - player.x, a.y - player.y);
    if (d < bestDist) {
      bestDist = d;
      best = { x: a.x, y: a.y, core: null };
    }
  }

  for (const c of cores) {
    const d = Math.hypot(c.x - player.x, c.y - player.y);
    if (d < bestDist) {
      bestDist = d;
      best = { x: c.x, y: c.y, core: c };
    }
  }

  return best;
}

function engageTether() {
  if (tether.active || world.over) return;
  const lock = nearestAnchorOrCore();
  if (!lock) return;

  tether.active = true;
  tether.anchorX = lock.x;
  tether.anchorY = lock.y;
  tether.length = Math.max(50, Math.hypot(lock.x - player.x, lock.y - player.y) * 0.8);
  tether.targetCore = lock.core;
}

function releaseTether() {
  tether.active = false;
  tether.targetCore = null;
}

function inputDown(key) {
  controls.keys[key] = true;
  if (key === ' ' || key === 'Spacebar') {
    controls.grappling = true;
    engageTether();
  }
  if (key === 'Shift' || key === 'ShiftLeft' || key === 'ShiftRight') {
    controls.braking = true;
  }
  if ((key === 'r' || key === 'R') && world.over) {
    window.location.reload();
  }
}

function inputUp(key) {
  controls.keys[key] = false;
  if (key === ' ' || key === 'Spacebar') {
    controls.grappling = false;
    releaseTether();
  }
  if (key === 'Shift' || key === 'ShiftLeft' || key === 'ShiftRight') {
    controls.braking = false;
  }
}

addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
    e.preventDefault();
  }
  inputDown(e.key);
});

addEventListener('keyup', (e) => {
  inputUp(e.key);
});

function setButtonActive(el, active) {
  if (active) el.classList.add('active');
  else el.classList.remove('active');
}

BTN.grapple.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  controls.grappling = true;
  setButtonActive(BTN.grapple, true);
  engageTether();
});
BTN.grapple.addEventListener('pointerup', () => {
  controls.grappling = false;
  setButtonActive(BTN.grapple, false);
  releaseTether();
});
BTN.grapple.addEventListener('pointercancel', () => {
  controls.grappling = false;
  setButtonActive(BTN.grapple, false);
  releaseTether();
});
BTN.grapple.addEventListener('pointerleave', () => {
  if (!controls.grappling) return;
  controls.grappling = false;
  setButtonActive(BTN.grapple, false);
  releaseTether();
});

BTN.brake.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  controls.braking = true;
  setButtonActive(BTN.brake, true);
});
BTN.brake.addEventListener('pointerup', () => {
  controls.braking = false;
  setButtonActive(BTN.brake, false);
});
BTN.brake.addEventListener('pointercancel', () => {
  controls.braking = false;
  setButtonActive(BTN.brake, false);
});
BTN.brake.addEventListener('pointerleave', () => {
  controls.braking = false;
  setButtonActive(BTN.brake, false);
});

canvas.addEventListener('touchstart', (e) => {
  if (controls.touchId !== null) return;
  const t = e.changedTouches[0];
  controls.touchId = t.identifier;
  controls.touchStart = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener('touchmove', (e) => {
  if (controls.touchId === null || !controls.touchStart) return;
  for (const t of e.changedTouches) {
    if (t.identifier !== controls.touchId) continue;
    const dx = (t.clientX - controls.touchStart.x) / 42;
    const dy = (t.clientY - controls.touchStart.y) / 42;
    controls.touchMove.x = clamp(dx, -1, 1);
    controls.touchMove.y = clamp(dy, -1, 1);
    break;
  }
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  if (controls.touchId === null) return;
  for (const t of e.changedTouches) {
    if (t.identifier !== controls.touchId) continue;
    controls.touchId = null;
    controls.touchStart = null;
    controls.touchMove.x = 0;
    controls.touchMove.y = 0;
    break;
  }
});

canvas.addEventListener('touchcancel', () => {
  controls.touchId = null;
  controls.touchStart = null;
  controls.touchMove.x = 0;
  controls.touchMove.y = 0;
});

function update(dt) {
  if (world.over) return;

  world.timeLeft -= dt;
  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    world.over = true;
  }

  const inVec = getMoveInput();
  const thrust = 480;
  player.vx += inVec.x * thrust * dt;
  player.vy += inVec.y * thrust * dt;

  player.vx *= controls.braking ? 0.9 : 0.992;
  player.vy *= controls.braking ? 0.9 : 0.992;

  if (tether.active) {
    if (tether.targetCore && cores.includes(tether.targetCore)) {
      tether.anchorX = tether.targetCore.x;
      tether.anchorY = tether.targetCore.y;
    }
    const dx = tether.anchorX - player.x;
    const dy = tether.anchorY - player.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    if (dist > tether.length) {
      const stretch = dist - tether.length;
      const springK = 9.5;
      player.vx += nx * stretch * springK * dt;
      player.vy += ny * stretch * springK * dt;
    }
  }

  const maxSpeed = controls.braking ? 240 : 360;
  const speed = Math.hypot(player.vx, player.vy);
  if (speed > maxSpeed) {
    player.vx = (player.vx / speed) * maxSpeed;
    player.vy = (player.vy / speed) * maxSpeed;
  }

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  if (player.x < player.r || player.x > world.w - player.r) {
    player.x = clamp(player.x, player.r, world.w - player.r);
    player.vx *= -0.45;
    player.hp -= 2;
  }
  if (player.y < player.r || player.y > world.h - player.r) {
    player.y = clamp(player.y, player.r, world.h - player.r);
    player.vy *= -0.45;
    player.hp -= 2;
  }

  for (let i = cores.length - 1; i >= 0; i -= 1) {
    const c = cores[i];
    c.wobble += dt * 2.4;

    const pullX = (world.w * 0.5 - c.x) * 0.02;
    const pullY = (world.h * 0.5 - c.y) * 0.02;
    c.vx += pullX * dt;
    c.vy += pullY * dt;

    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.vx *= 0.995;
    c.vy *= 0.995;

    if (c.x < c.r || c.x > world.w - c.r) {
      c.x = clamp(c.x, c.r, world.w - c.r);
      c.vx *= -0.88;
    }
    if (c.y < c.r || c.y > world.h - c.r) {
      c.y = clamp(c.y, c.r, world.h - c.r);
      c.vy *= -0.88;
    }

    const dx = player.x - c.x;
    const dy = player.y - c.y;
    const d = Math.hypot(dx, dy) || 1;
    const minD = player.r + c.r;

    if (d < minD) {
      const nx = dx / d;
      const ny = dy / d;
      const overlap = minD - d;
      player.x += nx * overlap * 0.6;
      player.y += ny * overlap * 0.6;
      c.x -= nx * overlap * 0.4;
      c.y -= ny * overlap * 0.4;

      const relVx = player.vx - c.vx;
      const relVy = player.vy - c.vy;
      const impact = Math.hypot(relVx, relVy);

      if (impact > 170) {
        c.hp -= impact * 0.24;
        player.hp -= Math.max(4, 18 - impact * 0.03);
        player.vx *= 0.88;
        player.vy *= 0.88;
      } else {
        player.hp -= 10 * dt;
      }

      const bounce = 0.28;
      player.vx += nx * bounce * impact;
      player.vy += ny * bounce * impact;
      c.vx -= nx * bounce * impact;
      c.vy -= ny * bounce * impact;
    }

    if (c.hp <= 0) {
      cores.splice(i, 1);
      world.destroyed += 1;
      if (tether.targetCore === c) {
        releaseTether();
      }
    }
  }

  for (let i = 0; i < cores.length; i += 1) {
    for (let j = i + 1; j < cores.length; j += 1) {
      const a = cores[i];
      const b = cores[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const minD = a.r + b.r;
      if (d >= minD) continue;

      const nx = dx / d;
      const ny = dy / d;
      const overlap = minD - d;
      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;

      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const sep = rvx * nx + rvy * ny;
      if (sep < 0) {
        const impulse = -sep * 0.8;
        a.vx -= nx * impulse;
        a.vy -= ny * impulse;
        b.vx += nx * impulse;
        b.vy += ny * impulse;
      }
    }
  }

  player.hp = clamp(player.hp, 0, 100);
  if (player.hp <= 0) {
    world.over = true;
  }

  if (world.destroyed >= world.target) {
    world.win = true;
    world.over = true;
  }
}

function drawBg(ts) {
  const grad = ctx.createLinearGradient(0, 0, world.w, world.h);
  grad.addColorStop(0, '#0a1329');
  grad.addColorStop(1, '#03060f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, world.w, world.h);

  for (let i = 0; i < 80; i += 1) {
    const sx = (i * 97 + ts * 0.02) % world.w;
    const sy = (i * 47 + ts * 0.011) % world.h;
    ctx.fillStyle = 'rgba(110,150,255,0.14)';
    ctx.fillRect(sx, sy, 2, 2);
  }
}

function drawAnchors(ts) {
  for (const a of anchors) {
    const p = 4 + Math.sin(ts * 0.004 + a.pulse) * 2;
    ctx.beginPath();
    ctx.arc(a.x, a.y, 7 + p * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120,210,255,0.85)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(a.x, a.y, 18 + p, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(120,210,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawCores() {
  for (const c of cores) {
    const pulse = 1 + Math.sin(c.wobble) * 0.08;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r * pulse, 0, Math.PI * 2);
    ctx.fillStyle = '#ff5f7f';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r * 0.46, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd7e2';
    ctx.fill();

    const hpPct = clamp(c.hp / 100, 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(c.x - c.r, c.y - c.r - 10, c.r * 2, 4);
    ctx.fillStyle = '#9bf3ff';
    ctx.fillRect(c.x - c.r, c.y - c.r - 10, c.r * 2 * hpPct, 4);
  }
}

function drawTether() {
  if (!tether.active) return;

  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(tether.anchorX, tether.anchorY);
  ctx.strokeStyle = '#8af6ff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(tether.anchorX, tether.anchorY, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#e9fcff';
  ctx.fill();
}

function drawPlayer() {
  const speed = Math.hypot(player.vx, player.vy);
  const glow = 10 + speed * 0.03;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r + glow * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(100,250,255,0.28)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fillStyle = '#65e8ff';
  ctx.fill();
}

function drawEndOverlay() {
  if (!world.over) return;
  ctx.fillStyle = 'rgba(0,0,0,0.56)';
  ctx.fillRect(0, 0, world.w, world.h);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 38px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(world.win ? 'COREFIELD CLEARED' : 'TETHER FAILED', world.w * 0.5, world.h * 0.46);

  ctx.font = '600 22px system-ui';
  ctx.fillText('Press R to retry', world.w * 0.5, world.h * 0.56);
  ctx.textAlign = 'start';
}

function render(ts) {
  drawBg(ts);
  drawAnchors(ts);
  drawTether();
  drawCores();
  drawPlayer();
  drawEndOverlay();

  ui.time.textContent = `Time ${world.timeLeft.toFixed(1)}s`;
  ui.hp.textContent = `HP ${Math.ceil(player.hp)}`;
  ui.cores.textContent = `Cores ${world.destroyed}/${world.target}`;
  ui.speed.textContent = `Speed ${Math.round(Math.hypot(player.vx, player.vy))}`;
}

function frame(ts) {
  if (!world.lastTs) world.lastTs = ts;
  const dt = Math.min(0.033, (ts - world.lastTs) / 1000);
  world.lastTs = ts;

  update(dt);
  render(ts);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
