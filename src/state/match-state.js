import { framesToWin } from '../rules/snooker.js';
import {
  getPreset,
  getBallPoints,
  getMaxReds,
  isRaceMode,
  isTimedMode,
} from '../rules/game-presets.js';
import {
  createInitialMatches,
  maybeBuildNextRound,
  findNextPlayableMatch,
} from '../rules/tournament.js';

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
    multiPlayerFormat: null,
    targetScore: 100,
    customTarget: null,
    timerMinutes: 30,
    bestOf: 1,
    tournamentSeedOrder: [],
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
      startedAt: null,
      timerDurationMs: null,
      historyRecorded: false,
      finalPlayers: null,
      status: 'in_progress',
      winnerIndices: [],
      loserIndices: [],
      tie: false,
    },
    players: [createDefaultPlayer('Player 1'), createDefaultPlayer('Player 2')],
    activePlayer: 0,
    balls: { redsPotted: 0, colorsPhase: false, colorsPointsLeft: 27 },
    match: { bestOf: 1, status: 'in_progress' },
    history: [],
    settings: {},
    foulPickerOpen: false,
    foulByPlayer: null,
    endMatchPickerOpen: false,
    tournament: null,
  };
}

export function getActivePreset(state) {
  return getPreset(state.game?.modeId ?? state.setup?.gameModeId ?? 'ball15');
}

export function isMultiPlayerSingleGame(state) {
  return (
    state.players.length > 2 &&
    !state.tournament &&
    state.setup?.multiPlayerFormat === 'single'
  );
}

