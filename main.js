const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

/* =========================
   BASE RESOLUTION
========================= */
const BASE_W = 320;
const BASE_H = 180;

/* =========================
   RESIZE (PIXEL PERFECT)
========================= */
function resize() {
  const scale = Math.floor(Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H)) || 1;
  canvas.width = BASE_W;
  canvas.height = BASE_H;
  canvas.style.width = BASE_W * scale + "px";
  canvas.style.height = BASE_H * scale + "px";
}
window.addEventListener("resize", resize);
resize();

/* =========================
   INPUT
========================= */
const keys = {};
let paused = false;

addEventListener("keydown", e => {
  keys[e.code] = true;
  if (e.code === "Escape") paused = !paused;
});

addEventListener("keyup", e => {
  keys[e.code] = false;
});

/* =========================
   UI ELEMENTS
========================= */
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const comboEl = document.getElementById("combo");
const hpEl = document.getElementById("hp");

/* =========================
   HELPERS
========================= */
function formatScore(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n);
}

/* =========================
   GAME STATE
========================= */
let score = 0;
let combo = 1;
let comboTimer = 0;
let comboStreak = 0;
let timeAlive = 0;
let gameOver = false;

/* =========================
   CAMERA
========================= */
const camera = { shake: 0 };
function addShake(v) { camera.shake = Math.min(camera.shake + v, 3); }

/* =========================
   PLAYER
========================= */
const player = {
  x: BASE_W / 2,
  y: BASE_H / 2,
  r: 6,
  speed: 80,
  dashCd: 0,
  hp: 100,
  invuln: 0
};

/* =========================
   ENEMIES
========================= */
const enemies = [];
function spawnEnemy() {
  enemies.push({
    x: Math.random() * BASE_W,
    y: Math.random() * BASE_H,
    r: 6,
    speed: 35 + Math.random() * 25
  });
}

/* =========================
   PARTICLES
========================= */
const particles = [];
function burst(x, y, n = 12) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 90,
      vy: (Math.random() - 0.5) * 90,
      life: 0.6
    });
  }
}

/* =========================
   GAME LOOP
========================= */
let last = 0;
let spawnTimer = 0;

function update(dt) {
  if (paused || gameOver) return;

  timeAlive += dt;

  // PLAYER MOVE
  let dx = 0, dy = 0;
  if (keys["ArrowLeft"]) dx--;
  if (keys["ArrowRight"]) dx++;
  if (keys["ArrowUp"]) dy--;
  if (keys["ArrowDown"]) dy++;

  let speed = player.speed;
  if (keys["Space"] && player.dashCd <= 0) {
    speed = 200;
    player.dashCd = 0.6;
    addShake(2);
  }

  const len = Math.hypot(dx, dy) || 1;
  player.x += (dx / len) * speed * dt;
  player.y += (dy / len) * speed * dt;
  player.dashCd -= dt;
  player.invuln -= dt;
  player.x = Math.max(0, Math.min(BASE_W, player.x));
  player.y = Math.max(0, Math.min(BASE_H, player.y));

  // ENEMIES
  for (let e of enemies) {
    const ex = player.x - e.x;
    const ey = player.y - e.y;
    const d = Math.hypot(ex, ey) || 1;
    e.x += (ex / d) * e.speed * dt;
    e.y += (ey / d) * e.speed * dt;

    if (d < e.r + player.r && player.invuln <= 0) {
      player.hp -= 15;
      player.invuln = 0.6;
      combo = 1;
      comboTimer = 0;
      comboStreak = 0;
      addShake(3);
      burst(player.x, player.y);
    }
  }

  // COMBO SYSTEM
  comboStreak += dt;
  if (comboStreak >= 1) {
    combo++;
    comboTimer = 1.5;
    comboStreak = 0;
  }
  comboTimer -= dt;
  if (comboTimer <= 0) combo = 1;

  // SCORE
  score += dt * 120 * combo;

  // SPAWNING
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = Math.max(0.6, 2 - enemies.length * 0.1);
  }

  // PARTICLES
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // CAMERA
  camera.shake *= 0.7;
  if (camera.shake < 0.05) camera.shake = 0;

  // UI
  scoreEl.textContent = "Score: " + formatScore(score);
  timeEl.textContent = "Time: " + timeAlive.toFixed(1) + "s";
  comboEl.textContent = "Combo: x" + combo;
  hpEl.textContent = "HP: " + player.hp;

  if (player.hp <= 0) endGame();
}

/* =========================
   GAME OVER
========================= */
function endGame() {
  gameOver = true;
  const overlay = document.getElementById("gameOver");
  overlay.classList.remove("hidden");

  const best = Math.max(Number(localStorage.bestScore || 0), Math.floor(score));
  localStorage.bestScore = best;

  document.getElementById("finalScore").textContent = "Score: " + formatScore(score);
  document.getElementById("bestScore").textContent = "Best: " + formatScore(best);
}

/* RESTART */
document.getElementById("restartBtn").onclick = () => location.reload();

/* =========================
   RENDER
========================= */
function render() {
  const sx = (Math.random() * 2 - 1) * camera.shake;
  const sy = (Math.random() * 2 - 1) * camera.shake;

  ctx.setTransform(1,0,0,1,sx,sy);
  ctx.clearRect(-20,-20,BASE_W+40,BASE_H+40);

  // PLAYER
  ctx.fillStyle = "#00ff99";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
  ctx.fill();

  // ENEMIES
  ctx.fillStyle = "#ff3355";
  for (let e of enemies) {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
    ctx.fill();
  }

  // PARTICLES
  ctx.fillStyle = "#ffffff";
  for (let p of particles) ctx.fillRect(p.x,p.y,1,1);

  // PAUSE OVERLAY
  if (paused) {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0,0,BASE_W,BASE_H);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "16px monospace";
    ctx.fillText("PAUSED", BASE_W/2, BASE_H/2);
  }

  ctx.setTransform(1,0,0,1,0,0);
}

/* =========================
   LOOP
========================= */
function loop(t) {
  const dt = (t - last)/1000;
  last = t;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

/* =========================
   AUTH BADGE (bottom-right with GitHub link)
========================= */
(function createAuthBadge() {
  const badge = document.createElement("div");
  badge.className = "auth-badge";

  // Create text node for "VOID RUNNER © "
  const text = document.createTextNode("VOID RUNNER © ");

  // Create link for username
  const link = document.createElement("a");
  link.href = "https://github.com/Moonnooo"; // GitHub URL
  link.target = "_blank";
  link.textContent = "Moonnooo";             // username displayed
  link.style.color = "#000";                 // match badge text
  link.style.textDecoration = "underline";   // optional
  link.style.fontWeight = "bold";

  // Create text node for version
  const versionText = document.createTextNode(" v1.1");

  // Append nodes
  badge.appendChild(text);
  badge.appendChild(link);
  badge.appendChild(versionText);

  document.body.appendChild(badge);
})();
