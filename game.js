const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const startBtn = document.getElementById('startBtn');
const menu = document.getElementById('menu');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartBtn = document.getElementById('restartBtn');
const finalScore = document.getElementById('finalScore');

class Player {
  constructor() {
    this.w = 30;
    this.h = 30;
    this.x = 50;
    this.y = HEIGHT / 2 - this.h / 2;
    this.color = '#00ffcc';
    this.lives = 3;
    this.speed = 4;
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
    ctx.fillRect(this.x, this.y, this.w, this.h);

    // "carita" pixel art style
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x + 8, this.y + 8, 4, 4);
    ctx.fillRect(this.x + 18, this.y + 8, 4, 4);
    ctx.fillRect(this.x + 10, this.y + 20, 10, 3);
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
  constructor(x, y, speed, type = 1) {
    this.x = x;
    this.y = y;
    this.w = 25;
    this.h = 25;
    this.color = '#ff0055';
    this.speed = speed;
    this.direction = type === 1 ? 1 : -1;
    this.type = type;
  }

  update() {
    if (this.type === 1) {
      this.x += this.speed * this.direction;
      if (this.x <= 0 || this.x + this.w >= WIDTH) this.direction *= -1;
    } else if (this.type === 2) {
      this.y += this.speed * this.direction;
      if (this.y <= 0 || this.y + this.h >= HEIGHT) this.direction *= -1;
    } else if (this.type === 3) {
      this.x += this.speed * this.direction;
      this.y += Math.sin(this.x / 20) * 2;
      if (this.x <= 0 || this.x + this.w >= WIDTH) this.direction *= -1;
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class PowerUp {
  constructor(type) {
    this.w = 20;
    this.h = 20;
    this.x = 100 + Math.random() * (WIDTH - 200);
    this.y = 50 + Math.random() * (HEIGHT - 100);
    this.type = type;
    this.color = type === 'life' ? '#00ff00' : '#ffcc00';
    this.active = true;
  }

  draw() {
    if (!this.active) return;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class Game {
  constructor() {
    this.player = new Player();
    this.enemies = [];
    this.powerUps = [];
    this.keys = {};
    this.level = 1;
    this.gameOver = false;
  }

  spawnEnemies() {
    this.enemies = [];
    for (let i = 0; i < this.level + 2; i++) {
      let type = Math.floor(Math.random() * 3) + 1;
      let x = 150 + i * 80;
      let y = 50 + Math.random() * (HEIGHT - 100);
      let speed = 1 + this.level * 0.5;
      this.enemies.push(new Enemy(x, y, speed, type));
    }
  }

  spawnPowerUp() {
    const types = ['life', 'invulnerable'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerUps.push(new PowerUp(type));
  }

  checkCollision(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
  }

  update() {
    if (this.gameOver) return;

    this.player.update(this.keys);

    for (let enemy of this.enemies) {
      enemy.update();
      if (this.checkCollision(this.player, enemy)) {
        this.player.hit();
        if (this.player.lives <= 0) {
          this.gameOver = true;
          gameOverScreen.style.display = 'block';
          canvas.style.display = 'none';
          finalScore.textContent = `Score: ${this.player.score}`;
        }
      }
    }

    for (let powerUp of this.powerUps) {
      if (powerUp.active && this.checkCollision(this.player, powerUp)) {
        if (powerUp.type === 'life') {
          this.player.lives++;
        } else if (powerUp.type === 'invulnerable') {
          this.player.invulnerable = true;
          this.player.invulnerableTimer = 120;
        }
        powerUp.active = false;
        this.player.score += 50;
      }
    }

    if (this.player.x + this.player.w >= WIDTH - 20) {
      this.level++;
      this.player.x = 50;
      this.player.y = HEIGHT / 2 - this.player.h / 2;
      this.spawnEnemies();
      this.spawnPowerUp();
      this.player.score += 100;
    }
  }

  drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Level: ${this.level}`, 10, 20);
    ctx.fillText(`Lives: ${this.player.lives}`, 10, 40);
    ctx.fillText(`Score: ${this.player.score}`, 10, 60);
  }

  draw() {
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (let powerUp of this.powerUps) {
      powerUp.draw();
    }
    this.player.draw();
    for (let enemy of this.enemies) {
      enemy.draw();
    }
    this.drawHUD();
  }
}

let game;

function startGame() {
  game = new Game();
  game.spawnEnemies();
  game.spawnPowerUp();
  menu.style.display = 'none';
  gameOverScreen.style.display = 'none';
  canvas.style.display = 'block';

  document.addEventListener('keydown', e => game.keys[e.key] = true);
  document.addEventListener('keyup', e => game.keys[e.key] = false);

  requestAnimationFrame(gameLoop);
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
