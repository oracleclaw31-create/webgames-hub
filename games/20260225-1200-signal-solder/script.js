const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const moveStat = document.getElementById("moveStat");
const relayStat = document.getElementById("relayStat");
const bestStat = document.getElementById("bestStat");
const messageEl = document.getElementById("message");

const undoBtn = document.getElementById("undoBtn");
const resetBtn = document.getElementById("resetBtn");
const shuffleBtn = document.getElementById("shuffleBtn");

const GRID = 6;
const MOVE_LIMIT = 34;
const TILE = {
  SOURCE: 0,
  RELAY: 1,
  STRAIGHT: 2,
  CORNER: 3,
  TEE: 4,
  BLOCK: 5,
};

const DIRS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

const typeMap = [
  [5, 3, 2, 3, 2, 3],
  [3, 4, 3, 4, 3, 1],
  [0, 3, 4, 3, 4, 3],
  [3, 4, 3, 4, 3, 2],
  [2, 3, 2, 3, 4, 1],
  [3, 4, 3, 2, 3, 1],
];

const solvedRotMap = [
  [0, 1, 0, 1, 0, 2],
  [1, 2, 0, 2, 1, 2],
  [1, 3, 1, 2, 1, 2],
  [0, 2, 3, 0, 3, 0],
  [0, 2, 1, 1, 0, 2],
  [0, 0, 0, 0, 0, 2],
];

const relayTargets = [
  [5, 1],
  [5, 4],
  [5, 5],
  [4, 4],
];

const OPENINGS = {
  [TILE.SOURCE]: [0, 1, 0, 0],
  [TILE.RELAY]: [0, 1, 0, 0],
  [TILE.STRAIGHT]: [1, 0, 1, 0],
  [TILE.CORNER]: [1, 1, 0, 0],
  [TILE.TEE]: [1, 1, 1, 0],
  [TILE.BLOCK]: [0, 0, 0, 0],
};

let board = [];
let initialBoard = [];
let cursor = { x: 0, y: 0 };
let moves = 0;
let litRelays = 0;
let won = false;
let history = [];
let best = Number(localStorage.getItem("signal-solder-best") || 9999);

function cloneBoard(src) {
  return src.map((row) => row.map((cell) => ({ ...cell })));
}

function rotateArray(arr, times) {
  const out = arr.slice();
  for (let i = 0; i < times; i += 1) {
    out.unshift(out.pop());
  }
  return out;
}

function openings(cell) {
  const base = OPENINGS[cell.type] || OPENINGS[TILE.BLOCK];
  return rotateArray(base, cell.rot);
}

function inBounds(x, y) {
  return x >= 0 && x < GRID && y >= 0 && y < GRID;
}

function connectedMap() {
  const powered = Array.from({ length: GRID }, () => Array(GRID).fill(false));
  const q = [];

  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      if (board[y][x].type === TILE.SOURCE) {
        q.push([x, y]);
        powered[y][x] = true;
      }
    }
  }

  while (q.length) {
    const [x, y] = q.shift();
    const here = openings(board[y][x]);

    for (let d = 0; d < 4; d += 1) {
      if (!here[d]) continue;
      const nx = x + DIRS[d][0];
      const ny = y + DIRS[d][1];
      if (!inBounds(nx, ny)) continue;
      const there = openings(board[ny][nx]);
      const opposite = (d + 2) % 4;
      if (!there[opposite]) continue;
      if (powered[ny][nx]) continue;
      powered[ny][nx] = true;
      q.push([nx, ny]);
    }
  }

  return powered;
}

function countLitRelays(powered) {
  let count = 0;
  relayTargets.forEach(([x, y]) => {
    if (powered[y][x]) count += 1;
  });
  return count;
}

function buildFreshBoard() {
  const fresh = [];
  for (let y = 0; y < GRID; y += 1) {
    const row = [];
    for (let x = 0; x < GRID; x += 1) {
      const type = typeMap[y][x];
      const locked = type === TILE.SOURCE || type === TILE.BLOCK;
      let rot = solvedRotMap[y][x];

      if (!locked) {
        const spin = Math.floor(Math.random() * 4);
        rot = (rot + spin) % 4;
      }

      row.push({ type, rot, locked });
    }
    fresh.push(row);
  }

  board = fresh;
  initialBoard = cloneBoard(fresh);
  cursor = { x: 2, y: 2 };
  moves = 0;
  won = false;
  history = [];
  messageEl.textContent = "Rotate tiles to power all relays before move limit.";
  refreshState();
}

function refreshState() {
  const powered = connectedMap();
  litRelays = countLitRelays(powered);

  moveStat.textContent = `Moves: ${moves} / ${MOVE_LIMIT}`;
  relayStat.textContent = `Relays: ${litRelays} / ${relayTargets.length}`;
  bestStat.textContent = best === 9999 ? "Best: --" : `Best: ${best}`;

  if (!won && litRelays === relayTargets.length) {
    won = true;
    if (moves < best) {
      best = moves;
      localStorage.setItem("signal-solder-best", String(best));
      messageEl.textContent = `All relays synchronized in ${moves} moves. New best.`;
    } else {
      messageEl.textContent = `All relays synchronized in ${moves} moves.`;
    }
  } else if (!won && moves >= MOVE_LIMIT) {
    messageEl.textContent = "Move limit reached. Reset or start a new board.";
  }

  draw(powered);
}

