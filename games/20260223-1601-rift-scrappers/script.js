const WIDTH = 900;
const HEIGHT = 520;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = {
  hp: document.getElementById('hp'),
  time: document.getElementById('time'),
  scrap: document.getElementById('scrap'),
  pulse: document.getElementById('pulse'),
  kills: document.getElementById('kills'),
  wave: document.getElementById('wave'),
  module: document.getElementById('module')
};

const restartBtn = document.getElementById('restartBtn');
const startOverlay = document.getElementById('startOverlay');
const modulePicks = document.getElementById('modulePicks');
const startBtn = document.getElementById('startBtn');
const upgradeOverlay = document.getElementById('upgradeOverlay');
const upgradeCards = document.getElementById('upgradeCards');

const movePad = document.getElementById('movePad');
const moveStick = document.getElementById('moveStick');
const dashBtn = document.getElementById('dashBtn');
const pulseBtn = document.getElementById('pulseBtn');

const MODULES = [
  {
    id: 'magnet-core',
    name: 'Magnet Core',
    text: '+40% scrap pull and +18 pickup range.',
    apply: state => {
      state.mod.pickupRadius += 18;
      state.mod.magnetPull *= 1.4;
    }
  },
  {
    id: 'phase-battery',
    name: 'Phase Battery',
    text: '+28% pulse gain from scrap.',
    apply: state => {
      state.mod.pulseGain *= 1.28;
    }
  },
  {
    id: 'ram-plating',
    name: 'Ram Plating',
    text: 'Dash impact damage +1 and longer dash i-frames.',
    apply: state => {
      state.mod.dashHit += 1;
      state.mod.dashInv += 0.07;
    }
  },
  {
    id: 'recycler',
    name: 'Recycler',
    text: 'Every 12th scrap grants +8 HP.',
    apply: state => {
      state.mod.recycler = true;
    }
  },
  {
    id: 'thruster',
    name: 'Thruster',
    text: '+16 move speed and -0.15s dash cooldown.',
    apply: state => {
      state.p.speed += 16;
      state.mod.dashCdBonus -= 0.15;
    }
  }
];

const UPGRADE_POOL = [
  {
    id: 'hp-up',
    name: 'Armor Patch',
    text: '+24 HP (up to 160).',
    apply: state => {
      state.hp = Math.min(160, state.hp + 24);
    }
  },
  {
    id: 'speed-up',
    name: 'Servo Tune',
    text: '+16 move speed.',
    apply: state => {
      state.p.speed += 16;
    }
  },
  {
    id: 'pulse-up',
    name: 'Pulse Capacitor',
    text: 'Instantly gain +22% pulse.',
    apply: state => {
      state.pulse = Math.min(100, state.pulse + 22);
    }
  },
  {
    id: 'dash-up',
    name: 'Rift Edges',
    text: 'Dash cooldown -0.12s.',
    apply: state => {
      state.mod.dashCdBonus -= 0.12;
    }
  },
  {
    id: 'vacuum-up',
    name: 'Vacuum Spline',
    text: '+10 pickup range and stronger pull.',
    apply: state => {
      state.mod.pickupRadius += 10;
      state.mod.magnetPull *= 1.15;
    }
  }
];

let s;
let keys = {};
let started = false;
let selectedModule = null;
let selectedModuleIdx = 0;
let queuedDash = false;
let queuedPulse = false;
let moveTouch = null;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function pickRandom(arr, n) {
  const bag = [...arr];
  const out = [];
  while (bag.length && out.length < n) {
    const i = Math.floor(Math.random() * bag.length);
    out.push(bag.splice(i, 1)[0]);
  }
  return out;
}

