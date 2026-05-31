import { framesToWin } from '../rules/snooker.js';
import {
  getPreset,
  getBallPoints,
  getMaxReds,
  isRaceMode,
  isTimedMode,
} from '../rules/game-presets.js';

export const HISTORY_CAP = 50;

export function createDefaultPlayer(name, avatar = null) {
  return {
    name,
    avatar,
    frameScore: 0,
    currentBreak: 0,
    highestBreak: 0,
    framesWon: 0,
  };
}

export function createDefaultSetup() {
  return {
    step: 0,
    gameModeId: null,
    selectedProfileIds: [],
    playerNames: [],
    targetScore: 100,
    customTarget: null,
    timerMinutes: 30,
    bestOf: 1,
  };
}

export function createInitialState() {
  return {
    version: 2,
    screen: 'home',
    matchPaused: false,
    setup: createDefaultSetup(),
    game: {
      modeId: 'ball15',
      targetScore: null,
      timerStartedAt: null,
      timerDurationMs: null,
      status: 'in_progress',
      winnerIndices: [],
    },
    players: [createDefaultPlayer('Player 1'), createDefaultPlayer('Player 2')],
    activePlayer: 0,
    balls: { redsPotted: 0, colorsPhase: false, colorsPointsLeft: 27 },
    match: { bestOf: 1, status: 'in_progress' },
    history: [],
    settings: { autoSwitchTurn: false },
    foulPickerOpen: false,
    foulByPlayer: null,
  };
}

export function getActivePreset(state) {
  return getPreset(state.game?.modeId ?? state.setup?.gameModeId ?? 'ball15');
}

export function getMaxRedsForState(state) {
  return getMaxReds(getActivePreset(state));
}

/** Deep clone state for history (omit avatars to save storage) */
export function snapshot(state) {
  return {
    players: state.players.map(({ avatar, ...p }) => ({ ...p })),
    activePlayer: state.activePlayer,
    balls: { ...state.balls },
    match: { ...state.match },
    game: { ...state.game },
    settings: { ...state.settings },
    foulPickerOpen: false,
    foulByPlayer: null,
  };
}

export function pushHistory(state) {
  state.history.push(snapshot(state));
  if (state.history.length > HISTORY_CAP) state.history.shift();
}

export function restoreSnapshot(state, snap) {
  state.players = snap.players.map((p, i) => ({
    ...p,
    avatar: state.players[i]?.avatar ?? null,
  }));
  state.activePlayer = snap.activePlayer;
  state.balls = { ...snap.balls };
  state.match = { ...snap.match };
  state.game = { ...snap.game };
  state.settings = { ...snap.settings };
  state.foulPickerOpen = false;
  state.foulByPlayer = null;
}

function updateHighestBreak(player) {
  if (player.currentBreak > player.highestBreak) {
    player.highestBreak = player.currentBreak;
  }
}

// --- Setup wizard ---

export function setSetupStep(state, step) {
  state.setup.step = step;
}

export function toggleProfileSelection(setup, profileId) {
  const i = setup.selectedProfileIds.indexOf(profileId);
  if (i >= 0) {
    setup.selectedProfileIds.splice(i, 1);
  } else if (setup.selectedProfileIds.length < 7) {
    setup.selectedProfileIds.push(profileId);
  }
  syncPlayerNamesFromSelection(setup);
}

export function syncPlayerNamesFromSelection(setup, profiles = []) {
  setup.playerNames = setup.selectedProfileIds
    .map((id) => profiles.find((p) => p.id === id)?.name)
    .filter(Boolean);
}

export function addPlayerToSetup(setup, name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return false;
  if (setup.playerNames.length >= 7) return false;
  if (setup.playerNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
    return false;
  }
  setup.playerNames.push(trimmed);
  return true;
}

export function removePlayerFromSetup(setup, index) {
  setup.playerNames.splice(index, 1);
}

export function clampPlayersForMode(setup) {
  const preset = getPreset(setup.gameModeId);
  if (preset.maxPlayers === 2 && setup.selectedProfileIds.length > 2) {
    setup.selectedProfileIds = setup.selectedProfileIds.slice(0, 2);
    setup.playerNames = setup.playerNames.slice(0, 2);
  }
}

