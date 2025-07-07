const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const startBtn = document.getElementById('startBtn');
const menu = document.getElementById('menu');
const transitionScreen = document.getElementById('transitionScreen');
const transitionText = document.getElementById('transitionText');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const shopScreen = document.getElementById('shopScreen');
const buyLifeBtn = document.getElementById('buyLifeBtn');
const buyShieldBtn = document.getElementById('buyShieldBtn');
const buySwordBtn = document.getElementById('buySwordBtn');
const continueBtn = document.getElementById('continueBtn');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartBtn = document.getElementById('restartBtn');
const finalScore = document.getElementById('finalScore');
const winScreen = document.getElementById('winScreen');
const winScore = document.getElementById('winScore');
const restartWinBtn = document.getElementById('restartWinBtn');

const levels = [
  { name: "Enchanted Forest", color: "#00ff88", enemyColor: "#008855", bossColor: "#22ff88" },
  { name: "Dark Grove", color: "#44ff44", enemyColor: "#228822", bossColor: "#55ff55" },
  { name: "Ruined Village", color: "#999999", enemyColor: "#555555", bossColor: "#bbbbbb" },
  { name: "Castle Walls", color: "#4444ff", enemyColor: "#2222aa", bossColor: "#7777ff" },
  { name: "Castle Halls", color: "#8844ff", enemyColor: "#5522aa", bossColor: "#aa77ff" },
  { name: "Catacombs", color: "#ff4444", enemyColor: "#aa2222", bossColor: "#ff7777" },
  { name: "Crystal Cave", color: "#44ffff", enemyColor: "#22aaaa", bossColor: "#77ffff" },
  { name: "Infernal Volcano", color: "#ff5500", enemyColor: "#cc2200", bossColor: "#ff8800" },
  { name: "Arcane Tower", color: "#ff00ff", enemyColor: "#aa00aa", bossColor: "#ff55ff" },
  { name: "Demonic Throne", color: "#ff0000", enemyColor: "#aa0000", bossColor: "#ff3333" }
];

let currentLevelIndex = 0;
let playerRunes = 0;
let game;

class Background {
  constructor(color) {
    this.color = color;
    this.stars = Array.from({ length: 100 }, () => ({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      size: Math.random() * 2,
      speed: 0.5 + Math.random()
    }));
  }

  update() {
    for (let star of this.stars) {
      star.x -= star.speed;
      if (star.x < 0) {
        star.x = WIDTH;
        star.y = Math.random() * HEIGHT;
      }
    }
  }

  draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = this.color;
    for (let star of this.stars) {
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }
}

class Player {
  constructor() {
    this.w = 28;
    this.h = 28;
    this.x = 60;
    this.y = HEIGHT / 2 - this.h / 2;
    this.color = "#aaffaa";
    this.lives = 3;
    this.speed = 5;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.shield = false;
    this.sword = false;
  }

  update(keys) {
    if (keys['ArrowRight'] || keys['d']) this.x += this.speed;
    if (keys['ArrowLeft'] || keys['a']) this.x -= this.speed;
    if (keys['ArrowUp'] || keys['w']) this.y -= this.speed;
    if (keys['ArrowDown'] || keys['s']) this.y += this.speed;

    this.x = Math.max(0, Math.min(WIDTH - this.w, this.x));
    this.y = Math.max(0, Math.min(HEIGHT - this.h, this.y));

    if (this.invulnerable) {
      this.invulnerableTimer--;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
        this.shield = false;
        this.sword = false;
      }
    }
  }

  draw() {
    if (this.invulnerable && this.invulnerableTimer % 10 < 5) return;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#000";
    ctx.fillRect(this.x + 6, this.y + 6, 16, 4);
    ctx.fillRect(this.x + 10, this.y + 12, 8, 4);

    if (this.shield) {
      ctx.strokeStyle = "#00f";
      ctx.lineWidth = 3;
      ctx.strokeRect(this.x - 3, this.y - 3, this.w + 6, this.h + 6);
    }

    if (this.sword) {
      ctx.fillStyle = "#ff0";
      ctx.fillRect(this.x + this.w, this.y + this.h / 2 - 2, 10, 4);
    }
  }

  hit() {
    if (!this.invulnerable) {
      this.lives--;
      this.invulnerable = true;
      this.invulnerableTimer = 60;
    }
  }
}

