import { findEnemyById, spawnBullet, spawnExplosion } from "../entities/effects.js";

export function chooseLockByFirstChar(state, ch) {
  const candidates = state.enemies.filter((enemy) => enemy.word[0] === ch);
  if (candidates.length === 0) {
    return null;
  }
  candidates.sort((first, second) => second.y - first.y);
  return candidates[0];
}

export function getLockedEnemy(state) {
  if (state.lockedEnemyId == null) {
    return null;
  }
  return state.enemies.find((enemy) => enemy.id === state.lockedEnemyId) || null;
}

export function killEnemy(state, enemyId, audio) {
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
  spawnExplosion(state, enemy.x, enemy.y, "125,211,252");
  state.enemies.splice(index, 1);
  if (state.lockedEnemyId === enemyId) {
    state.lockedEnemyId = null;
  }
}

export function onLetterInput(state, player, ch, audio) {
  if (state.status !== "running") {
    return;
  }

  const locked = getLockedEnemy(state);
  if (!locked) {
    const target = chooseLockByFirstChar(state, ch);
    if (!target) {
      return;
    }
    state.lockedEnemyId = target.id;
    audio.playShotSound();
    spawnBullet(state, player, target.id, target.x, target.y);
    target.progress = 1;
    if (target.progress >= target.word.length) {
      killEnemy(state, target.id, audio);
    }
    return;
  }

  const expect = locked.word[locked.progress];
  if (expect !== ch) {
    return;
  }

  audio.playShotSound();
  spawnBullet(state, player, locked.id, locked.x, locked.y);
  locked.progress += 1;
  if (locked.progress >= locked.word.length) {
    killEnemy(state, locked.id, audio);
  }
}

export function updateProjectiles(state, canvas, dt) {
  for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.bullets[i];
    const targetEnemy = findEnemyById(state, bullet.targetEnemyId);
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
      spawnExplosion(state, fx, fy, "134,239,172");
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
}
