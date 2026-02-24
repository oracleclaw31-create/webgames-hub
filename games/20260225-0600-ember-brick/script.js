const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statsEl = document.getElementById("stats");
const statusEl = document.getElementById("status");

const W = canvas.width;
const H = canvas.height;
const keys = { left: false, right: false };

const state = {
  score: 0,
  lives: 3,
  combo: 1,
  comboTimer: 0,
  overdriveCharge: 0,
  overdriveTime: 0,
  running: true,
  won: false,
  catchReady: true,
  paddle: { x: W / 2 - 70, y: H - 42, w: 140, h: 14, speed: 540 },
  ball: { x: W / 2, y: H - 60, vx: 220, vy: -280, r: 9, stuck: true },
  bricks: []
};

function initBricks() {
  state.bricks = [];
  const rows = 7;
  const cols = 10;
  const bw = 78;
  const bh = 24;
  const gap = 8;
  const ox = 28;
  const oy = 68;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hp = r < 2 ? 2 : 1;
      const ember = (r + c) % 5 === 0;
      state.bricks.push({
        x: ox + c * (bw + gap),
        y: oy + r * (bh + gap),
        w: bw,
        h: bh,
        hp,
        ember,
        alive: true
      });
    }
  }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function relaunch() {
  const speed = state.overdriveTime > 0 ? 410 : 330;
  const angle = -Math.PI / 2 + ((Math.random() * 2 - 1) * 0.5);
  state.ball.vx = Math.cos(angle) * speed;
  state.ball.vy = Math.sin(angle) * speed;
  state.ball.stuck = false;
}

function activateOverdrive() {
  if (state.overdriveCharge < 100 || state.overdriveTime > 0) return;
  state.overdriveCharge = 0;
  state.overdriveTime = 5;
  state.combo = Math.max(state.combo, 2);
  statusEl.textContent = "Overdrive active: wider paddle + ember pierce for 5s";
}

function update(dt) {
  if (!state.running) return;

  if (keys.left) state.paddle.x -= state.paddle.speed * dt;
  if (keys.right) state.paddle.x += state.paddle.speed * dt;
  state.paddle.x = clamp(state.paddle.x, 0, W - state.paddle.w);

  if (state.overdriveTime > 0) {
    state.overdriveTime -= dt;
    state.paddle.w = 180;
  } else {
    state.paddle.w = 140;
  }

  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
  } else {
    state.combo = 1;
  }

  if (state.ball.stuck) {
    state.ball.x = state.paddle.x + state.paddle.w / 2;
    state.ball.y = state.paddle.y - state.ball.r - 1;
    return;
  }

  state.ball.x += state.ball.vx * dt;
  state.ball.y += state.ball.vy * dt;

  if (state.ball.x < state.ball.r) {
    state.ball.x = state.ball.r;
    state.ball.vx *= -1;
  }
  if (state.ball.x > W - state.ball.r) {
    state.ball.x = W - state.ball.r;
    state.ball.vx *= -1;
  }
  if (state.ball.y < state.ball.r) {
    state.ball.y = state.ball.r;
    state.ball.vy *= -1;
  }

  const p = state.paddle;
  if (
    state.ball.y + state.ball.r >= p.y &&
    state.ball.y - state.ball.r <= p.y + p.h &&
    state.ball.x >= p.x &&
    state.ball.x <= p.x + p.w &&
    state.ball.vy > 0
  ) {
    if (state.catchReady) {
      state.ball.stuck = true;
      state.catchReady = false;
      statusEl.textContent = "Ball caught. Press Space / Launch to relaunch.";
    } else {
      const hit = (state.ball.x - (p.x + p.w / 2)) / (p.w / 2);
      const speed = Math.hypot(state.ball.vx, state.ball.vy) * 1.03;
      const angle = hit * 1.05;
      state.ball.vx = Math.sin(angle) * speed;
      state.ball.vy = -Math.abs(Math.cos(angle) * speed);
    }
  }

  for (const b of state.bricks) {
    if (!b.alive) continue;
    if (
      state.ball.x + state.ball.r > b.x &&
      state.ball.x - state.ball.r < b.x + b.w &&
      state.ball.y + state.ball.r > b.y &&
      state.ball.y - state.ball.r < b.y + b.h
    ) {
      b.hp -= 1;
      if (!(state.overdriveTime > 0 && b.ember)) {
        state.ball.vy *= -1;
      }
      if (b.hp <= 0) {
        b.alive = false;
        state.combo = Math.min(8, state.combo + 1);
        state.comboTimer = 1.4;
        state.overdriveCharge = clamp(state.overdriveCharge + (b.ember ? 18 : 10), 0, 100);
        state.score += (b.ember ? 120 : 80) * state.combo;
      }
      break;
    }
  }

  if (state.ball.y > H + 30) {
    state.lives -= 1;
    state.catchReady = true;
    if (state.lives <= 0) {
      state.running = false;
      statusEl.textContent = "Game Over. Press Restart.";
    } else {
      state.ball.stuck = true;
      state.ball.vx = 220;
      state.ball.vy = -280;
      statusEl.textContent = "Life lost. Relaunch when ready.";
    }
  }

  if (state.bricks.every((b) => !b.alive)) {
    state.running = false;
    state.won = true;
    statusEl.textContent = "Sector cleared. You win!";
  }
}

