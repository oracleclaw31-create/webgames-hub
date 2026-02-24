const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const stabilityEl = document.getElementById("stability");
const focusEl = document.getElementById("focus");

const W = canvas.width;
const H = canvas.height;
const HIT_X = 200;
const LANES_Y = [150, 230, 310, 390];
const APPROACH = 1.8;
const HIT_WINDOW = 0.14;
const PERFECT_WINDOW = 0.055;
const SONG_DURATION = 62;

let chart = [];
let state = {};

function rand(seed) {
  const x = Math.sin(seed * 91.13) * 10000;
  return x - Math.floor(x);
}

function buildChart() {
  chart = [];
  const bpm = 116;
  const beat = 60 / bpm;
  let index = 0;
  for (let t = 2.2; t < SONG_DURATION; t += beat * 0.5) {
    const gate = rand(index + 5);
    if (gate < 0.42 && index % 2 !== 0) {
      index += 1;
      continue;
    }
    const lane = Math.floor(rand(index + 11) * 4);
    const accent = index % 8 === 0;
    chart.push({ lane, hitTime: t, judged: false, accent });
    index += 1;
  }
}

function resetGame() {
  buildChart();
  state = {
    startedAt: performance.now() / 1000,
    score: 0,
    combo: 0,
    maxCombo: 0,
    stability: 100,
    focusMeter: 0,
    focusUntil: 0,
    over: false,
    clear: false,
    feedback: "Press A/S/K/L on the beat",
    flashes: [0, 0, 0, 0]
  };
}

function nowSec() {
  return performance.now() / 1000 - state.startedAt;
}

function hitLane(lane) {
  if (state.over) return;
  const now = nowSec();
  const focusOn = now < state.focusUntil;
  const window = focusOn ? HIT_WINDOW * 1.35 : HIT_WINDOW;
  let best = null;
  let bestDt = 999;

  for (const note of chart) {
    if (note.judged || note.lane !== lane) continue;
    const dt = note.hitTime - now;
    if (Math.abs(dt) < Math.abs(bestDt)) {
      best = note;
      bestDt = dt;
    }
    if (note.hitTime > now + window) break;
  }

  state.flashes[lane] = 0.16;

  if (!best || Math.abs(bestDt) > window) {
    applyMiss("Late/early input");
    return;
  }

  best.judged = true;
  const absDt = Math.abs(bestDt);
  if (absDt <= PERFECT_WINDOW) {
    state.score += best.accent ? 360 : 210;
    state.combo += 1;
    state.focusMeter = Math.min(100, state.focusMeter + 7);
    state.feedback = "Perfect";
  } else {
    state.score += best.accent ? 210 : 120;
    state.combo += 1;
    state.focusMeter = Math.min(100, state.focusMeter + 4);
    state.feedback = "Good";
  }

  state.maxCombo = Math.max(state.maxCombo, state.combo);
  state.stability = Math.min(100, state.stability + 0.55);
}

function applyMiss(msg) {
  state.combo = 0;
  state.stability -= 8;
  state.focusMeter = Math.max(0, state.focusMeter - 10);
  state.feedback = `Miss - ${msg}`;
}

function activateFocus() {
  if (state.over) return;
  const now = nowSec();
  if (state.focusMeter < 45 || now < state.focusUntil) return;
  state.focusMeter -= 45;
  state.focusUntil = now + 2.4;
  state.feedback = "Focus ON";
}

function update(dt) {
  const now = nowSec();
  state.flashes = state.flashes.map((v) => Math.max(0, v - dt));

  for (const note of chart) {
    if (note.judged) continue;
    if (now - note.hitTime > HIT_WINDOW) {
      note.judged = true;
      applyMiss("Unhit note");
    }
  }

  if (state.stability <= 0) {
    state.over = true;
    state.clear = false;
    state.feedback = "Reactor failed";
  } else if (now >= SONG_DURATION) {
    state.over = true;
    state.clear = true;
    state.feedback = "Track complete";
  }
}

