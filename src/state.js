export function createInitialState() {
  return {
    status: "ready",
    score: 0,
    bestScore: 0,
    lives: 5,
    level: 1,
    combo: 0,
    multiplier: 1,
    comboTimeoutSec: 2.2,
    comboTimer: 0,
    enemies: [],
    bullets: [],
    explosions: [],
    lockedEnemyId: null,
    lastSpawnTime: 0,
    spawnInterval: 1500,
    minSpawnInterval: 500,
    enemyBaseSpeed: 28,
    enemyIdSeed: 1,
    startedAt: performance.now()
  };
}

export function createPlayer(canvas) {
  return {
    x: canvas.width / 2,
    y: canvas.height - 44
  };
}
