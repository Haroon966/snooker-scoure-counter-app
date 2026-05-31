import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createInitialState } from '../src/state/match-state.js';
import { saveState, loadState, migrateV1ToV2 } from '../src/storage/persist.js';

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

describe('persist', () => {
  beforeEach(() => {
    mockLocalStorage();
    localStorage.clear();
  });

  it('round-trips state', () => {
    const state = createInitialState();
    state.players[0].frameScore = 42;
    state.setup.selectedProfileIds = ['a', 'b'];
    state.matchPaused = true;
    expect(saveState(state).ok).toBe(true);
    const loaded = loadState();
    expect(loaded.players[0].frameScore).toBe(42);
    expect(loaded.setup.selectedProfileIds).toEqual(['a', 'b']);
    expect(loaded.matchPaused).toBe(true);
  });

  it('migrates v1 storage', () => {
    const migrated = migrateV1ToV2({
      score1: 5,
      score2: 10,
      name1: 'A',
      name2: 'B',
      activePlayer: 1,
    });
    expect(migrated.players[0].frameScore).toBe(5);
    expect(migrated.players[1].name).toBe('B');
  });

  it('handles corrupt JSON gracefully', () => {
    localStorage.setItem('snookerMatch.v2', '{not json');
    const state = loadState();
    expect(state.players).toHaveLength(2);
  });

  it('returns error when storage fails', () => {
    const state = createInitialState();
    const original = localStorage.setItem;
    localStorage.setItem = () => {
      throw new DOMException('quota', 'QuotaExceededError');
    };
    const result = saveState(state);
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    localStorage.setItem = original;
  });
});
