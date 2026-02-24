const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const overlayButton = document.getElementById('overlayButton');

const stickWrap = document.getElementById('stickWrap');
const stickKnob = document.getElementById('stickKnob');
const slamBtn = document.getElementById('slamBtn');
const brakeBtn = document.getElementById('brakeBtn');

const W = canvas.width;
const H = canvas.height;

const keys = {};
const touchMove = { x: 0, y: 0, active: false };
const touchState = { slam: false, brake: false };

let state = 'ready';
let timeLeft = 80;
let score = 0;
let reactorLeft = 6;

const ship = { x: 120, y: H / 2, vx: 0, vy: 0, r: 14, hp: 100, slamCd: 0, brakeCd: 0 };
const reactors = [];
const mines = [];
const particles = [];
const extractGate = { x: W - 80, y: H / 2, r: 34, open: false };

function resetRun() {
  state = 'running';
  timeLeft = 80;
  score = 0;
  reactorLeft = 6;
  ship.x = 120; ship.y = H / 2; ship.vx = 0; ship.vy = 0; ship.hp = 100; ship.slamCd = 0; ship.brakeCd = 0;
  reactors.length = 0;
  mines.length = 0;
  particles.length = 0;
  extractGate.open = false;
  for (let i = 0; i < 6; i++) {
    reactors.push({ x: 250 + Math.random() * 620, y: 70 + Math.random() * 400, r: 18, hp: 30, alive: true });
  }
  for (let i = 0; i < 14; i++) {
    mines.push({ x: 180 + Math.random() * 700, y: 40 + Math.random() * 460, r: 12, vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80 });
  }
}

function inputVec() {
  let x = 0, y = 0;
  if (keys.ArrowLeft || keys.a) x -= 1;
  if (keys.ArrowRight || keys.d) x += 1;
  if (keys.ArrowUp || keys.w) y -= 1;
  if (keys.ArrowDown || keys.s) y += 1;
  if (touchMove.active) { x += touchMove.x; y += touchMove.y; }
  const m = Math.hypot(x, y) || 1;
  return { x: x / m, y: y / m, mag: Math.min(1, Math.hypot(x, y)) };
}

function hitReactors(impact) {
  reactors.forEach(r => {
    if (!r.alive) return;
    const d = Math.hypot(ship.x - r.x, ship.y - r.y);
    if (d < ship.r + r.r) {
      const dmg = Math.floor(impact * 18 + Math.hypot(ship.vx, ship.vy) * 0.06);
      r.hp -= dmg;
      ship.vx *= -0.55; ship.vy *= -0.55;
      score += 5;
      spawn(r.x, r.y, '#63e5ff', 10);
      if (r.hp <= 0) {
        r.alive = false;
        reactorLeft -= 1;
        score += 120;
        spawn(r.x, r.y, '#9efc87', 30);
      }
    }
  });
}

function update(dt) {
  if (state !== 'running') return;
  timeLeft -= dt;
  if (timeLeft <= 0) end(false, 'Time expired in the gauntlet.');

  const iv = inputVec();
  const thrust = 420;
  ship.vx += iv.x * thrust * iv.mag * dt;
  ship.vy += iv.y * thrust * iv.mag * dt;

  if ((keys[' '] || touchState.slam) && ship.slamCd <= 0) {
    const m = Math.hypot(ship.vx, ship.vy) || 1;
    ship.vx += (ship.vx / m) * 240;
    ship.vy += (ship.vy / m) * 240;
    ship.slamCd = 1.1;
    spawn(ship.x, ship.y, '#fff', 18);
  }
  if ((keys.Shift || touchState.brake) && ship.brakeCd <= 0) {
    ship.vx *= 0.28; ship.vy *= 0.28;
    ship.brakeCd = 0.35;
  }
  ship.slamCd -= dt;
  ship.brakeCd -= dt;

  ship.vx *= 0.989;
  ship.vy *= 0.989;
  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;

  if (ship.x < ship.r || ship.x > W - ship.r) ship.vx *= -0.8;
  if (ship.y < ship.r || ship.y > H - ship.r) ship.vy *= -0.8;
  ship.x = Math.max(ship.r, Math.min(W - ship.r, ship.x));
  ship.y = Math.max(ship.r, Math.min(H - ship.r, ship.y));

  mines.forEach(m => {
    m.x += m.vx * dt; m.y += m.vy * dt;
    if (m.x < m.r || m.x > W - m.r) m.vx *= -1;
    if (m.y < m.r || m.y > H - m.r) m.vy *= -1;
    const d = Math.hypot(ship.x - m.x, ship.y - m.y);
    if (d < ship.r + m.r) {
      ship.hp -= 20 * dt + 2;
      ship.vx += (ship.x - m.x) * 0.4;
      ship.vy += (ship.y - m.y) * 0.4;
      spawn(m.x, m.y, '#ff6f8f', 6);
    }
  });

  hitReactors(1);
  if (reactorLeft <= 0) extractGate.open = true;
  if (extractGate.open && Math.hypot(ship.x - extractGate.x, ship.y - extractGate.y) < extractGate.r + ship.r) {
    end(true, 'Extraction successful. Reactors neutralized.');
  }
  if (ship.hp <= 0) end(false, 'Hull integrity failed.');

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.t <= 0) particles.splice(i, 1);
  }
}

