import { createAudioController } from "./audio.js";
import { createInitialState, createPlayer } from "./state.js";
import { randomWord } from "./words.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");
const comboEl = document.getElementById("combo");
const multiplierEl = document.getElementById("multiplier");
const targetWordEl = document.getElementById("targetWord");
const muteBtn = document.getElementById("muteBtn");
const startOverlayEl = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");
const pauseOverlayEl = document.getElementById("pauseOverlay");
const overlayEl = document.getElementById("overlay");
const finalScoreEl = document.getElementById("finalScore");
const finalBestScoreEl = document.getElementById("finalBestScore");
const restartBtn = document.getElementById("restartBtn");

const BEST_SCORE_KEY = "ztype_best_score";

const state = createInitialState();
const player = createPlayer(canvas);
const audio = createAudioController(muteBtn);

function loadBestScore() {
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_KEY);
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }
    return Math.floor(parsed);
  } catch (_error) {
    return 0;
  }
}

function saveBestScore(bestScore) {
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
  } catch (_error) {
  }
}

function syncBestScore() {
  if (state.score <= state.bestScore) {
    return;
  }
  state.bestScore = state.score;
  saveBestScore(state.bestScore);
}

function spawnEnemy(now) {
  const word = randomWord(state.level);
  const margin = 80;
  const x = margin + Math.random() * (canvas.width - margin * 2);
  const speedVariance = 10 + Math.min(18, state.level * 1.1);
  const speed = state.enemyBaseSpeed + Math.random() * speedVariance;

  state.enemies.push({
    id: state.enemyIdSeed++,
    word,
    progress: 0,
    x,
    y: -10,
    speed,
    radius: 20
  });

  state.lastSpawnTime = now;
}

function updateDifficulty(now) {
  const elapsedSec = (now - state.startedAt) / 1000;
  const newLevel = 1 + Math.floor(elapsedSec / 16);
  if (newLevel !== state.level) {
    state.level = newLevel;
    const spawnDrop = Math.min(920, (state.level - 1) * 78);
    state.spawnInterval = Math.max(state.minSpawnInterval, 1500 - spawnDrop);
    state.enemyBaseSpeed = 28 + Math.min(36, (state.level - 1) * 2.1);
  }
}

function chooseLockByFirstChar(ch) {
  const candidates = state.enemies.filter((enemy) => enemy.word[0] === ch);
  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((first, second) => second.y - first.y);
  return candidates[0];
}

function getLockedEnemy() {
  if (state.lockedEnemyId == null) {
    return null;
  }
  return state.enemies.find((enemy) => enemy.id === state.lockedEnemyId) || null;
}

function onLetterInput(ch) {
  if (state.status !== "running") {
    return;
  }

  const locked = getLockedEnemy();
  if (!locked) {
    const target = chooseLockByFirstChar(ch);
    if (!target) {
      return;
    }
    state.lockedEnemyId = target.id;
    audio.playShotSound();
    spawnBullet(target.id, target.x, target.y);
    target.progress = 1;
    if (target.progress >= target.word.length) {
      killEnemy(target.id);
    }
    return;
  }

  const expect = locked.word[locked.progress];
  if (expect !== ch) {
    return;
  }

  audio.playShotSound();
  spawnBullet(locked.id, locked.x, locked.y);
  locked.progress += 1;
  if (locked.progress >= locked.word.length) {
    killEnemy(locked.id);
  }
}

function startGame() {
  if (state.status !== "ready") {
    return;
  }
  state.status = "running";
  state.startedAt = performance.now();
  state.lastSpawnTime = state.startedAt;
  startOverlayEl.classList.add("hidden");
  pauseOverlayEl.classList.add("hidden");
}

function togglePause() {
  if (state.status === "running") {
    state.status = "paused";
    pauseOverlayEl.classList.remove("hidden");
    return;
  }
  if (state.status === "paused") {
    state.status = "running";
    pauseOverlayEl.classList.add("hidden");
    return;
  }
  if (state.status === "ready") {
    startGame();
  }
}

function spawnBullet(targetEnemyId, targetX, targetY) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const dist = Math.hypot(dx, dy) || 1;
  const speed = 700;

  state.bullets.push({
    x: player.x,
    y: player.y,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    speed,
    targetEnemyId,
    targetX,
    targetY,
    trailLife: 0.2
  });
}

function spawnExplosion(x, y, color) {
  for (let i = 0; i < 14; i += 1) {
    const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.35;
    const speed = 80 + Math.random() * 170;
    state.explosions.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35 + Math.random() * 0.2,
      maxLife: 0.55,
      size: 2 + Math.random() * 3,
      color
    });
  }
}

