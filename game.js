const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");
const targetWordEl = document.getElementById("targetWord");
const overlayEl = document.getElementById("overlay");
const finalScoreEl = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");

const WORDS = [
  "code", "bug", "array", "loop", "class", "object", "event", "canvas", "game", "score",
  "logic", "input", "enemy", "level", "delta", "pixel", "timer", "stack", "queue", "value",
  "script", "render", "target", "rocket", "planet", "meteor", "galaxy", "signal", "vector", "kernel"
];

const state = {
  status: "running",
  score: 0,
  lives: 5,
  level: 1,
  enemies: [],
  lockedEnemyId: null,
  lastSpawnTime: 0,
  spawnInterval: 1500,
  minSpawnInterval: 500,
  enemyBaseSpeed: 28,
  enemyIdSeed: 1,
  startedAt: performance.now()
};

function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function spawnEnemy(now) {
  const word = randomWord();
  const margin = 80;
  const x = margin + Math.random() * (canvas.width - margin * 2);
  const speed = state.enemyBaseSpeed + Math.random() * 18 + state.level * 4;

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
  const newLevel = 1 + Math.floor(elapsedSec / 18);
  if (newLevel !== state.level) {
    state.level = newLevel;
    state.spawnInterval = Math.max(state.minSpawnInterval, 1500 - (state.level - 1) * 110);
    state.enemyBaseSpeed = 28 + (state.level - 1) * 3;
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

  locked.progress += 1;
  if (locked.progress >= locked.word.length) {
    killEnemy(locked.id);
  }
}

function killEnemy(enemyId) {
  const index = state.enemies.findIndex((enemy) => enemy.id === enemyId);
  if (index === -1) {
    return;
  }

  const enemy = state.enemies[index];
  state.score += enemy.word.length * 10;
  state.enemies.splice(index, 1);
  if (state.lockedEnemyId === enemyId) {
    state.lockedEnemyId = null;
  }
}

function loseLife() {
  state.lives -= 1;
  if (state.lives <= 0) {
    state.lives = 0;
    state.status = "gameover";
    finalScoreEl.textContent = String(state.score);
    overlayEl.classList.remove("hidden");
    state.lockedEnemyId = null;
  }
}

function update(dt, now) {
  if (state.status !== "running") {
    return;
  }

  updateDifficulty(now);

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
      loseLife();
      if (state.status !== "running") {
        return;
      }
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
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const allWidth = ctx.measureText(enemy.word).width;
  const doneWidth = ctx.measureText(done).width;
  const startX = enemy.x - allWidth / 2;

  ctx.textAlign = "left";
  ctx.fillStyle = "#86efac";
  ctx.fillText(done, startX, enemy.y + 34);
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(todo, startX + doneWidth, enemy.y + 34);
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

  ctx.strokeStyle = "rgba(251,113,133,0.35)";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 20);
  ctx.lineTo(canvas.width, canvas.height - 20);
  ctx.stroke();
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  livesEl.textContent = String(state.lives);
  levelEl.textContent = String(state.level);
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
  state.status = "running";
  state.score = 0;
  state.lives = 5;
  state.level = 1;
  state.enemies = [];
  state.lockedEnemyId = null;
  state.lastSpawnTime = 0;
  state.spawnInterval = 1500;
  state.minSpawnInterval = 500;
  state.enemyBaseSpeed = 28;
  state.enemyIdSeed = 1;
  state.startedAt = performance.now();

  overlayEl.classList.add("hidden");
}

window.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const key = event.key.toLowerCase();
  if (/^[a-z]$/.test(key)) {
    onLetterInput(key);
  }
});

restartBtn.addEventListener("click", () => {
  resetGame();
});

requestAnimationFrame((now) => {
  previous = now;
  state.startedAt = now;
  gameLoop(now);
});
