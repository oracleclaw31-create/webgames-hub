(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("status");
  const touchRoot = document.getElementById("touchControls");

  const W = canvas.width;
  const H = canvas.height;

  const state = {
    running: true,
    won: false,
    score: 0,
    lives: 3,
    stage: 1,
    energy: 0,
    keys: { left: false, right: false },
    touch: { left: false, right: false },
    launchQueued: false,
    pulseQueued: false,
    paddle: {
      x: W / 2,
      y: H - 34,
      w: 148,
      h: 16,
      speed: 560
    },
    ball: {
      x: W / 2,
      y: H - 56,
      vx: 220,
      vy: -320,
      r: 8,
      stuck: true,
      minSpeed: 290,
      maxSpeed: 760
    },
    orbit: {
      angle: 0,
      radius: 0,
      active: false,
      timer: 0,
      cooldown: 0
    },
    bricks: [],
    particles: []
  };

  function buildStage(stage) {
    const rows = Math.min(5 + stage, 8);
    const cols = 12;
    const marginX = 52;
    const top = 72;
    const gap = 7;
    const bw = (W - marginX * 2 - gap * (cols - 1)) / cols;
    const bh = 22;
    const palette = ["#6fd9ff", "#ffc86a", "#ff7fb0", "#8dff9a"];

    state.bricks = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const hp = 1 + Number((r + c + stage) % 5 === 0);
        state.bricks.push({
          x: marginX + c * (bw + gap),
          y: top + r * (bh + gap),
          w: bw,
          h: bh,
          hp,
          color: palette[(r + c) % palette.length]
        });
      }
    }
  }

  function resetBall(afterLoss) {
    const b = state.ball;
    b.x = state.paddle.x;
    b.y = state.paddle.y - 18;
    b.vx = (Math.random() < 0.5 ? -1 : 1) * (220 + state.stage * 18);
    b.vy = -(300 + state.stage * 24);
    b.stuck = true;

    state.orbit.active = false;
    state.orbit.radius = 0;
    state.orbit.timer = 0;
    if (afterLoss) {
      state.energy = Math.max(0, state.energy - 35);
    }
  }

  function normalizeBallSpeed() {
    const b = state.ball;
    const speed = Math.hypot(b.vx, b.vy);
    if (speed < b.minSpeed) {
      const k = b.minSpeed / Math.max(speed, 1);
      b.vx *= k;
      b.vy *= k;
    }
    if (speed > b.maxSpeed) {
      const k = b.maxSpeed / speed;
      b.vx *= k;
      b.vy *= k;
    }
  }

  function queuePulse() {
    state.pulseQueued = true;
  }

  function activateOrbit() {
    if (!state.running || state.orbit.cooldown > 0 || state.energy < 100) {
      return;
    }
    state.energy = 0;
    state.orbit.active = true;
    state.orbit.timer = 2.7;
    state.orbit.cooldown = 5.2;
    state.orbit.radius = 64;
  }

  function applyInput(dt) {
    const moveLeft = state.keys.left || state.touch.left;
    const moveRight = state.keys.right || state.touch.right;
    const p = state.paddle;

    if (moveLeft) p.x -= p.speed * dt;
    if (moveRight) p.x += p.speed * dt;
    p.x = Math.max(p.w / 2, Math.min(W - p.w / 2, p.x));

    if (state.ball.stuck) {
      state.ball.x = p.x;
      state.ball.y = p.y - 18;
    }

    if (state.launchQueued) {
      state.launchQueued = false;
      state.ball.stuck = false;
    }

    if (state.pulseQueued) {
      state.pulseQueued = false;
      activateOrbit();
    }
  }

  function collidePaddle() {
    const b = state.ball;
    const p = state.paddle;
    if (b.vy <= 0) return;

    const hitX = b.x > p.x - p.w / 2 && b.x < p.x + p.w / 2;
    const hitY = b.y + b.r > p.y - p.h / 2 && b.y + b.r < p.y + p.h;
    if (!hitX || !hitY) return;

    const ratio = (b.x - p.x) / (p.w / 2);
    b.vy = -Math.abs(b.vy);
    b.vx += ratio * 260;
    state.score += 1;
  }

  function spawnSpark(x, y, color) {
    for (let i = 0; i < 8; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const s = 45 + Math.random() * 120;
      state.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.28 + Math.random() * 0.2,
        t: 0,
        color
      });
    }
  }

  function collideBricks() {
    const b = state.ball;
    for (let i = state.bricks.length - 1; i >= 0; i -= 1) {
      const brick = state.bricks[i];
      if (
        b.x + b.r < brick.x ||
        b.x - b.r > brick.x + brick.w ||
        b.y + b.r < brick.y ||
        b.y - b.r > brick.y + brick.h
      ) {
        continue;
      }

      const overlapL = Math.abs(b.x + b.r - brick.x);
      const overlapR = Math.abs(brick.x + brick.w - (b.x - b.r));
      const overlapT = Math.abs(b.y + b.r - brick.y);
      const overlapB = Math.abs(brick.y + brick.h - (b.y - b.r));
      const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);
      if (minOverlap === overlapL || minOverlap === overlapR) b.vx *= -1;
      else b.vy *= -1;

      brick.hp -= 1;
      state.energy = Math.min(100, state.energy + 8);
      state.score += 14;

      if (brick.hp <= 0) {
        state.bricks.splice(i, 1);
        state.score += 26;
        spawnSpark(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color);
      }
      return;
    }
  }

  function orbitSweep(dt) {
    if (!state.orbit.active) return;

    state.orbit.timer -= dt;
    state.orbit.angle += dt * 7.6;
    state.orbit.radius = 64 + Math.sin(state.orbit.angle * 1.6) * 10;

    const ox = state.ball.x + Math.cos(state.orbit.angle) * state.orbit.radius;
    const oy = state.ball.y + Math.sin(state.orbit.angle) * state.orbit.radius;

    for (let i = state.bricks.length - 1; i >= 0; i -= 1) {
      const brick = state.bricks[i];
      if (ox < brick.x || ox > brick.x + brick.w || oy < brick.y || oy > brick.y + brick.h) {
        continue;
      }
      state.bricks.splice(i, 1);
      state.score += 34;
      spawnSpark(brick.x + brick.w / 2, brick.y + brick.h / 2, "#b79bff");
      state.ball.vx *= 1.01;
      state.ball.vy *= 1.01;
      state.energy = Math.min(100, state.energy + 2);
    }

    if (state.orbit.timer <= 0) {
      state.orbit.active = false;
      state.orbit.radius = 0;
    }
  }

  function update(dt) {
    if (!state.running) return;

    applyInput(dt);
    state.orbit.cooldown = Math.max(0, state.orbit.cooldown - dt);

    if (!state.ball.stuck) {
      state.ball.x += state.ball.vx * dt;
      state.ball.y += state.ball.vy * dt;

      if (state.ball.x - state.ball.r < 0) {
        state.ball.x = state.ball.r;
        state.ball.vx = Math.abs(state.ball.vx);
      }
      if (state.ball.x + state.ball.r > W) {
        state.ball.x = W - state.ball.r;
        state.ball.vx = -Math.abs(state.ball.vx);
      }
      if (state.ball.y - state.ball.r < 0) {
        state.ball.y = state.ball.r;
        state.ball.vy = Math.abs(state.ball.vy);
      }

      collidePaddle();
      collideBricks();
      orbitSweep(dt);
      normalizeBallSpeed();

      if (state.ball.y - state.ball.r > H + 8) {
        state.lives -= 1;
        if (state.lives <= 0) {
          state.running = false;
          state.won = false;
        }
        resetBall(true);
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      if (p.t >= p.life) state.particles.splice(i, 1);
    }

    if (state.bricks.length === 0) {
      if (state.stage >= 3) {
        state.running = false;
        state.won = true;
      } else {
        state.stage += 1;
        state.score += 160;
        state.paddle.w = Math.max(104, state.paddle.w - 8);
        buildStage(state.stage);
        resetBall(false);
      }
    }

    const orbitLabel = state.orbit.active
      ? `Orbit ON ${state.orbit.timer.toFixed(1)}s`
      : `Pulse ${state.energy.toFixed(0)}%${state.orbit.cooldown > 0 ? ` (cd ${state.orbit.cooldown.toFixed(1)}s)` : ""}`;

    statusEl.textContent = `Score ${state.score} | Lives ${state.lives} | Stage ${state.stage} | ${orbitLabel} | Move A/D or <-/->, Launch Space, Pulse Shift`;
  }

  function draw() {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0f1a3d");
    bg.addColorStop(1, "#060b16");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.16;
    for (let i = 0; i < 24; i += 1) {
      ctx.fillStyle = i % 2 ? "#7dd6ff" : "#ff9dd2";
      ctx.fillRect((i * 67) % W, 26 + ((i * 31) % 130), 2, 2);
    }
    ctx.globalAlpha = 1;

    state.bricks.forEach((brick) => {
      ctx.globalAlpha = brick.hp === 2 ? 1 : 0.82;
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      ctx.strokeStyle = "rgba(8, 14, 28, 0.7)";
      ctx.strokeRect(brick.x + 1, brick.y + 1, brick.w - 2, brick.h - 2);
    });
    ctx.globalAlpha = 1;

    const p = state.paddle;
    const pg = ctx.createLinearGradient(p.x - p.w / 2, p.y, p.x + p.w / 2, p.y);
    pg.addColorStop(0, "#78deff");
    pg.addColorStop(1, "#3f8fff");
    ctx.fillStyle = pg;
    ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);

    const b = state.ball;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    if (state.orbit.active) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, state.orbit.radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(178, 142, 255, 0.65)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const ox = b.x + Math.cos(state.orbit.angle) * state.orbit.radius;
      const oy = b.y + Math.sin(state.orbit.angle) * state.orbit.radius;
      ctx.beginPath();
      ctx.arc(ox, oy, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#cba7ff";
      ctx.fill();
    }

    state.particles.forEach((p2) => {
      const alpha = Math.max(0, 1 - p2.t / p2.life);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p2.color;
      ctx.fillRect(p2.x, p2.y, 3, 3);
    });
    ctx.globalAlpha = 1;

    if (!state.running) {
      ctx.fillStyle = "rgba(4, 8, 16, 0.76)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#f5f8ff";
      ctx.font = "700 42px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText(state.won ? "Orbit Breaker Clear" : "System Breach", W / 2, H / 2 - 6);
      ctx.font = "600 20px Trebuchet MS";
      ctx.fillText("Press R or Launch to restart", W / 2, H / 2 + 30);
      ctx.textAlign = "left";
    }
  }

  let prev = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - prev) / 1000);
    prev = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function restart() {
    state.running = true;
    state.won = false;
    state.score = 0;
    state.lives = 3;
    state.stage = 1;
    state.energy = 0;
    state.particles = [];
    state.paddle.w = 148;
    buildStage(1);
    resetBall(false);
  }

  function bindKey(code, pressed) {
    if (code === "ArrowLeft" || code === "KeyA") state.keys.left = pressed;
    if (code === "ArrowRight" || code === "KeyD") state.keys.right = pressed;
    if (pressed && code === "Space") {
      if (!state.running) restart();
      else state.launchQueued = true;
    }
    if (pressed && (code === "ShiftLeft" || code === "ShiftRight")) queuePulse();
    if (pressed && code === "KeyR") restart();
  }

  window.addEventListener("keydown", (e) => {
    if (["ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    bindKey(e.code, true);
  });
  window.addEventListener("keyup", (e) => bindKey(e.code, false));

  touchRoot.querySelectorAll("button").forEach((btn) => {
    const act = btn.dataset.act;
    const start = (ev) => {
      ev.preventDefault();
      btn.classList.add("on");
      if (act === "left") state.touch.left = true;
      if (act === "right") state.touch.right = true;
      if (act === "launch") {
        if (!state.running) restart();
        else state.launchQueued = true;
      }
      if (act === "pulse") queuePulse();
    };
    const end = (ev) => {
      ev.preventDefault();
      btn.classList.remove("on");
      if (act === "left") state.touch.left = false;
      if (act === "right") state.touch.right = false;
    };

    btn.addEventListener("touchstart", start, { passive: false });
    btn.addEventListener("touchend", end, { passive: false });
    btn.addEventListener("touchcancel", end, { passive: false });
    btn.addEventListener("mousedown", start);
    btn.addEventListener("mouseup", end);
    btn.addEventListener("mouseleave", end);
  });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * W;
    state.paddle.x = Math.max(state.paddle.w / 2, Math.min(W - state.paddle.w / 2, x));
    if (state.ball.stuck) {
      state.ball.x = state.paddle.x;
      state.ball.y = state.paddle.y - 18;
    }
  }, { passive: false });

  buildStage(1);
  resetBall(false);
  requestAnimationFrame(frame);
})();
