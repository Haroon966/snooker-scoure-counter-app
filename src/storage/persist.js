import { createInitialState, createDefaultPlayer, HISTORY_CAP } from '../state/match-state.js';

const STORAGE_KEY_V2 = 'snookerMatch.v2';
const STORAGE_KEY_V1 = 'snookerMatch';

export function migrateV1ToV2(v1) {
  const state = createInitialState();
  state.screen = 'game';
  state.matchPaused = false;
  state.players[0].frameScore = v1.score1 ?? 0;
  state.players[1].frameScore = v1.score2 ?? 0;
  state.players[0].currentBreak = v1.currentBreak1 ?? 0;
  state.players[1].currentBreak = v1.currentBreak2 ?? 0;
  state.players[0].name = v1.name1 ?? 'Player 1';
  state.players[1].name = v1.name2 ?? 'Player 2';
  state.activePlayer = Math.min(1, Math.max(0, (v1.activePlayer ?? 1) - 1));
  state.setup.playerNames = [state.players[0].name, state.players[1].name];
  state.game.modeId = 'ball15';

  if (Array.isArray(v1.history)) {
    state.history = v1.history.slice(-HISTORY_CAP).map((h) => ({
      players: [
        {
          name: state.players[0].name,
          frameScore: h.score1 ?? 0,
          currentBreak: h.currentBreak1 ?? 0,
          highestBreak: 0,
          framesWon: 0,
        },
        {
          name: state.players[1].name,
          frameScore: h.score2 ?? 0,
          currentBreak: h.currentBreak2 ?? 0,
          highestBreak: 0,
          framesWon: 0,
        },
      ],
      activePlayer: Math.min(1, Math.max(0, (h.activePlayer ?? 1) - 1)),
      balls: { redsPotted: 0, colorsPhase: false, colorsPointsLeft: 27, maxReds: 15 },
      match: { bestOf: 1, status: 'in_progress' },
      game: { modeId: 'ball15', status: 'in_progress', winnerIndices: [] },
      settings: {},
      foulPickerOpen: false,
      foulByPlayer: null,
    }));
  }

  return state;
}

function sanitizePlayers(dataPlayers) {
  if (!Array.isArray(dataPlayers) || dataPlayers.length < 2) {
    return [createDefaultPlayer('Player 1'), createDefaultPlayer('Player 2')];
  }
  return dataPlayers.slice(0, 7).map((p, i) => ({
    ...createDefaultPlayer(typeof p?.name === 'string' ? p.name : `Player ${i + 1}`),
    frameScore: Number(p?.frameScore) || 0,
    currentBreak: Number(p?.currentBreak) || 0,
    highestBreak: Number(p?.highestBreak) || 0,
    framesWon: Number(p?.framesWon) || 0,
    avatar: typeof p?.avatar === 'string' ? p.avatar : null,
  }));
}

function mergeLoadedState(data) {
  const base = createInitialState();
  const players = sanitizePlayers(data.players);
  const activePlayer = Math.min(
    players.length - 1,
    Math.max(0, Number(data.activePlayer) || 0)
  );
  const history = Array.isArray(data.history)
    ? data.history.slice(-HISTORY_CAP)
    : [];

  return {
    ...base,
    version: 2,
    screen: data.screen === 'game' ? 'game' : 'home',
    matchPaused: Boolean(data.matchPaused),
    setup: {
      ...base.setup,
      ...(data.setup ?? {}),
      selectedProfileIds: Array.isArray(data.setup?.selectedProfileIds)
        ? data.setup.selectedProfileIds
        : [],
      tournamentSeedOrder: Array.isArray(data.setup?.tournamentSeedOrder)
        ? data.setup.tournamentSeedOrder
        : [],
      step: Math.min(4, Math.max(0, Number(data.setup?.step) || 0)),
    },
    game: {
      ...base.game,
      ...(data.game ?? {}),
      startedAt:
        Number(data.game?.startedAt) ||
        Number(data.game?.timerStartedAt) ||
        null,
      status: ['in_progress', 'complete', 'time_up', 'between_matches'].includes(
        data.game?.status
      )
        ? data.game.status
        : 'in_progress',
    },
    activePlayer,
    history,
    players,
    balls: {
      ...base.balls,
      maxReds: 15,
      ...(data.balls ?? {}),
      redsPotted: Math.min(15, Math.max(0, Number(data.balls?.redsPotted) || 0)),
    },
    match: {
      ...base.match,
      ...(data.match ?? {}),
      status: data.match?.status === 'complete' ? 'complete' : 'in_progress',
    },
    settings: {},
    foulPickerOpen: false,
    foulByPlayer: null,
    tournament: data.tournament ?? null,
  };
}

function buildPayload(state) {
  return {
    version: 2,
    screen: state.screen,
    matchPaused: Boolean(state.matchPaused),
    setup: state.setup,
    game: state.game,
    players: state.players,
    activePlayer: state.activePlayer,
    balls: state.balls,
    match: state.match,
    history: state.history.slice(-HISTORY_CAP),
    settings: state.settings,
    tournament: state.tournament,
  };
}

export function loadState() {
  try {
    const v2Raw = localStorage.getItem(STORAGE_KEY_V2);
    if (v2Raw) {
      return mergeLoadedState(JSON.parse(v2Raw));
    }

    const v1Raw = localStorage.getItem(STORAGE_KEY_V1);
    if (v1Raw) {
      const migrated = migrateV1ToV2(JSON.parse(v1Raw));
      saveState(migrated);
      return migrated;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return createInitialState();
}

/** @returns {{ ok: boolean, error?: string }} */
export function saveState(state) {
  let payload = buildPayload(state);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(payload));
      return { ok: true };
    } catch (err) {
      if (err?.name !== 'QuotaExceededError') {
        return { ok: false, error: err?.message ?? 'Save failed' };
      }
      if (payload.history.length > 5) {
        payload = { ...payload, history: payload.history.slice(-Math.floor(payload.history.length / 2)) };
        state.history = payload.history;
        continue;
      }
      for (const p of payload.players) {
        delete p.avatar;
      }
      state.players.forEach((p) => {
        p.avatar = null;
      });
      payload = buildPayload(state);
    }
  }
  return { ok: false, error: 'Storage full — free space by starting a new match' };
}
