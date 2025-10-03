// Minimal, clean Asteroids implementation for interview demos.
// Controls: Left/Right rotate, Up thrust, Space fire

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");

const TAU = Math.PI * 2;
const rnd = (min, max) => Math.random() * (max - min) + min;

const state = {
  score: 0,
  lives: 3,
  level: 1,
  ship: null,
  bullets: [],
  asteroids: [],
  keys: { left: false, right: false, up: false, shoot: false },
  cooldown: 0,
  gameOver: false,
};

function wrap(p) {
  if (p.x < 0) p.x += canvas.width;
  if (p.x > canvas.width) p.x -= canvas.width;
  if (p.y < 0) p.y += canvas.height;
  if (p.y > canvas.height) p.y -= canvas.height;
}

class Ship {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.r = 12;
    this.a = -Math.PI / 2; // facing up
    this.thrust = { x: 0, y: 0 };
    this.rot = 0;
    this.canShoot = true;
    this.flicker = 0; // brief invulnerability after hit
  }
  update() {
    this.a += this.rot;
    // thrust
    if (state.keys.up) {
      this.thrust.x += 0.08 * Math.cos(this.a);
      this.thrust.y += 0.08 * Math.sin(this.a);
    } else {
      // friction
      this.thrust.x *= 0.99;
      this.thrust.y *= 0.99;
    }
    this.x += this.thrust.x;
    this.y += this.thrust.y;
    wrap(this);
    if (this.flicker > 0) this.flicker--;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.a);
    ctx.strokeStyle = this.flicker % 6 < 3 ? "#fff" : "#444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-6, 6);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.stroke();

    if (state.keys.up) {
      ctx.beginPath();
      ctx.moveTo(-12, -6);
      ctx.lineTo(-18 - rnd(0, 4), 0);
      ctx.lineTo(-12, 6);
      ctx.strokeStyle = "#f80";
      ctx.stroke();
    }
    ctx.restore();
  }
}

class Bullet {
  constructor(x, y, a) {
    this.x = x + Math.cos(a) * 14;
    this.y = y + Math.sin(a) * 14;
    this.dx = Math.cos(a) * 6;
    this.dy = Math.sin(a) * 6;
    this.life = 60;
    this.r = 2;
  }
  update() {
    this.x += this.dx; this.y += this.dy; this.life--;
    wrap(this);
  }
  draw() {
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, TAU); ctx.fill();
  }
}

class Asteroid {
  constructor(x, y, r) {
    this.x = x; this.y = y; this.r = r;
    const sp = rnd(0.5, 2.2);
    const ang = rnd(0, TAU);
    this.dx = Math.cos(ang) * sp;
    this.dy = Math.sin(ang) * sp;
    this.verts = [];
    const jag = 0.4;
    const n = Math.floor(r / 2) + 6;
    for (let i = 0; i < n; i++) {
      this.verts.push(r * (1 + rnd(-jag, jag)));
    }
    this.a = 0;
    this.da = rnd(-0.02, 0.02);
  }
  update() {
    this.x += this.dx; this.y += this.dy; this.a += this.da; wrap(this);
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.a);
    ctx.strokeStyle = "#9cf";
    ctx.beginPath();
    const n = this.verts.length;
    for (let i = 0; i < n; i++) {
      const ang = i / n * TAU;
      const rad = this.verts[i];
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

function dist(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function spawnAsteroids(level) {
  state.asteroids = [];
  const count = Math.min(4 + level, 10);
  for (let i = 0; i < count; i++) {
    const edge = Math.random() < 0.5 ? 0 : canvas.width;
    const x = Math.random() < 0.5 ? rnd(0, canvas.width) : edge;
    const y = Math.random() < 0.5 ? edge : rnd(0, canvas.height);
    const r = rnd(30, 60);
    const a = new Asteroid(x, y, r);
    // avoid spawning too close to ship
    if (dist(a, state.ship) < 120) { i--; continue; }
    state.asteroids.push(a);
  }
}

function resetShip() {
  state.ship = new Ship();
}

function nextLevel() {
  state.level++;
  levelEl.textContent = state.level;
  spawnAsteroids(state.level);
}

function splitAsteroid(a, index) {
  if (a.r > 20) {
    state.asteroids.push(new Asteroid(a.x, a.y, a.r * 0.6));
    state.asteroids.push(new Asteroid(a.x, a.y, a.r * 0.6));
  }
  state.asteroids.splice(index, 1);
}

function newGame() {
  state.score = 0; scoreEl.textContent = 0;
  state.lives = 3; livesEl.textContent = 3;
  state.level = 1; levelEl.textContent = 1;
  state.bullets = []; state.gameOver = false;
  resetShip();
  spawnAsteroids(state.level);
}

function update() {
  if (state.gameOver) return;

  // input
  state.ship.rot = 0;
  if (state.keys.left) state.ship.rot = -0.07;
  if (state.keys.right) state.ship.rot = 0.07;
  if (state.keys.shoot && state.cooldown <= 0) {
    state.bullets.push(new Bullet(state.ship.x, state.ship.y, state.ship.a));
    state.cooldown = 10;
  }
  state.cooldown--;

  // update entities
  state.ship.update();
  state.bullets.forEach(b => b.update());
  state.bullets = state.bullets.filter(b => b.life > 0);
  state.asteroids.forEach(a => a.update());

  // collisions: bullets vs asteroids
  for (let i = state.asteroids.length - 1; i >= 0; i--) {
    const a = state.asteroids[i];
    for (let j = state.bullets.length - 1; j >= 0; j--) {
      const b = state.bullets[j];
      if (dist(a, b) < a.r) {
        state.bullets.splice(j, 1);
        splitAsteroid(a, i);
        state.score += 10;
        scoreEl.textContent = state.score;
        break;
      }
    }
  }

  // collisions: ship vs asteroids
  if (state.ship.flicker <= 0) {
    for (let i = 0; i < state.asteroids.length; i++) {
      if (dist(state.ship, state.asteroids[i]) < state.asteroids[i].r + state.ship.r) {
        state.lives--;
        livesEl.textContent = state.lives;
        state.ship.flicker = 90;
        state.ship.x = canvas.width/2; state.ship.y = canvas.height/2;
        state.ship.thrust = {x:0,y:0};
        if (state.lives <= 0) {
          state.gameOver = true;
        }
        break;
      }
    }
  }

  // Level cleared
  if (state.asteroids.length === 0) nextLevel();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // background stars
  ctx.fillStyle = "#000";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  state.ship.draw();
  state.bullets.forEach(b => b.draw());
  state.asteroids.forEach(a => a.draw());

  if (state.gameOver) {
    ctx.fillStyle = "#fff";
    ctx.font = "32px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width/2, canvas.height/2);
    ctx.font = "18px system-ui";
    ctx.fillText("Press Enter to restart", canvas.width/2, canvas.height/2 + 30);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft") state.keys.left = true;
  if (e.code === "ArrowRight") state.keys.right = true;
  if (e.code === "ArrowUp") state.keys.up = true;
  if (e.code === "Space") state.keys.shoot = true;
  if (e.code === "Enter" && state.gameOver) newGame();
});
window.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft") state.keys.left = false;
  if (e.code === "ArrowRight") state.keys.right = false;
  if (e.code === "ArrowUp") state.keys.up = false;
  if (e.code === "Space") state.keys.shoot = false;
});

newGame();
loop();