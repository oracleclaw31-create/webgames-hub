(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const stageEl = document.getElementById("stage");
  const magnetEl = document.getElementById("magnet");

  const touchLeft = document.getElementById("touch-left");
  const touchRight = document.getElementById("touch-right");
  const touchMagnet = document.getElementById("touch-magnet");
  const touchRestart = document.getElementById("touch-restart");

  const state = {
    running: true,
    score: 0,
    lives: 3,
    stage: 1,
    combo: 0,
    keys: {
      left: false,
      right: false
    },
    paddle: {
      x: canvas.width / 2,
      y: canvas.height - 36,
      w: 130,
      h: 16,
      speed: 520
    },
    ball: {
      x: canvas.width / 2,
      y: canvas.height - 56,
      vx: 220,
      vy: -320,
      r: 8,
      speedCap: 690
    },
    magnet: {
      cooldown: 0,
      activeFrames: 0,
      recharge: 3,
      pressQueued: false
    },
    bricks: []
  };

  function randomPolarity() {
    return Math.random() < 0.5 ? -1 : 1;
  }

  function buildStage(stage) {
    const rows = Math.min(5 + stage, 9);
    const cols = 10;
    const marginX = 56;
    const top = 78;
    const gap = 8;
    const width = (canvas.width - marginX * 2 - gap * (cols - 1)) / cols;
    const height = 24;

    state.bricks = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const hp = 1 + Number((r + c + stage) % 4 === 0);
        state.bricks.push({
          x: marginX + c * (width + gap),
          y: top + r * (height + gap),
          w: width,
          h: height,
          hp,
          polarity: randomPolarity()
        });
      }
    }
  }

  function resetBall(onLifeLoss) {
    state.ball.x = state.paddle.x;
    state.ball.y = state.paddle.y - 20;
    const sign = Math.random() < 0.5 ? -1 : 1;
    const speed = 250 + state.stage * 16;
    state.ball.vx = sign * speed;
    state.ball.vy = -(300 + state.stage * 20);
    if (onLifeLoss) {
      state.combo = 0;
      state.magnet.cooldown = Math.max(1.2, state.magnet.cooldown);
    }
  }

  function triggerMagnet() {
    if (!state.running) {
      return;
    }
    if (state.magnet.cooldown > 0) {
      return;
    }
    state.magnet.cooldown = state.magnet.recharge;
    state.magnet.activeFrames = 18;

    const ball = state.ball;
    const paddle = state.paddle;
    const horizontalBias = (ball.x - paddle.x) / (paddle.w * 0.5);
    ball.vx += horizontalBias * 220;
    const direction = horizontalBias >= 0 ? 1 : -1;
    ball.vx += direction * 80;
    ball.vy -= 38;
  }

  function applyInput(dt) {
    const p = state.paddle;
    if (state.keys.left) {
      p.x -= p.speed * dt;
    }
    if (state.keys.right) {
      p.x += p.speed * dt;
    }
    p.x = Math.max(p.w / 2, Math.min(canvas.width - p.w / 2, p.x));

    if (state.magnet.pressQueued) {
      state.magnet.pressQueued = false;
      triggerMagnet();
    }
  }

  function paddleBounce() {
    const b = state.ball;
    const p = state.paddle;
    const withinX = b.x > p.x - p.w / 2 && b.x < p.x + p.w / 2;
    const touchesY = b.y + b.r > p.y - p.h / 2 && b.y + b.r < p.y + p.h;

    if (withinX && touchesY && b.vy > 0) {
      const ratio = (b.x - p.x) / (p.w / 2);
      b.vx += ratio * 260;
      b.vy = -Math.abs(b.vy) * 0.98;
      state.combo = Math.min(state.combo + 1, 12);
    }
  }

  function normalizeSpeed() {
    const b = state.ball;
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > b.speedCap) {
      const m = b.speedCap / speed;
      b.vx *= m;
      b.vy *= m;
    }
    if (speed < 260) {
      const m = 260 / Math.max(speed, 1);
      b.vx *= m;
      b.vy *= m;
    }
  }

  function hitBricks() {
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

      const hitFromSide = b.x < brick.x || b.x > brick.x + brick.w;
      if (hitFromSide) {
        b.vx *= -1;
      } else {
        b.vy *= -1;
      }

      brick.hp -= 1;
      const comboBonus = Math.min(state.combo * 2, 24);
      state.score += 12 + comboBonus;

      if (brick.hp <= 0) {
        state.bricks.splice(i, 1);
        state.score += 24;
      }

      // Flux effect: pulse direction can invert brick polarity, rewarding control timing.
      if (state.magnet.activeFrames > 0 && Math.random() < 0.3) {
        brick.polarity *= -1;
      }

      break;
    }
  }

  function update(dt) {
    if (!state.running) {
      return;
    }

    applyInput(dt);

    state.magnet.cooldown = Math.max(0, state.magnet.cooldown - dt);
    state.magnet.activeFrames = Math.max(0, state.magnet.activeFrames - 1);

    const b = state.ball;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.x - b.r < 0) {
      b.x = b.r;
      b.vx = Math.abs(b.vx);
    }
    if (b.x + b.r > canvas.width) {
      b.x = canvas.width - b.r;
      b.vx = -Math.abs(b.vx);
    }
    if (b.y - b.r < 0) {
      b.y = b.r;
      b.vy = Math.abs(b.vy);
    }

    paddleBounce();
    hitBricks();

    if (b.y - b.r > canvas.height + 6) {
      state.lives -= 1;
      if (state.lives <= 0) {
        state.running = false;
      }
      resetBall(true);
    }

    if (state.bricks.length === 0) {
      state.stage += 1;
      state.score += 120;
      state.paddle.w = Math.max(86, state.paddle.w - 5);
      buildStage(state.stage);
      resetBall(false);
    }

    normalizeSpeed();
  }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#071228");
    grad.addColorStop(1, "#04070d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#5f8fca";
    for (let x = 20; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawBricks() {
    state.bricks.forEach((brick) => {
      const color = brick.polarity > 0 ? "#ff9e57" : "#5eb9ff";
      ctx.fillStyle = color;
      ctx.globalAlpha = brick.hp === 2 ? 0.95 : 0.72;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);

      ctx.strokeStyle = "rgba(7, 16, 30, 0.75)";
      ctx.lineWidth = 2;
      ctx.strokeRect(brick.x + 1, brick.y + 1, brick.w - 2, brick.h - 2);

      ctx.globalAlpha = 1;
    });
  }

  function drawPaddleAndBall() {
    const p = state.paddle;
    const b = state.ball;

    const pGrad = ctx.createLinearGradient(p.x - p.w / 2, p.y, p.x + p.w / 2, p.y);
    pGrad.addColorStop(0, "#7ad0ff");
    pGrad.addColorStop(1, "#4984ff");
    ctx.fillStyle = pGrad;
    ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);

    const glow = state.magnet.activeFrames > 0 ? 14 : 5;
    ctx.save();
    ctx.shadowBlur = glow;
    ctx.shadowColor = state.magnet.activeFrames > 0 ? "#ffd786" : "#7dbbff";
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawOverlay() {
    if (state.running) {
      return;
    }

    ctx.fillStyle = "rgba(4, 7, 14, 0.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#eef4ff";
    ctx.font = "700 52px Trebuchet MS";
    ctx.fillText("System Overrun", canvas.width / 2, canvas.height / 2 - 18);

    ctx.font = "600 24px Trebuchet MS";
    ctx.fillStyle = "#c5d7f6";
    ctx.fillText(`Final Score: ${state.score}`, canvas.width / 2, canvas.height / 2 + 24);
    ctx.fillText("Press R or Restart", canvas.width / 2, canvas.height / 2 + 62);
    ctx.textAlign = "start";
  }

  function render() {
    drawBackground();
    drawBricks();
    drawPaddleAndBall();
    drawOverlay();

    scoreEl.textContent = String(state.score);
    livesEl.textContent = String(Math.max(state.lives, 0));
    stageEl.textContent = String(state.stage);
    magnetEl.textContent = state.magnet.cooldown <= 0 ? "READY" : `${state.magnet.cooldown.toFixed(1)}s`;
    magnetEl.style.color = state.magnet.cooldown <= 0 ? "#95ffbe" : "#ffcf88";
  }

  function restartGame() {
    state.running = true;
    state.score = 0;
    state.lives = 3;
    state.stage = 1;
    state.combo = 0;
    state.magnet.cooldown = 0;
    state.magnet.activeFrames = 0;
    state.paddle.w = 130;
    state.paddle.x = canvas.width / 2;
    buildStage(state.stage);
    resetBall(false);
  }

  function bindKeyboard() {
    window.addEventListener("keydown", (event) => {
      if (event.code === "ArrowLeft" || event.code === "KeyA") {
        state.keys.left = true;
      }
      if (event.code === "ArrowRight" || event.code === "KeyD") {
        state.keys.right = true;
      }
      if (event.code === "Space") {
        event.preventDefault();
        state.magnet.pressQueued = true;
      }
      if (event.code === "KeyR") {
        restartGame();
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.code === "ArrowLeft" || event.code === "KeyA") {
        state.keys.left = false;
      }
      if (event.code === "ArrowRight" || event.code === "KeyD") {
        state.keys.right = false;
      }
    });
  }

  function bindTouchButton(btn, onDown, onUp) {
    const start = (event) => {
      event.preventDefault();
      btn.classList.add("active");
      onDown();
    };
    const end = (event) => {
      event.preventDefault();
      btn.classList.remove("active");
      onUp();
    };

    btn.addEventListener("touchstart", start, { passive: false });
    btn.addEventListener("touchend", end, { passive: false });
    btn.addEventListener("touchcancel", end, { passive: false });
    btn.addEventListener("mousedown", start);
    btn.addEventListener("mouseup", end);
    btn.addEventListener("mouseleave", end);
  }

  function bindTouch() {
    bindTouchButton(touchLeft, () => {
      state.keys.left = true;
    }, () => {
      state.keys.left = false;
    });

    bindTouchButton(touchRight, () => {
      state.keys.right = true;
    }, () => {
      state.keys.right = false;
    });

    touchMagnet.addEventListener("touchstart", (event) => {
      event.preventDefault();
      state.magnet.pressQueued = true;
      touchMagnet.classList.add("active");
    }, { passive: false });
    touchMagnet.addEventListener("touchend", (event) => {
      event.preventDefault();
      touchMagnet.classList.remove("active");
    }, { passive: false });
    touchMagnet.addEventListener("mousedown", () => {
      state.magnet.pressQueued = true;
      touchMagnet.classList.add("active");
    });
    touchMagnet.addEventListener("mouseup", () => {
      touchMagnet.classList.remove("active");
    });

    touchRestart.addEventListener("click", () => {
      restartGame();
    });

    canvas.addEventListener("touchmove", (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) / rect.width) * canvas.width;
      state.paddle.x = Math.max(state.paddle.w / 2, Math.min(canvas.width - state.paddle.w / 2, x));
    }, { passive: false });
  }

  let prev = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - prev) / 1000);
    prev = now;

    update(dt);
    render();

    requestAnimationFrame(loop);
  }

  buildStage(state.stage);
  resetBall(false);
  bindKeyboard();
  bindTouch();
  requestAnimationFrame(loop);
})();
