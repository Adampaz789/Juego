
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const player = { x: 32, y: 160, w: 16, h: 16, color: 'blue' };
const enemies = [
  { x: 200, y: 160, w: 16, h: 16, color: 'red', dx: 1 },
  { x: 400, y: 160, w: 16, h: 16, color: 'red', dx: -1 }
];

let keys = {};
let level = 1;

document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function drawRect(obj) {
  ctx.fillStyle = obj.color;
  ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
}

function update() {
  if (keys['ArrowRight']) player.x += 2;
  if (keys['ArrowLeft']) player.x -= 2;
  if (keys['ArrowUp']) player.y -= 2;
  if (keys['ArrowDown']) player.y += 2;

  enemies.forEach(enemy => {
    enemy.x += enemy.dx;
    if (enemy.x <= 0 || enemy.x + enemy.w >= WIDTH) {
      enemy.dx *= -1;
    }
    if (checkCollision(player, enemy)) {
      alert('¡Perdiste! Nivel ' + level);
      resetGame();
    }
  });

  if (player.x > WIDTH - TILE_SIZE) {
    level++;
    alert('¡Siguiente nivel! Nivel ' + level);
    resetGame();
  }
}

function checkCollision(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

function resetGame() {
  player.x = 32;
  player.y = 160;
  enemies.forEach((enemy, i) => {
    enemy.x = 200 + i * 200;
    enemy.dx = i % 2 === 0 ? 1 : -1;
  });
}

function gameLoop() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawRect(player);
  enemies.forEach(drawRect);
  update();
  requestAnimationFrame(gameLoop);
}

gameLoop();
