const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const metricsEl = document.getElementById('metrics');
const keys = {};

const state = {
  time: 120,
  score: 0,
  chains: 0,
  gameOver: false,
  player: { x: 480, y: 270, vx: 0, vy: 0, r: 14 },
  reactors: [
    { x: 220, y: 150, heat: 65 },
    { x: 740, y: 160, heat: 70 },
    { x: 280, y: 400, heat: 62 },
    { x: 680, y: 390, heat: 68 }
  ],
  debris: [],
  charge: 0,
  charging: false,
  stick: { x: 0, y: 0 }
};

function spawnDebris() {
  if (state.debris.length > 30) return;
  const side = Math.floor(Math.random() * 4);
  let x = 0, y = 0;
  if (side === 0) { x = Math.random() * canvas.width; y = -10; }
  if (side === 1) { x = canvas.width + 10; y = Math.random() * canvas.height; }
  if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 10; }
  if (side === 3) { x = -10; y = Math.random() * canvas.height; }
  state.debris.push({ x, y, vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80, r: 7 + Math.random() * 5, hot: false });
}

for (let i = 0; i < 12; i++) spawnDebris();

addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space') state.charging = true;
  if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && state.charge > 15) sling();
  if (state.gameOver && e.code === 'KeyR') location.reload();
});
addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (e.code === 'Space') state.charging = false;
});

const chargeBtn = document.getElementById('chargeBtn');
const slingBtn = document.getElementById('slingBtn');
function bindPress(btn, down, up) {
  btn.addEventListener('mousedown', down); btn.addEventListener('mouseup', up);
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); down(); }, { passive: false });
  btn.addEventListener('touchend', up);
}
bindPress(chargeBtn, () => state.charging = true, () => state.charging = false);
bindPress(slingBtn, () => sling(), () => {});

const stickZone = document.getElementById('stickZone');
const stickKnob = document.getElementById('stickKnob');
let stickActive = false;
function resetStick() { state.stick.x = 0; state.stick.y = 0; stickKnob.style.left = '44px'; stickKnob.style.top = '44px'; }
function updateStick(clientX, clientY) {
  const rect = stickZone.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = clientX - cx, dy = clientY - cy;
  const len = Math.hypot(dx, dy) || 1;
  const max = 42;
  if (len > max) { dx = dx / len * max; dy = dy / len * max; }
  state.stick.x = dx / max;
  state.stick.y = dy / max;
  stickKnob.style.left = `${44 + dx}px`;
  stickKnob.style.top = `${44 + dy}px`;
}
stickZone.addEventListener('touchstart', (e) => { stickActive = true; updateStick(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
stickZone.addEventListener('touchmove', (e) => { if (stickActive) updateStick(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
stickZone.addEventListener('touchend', () => { stickActive = false; resetStick(); });

function sling() {
  const p = state.player;
  const radius = 110 + state.charge * 1.3;
  let hits = 0;
  for (const d of state.debris) {
    const dx = d.x - p.x, dy = d.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < radius) {
      const mul = (radius - dist) / radius;
      d.vx += (dx / (dist || 1)) * (280 + state.charge * 5) * mul;
      d.vy += (dy / (dist || 1)) * (280 + state.charge * 5) * mul;
      d.hot = true;
      hits++;
    }
  }
  state.score += hits * 12;
  state.chains = Math.max(state.chains, hits);
  state.charge = 0;
}

function update(dt) {
  if (state.gameOver) return;
  state.time -= dt;
  if (state.time <= 0) {
    state.gameOver = true;
    statusEl.textContent = 'Time up. Press R to restart.';
    return;
  }

  const ax = ((keys.KeyD || keys.ArrowRight) ? 1 : 0) - ((keys.KeyA || keys.ArrowLeft) ? 1 : 0) + state.stick.x;
  const ay = ((keys.KeyS || keys.ArrowDown) ? 1 : 0) - ((keys.KeyW || keys.ArrowUp) ? 1 : 0) + state.stick.y;
  const len = Math.hypot(ax, ay) || 1;
  state.player.vx = ax / len * 220;
  state.player.vy = ay / len * 220;
  state.player.x = Math.max(18, Math.min(canvas.width - 18, state.player.x + state.player.vx * dt));
  state.player.y = Math.max(18, Math.min(canvas.height - 18, state.player.y + state.player.vy * dt));

  if (state.charging) state.charge = Math.min(100, state.charge + dt * 45);
  else state.charge = Math.max(0, state.charge - dt * 20);

  for (const r of state.reactors) r.heat += dt * 4;

  for (const d of state.debris) {
    const px = state.player.x - d.x;
    const py = state.player.y - d.y;
    const dist = Math.hypot(px, py) || 1;
    if (state.charging && dist < 180) {
      const pull = (180 - dist) / 180 * (130 + state.charge);
      d.vx += px / dist * pull * dt;
      d.vy += py / dist * pull * dt;
    }

    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.vx *= 0.993;
    d.vy *= 0.993;

    if (d.x < -20 || d.x > canvas.width + 20 || d.y < -20 || d.y > canvas.height + 20) {
      d.x = Math.random() * canvas.width;
      d.y = Math.random() * canvas.height;
      d.vx = (Math.random() - 0.5) * 90;
      d.vy = (Math.random() - 0.5) * 90;
      d.hot = false;
    }

    for (const r of state.reactors) {
      const dx = d.x - r.x;
      const dy = d.y - r.y;
      const rd = Math.hypot(dx, dy);
      if (rd < d.r + 24) {
        if (d.hot) {
          r.heat -= 14;
          state.score += 8;
        } else {
          r.heat += 8;
        }
        d.vx *= -0.6;
        d.vy *= -0.6;
        d.hot = false;
      }
    }
  }

  if (Math.random() < dt * 2.1) spawnDebris();

  for (const r of state.reactors) {
    if (r.heat > 100) {
      state.gameOver = true;
      statusEl.textContent = 'Reactor meltdown! Press R to restart.';
    }
  }

  const avgHeat = state.reactors.reduce((a, r) => a + r.heat, 0) / state.reactors.length;
  if (avgHeat < 38) {
    state.score += 45;
    state.time += 3;
    for (const r of state.reactors) r.heat += 18;
    statusEl.textContent = 'Stability bonus! +3s';
  } else {
    statusEl.textContent = 'Keep reactors under control with charged sling chains.';
  }

  metricsEl.textContent = `Time ${state.time.toFixed(1)} | Score ${Math.floor(state.score)} | Chains ${state.chains} | Heat ${avgHeat.toFixed(1)}`;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createRadialGradient(state.player.x, state.player.y, 30, state.player.x, state.player.y, 440);
  grad.addColorStop(0, '#0d2036');
  grad.addColorStop(1, '#050b14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const r of state.reactors) {
    ctx.beginPath();
    ctx.arc(r.x, r.y, 24, 0, Math.PI * 2);
    const heat = Math.max(0, Math.min(100, r.heat));
    ctx.fillStyle = `hsl(${200 - heat * 1.8}, 90%, ${30 + heat * 0.35}%)`;
    ctx.fill();
    ctx.strokeStyle = '#a5d4ff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  for (const d of state.debris) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fillStyle = d.hot ? '#8bf7ff' : '#ffb86f';
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, state.player.r, 0, Math.PI * 2);
  ctx.fillStyle = '#dff2ff';
  ctx.fill();

  if (state.charge > 0) {
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, 28 + state.charge * 1.1, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(120,220,255,${0.1 + state.charge / 150})`;
    ctx.lineWidth = 3;
    ctx.stroke();
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
requestAnimationFrame(loop);
