import { describe, it, expect } from 'vitest';
import {
  createInitialMatches,
  maybeBuildNextRound,
  findNextPlayableMatch,
  estimateTotalRounds,
} from '../src/rules/tournament.js';
import {
  createInitialState,
  startMatch,
  addPoints,
  advanceTournament,
  isTournamentMode,
} from '../src/state/match-state.js';
import { getAvailableModes, GAME_MODES } from '../src/rules/game-presets.js';

describe('tournament bracket', () => {
  it('pairs players in order with bye for odd count', () => {
    const m3 = createInitialMatches(3);
    expect(m3).toHaveLength(2);
    expect(m3[0]).toMatchObject({ a: 0, b: 1, status: 'pending' });
    expect(m3[1]).toMatchObject({ a: 2, b: null, status: 'bye', winner: 2 });

    const m4 = createInitialMatches(4);
    expect(m4).toHaveLength(2);
    expect(m4[0].b).toBe(1);
    expect(m4[1].a).toBe(2);
    expect(m4[1].b).toBe(3);
  });

  it('builds next round from winners', () => {
    const matches = createInitialMatches(4);
    matches[0].winner = 0;
    matches[0].status = 'complete';
    matches[1].winner = 3;
    matches[1].status = 'complete';

    const next = maybeBuildNextRound(matches, 1);
    expect(next).toMatchObject({ complete: false, round: 2 });
    expect(next.matches).toHaveLength(1);
    expect(next.matches[0]).toMatchObject({ a: 0, b: 3, status: 'pending' });
  });

  it('declares champion when one winner remains', () => {
    const matches = [
      { round: 2, a: 0, b: 1, winner: 0, status: 'complete' },
    ];
    const next = maybeBuildNextRound(matches, 2);
    expect(next).toEqual({ complete: true, champion: 0 });
  });

  it('finds next pending match', () => {
    const matches = createInitialMatches(4);
    expect(findNextPlayableMatch(matches)?.a).toBe(0);
  });

  it('estimates rounds for player count', () => {
    expect(estimateTotalRounds(3)).toBe(2);
    expect(estimateTotalRounds(4)).toBe(2);
    expect(estimateTotalRounds(8)).toBe(3);
  });
});

describe('tournament match flow', () => {
  function profiles(names) {
    return names.map((name) => ({
      id: crypto.randomUUID(),
      name,
      avatar: null,
    }));
  }

  it('starts tournament with first pairing loaded', () => {
    const state = createInitialState();
    const ps = profiles(['A', 'B', 'C', 'D']);
    state.setup.selectedProfileIds = ps.map((p) => p.id);
    state.setup.multiPlayerFormat = 'tournament';
    state.setup.gameModeId = 'race';
    state.setup.targetScore = 20;

    startMatch(state, ps);
    expect(isTournamentMode(state)).toBe(true);
    expect(state.players).toHaveLength(2);
    expect(state.players[0].name).toBe('A');
    expect(state.players[1].name).toBe('B');
  });

  it('starts tournament with custom seed order', () => {
    const state = createInitialState();
    const ps = profiles(['A', 'B', 'C', 'D']);
    state.setup.selectedProfileIds = ps.map((p) => p.id);
    state.setup.multiPlayerFormat = 'tournament';
    state.setup.gameModeId = 'ball15';
    state.setup.tournamentSeedOrder = [ps[2].id, ps[0].id, ps[3].id, ps[1].id];

    startMatch(state, ps);
    expect(state.players[0].name).toBe('C');
    expect(state.players[1].name).toBe('A');
  });

  it('advances to next bracket match after win', () => {
    const state = createInitialState();
    const ps = profiles(['A', 'B', 'C', 'D']);
    state.setup.selectedProfileIds = ps.map((p) => p.id);
    state.setup.multiPlayerFormat = 'tournament';
    state.setup.gameModeId = 'race';
    state.setup.targetScore = 10;

    startMatch(state, ps);
    addPoints(state, 0, 7);
    addPoints(state, 0, 7);
    expect(state.game.status).toBe('in_progress');
    expect(state.players[0].name).toBe('C');
    expect(state.players[1].name).toBe('D');
  });
});

describe('getAvailableModes', () => {
  it('shows all modes for tournament', () => {
    const setup = {
      selectedProfileIds: ['a', 'b', 'c'],
      multiPlayerFormat: 'tournament',
    };
    expect(getAvailableModes(setup).length).toBeGreaterThan(2);
  });

  it('shows all modes for all-in-one', () => {
    const setup = {
      selectedProfileIds: ['a', 'b', 'c'],
      multiPlayerFormat: 'single',
    };
    const modes = getAvailableModes(setup);
    expect(modes.length).toBe(Object.keys(GAME_MODES).length);
    expect(modes.map((m) => m.id)).toContain('ball15');
    expect(modes.map((m) => m.id)).toContain('timed');
  });
});
