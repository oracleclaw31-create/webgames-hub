const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hudText = document.getElementById('hudText');

const keys = { left: 0, right: 0, launch: 0, pulse: 0 };
const state = {
  paddle: { x: canvas.width / 2 - 60, y: canvas.height - 30, w: 120, h: 14, speed: 540 },
  ball: { x: canvas.width / 2, y: canvas.height - 44, r: 8, vx: 240, vy: -280, stuck: true },
  bricks: [],
  score: 0,
  lives: 3,
  combo: 1,
  comboTimer: 0,
  pulse: 0,
  pulseCooldown: 0,
  phase: 1,
  phaseTime: 35,
  paused: false,
  gameOver: false,
  win: false
};

function resetBall() {
  state.ball.stuck = true;
  state.ball.x = state.paddle.x + state.paddle.w / 2;
  state.ball.y = state.paddle.y - state.ball.r - 2;
  const speed = 280 + state.phase * 12;
  state.ball.vx = (Math.random() * 2 - 1) * speed;
  state.ball.vy = -speed;
}

function buildBricks() {
  state.bricks = [];
  const rows = 5 + Math.min(3, state.phase);
  const cols = 10;
  const bw = 86;
  const bh = 24;
  const gap = 6;
  const ox = (canvas.width - cols * bw - (cols - 1) * gap) / 2;
  const oy = 70;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const shield = r < 2 ? 2 : (r < 4 ? 1 : 0);
      state.bricks.push({
        x: ox + c * (bw + gap),
        y: oy + r * (bh + gap),
        w: bw,
        h: bh,
        hp: 1,
        shield
      });
    }
  }
}

function resetGame() {
  Object.assign(state, {
    score: 0, lives: 3, combo: 1, comboTimer: 0, pulse: 0, pulseCooldown: 0,
    phase: 1, phaseTime: 35, paused: false, gameOver: false, win: false
  });
  state.paddle.x = canvas.width / 2 - 60;
  buildBricks();
  resetBall();
}

function nextPhase() {
  state.phase += 1;
  if (state.phase > 3) { state.win = true; state.gameOver = true; return; }
  state.phaseTime = 35;
  state.combo = 1;
  state.comboTimer = 0;
  state.pulse = Math.max(state.pulse, 0.3);
  buildBricks();
  resetBall();
}

function kmap(e, v) {
  const k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') keys.left = v;
  if (k === 'arrowright' || k === 'd') keys.right = v;
  if (k === ' ') keys.launch = v;
  if (k === 'shift') keys.pulse = v;
  if (v && k === 'p') state.paused = !state.paused;
  if (v && k === 'r') resetGame();
}
addEventListener('keydown', e => kmap(e, 1));
addEventListener('keyup', e => kmap(e, 0));

document.querySelectorAll('#touch button[data-k]').forEach(btn => {
  const k = btn.dataset.k;
  btn.onpointerdown = () => keys[k] = 1;
  btn.onpointerup = () => keys[k] = 0;
  btn.onpointercancel = () => keys[k] = 0;
});
document.getElementById('pauseBtn').onclick = () => state.paused = !state.paused;
document.getElementById('restartBtn').onclick = resetGame;