class Enemy {
  constructor(x, y, speed, color, pattern = 1) {
    this.x = x;
    this.y = y;
    this.w = 25;
    this.h = 25;
    this.color = color;
    this.speed = speed;
    this.pattern = pattern;
    this.direction = 1;
  }

  update() {
    this.x -= this.speed;
    if (this.pattern === 2) {
      this.y += Math.sin(this.x / 15) * 3;
    } else if (this.pattern === 3) {
      this.y += this.direction * this.speed / 2;
      if (this.y <= 0 || this.y + this.h >= HEIGHT) this.direction *= -1;
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.shadowBlur = 0;
  }
}

class Boss {
  constructor(color) {
    this.x = WIDTH + 200;
    this.y = HEIGHT / 2 - 80;
    this.w = 160;
    this.h = 160;
    this.color = color;
    this.hp = 30; // ✅ Vida reducida a la mitad
    this.speed = 1.5;
    this.direction = 1;
    this.phase = 1;
  }

  update() {
    this.x -= this.speed;
    this.y += this.direction * 2;
    if (this.y <= 0 || this.y + this.h >= HEIGHT) this.direction *= -1;

    if (this.hp < 15 && this.phase === 1) {
      this.phase = 2;
      this.speed += 1;
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 25;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#000";
    ctx.fillRect(this.x + 40, this.y + 40, 20, 20);
    ctx.fillRect(this.x + 100, this.y + 40, 20, 20);
    ctx.fillRect(this.x + 60, this.y + 110, 40, 10);
  }
}

class Projectile {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.w = 10;
    this.h = 5;
    this.color = "#ff0";
    this.speed = speed;
    this.active = true;
  }

