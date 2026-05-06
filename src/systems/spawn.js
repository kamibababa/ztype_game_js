import { randomWord } from "../words.js";

export function spawnEnemy(state, canvas, now) {
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

export function updateDifficulty(state, now) {
  const elapsedSec = (now - state.startedAt) / 1000;
  const newLevel = 1 + Math.floor(elapsedSec / 16);
  if (newLevel !== state.level) {
    state.level = newLevel;
    const spawnDrop = Math.min(920, (state.level - 1) * 78);
    state.spawnInterval = Math.max(state.minSpawnInterval, 1500 - spawnDrop);
    state.enemyBaseSpeed = 28 + Math.min(36, (state.level - 1) * 2.1);
  }
}
