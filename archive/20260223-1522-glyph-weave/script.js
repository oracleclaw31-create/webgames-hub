const c = document.getElementById('game');
const g = c.getContext('2d');
const uiMoves = document.getElementById('moves');
const uiStatus = document.getElementById('status');

let board;
let moves;

function solvedState() {
  return [1, 2, 3, 4, 5, 6, 7, 8, 0];
}

function isSolved() {
  const target = solvedState();
  for (let i = 0; i < 9; i += 1) if (board[i] !== target[i]) return false;
  return true;
}

function canSwap(a, b) {
  const ax = a % 3, ay = Math.floor(a / 3);
  const bx = b % 3, by = Math.floor(b / 3);
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
}

function moveDir(dir) {
  const z = board.indexOf(0);
  let t = -1;
  if (dir === 'up') t = z + 3;
  if (dir === 'down') t = z - 3;
  if (dir === 'left') t = (z % 3 < 2) ? z + 1 : -1;
  if (dir === 'right') t = (z % 3 > 0) ? z - 1 : -1;
  if (t < 0 || t > 8 || !canSwap(z, t)) return;
  [board[z], board[t]] = [board[t], board[z]];
  moves += 1;
  draw();
}

function shuffle(times = 120) {
  board = solvedState();
  const dirs = ['up', 'down', 'left', 'right'];
  for (let i = 0; i < times; i += 1) moveDir(dirs[Math.floor(Math.random() * dirs.length)]);
  moves = 0;
  draw();
}

function draw() {
  g.clearRect(0, 0, c.width, c.height);
  const size = c.width / 3;

  for (let i = 0; i < 9; i += 1) {
    const v = board[i];
    const x = (i % 3) * size;
    const y = Math.floor(i / 3) * size;

    g.fillStyle = v === 0 ? '#1e2340' : '#6f7bcb';
    g.fillRect(x + 4, y + 4, size - 8, size - 8);

    if (v !== 0) {
      g.fillStyle = '#fff';
      g.font = 'bold 62px system-ui';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(String(v), x + size / 2, y + size / 2);
    }
  }

  uiMoves.textContent = String(moves);
  uiStatus.textContent = isSolved() ? 'SOLVED' : 'SOLVING';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') moveDir('up');
  if (e.key === 'ArrowDown') moveDir('down');
  if (e.key === 'ArrowLeft') moveDir('left');
  if (e.key === 'ArrowRight') moveDir('right');
});

document.getElementById('resetBtn').addEventListener('click', () => shuffle());
for (const b of document.querySelectorAll('[data-dir]')) {
  b.addEventListener('click', () => moveDir(b.dataset.dir));
}

shuffle();
