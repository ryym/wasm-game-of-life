import { memory } from 'wasm-game-of-life/wasm_game_of_life_bg';
import { Universe, Cell } from 'wasm-game-of-life';

const CELL_SIZE = 8;
const GRID_COLOR = '#CCCCCC';
const DEAD_COLOR = '#FFFFFF';
const ALIVE_COLOR = '#000000';

const universe = Universe.new();
const width = universe.width();
const height = universe.height();

const canvas = document.getElementById('game-of-life-canvas');
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

canvas.addEventListener('click', event => {
  const boundingRect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / boundingRect.width;
  const scaleY = canvas.height / boundingRect.height;

  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop = (event.clientY - boundingRect.top) * scaleY;

  const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
  const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

  universe.toggle_cell(row, col);

  drawGrid();
  drawCells();
});

const playPauseButton = document.getElementById('play-pause');
playPauseButton.addEventListener('click', event => {
  if (isPaused()) {
    play();
  } else {
    pause();
  }
});

const resetCellsButton = document.getElementById('reset-cells');
resetCellsButton.addEventListener('click', event => {
  universe.reset_cells();
});

const ctx = canvas.getContext('2d');

let animationId = null;

const isPaused = () => animationId === null;

const play = () => {
  playPauseButton.textContent = '⏸';
  renderLoop();
};

const pause = () => {
  playPauseButton.textContent = '▶';
  cancelAnimationFrame(animationId);
  animationId = null;
};

const renderLoop = () => {
  universe.tick();

  drawGrid();
  drawCells();

  animationId = requestAnimationFrame(renderLoop);
};

const drawGrid = () => {
  ctx.beginPath();
  ctx.strokeStyle = GRID_COLOR;

  // Inner cell size.
  const cellSize = CELL_SIZE + 1;

  // Vertical lines.
  for (let i = 0; i <= width; i++) {
    ctx.moveTo(i * cellSize + 1, 0);
    ctx.lineTo(i * cellSize + 1, cellSize * height + 1);
  }

  // Horizontal lines.
  for (let j = 0; j <= height; j++) {
    ctx.moveTo(0, j * cellSize + 1);
    ctx.lineTo(cellSize * width + 1, j * cellSize + 1);
  }

  ctx.stroke();
};

const getIndex = (row, col) => row * width + col;

const drawCells = () => {
  const cellsPtr = universe.cells();

  // Rust 側でゲームのボードを1次元配列として作っているおかげで、
  // JS 側からのアクセスが用意になる。
  const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

  ctx.beginPath();

  const cellSize = CELL_SIZE + 1;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = getIndex(row, col);
      ctx.fillStyle = cells[idx] === Cell.Dead ? DEAD_COLOR : ALIVE_COLOR;
      ctx.fillRect(col * cellSize + 1, row * cellSize + 1, CELL_SIZE, CELL_SIZE);
    }
  }

  ctx.stroke();
};

play();
