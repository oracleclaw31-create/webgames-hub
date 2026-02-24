const c = document.getElementById('game');
const g = c.getContext('2d');

const ui = {
  gold: document.getElementById('gold'),
  hp: document.getElementById('hp'),
  wave: document.getElementById('wave'),
  build: document.getElementById('buildBtn')
};

const pathY = 210;
const slots = [
  { x: 150, y: 130 }, { x: 260, y: 290 }, { x: 390, y: 130 },
  { x: 510, y: 290 }, { x: 650, y: 130 }, { x: 770, y: 290 }
];

let s;
let loop;

function reset() {
  s = {
    over: false,
    buildMode: false,
    gold: 30,
    hp: 10,
    wave: 1,
    towers: [],
    enemies: [],
    shots: [],
    spawnTimer: 0,
    spawnedInWave: 0,
    neededInWave: 8,
    waveDelay: 180
  };
}

function spawnEnemy() {
  s.enemies.push({ x: -20, y: pathY, hp: 3 + Math.floor(s.wave / 2), maxHp: 3 + Math.floor(s.wave / 2), v: 1 + s.wave * 0.08 });
}

function update() {
  if (s.over) return;

  if (s.waveDelay > 0) s.waveDelay -= 1;

  if (s.waveDelay <= 0 && s.spawnedInWave < s.neededInWave) {
    s.spawnTimer -= 1;
    if (s.spawnTimer <= 0) {
      spawnEnemy();
      s.spawnedInWave += 1;
      s.spawnTimer = Math.max(25, 55 - s.wave * 2);
    }
  }

  for (const e of s.enemies) e.x += e.v;

  for (let i = s.enemies.length - 1; i >= 0; i -= 1) {
    if (s.enemies[i].x > c.width + 10) {
      s.enemies.splice(i, 1);
      s.hp -= 1;
      if (s.hp <= 0) s.over = true;
    }
  }

  for (const t of s.towers) {
    t.cooldown -= 1;
    if (t.cooldown > 0) continue;
    let target = null;
    let best = Infinity;
    for (const e of s.enemies) {
      const d = Math.hypot(e.x - t.x, e.y - t.y);
      if (d < 150 && d < best) {
        best = d;
        target = e;
      }
    }
    if (target) {
      const dx = target.x - t.x;
      const dy = target.y - t.y;
      const mag = Math.hypot(dx, dy) || 1;
      s.shots.push({ x: t.x, y: t.y, vx: (dx / mag) * 5.5, vy: (dy / mag) * 5.5, dmg: 1 });
      t.cooldown = 28;
    }
  }

  for (const sh of s.shots) {
    sh.x += sh.vx;
    sh.y += sh.vy;
  }
  s.shots = s.shots.filter((sh) => sh.x > -20 && sh.x < c.width + 20 && sh.y > -20 && sh.y < c.height + 20);

  for (let i = s.enemies.length - 1; i >= 0; i -= 1) {
    const e = s.enemies[i];
    for (let j = s.shots.length - 1; j >= 0; j -= 1) {
      const sh = s.shots[j];
      if (Math.hypot(e.x - sh.x, e.y - sh.y) < 12) {
        e.hp -= sh.dmg;
        s.shots.splice(j, 1);
        if (e.hp <= 0) {
          s.enemies.splice(i, 1);
          s.gold += 4;
          break;
        }
      }
    }
  }

  if (!s.over && s.spawnedInWave >= s.neededInWave && s.enemies.length === 0) {
    s.wave += 1;
    s.spawnedInWave = 0;
    s.neededInWave = 8 + s.wave * 2;
    s.waveDelay = 120;
    s.gold += 10;
  }

  ui.gold.textContent = s.gold;
  ui.hp.textContent = s.hp;
  ui.wave.textContent = s.wave;
}

function draw() {
  g.clearRect(0, 0, c.width, c.height);

  g.fillStyle = '#264223';
  g.fillRect(0, 0, c.width, c.height);

  g.fillStyle = '#7e6541';
  g.fillRect(0, pathY - 20, c.width, 40);

  for (const sl of slots) {
    g.fillStyle = s.towers.some((t) => t.x === sl.x && t.y === sl.y) ? '#89b067' : '#3f5d3b';
    g.fillRect(sl.x - 18, sl.y - 18, 36, 36);
    if (s.buildMode && !s.towers.some((t) => t.x === sl.x && t.y === sl.y)) {
      g.strokeStyle = '#f4ff9a';
      g.strokeRect(sl.x - 20, sl.y - 20, 40, 40);
    }
  }

  for (const t of s.towers) {
    g.fillStyle = '#cedf9a';
    g.beginPath();
    g.arc(t.x, t.y, 11, 0, Math.PI * 2);
    g.fill();
  }

  for (const e of s.enemies) {
    g.fillStyle = '#ff8678';
    g.beginPath();
    g.arc(e.x, e.y, 10, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#1a1a1a';
    g.fillRect(e.x - 14, e.y - 18, 28, 4);
    g.fillStyle = '#9df59a';
    g.fillRect(e.x - 14, e.y - 18, 28 * (e.hp / e.maxHp), 4);
  }

  g.fillStyle = '#ffe6a7';
  for (const sh of s.shots) {
    g.beginPath();
    g.arc(sh.x, sh.y, 4, 0, Math.PI * 2);
    g.fill();
  }

  if (s.over) {
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#fff';
    g.font = '32px system-ui';
    g.fillText('BASE LOST', 360, 210);
  }
}

function tryBuild(px, py) {
  if (!s.buildMode || s.gold < 15 || s.over) return;
  for (const sl of slots) {
    const occupied = s.towers.some((t) => t.x === sl.x && t.y === sl.y);
    if (occupied) continue;
    if (Math.abs(px - sl.x) < 20 && Math.abs(py - sl.y) < 20) {
      s.towers.push({ x: sl.x, y: sl.y, cooldown: 0 });
      s.gold -= 15;
      s.buildMode = false;
      return;
    }
  }
}

function start() {
  reset();
  clearInterval(loop);
  loop = setInterval(() => {
    update();
    draw();
  }, 1000 / 60);
}

ui.build.addEventListener('click', () => { s.buildMode = !s.buildMode; });
document.getElementById('resetBtn').addEventListener('click', start);
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'b') s.buildMode = !s.buildMode;
});

c.addEventListener('click', (e) => {
  const r = c.getBoundingClientRect();
  const px = ((e.clientX - r.left) / r.width) * c.width;
  const py = ((e.clientY - r.top) / r.height) * c.height;
  tryBuild(px, py);
});

c.addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  const r = c.getBoundingClientRect();
  const px = ((t.clientX - r.left) / r.width) * c.width;
  const py = ((t.clientY - r.top) / r.height) * c.height;
  tryBuild(px, py);
}, { passive: true });

start();