export function canAdvanceFromStep(setup) {
  switch (setup.step) {
    case 0:
      return setup.selectedProfileIds.length >= 2;
    case 1:
      return !!setup.gameModeId;
    case 2:
      return true;
    case 3:
      return true;
    default:
      return false;
  }
}

export function initPlayersFromSetup(state, profiles = []) {
  const ids = state.setup.selectedProfileIds;
  if (ids.length >= 2) {
    state.players = ids.map((id) => {
      const profile = profiles.find((p) => p.id === id);
      return createDefaultPlayer(
        profile?.name ?? 'Player',
        profile?.avatar ?? null
      );
    });
  } else if (state.setup.playerNames.length >= 2) {
    state.players = state.setup.playerNames.map((name) =>
      createDefaultPlayer(name)
    );
  } else {
    state.players = [
      createDefaultPlayer('Player 1'),
      createDefaultPlayer('Player 2'),
    ];
  }
  state.activePlayer = 0;
}

export function startMatch(state, profiles = []) {
  const preset = getPreset(state.setup.gameModeId);
  clampPlayersForMode(state.setup);
  initPlayersFromSetup(state, profiles);

  const maxReds = getMaxReds(preset);
  state.balls = {
    redsPotted: 0,
    colorsPhase: false,
    colorsPointsLeft: 27,
    maxReds,
  };

  state.game = {
    modeId: preset.id,
    targetScore: isRaceMode(preset)
      ? state.setup.customTarget || state.setup.targetScore
      : null,
    timerStartedAt: isTimedMode(preset) ? Date.now() : null,
    timerDurationMs: isTimedMode(preset)
      ? state.setup.timerMinutes * 60 * 1000
      : null,
    status: 'in_progress',
    winnerIndices: [],
  };

  state.match.bestOf = isRaceMode(preset) || isTimedMode(preset) ? 1 : state.setup.bestOf;
  state.match.status = 'in_progress';
  state.history = [];
  state.screen = 'game';
  state.matchPaused = false;
  state.setup.step = 0;
}

export function leaveMatch(state) {
  state.screen = 'home';
  state.matchPaused = true;
  state.setup.step = 0;
  state.foulPickerOpen = false;
  state.foulByPlayer = null;
}

export function resumeMatch(state) {
  state.screen = 'game';
  state.matchPaused = false;
}

export function hasResumableGame(state) {
  return (
    state.matchPaused &&
    state.players.length >= 2 &&
    state.game?.status === 'in_progress'
  );
}

export function isMatchPlayable(state) {
  return state.game?.status === 'in_progress';
}

// --- Game actions ---

export function setActivePlayer(state, index) {
  if (index < 0 || index >= state.players.length) return;
  pushHistory(state);
  state.activePlayer = index;
}

export function addPoints(state, playerIndex, ballValue) {
  if (!isMatchPlayable(state)) return;
  const preset = getActivePreset(state);
  const points = getBallPoints(preset, ballValue);
  pushHistory(state);
  const player = state.players[playerIndex];
  player.frameScore += points;
  player.currentBreak += points;
  updateHighestBreak(player);

  if (
    state.settings.autoSwitchTurn &&
    playerIndex !== state.activePlayer
  ) {
    state.activePlayer = playerIndex;
  }

  checkWinCondition(state);
}

function foulBeneficiary(state, foulingIndex) {
  const n = state.players.length;
  if (n === 2) return foulingIndex === 0 ? 1 : 0;
  if (state.activePlayer !== foulingIndex) return state.activePlayer;
  return (foulingIndex + 1) % n;
}

export function applyFoul(state, foulingPlayerIndex, foulPoints) {
  if (!isMatchPlayable(state)) return;
  pushHistory(state);
  const beneficiary = foulBeneficiary(state, foulingPlayerIndex);
  state.players[beneficiary].frameScore += foulPoints;

  const atTable = state.players[state.activePlayer];
  updateHighestBreak(atTable);
  atTable.currentBreak = 0;

  state.foulPickerOpen = false;
  state.foulByPlayer = null;
}