function rectHit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update(dt) {
  if (state.paused || state.gameOver) return;

  // Paddle movement (keyboard + touch parity)
  const axis = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  state.paddle.x += axis * state.paddle.speed * dt;
  state.paddle.x = Math.max(0, Math.min(canvas.width - state.paddle.w, state.paddle.x));

  // Launch from paddle
  if (state.ball.stuck) {
    state.ball.x = state.paddle.x + state.paddle.w / 2;
    state.ball.y = state.paddle.y - state.ball.r - 2;
    if (keys.launch) state.ball.stuck = false;
  }

  // Charge pulse over time and with hits
  state.pulse = Math.min(1, state.pulse + dt * 0.08);
  state.pulseCooldown = Math.max(0, state.pulseCooldown - dt);
  if (keys.pulse && state.pulse >= 1 && state.pulseCooldown <= 0) {
    // Pulse ability: pierces shield on all nearby bricks
    state.bricks.forEach(b => {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const dx = cx - state.ball.x;
      const dy = cy - state.ball.y;
      if (dx * dx + dy * dy < 240 * 240) {
        b.shield = Math.max(0, b.shield - 1);
        if (b.shield === 0) b.hp -= 1;
      }
    });
    state.pulse = 0;
    state.pulseCooldown = 0.7;
  }

  if (!state.ball.stuck) {
    state.ball.x += state.ball.vx * dt;
    state.ball.y += state.ball.vy * dt;

    if (state.ball.x < state.ball.r || state.ball.x > canvas.width - state.ball.r) {
      state.ball.vx *= -1;
      state.ball.x = Math.max(state.ball.r, Math.min(canvas.width - state.ball.r, state.ball.x));
    }
    if (state.ball.y < state.ball.r) {
      state.ball.vy *= -1;
      state.ball.y = state.ball.r;
    }

    const ballRect = { x: state.ball.x - state.ball.r, y: state.ball.y - state.ball.r, w: state.ball.r * 2, h: state.ball.r * 2 };
    if (rectHit(ballRect, state.paddle) && state.ball.vy > 0) {
      const impact = ((state.ball.x - state.paddle.x) / state.paddle.w) * 2 - 1;
      state.ball.vx = 360 * impact;
      state.ball.vy = -Math.abs(state.ball.vy);
    }

    // Brick collisions + combo scoring
    for (const b of state.bricks) {
      if (b.hp <= 0) continue;
      if (rectHit(ballRect, b)) {
        state.ball.vy *= -1;
        if (b.shield > 0) {
          b.shield -= 1;
        } else {
          b.hp -= 1;
          state.score += Math.round(100 * state.combo);
          state.combo = Math.min(8, state.combo + 0.25);
          state.comboTimer = 2.4;
          state.pulse = Math.min(1, state.pulse + 0.13);
        }
        break;
      }
    }

    if (state.ball.y > canvas.height + 10) {
      state.lives -= 1;
      state.combo = 1;
      state.comboTimer = 0;
      if (state.lives <= 0) {
        state.gameOver = true;
      } else {
        resetBall();
      }
    }
  }

  state.comboTimer -= dt;
  if (state.comboTimer <= 0) state.combo = 1;

  state.phaseTime -= dt;
  if (state.phaseTime <= 0) {
    state.lives -= 1;
    state.phaseTime = 0;
    if (state.lives <= 0) state.gameOver = true;
  }

  state.bricks = state.bricks.filter(b => b.hp > 0);
  if (state.bricks.length === 0) nextPhase();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Bricks and shield layers
  state.bricks.forEach(b => {
    ctx.fillStyle = b.shield === 2 ? '#8cd3ff' : b.shield === 1 ? '#57a4ff' : '#ff9e57';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    if (b.shield > 0) {
      ctx.strokeStyle = '#eaf6ff';
      ctx.lineWidth = b.shield;
      ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
    }
  });

  // Paddle
  ctx.fillStyle = '#9cf';
  ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h);

  // Ball
  ctx.beginPath();
  ctx.fillStyle = '#fff';
  ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
  ctx.fill();

  // Pulse ring preview when charged
  if (state.pulse >= 1) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(122,232,255,0.5)';
    ctx.lineWidth = 3;
    ctx.arc(state.ball.x, state.ball.y, 240, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (state.paused || state.gameOver) {
    ctx.fillStyle = 'rgba(4,8,20,0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 42px system-ui';
    const msg = state.gameOver ? (state.win ? 'ALL PHASES CLEARED' : 'GAME OVER') : 'PAUSED';
    ctx.fillText(msg, canvas.width / 2 - 190, canvas.height / 2);
  }

  hudText.textContent = `Score ${state.score} | Lives ${state.lives} | Combo x${state.combo.toFixed(2)} | Phase ${state.phase}/3 | Timer ${state.phaseTime.toFixed(1)}s | Pulse ${Math.round(state.pulse * 100)}%`;
}

let last = performance.now();
function loop(ts) {
  const dt = Math.min(0.033, (ts - last) / 1000);
  last = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

resetGame();
requestAnimationFrame(loop);