  update() {
    this.x += this.speed;
    if (this.x > WIDTH) this.active = false;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class Game {
  constructor() {
    this.bg = new Background(levels[currentLevelIndex].color);
    this.player = new Player();
    this.enemies = [];
    this.projectiles = [];
    this.boss = null;
    this.keys = {};
    this.bossAppeared = false;
    this.gameOver = false;
    this.spawnCooldown = 0;
    this.score = 0;
  }

  spawnEnemy() {
    let y = Math.random() * (HEIGHT - 50);
    let speed = 3 + currentLevelIndex * 0.5;
    let pattern = Math.floor(Math.random() * 3) + 1;
    this.enemies.push(new Enemy(WIDTH, y, speed, levels[currentLevelIndex].enemyColor, pattern));
  }

  checkCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  update() {
    if (this.gameOver) return;

    this.bg.update();
    this.player.update(this.keys);

    if (!this.bossAppeared && this.score >= 1500) {
      this.boss = new Boss(levels[currentLevelIndex].bossColor);
      this.bossAppeared = true;
    }

    if (!this.bossAppeared && this.spawnCooldown <= 0) {
      this.spawnEnemy();
      this.spawnCooldown = 80 - currentLevelIndex * 3;
    } else {
      this.spawnCooldown--;
    }

    for (let enemy of this.enemies) {
      enemy.update();
      if (this.checkCollision(this.player, enemy)) {
        this.player.hit();
        if (this.player.lives <= 0) {
          this.gameOver = true;
          showGameOver();
        }
      }
    }

    for (let projectile of this.projectiles) {
      projectile.update();

      for (let enemy of this.enemies) {
        if (this.checkCollision(projectile, enemy)) {
          enemy.x = -100;
          projectile.active = false;
          this.score += 100;
          playerRunes += 10;
        }
      }

      if (this.boss && this.checkCollision(projectile, this.boss)) {
        this.boss.hp -= 5; // ✅ Daño aumentado
        projectile.active = false;
        if (this.boss.hp <= 0) {
          this.gameOver = true;
          setTimeout(() => showTransition(), 1000);
        }
      }
    }

    this.enemies = this.enemies.filter(e => e.x + e.w > 0);
    this.projectiles = this.projectiles.filter(p => p.active);

    if (this.boss) this.boss.update();

    this.score += 1;
  }

  drawHUD() {
    ctx.fillStyle = "#fff";
    ctx.font = "14px monospace";
    ctx.fillText(`Lives: ${this.player.lives}`, 10, 25);
    ctx.fillText(`Runes: ${playerRunes}`, 10, 45);
    ctx.fillText(`Zone: ${levels[currentLevelIndex].name}`, 10, 65);
    if (this.boss) {
      ctx.fillStyle = "#ffaa00";
      ctx.fillText(`Boss HP: ${Math.max(0, Math.floor(this.boss.hp))}`, WIDTH - 180, 25);
    }
  }

  draw() {
    this.bg.draw();
    this.player.draw();
    for (let enemy of this.enemies) enemy.draw();
    for (let projectile of this.projectiles) projectile.draw();
    if (this.boss) this.boss.draw();
    this.drawHUD();
  }
}

document.addEventListener('keydown', e => {
  if (game) game.keys[e.key] = true;
});
document.addEventListener('keyup', e => {
  if (game) game.keys[e.key] = false;
});

canvas.addEventListener('mousedown', e => {
  if (e.button === 0 && game) {
    const px = game.player.x + game.player.w;
    const py = game.player.y + game.player.h / 2 - 2;
    game.projectiles.push(new Projectile(px, py, 8));
  }
});

function startGame() {
  game = new Game();
  menu.style.display = 'none';
  gameOverScreen.style.display = 'none';
  winScreen.style.display = 'none';
  transitionScreen.style.display = 'none';
  shopScreen.style.display = 'none';
  canvas.style.display = 'block';

  requestAnimationFrame(gameLoop);
}

function showGameOver() {
  finalScore.textContent = `Runes collected: ${playerRunes}`;
  gameOverScreen.style.display = 'block';
  canvas.style.display = 'none';
}

function showTransition() {
  if (currentLevelIndex + 1 >= levels.length) {
    showWin();
    return;
  }
  currentLevelIndex++;
  transitionText.textContent = `Level ${currentLevelIndex} Completed!`;
  transitionScreen.style.display = 'block';
  canvas.style.display = 'none';
}

function showWin() {
  winScore.textContent = `Total runes: ${playerRunes}`;
  winScreen.style.display = 'block';
  canvas.style.display = 'none';
}

function gameLoop() {
  if (game) {
    game.update();
    game.draw();
    if (!game.gameOver) {
      requestAnimationFrame(gameLoop);
    }
  }
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
  currentLevelIndex = 0;
  playerRunes = 0;
  startGame();
});
restartWinBtn.addEventListener('click', () => {
  currentLevelIndex = 0;
  playerRunes = 0;
  startGame();
});
nextLevelBtn.addEventListener('click', () => {
  shopScreen.style.display = 'block';
  transitionScreen.style.display = 'none';
});
continueBtn.addEventListener('click', startGame);

buyLifeBtn.addEventListener('click', () => {
  if (playerRunes >= 50) {
    game.player.lives++;
    playerRunes -= 50;
  }
});

buyShieldBtn.addEventListener('click', () => {
  if (playerRunes >= 75) {
    game.player.shield = true;
    playerRunes -= 75;
  }
});

buySwordBtn.addEventListener('click', () => {
  if (playerRunes >= 100) {
    game.player.sword = true;
    playerRunes -= 100;
  }
});
