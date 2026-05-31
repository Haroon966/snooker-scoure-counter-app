import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  addPoints,
  applyFoul,
  undo,
  endBreak,
  awardFrame,
  newFrame,
  setActivePlayer,
  incrementRedsPotted,
  startMatch,
  endTimedMatch,
  addPlayerToSetup,
  hasResumableGame,
  resumeMatch,
  isMatchPlayable,
} from '../src/state/match-state.js';
import { migrateV1ToV2 } from '../src/storage/persist.js';

describe('match state', () => {
  it('adds points and tracks break', () => {
    const state = createInitialState();
    addPoints(state, 0, 7);
    expect(state.players[0].frameScore).toBe(7);
    expect(state.players[0].currentBreak).toBe(7);
    expect(state.players[0].highestBreak).toBe(7);
  });

  it('applies foul to opponent and clears break at table', () => {
    const state = createInitialState();
    addPoints(state, 0, 10);
    applyFoul(state, 1, 5);
    expect(state.players[0].frameScore).toBe(15);
    expect(state.players[0].currentBreak).toBe(0);
    expect(state.players[0].highestBreak).toBe(10);
  });

  it('undoes last action', () => {
    const state = createInitialState();
    addPoints(state, 0, 1);
    addPoints(state, 0, 2);
    undo(state);
    expect(state.players[0].frameScore).toBe(1);
  });

  it('ends break without changing score', () => {
    const state = createInitialState();
    addPoints(state, 0, 5);
    endBreak(state);
    expect(state.players[0].frameScore).toBe(5);
    expect(state.players[0].currentBreak).toBe(0);
    expect(state.players[0].highestBreak).toBe(5);
  });

  it('awards frame and resets frame scores', () => {
    const state = createInitialState();
    state.match.bestOf = 3;
    addPoints(state, 0, 50);
    awardFrame(state, 0);
    expect(state.players[0].framesWon).toBe(1);
    expect(state.players[0].frameScore).toBe(0);
  });

  it('new frame clears scores only', () => {
    const state = createInitialState();
    state.players[0].framesWon = 2;
    addPoints(state, 0, 30);
    newFrame(state);
    expect(state.players[0].framesWon).toBe(2);
    expect(state.players[0].frameScore).toBe(0);
  });

  it('switches active player', () => {
    const state = createInitialState();
    setActivePlayer(state, 1);
    expect(state.activePlayer).toBe(1);
  });

  it('enters colors phase after 15 reds', () => {
    const state = createInitialState();
    state.game.modeId = 'ball15';
    state.balls.maxReds = 15;
    for (let i = 0; i < 15; i++) incrementRedsPotted(state);
    expect(state.balls.redsPotted).toBe(15);
    expect(state.balls.colorsPhase).toBe(true);
  });

  it('starts match with 4 players in timed mode', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    state.setup.timerMinutes = 15;
    const profiles = ['A', 'B', 'C', 'D'].map((n) => ({
      id: crypto.randomUUID(),
      name: n,
      avatar: null,
    }));
    state.setup.selectedProfileIds = profiles.map((p) => p.id);
    startMatch(state, profiles);
    expect(state.screen).toBe('game');
    expect(state.players).toHaveLength(4);
    expect(state.game.timerDurationMs).toBe(15 * 60 * 1000);
  });

  it('wins race when target reached', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'race';
    state.setup.targetScore = 50;
    state.setup.selectedProfileIds = ['a', 'b'];
    state.setup.playerNames = ['P1', 'P2'];
    startMatch(state);
    addPoints(state, 0, 7);
    addPoints(state, 0, 7);
    addPoints(state, 0, 7);
    addPoints(state, 0, 7);
    addPoints(state, 0, 7);
    addPoints(state, 0, 7);
    addPoints(state, 0, 8);
    expect(state.game.status).toBe('complete');
  });

  it('timed mode scores red as 10', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    state.setup.selectedProfileIds = ['a', 'b'];
    state.setup.playerNames = ['P1', 'P2'];
    startMatch(state);
    addPoints(state, 0, 1);
    expect(state.players[0].frameScore).toBe(10);
  });

  it('endTimedMatch picks highest score', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    state.setup.selectedProfileIds = ['a', 'b'];
    state.setup.playerNames = ['P1', 'P2'];
    startMatch(state);
    addPoints(state, 0, 7);
    addPoints(state, 1, 7);
    addPoints(state, 1, 7);
    endTimedMatch(state);
    expect(state.game.winnerIndices).toContain(1);
  });

  it('resumes paused match from home', () => {
    const state = createInitialState();
    state.matchPaused = true;
    state.players[0].frameScore = 10;
    expect(hasResumableGame(state)).toBe(true);
    resumeMatch(state);
    expect(state.screen).toBe('game');
    expect(state.matchPaused).toBe(false);
  });

  it('blocks scoring when match is finished', () => {
    const state = createInitialState();
    state.game.status = 'complete';
    addPoints(state, 0, 1);
    expect(state.players[0].frameScore).toBe(0);
    expect(isMatchPlayable(state)).toBe(false);
  });
});

describe('migrateV1ToV2', () => {
  it('migrates legacy storage shape', () => {
    const v2 = migrateV1ToV2({
      score1: 10,
      score2: 20,
      currentBreak1: 5,
      currentBreak2: 0,
      activePlayer: 2,
      name1: 'Alice',
      name2: 'Bob',
      history: [{ score1: 0, score2: 0, currentBreak1: 0, currentBreak2: 0, activePlayer: 1 }],
    });
    expect(v2.players[0].frameScore).toBe(10);
    expect(v2.players[1].frameScore).toBe(20);
    expect(v2.players[0].name).toBe('Alice');
    expect(v2.activePlayer).toBe(1);
    expect(v2.history.length).toBe(1);
  });
});
