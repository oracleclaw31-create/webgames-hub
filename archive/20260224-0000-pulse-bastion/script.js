(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const hud = document.getElementById('hud');
  const placeBtn = document.getElementById('placeBtn');
  const upgradeBtn = document.getElementById('upgradeBtn');
  const sellBtn = document.getElementById('sellBtn');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');

  const W = canvas.width, H = canvas.height;
  const grid = { cols: 12, rows: 7, x: 60, y: 80, cell: 60 };
  const pathRow = 3;

  let cursor = { c: 2, r: 2 };
  let towers = [];
  let enemies = [];
  let projectiles = [];
  let wave = 0, life = 20, credits = 140, score = 0;
  let waveRunning = false;

  const keys = new Set();

  function cellToXY(c, r) { return { x: grid.x + c * grid.cell + grid.cell / 2, y: grid.y + r * grid.cell + grid.cell / 2 }; }
  function inBuildZone(c, r) { return r !== pathRow && c >= 0 && r >= 0 && c < grid.cols && r < grid.rows; }
  function towerAt(c, r) { return towers.find(t => t.c === c && t.r === r); }

  function placeTower() {
    if (!inBuildZone(cursor.c, cursor.r) || towerAt(cursor.c, cursor.r) || credits < 50) return;
    towers.push({ c: cursor.c, r: cursor.r, lvl: 1, cooldown: 0, range: 120, rate: 0.7, dmg: 8 });
    credits -= 50;
  }

  function upgradeTower() {
    const t = towerAt(cursor.c, cursor.r);
    if (!t) return;
    const cost = 35 * t.lvl;
    if (credits < cost || t.lvl >= 3) return;
    credits -= cost;
    t.lvl += 1; t.dmg += 5; t.rate += 0.2; t.range += 10;
  }

  function sellTower() {
    const idx = towers.findIndex(t => t.c === cursor.c && t.r === cursor.r);
    if (idx < 0) return;
    const t = towers[idx];
    credits += 20 + 20 * t.lvl;
    towers.splice(idx, 1);
  }

  function startWave() {
    if (waveRunning) return;
    wave += 1; waveRunning = true;
    const count = 6 + wave * 2;
    for (let i = 0; i < count; i++) {
      enemies.push({ x: grid.x - i * 45, y: cellToXY(0, pathRow).y, hp: 20 + wave * 8, maxHp: 20 + wave * 8, spd: 35 + wave * 5 });
    }
  }

  function update(dt) {
    if (keys.has('ArrowLeft') || keys.has('a')) cursor.c = Math.max(0, cursor.c - dt * 8);
    if (keys.has('ArrowRight') || keys.has('d')) cursor.c = Math.min(grid.cols - 1, cursor.c + dt * 8);
    if (keys.has('ArrowUp') || keys.has('w')) cursor.r = Math.max(0, cursor.r - dt * 8);
    if (keys.has('ArrowDown') || keys.has('s')) cursor.r = Math.min(grid.rows - 1, cursor.r + dt * 8);

    for (const t of towers) {
      t.cooldown -= dt;
      if (t.cooldown <= 0) {
        const p = cellToXY(t.c, t.r);
        let target = null, best = 1e9;
        for (const e of enemies) {
          const dx = e.x - p.x, dy = e.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < t.range && d < best) { best = d; target = e; }
        }
        if (target) {
          t.cooldown = 1 / t.rate;
          projectiles.push({ x: p.x, y: p.y, tx: target, spd: 260, dmg: t.dmg });
        }
      }
    }

    for (const e of enemies) e.x += e.spd * dt;
    enemies = enemies.filter(e => {
      if (e.x > grid.x + grid.cols * grid.cell + 20) { life -= 1; return false; }
      return e.hp > 0;
    });

    for (const b of projectiles) {
      if (!b.tx || b.tx.hp <= 0) { b.dead = true; continue; }
      const dx = b.tx.x - b.x, dy = b.tx.y - b.y;
      const d = Math.hypot(dx, dy);
      if (d < 8) { b.tx.hp -= b.dmg; b.dead = true; if (b.tx.hp <= 0) { score += 10; credits += 8; } continue; }
      b.x += (dx / d) * b.spd * dt; b.y += (dy / d) * b.spd * dt;
    }
    projectiles = projectiles.filter(b => !b.dead);

    if (waveRunning && enemies.length === 0) { waveRunning = false; credits += 25 + wave * 3; }
    if (life <= 0) { waveRunning = false; }

    cursor.c = Math.round(cursor.c); cursor.r = Math.round(cursor.r);
  }

  function draw() {
    ctx.fillStyle = '#040c14'; ctx.fillRect(0, 0, W, H);
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const x = grid.x + c * grid.cell, y = grid.y + r * grid.cell;
        ctx.fillStyle = r === pathRow ? '#5a2a2a' : '#112538';
        ctx.fillRect(x + 1, y + 1, grid.cell - 2, grid.cell - 2);
      }
    }

    for (const t of towers) {
      const p = cellToXY(t.c, t.r);
      ctx.fillStyle = ['#58b6ff', '#4be190', '#f6c35f'][t.lvl - 1];
      ctx.beginPath(); ctx.arc(p.x, p.y, 14 + t.lvl * 2, 0, Math.PI * 2); ctx.fill();
    }

    for (const e of enemies) {
      ctx.fillStyle = '#ff7676'; ctx.fillRect(e.x - 12, e.y - 12, 24, 24);
      ctx.fillStyle = '#111'; ctx.fillRect(e.x - 12, e.y - 18, 24, 4);
      ctx.fillStyle = '#72ff95'; ctx.fillRect(e.x - 12, e.y - 18, 24 * (e.hp / e.maxHp), 4);
    }

    ctx.fillStyle = '#ffe08a';
    for (const b of projectiles) { ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); }

    const cx = grid.x + cursor.c * grid.cell, cy = grid.y + cursor.r * grid.cell;
    ctx.strokeStyle = '#38c7ff'; ctx.lineWidth = 3; ctx.strokeRect(cx + 2, cy + 2, grid.cell - 4, grid.cell - 4);

    hud.textContent = `Wave ${wave}/6 | Life ${life} | Credits ${credits} | Score ${score} | ${waveRunning ? 'Defending...' : 'Build phase'}`;
    if (life <= 0) hud.textContent += ' | GAME OVER (R to restart)';
    if (wave >= 6 && !waveRunning && life > 0) hud.textContent += ' | CLEAR!';
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    update(dt); draw(); requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys.add(k);
    if (e.key === ' ') placeTower();
    if (k === 'u') upgradeTower();
    if (k === 'x') sellTower();
    if (e.key === 'Enter') startWave();
    if (k === 'r') location.reload();
  });
  window.addEventListener('keyup', (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys.delete(k); });

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    cursor.c = Math.max(0, Math.min(grid.cols - 1, Math.floor((x - grid.x) / grid.cell)));
    cursor.r = Math.max(0, Math.min(grid.rows - 1, Math.floor((y - grid.y) / grid.cell)));
    placeTower();
  });

  placeBtn.addEventListener('click', placeTower);
  upgradeBtn.addEventListener('click', upgradeTower);
  sellBtn.addEventListener('click', sellTower);
  startBtn.addEventListener('click', startWave);
  restartBtn.addEventListener('click', () => location.reload());

  requestAnimationFrame(loop);
})();