function rotateTile(x, y) {
  if (!inBounds(x, y) || won || moves >= MOVE_LIMIT) return;
  const tile = board[y][x];
  if (tile.locked || tile.type === TILE.BLOCK) return;

  history.push(cloneBoard(board));
  tile.rot = (tile.rot + 1) % 4;
  moves += 1;
  refreshState();
}

function toggleLock(x, y) {
  if (!inBounds(x, y) || won) return;
  const tile = board[y][x];
  if (tile.type === TILE.SOURCE || tile.type === TILE.BLOCK) return;
  tile.locked = !tile.locked;
  messageEl.textContent = tile.locked ? "Tile locked." : "Tile unlocked.";
  refreshState();
}

function undo() {
  if (!history.length || won) return;
  board = history.pop();
  moves = Math.max(0, moves - 1);
  refreshState();
}

function resetBoard() {
  board = cloneBoard(initialBoard);
  moves = 0;
  won = false;
  history = [];
  messageEl.textContent = "Board reset.";
  refreshState();
}

function draw(powered) {
  const w = canvas.width;
  const h = canvas.height;
  const size = Math.min(w, h) / GRID;

  ctx.clearRect(0, 0, w, h);

  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      const tile = board[y][x];
      const px = x * size;
      const py = y * size;
      const cellPowered = powered[y][x];

      ctx.fillStyle = cellPowered ? "#163747" : "#0d1f29";
      ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

      if (cursor.x === x && cursor.y === y) {
        ctx.strokeStyle = "#f4bf57";
        ctx.lineWidth = 4;
        ctx.strokeRect(px + 3, py + 3, size - 6, size - 6);
      }

      const centerX = px + size / 2;
      const centerY = py + size / 2;
      const channel = size * 0.16;
      const arm = size * 0.34;
      const ports = openings(tile);

      ctx.fillStyle = cellPowered ? "#5de2c4" : "#2e697d";
      if (ports[0]) ctx.fillRect(centerX - channel / 2, centerY - arm, channel, arm);
      if (ports[1]) ctx.fillRect(centerX, centerY - channel / 2, arm, channel);
      if (ports[2]) ctx.fillRect(centerX - channel / 2, centerY, channel, arm);
      if (ports[3]) ctx.fillRect(centerX - arm, centerY - channel / 2, arm, channel);
      ctx.beginPath();
      ctx.arc(centerX, centerY, channel * 0.9, 0, Math.PI * 2);
      ctx.fill();

      if (tile.type === TILE.SOURCE) {
        ctx.fillStyle = "#ef6f6c";
        ctx.beginPath();
        ctx.arc(centerX, centerY, channel * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      if (tile.type === TILE.RELAY) {
        ctx.strokeStyle = cellPowered ? "#5de2c4" : "#f4bf57";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.16, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (tile.locked && tile.type !== TILE.SOURCE && tile.type !== TILE.BLOCK) {
        ctx.fillStyle = "rgba(239,111,108,0.88)";
        ctx.fillRect(px + size * 0.72, py + size * 0.1, size * 0.18, size * 0.18);
      }
    }
  }
}

function moveCursor(dx, dy) {
  cursor.x = Math.max(0, Math.min(GRID - 1, cursor.x + dx));
  cursor.y = Math.max(0, Math.min(GRID - 1, cursor.y + dy));
  refreshState();
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "enter"].includes(key)) {
    event.preventDefault();
  }

  if (key === "arrowup" || key === "w") moveCursor(0, -1);
  if (key === "arrowdown" || key === "s") moveCursor(0, 1);
  if (key === "arrowleft" || key === "a") moveCursor(-1, 0);
  if (key === "arrowright" || key === "d") moveCursor(1, 0);

  if (key === " " || key === "enter") rotateTile(cursor.x, cursor.y);
  if (key === "q") toggleLock(cursor.x, cursor.y);
  if (key === "u") undo();
  if (key === "r") resetBoard();
  if (key === "n") buildFreshBoard();
});

canvas.addEventListener("pointerdown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const size = rect.width / GRID;
  const gx = Math.max(0, Math.min(GRID - 1, Math.floor(x / size)));
  const gy = Math.max(0, Math.min(GRID - 1, Math.floor(y / size)));

  if (cursor.x === gx && cursor.y === gy) {
    toggleLock(gx, gy);
  } else {
    cursor.x = gx;
    cursor.y = gy;
    rotateTile(gx, gy);
  }
});

undoBtn.addEventListener("click", undo);
resetBtn.addEventListener("click", resetBoard);
shuffleBtn.addEventListener("click", buildFreshBoard);

buildFreshBoard();