function reset() {
  s = {
    t: 0,
    hp: 100,
    scrap: 0,
    kills: 0,
    pulse: 0,
    over: false,
    pausedForPick: false,
    nextUpgradeAt: 35,
    wave: 1,
    spawn: 0.6,
    p: { x: WIDTH / 2, y: HEIGHT / 2, r: 14, vx: 0, vy: 0, dashCd: 0, dash: 0, inv: 0, speed: 170 },
    mobs: [],
    scraps: [],
    pickOptions: [],
    module: selectedModule,
    mod: {
      pulseGain: 1,
      pickupRadius: 30,
      magnetPull: 0.2,
      dashHit: 2,
      dashInv: 0,
      recycler: false,
      dashCdBonus: 0
    },
    recyclerCount: 0
  };

  if (s.module) {
    s.module.apply(s);
    ui.module.textContent = s.module.name;
  } else {
    ui.module.textContent = '-';
  }

  queuedDash = false;
  queuedPulse = false;
  moveTouch = null;
  setStick(0, 0);
}

function showStart() {
  const picks = pickRandom(MODULES, 3);
  modulePicks.innerHTML = '';
  picks.forEach((mod, idx) => {
    const b = document.createElement('button');
    b.className = 'pick-card';
    b.type = 'button';
    b.innerHTML = `<strong>${mod.name}</strong><small>${mod.text}</small>`;
    b.addEventListener('click', () => {
      selectedModule = mod;
      selectedModuleIdx = idx;
      Array.from(modulePicks.children).forEach((el, i) => el.classList.toggle('active', i === idx));
    });
    modulePicks.appendChild(b);
  });

  selectedModule = picks[0];
  selectedModuleIdx = 0;
  Array.from(modulePicks.children)[0].classList.add('active');

  startOverlay.hidden = false;
  startOverlay.classList.add('show');
  upgradeOverlay.hidden = true;
  started = false;
  reset();
  draw();
}

function difficultyAt(t) {
  const smoothStart = 0.52 + 0.48 * (1 - Math.exp(-t / 22));
  const lateRamp = Math.max(0, t - 32) * 0.013;
  return smoothStart + lateRamp;
}

function spawnMob(diff) {
  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;
  if (side === 0) { x = Math.random() * WIDTH; y = -20; }
  if (side === 1) { x = WIDTH + 20; y = Math.random() * HEIGHT; }
  if (side === 2) { x = Math.random() * WIDTH; y = HEIGHT + 20; }
  if (side === 3) { x = -20; y = Math.random() * HEIGHT; }

  const eliteChance = clamp((s.t - 40) / 110, 0, 0.25);
  const elite = Math.random() < eliteChance;
  const hp = 1 + Math.floor(diff * 1.5) + (elite ? 1 : 0);
  const sp = 36 + diff * 28 + Math.random() * 12 + (elite ? 12 : 0);
  const r = elite ? 14 : 10 + Math.random() * 4;
  s.mobs.push({ x, y, r, hp, sp, elite });
}

function dropScrap(x, y, n = 1) {
  for (let i = 0; i < n; i++) {
    s.scraps.push({ x: x + (Math.random() - 0.5) * 16, y: y + (Math.random() - 0.5) * 16, r: 5 });
  }
}

function openUpgradePick() {
  s.pausedForPick = true;
  s.pickOptions = pickRandom(UPGRADE_POOL, 3);
  upgradeCards.innerHTML = '';

  s.pickOptions.forEach((opt, idx) => {
    const b = document.createElement('button');
    b.className = 'pick-card';
    b.type = 'button';
    b.innerHTML = `<strong>${idx + 1}. ${opt.name}</strong><small>${opt.text}</small>`;
    b.addEventListener('click', () => applyUpgradePick(idx));
    upgradeCards.appendChild(b);
  });

  upgradeOverlay.hidden = false;
}

function applyUpgradePick(idx) {
  if (!s.pausedForPick || !s.pickOptions[idx]) return;
  s.pickOptions[idx].apply(s);
  s.scrap -= s.nextUpgradeAt;
  s.nextUpgradeAt += 15;
  s.pausedForPick = false;
  s.pickOptions = [];
  upgradeOverlay.hidden = true;
}

function queueActions() {
  const dashKey = keys[' '] || keys['Shift'];
  const pulseKey = keys.e || keys.f || keys.E || keys.F;
  if (dashKey) queuedDash = true;
  if (pulseKey) queuedPulse = true;
}