export function isTournamentMode(state) {
  return Boolean(state.tournament);
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
    endMatchPickerOpen: false,
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
  state.endMatchPickerOpen = false;
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
  if (setup.selectedProfileIds.length <= 2) {
    setup.multiPlayerFormat = null;
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
  if (setup.selectedProfileIds.length <= 2) return;
  if (setup.multiPlayerFormat === 'tournament') return;

  const preset = getPreset(setup.gameModeId);
  if (preset?.maxPlayers === 2) {
    setup.gameModeId = null;
  }
}

export function setMultiPlayerFormat(setup, format) {
  setup.multiPlayerFormat = format;
  if (format === 'single') {
    const preset = getPreset(setup.gameModeId);
    if (preset?.maxPlayers === 2) setup.gameModeId = null;
  }
  if (format !== 'tournament') {
    setup.tournamentSeedOrder = [];
  }
}

export function ensureTournamentSeedOrder(setup) {
  const selected = setup.selectedProfileIds;
  if (!Array.isArray(setup.tournamentSeedOrder)) {
    setup.tournamentSeedOrder = [];
  }
  const kept = setup.tournamentSeedOrder.filter((id) => selected.includes(id));
  const added = selected.filter((id) => !kept.includes(id));
  setup.tournamentSeedOrder = [...kept, ...added];
}

export function swapTournamentSeeds(setup, indexA, indexB) {
  ensureTournamentSeedOrder(setup);
  const order = setup.tournamentSeedOrder;
  if (
    indexA < 0 ||
    indexB < 0 ||
    indexA >= order.length ||
    indexB >= order.length ||
    indexA === indexB
  ) {
    return;
  }
  [order[indexA], order[indexB]] = [order[indexB], order[indexA]];
}

export function needsFormatStep(setup) {
  return setup.selectedProfileIds.length > 2;
}

export function wizardUsesFormatStep(setup) {
  return needsFormatStep(setup);
}

export function wizardGameStep(setup) {
  return wizardUsesFormatStep(setup) ? 2 : 1;
}

export function wizardOptionsStep(setup) {
  if (wizardSkipsOptionsStep(setup)) return null;
  return wizardUsesFormatStep(setup) ? 3 : 2;
}

export function wizardReviewStep(setup) {
  if (wizardSkipsOptionsStep(setup)) {
    return wizardUsesFormatStep(setup) ? 3 : 2;
  }
  return wizardUsesFormatStep(setup) ? 4 : 3;
}

export function wizardSkipsOptionsStep(setup) {
  return isTimedMode(getPreset(setup.gameModeId));
}

export function wizardStepLabels(setup) {
  const skipsOptions = wizardSkipsOptionsStep(setup);
  if (wizardUsesFormatStep(setup)) {
    return skipsOptions ? ['Format', 'Game', 'Start'] : ['Format', 'Game', 'Options', 'Start'];
  }
  return skipsOptions ? ['Game', 'Start'] : ['Game', 'Options', 'Start'];
}

export function wizardActiveStep(setup, step) {
  const labels = wizardStepLabels(setup);
  const formatOffset = wizardUsesFormatStep(setup) ? 1 : 0;
  const idx = step - 1 - formatOffset;
  return Math.max(0, Math.min(idx, labels.length - 1));
}

export function canAdvanceFromStep(setup) {
  const gameStep = wizardGameStep(setup);

  switch (setup.step) {
    case 0:
      return setup.selectedProfileIds.length >= 2;
    case 1:
      if (wizardUsesFormatStep(setup)) return !!setup.multiPlayerFormat;
      return !!setup.gameModeId;
    default:
      if (setup.step === gameStep) return !!setup.gameModeId;
      if (wizardOptionsStep(setup) != null && setup.step === wizardOptionsStep(setup)) return true;
      if (setup.step === wizardReviewStep(setup)) return true;
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

function captureFinalPlayers(state) {
  state.game.finalPlayers = state.players.map((p) => ({
    name: p.name,
    frameScore: p.frameScore ?? 0,
    framesWon: p.framesWon ?? 0,
    highestBreak: p.highestBreak ?? 0,
    avatar: p.avatar ?? null,
  }));
}

function resetBallsForPreset(state, preset) {
  const maxReds = getMaxReds(preset);
  state.balls = {
    redsPotted: 0,
    colorsPhase: false,
    colorsPointsLeft: 27,
    maxReds,
  };
}

function resetGameForPreset(state, preset) {
  state.game = {
    modeId: preset.id,
    targetScore: isRaceMode(preset)
      ? state.setup.customTarget || state.setup.targetScore
      : null,
    startedAt: Date.now(),
    timerDurationMs: null,
    historyRecorded: false,
    finalPlayers: null,
    status: 'in_progress',
    winnerIndices: [],
    loserIndices: [],
    tie: false,
  };
  state.match.bestOf =
    isRaceMode(preset) || isTimedMode(preset) ? 1 : state.setup.bestOf;
  state.match.status = 'in_progress';
}

function buildRosterFromSetup(state, profiles) {
  const ids =
    state.setup.multiPlayerFormat === 'tournament'
      ? (() => {
          ensureTournamentSeedOrder(state.setup);
          return state.setup.tournamentSeedOrder.filter((id) =>
            state.setup.selectedProfileIds.includes(id)
          );
        })()
      : state.setup.selectedProfileIds;

  return ids.map((id) => {
    const profile = profiles.find((p) => p.id === id);
    return createDefaultPlayer(profile?.name ?? 'Player', profile?.avatar ?? null);
  });
}

function loadTournamentMatchPlayers(state, match) {
  const roster = state.tournament.roster;
  state.players = [
    { ...createDefaultPlayer(roster[match.a].name, roster[match.a].avatar) },
    { ...createDefaultPlayer(roster[match.b].name, roster[match.b].avatar) },
  ];
  state.activePlayer = 0;
  for (const p of state.players) {
    p.frameScore = 0;
    p.currentBreak = 0;
    p.highestBreak = 0;
    p.framesWon = 0;
  }
}

function resolveByesAndLoadMatch(state, preset) {
  const t = state.tournament;
  while (true) {
    let match = findNextPlayableMatch(t.matches);
    if (!match) {
      const next = maybeBuildNextRound(t.matches, t.round);
      if (!next) return false;
      if (next.complete) {
        t.status = 'complete';
        t.championIdx = next.champion;
        state.game.status = 'complete';
        state.game.winnerIndices = [0];
        state.match.status = 'complete';
        state.players = [
          { ...t.roster[next.champion] },
          createDefaultPlayer('—'),
        ];
        return false;
      }
      t.matches.push(...next.matches);
      t.round = next.round;
      match = findNextPlayableMatch(t.matches);
      if (!match) continue;
    }
    t.currentMatchId = `${match.round}-${match.a}-${match.b}`;
    t.awaitingNext = false;
    loadTournamentMatchPlayers(state, match);
    resetBallsForPreset(state, preset);
    resetGameForPreset(state, preset);
    return true;
  }
}

function initTournament(state, profiles) {
  const roster = buildRosterFromSetup(state, profiles);
  const matches = createInitialMatches(roster.length);
  state.tournament = {
    roster,
    matches,
    round: 1,
    status: 'in_progress',
    championIdx: null,
    currentMatchId: null,
    awaitingNext: false,
  };
}

export function startMatch(state, profiles = []) {
  const preset = getPreset(state.setup.gameModeId);
  clampPlayersForMode(state.setup);
  state.history = [];
  state.foulPickerOpen = false;
  state.foulByPlayer = null;
  state.endMatchPickerOpen = false;

  const isTournament =
    state.setup.selectedProfileIds.length > 2 &&
    state.setup.multiPlayerFormat === 'tournament';

  if (isTournament) {
    initTournament(state, profiles);
    resolveByesAndLoadMatch(state, preset);
  } else {
    state.tournament = null;
    initPlayersFromSetup(state, profiles);
    resetBallsForPreset(state, preset);
    resetGameForPreset(state, preset);
  }

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
  state.endMatchPickerOpen = false;
}

export function goHomeFromGame(state) {
  state.screen = 'home';
  state.matchPaused = false;
  state.setup.step = 0;
  state.foulPickerOpen = false;
  state.foulByPlayer = null;
  state.endMatchPickerOpen = false;
}

export function resumeMatch(state) {
  state.screen = 'game';
  state.matchPaused = false;
}

export function hasResumableGame(state) {
  if (!state.matchPaused || state.players.length < 2) return false;
  const status = state.game?.status;
  return status === 'in_progress';
}

export function isMatchPlayable(state) {
  return state.game?.status === 'in_progress';
}

function finishTournamentMatch(state, winnerPlayerIndex) {
  const t = state.tournament;
  const match = t.matches.find(
    (m) =>
      m.status === 'pending' &&
      `${m.round}-${m.a}-${m.b}` === t.currentMatchId
  );
  if (!match) return;

  match.winner = winnerPlayerIndex === 0 ? match.a : match.b;
  match.status = 'complete';

  const roundDone = t.matches
    .filter((m) => m.round === t.round)
    .every((m) => m.winner !== null);

  if (!roundDone) {
    autoAdvanceTournament(state);
    return;
  }

  const next = maybeBuildNextRound(t.matches, t.round);
  if (!next) {
    autoAdvanceTournament(state);
    return;
  }

  if (next.complete) {
    captureFinalPlayers(state);
    t.status = 'complete';
    t.championIdx = next.champion;
    t.awaitingNext = false;
    state.game.status = 'complete';
    state.game.winnerIndices = [0];
    state.match.status = 'complete';
    state.players = [{ ...t.roster[next.champion] }, createDefaultPlayer('—')];
    return;
  }

  t.matches.push(...next.matches);
  t.round = next.round;
  autoAdvanceTournament(state);
}

function autoAdvanceTournament(state) {
  const t = state.tournament;
  if (!t || t.status === 'complete') return;

  t.awaitingNext = false;
  state.history = [];
  const preset = getActivePreset(state);
  resolveByesAndLoadMatch(state, preset);
}

export function advanceTournament(state) {
  if (!state.tournament || state.tournament.status === 'complete') {
    return false;
  }
  autoAdvanceTournament(state);
  return state.game.status === 'in_progress';
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
  state.activePlayer = playerIndex;
  const player = state.players[playerIndex];
  player.frameScore += points;
  player.currentBreak += points;
  updateHighestBreak(player);

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

  if (state.players.length > 2) {
    const fouler = state.players[foulingPlayerIndex];
    fouler.frameScore = Math.max(0, fouler.frameScore - foulPoints);
    updateHighestBreak(fouler);
    fouler.currentBreak = 0;
  } else {
    const beneficiary = foulBeneficiary(state, foulingPlayerIndex);
    state.players[beneficiary].frameScore += foulPoints;

    const atTable = state.players[state.activePlayer];
    updateHighestBreak(atTable);
    atTable.currentBreak = 0;
  }

  state.foulPickerOpen = false;
  state.foulByPlayer = null;
  state.endMatchPickerOpen = false;
}

export function openFoulPicker(state, playerIndex) {
  if (!isMatchPlayable(state)) return;
  state.foulPickerOpen = true;
  state.foulByPlayer = playerIndex;
  state.endMatchPickerOpen = false;
}

export function closeFoulPicker(state) {
  state.foulPickerOpen = false;
  state.foulByPlayer = null;
}

export function openEndMatchPicker(state) {
  if (!isMatchPlayable(state)) return;
  state.endMatchPickerOpen = true;
  state.foulPickerOpen = false;
  state.foulByPlayer = null;
}

export function closeEndMatchPicker(state) {
  state.endMatchPickerOpen = false;
}

/** Indices tied for highest frameScore, plus whether multiple players share the lead. */
export function getScoreLeaderIndices(state) {
  const scores = state.players.map((p) => p.frameScore);
  const maxScore = Math.max(...scores, 0);
  const indices = state.players
    .map((p, i) => (p.frameScore === maxScore ? i : -1))
    .filter((i) => i >= 0);
  return { maxScore, indices, isTie: indices.length > 1 };
}

/** Indices tied for lowest frameScore (meaningful when 3+ players and scores differ). */
export function getScoreLaggardIndices(state) {
  const scores = state.players.map((p) => p.frameScore);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const indices = state.players
    .map((p, i) => (p.frameScore === minScore ? i : -1))
    .filter((i) => i >= 0);
  const allTied = minScore === maxScore;
  return { minScore, indices, allTied, isTie: indices.length > 1 && !allTied };
}

/** Winner/loser split for 3+ players — lowest score loses, all others win (never a tie). */
export function getMultiPlayerOutcome(state) {
  const { indices: loserIndices } = getScoreLaggardIndices(state);
  const loserSet = new Set(loserIndices);
  const winnerIndices = state.players.map((_, i) => i).filter((i) => !loserSet.has(i));
  return { winnerIndices, loserIndices };
}

function finishMultiPlayerMatchByScore(state) {
  const preset = getActivePreset(state);
  const { winnerIndices, loserIndices } = getMultiPlayerOutcome(state);

  closeEndMatchPicker(state);
  pushHistory(state);
  captureFinalPlayers(state);
  state.game.winnerIndices = winnerIndices;
  state.game.loserIndices = loserIndices;
  state.game.tie = false;
  state.game.status = isTimedMode(preset) ? 'time_up' : 'complete';
  state.match.status = 'complete';
}

/** End match using current scores — highest score wins; tied scores end as a tie. */
export function endMatchByScore(state) {
  if (!isMatchPlayable(state)) return;
  if (state.players.length > 2 && !state.tournament) {
    finishMultiPlayerMatchByScore(state);
    return;
  }
  const { indices, isTie } = getScoreLeaderIndices(state);
  if (isTie) {
    endMatchWithTie(state);
  } else {
    endMatchWithWinner(state, indices[0]);
  }
}

export function endMatchWithWinner(state, winnerIndex) {
  if (!isMatchPlayable(state)) return;
  if (winnerIndex < 0 || winnerIndex >= state.players.length) return;

  closeEndMatchPicker(state);
  const preset = getActivePreset(state);

  if (state.tournament) {
    finishTournamentMatch(state, winnerIndex);
    return;
  }

  if (isRaceMode(preset) || isTimedMode(preset)) {
    pushHistory(state);
    captureFinalPlayers(state);
    state.game.winnerIndices = [winnerIndex];
    state.game.loserIndices = [];
    state.game.tie = false;
    state.game.status = isTimedMode(preset) ? 'time_up' : 'complete';
    state.match.status = 'complete';
    return;
  }

  awardFrame(state, winnerIndex);
}

export function endMatchWithTie(state) {
  if (!isMatchPlayable(state)) return;
  closeEndMatchPicker(state);
  pushHistory(state);

  if (state.tournament) {
    newFrame(state);
    return;
  }

  state.game.status = 'complete';
  state.game.tie = true;
  state.game.winnerIndices = [];
  state.game.loserIndices = [];
  captureFinalPlayers(state);
  state.match.status = 'complete';
}

export function cancelMatch(state) {
  closeEndMatchPicker(state);
  leaveMatch(state);
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
      if (state.tournament) {
        finishTournamentMatch(state, winners[0]);
      } else {
        captureFinalPlayers(state);
        state.game.status = 'complete';
        state.game.winnerIndices = winners;
        state.match.status = 'complete';
      }
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

  if (state.tournament) {
    finishTournamentMatch(state, winners.length === 1 ? winners[0] : 0);
    if (winners.length > 1) {
      state.game.tieBreak = true;
    }
    return;
  }

  captureFinalPlayers(state);
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
  state.game.loserIndices = [];
}

export function awardFrame(state, winnerIndex) {
  if (!isMatchPlayable(state)) return;
  pushHistory(state);
  state.players[winnerIndex].framesWon += 1;
  const needed = framesToWin(state.match.bestOf);
  if (state.players[winnerIndex].framesWon >= needed) {
    if (state.tournament) {
      finishTournamentMatch(state, winnerIndex);
      return;
    }
    captureFinalPlayers(state);
    state.match.status = 'complete';
    state.game.status = 'complete';
    state.game.winnerIndices = [winnerIndex];
    state.game.loserIndices = [];
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
