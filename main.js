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
  canvas.style.left = `${(window.innerWidth - BASE_W * scale) / 2}px`;
  canvas.style.top = `${(window.innerHeight - BASE_H * scale) / 2}px`;
}
window.addEventListener("resize", resize);
resize();

/* =========================
   HOTBAR
========================= */
const HOTBAR_SIZE = 4;
const hotbar = new Array(HOTBAR_SIZE).fill(null);

/* =========================
   PERK UI
========================= */
const perkLabels = { health: "HP", shield: "SH", stun: "ST", speed: "SP" };
const perkColors = { health: "#00ffff", shield: "#ffff00", stun: "#ff00ff", speed: "#ff9900" };

/* =========================
   INPUT
========================= */
let controlMode = "keyboard";
const mouse = { x: BASE_W/2, y: BASE_H/2 };
const keys = {};
let paused = false;

canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = BASE_W / rect.width;
  const scaleY = BASE_H / rect.height;
  mouse.x = (e.clientX - rect.left) * scaleX;
  mouse.y = (e.clientY - rect.top) * scaleY;
});

addEventListener("keydown", e => {
  keys[e.code] = true;

  if (e.code === "Escape") paused = !paused;
  if (e.code === "KeyC") controlMode = controlMode === "keyboard" ? "mouse" : "keyboard";

  const num = parseInt(e.key);
  if (num >= 1 && num <= HOTBAR_SIZE) {
    const index = num - 1;
    const perk = hotbar[index];
    if (perk && applyPerk(player, perk)) hotbar[index] = null;
  }
});
addEventListener("keyup", e => keys[e.code] = false);

/* =========================
   UI
========================= */
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const comboEl = document.getElementById("combo");
const hpEl = document.getElementById("hp");

/* =========================
   HELPERS
========================= */
function formatScore(n) {
  if (n >= 1e6) return (n/1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n/1e3).toFixed(1) + "K";
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
  x: BASE_W/2,
  y: BASE_H/2,
  r: 6,
  speed: 80,
  dashCd: 0,
  hp: 100,
  invuln: 0,
  activePerks: { health:false, shield:false, stun:false, speed:false },
  colliding: false
};

/* =========================
   ENEMIES
========================= */
const enemies = [];

function spawnEnemy() {
  // Don't spawn if any enemy is stunned
  if (enemies.some(e => e.stunned > 0)) return;

  const margin = 20;        // how far from edges enemies spawn
  const spawnSafeDist = 60; // minimum distance from player
  let x, y, attempts = 0;

  do {
    const edge = Math.floor(Math.random() * 4); // pick edge 0-3
    switch(edge){
      case 0: x = Math.random() * BASE_W; y = -margin; break; // top
      case 1: x = BASE_W + margin; y = Math.random() * BASE_H; break; // right
      case 2: x = Math.random() * BASE_W; y = BASE_H + margin; break; // bottom
      case 3: x = -margin; y = Math.random() * BASE_H; break; // left
    }
    attempts++;
    // repeat until enemy is far enough from player, or max attempts reached
  } while(Math.hypot(player.x - x, player.y - y) < spawnSafeDist && attempts < 10);

  enemies.push({
    x, y,
    r: 6,
    speed: 35 + Math.random()*25,
    stunned: 0
  });
}

/* =========================
   PARTICLES
========================= */
const particles = [];
function burst(x, y, n = 12) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x, 
      y,
      vx: (Math.random() - 0.5) * 90,
      vy: (Math.random() - 0.5) * 90,
      life: 0.6
    });
  }
}

/* -------------------------
   PARTICLES UPDATE
------------------------- */
for (let i = particles.length - 1; i >= 0; i--) {
  const p = particles[i];
  p.life -= dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  if (p.life <= 0) particles.splice(i, 1);
}

/* -------------------------
   PARTICLES RENDER
------------------------- */
ctx.fillStyle = "#ffffff";
for (let p of particles) ctx.fillRect(p.x, p.y, 1, 1);

/* =========================
   PERKS
========================= */
const perks = ["health","shield","stun","speed"];
const perkSpawns = [];
let perkSpawnTimer = 10;
const gameMode = localStorage.getItem("gameMode") || "single";

function spawnPerk() {
  const type = perks[Math.floor(Math.random()*perks.length)];
  perkSpawns.push({ x: Math.random()*(BASE_W-20)+10, y: Math.random()*(BASE_H-30)+20, r:5, type, blocked:false });
}

function applyPerk(target,type) {
  if(target.activePerks[type]) return false;
  switch(type){
    case "health": target.hp=Math.min(100,target.hp+25); break;
    case "shield": target.invuln=3; break;
    case "stun": enemies.forEach(e=>e.stunned=1.5); break;
    case "speed": target.speed*=1.5; setTimeout(()=>target.speed/=1.5,3000); break;
  }
  target.activePerks[type]=true;
  if(type!=="health") setTimeout(()=>target.activePerks[type]=false,3000);
  return true;
}

function updatePerks(dt){
  if(gameMode==="single"){
    perkSpawnTimer-=dt;
    if(perkSpawnTimer<=0){ spawnPerk(); perkSpawnTimer=10+Math.random()*10; }
  }

  for(let i=perkSpawns.length-1;i>=0;i--){
    const p=perkSpawns[i];
    const d=Math.hypot(player.x-p.x,player.y-p.y);
    if(d<=player.r+p.r){
      if(hotbar.includes(p.type)){ p.blocked=true; continue; }
      const slot = hotbar.findIndex(s=>s===null);
      if(slot!==-1){ hotbar[slot]=p.type; perkSpawns.splice(i,1); }
      else p.blocked=true;
    } else p.blocked=false;
  }
}