function findEnemyById(enemyId) {
  return state.enemies.find((enemy) => enemy.id === enemyId) || null;
}

function killEnemy(enemyId) {
  const index = state.enemies.findIndex((enemy) => enemy.id === enemyId);
  if (index === -1) {
    return;
  }

  const enemy = state.enemies[index];
  const basePoints = enemy.word.length * 10;
  const gained = Math.round(basePoints * state.multiplier);
  state.score += gained;
  state.combo += 1;
  state.multiplier = Math.min(4, 1 + Math.floor(state.combo / 3) * 0.25);
  state.comboTimer = state.comboTimeoutSec;
  audio.playKillSound();
  spawnExplosion(enemy.x, enemy.y, "125,211,252");
  state.enemies.splice(index, 1);
  if (state.lockedEnemyId === enemyId) {
    state.lockedEnemyId = null;
  }
}

function loseLife() {
  state.lives -= 1;
  audio.playDamageSound();
  state.combo = 0;
  state.multiplier = 1;
  state.comboTimer = 0;
  if (state.lives <= 0) {
    state.lives = 0;
    state.status = "gameover";
    syncBestScore();
    finalScoreEl.textContent = String(state.score);
    finalBestScoreEl.textContent = String(state.bestScore);
    overlayEl.classList.remove("hidden");
    audio.playGameOverSound();
    state.lockedEnemyId = null;
    state.bullets = [];
  }
}

function update(dt, now) {
  if (state.status !== "running") {
    return;
  }

  updateDifficulty(now);

  if (state.combo > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) {
      state.combo = 0;
      state.multiplier = 1;
      state.comboTimer = 0;
    }
  }

  if (now - state.lastSpawnTime >= state.spawnInterval) {
    spawnEnemy(now);
  }

  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    enemy.y += enemy.speed * dt;
    if (enemy.y >= canvas.height - 20) {
      if (state.lockedEnemyId === enemy.id) {
        state.lockedEnemyId = null;
      }
      state.enemies.splice(i, 1);
      spawnExplosion(enemy.x, canvas.height - 20, "251,113,133");
      loseLife();
      if (state.status !== "running") {
        return;
      }
    }
  }

  for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.bullets[i];
    const targetEnemy = findEnemyById(bullet.targetEnemyId);
    if (targetEnemy) {
      bullet.targetX = targetEnemy.x;
      bullet.targetY = targetEnemy.y;
    }

    if (targetEnemy) {
      const aimDx = bullet.targetX - bullet.x;
      const aimDy = bullet.targetY - bullet.y;
      const aimDist = Math.hypot(aimDx, aimDy) || 1;
      const desiredVx = (aimDx / aimDist) * bullet.speed;
      const desiredVy = (aimDy / aimDist) * bullet.speed;
      const steer = Math.min(1, dt * 14);
      bullet.vx += (desiredVx - bullet.vx) * steer;
      bullet.vy += (desiredVy - bullet.vy) * steer;
    }

    const prevX = bullet.x;
    const prevY = bullet.y;
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.trailLife = Math.max(0.08, bullet.trailLife - dt * 0.35);

    const segDx = bullet.x - prevX;
    const segDy = bullet.y - prevY;
    const segLenSq = segDx * segDx + segDy * segDy;

    let closestDistance = Math.hypot(bullet.targetX - bullet.x, bullet.targetY - bullet.y);
    if (segLenSq > 0.0001) {
      const toTargetX = bullet.targetX - prevX;
      const toTargetY = bullet.targetY - prevY;
      const projection = (toTargetX * segDx + toTargetY * segDy) / segLenSq;
      const t = Math.max(0, Math.min(1, projection));
      const closestX = prevX + segDx * t;
      const closestY = prevY + segDy * t;
      closestDistance = Math.hypot(bullet.targetX - closestX, bullet.targetY - closestY);
    }

    const hitRadius = targetEnemy ? targetEnemy.radius + 2 : 10;
    if (closestDistance <= hitRadius) {
      const fx = targetEnemy ? targetEnemy.x : bullet.targetX;
      const fy = targetEnemy ? targetEnemy.y : bullet.targetY;
      spawnExplosion(fx, fy, "134,239,172");
      state.bullets.splice(i, 1);
      continue;
    }

    if (
      bullet.x < -20 ||
      bullet.x > canvas.width + 20 ||
      bullet.y < -20 ||
      bullet.y > canvas.height + 20
    ) {
      state.bullets.splice(i, 1);
    }
  }

  for (let i = state.explosions.length - 1; i >= 0; i -= 1) {
    const particle = state.explosions[i];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.98;
    particle.vy *= 0.98;
    particle.life -= dt;

    if (particle.life <= 0) {
      state.explosions.splice(i, 1);
    }
  }
}

