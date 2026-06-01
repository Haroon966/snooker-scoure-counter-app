/**
 * Meet-style participant grid: minimize empty cells, balance aspect, orient for viewport.
 */

/** Slot count for the grid (even when odd player count > 1, for a filler tile). */
export function getGridSlotCount(playerCount) {
  if (playerCount <= 1) return playerCount;
  if (playerCount % 2 === 1) return playerCount + 1;
  return playerCount;
}

export function shouldAddGridFiller(playerCount) {
  return playerCount > 1 && playerCount % 2 === 1;
}

function layoutScore(count, cols, rows, orientation) {
  const waste = cols * rows - count;
  let score = waste * 1000;
  const aspect = cols / rows;
  score += Math.abs(Math.log(aspect)) * 40;

  if (cols === 1 && count > 2) score += 800;
  if (rows === 1 && cols === count && count > 2) score += 2000;
  if (orientation === 'portrait' && rows > 3) score += 400 + (rows - 3) * 120;
  if (orientation === 'landscape' && (cols > 4 || rows > 3)) {
    score += cols > 4 ? 400 + (cols - 4) * 120 : 0;
    score += rows > 3 ? 400 + (rows - 3) * 120 : 0;
  }

  if (orientation === 'portrait') {
    if (cols > rows) score += 35;
    score += cols * 3;
  } else {
    if (rows > cols) score += 35;
    score += cols * 3;
  }

  return score;
}

/** @param {number} count @param {{ orientation?: 'portrait' | 'landscape' }} [options] */
export function getPlayerGridLayout(count, options = {}) {
  const orientation = options.orientation ?? 'portrait';

  if (count <= 0) return { cols: 1, rows: 1 };
  if (count === 1) return { cols: 1, rows: 1 };

  if (count === 2) {
    return orientation === 'landscape'
      ? { cols: 2, rows: 1 }
      : { cols: 1, rows: 2 };
  }

  const maxCols = Math.min(
    count,
    orientation === 'portrait'
      ? count <= 6
        ? 3
        : 4
      : 4
  );
  let best = null;

  for (let cols = 1; cols <= maxCols; cols += 1) {
    const rows = Math.ceil(count / cols);
    const score = layoutScore(count, cols, rows, orientation);
    if (!best || score < best.score) {
      best = { cols, rows, score };
    }
  }

  return { cols: best.cols, rows: best.rows };
}
