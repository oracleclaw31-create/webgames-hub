(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const forgeBtn = document.getElementById('forgeBtn');
  const restartBtn = document.getElementById('restartBtn');

  const W = canvas.width;
  const H = canvas.height;

  const state = {
    running: true,
    score: 0,
    combo: 0,
    heat: 70,
    integrity: 100,
    bladeProgress: 0,
    bladesForged: 0,
    beatMs: 650,
    timingWindow: 130,
    phrase: [],
    stepIndex: 0,
    stepStartTime: 0,
    awaitingRelease: false,
    heldFrom: 0,
    holdTargetMs: 0,
    feedback: 'Press and hold FORGE on beat.',
    feedbackColor: '#f2efe9',
    sparks: [],
    lastTs: performance.now(),
    pointerHeld: false,
    keyHeld: false,
  };

  function makePhrase() {
    const patterns = [
      [
        { type: 'tap', label: 'TAP' },
        { type: 'hold', label: 'HOLD 1', beats: 1 },
        { type: 'release', label: 'RELEASE' },
        { type: 'tap', label: 'TAP' },
        { type: 'hold', label: 'HOLD 2', beats: 2 },
        { type: 'release', label: 'RELEASE' },
      ],
      [
        { type: 'tap', label: 'TAP' },
        { type: 'tap', label: 'TAP' },
        { type: 'hold', label: 'HOLD 2', beats: 2 },
        { type: 'release', label: 'RELEASE' },
        { type: 'tap', label: 'TAP' },
        { type: 'hold', label: 'HOLD 1', beats: 1 },
        { type: 'release', label: 'RELEASE' },
      ],
      [
        { type: 'hold', label: 'HOLD 1', beats: 1 },
        { type: 'release', label: 'RELEASE' },
        { type: 'tap', label: 'TAP' },
        { type: 'hold', label: 'HOLD 3', beats: 3 },
        { type: 'release', label: 'RELEASE' },
      ],
    ];
    return patterns[(Math.random() * patterns.length) | 0].map((s) => ({ ...s }));
  }

  function restart() {
    state.running = true;
    state.score = 0;
    state.combo = 0;
    state.heat = 70;
    state.integrity = 100;
    state.bladeProgress = 0;
    state.bladesForged = 0;
    state.beatMs = 650;
    state.timingWindow = 130;
    state.phrase = makePhrase();
    state.stepIndex = 0;
    state.stepStartTime = performance.now() + state.beatMs;
    state.awaitingRelease = false;
    state.heldFrom = 0;
    state.holdTargetMs = 0;
    state.feedback = 'Press and hold FORGE on beat.';
    state.feedbackColor = '#f2efe9';
    state.sparks = [];
    state.pointerHeld = false;
    state.keyHeld = false;
  }

  function activeHeld() {
    return state.pointerHeld || state.keyHeld;
  }

  function spawnSparks(color, amount = 10) {
    for (let i = 0; i < amount; i++) {
      state.sparks.push({
        x: W * 0.5,
        y: H * 0.45,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 1,
        life: 25 + Math.random() * 20,
        color,
      });
    }
  }

  function judge(diffMs) {
    const ad = Math.abs(diffMs);
    if (ad <= 45) return { tier: 'Perfect', points: 240, color: '#44d27b', combo: 1 };
    if (ad <= 90) return { tier: 'Great', points: 150, color: '#89e66a', combo: 1 };
    if (ad <= state.timingWindow) return { tier: 'Good', points: 90, color: '#ffd166', combo: 1 };
    return null;
  }

  function success(j, text) {
    state.combo += j.combo;
    const multi = 1 + Math.min(2, state.combo * 0.06);
    state.score += Math.round(j.points * multi);
    state.heat = Math.min(100, state.heat + 6);
    state.bladeProgress = Math.min(100, state.bladeProgress + 9 + state.combo * 0.35);
    state.feedback = `${j.tier} ${text}`;
    state.feedbackColor = j.color;
    spawnSparks(j.color, j.tier === 'Perfect' ? 18 : 10);
  }

  function fail(reason) {
    state.combo = 0;
    state.integrity -= 12;
    state.heat = Math.max(0, state.heat - 10);
    state.feedback = reason;
    state.feedbackColor = '#ff5c5c';
    spawnSparks('#ff5c5c', 9);
    if (state.integrity <= 0) {
      state.running = false;
      state.feedback = 'Forge shattered. Press R or RESTART.';
    }
  }

  function advanceStep(now) {
    state.stepIndex += 1;
    state.awaitingRelease = false;
    state.heldFrom = 0;
    state.holdTargetMs = 0;
    if (state.stepIndex >= state.phrase.length) {
      state.bladesForged += 1;
      state.score += 400;
      state.feedback = `Blade ${state.bladesForged} forged!`; 
      state.feedbackColor = '#8be9fd';
      state.stepIndex = 0;
      state.phrase = makePhrase();
      state.bladeProgress = Math.max(0, state.bladeProgress - 25);
      state.beatMs = Math.max(430, state.beatMs - 14);
      state.timingWindow = Math.max(90, state.timingWindow - 2);
      spawnSparks('#8be9fd', 22);
    }
    state.stepStartTime = now + state.beatMs;
  }

  function handlePress(now) {
    if (!state.running) return;
    const step = state.phrase[state.stepIndex];
    const diff = now - state.stepStartTime;

    if (step.type === 'tap') {
      const j = judge(diff);
      if (j) {
        success(j, 'tap');
        advanceStep(now);
      } else if (Math.abs(diff) > state.timingWindow) {
        fail('Missed tap timing');
        advanceStep(now);
      }
      return;
    }

    if (step.type === 'hold') {
      const j = judge(diff);
      if (j) {
        state.awaitingRelease = true;
        state.heldFrom = now;
        state.holdTargetMs = step.beats * state.beatMs;
        state.feedback = `${j.tier} hold start`; 
        state.feedbackColor = j.color;
        state.score += Math.round(70 * (1 + state.combo * 0.05));
      } else if (Math.abs(diff) > state.timingWindow) {
        fail('Late/early hold start');
        advanceStep(now);
      }
      return;
    }

    if (step.type === 'release') {
      fail('Release, do not press');
      advanceStep(now);
    }
  }

  function handleRelease(now) {
    if (!state.running) return;
    const step = state.phrase[state.stepIndex];
    if (step.type !== 'release' || !state.awaitingRelease) return;
    const target = state.stepStartTime;
    const diff = now - target;
    const heldDur = now - state.heldFrom;
    const holdErr = Math.abs(heldDur - state.holdTargetMs);
    const j = judge(diff);

    if (j && holdErr <= Math.max(70, state.timingWindow)) {
      success(j, `release (${Math.round(heldDur)}ms)`);
    } else {
      fail('Hold/release timing mismatch');
    }
    advanceStep(now);
  }

  function update(now) {
    const dt = Math.min(33, now - state.lastTs);
    state.lastTs = now;

    if (state.running) {
      state.heat = Math.max(0, state.heat - dt * 0.006);
      if (state.heat <= 2) {
        state.integrity -= dt * 0.02;
      }
      if (state.integrity <= 0) {
        state.integrity = 0;
        state.running = false;
        state.feedback = 'Forge went cold. Press R or RESTART.';
        state.feedbackColor = '#ff5c5c';
      }

      const step = state.phrase[state.stepIndex];
      const missBy = now - state.stepStartTime;
      if (!activeHeld() && Math.abs(missBy) > state.timingWindow + 60 && (step.type === 'tap' || step.type === 'hold')) {
        fail('Timing window missed');
        advanceStep(now);
      }
      if (state.awaitingRelease && step.type === 'release' && now - state.stepStartTime > state.timingWindow + 130) {
        fail('Missed release window');
        advanceStep(now);
      }

      if (state.bladeProgress >= 100) {
        state.bladeProgress = 0;
        state.score += 250;
        state.feedback = 'Master temper bonus +250';
        state.feedbackColor = '#7ce0ff';
        spawnSparks('#7ce0ff', 16);
      }
    }

    state.sparks = state.sparks.filter((s) => {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.13;
      s.life -= 1;
      return s.life > 0;
    });
  }

  function drawMeter(x, y, w, h, value, color, label) {
    ctx.fillStyle = '#1f2731';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, (w * Math.max(0, Math.min(100, value))) / 100, h);
    ctx.strokeStyle = '#44515f';
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#f2efe9';
    ctx.font = '14px Trebuchet MS';
    ctx.fillText(`${label}: ${Math.round(value)}`, x, y - 6);
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0b1421');
    grad.addColorStop(1, '#211107');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#2a1f14';
    ctx.fillRect(0, H * 0.72, W, H * 0.28);

    const centerX = W * 0.5;
    const centerY = H * 0.45;

    ctx.save();
    const pulse = Math.sin(now * 0.01) * 5;
    ctx.strokeStyle = '#ffad5a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 70 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffd6a1';
    ctx.lineWidth = 2;
    const beatDiff = state.stepStartTime - now;
    const ratio = Math.max(0, Math.min(1, Math.abs(beatDiff) / state.beatMs));
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40 + ratio * 90, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = activeHeld() ? '#ff9f43' : '#704126';
    ctx.fillRect(centerX - 66, centerY - 18, 132, 36);
    ctx.fillStyle = '#2e1707';
    ctx.fillRect(centerX - 56, centerY - 8, 112, 16);

    for (const s of state.sparks) {
      ctx.globalAlpha = Math.max(0, s.life / 35);
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, 3, 3);
    }
    ctx.globalAlpha = 1;

    drawMeter(20, 38, 220, 16, state.heat, '#ff9f43', 'Heat');
    drawMeter(20, 86, 220, 16, state.integrity, '#ff5c5c', 'Integrity');
    drawMeter(20, 134, 220, 16, state.bladeProgress, '#44d27b', 'Blade');

    const step = state.phrase[state.stepIndex];
    ctx.fillStyle = '#f2efe9';
    ctx.font = 'bold 22px Trebuchet MS';
    ctx.fillText(`Score: ${state.score}`, 20, 198);
    ctx.fillText(`Combo: x${state.combo}`, 20, 230);
    ctx.fillText(`Blades Forged: ${state.bladesForged}`, 20, 262);

    ctx.font = 'bold 30px Trebuchet MS';
    ctx.fillStyle = '#ffd6a1';
    ctx.fillText(step.label, centerX - 80, 94);

    ctx.font = '16px Trebuchet MS';
    ctx.fillStyle = state.feedbackColor;
    ctx.fillText(state.feedback, centerX - 170, 124);

    const panelX = W - 310;
    ctx.fillStyle = '#101821';
    ctx.fillRect(panelX, 30, 280, 180);
    ctx.strokeStyle = '#3a4757';
    ctx.strokeRect(panelX, 30, 280, 180);
    ctx.fillStyle = '#dfe8f2';
    ctx.font = 'bold 18px Trebuchet MS';
    ctx.fillText('Pattern', panelX + 18, 58);

    ctx.font = '14px Trebuchet MS';
    for (let i = 0; i < state.phrase.length; i++) {
      const y = 84 + i * 22;
      const token = state.phrase[i].label;
      ctx.fillStyle = i === state.stepIndex ? '#ff9f43' : '#8ca1b6';
      ctx.fillText(`${i + 1}. ${token}`, panelX + 18, y);
    }

    ctx.fillStyle = '#d6dde8';
    ctx.fillText(`Beat: ${Math.round(state.beatMs)}ms`, panelX + 18, 166);
    ctx.fillText(`Window: +/-${state.timingWindow}ms`, panelX + 18, 188);

    if (!state.running) {
      ctx.fillStyle = 'rgba(0,0,0,0.56)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffe6c8';
      ctx.font = 'bold 38px Trebuchet MS';
      ctx.fillText('Forge Failed', centerX - 120, centerY - 8);
      ctx.font = '20px Trebuchet MS';
      ctx.fillText('Press R or RESTART to try again', centerX - 150, centerY + 28);
    }
  }

  function loop(ts) {
    update(ts);
    draw(ts);
    requestAnimationFrame(loop);
  }

  function setHeld(v, source) {
    if (source === 'pointer') state.pointerHeld = v;
    if (source === 'key') state.keyHeld = v;
  }

  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'Space') {
      e.preventDefault();
      setHeld(true, 'key');
      handlePress(performance.now());
    }
    if (e.code === 'KeyR') {
      restart();
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      setHeld(false, 'key');
      handleRelease(performance.now());
    }
  });

  function bindPressAndHold(el) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      setHeld(true, 'pointer');
      handlePress(performance.now());
    });
    const up = (e) => {
      e.preventDefault();
      setHeld(false, 'pointer');
      handleRelease(performance.now());
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  }

  bindPressAndHold(forgeBtn);
  bindPressAndHold(canvas);
  restartBtn.addEventListener('click', restart);

  restart();
  requestAnimationFrame(loop);
})();
