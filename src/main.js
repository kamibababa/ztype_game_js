import { createAudioController } from "./audio.js";
import { createInitialState, createPlayer } from "./state.js";
import { getLockedEnemy, onLetterInput } from "./systems/combat.js";
import { renderScene, updateHud } from "./systems/render.js";
import { loadBestScore, syncBestScore } from "./systems/storage.js";
import { updateWorld } from "./systems/update.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hud = {
  scoreEl: document.getElementById("score"),
  bestScoreEl: document.getElementById("bestScore"),
  livesEl: document.getElementById("lives"),
  levelEl: document.getElementById("level"),
  comboEl: document.getElementById("combo"),
  multiplierEl: document.getElementById("multiplier"),
  targetWordEl: document.getElementById("targetWord"),
  lockedWord: ""
};

const muteBtn = document.getElementById("muteBtn");
const startOverlayEl = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");
const pauseOverlayEl = document.getElementById("pauseOverlay");
const overlayEl = document.getElementById("overlay");
const finalScoreEl = document.getElementById("finalScore");
const finalBestScoreEl = document.getElementById("finalBestScore");
const restartBtn = document.getElementById("restartBtn");

const state = createInitialState();
const player = createPlayer(canvas);
const audio = createAudioController(muteBtn);

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

function loseLife() {
  state.lives -= 1;
  audio.playDamageSound();
  state.combo = 0;
  state.multiplier = 1;
  state.comboTimer = 0;

  if (state.lives <= 0) {
    state.lives = 0;
    state.status = "gameover";
    syncBestScore(state);
    finalScoreEl.textContent = String(state.score);
    finalBestScoreEl.textContent = String(state.bestScore);
    overlayEl.classList.remove("hidden");
    audio.playGameOverSound();
    state.lockedEnemyId = null;
    state.bullets = [];
  }
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

let previous = performance.now();
function gameLoop(now) {
  const dt = Math.min((now - previous) / 1000, 0.05);
  previous = now;

  updateWorld(state, canvas, dt, now, loseLife);
  const locked = getLockedEnemy(state);
  hud.lockedWord = locked ? locked.word : "";
  renderScene(ctx, canvas, state, player, state.lockedEnemyId, now);
  updateHud(state, hud);

  requestAnimationFrame(gameLoop);
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
    onLetterInput(state, player, key, audio);
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
