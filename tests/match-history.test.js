import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState, startMatch, endMatchWithWinner } from '../src/state/match-state.js';
import {
  buildMatchHistoryEntry,
  tryRecordMatchHistory,
  isMatchRecordable,
  formatHistoryDuration,
} from '../src/rules/matchHistory.js';
import { loadMatchHistory, clearMatchHistory } from '../src/storage/matchHistory.js';

function mockLocalStorage() {
  const store = {};
  global.localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

describe('matchHistory', () => {
  beforeEach(() => {
    mockLocalStorage();
    clearMatchHistory();
  });

  it('records a completed match with timestamps', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'ball15';
    state.setup.selectedProfileIds = ['a', 'b'];
    startMatch(state, [
      { id: 'a', name: 'Ali', avatar: null },
      { id: 'b', name: 'Sara', avatar: null },
    ]);
    state.players[0].frameScore = 45;
    state.players[1].frameScore = 32;
    endMatchWithWinner(state, 0);

    expect(isMatchRecordable(state)).toBe(true);
    expect(tryRecordMatchHistory(state, 500)).toBe(true);
    expect(state.game.historyRecorded).toBe(true);

    const [entry] = loadMatchHistory();
    expect(entry.players).toHaveLength(2);
    expect(entry.players[0]).toMatchObject({ name: 'Ali', score: 45, isWinner: true });
    expect(entry.players[1]).toMatchObject({ name: 'Sara', score: 32, isWinner: false });
    expect(entry.winnerNames).toEqual(['Ali']);
    expect(entry.winnerIndices).toEqual([0]);
    expect(entry.resultLabel).toContain('Ali');
    expect(entry.startedAt).toBeTruthy();
    expect(entry.endedAt).toBeTruthy();
    expect(entry.durationMs).toBeGreaterThanOrEqual(0);
    expect(entry.summary).toContain('15-Ball');
  });

  it('does not record twice for the same match', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'race';
    state.setup.selectedProfileIds = ['a', 'b'];
    startMatch(state);
    state.match.status = 'complete';
    state.game.status = 'complete';
    state.game.winnerIndices = [0];

    expect(tryRecordMatchHistory(state, 500)).toBe(true);
    expect(tryRecordMatchHistory(state, 500)).toBe(false);
    expect(loadMatchHistory()).toHaveLength(1);
  });

  it('formats duration labels', () => {
    expect(formatHistoryDuration(25 * 60 * 1000)).toBe('25 min');
    expect(formatHistoryDuration(90 * 60 * 1000)).toBe('1h 30m');
  });

  it('builds entry with cost from price per hour', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    startMatch(state);
    state.game.startedAt = Date.now() - 30 * 60 * 1000;
    state.match.status = 'complete';
    state.game.status = 'time_up';
    state.game.winnerIndices = [0];
    state.players = [createInitialState().players[0], createInitialState().players[1]];
    state.players[0].name = 'Ali';
    state.players[1].name = 'Sara';

    const entry = buildMatchHistoryEntry(state, 500);
    expect(entry.costPkr).toBe(250);
    expect(entry.players[0].score).toBeGreaterThanOrEqual(0);
    expect(entry.resultLabel).toContain('Ali');
  });

  it('stores frame scores and highest breaks', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'ball15';
    state.setup.selectedProfileIds = ['a', 'b'];
    startMatch(state, [
      { id: 'a', name: 'Ali', avatar: null },
      { id: 'b', name: 'Sara', avatar: null },
    ]);
    state.players[0].frameScore = 67;
    state.players[0].highestBreak = 32;
    state.players[1].frameScore = 54;
    state.players[1].highestBreak = 21;
    state.match.status = 'complete';
    state.game.status = 'complete';
    state.game.winnerIndices = [0];

    const entry = buildMatchHistoryEntry(state, 500);
    expect(entry.players[0]).toMatchObject({ score: 67, highestBreak: 32, isWinner: true, isLoser: false });
    expect(entry.players[1]).toMatchObject({ score: 54, highestBreak: 21, isWinner: false, isLoser: false });
    expect(entry.resultLabel).toBe('Ali wins 67–54');
  });

  it('records multi-player winners and losers', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    const profiles = [
      { id: 'a', name: 'Ali', avatar: null },
      { id: 'b', name: 'Bob', avatar: null },
      { id: 'c', name: 'Cal', avatar: null },
    ];
    state.setup.selectedProfileIds = profiles.map((p) => p.id);
    startMatch(state, profiles);
    state.players[0].frameScore = 30;
    state.players[1].frameScore = 25;
    state.players[2].frameScore = 10;
    state.match.status = 'complete';
    state.game.status = 'complete';
    state.game.winnerIndices = [0, 1];
    state.game.loserIndices = [2];

    const entry = buildMatchHistoryEntry(state, 500);
    expect(entry.winnerNames).toEqual(['Ali', 'Bob']);
    expect(entry.loserNames).toEqual(['Cal']);
    expect(entry.players[2]).toMatchObject({ name: 'Cal', score: 10, isWinner: false, isLoser: true });
    expect(entry.resultLabel).toBe('Cal lost with 10 pts');
  });

  it('records all players as losers when scores are tied in multi-player', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    const profiles = [
      { id: 'a', name: 'Ali', avatar: null },
      { id: 'b', name: 'Bob', avatar: null },
      { id: 'c', name: 'Cal', avatar: null },
    ];
    state.setup.selectedProfileIds = profiles.map((p) => p.id);
    startMatch(state, profiles);
    state.players.forEach((p) => { p.frameScore = 15; });
    state.match.status = 'complete';
    state.game.status = 'complete';
    state.game.winnerIndices = [];
    state.game.loserIndices = [0, 1, 2];

    const entry = buildMatchHistoryEntry(state, 500);
    expect(entry.tie).toBe(false);
    expect(entry.resultLabel).toBe('Ali, Bob, Cal lost — tied at 15 pts');
  });
});