function drawStarfield(now) {
  const stars = 70;
  for (let i = 0; i < stars; i += 1) {
    const px = (i * 139) % canvas.width;
    const py = ((i * 257) + now * (0.015 + (i % 3) * 0.007)) % canvas.height;
    const alpha = 0.2 + (i % 4) * 0.15;
    ctx.fillStyle = `rgba(200,220,255,${alpha})`;
    ctx.fillRect(px, py, 2, 2);
  }
}

function drawEnemy(enemy, isLocked) {
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
  ctx.fillStyle = isLocked ? "#fb7185" : "#7dd3fc";
  ctx.fill();

  ctx.strokeStyle = isLocked ? "#fecdd3" : "#bae6fd";
  ctx.lineWidth = 2;
  ctx.stroke();

  const done = enemy.word.slice(0, enemy.progress);
  const todo = enemy.word.slice(enemy.progress);
  ctx.font = "18px Consolas, monospace";
  const allWidth = ctx.measureText(enemy.word).width;
  const doneWidth = ctx.measureText(done).width;
  const startX = enemy.x - allWidth / 2;

  ctx.textAlign = "left";
  ctx.fillStyle = "#86efac";
  ctx.fillText(done, startX, enemy.y + 34);
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(todo, startX + doneWidth, enemy.y + 34);
}

function drawBullets() {
  for (const bullet of state.bullets) {
    const alpha = Math.max(0.35, bullet.trailLife);
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(134,239,172,${alpha})`;
    ctx.fill();
  }
}

function drawExplosions() {
  for (const particle of state.explosions) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${particle.color},${alpha})`;
    ctx.fill();
  }
}

function drawPlayerShip() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(11, 12);
  ctx.lineTo(0, 8);
  ctx.lineTo(-11, 12);
  ctx.closePath();
  ctx.fillStyle = "#86efac";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(4, 18);
  ctx.lineTo(-4, 18);
  ctx.closePath();
  ctx.fillStyle = "rgba(125,211,252,0.8)";
  ctx.fill();
  ctx.restore();
}

function render(now) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#071226");
  gradient.addColorStop(1, "#02060d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStarfield(now);
  const lockedEnemy = getLockedEnemy();
  for (const enemy of state.enemies) {
    drawEnemy(enemy, lockedEnemy && enemy.id === lockedEnemy.id);
  }
  drawBullets();
  drawExplosions();
  drawPlayerShip();

  ctx.strokeStyle = "rgba(251,113,133,0.35)";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 20);
  ctx.lineTo(canvas.width, canvas.height - 20);
  ctx.stroke();
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  bestScoreEl.textContent = String(state.bestScore);
  livesEl.textContent = String(state.lives);
  levelEl.textContent = String(state.level);
  comboEl.textContent = String(state.combo);
  multiplierEl.textContent = `x${state.multiplier.toFixed(2).replace(/\.00$/, ".0")}`;
  const locked = getLockedEnemy();
  targetWordEl.textContent = locked ? locked.word : "无";
}

let previous = performance.now();
function gameLoop(now) {
  const dt = Math.min((now - previous) / 1000, 0.05);
  previous = now;
  update(dt, now);
  render(now);
  updateHud();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  Object.assign(state, createInitialState());
  state.status = "running";
  state.bestScore = loadBestScore();
  state.startedAt = performance.now();
  state.lastSpawnTime = state.startedAt;

  overlayEl.classList.add("hidden");
  startOverlayEl.classList.add("hidden");
  pauseOverlayEl.classList.add("hidden");
}

window.addEventListener("keydown", (event) => {
  audio.unlockAudio();
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  if (event.code === "Space") {
    event.preventDefault();
    togglePause();
    return;
  }
  const key = event.key.toLowerCase();
  if (/^[a-z]$/.test(key)) {
    onLetterInput(key);
  }
});

restartBtn.addEventListener("click", () => {
  audio.unlockAudio();
  resetGame();
});

startBtn.addEventListener("click", () => {
  audio.unlockAudio();
  startGame();
});

muteBtn.addEventListener("click", () => {
  audio.unlockAudio();
  audio.toggleMute();
});

window.addEventListener("pointerdown", audio.unlockAudio, { once: true });
window.addEventListener("keydown", audio.unlockAudio, { once: true });

requestAnimationFrame((now) => {
  previous = now;
  state.startedAt = now;
  state.bestScore = loadBestScore();
  audio.updateMuteButtonLabel();
  gameLoop(now);
});
