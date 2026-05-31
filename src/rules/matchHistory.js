import { getPreset, getModeSummary, isRaceMode, isTimedMode } from './game-presets.js';
import { getGameStartedAt } from '../ui/timer.js';
import { calculateSessionCost } from '../utils/billing.js';
import { addMatchHistoryEntry } from '../storage/matchHistory.js';

export function isMatchRecordable(state) {
  if (state.game?.historyRecorded) return false;
  if (state.match?.status !== 'complete') return false;
  return true;
}

function getWinnerIndices(state) {
  if (state.tournament?.status === 'complete' && state.tournament.championIdx != null) {
    return [state.tournament.championIdx];
  }
  if (state.game?.tie) return [];
  return state.game?.winnerIndices ?? [];
}

function getLoserIndices(state) {
  if (state.game?.tie) return [];
  return state.game?.loserIndices ?? [];
}

function getWinnerNames(state, winnerIndices) {
  if (state.tournament?.status === 'complete' && state.tournament.championIdx != null) {
    const champion = state.tournament.roster[state.tournament.championIdx];
    return champion ? [champion.name] : [];
  }

  if (state.game?.tie) return [];

  return winnerIndices
    .map((i) => state.game?.finalPlayers?.[i]?.name ?? state.players[i]?.name)
    .filter(Boolean);
}

function getLoserNames(state, loserIndices) {
  if (state.game?.tie || !loserIndices.length) return [];
  return loserIndices
    .map((i) => state.game?.finalPlayers?.[i]?.name ?? state.players[i]?.name)
    .filter(Boolean);
}

function getFinalPlayerStats(state, index) {
  const final = state.game?.finalPlayers?.[index];
  if (final) return final;
  const live = state.players[index];
  if (!live) return null;
  return {
    name: live.name,
    frameScore: live.frameScore ?? 0,
    framesWon: live.framesWon ?? 0,
    highestBreak: live.highestBreak ?? 0,
    avatar: live.avatar ?? null,
  };
}

function getPlayersForHistory(state, winnerIndices, loserIndices) {
  const winnerSet = new Set(winnerIndices);
  const loserSet = new Set(loserIndices);

  if (state.tournament?.status === 'complete') {
    return state.tournament.roster.map((p, index) => ({
      name: p.name,
      score: null,
      framesWon: 0,
      highestBreak: 0,
      avatar: p.avatar ?? null,
      isWinner: winnerSet.has(index),
      isLoser: loserSet.has(index),
    }));
  }

  const source = state.game?.finalPlayers ?? state.players;

  return source.map((p, index) => ({
    name: p.name,
    score: p.frameScore ?? 0,
    framesWon: p.framesWon ?? 0,
    highestBreak: p.highestBreak ?? 0,
    avatar: p.avatar ?? null,
    isWinner: winnerSet.has(index),
    isLoser: loserSet.has(index),
  }));
}

function getTournamentBracketHistory(state) {
  if (!state.tournament) return null;
  const { roster, matches } = state.tournament;
  return matches
    .filter((m) => m.winner != null)
    .map((m) => ({
      round: m.round,
      playerA: roster[m.a]?.name ?? '—',
      playerB: m.b != null ? roster[m.b]?.name : 'Bye',
      winner: roster[m.winner]?.name ?? null,
    }));
}

function buildMultiPlayerResultLabel(state, loserNames, loserIndices) {
  if (!loserNames.length) return 'Match complete';
  if (loserNames.length === 1) {
    const stats = getFinalPlayerStats(state, loserIndices[0]);
    const pts = stats?.frameScore ?? 0;
    return `${loserNames[0]} lost with ${pts} pts`;
  }
  const allLost = loserNames.length === (state.game?.finalPlayers ?? state.players)?.length;
  if (allLost) {
    const pts = getFinalPlayerStats(state, loserIndices[0])?.frameScore ?? 0;
    return `${loserNames.join(', ')} lost — tied at ${pts} pts`;
  }
  return `${loserNames.join(', ')} lost`;
}

