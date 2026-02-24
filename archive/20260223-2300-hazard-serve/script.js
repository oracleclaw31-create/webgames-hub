(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  const perkPanel = document.getElementById("perkPanel");
  const perkButtons = document.getElementById("perkButtons");
  const leftBtn = document.getElementById("leftBtn");
  const rightBtn = document.getElementById("rightBtn");
  const serveBtn = document.getElementById("serveBtn");

  const W = canvas.width;
  const H = canvas.height;
  const BRICK_ROWS = 6;
  const BRICK_COLS = 12;
  const BRICK_W = 62;
  const BRICK_H = 22;
  const BRICK_GAP = 8;
  const BRICK_TOP = 68;
  const BRICK_LEFT = 26;

  const state = {
    keys: { left: false, right: false, serve: false },
    touch: { left: false, right: false, serve: false },
    paddle: { x: W * 0.5 - 62, y: H - 48, w: 124, h: 14, speed: 520 },
    ball: { x: 0, y: 0, vx: 0, vy: 0, r: 8, speedBonus: 0, attached: true },
    wave: 1,
    lives: 3,
    score: 0,
    chain: 1,
    bestChain: 1,
    serveCharge: 0,
    serveAngle: -90,
    serveSweep: 1,
    hazardInterval: 14,
    hazardTimer: 14,
    hazardRowsAdded: 0,
    gameOver: false,
    waitingPerk: false,
    perkChoices: [],
    perks: {
      longPaddle: 0,
      chargeBoost: 0,
      chainShield: 0,
      extraLife: 0,
      hazardDelay: 0,
      speedUp: 0
    },
    bricks: []
  };

  const perkPool = [
    {
      id: "longPaddle",
      name: "Wide Guard",
      desc: "+16 paddle width (max +64).",
      apply() {
        if (state.perks.longPaddle >= 4) {
          return false;
        }
        state.perks.longPaddle += 1;
        state.paddle.w += 16;
        return true;
      }
    },
    {
      id: "chargeBoost",
      name: "Launch Coil",
      desc: "Charge grants higher serve speed.",
      apply() {
        if (state.perks.chargeBoost >= 3) {
          return false;
        }
        state.perks.chargeBoost += 1;
        return true;
      }
    },
    {
      id: "hazardDelay",
      name: "Safety Protocol",
      desc: "+1.3s hazard row timer.",
      apply() {
        state.perks.hazardDelay += 1;
        state.hazardInterval += 1.3;
        return true;
      }
    },
    {
      id: "speedUp",
      name: "Hot Ball",
      desc: "Ball flies faster after serve.",
      apply() {
        if (state.perks.speedUp >= 4) {
          return false;
        }
        state.perks.speedUp += 1;
        state.ball.speedBonus += 28;
        return true;
      }
    },
    {
      id: "chainShield",
      name: "Combo Memory",
      desc: "Miss once without losing chain.",
      apply() {
        if (state.perks.chainShield >= 3) {
          return false;
        }
        state.perks.chainShield += 1;
        return true;
      }
    },
    {
      id: "extraLife",
      name: "Hull Patch",
      desc: "+1 life (max 6).",
      apply() {
        if (state.lives >= 6) {
          return false;
        }
        state.perks.extraLife += 1;
        state.lives += 1;
        return true;
      }
    }
  ];

  function randomChoice(arr, count) {
    const copy = arr.slice();
    const out = [];
    while (copy.length && out.length < count) {
      const idx = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  }

  function buildWave(wave) {
    state.bricks.length = 0;
    const density = Math.min(0.7 + wave * 0.03, 0.94);
    for (let r = 0; r < BRICK_ROWS; r += 1) {
      for (let c = 0; c < BRICK_COLS; c += 1) {
        if (Math.random() <= density) {
          state.bricks.push({
            x: BRICK_LEFT + c * (BRICK_W + BRICK_GAP),
            y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
            w: BRICK_W,
            h: BRICK_H,
            hp: 1 + Math.floor((wave - 1) / 2)
          });
        }
      }
    }
    if (!state.bricks.length) {
      state.bricks.push({ x: BRICK_LEFT, y: BRICK_TOP, w: BRICK_W, h: BRICK_H, hp: 1 });
    }
  }

  function resetBall(keepChain) {
    state.ball.attached = true;
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.serveCharge = 0;
    state.serveAngle = -90;
    state.serveSweep = 1;
    if (!keepChain) {
      state.chain = 1;
    }
  }

  function startRun() {
    state.wave = 1;
    state.lives = 3;
    state.score = 0;
    state.chain = 1;
    state.bestChain = 1;
    state.hazardInterval = 14;
    state.hazardTimer = state.hazardInterval;
    state.hazardRowsAdded = 0;
    state.gameOver = false;
    state.waitingPerk = false;
    state.perkChoices = [];
    state.perks.longPaddle = 0;
    state.perks.chargeBoost = 0;
    state.perks.chainShield = 0;
    state.perks.extraLife = 0;
    state.perks.hazardDelay = 0;
    state.perks.speedUp = 0;
    state.paddle.w = 124;
    state.paddle.x = W * 0.5 - state.paddle.w * 0.5;
    state.ball.speedBonus = 0;
    buildWave(state.wave);
    resetBall(false);
  }

  function choosePerkSet() {
    let picks = randomChoice(perkPool, 3);
    if (picks.length < 3) {
      picks = perkPool.slice(0, 3);
    }
    state.perkChoices = picks;
    perkButtons.innerHTML = "";
    picks.forEach((perk, idx) => {
      const btn = document.createElement("button");
      btn.textContent = `${idx + 1}. ${perk.name} - ${perk.desc}`;
      btn.addEventListener("click", () => applyPerk(idx));
      perkButtons.appendChild(btn);
    });
    perkPanel.hidden = false;
  }

  function applyPerk(index) {
    if (!state.waitingPerk) {
      return;
    }
    const perk = state.perkChoices[index];
    if (!perk) {
      return;
    }
    perk.apply();
    state.waitingPerk = false;
    perkPanel.hidden = true;
    state.wave += 1;
    state.hazardInterval = Math.max(6, state.hazardInterval - 0.7);
    state.hazardTimer = state.hazardInterval;
    buildWave(state.wave);
    resetBall(false);
  }

  function hazardRow() {
    for (let i = 0; i < state.bricks.length; i += 1) {
      state.bricks[i].y += BRICK_H + BRICK_GAP;
      if (state.bricks[i].y + state.bricks[i].h >= state.paddle.y - 2) {
        state.gameOver = true;
      }
    }
    for (let c = 0; c < BRICK_COLS; c += 1) {
      if (Math.random() < 0.78) {
        state.bricks.push({
          x: BRICK_LEFT + c * (BRICK_W + BRICK_GAP),
          y: BRICK_TOP,
          w: BRICK_W,
          h: BRICK_H,
          hp: 1 + Math.floor(state.wave / 2)
        });
      }
    }
    state.hazardRowsAdded += 1;
  }

  function ballRectHit(ball, rect) {
    const closestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.h));
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    return dx * dx + dy * dy < ball.r * ball.r;
  }

  function servePower() {
    return Math.min(1, state.serveCharge);
  }

  function launchBall() {
    const power = servePower();
    const baseSpeed = 340 + power * 290 + state.perks.chargeBoost * 32 + state.ball.speedBonus;
    const rad = (state.serveAngle * Math.PI) / 180;
    state.ball.vx = Math.cos(rad) * baseSpeed;
    state.ball.vy = Math.sin(rad) * baseSpeed;
    state.ball.attached = false;
  }

  function remainingBricks() {
    return state.bricks.length;
  }

  function update(dt) {
    if (state.gameOver || state.waitingPerk) {
      return;
    }

    const moveDir = (state.keys.left || state.touch.left ? -1 : 0) + (state.keys.right || state.touch.right ? 1 : 0);
    state.paddle.x += moveDir * state.paddle.speed * dt;
    state.paddle.x = Math.max(0, Math.min(W - state.paddle.w, state.paddle.x));

    if (state.ball.attached) {
      state.ball.x = state.paddle.x + state.paddle.w * 0.5;
      state.ball.y = state.paddle.y - state.ball.r - 2;

      const charging = state.keys.serve || state.touch.serve;
      if (charging) {
        state.serveCharge = Math.min(1, state.serveCharge + dt * 0.7);
        state.serveAngle += state.serveSweep * dt * 120;
        if (state.serveAngle < -150) {
          state.serveAngle = -150;
          state.serveSweep = 1;
        }
        if (state.serveAngle > -30) {
          state.serveAngle = -30;
          state.serveSweep = -1;
        }
      } else if (state.serveCharge > 0.02) {
        launchBall();
      }
    } else {
      state.hazardTimer -= dt;
      if (state.hazardTimer <= 0) {
        state.hazardTimer += state.hazardInterval;
        hazardRow();
      }

      state.ball.x += state.ball.vx * dt;
      state.ball.y += state.ball.vy * dt;

      if (state.ball.x - state.ball.r <= 0) {
        state.ball.x = state.ball.r;
        state.ball.vx = Math.abs(state.ball.vx);
      } else if (state.ball.x + state.ball.r >= W) {
        state.ball.x = W - state.ball.r;
        state.ball.vx = -Math.abs(state.ball.vx);
      }
      if (state.ball.y - state.ball.r <= 0) {
        state.ball.y = state.ball.r;
        state.ball.vy = Math.abs(state.ball.vy);
      }

      const paddle = state.paddle;
      if (ballRectHit(state.ball, paddle) && state.ball.vy > 0) {
        const t = (state.ball.x - paddle.x) / paddle.w;
        const angle = (-155 + t * 130) * (Math.PI / 180);
        const speed = Math.hypot(state.ball.vx, state.ball.vy) * 1.015;
        state.ball.vx = Math.cos(angle) * speed;
        state.ball.vy = Math.sin(angle) * speed;
        state.chain = 1;
      }

      for (let i = state.bricks.length - 1; i >= 0; i -= 1) {
        const brick = state.bricks[i];
        if (!ballRectHit(state.ball, brick)) {
          continue;
        }

        const prevX = state.ball.x - state.ball.vx * dt;
        const prevY = state.ball.y - state.ball.vy * dt;
        const fromLeft = prevX <= brick.x;
        const fromRight = prevX >= brick.x + brick.w;
        const fromTop = prevY <= brick.y;
        const fromBottom = prevY >= brick.y + brick.h;
        if (fromLeft || fromRight) {
          state.ball.vx *= -1;
        } else if (fromTop || fromBottom) {
          state.ball.vy *= -1;
        } else {
          state.ball.vy *= -1;
        }

        brick.hp -= 1;
        if (brick.hp <= 0) {
          state.bricks.splice(i, 1);
          state.score += 10 * state.chain;
          state.chain += 1;
          state.bestChain = Math.max(state.bestChain, state.chain);
        } else {
          state.score += 4 * state.chain;
        }
        break;
      }

      if (state.ball.y - state.ball.r > H + 40) {
        state.lives -= 1;
        if (state.perks.chainShield > 0) {
          state.perks.chainShield -= 1;
        } else {
          state.chain = 1;
        }
        if (state.lives <= 0) {
          state.gameOver = true;
        } else {
          resetBall(true);
        }
      }
    }

    if (!state.gameOver && remainingBricks() === 0 && !state.waitingPerk) {
      state.waitingPerk = true;
      resetBall(false);
      choosePerkSet();
    }
  }

  function drawBricks() {
    for (let i = 0; i < state.bricks.length; i += 1) {
      const b = state.bricks[i];
      const tint = Math.min(80 + state.wave * 6, 170);
      ctx.fillStyle = `rgb(${tint}, ${90 + b.hp * 16}, ${220 - b.hp * 16})`;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    }
  }

  function drawServeGuide() {
    if (!state.ball.attached || state.waitingPerk || state.gameOver) {
      return;
    }
    const power = servePower();
    const rad = (state.serveAngle * Math.PI) / 180;
    const len = 72 + 120 * power;
    ctx.strokeStyle = `rgba(92, 200, 255, ${0.55 + power * 0.35})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(state.ball.x, state.ball.y);
    ctx.lineTo(state.ball.x + Math.cos(rad) * len, state.ball.y + Math.sin(rad) * len);
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#102244");
    grad.addColorStop(1, "#071122");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    drawBricks();
    drawServeGuide();

    ctx.fillStyle = "#dce9ff";
    ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h);

    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffde7b";
    ctx.fill();

    const hazardPercent = Math.max(0, Math.min(1, state.hazardTimer / state.hazardInterval));
    ctx.fillStyle = "rgba(255, 77, 90, 0.22)";
    ctx.fillRect(0, 0, W * (1 - hazardPercent), 8);
    ctx.fillStyle = "#ffb4ba";
    ctx.font = "13px sans-serif";
    ctx.fillText("Hazard row incoming", 12, 22);

    if (state.gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 44px sans-serif";
      ctx.fillText("Run Failed", W * 0.5 - 104, H * 0.45);
      ctx.font = "20px sans-serif";
      ctx.fillText("Press R to restart", W * 0.5 - 84, H * 0.53);
    }
  }

  function updateHud() {
    const chargePct = Math.round(servePower() * 100);
    hud.textContent = `Wave ${state.wave} | Score ${state.score} | Lives ${state.lives} | Chain x${state.chain} (best x${state.bestChain}) | Bricks ${state.bricks.length} | Hazard ${state.hazardTimer.toFixed(1)}s | Serve charge ${chargePct}%`;
  }

  function setHold(button, key) {
    const on = () => {
      state.touch[key] = true;
    };
    const off = () => {
      state.touch[key] = false;
      if (key === "serve" && state.ball.attached && state.serveCharge > 0.02 && !state.waitingPerk && !state.gameOver) {
        launchBall();
      }
    };
    button.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      on();
    });
    button.addEventListener("pointerup", off);
    button.addEventListener("pointerleave", off);
    button.addEventListener("pointercancel", off);
  }

  setHold(leftBtn, "left");
  setHold(rightBtn, "right");
  setHold(serveBtn, "serve");

  window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      state.keys.left = true;
    } else if (e.code === "ArrowRight" || e.code === "KeyD") {
      state.keys.right = true;
    } else if (e.code === "Space") {
      e.preventDefault();
      state.keys.serve = true;
    } else if (e.code === "KeyR") {
      startRun();
      perkPanel.hidden = true;
    } else if (state.waitingPerk && (e.code === "Digit1" || e.code === "Digit2" || e.code === "Digit3")) {
      const idx = Number(e.code.slice(-1)) - 1;
      applyPerk(idx);
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      state.keys.left = false;
    } else if (e.code === "ArrowRight" || e.code === "KeyD") {
      state.keys.right = false;
    } else if (e.code === "Space") {
      state.keys.serve = false;
      if (state.ball.attached && state.serveCharge > 0.02 && !state.waitingPerk && !state.gameOver) {
        launchBall();
      }
    }
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    updateHud();
    draw();
    requestAnimationFrame(frame);
  }

  startRun();
  requestAnimationFrame(frame);
})();
