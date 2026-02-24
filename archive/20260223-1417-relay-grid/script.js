const levels = [
  {
    time: 60,
    map: [
      '########',
      '#S..r..#',
      '#.##.#.#',
      '#..r.#G#',
      '#.##.#.#',
      '#..r...#',
      '#......#',
      '########'
    ]
  },
  {
    time: 55,
    map: [
      '########',
      '#S.r...#',
      '#.##.#.#',
      '#..#r#G#',
      '#.##.#.#',
      '#..r...#',
      '#..#...#',
      '########'
    ]
  }
];

let levelIdx = 0;
let player = { x: 1, y: 1 };
let selectedRelay = null;
let timeLeft = 60;
let timer = null;
let relays = [];

const gridEl = document.getElementById('grid');
const msgEl = document.getElementById('msg');
const levelEl = document.getElementById('level');
const timeEl = document.getElementById('time');
const energyEl = document.getElementById('energy');

function loadLevel() {
  const lv = levels[levelIdx];
  const rows = lv.map;
  relays = [];
  selectedRelay = null;
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const c = rows[y][x];
      if (c === 'S') player = { x, y };
      if (c === 'r') relays.push({ x, y, on: false });
    }
  }
  timeLeft = lv.time;
  levelEl.textContent = String(levelIdx + 1);
  msgEl.textContent = 'Connect the power line.';
  runTimer();
  render();
}

function runTimer() {
  if (timer) clearInterval(timer);
  timeEl.textContent = String(timeLeft);
  timer = setInterval(() => {
    timeLeft -= 1;
    timeEl.textContent = String(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timer);
      msgEl.textContent = 'Time up! Reset and reroute.';
    }
  }, 1000);
}

function tileAt(x, y) { return levels[levelIdx].map[y][x]; }
function relayAt(x, y) { return relays.find(r => r.x === x && r.y === y); }

function canMove(x, y) {
  const c = tileAt(x, y);
  return c !== '#';
}

function move(dx, dy) {
  if (timeLeft <= 0) return;
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (canMove(nx, ny)) {
    player = { x: nx, y: ny };
    render();
    checkWin();
  }
}

function toggleRelay() {
  if (timeLeft <= 0) return;
  if (!selectedRelay) {
    msgEl.textContent = 'Tap a relay tile first, or stand next to one and press Space.';
    return;
  }
  selectedRelay.on = !selectedRelay.on;
  render();
  checkWin();
}

function toggleNearbyRelay() {
  const dirs = [[1,0],[-1,0],[0,1],[0,-1],[0,0]];
  for (const [dx, dy] of dirs) {
    const r = relayAt(player.x + dx, player.y + dy);
    if (r) {
      selectedRelay = r;
      toggleRelay();
      return;
    }
  }
  msgEl.textContent = 'No relay nearby.';
}

function computeEnergy() {
  const source = findChar('S');
  const goal = findChar('G');
  const open = [[source.x, source.y]];
  const seen = new Set([`${source.x},${source.y}`]);

  while (open.length) {
    const [x, y] = open.shift();
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (seen.has(key)) continue;
      const c = tileAt(nx, ny);
      if (c === '#') continue;
      const relay = relayAt(nx, ny);
      if (relay && !relay.on) continue;
      seen.add(key);
      open.push([nx, ny]);
    }
  }

  const connected = seen.has(`${goal.x},${goal.y}`);
  energyEl.textContent = connected ? '100' : '0';
  return connected;
}

function checkWin() {
  const connected = computeEnergy();
  const goal = findChar('G');
  if (connected && player.x === goal.x && player.y === goal.y) {
    clearInterval(timer);
    if (levelIdx < levels.length - 1) {
      msgEl.textContent = 'Level clear! Next level loading...';
      setTimeout(() => { levelIdx += 1; loadLevel(); }, 800);
    } else {
      msgEl.textContent = `You won! Bonus ${Math.max(0, timeLeft)} points.`;
    }
  }
}

function findChar(ch) {
  const rows = levels[levelIdx].map;
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] === ch) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

function render() {
  const rows = levels[levelIdx].map;
  gridEl.innerHTML = '';
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const c = rows[y][x];
      const d = document.createElement('button');
      d.className = 'cell';
      d.type = 'button';

      if (c === '#') d.classList.add('wall');
      else d.classList.add('path');

      if (c === 'S') { d.classList.add('source'); d.textContent = 'S'; }
      if (c === 'G') { d.classList.add('goal'); d.textContent = 'G'; }

      const relay = relayAt(x, y);
      if (relay) {
        d.classList.add('relay', relay.on ? 'on' : 'off');
        d.textContent = relay.on ? 'ON' : 'R';
      }

      if (player.x === x && player.y === y) d.classList.add('player');

      d.addEventListener('click', () => {
        if (relay) {
          selectedRelay = relay;
          msgEl.textContent = `Relay selected (${x},${y}). Tap Toggle.`;
        }
      });
      gridEl.appendChild(d);
    }
  }
  computeEnergy();
}

document.querySelectorAll('[data-dir]').forEach(btn => {
  btn.addEventListener('click', () => {
    const dir = btn.dataset.dir;
    if (dir === 'up') move(0, -1);
    if (dir === 'down') move(0, 1);
    if (dir === 'left') move(-1, 0);
    if (dir === 'right') move(1, 0);
  });
});

document.getElementById('toggleBtn').addEventListener('click', toggleRelay);
document.getElementById('resetBtn').addEventListener('click', loadLevel);

document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'arrowup' || k === 'w') move(0, -1);
  if (k === 'arrowdown' || k === 's') move(0, 1);
  if (k === 'arrowleft' || k === 'a') move(-1, 0);
  if (k === 'arrowright' || k === 'd') move(1, 0);
  if (k === ' ') { e.preventDefault(); toggleNearbyRelay(); }
});

loadLevel();
