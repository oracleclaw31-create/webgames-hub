const c = document.getElementById('game');
const x = c.getContext('2d');
const uiStars = document.getElementById('stars');
const uiTime = document.getElementById('time');
const uiStatus = document.getElementById('status');

const keys = { left: false, right: false };
let s;
let tick;

const groundY = 360;
const platforms = [
  { x: 80, y: 300, w: 120, h: 14 },
  { x: 260, y: 250, w: 140, h: 14 },
  { x: 470, y: 200, w: 150, h: 14 },
  { x: 680, y: 160, w: 90, h: 14 }
];
const flag = { x: 742, y: 110, w: 24, h: 50 };

function newGame() {
  return {
    t: 60,
    over: false,
    win: false,
    collected: 0,
    p: { x: 30, y: groundY - 38, w: 28, h: 38, vx: 0, vy: 0, on: false },
    stars: [
      { x: 130, y: 270, got: false },
      { x: 330, y: 220, got: false },
      { x: 530, y: 170, got: false },
      { x: 710, y: 130, got: false },
      { x: 760, y: groundY - 20, got: false }
    ],
    spikes: [{ x: 215, y: groundY - 12, w: 40, h: 12 }, { x: 620, y: groundY - 12, w: 36, h: 12 }]
  };
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function jump() {
  if (s.over) return;
  if (s.p.on) {
    s.p.vy = -11;
    s.p.on = false;
  }
}

function update() {
  if (s.over) return;
  s.p.vx = (keys.left ? -4 : 0) + (keys.right ? 4 : 0);
  s.p.vy += 0.55;

  s.p.x += s.p.vx;
  s.p.y += s.p.vy;

  if (s.p.x < 0) s.p.x = 0;
  if (s.p.x + s.p.w > c.width) s.p.x = c.width - s.p.w;

  s.p.on = false;
  if (s.p.y + s.p.h >= groundY) {
    s.p.y = groundY - s.p.h;
    s.p.vy = 0;
    s.p.on = true;
  }

  for (const p of platforms) {
    if (
      s.p.vy >= 0 &&
      s.p.x + s.p.w > p.x &&
      s.p.x < p.x + p.w &&
      s.p.y + s.p.h <= p.y + 12 &&
      s.p.y + s.p.h + s.p.vy >= p.y
    ) {
      s.p.y = p.y - s.p.h;
      s.p.vy = 0;
      s.p.on = true;
    }
  }

  for (const st of s.stars) {
    if (!st.got) {
      const d = Math.hypot((s.p.x + 14) - st.x, (s.p.y + 18) - st.y);
      if (d < 22) {
        st.got = true;
        s.collected += 1;
      }
    }
  }

  for (const sp of s.spikes) {
    if (overlap(s.p, { ...sp, y: sp.y, h: sp.h })) {
      s.p.x = 30;
      s.p.y = groundY - s.p.h;
      s.p.vx = 0;
      s.p.vy = 0;
    }
  }

  if (s.collected === 5 && overlap(s.p, flag)) {
    s.over = true;
    s.win = true;
    uiStatus.textContent = 'WIN';
  }
}

function draw() {
  x.clearRect(0, 0, c.width, c.height);

  x.fillStyle = '#2f9546';
  x.fillRect(0, groundY, c.width, c.height - groundY);

  x.fillStyle = '#5f7f9a';
  for (const p of platforms) x.fillRect(p.x, p.y, p.w, p.h);

  x.fillStyle = '#d12626';
  for (const sp of s.spikes) {
    for (let i = 0; i < sp.w; i += 10) {
      x.beginPath();
      x.moveTo(sp.x + i, sp.y + sp.h);
      x.lineTo(sp.x + i + 5, sp.y);
      x.lineTo(sp.x + i + 10, sp.y + sp.h);
      x.fill();
    }
  }

  x.fillStyle = '#fff463';
  for (const st of s.stars) {
    if (st.got) continue;
    x.beginPath();
    x.arc(st.x, st.y, 8, 0, Math.PI * 2);
    x.fill();
  }

  x.fillStyle = s.collected === 5 ? '#7eff95' : '#8aa0ba';
  x.fillRect(flag.x, flag.y, 4, flag.h);
  x.fillStyle = s.collected === 5 ? '#7eff95' : '#d8d8d8';
  x.beginPath();
  x.moveTo(flag.x + 4, flag.y + 4);
  x.lineTo(flag.x + 24, flag.y + 14);
  x.lineTo(flag.x + 4, flag.y + 24);
  x.fill();

  x.fillStyle = '#ffb347';
  x.fillRect(s.p.x, s.p.y, s.p.w, s.p.h);

  uiStars.textContent = s.collected;
  uiTime.textContent = s.t;
  if (!s.over) uiStatus.textContent = 'RUN';
}

function start() {
  s = newGame();
  clearInterval(tick);
  tick = setInterval(() => {
    if (!s.over) {
      s.t -= 1;
      if (s.t <= 0) {
        s.t = 0;
        s.over = true;
        s.win = false;
        uiStatus.textContent = 'LOSE';
      }
      update();
      draw();
    }
  }, 1000 / 60);
}

document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'a' || k === 'arrowleft') keys.left = true;
  if (k === 'd' || k === 'arrowright') keys.right = true;
  if (k === 'w' || k === 'arrowup' || k === ' ') jump();
});

document.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'a' || k === 'arrowleft') keys.left = false;
  if (k === 'd' || k === 'arrowright') keys.right = false;
});

for (const b of document.querySelectorAll('[data-dir]')) {
  b.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (b.dataset.dir === 'left') keys.left = true;
    if (b.dataset.dir === 'right') keys.right = true;
  }, { passive: false });
  b.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (b.dataset.dir === 'left') keys.left = false;
    if (b.dataset.dir === 'right') keys.right = false;
  }, { passive: false });
  b.addEventListener('mousedown', () => {
    if (b.dataset.dir === 'left') keys.left = true;
    if (b.dataset.dir === 'right') keys.right = true;
  });
  b.addEventListener('mouseup', () => {
    if (b.dataset.dir === 'left') keys.left = false;
    if (b.dataset.dir === 'right') keys.right = false;
  });
}

document.getElementById('jumpBtn').addEventListener('click', jump);
document.getElementById('resetBtn').addEventListener('click', start);

start();
