const STORAGE_KEY = 'snookerScore.matchHistory';
const MAX_ENTRIES = 200;

function normalizeEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  return {
    id: entry.id ?? crypto.randomUUID(),
    startedAt: Number(entry.startedAt) || Number(entry.endedAt) || Date.now(),
    endedAt: Number(entry.endedAt) || Date.now(),
    modeId: entry.modeId ?? 'ball15',
    modeLabel: entry.modeLabel ?? 'Snooker',
    summary: entry.summary ?? entry.modeLabel ?? 'Match',
    resultLabel: entry.resultLabel ?? (entry.tie ? 'Match tied' : entry.winnerNames?.[0] ? `${entry.winnerNames[0]} wins` : 'Match complete'),
    players: Array.isArray(entry.players)
      ? entry.players.map((p) => ({
          name: p?.name ?? 'Player',
          score: p?.score ?? 0,
          framesWon: p?.framesWon ?? 0,
          highestBreak: p?.highestBreak ?? 0,
          avatar: p?.avatar ?? null,
          isWinner: Boolean(p?.isWinner ?? entry.winnerNames?.includes(p?.name)),
          isLoser: Boolean(p?.isLoser ?? entry.loserNames?.includes(p?.name)),
        }))
      : [],
    winnerNames: Array.isArray(entry.winnerNames) ? entry.winnerNames : [],
    winnerIndices: Array.isArray(entry.winnerIndices) ? entry.winnerIndices : [],
    loserNames: Array.isArray(entry.loserNames) ? entry.loserNames : [],
    loserIndices: Array.isArray(entry.loserIndices) ? entry.loserIndices : [],
    tie: Boolean(entry.tie),
    durationMs: Number(entry.durationMs) || 0,
    costPkr: Number(entry.costPkr) || 0,
    bestOf: Number(entry.bestOf) || 1,
    targetScore: entry.targetScore ?? null,
    isTournament: Boolean(entry.isTournament),
    format: entry.format ?? null,
    tournamentBracket: Array.isArray(entry.tournamentBracket) ? entry.tournamentBracket : null,
  };
}

export function loadMatchHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeEntry).filter(Boolean).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function saveMatchHistory(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    return true;
  } catch {
    return false;
  }
}

export function addMatchHistoryEntry(entry) {
  const entries = loadMatchHistory();
  entries.unshift(normalizeEntry(entry));
  saveMatchHistory(entries);
  return entry;
}

export function clearMatchHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function deleteMatchHistoryEntry(id) {
  const entries = loadMatchHistory().filter((e) => e.id !== id);
  saveMatchHistory(entries);
  return entries;
}
