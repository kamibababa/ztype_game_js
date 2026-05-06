import { spawnExplosion } from "../entities/effects.js";
import { updateProjectiles } from "./combat.js";
import { spawnEnemy, updateDifficulty } from "./spawn.js";

export function updateWorld(state, canvas, dt, now, loseLife) {
  if (state.status !== "running") {
    return;
  }

  updateDifficulty(state, now);

  if (state.combo > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) {
      state.combo = 0;
      state.multiplier = 1;
      state.comboTimer = 0;
    }
  }

  if (now - state.lastSpawnTime >= state.spawnInterval) {
    spawnEnemy(state, canvas, now);
  }

  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    enemy.y += enemy.speed * dt;
    if (enemy.y >= canvas.height - 20) {
      if (state.lockedEnemyId === enemy.id) {
        state.lockedEnemyId = null;
      }
      state.enemies.splice(i, 1);
      spawnExplosion(state, enemy.x, canvas.height - 20, "251,113,133");
      loseLife();
      if (state.status !== "running") {
        return;
      }
    }
  }

  updateProjectiles(state, canvas, dt);

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