function renderPerks(){
  for(let p of perkSpawns){
    ctx.globalAlpha = p.blocked?0.3:1;
    ctx.fillStyle = perkColors[p.type];
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1; ctx.fillStyle="#fff"; ctx.font="8px monospace"; ctx.textAlign="center";
    ctx.fillText(perkLabels[p.type], p.x, p.y-10);
  }
}

/* =========================
   UPDATE
========================= */
let last=0, spawnTimer=0;
function update(dt){
  if(paused||gameOver) return;

  timeAlive+=dt;
  updatePerks(dt);

  let dx=0, dy=0;
  if(controlMode==="keyboard"){
    if(keys["ArrowLeft"]) dx--; if(keys["ArrowRight"]) dx++;
    if(keys["ArrowUp"]) dy--; if(keys["ArrowDown"]) dy++;
  } else { dx=mouse.x-player.x; dy=mouse.y-player.y; }

  let speed=player.speed;
  if(keys["Space"]&&player.dashCd<=0){ speed=200; player.dashCd=0.6; addShake(2); }

  const len=Math.hypot(dx,dy)||1;
  player.x+=(dx/len)*speed*dt;
  player.y+=(dy/len)*speed*dt;

  player.dashCd-=dt; player.invuln-=dt;

  player.x=Math.max(0,Math.min(BASE_W,player.x));
  player.y=Math.max(0,Math.min(BASE_H,player.y));

enemies.forEach(e =>{
  if(e.stunned > 0){
    e.stunned -= dt;
    return; // don't move if stunned
  }

  // Move towards player
  const d = Math.hypot(player.x - e.x, player.y - e.y) || 1;
  e.x += ((player.x - e.x)/d) * e.speed * dt;
  e.y += ((player.y - e.y)/d) * e.speed * dt;

  // collision with player
  if(d < e.r + player.r){
    if(!player.colliding && player.invuln <= 0){
      player.hp -= 15;
      player.invuln = 0.6;
      combo = 1;
      burst(player.x, player.y, 8);
      addShake(1.2);
    }
    player.colliding = true;
  } else player.colliding = false;
});


  comboStreak+=dt;
  if(comboStreak>=1){ combo++; comboTimer=1.5; comboStreak=0; }
  comboTimer-=dt;
  if(comboTimer<=0) combo=1;

  score+=dt*120*combo;

  spawnTimer-=dt;
  if(spawnTimer<=0){ spawnEnemy(); spawnTimer=Math.max(0.6,2-enemies.length*0.1); }

  scoreEl.textContent="Score: "+formatScore(score);
  timeEl.textContent="Time: "+timeAlive.toFixed(1)+"s";
  comboEl.textContent="Combo: x"+combo;
  hpEl.textContent="HP: "+player.hp;

  // PARTICLES UPDATE
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i]; p.life-=dt;
    if(p.target){ p.x=p.target.x+p.ox; p.y=p.target.y+p.oy; } 
    else { p.x+=p.vx*dt; p.y+=p.vy*dt; }
    if(p.life<=0) particles.splice(i,1);
  }

  if(player.hp<=0) endGame();
}

/* =========================
   GAME OVER
========================= */
function endGame(){
  gameOver=true;
  const overlay=document.getElementById("gameOver"); overlay.classList.remove("hidden");
  const best=Math.max(Number(localStorage.bestScore||0),Math.floor(score));
  localStorage.bestScore=best;
  document.getElementById("finalScore").textContent="Score: "+formatScore(score);
  document.getElementById("bestScore").textContent="Best: "+formatScore(best);
}
document.getElementById("restartBtn").onclick=()=>location.reload();

/* =========================
   RENDER
========================= */
function render() {
  ctx.setTransform(1,0,0,1,0,0); // remove shake
  ctx.clearRect(0, 0, BASE_W, BASE_H);

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

  // PERKS
  renderPerks();

  // PARTICLES
  ctx.fillStyle = "#ffffff";
  for (let p of particles) ctx.fillRect(p.x, p.y, 1, 1);

  // PAUSE OVERLAY
  if (paused) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0,0,BASE_W,BASE_H);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "16px monospace";
    ctx.fillText("PAUSED", BASE_W/2, BASE_H/2);
  }

  ctx.setTransform(1,0,0,1,0,0);

  // HOTBAR
  const size=16, gap=6, totalW=HOTBAR_SIZE*size+(HOTBAR_SIZE-1)*gap;
  const startX=(BASE_W-totalW)/2, y=BASE_H-24;
  ctx.font="8px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle";

  for(let i=0;i<HOTBAR_SIZE;i++){
    const x=startX+i*(size+gap);
    ctx.strokeStyle="#fff"; ctx.strokeRect(x,y,size,size);

    // number above
    ctx.fillStyle="#aaa"; ctx.fillText(i+1, x+size/2, y-8);

    // perk icon
    if(hotbar[i]){ ctx.fillStyle=perkColors[hotbar[i]]; ctx.fillText(perkLabels[hotbar[i]], x+size/2, y+size/2); }
  }
}

/* =========================
   LOOP
========================= */
function loop(t){
  const dt=(t-last)/1000; last=t;
  update(dt); render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* =========================
   AUTH BADGE
========================= */
(function(){
  const badge=document.createElement("div");
  badge.className="auth-badge";
  const text=document.createTextNode("VOID RUNNER © ");
  const link=document.createElement("a");
  link.href="https://github.com/Moonnooo"; link.target="_blank"; link.textContent="Moonnooo";
  link.style.color="#000"; link.style.textDecoration="underline"; link.style.fontWeight="bold";
  const version=document.createTextNode(" v1.2");
  badge.appendChild(text); badge.appendChild(link); badge.appendChild(version);
  document.body.appendChild(badge);
})();