function update(dt) {
  if (!started || s.over || s.pausedForPick) return;

  s.t += dt;
  s.wave = 1 + Math.floor(s.t / 20);

  const p = s.p;
  p.dashCd = Math.max(0, p.dashCd - dt);
  p.dash = Math.max(0, p.dash - dt);
  p.inv = Math.max(0, p.inv - dt);

  let mx = 0;
  let my = 0;
  if (keys.ArrowLeft || keys.a || keys.A) mx -= 1;
  if (keys.ArrowRight || keys.d || keys.D) mx += 1;
  if (keys.ArrowUp || keys.w || keys.W) my -= 1;
  if (keys.ArrowDown || keys.s || keys.S) my += 1;
  if (moveTouch) {
    mx += moveTouch.x;
    my += moveTouch.y;
  }

  const mlen = Math.hypot(mx, my) || 1;
  const speed = p.dash > 0 ? 350 : p.speed;
  p.vx = (mx / mlen) * speed;
  p.vy = (my / mlen) * speed;
  p.x = clamp(p.x + p.vx * dt, 16, WIDTH - 16);
  p.y = clamp(p.y + p.vy * dt, 16, HEIGHT - 16);

  queueActions();
  const dashCd = Math.max(0.55, 1.25 + s.mod.dashCdBonus);
  if (queuedDash && p.dashCd <= 0) {
    p.dash = 0.22;
    p.dashCd = dashCd;
    p.inv = 0.18 + s.mod.dashInv;
    queuedDash = false;
  }

  if (queuedPulse && s.pulse >= 100) {
    s.pulse = 0;
    queuedPulse = false;
    s.mobs = s.mobs.filter(m => {
      const d = Math.hypot(m.x - p.x, m.y - p.y);
      if (d < 125) {
        dropScrap(m.x, m.y, 2 + (m.elite ? 1 : 0));
        s.kills += 1;
        return false;
      }
      return true;
    });
  }

  const diff = difficultyAt(s.t);
  const maxMobs = 6 + Math.floor(Math.min(30, s.t) / 6) + Math.floor(s.t / 30);
  s.spawn -= dt;
  if (s.spawn <= 0) {
    s.spawn = clamp(1.18 - diff * 0.2 + Math.random() * 0.08, 0.26, 1.18);
    if (s.mobs.length < maxMobs) spawnMob(diff);
  }

  const touchDamage = 5 + Math.min(4, Math.floor(s.t / 35));
  for (const m of s.mobs) {
    const dx = p.x - m.x;
    const dy = p.y - m.y;
    const d = Math.hypot(dx, dy) || 1;

    m.x += (dx / d) * m.sp * dt;
    m.y += (dy / d) * m.sp * dt;

    if (d < p.r + m.r) {
      if (p.inv <= 0) {
        s.hp -= touchDamage;
        p.inv = 0.52;
        if (s.hp <= 0) s.over = true;
      }

      if (p.dash > 0) {
        m.hp -= s.mod.dashHit;
        if (m.hp <= 0) {
          m.dead = true;
          s.kills += 1;
          dropScrap(m.x, m.y, m.elite ? 3 : 2);
        }
      }
    }
  }
  s.mobs = s.mobs.filter(m => !m.dead);

  for (const sc of s.scraps) {
    const d = Math.hypot(sc.x - p.x, sc.y - p.y);
    if (d < s.mod.pickupRadius + 14) {
      sc.x += (p.x - sc.x) * s.mod.magnetPull;
      sc.y += (p.y - sc.y) * s.mod.magnetPull;
    }

    if (d < p.r + sc.r + s.mod.pickupRadius * 0.12) {
      sc.got = true;
      s.scrap += 1;
      s.pulse = Math.min(100, s.pulse + 6 * s.mod.pulseGain);
      if (s.mod.recycler) {
        s.recyclerCount += 1;
        if (s.recyclerCount % 12 === 0) s.hp = Math.min(160, s.hp + 8);
      }
    }
  }
  s.scraps = s.scraps.filter(v => !v.got);

  if (!s.pausedForPick && s.scrap >= s.nextUpgradeAt) {
    openUpgradePick();
  }

  ui.hp.textContent = Math.max(0, Math.floor(s.hp));
  ui.time.textContent = `${s.t.toFixed(1)}s`;
  ui.scrap.textContent = s.scrap;
  ui.pulse.textContent = `${Math.floor(s.pulse)}%`;
  ui.kills.textContent = s.kills;
  ui.wave.textContent = s.wave;
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  for (let y = 0; y < HEIGHT; y += 40) {
    for (let x = 0; x < WIDTH; x += 40) {
      ctx.strokeStyle = 'rgba(90,140,255,.1)';
      ctx.strokeRect(x, y, 40, 40);
    }
  }

  for (const sc of s.scraps) {
    ctx.fillStyle = '#ffd66b';
    ctx.beginPath();
    ctx.arc(sc.x, sc.y, sc.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const m of s.mobs) {
    ctx.fillStyle = m.elite ? '#ff4f7a' : '#ff6a7a';
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  }

  const p = s.p;
  ctx.fillStyle = p.inv > 0 ? '#88e8ff' : '#4df0ff';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(77,240,255,.26)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 26 + s.pulse * 0.7, 0, Math.PI * 2 * (s.pulse / 100));
  ctx.stroke();

  if (!started) {
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  if (started && s.t < 16) {
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(12, 12, 328, 74);
    ctx.fillStyle = '#e9f4ff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Collect scrap, then buy upgrades.', 24, 40);
    ctx.font = '15px sans-serif';
    ctx.fillText('Pulse at 100% to clear nearby mobs.', 24, 64);
  }

  if (s.over) {
    ctx.fillStyle = 'rgba(0,0,0,.58)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText('Rift Collapsed', 318, 232);
    ctx.font = '23px sans-serif';
    ctx.fillText('Press R or Restart', 346, 276);
  }
}

