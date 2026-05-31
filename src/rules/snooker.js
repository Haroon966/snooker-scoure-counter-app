/** Maximum points from one red + black sequence */
export const RED_BLACK_MAX = 8;

/** Total value of all colors (yellow through black) */
export const COLORS_TOTAL = 27;

export const BALL_LABELS = {
  1: 'Red',
  2: 'Yellow',
  3: 'Green',
  4: 'Brown',
  5: 'Blue',
  6: 'Pink',
  7: 'Black',
  10: '+10',
};

/**
 * Points still available on the table (standard 15-red frame).
 * @param {{ redsPotted: number, colorsPhase: boolean, colorsPointsLeft?: number }} balls
 */
export function pointsLeftOnTable(balls, maxReds = 15) {
  const cap = Math.max(1, maxReds);
  const redsPotted = Math.min(cap, Math.max(0, balls.redsPotted ?? 0));
  const redsLeft = cap - redsPotted;

  if (!balls.colorsPhase) {
    return redsLeft * RED_BLACK_MAX + COLORS_TOTAL;
  }

  return balls.colorsPointsLeft ?? COLORS_TOTAL;
}

/**
 * Minimum snookers required when trailing (0 = can win without snookers).
 * @param {number} playerScore
 * @param {number} opponentScore
 * @param {number} pointsLeft
 */
export function snookersRequired(playerScore, opponentScore, pointsLeft) {
  const deficit = opponentScore - playerScore;
  if (deficit <= 0) return 0;
  if (deficit <= pointsLeft) return 0;
  return Math.ceil((deficit - pointsLeft) / COLORS_TOTAL);
}

/**
 * Human-readable status for a trailing player.
 */
export function snookerStatus(playerScore, opponentScore, pointsLeft) {
  const deficit = opponentScore - playerScore;
  if (deficit <= 0) {
    return deficit < 0 ? 'Ahead' : 'Level';
  }
  if (deficit <= pointsLeft) {
    return `Needs ${deficit} — clear table wins`;
  }
  const snookers = snookersRequired(playerScore, opponentScore, pointsLeft);
  return `Need ${snookers} snooker${snookers === 1 ? '' : 's'}`;
}

/** Frames needed to win a best-of match */
export function framesToWin(bestOf) {
  return Math.floor(bestOf / 2) + 1;
}
