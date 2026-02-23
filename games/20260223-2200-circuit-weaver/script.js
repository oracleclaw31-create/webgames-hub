const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const levelEl = document.getElementById("level");
const movesEl = document.getElementById("moves");
const poweredEl = document.getElementById("powered");
const messageEl = document.getElementById("message");

const SIZE = 7;
const TILE_SIZE = canvas.width / SIZE;
const DIR = {
  N: { bit: 1, dx: 0, dy: -1, opposite: 4 },
  E: { bit: 2, dx: 1, dy: 0, opposite: 8 },
  S: { bit: 4, dx: 0, dy: 1, opposite: 1 },
  W: { bit: 8, dx: -1, dy: 0, opposite: 2 }
};
const ORDERED_DIRS = [DIR.N, DIR.E, DIR.S, DIR.W];
const SOURCE = { x: 0, y: 3 };
const TARGETS = [
  { x: 6, y: 1 },
  { x: 6, y: 3 },
  { x: 6, y: 5 }
];

const LEVELS = [
  {
    moveLimit: 24,
    paths: [
      [[0, 3], [1, 3], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [5, 1], [6, 1]],
      [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3]],
      [[0, 3], [1, 3], [2, 3], [2, 4], [3, 4], [4, 4], [4, 5], [5, 5], [6, 5]]
    ]
  },
  {
    moveLimit: 21,
    paths: [
      [[0, 3], [1, 3], [1, 2], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1]],
      [[0, 3], [1, 3], [2, 3], [3, 3], [3, 2], [4, 2], [5, 2], [5, 3], [6, 3]],
      [[0, 3], [1, 3], [1, 4], [2, 4], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5]]
    ]
  },
  {
    moveLimit: 18,
    paths: [
      [[0, 3], [1, 3], [2, 3], [2, 2], [3, 2], [4, 2], [4, 1], [5, 1], [6, 1]],
      [[0, 3], [1, 3], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3], [5, 3], [6, 3]],
      [[0, 3], [1, 3], [2, 3], [3, 3], [3, 4], [4, 4], [5, 4], [5, 5], [6, 5]]
    ]
  }
];

const state = {
  levelIndex: 0,
  tiles: [],
  cursor: { x: 1, y: 3 },
  movesLeft: 0,
  poweredTargets: 0,
  flow: new Set(),
  status: "playing"
};

function key(x, y) {
  return `${x},${y}`;
}

function inBounds(x, y) {
  return x >= 0 && x < SIZE && y >= 0 && y < SIZE;
}

function rotateMask(mask, steps) {
  let result = mask;
  for (let i = 0; i < steps; i += 1) {
    const north = (result & DIR.N.bit) ? DIR.E.bit : 0;
    const east = (result & DIR.E.bit) ? DIR.S.bit : 0;
    const south = (result & DIR.S.bit) ? DIR.W.bit : 0;
    const west = (result & DIR.W.bit) ? DIR.N.bit : 0;
    result = north | east | south | west;
  }
  return result;
}

function addConnection(grid, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const from = grid[a[1]][a[0]];
  const to = grid[b[1]][b[0]];

  if (dx === 1) {
    from.baseMask |= DIR.E.bit;
    to.baseMask |= DIR.W.bit;
  } else if (dx === -1) {
    from.baseMask |= DIR.W.bit;
    to.baseMask |= DIR.E.bit;
  } else if (dy === 1) {
    from.baseMask |= DIR.S.bit;
    to.baseMask |= DIR.N.bit;
  } else if (dy === -1) {
    from.baseMask |= DIR.N.bit;
    to.baseMask |= DIR.S.bit;
  }
}

function buildLevel(levelDef) {
  const grid = [];
  for (let y = 0; y < SIZE; y += 1) {
    const row = [];
    for (let x = 0; x < SIZE; x += 1) {
      row.push({ baseMask: 0, mask: 0, rotatable: false, isSource: false, isTarget: false });
    }
    grid.push(row);
  }

  for (const path of levelDef.paths) {
    for (let i = 0; i < path.length - 1; i += 1) {
      addConnection(grid, path[i], path[i + 1]);
    }
  }

  grid[SOURCE.y][SOURCE.x].isSource = true;
  for (const target of TARGETS) {
    grid[target.y][target.x].isTarget = true;
  }

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const tile = grid[y][x];
      tile.mask = tile.baseMask;
      tile.rotatable = tile.baseMask !== 0 && !tile.isSource;
      if (tile.rotatable) {
        const rotations = Math.floor(Math.random() * 4);
        tile.mask = rotateMask(tile.baseMask, rotations);
      }
    }
  }

  return grid;
}

