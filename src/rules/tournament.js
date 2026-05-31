/** @typedef {{ round: number, a: number, b: number | null, winner: number | null, status: 'pending' | 'complete' | 'bye' }} TournamentMatch */

/**
 * First-round pairings in selection order. Odd player out gets a bye.
 * @param {number} playerCount
 * @returns {TournamentMatch[]}
 */
export function createInitialMatches(playerCount) {
  const matches = [];
  let i = 0;
  while (i < playerCount) {
    if (i + 1 >= playerCount) {
      matches.push({ round: 1, a: i, b: null, winner: i, status: 'bye' });
      i += 1;
    } else {
      matches.push({ round: 1, a: i, b: i + 1, winner: null, status: 'pending' });
      i += 2;
    }
  }
  return matches;
}

/**
 * @param {TournamentMatch[]} matches
 * @param {number} round
 * @returns {{ complete: true, champion: number } | { complete: false, matches: TournamentMatch[], round: number } | null}
 */
export function maybeBuildNextRound(matches, round) {
  const roundMatches = matches.filter((m) => m.round === round);
  if (roundMatches.length === 0) return null;
  if (!roundMatches.every((m) => m.winner !== null)) return null;

  const winners = roundMatches.map((m) => m.winner);
  if (winners.length === 1) {
    return { complete: true, champion: winners[0] };
  }

  const nextRound = round + 1;
  /** @type {TournamentMatch[]} */
  const newMatches = [];
  for (let i = 0; i < winners.length; i += 2) {
    if (i + 1 >= winners.length) {
      newMatches.push({
        round: nextRound,
        a: winners[i],
        b: null,
        winner: winners[i],
        status: 'bye',
      });
    } else {
      newMatches.push({
        round: nextRound,
        a: winners[i],
        b: winners[i + 1],
        winner: null,
        status: 'pending',
      });
    }
  }
  return { complete: false, matches: newMatches, round: nextRound };
}

/** @param {TournamentMatch[]} matches */
export function findNextPlayableMatch(matches) {
  return matches.find((m) => m.status === 'pending') ?? null;
}

/** @param {number} round @param {number} totalRounds */
export function roundLabel(round, totalRounds) {
  if (totalRounds <= 1) return 'Final';
  if (round === totalRounds) return 'Final';
  if (round === totalRounds - 1) return 'Semi-final';
  if (round === totalRounds - 2) return 'Quarter-final';
  return `Round ${round}`;
}

/** Estimate total rounds for n players (single elimination). */
export function estimateTotalRounds(playerCount) {
  return Math.ceil(Math.log2(playerCount));
}
