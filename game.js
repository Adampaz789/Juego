const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const startBtn = document.getElementById('startBtn');
const menu = document.getElementById('menu');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartBtn = document.getElementById('restartBtn');
const finalScore = document.getElementById('finalScore');
const winScreen = document.getElementById('winScreen');
const winScore = document.getElementById('winScore');
const restartWinBtn = document.getElementById('restartWinBtn');

class Background {
  constructor() {
    this.lights = Array.from({ length: 100 }, () => ({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      size: Math.random() * 2,
      speed: 0.3 + Math.random()
    }));
  }

  update() {
    for (let light of this.lights) {
      light.x -= light.speed;
      if (light.x < 0) {
        light.x = WIDTH;
        light.y = Math.random() * HEIGHT;
      }
    }
  }

  draw() {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#55ff55";
    for (let light of this.lights) {
      ctx.fillRect(light.x, light.y, light.size, light.size);
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
    this.score = 0;
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
      if (this.invulnerableTimer <= 0) this.invulnerable = false;
    }
  }

  draw() {
    if (this.invulnerable && this.invulnerableTimer % 10 < 5) return;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.shadowBlur = 0;

    // "helmet" medieval style
    ctx.fillStyle = "#000";
    ctx.fillRect(this.x + 6, this.y + 6, 16, 4);
    ctx.fillRect(this.x + 10, this.y + 12, 8, 4);
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
  constructor(x, y, speed, pattern = 1) {
    this.x = x;
    this.y = y;
    this.w = 25;
    this.h = 25;
    this.color = "#ff5555";
    this.speed = speed;
    this.pattern = pattern;
    this.direction = 1;
  }

  update() {
    if (this.pattern === 1) {
      this.x -= this.speed;
    } else if (this.pattern === 2) {
      this.x -= this.speed;
      this.y += Math.sin(this.x / 15) * 3;
    } else if (this.pattern === 3) {
      this.x -= this.speed;
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
  constructor() {
    this.x = WIDTH + 200;
    this.y = HEIGHT / 2 - 80;
    this.w = 160;
    this.h = 160;
    this.color = "#ffaa00";
    this.hp = 50;
    this.speed = 1.5;
    this.direction = 1;
  }

  update() {
    this.x -= this.speed;
    this.y += this.direction * 2;
    if (this.y <= 0 || this.y + this.h >= HEIGHT) this.direction *= -1;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 25;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.shadowBlur = 0;

    // "eyes" medieval beast style
    ctx.fillStyle = "#000";
    ctx.fillRect(this.x + 40, this.y + 40, 20, 20);
    ctx.fillRect(this.x + 100, this.y + 40, 20, 20);

    // "fangs"
    ctx.fillRect(this.x + 60, this.y + 110, 40, 10);
  }
}

class Game {
  constructor() {
    this.bg = new Background();
    this.player = new Player();
    this.enemies = [];
    this.boss = null;
    this.keys = {};
    this.level = 1;
    this.bossAppeared = false;
    this.gameOver = false;
    this.bossKilled = false;
    this.spawnCooldown = 0;
  }

  spawnEnemy() {
    let y = Math.random() * (HEIGHT - 50);
    let speed = 3 + this.level * 0.5;
    let pattern = Math.floor(Math.random() * 3) + 1;
    this.enemies.push(new Enemy(WIDTH, y, speed, pattern));
  }

  checkCollision(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
  }

  update() {
    if (this.gameOver) return;

    this.bg.update();
    this.player.update(this.keys);

    if (!this.bossAppeared && this.player.score >= 3000) {
      this.boss = new Boss();
      this.bossAppeared = true;
    }

    if (!this.bossAppeared && this.spawnCooldown <= 0) {
      this.spawnEnemy();
      this.spawnCooldown = 90 - this.level * 3;
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

    if (this.boss) {
      this.boss.update();
      if (this.checkCollision(this.player, this.boss)) {
        this.player.hit();
        if (this.player.lives <= 0) {
          this.gameOver = true;
          showGameOver();
        }
      }

      if (this.boss.x < WIDTH - this.boss.w - 20) {
        this.boss.hp -= 0.1;
      }

      if (this.boss.hp <= 0) {
        this.bossKilled = true;
        this.gameOver = true;
        showWin();
      }
    }

    this.enemies = this.enemies.filter(e => e.x + e.w > 0);

    this.player.score += 1;
    if (this.player.score % 1000 === 0) this.level++;
  }

  drawHUD() {
    ctx.fillStyle = "#fff";
    ctx.font = "16px monospace";
    ctx.fillText(`Lives: ${this.player.lives}`, 10, 25);
    ctx.fillText(`Score: ${this.player.score}`, 10, 50);
    ctx.fillText(`Level: ${this.level}`, 10, 75);

    if (this.boss) {
      ctx.fillStyle = "#ffaa00";
      ctx.fillText(`Boss HP: ${Math.max(0, Math.floor(this.boss.hp))}`, WIDTH - 160, 25);
    }
  }

  draw() {
    this.bg.draw();
    this.player.draw();
    for (let enemy of this.enemies) {
      enemy.draw();
    }
    if (this.boss) this.boss.draw();
    this.drawHUD();
  }
}

let game;

function startGame() {
  game = new Game();
  menu.style.display = 'none';
  gameOverScreen.style.display = 'none';
  winScreen.style.display = 'none';
  canvas.style.display = 'block';

  document.addEventListener('keydown', e => game.keys[e.key] = true);
  document.addEventListener('keyup', e => game.keys[e.key] = false);

  requestAnimationFrame(gameLoop);
}

function showGameOver() {
  finalScore.textContent = `Score: ${game.player.score}`;
  gameOverScreen.style.display = 'block';
  canvas.style.display = 'none';
}

function showWin() {
  winScore.textContent = `Score: ${game.player.score}`;
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
restartBtn.addEventListener('click', startGame);
restartWinBtn.addEventListener('click', startGame);