function findNextPlayable(startX, startY, stepX, stepY) {
  let x = startX;
  let y = startY;
  for (let i = 0; i < SIZE * SIZE; i += 1) {
    x = (x + stepX + SIZE) % SIZE;
    y = (y + stepY + SIZE) % SIZE;
    if (state.tiles[y][x].rotatable) {
      return { x, y };
    }
  }
  return { x: startX, y: startY };
}

function updateFlow() {
  const visited = new Set();
  const queue = [SOURCE];
  visited.add(key(SOURCE.x, SOURCE.y));

  while (queue.length > 0) {
    const node = queue.shift();
    const tile = state.tiles[node.y][node.x];

    for (const dir of ORDERED_DIRS) {
      if ((tile.mask & dir.bit) === 0) {
        continue;
      }
      const nx = node.x + dir.dx;
      const ny = node.y + dir.dy;
      if (!inBounds(nx, ny)) {
        continue;
      }
      const other = state.tiles[ny][nx];
      if ((other.mask & dir.opposite) === 0) {
        continue;
      }
      const token = key(nx, ny);
      if (!visited.has(token)) {
        visited.add(token);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  state.flow = visited;
  state.poweredTargets = TARGETS.filter((target) => visited.has(key(target.x, target.y))).length;
}

function setMessage(text, kind = "") {
  messageEl.textContent = text;
  messageEl.className = `message ${kind}`.trim();
}

function refreshHud() {
  levelEl.textContent = String(state.levelIndex + 1);
  movesEl.textContent = String(state.movesLeft);
  poweredEl.textContent = String(state.poweredTargets);
}

function applyRotation() {
  if (state.status !== "playing") {
    return;
  }

  const tile = state.tiles[state.cursor.y][state.cursor.x];
  if (!tile.rotatable || state.movesLeft <= 0) {
    return;
  }

  tile.mask = rotateMask(tile.mask, 1);
  state.movesLeft -= 1;
  updateFlow();

  if (state.poweredTargets === TARGETS.length) {
    if (state.levelIndex < LEVELS.length - 1) {
      state.status = "between";
      setMessage("Circuit stable. Press Rotate or Enter for next board.", "win");
    } else {
      state.status = "won";
      setMessage("Grid synchronized. You restored all sectors! Press Restart to replay.", "win");
    }
  } else if (state.movesLeft === 0) {
    state.status = "lost";
    setMessage("Signal failed: no moves left. Press Restart to try again.", "warn");
  } else {
    setMessage("Keep routing current to all three terminals.");
  }

  refreshHud();
}

function startLevel(index) {
  state.levelIndex = index;
  state.tiles = buildLevel(LEVELS[index]);
  state.movesLeft = LEVELS[index].moveLimit;
  state.status = "playing";
  state.cursor = findNextPlayable(SOURCE.x, SOURCE.y, 1, 0);
  updateFlow();
  refreshHud();
  setMessage("Arrow keys to move cursor, Space to rotate. Tap tiles on touch.");
}

function restartCurrentLevel() {
  startLevel(state.levelIndex);
}

function nextLevelOrReplay() {
  if (state.status === "between") {
    startLevel(state.levelIndex + 1);
  } else if (state.status === "won" || state.status === "lost") {
    restartCurrentLevel();
  }
}

function moveCursor(dx, dy) {
  if (state.status !== "playing") {
    return;
  }

  let x = state.cursor.x;
  let y = state.cursor.y;
  for (let i = 0; i < SIZE * SIZE; i += 1) {
    x = (x + dx + SIZE) % SIZE;
    y = (y + dy + SIZE) % SIZE;
    if (state.tiles[y][x].rotatable) {
      state.cursor.x = x;
      state.cursor.y = y;
      return;
    }
  }
}

function drawTile(x, y, tile, energized, selected) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  const centerX = px + TILE_SIZE / 2;
  const centerY = py + TILE_SIZE / 2;

  ctx.fillStyle = selected ? "#173f65" : "#0e2944";
  ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);

  if (tile.mask !== 0) {
    ctx.strokeStyle = energized ? "#7df9c2" : "#5a82aa";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";

    const links = [
      { bit: DIR.N.bit, x1: centerX, y1: centerY, x2: centerX, y2: py + 10 },
      { bit: DIR.E.bit, x1: centerX, y1: centerY, x2: px + TILE_SIZE - 10, y2: centerY },
      { bit: DIR.S.bit, x1: centerX, y1: centerY, x2: centerX, y2: py + TILE_SIZE - 10 },
      { bit: DIR.W.bit, x1: centerX, y1: centerY, x2: px + 10, y2: centerY }
    ];

    for (const link of links) {
      if ((tile.mask & link.bit) !== 0) {
        ctx.beginPath();
        ctx.moveTo(link.x1, link.y1);
        ctx.lineTo(link.x2, link.y2);
        ctx.stroke();
      }
    }

    ctx.fillStyle = energized ? "#b5ffdf" : "#80a7cf";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  if (tile.isSource) {
    ctx.fillStyle = "#ffd479";
    ctx.fillRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
  }

  if (tile.isTarget) {
    ctx.strokeStyle = energized ? "#7df9c2" : "#ffd479";
    ctx.lineWidth = 3;
    ctx.strokeRect(px + 12, py + 12, TILE_SIZE - 24, TILE_SIZE - 24);
  }
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const tile = state.tiles[y][x];
      const energized = state.flow.has(key(x, y));
      const selected = x === state.cursor.x && y === state.cursor.y;
      drawTile(x, y, tile, energized, selected);
    }
  }

  ctx.strokeStyle = "rgba(180,220,255,0.22)";
  ctx.lineWidth = 1;
  for (let i = 1; i < SIZE; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * TILE_SIZE, 0);
    ctx.lineTo(i * TILE_SIZE, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * TILE_SIZE);
    ctx.lineTo(canvas.width, i * TILE_SIZE);
    ctx.stroke();
  }
}

