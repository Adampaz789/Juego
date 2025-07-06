const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

class Player {
  constructor() {
    this.w = 20;
    this.h = 20;
    this.x = 50;
    this.y = HEIGHT / 2 - this.h / 2;
    this.color = '#00f';
    this.lives = 3;
    this.speed = 3;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
  }

  update(keys) {
    if (keys['ArrowRight']) this.x += this.speed;
    if (keys['ArrowLeft']) this.x -= this.speed;
    if (keys['ArrowUp']) this.y -= this.speed;
    if (keys['ArrowDown']) this.y += this.speed;

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
    ctx.fillStyle = 'white';
    ctx.fillRect(this.x + 5, this.y + 5, 3, 3);
    ctx.fillRect(this.x + 12, this.y + 5, 3, 3);
    ctx.fillRect(this.x + 7, this.y + 14, 6, 2);
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
    this.w = 20;
    this.h = 20;
    this.color = 'red';
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
    ctx.fillStyle = 'black';
    ctx.fillRect(this.x + 5, this.y + 5, 3, 3);
  }
}

class PowerUp {
  constructor() {
    this.w = 15;
    this.h = 15;
    this.x = 100 + Math.random() * (WIDTH - 200);
    this.y = 50 + Math.random() * (HEIGHT - 100);
    this.color = 'green';
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
    this.powerUp = null;
    this.keys = {};
    this.level = 1;
    this.gameOver = false;

    document.addEventListener('keydown', e => this.keys[e.key] = true);
    document.addEventListener('keyup', e => this.keys[e.key] = false);

    this.spawnEnemies();
    this.spawnPowerUp();
  }

  spawnEnemies() {
    this.enemies = [];
    for (let i = 0; i < this.level + 1; i++) {
      let type = Math.floor(Math.random() * 3) + 1;
      let x = 150 + i * 80;
      let y = 50 + Math.random() * (HEIGHT - 100);
      let speed = 1 + this.level * 0.5;
      this.enemies.push(new Enemy(x, y, speed, type));
    }
  }

  spawnPowerUp() {
    this.powerUp = new PowerUp();
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
        }
      }
    }

    if (this.powerUp && this.powerUp.active && this.checkCollision(this.player, this.powerUp)) {
      this.player.lives++;
      this.powerUp.active = false;
    }

    if (this.player.x + this.player.w >= WIDTH - 20) {
      this.level++;
      this.player.x = 50;
      this.player.y = HEIGHT / 2 - this.player.h / 2;
      this.spawnEnemies();
      this.spawnPowerUp();
    }
  }

  drawHUD() {
    ctx.fillStyle = 'black';
    ctx.font = '16px monospace';
    ctx.fillText(`Nivel: ${this.level}`, 10, 20);
    ctx.fillText(`Vidas: ${this.player.lives}`, 10, 40);

    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = 'white';
      ctx.font = '30px monospace';
      ctx.fillText('GAME OVER', WIDTH / 2 - 100, HEIGHT / 2);
      ctx.font = '20px monospace';
      ctx.fillText('Recarga para reiniciar', WIDTH / 2 - 120, HEIGHT / 2 + 40);
    }
  }

  draw() {
    ctx.fillStyle = '#e0f7fa';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (this.powerUp) this.powerUp.draw();
    this.player.draw();
    for (let enemy of this.enemies) {
      enemy.draw();
    }
    this.drawHUD();
  }
}

const game = new Game();

function gameLoop() {
  game.update();
  game.draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
