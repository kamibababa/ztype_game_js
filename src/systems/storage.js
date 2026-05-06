export const BEST_SCORE_KEY = "ztype_best_score";

export function loadBestScore() {
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

export function saveBestScore(bestScore) {
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
  } catch (_error) {
  }
}

export function syncBestScore(state) {
  if (state.score <= state.bestScore) {
    return;
  }
  state.bestScore = state.score;
  saveBestScore(state.bestScore);
}
