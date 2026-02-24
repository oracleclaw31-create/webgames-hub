(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const waveEl = document.getElementById('wave');
  const lifeEl = document.getElementById('life');
  const goldEl = document.getElementById('gold');
  const statusEl = document.getElementById('status');

  const btnBolt = document.getElementById('btnBolt');
  const btnBlast = document.getElementById('btnBlast');
  const btnUpgrade = document.getElementById('btnUpgrade');
  const btnWave = document.getElementById('btnWave');
  const btnRestart = document.getElementById('btnRestart');

  const path = [
    { x: 20, y: 110 },
    { x: 220, y: 110 },
    { x: 220, y: 250 },
    { x: 430, y: 250 },
    { x: 430, y: 420 },
    { x: 700, y: 420 },
    { x: 700, y: 220 },
    { x: 940, y: 220 }
  ];

  const pads = [
    { x: 140, y: 180, turret: null, level: 0 },
    { x: 310, y: 120, turret: null, level: 0 },
    { x: 335, y: 300, turret: null, level: 0 },
    { x: 520, y: 190, turret: null, level: 0 },
    { x: 520, y: 350, turret: null, level: 0 },
    { x: 640, y: 360, turret: null, level: 0 },
    { x: 780, y: 360, turret: null, level: 0 },
    { x: 810, y: 160, turret: null, level: 0 }
  ];

  const turretDefs = {
    bolt: { cost: 50, range: 145, damage: 18, cooldown: 0.42, color: '#77e6ff' },
    blast: { cost: 80, range: 110, damage: 28, cooldown: 0.9, splash: 55, color: '#ffb870' }
  };

  let state;

  function resetGame() {
    state = {
      wave: 1,
      coreHp: 20,
      scrap: 120,
      selectedType: 'bolt',
      selectedPad: 0,
      enemies: [],
      projectiles: [],
      fx: [],
      spawnQueue: 0,
      spawnTimer: 0,
      waveActive: false,
      gameOver: false,
      winTick: 0
    };

    for (const pad of pads) {
      pad.turret = null;
      pad.level = 0;
      pad.cooldown = 0;
    }

    updateHud();
    setStatus('Protect the reactor from ember swarms.');
    syncButtons();
  }

  function updateHud() {
    waveEl.textContent = String(state.wave);
    lifeEl.textContent = String(state.coreHp);
    goldEl.textContent = String(state.scrap);
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function syncButtons() {
    btnBolt.classList.toggle('active', state.selectedType === 'bolt');
    btnBlast.classList.toggle('active', state.selectedType === 'blast');
  }

  function startWave() {
    if (state.gameOver || state.waveActive) {
      return;
    }

    const baseCount = 7 + state.wave * 2;
    state.spawnQueue = baseCount;
    state.spawnTimer = 0;
    state.waveActive = true;
    setStatus(`Wave ${state.wave} inbound. Hold the line.`);
  }

  function spawnEnemy() {
    const hp = 32 + state.wave * 10;
    state.enemies.push({
      x: path[0].x,
      y: path[0].y,
      hp,
      maxHp: hp,
      speed: 48 + state.wave * 4,
      segment: 0,
      radius: 11
    });
  }

  function placeTurret(padIndex) {
    if (state.gameOver) {
      return;
    }

    const pad = pads[padIndex];
    state.selectedPad = padIndex;
    const def = turretDefs[state.selectedType];

    if (pad.turret) {
      setStatus('Pad occupied. Choose another tile.');
      return;
    }

    if (state.scrap < def.cost) {
      setStatus('Not enough scrap. Survive for rewards.');
      return;
    }

    state.scrap -= def.cost;
    pad.turret = state.selectedType;
    pad.level = 1;
    pad.cooldown = 0;
    updateHud();
    setStatus(`${capitalize(state.selectedType)} turret deployed.`);
  }

  function tryUpgradeSelected() {
    if (state.gameOver) {
      return;
    }

    const pad = pads[state.selectedPad];
    if (!pad || !pad.turret) {
      setStatus('Select a built turret to upgrade.');
      return;
    }
    if (pad.level >= 3) {
      setStatus('Turret already at max level.');
      return;
    }

    const cost = 35 + pad.level * 20;
    if (state.scrap < cost) {
      setStatus(`Need ${cost} scrap to upgrade.`);
      return;
    }

    state.scrap -= cost;
    pad.level += 1;
    updateHud();
    setStatus(`Upgraded to Lv.${pad.level}.`);
  }

  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function findTarget(px, py, range) {
    let best = null;
    let bestDist = range;
    for (const e of state.enemies) {
      const d = Math.hypot(e.x - px, e.y - py);
      if (d <= bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  function update(dt) {
    if (state.gameOver) {
      state.winTick += dt;
      return;
    }

    if (state.waveActive) {
      state.spawnTimer -= dt;
      if (state.spawnQueue > 0 && state.spawnTimer <= 0) {
        spawnEnemy();
        state.spawnQueue -= 1;
        state.spawnTimer = 0.48;
      }
    }

    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const e = state.enemies[i];
      let next = path[e.segment + 1];
      if (!next) {
        state.coreHp -= 1;
        state.enemies.splice(i, 1);
        state.fx.push({ x: e.x, y: e.y, t: 0.35, color: '#ff6b6b', r: 10 });
        if (state.coreHp <= 0) {
          state.coreHp = 0;
          state.gameOver = true;
          setStatus('Reactor breached. Press R to restart.');
        }
        updateHud();
        continue;
      }

      const dx = next.x - e.x;
      const dy = next.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      const step = e.speed * dt;
      if (step >= dist) {
        e.x = next.x;
        e.y = next.y;
        e.segment += 1;
      } else {
        e.x += (dx / dist) * step;
        e.y += (dy / dist) * step;
      }
    }

    for (const pad of pads) {
      if (!pad.turret) {
        continue;
      }
      pad.cooldown -= dt;
      const def = turretDefs[pad.turret];
      const levelScale = 1 + (pad.level - 1) * 0.35;
      const target = findTarget(pad.x, pad.y, def.range + (pad.level - 1) * 10);

      if (target && pad.cooldown <= 0) {
        const damage = def.damage * levelScale;
        const speed = pad.turret === 'bolt' ? 440 : 360;
        state.projectiles.push({
          x: pad.x,
          y: pad.y,
          tx: target.x,
          ty: target.y,
          damage,
          speed,
          splash: def.splash || 0,
          color: def.color,
          life: 1.8
        });
        pad.cooldown = def.cooldown / Math.max(1, 0.94 + (pad.level - 1) * 0.08);
      }
    }

    for (let i = state.projectiles.length - 1; i >= 0; i -= 1) {
      const p = state.projectiles[i];
      p.life -= dt;
      let hit = false;

      const target = findClosestEnemy(p.x, p.y);
      if (target) {
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const dist = Math.hypot(dx, dy) || 1;
        const step = p.speed * dt;
        if (step >= dist) {
          hit = true;
          applyDamage(target.x, target.y, p.damage, p.splash);
        } else {
          p.x += (dx / dist) * step;
          p.y += (dy / dist) * step;
        }
      }

      if (hit || p.life <= 0) {
        state.projectiles.splice(i, 1);
      }
    }

    for (let i = state.fx.length - 1; i >= 0; i -= 1) {
      state.fx[i].t -= dt;
      if (state.fx[i].t <= 0) {
        state.fx.splice(i, 1);
      }
    }

    if (state.waveActive && state.spawnQueue === 0 && state.enemies.length === 0) {
      state.scrap += 40 + state.wave * 8;
      state.wave += 1;
      state.waveActive = false;
      updateHud();
      setStatus('Wave cleared. Build and send next wave.');
      if (state.wave > 12) {
        state.gameOver = true;
        setStatus('All swarms neutralized. Press R to play again.');
      }
    }
  }

  function findClosestEnemy(x, y) {
    let best = null;
    let bestDist = Infinity;
    for (const e of state.enemies) {
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < bestDist) {
        best = e;
        bestDist = d;
      }
    }
    return best;
  }

  function applyDamage(x, y, damage, splash) {
    if (splash > 0) {
      for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
        const e = state.enemies[i];
        if (Math.hypot(e.x - x, e.y - y) <= splash) {
          e.hp -= damage;
          if (e.hp <= 0) {
            killEnemy(i);
          }
        }
      }
      state.fx.push({ x, y, t: 0.22, color: '#ffb870', r: splash * 0.35 });
      return;
    }

    const target = findClosestEnemy(x, y);
    if (!target) {
      return;
    }
    target.hp -= damage;
    state.fx.push({ x, y, t: 0.15, color: '#77e6ff', r: 10 });

    if (target.hp <= 0) {
      const idx = state.enemies.indexOf(target);
      if (idx >= 0) {
        killEnemy(idx);
      }
    }
  }

  function killEnemy(idx) {
    const e = state.enemies[idx];
    state.enemies.splice(idx, 1);
    state.scrap += 12;
    state.fx.push({ x: e.x, y: e.y, t: 0.28, color: '#ffd166', r: 14 });
    updateHud();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#111a2f');
    grad.addColorStop(1, '#0a1020');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawPath();
    drawPads();
    drawTurrets();
    drawEnemies();
    drawProjectiles();
    drawEffects();
  }

  function drawPath() {
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#3a2a24';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i += 1) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#9f5f3f';
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i += 1) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#9ae6b4';
    ctx.beginPath();
    ctx.arc(path[0].x, path[0].y, 8, 0, Math.PI * 2);
    ctx.fill();

    const end = path[path.length - 1];
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8dbb0';
    ctx.font = '13px Trebuchet MS';
    ctx.fillText('Spawn', path[0].x - 22, path[0].y - 16);
    ctx.fillText('Reactor', end.x - 24, end.y - 18);
  }

  function drawPads() {
    for (let i = 0; i < pads.length; i += 1) {
      const pad = pads[i];
      const selected = i === state.selectedPad;
      ctx.fillStyle = pad.turret ? '#314a72' : '#1f2a40';
      ctx.strokeStyle = selected ? '#ffd166' : '#5d709f';
      ctx.lineWidth = selected ? 3 : 2;
      ctx.beginPath();
      ctx.arc(pad.x, pad.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (pad.turret) {
        ctx.fillStyle = pad.turret === 'bolt' ? '#77e6ff' : '#ffb870';
        ctx.beginPath();
        ctx.arc(pad.x, pad.y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f5f7ff';
        ctx.font = '12px Trebuchet MS';
        ctx.fillText(`L${pad.level}`, pad.x - 9, pad.y + 34);
      }
    }
  }

  function drawTurrets() {
    for (const pad of pads) {
      if (!pad.turret) {
        continue;
      }
      const target = findTarget(pad.x, pad.y, turretDefs[pad.turret].range + (pad.level - 1) * 10);
      if (!target) {
        continue;
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pad.x, pad.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    }
  }

  function drawEnemies() {
    for (const e of state.enemies) {
      const body = ctx.createRadialGradient(e.x - 3, e.y - 4, 2, e.x, e.y, 14);
      body.addColorStop(0, '#ffe0a6');
      body.addColorStop(1, '#e35f46');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();

      const hpRatio = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = '#2a354f';
      ctx.fillRect(e.x - 13, e.y - 19, 26, 4);
      ctx.fillStyle = hpRatio > 0.5 ? '#76e38b' : '#ff7b6d';
      ctx.fillRect(e.x - 13, e.y - 19, 26 * hpRatio, 4);
    }
  }

  function drawProjectiles() {
    for (const p of state.projectiles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.splash ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawEffects() {
    for (const fx of state.fx) {
      const alpha = Math.max(0, fx.t / 0.35);
      ctx.strokeStyle = hexToRgba(fx.color, alpha);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.r + (1 - alpha) * 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
  }

  function selectPadByDirection(dx, dy) {
    const current = pads[state.selectedPad];
    let best = state.selectedPad;
    let bestScore = Infinity;

    for (let i = 0; i < pads.length; i += 1) {
      if (i === state.selectedPad) {
        continue;
      }
      const p = pads[i];
      const vx = p.x - current.x;
      const vy = p.y - current.y;
      const dot = vx * dx + vy * dy;
      if (dot <= 0) {
        continue;
      }
      const dist = Math.hypot(vx, vy);
      const score = dist - dot * 0.2;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }

    state.selectedPad = best;
  }

  function canvasPoint(ev) {
    const rect = canvas.getBoundingClientRect();
    const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
    const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * sx,
      y: (clientY - rect.top) * sy
    };
  }

  function onCanvasTap(ev) {
    ev.preventDefault();
    const pt = canvasPoint(ev);
    let found = -1;
    for (let i = 0; i < pads.length; i += 1) {
      if (Math.hypot(pt.x - pads[i].x, pt.y - pads[i].y) <= 26) {
        found = i;
        break;
      }
    }

    if (found >= 0) {
      if (pads[found].turret) {
        state.selectedPad = found;
        setStatus('Selected turret. Press U to upgrade.');
      } else {
        placeTurret(found);
      }
      return;
    }

    startWave();
  }

  document.addEventListener('keydown', (ev) => {
    if (ev.repeat) {
      return;
    }

    if (ev.key === '1') {
      state.selectedType = 'bolt';
      syncButtons();
      return;
    }
    if (ev.key === '2') {
      state.selectedType = 'blast';
      syncButtons();
      return;
    }

    if (ev.key === 'ArrowLeft') {
      selectPadByDirection(-1, 0);
      ev.preventDefault();
    } else if (ev.key === 'ArrowRight') {
      selectPadByDirection(1, 0);
      ev.preventDefault();
    } else if (ev.key === 'ArrowUp') {
      selectPadByDirection(0, -1);
      ev.preventDefault();
    } else if (ev.key === 'ArrowDown') {
      selectPadByDirection(0, 1);
      ev.preventDefault();
    } else if (ev.key === 'Enter') {
      placeTurret(state.selectedPad);
      ev.preventDefault();
    } else if (ev.key === ' ') {
      startWave();
      ev.preventDefault();
    } else if (ev.key.toLowerCase() === 'u') {
      tryUpgradeSelected();
    } else if (ev.key.toLowerCase() === 'r') {
      resetGame();
    }
  });

  btnBolt.addEventListener('click', () => {
    state.selectedType = 'bolt';
    syncButtons();
  });

  btnBlast.addEventListener('click', () => {
    state.selectedType = 'blast';
    syncButtons();
  });

  btnWave.addEventListener('click', () => {
    startWave();
  });

  btnUpgrade.addEventListener('click', () => {
    tryUpgradeSelected();
  });

  btnRestart.addEventListener('click', () => {
    resetGame();
  });

  canvas.addEventListener('click', onCanvasTap);
  canvas.addEventListener('touchstart', onCanvasTap, { passive: false });

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(tick);
  }

  resetGame();
  requestAnimationFrame(tick);
})();
