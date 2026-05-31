export const RACE_TARGETS = [50, 60, 70, 100, 120, 150];

export const GAME_MODES = {
  ball1: {
    id: 'ball1',
    label: '1-Ball',
    description: 'Single red snooker',
    minPlayers: 2,
    maxPlayers: 2,
    maxReds: 1,
    winType: 'frames',
    foulPoints: [4, 5, 6, 7],
    redPoints: 1,
  },
  ball6: {
    id: 'ball6',
    label: '6-Ball',
    description: '6 reds on the table',
    minPlayers: 2,
    maxPlayers: 2,
    maxReds: 6,
    winType: 'frames',
    foulPoints: [4, 5, 6, 7],
    redPoints: 1,
  },
  ball10: {
    id: 'ball10',
    label: '10-Ball',
    description: '10 reds on the table',
    minPlayers: 2,
    maxPlayers: 2,
    maxReds: 10,
    winType: 'frames',
    foulPoints: [4, 5, 6, 7],
    redPoints: 1,
  },
  ball15: {
    id: 'ball15',
    label: '15-Ball',
    description: 'Standard snooker frame',
    minPlayers: 2,
    maxPlayers: 2,
    maxReds: 15,
    winType: 'frames',
    foulPoints: [4, 5, 6, 7],
    redPoints: 1,
  },
  race: {
    id: 'race',
    label: 'Race to',
    description: 'First to reach target score',
    minPlayers: 2,
    maxPlayers: 7,
    maxReds: null,
    winType: 'race',
    foulPoints: [4, 5, 6, 7],
    redPoints: 1,
  },
  timed: {
    id: 'timed',
    label: 'Timed',
    description: 'Highest score when match ends — Red = 10 pts',
    minPlayers: 2,
    maxPlayers: 7,
    maxReds: null,
    winType: 'timed',
    foulPoints: [4, 5, 6, 7, 10],
    redPoints: 10,
  },
};

export function getPreset(id) {
  return GAME_MODES[id] ?? GAME_MODES.ball15;
}

export function getBallPoints(preset, ballValue) {
  if (ballValue === 1 && preset.redPoints === 10) return 10;
  return ballValue;
}

export function getMaxReds(preset) {
  return preset.maxReds ?? 15;
}

export function getFoulOptions(preset) {
  if (isTimedMode(preset)) return [4, 5, 6, 7, 10];
  return [4, 5, 6, 7];
}

export function getScoringBallValues(preset) {
  const base = [1, 2, 3, 4, 5, 6, 7];
  return isTimedMode(preset) ? [...base, 10] : base;
}

export function isRaceMode(preset) {
  return preset.winType === 'race';
}

export function isTimedMode(preset) {
  return preset.winType === 'timed';
}

export function isSnookerTableMode(preset) {
  return preset.maxReds != null;
}

export function getModeSummary(state) {
  const preset = getPreset(state.game?.modeId ?? state.setup?.gameModeId ?? 'ball15');
  const parts = [preset.label];

  const format = state.setup?.multiPlayerFormat;
  if (format === 'tournament') parts.unshift('Tournament');
  else if (format === 'single' && (state.setup?.selectedProfileIds?.length ?? 0) > 2) {
    parts.unshift('All players');
  }

  if (isRaceMode(preset)) {
    const target = state.game?.targetScore ?? state.setup?.targetScore ?? 100;
    parts.push(`Race to ${target}`);
  } else if (isTimedMode(preset)) {
    parts.push('Red = 10 pts');
  }

  return parts.join(' · ');
}

/** Modes available for the current setup selection. */
export function getAvailableModes(setup) {
  const count = setup.selectedProfileIds.length;
  return Object.values(GAME_MODES).filter((mode) => {
    if (count <= 2) return true;
    if (setup.multiPlayerFormat === 'tournament') return true;
    if (setup.multiPlayerFormat === 'single') return true;
    return false;
  });
}

export function formatLabel(format) {
  if (format === 'tournament') return 'Tournament';
  if (format === 'single') return 'All in one game';
  return '';
}