function buildResultLabel(state, preset, winnerNames, loserNames, tie) {
  if (tie) return 'Match tied';
  if (state.tournament?.status === 'complete' && winnerNames[0]) {
    return `${winnerNames[0]} wins the tournament`;
  }
  const playerCount = (state.game?.finalPlayers ?? state.players)?.length ?? 0;
  if (playerCount > 2 && loserNames.length > 0) {
    return buildMultiPlayerResultLabel(state, loserNames, getLoserIndices(state));
  }
  if (loserNames.length > 0 && winnerNames.length > 0) {
    const loserLabel =
      loserNames.length === 1
        ? `${loserNames[0]} last`
        : `${loserNames.join(', ')} last`;
    return winnerNames.length === 1
      ? `${winnerNames[0]} wins — ${loserLabel}`
      : `${winnerNames.join(', ')} win — ${loserLabel}`;
  }
  const winners = state.game?.winnerIndices ?? [];
  if (winners.length === 1) {
    const w = getFinalPlayerStats(state, winners[0]);
    if (!w) return winnerNames[0] ? `${winnerNames[0]} wins` : 'Match complete';
    if (isTimedMode(preset) || isRaceMode(preset)) {
      return `${w.name} wins with ${w.frameScore} pts`;
    }
    if (state.match.bestOf > 1) {
      const opp = getFinalPlayerStats(state, 1 - winners[0]);
      return `${w.name} wins ${w.framesWon}–${opp?.framesWon ?? 0} frames`;
    }
    const opp = getFinalPlayerStats(state, winners[0] === 0 ? 1 : 0);
    if (opp) {
      return `${w.name} wins ${w.frameScore}–${opp.frameScore}`;
    }
    return `${w.name} wins with ${w.frameScore} pts`;
  }
  if (winnerNames.length > 1) {
    return `${winnerNames.join(', ')} win`;
  }
  if (winnerNames.length === 1) return `${winnerNames[0]} wins`;
  return 'Match complete';
}

export function buildMatchHistoryEntry(state, pricePerHour) {
  const preset = getPreset(state.game?.modeId ?? state.setup?.gameModeId ?? 'ball15');
  const startedAt = getGameStartedAt(state) ?? Date.now();
  const endedAt = Date.now();
  const durationMs = Math.max(0, endedAt - startedAt);
  const winnerIndices = getWinnerIndices(state);
  const loserIndices = getLoserIndices(state);
  const winnerNames = getWinnerNames(state, winnerIndices);
  const loserNames = getLoserNames(state, loserIndices);
  const tie = Boolean(state.game?.tie);

  return {
    id: crypto.randomUUID(),
    startedAt,
    endedAt,
    modeId: preset.id,
    modeLabel: preset.label,
    summary: getModeSummary(state),
    resultLabel: buildResultLabel(state, preset, winnerNames, loserNames, tie),
    players: getPlayersForHistory(state, winnerIndices, loserIndices),
    winnerNames,
    winnerIndices,
    loserNames,
    loserIndices,
    tie,
    durationMs,
    costPkr: calculateSessionCost(pricePerHour, durationMs),
    bestOf: state.match?.bestOf ?? 1,
    targetScore: state.game?.targetScore ?? state.setup?.targetScore ?? null,
    isTournament: state.tournament?.status === 'complete',
    format: state.setup?.multiPlayerFormat ?? null,
    tournamentBracket: getTournamentBracketHistory(state),
  };
}

export function tryRecordMatchHistory(state, pricePerHour) {
  if (!isMatchRecordable(state)) return false;
  const entry = buildMatchHistoryEntry(state, pricePerHour);
  addMatchHistoryEntry(entry);
  state.game.historyRecorded = true;
  return true;
}

export function formatHistoryDate(timestamp) {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatHistoryTime(timestamp) {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatHistoryDuration(ms) {
  if (!ms || ms <= 0) return '—';
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
