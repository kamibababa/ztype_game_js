export function spawnBullet(state, player, targetEnemyId, targetX, targetY) {
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

export function spawnExplosion(state, x, y, color) {
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

export function findEnemyById(state, enemyId) {
  return state.enemies.find((enemy) => enemy.id === enemyId) || null;
}