function drawGrid(now) {
  ctx.fillStyle = "#08162a";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(120,180,255,0.22)";
  for (let i = 0; i < 18; i++) {
    const x = (i / 18) * W;
    ctx.beginPath();
    ctx.moveTo(x, 60);
    ctx.lineTo(x, H - 60);
    ctx.stroke();
  }

  ctx.strokeStyle = "#87e8ff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(HIT_X, 90);
  ctx.lineTo(HIT_X, H - 90);
  ctx.stroke();
  ctx.lineWidth = 1;

  LANES_Y.forEach((y, i) => {
    const flash = state.flashes[i];
    ctx.strokeStyle = flash > 0 ? "#ffd28f" : "rgba(180,220,255,0.45)";
    ctx.lineWidth = flash > 0 ? 5 : 2;
    ctx.beginPath();
    ctx.moveTo(120, y);
    ctx.lineTo(W - 70, y);
    ctx.stroke();

    ctx.fillStyle = "#cbeeff";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(["A", "S", "K", "L"][i], 86, y + 6);
  });

  const focusOn = now < state.focusUntil;
  if (focusOn) {
    ctx.fillStyle = "rgba(255,176,84,0.18)";
    ctx.fillRect(0, 0, W, H);
  }
}

function drawNotes(now) {
  for (const note of chart) {
    if (note.judged) continue;
    const timeToHit = note.hitTime - now;
    if (timeToHit > APPROACH || timeToHit < -0.3) continue;
    const p = 1 - timeToHit / APPROACH;
    const x = HIT_X + p * (W - HIT_X - 90);
    const y = LANES_Y[note.lane];

    ctx.beginPath();
    ctx.arc(x, y, note.accent ? 17 : 13, 0, Math.PI * 2);
    ctx.fillStyle = note.accent ? "#ffb15f" : "#42d7ff";
    ctx.fill();
    ctx.strokeStyle = "#f6fbff";
    ctx.stroke();
  }
}

function drawHUD(now) {
  const tLeft = Math.max(0, SONG_DURATION - now);
  ctx.fillStyle = "#e5f3ff";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(`Time: ${tLeft.toFixed(1)}s`, 24, 36);
  ctx.fillText(`Feedback: ${state.feedback}`, 24, 70);

  if (state.over) {
    ctx.fillStyle = "rgba(6,12,21,0.78)";
    ctx.fillRect(130, 150, 700, 250);
    ctx.strokeStyle = state.clear ? "#72ffaa" : "#ff8f8f";
    ctx.lineWidth = 3;
    ctx.strokeRect(130, 150, 700, 250);
    ctx.fillStyle = "#f1fbff";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText(state.clear ? "Reactor Stabilized" : "Reactor Collapse", 225, 230);
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(`Final Score: ${state.score}`, 300, 280);
    ctx.fillText(`Max Combo: ${state.maxCombo}`, 305, 320);
    ctx.font = "20px sans-serif";
    ctx.fillText("Press Enter or tap any lane button to restart", 230, 360);
  }
}

function syncHud() {
  scoreEl.textContent = `Score: ${state.score}`;
  comboEl.textContent = `Combo: ${state.combo}`;
  stabilityEl.textContent = `Stability: ${Math.max(0, state.stability).toFixed(0)}`;
  focusEl.textContent = `Focus: ${state.focusMeter.toFixed(0)}%`;
}

let prev = performance.now() / 1000;
function frame() {
  const t = performance.now() / 1000;
  const dt = Math.min(0.05, t - prev);
  prev = t;

  const now = nowSec();
  if (!state.over) update(dt);
  drawGrid(now);
  drawNotes(now);
  drawHUD(now);
  syncHud();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "a") hitLane(0);
  if (key === "s") hitLane(1);
  if (key === "k") hitLane(2);
  if (key === "l") hitLane(3);
  if (key === " ") {
    e.preventDefault();
    activateFocus();
  }
  if (key === "enter" && state.over) resetGame();
});

for (const btn of document.querySelectorAll(".lane-btn")) {
  const lane = Number(btn.dataset.lane);
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (state.over) {
      resetGame();
      return;
    }
    btn.classList.add("active");
    hitLane(lane);
  });
  btn.addEventListener("pointerup", () => btn.classList.remove("active"));
  btn.addEventListener("pointercancel", () => btn.classList.remove("active"));
}

const focusBtn = document.getElementById("focusBtn");
focusBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  focusBtn.classList.add("active");
  activateFocus();
});
focusBtn.addEventListener("pointerup", () => focusBtn.classList.remove("active"));
focusBtn.addEventListener("pointercancel", () => focusBtn.classList.remove("active"));

resetGame();
requestAnimationFrame(frame);
