
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let player = { x: 32, y: 160, w: 16, h: 16, color: '#00f', lives: 3 };
let enemies = [];
let keys = {};
let level = 1;

document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function press(key) {
  keys[key] = true;
  setTimeout(() => keys[key] = false, 200);
}

function drawSprite(obj, type) {
  ctx.fillStyle = obj.color;
  ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
  if (type === 'player') {
    ctx.fillStyle = 'white';
    ctx.fillRect(obj.x + 4, obj.y + 4, 2, 2); // eyes
    ctx.fillRect(obj.x + 10, obj.y + 4, 2, 2);
  } else if (type === 'enemy') {
    ctx.fillStyle = 'black';
    ctx.fillRect(obj.x + 4, obj.y + 4, 3, 3);
  }
}

function spawnEnemies(count) {
  enemies = [];
  for (let i = 0; i < count; i++) {
    enemies.push({ x: 120 + i * 100, y: 160, w: 16, h: 16, color: 'red', dx: i % 2 === 0 ? 1 : -1 });
  }
}

function checkCollision(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

function updateHUD() {
  document.getElementById('level').innerText = level;
  document.getElementById('lives').innerText = player.lives;
}

function update() {
  if (keys['ArrowRight']) player.x += 2;
  if (keys['ArrowLeft']) player.x -= 2;
  if (keys['ArrowUp']) player.y -= 2;
  if (keys['ArrowDown']) player.y += 2;

  enemies.forEach(enemy => {
    enemy.x += enemy.dx;
    if (enemy.x <= 0 || enemy.x + enemy.w >= WIDTH) enemy.dx *= -1;

    if (checkCollision(player, enemy)) {
      player.lives--;
      if (player.lives <= 0) {
        alert("¡Game Over en el nivel " + level + "!");
        level = 1;
        player.lives = 3;
      } else {
        alert("¡Has sido golpeado!");
      }
      resetGame();
    }
  });

  if (player.x > WIDTH - 32) {
    level++;
    alert("¡Nivel superado! Nivel " + level);
    resetGame();
  }

  updateHUD();
}

function resetGame() {
  player.x = 32;
  player.y = 160;
  spawnEnemies(level + 1);
}

function gameLoop() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawSprite(player, 'player');
  enemies.forEach(e => drawSprite(e, 'enemy'));
  update();
  requestAnimationFrame(gameLoop);
}

spawnEnemies(2);
updateHUD();
gameLoop();