function drawBrick(b) {
  const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
  if (b.ember) {
    grad.addColorStop(0, "#ffb063");
    grad.addColorStop(1, "#db4c1f");
  } else if (b.hp === 2) {
    grad.addColorStop(0, "#96dcff");
    grad.addColorStop(1, "#2f77b8");
  } else {
    grad.addColorStop(0, "#9fe1ad");
    grad.addColorStop(1, "#3e965f");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  for (const b of state.bricks) {
    if (b.alive) drawBrick(b);
  }

  ctx.fillStyle = state.overdriveTime > 0 ? "#ffc37a" : "#dbe8ff";
  ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h);

  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
  ctx.fillStyle = state.overdriveTime > 0 ? "#ff8a47" : "#f3fbff";
  ctx.fill();

  ctx.fillStyle = "rgba(10, 20, 34, 0.85)";
  ctx.fillRect(14, 12, 260, 22);
  ctx.fillStyle = "#8dd5ff";
  ctx.fillRect(16, 14, (state.overdriveCharge / 100) * 256, 18);
  ctx.strokeStyle = "#cae9ff";
  ctx.strokeRect(14, 12, 260, 22);
  ctx.fillStyle = "#e7f5ff";
  ctx.font = "12px sans-serif";
  ctx.fillText("Overdrive", 112, 27);

  statsEl.textContent = `Score: ${state.score} | Lives: ${state.lives} | Combo: x${state.combo} | Overdrive: ${Math.floor(state.overdriveCharge)}%`;
}

function resetGame() {
  state.score = 0;
  state.lives = 3;
  state.combo = 1;
  state.comboTimer = 0;
  state.overdriveCharge = 0;
  state.overdriveTime = 0;
  state.running = true;
  state.won = false;
  state.catchReady = true;
  state.paddle.x = W / 2 - 70;
  state.paddle.w = 140;
  state.ball.x = W / 2;
  state.ball.y = H - 60;
  state.ball.vx = 220;
  state.ball.vy = -280;
  state.ball.stuck = true;
  initBricks();
  statusEl.textContent = "Break all sectors. Use pulse when overdrive is full.";
}

function onAction(action, pressed) {
  if (action === "left" || action === "right") {
    keys[action] = pressed;
    return;
  }
  if (!pressed) return;
  if (action === "launch") {
    if (!state.running) return;
    if (state.ball.stuck) {
      relaunch();
      statusEl.textContent = "Ball relaunched.";
    } else {
      activateOverdrive();
    }
  }
  if (action === "catch") {
    state.catchReady = true;
    statusEl.textContent = "Catch primed for next paddle contact.";
  }
  if (action === "restart") {
    resetGame();
  }
}

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "arrowleft" || k === "a") keys.left = true;
  if (k === "arrowright" || k === "d") keys.right = true;
  if (k === " " || k === "enter") onAction("launch", true);
  if (k === "c") onAction("catch", true);
  if (k === "r") onAction("restart", true);
});
window.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (k === "arrowleft" || k === "a") keys.left = false;
  if (k === "arrowright" || k === "d") keys.right = false;
});

document.querySelectorAll("button[data-act]").forEach((btn) => {
  const action = btn.dataset.act;
  const start = () => onAction(action, true);
  const end = () => onAction(action, false);
  btn.addEventListener("mousedown", start);
  btn.addEventListener("mouseup", end);
  btn.addEventListener("mouseleave", end);
  btn.addEventListener("touchstart", (e) => { e.preventDefault(); start(); }, { passive: false });
  btn.addEventListener("touchend", (e) => { e.preventDefault(); end(); }, { passive: false });
});

let prev = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - prev) / 1000);
  prev = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

resetGame();
requestAnimationFrame(frame);
