export function renderScene(ctx, canvas, state, player, lockedEnemyId, now) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#071226");
  gradient.addColorStop(1, "#02060d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStarfield(ctx, canvas, now);
  for (const enemy of state.enemies) {
    drawEnemy(ctx, enemy, lockedEnemyId != null && enemy.id === lockedEnemyId);
  }
  drawBullets(ctx, state.bullets);
  drawExplosions(ctx, state.explosions);
  drawPlayerShip(ctx, player);

  ctx.strokeStyle = "rgba(251,113,133,0.35)";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 20);
  ctx.lineTo(canvas.width, canvas.height - 20);
  ctx.stroke();
}

export function updateHud(state, hud) {
  hud.scoreEl.textContent = String(state.score);
  hud.bestScoreEl.textContent = String(state.bestScore);
  hud.livesEl.textContent = String(state.lives);
  hud.levelEl.textContent = String(state.level);
  hud.comboEl.textContent = String(state.combo);
  hud.multiplierEl.textContent = `x${state.multiplier.toFixed(2).replace(/\.00$/, ".0")}`;
  hud.targetWordEl.textContent = hud.lockedWord || "无";
}

function drawStarfield(ctx, canvas, now) {
  const stars = 70;
  for (let i = 0; i < stars; i += 1) {
    const px = (i * 139) % canvas.width;
    const py = ((i * 257) + now * (0.015 + (i % 3) * 0.007)) % canvas.height;
    const alpha = 0.2 + (i % 4) * 0.15;
    ctx.fillStyle = `rgba(200,220,255,${alpha})`;
    ctx.fillRect(px, py, 2, 2);
  }
}

function drawEnemy(ctx, enemy, isLocked) {
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

function drawBullets(ctx, bullets) {
  for (const bullet of bullets) {
    const alpha = Math.max(0.35, bullet.trailLife);
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(134,239,172,${alpha})`;
    ctx.fill();
  }
}

function drawExplosions(ctx, explosions) {
  for (const particle of explosions) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${particle.color},${alpha})`;
    ctx.fill();
  }
}

function drawPlayerShip(ctx, player) {
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