export function openFoulPicker(state, playerIndex) {
  if (!isMatchPlayable(state)) return;
  state.foulPickerOpen = true;
  state.foulByPlayer = playerIndex;
}

export function closeFoulPicker(state) {
  state.foulPickerOpen = false;
  state.foulByPlayer = null;
}

export function endBreak(state) {
  if (!isMatchPlayable(state)) return;
  pushHistory(state);
  const player = state.players[state.activePlayer];
  updateHighestBreak(player);
  player.currentBreak = 0;
}

export function undo(state) {
  if (state.history.length === 0) return false;
  const prev = state.history.pop();
  restoreSnapshot(state, prev);
  return true;
}

export function checkWinCondition(state) {
  const preset = getActivePreset(state);

  if (isRaceMode(preset) && state.game.targetScore) {
    const winners = state.players
      .map((p, i) => (p.frameScore >= state.game.targetScore ? i : -1))
      .filter((i) => i >= 0);
    if (winners.length > 0) {
      state.game.status = 'complete';
      state.game.winnerIndices = winners;
      state.match.status = 'complete';
    }
    return;
  }

  if (state.game.status === 'time_up') return;
}

export function endTimedMatch(state) {
  const scores = state.players.map((p) => p.frameScore);
  const max = Math.max(...scores);
  const winners = state.players
    .map((p, i) => (p.frameScore === max ? i : -1))
    .filter((i) => i >= 0);
  state.game.status = 'time_up';
  state.game.winnerIndices = winners;
  state.match.status = 'complete';
}

export function newFrame(state) {
  pushHistory(state);
  const maxReds = getMaxRedsForState(state);
  for (const player of state.players) {
    player.frameScore = 0;
    player.currentBreak = 0;
  }
  state.balls = {
    redsPotted: 0,
    colorsPhase: false,
    colorsPointsLeft: 27,
    maxReds,
  };
  state.activePlayer = 0;
  state.game.status = 'in_progress';
  state.game.winnerIndices = [];
}

export function awardFrame(state, winnerIndex) {
  if (!isMatchPlayable(state)) return;
  pushHistory(state);
  state.players[winnerIndex].framesWon += 1;
  const needed = framesToWin(state.match.bestOf);
  if (state.players[winnerIndex].framesWon >= needed) {
    state.match.status = 'complete';
    state.game.status = 'complete';
    state.game.winnerIndices = [winnerIndex];
  }
  const maxReds = getMaxRedsForState(state);
  for (const player of state.players) {
    player.frameScore = 0;
    player.currentBreak = 0;
  }
  state.balls = {
    redsPotted: 0,
    colorsPhase: false,
    colorsPointsLeft: 27,
    maxReds,
  };
}

export function setBestOf(state, bestOf) {
  state.match.bestOf = bestOf;
  state.setup.bestOf = bestOf;
  const needed = framesToWin(bestOf);
  if (
    state.players.every((p) => p.framesWon < needed)
  ) {
    state.match.status = 'in_progress';
  }
}

export function incrementRedsPotted(state) {
  const maxReds = getMaxRedsForState(state);
  pushHistory(state);
  if (state.balls.redsPotted < maxReds) {
    state.balls.redsPotted += 1;
    if (state.balls.redsPotted >= maxReds) {
      state.balls.colorsPhase = true;
    }
  }
}

export function decrementRedsPotted(state) {
  const maxReds = getMaxRedsForState(state);
  pushHistory(state);
  if (state.balls.redsPotted > 0) {
    state.balls.redsPotted -= 1;
    state.balls.colorsPhase = state.balls.redsPotted >= maxReds;
  }
}

export function setColorsPhase(state, on) {
  const maxReds = getMaxRedsForState(state);
  pushHistory(state);
  state.balls.colorsPhase = on;
  if (on && state.balls.redsPotted < maxReds) {
    state.balls.redsPotted = maxReds;
  }
}

export function setColorsPointsLeft(state, value) {
  pushHistory(state);
  state.balls.colorsPointsLeft = Math.max(0, Math.min(27, value));
}
