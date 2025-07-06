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

const environments = [
  { name: "Forest", color: "#0f0", enemyColor: "#0a0", bossColor: "#5f5" },
  { name: "Castle", color: "#6666ff", enemyColor: "#4444ff", bossColor: "#8888ff" },
  { name: "Dungeon", color: "#ff5555", enemyColor: "#ff2222", bossColor: "#ff8800" },
];

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

    // Helmet
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
  constructor(color) {
    this.x = WIDTH + 200;
    this.y = HEIGHT / 2 - 80;
    this.w = 160;
    this.h = 160;
    this.color = color;
    this.hp = 50;
    this.speed = 1.5;
    this.direction = 1;
    this.phase = 1;
  }

  update() {
    this.x -= this.speed;
    this.y += this.direction * 2;
    if (this.y <= 0 || this.y + this.h >= HEIGHT) this.direction *= -1;

    if (this.hp < 25 && this.phase === 1) {
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

class Item {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.w = 20;
    this.h = 20;
    this.type = type;
    this.color = type === "shield" ? "#00f" : "#ff0";
    this.speed = 2;
    this.active = true;
  }

  update() {
    this.x -= this.speed;
    if (this.x + this.w < 0) this.active = false;
  }

  draw() {
    if (!this.active) return;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.shadowBlur = 0;
  }
}

class Game {
  constructor() {
    this.envIndex = 0;
    this.bg = new Background(environments[this.envIndex].color);
    this.player = new Player();
    this.enemies = [];
    this.items = [];
    this.boss = null;
    this.keys = {};
    this.level = 1;
    this.bossAppeared = false;
    this.gameOver = false;
    this.spawnCooldown = 0;
    this.itemCooldown = 500;
  }

  spawnEnemy() {
    let y = Math.random() * (HEIGHT - 50);
    let speed = 3 + this.level * 0.5;
    let pattern = Math.floor(Math.random() * 3) + 1;
    this.enemies.push(new Enemy(WIDTH, y, speed, environments[this.envIndex].enemyColor, pattern));
  }

  spawnItem() {
    let y = Math.random() * (HEIGHT - 60);
    let type = Math.random() < 0.5 ? "shield" : "sword";
    this.items.push(new Item(WIDTH + 100, y, type));
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

    if (!this.bossAppeared && this.player.score >= 3000 * (this.envIndex + 1)) {
      this.boss = new Boss(environments[this.envIndex].bossColor);
      this.bossAppeared = true;
    }

    if (!this.bossAppeared && this.spawnCooldown <= 0) {
      this.spawnEnemy();
      this.spawnCooldown = 80 - this.level * 3;
    } else {
      this.spawnCooldown--;
    }

    if (this.itemCooldown <= 0) {
      this.spawnItem();
      this.itemCooldown = 700;
    } else {
      this.itemCooldown--;
    }

    for (let enemy of this.enemies) {
      enemy.update();
      if (this.checkCollision(this.player, enemy)) {
        if (this.player.sword) {
          enemy.x = -100; // elimina
          this.player.score += 100;
        } else {
          this.player.hit();
          if (this.player.lives <= 0) {
            this.gameOver = true;
            showGameOver();
          }
        }
      }
    }

    for (let item of this.items) {
      item.update();
      if (item.active && this.checkCollision(this.player, item)) {
        if (item.type === "shield") {
          this.player.invulnerable = true;
          this.player.shield = true;
          this.player.invulnerableTimer = 150;
        } else if (item.type === "sword") {
          this.player.invulnerable = true;
          this.player.sword = true;
          this.player.invulnerableTimer = 150;
        }
        item.active = false;
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
        this.envIndex++;
        if (this.envIndex >= environments.length) {
          this.gameOver = true;
          showWin();
        } else {
          this.level++;
          this.boss = null;
          this.bossAppeared = false;
          this.bg = new Background(environments[this.envIndex].color);
          this.enemies = [];
          this.items = [];
          this.player.x = 60;
          this.player.y = HEIGHT / 2 - this.player.h / 2;
        }
      }
    }

    this.enemies = this.enemies.filter(e => e.x + e.w > 0);
    this.items = this.items.filter(i => i.active);

    this.player.score += 1;
    if (this.player.score % 1000 === 0) this.level++;
  }

  drawHUD() {
    ctx.fillStyle = "#fff";
    ctx.font = "14px monospace";
    ctx.fillText(`Lives: ${this.player.lives}`, 10, 25);
    ctx.fillText(`Score: ${this.player.score}`, 10, 45);
    ctx.fillText(`Level: ${this.level}`, 10, 65);
    ctx.fillText(`Zone: ${environments[this.envIndex].name}`, 10, 85);

    if (this.boss) {
      ctx.fillStyle = "#ffaa00";
      ctx.fillText(`Boss HP: ${Math.max(0, Math.floor(this.boss.hp))}`, WIDTH - 150, 25);
    }
  }

  draw() {
    this.bg.draw();
    this.player.draw();
    for (let enemy of this.enemies) {
      enemy.draw();
    }
    for (let item of this.items) {
      item.draw();
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
