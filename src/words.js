export const WORD_TIERS = {
  easy: ["code", "bug", "loop", "game", "score", "input", "enemy", "level", "pixel", "timer"],
  medium: ["array", "class", "object", "event", "logic", "delta", "stack", "queue", "value", "render"],
  hard: ["canvas", "script", "target", "rocket", "planet", "meteor", "galaxy", "signal", "vector", "kernel"]
};

export function getTierWeightsByLevel(level) {
  if (level <= 2) {
    return { easy: 0.82, medium: 0.17, hard: 0.01 };
  }
  if (level <= 4) {
    return { easy: 0.6, medium: 0.33, hard: 0.07 };
  }
  if (level <= 7) {
    return { easy: 0.42, medium: 0.43, hard: 0.15 };
  }
  if (level <= 10) {
    return { easy: 0.28, medium: 0.47, hard: 0.25 };
  }
  return { easy: 0.16, medium: 0.46, hard: 0.38 };
}

export function pickTierByWeight(weight) {
  const roll = Math.random();
  if (roll < weight.easy) {
    return "easy";
  }
  if (roll < weight.easy + weight.medium) {
    return "medium";
  }
  return "hard";
}

export function randomWord(level) {
  const weight = getTierWeightsByLevel(level);
  const tierName = pickTierByWeight(weight);
  const pool = WORD_TIERS[tierName];
  return pool[Math.floor(Math.random() * pool.length)];
}