function loop() {
  drawGrid();
  requestAnimationFrame(loop);
}

function handleKey(event) {
  const keyName = event.key.toLowerCase();

  if (keyName === "arrowup" || keyName === "w") {
    event.preventDefault();
    moveCursor(0, -1);
  } else if (keyName === "arrowdown" || keyName === "s") {
    event.preventDefault();
    moveCursor(0, 1);
  } else if (keyName === "arrowleft" || keyName === "a") {
    event.preventDefault();
    moveCursor(-1, 0);
  } else if (keyName === "arrowright" || keyName === "d") {
    event.preventDefault();
    moveCursor(1, 0);
  } else if (keyName === " " || keyName === "r") {
    event.preventDefault();
    if (state.status === "between") {
      nextLevelOrReplay();
    } else {
      applyRotation();
    }
  } else if (keyName === "enter") {
    event.preventDefault();
    nextLevelOrReplay();
  } else if (keyName === "escape") {
    event.preventDefault();
    restartCurrentLevel();
  }
}

function bindButton(id, callback) {
  const btn = document.getElementById(id);
  btn.addEventListener("click", callback);
  btn.addEventListener("touchstart", (event) => {
    event.preventDefault();
    callback();
  }, { passive: false });
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * SIZE);
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * SIZE);
  if (!inBounds(x, y)) {
    return;
  }

  state.cursor.x = x;
  state.cursor.y = y;
  if (state.tiles[y][x].rotatable && state.status === "playing") {
    applyRotation();
  }
});

bindButton("btn-up", () => moveCursor(0, -1));
bindButton("btn-down", () => moveCursor(0, 1));
bindButton("btn-left", () => moveCursor(-1, 0));
bindButton("btn-right", () => moveCursor(1, 0));
bindButton("btn-rotate", () => {
  if (state.status === "between") {
    nextLevelOrReplay();
  } else {
    applyRotation();
  }
});
bindButton("btn-restart", () => restartCurrentLevel());

document.addEventListener("keydown", handleKey);

startLevel(0);
loop();