function spawn(x, y, c, n) {
  for (let i = 0; i < n; i++) particles.push({ x, y, c, t: 0.3 + Math.random() * 0.5, vx: (Math.random()-0.5)*220, vy: (Math.random()-0.5)*220 });
}

function end(win, msg) {
  state = win ? 'win' : 'lose';
  overlay.classList.remove('hidden');
  overlayTitle.textContent = win ? 'Mission Clear' : 'Run Failed';
  overlayText.textContent = msg + ` Score ${score}`;
  overlayButton.textContent = 'Retry';
}

function draw() {
  ctx.fillStyle = '#050a1a';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#1c2f6e';
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }

  reactors.forEach(r => {
    if (!r.alive) return;
    ctx.beginPath(); ctx.fillStyle = '#63e5ff'; ctx.arc(r.x, r.y, r.r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#081027'; ctx.fillRect(r.x - 16, r.y + 22, 32, 4);
    ctx.fillStyle = '#9efc87'; ctx.fillRect(r.x - 16, r.y + 22, Math.max(0, r.hp/30)*32, 4);
  });

  mines.forEach(m => { ctx.beginPath(); ctx.fillStyle = '#ff6f8f'; ctx.arc(m.x, m.y, m.r, 0, Math.PI*2); ctx.fill(); });

  if (extractGate.open) {
    ctx.beginPath(); ctx.strokeStyle = '#9efc87'; ctx.lineWidth = 4; ctx.arc(extractGate.x, extractGate.y, extractGate.r, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#9efc87'; ctx.fillText('EXIT', extractGate.x - 14, extractGate.y + 4);
  }

  ctx.beginPath(); ctx.fillStyle = '#ffffff'; ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.strokeStyle = '#63e5ff'; ctx.moveTo(ship.x, ship.y); ctx.lineTo(ship.x - ship.vx * 0.1, ship.y - ship.vy * 0.1); ctx.stroke();

  particles.forEach(p => { ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 2, 2); });

  ctx.fillStyle = '#e8eeff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`HP ${Math.max(0, ship.hp|0)}  Time ${Math.max(0,timeLeft|0)}  Score ${score}  Reactors ${reactorLeft}`, 14, 24);
  ctx.fillText(`Loop: thrust-drift-ricochet-shatter-reactor-clear-extract`, 14, 46);
}

let last = performance.now();
function frame(t) {
  const dt = Math.min(0.033, (t - last) / 1000);
  last = t;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

overlayButton.addEventListener('click', () => {
  overlay.classList.add('hidden');
  resetRun();
});

window.addEventListener('keydown', e => { keys[e.key] = true; if (e.key.toLowerCase() === 'r') { overlay.classList.add('hidden'); resetRun(); } });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function resetStick() { stickKnob.style.left = '34px'; stickKnob.style.top = '34px'; touchMove.x = 0; touchMove.y = 0; touchMove.active = false; }
stickWrap.addEventListener('pointerdown', e => {
  touchMove.active = true;
  stickWrap.setPointerCapture(e.pointerId);
});
stickWrap.addEventListener('pointermove', e => {
  if (!touchMove.active) return;
  const r = stickWrap.getBoundingClientRect();
  const cx = r.left + r.width/2, cy = r.top + r.height/2;
  let dx = e.clientX - cx, dy = e.clientY - cy;
  const m = Math.hypot(dx, dy); const lim = 36;
  if (m > lim) { dx = dx / m * lim; dy = dy / m * lim; }
  stickKnob.style.left = `${34 + dx}px`; stickKnob.style.top = `${34 + dy}px`;
  touchMove.x = dx / lim; touchMove.y = dy / lim;
});
stickWrap.addEventListener('pointerup', resetStick);
stickWrap.addEventListener('pointercancel', resetStick);

slamBtn.addEventListener('pointerdown', () => touchState.slam = true);
slamBtn.addEventListener('pointerup', () => touchState.slam = false);
slamBtn.addEventListener('pointercancel', () => touchState.slam = false);
brakeBtn.addEventListener('pointerdown', () => touchState.brake = true);
brakeBtn.addEventListener('pointerup', () => touchState.brake = false);
brakeBtn.addEventListener('pointercancel', () => touchState.brake = false);