function setStick(nx, ny) {
  if (!moveStick) return;
  const px = nx * 44;
  const py = ny * 44;
  moveStick.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
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
  keys[e.key] = true;

  if (e.key === 'r' || e.key === 'R') {
    if (!startOverlay.hidden) {
      showStart();
    } else {
      reset();
      started = true;
      upgradeOverlay.hidden = true;
    }
  }

  if (s && s.pausedForPick && (e.key === '1' || e.key === '2' || e.key === '3')) {
    applyUpgradePick(Number(e.key) - 1);
  }
});

window.addEventListener('keyup', e => {
  keys[e.key] = false;
});

restartBtn.addEventListener('click', () => {
  showStart();
});

startBtn.addEventListener('click', () => {
  startOverlay.hidden = true;
  started = true;
  reset();
});

dashBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  queuedDash = true;
});

pulseBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  queuedPulse = true;
});

movePad.addEventListener('pointerdown', e => {
  e.preventDefault();
  movePad.setPointerCapture(e.pointerId);
  moveTouch = { id: e.pointerId, x: 0, y: 0 };
});

movePad.addEventListener('pointermove', e => {
  if (!moveTouch || moveTouch.id !== e.pointerId) return;
  const rect = movePad.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;
  const r = rect.width * 0.32;
  const d = Math.hypot(dx, dy) || 1;
  const mul = Math.min(1, r / d);
  const nx = clamp((dx * mul) / r, -1, 1);
  const ny = clamp((dy * mul) / r, -1, 1);
  moveTouch.x = nx;
  moveTouch.y = ny;
  setStick(nx, ny);
});

movePad.addEventListener('pointerup', e => {
  if (!moveTouch || moveTouch.id !== e.pointerId) return;
  moveTouch = null;
  setStick(0, 0);
});

movePad.addEventListener('pointercancel', () => {
  moveTouch = null;
  setStick(0, 0);
});

showStart();
requestAnimationFrame(loop);
