import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadProfiles,
  saveProfiles,
  addProfile,
  updateProfile,
  createProfile,
} from '../src/storage/profiles.js';
import { createInitialState, syncPlayersFromProfiles } from '../src/state/match-state.js';

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

describe('profiles', () => {
  beforeEach(() => {
    mockLocalStorage();
    localStorage.clear();
  });

  it('rejects duplicate name on update', () => {
    const a = createProfile('Alice');
    const b = createProfile('Bob');
    saveProfiles([a, b]);
    const profiles = loadProfiles();
    const result = updateProfile(profiles, b.id, { name: 'alice' });
    expect(result).toEqual({ ok: false, reason: 'duplicate' });
    expect(loadProfiles().find((p) => p.id === b.id)?.name).toBe('Bob');
  });

  it('updates name and avatar', () => {
    const p = createProfile('Sam', '🎱');
    saveProfiles([p]);
    const profiles = loadProfiles();
    const result = updateProfile(profiles, p.id, { name: 'Samuel', avatar: '🏆' });
    expect(result).toEqual({ ok: true });
    const saved = loadProfiles().find((x) => x.id === p.id);
    expect(saved?.name).toBe('Samuel');
    expect(saved?.avatar).toBe('🏆');
  });
});

describe('syncPlayersFromProfiles', () => {
  it('updates live match players without resetting scores', () => {
    const state = createInitialState();
    const p1 = createProfile('One', '🎱');
    const p2 = createProfile('Two', '🏆');
    state.setup.selectedProfileIds = [p1.id, p2.id];
    state.players = [
      { name: 'One', avatar: '🎱', frameScore: 42, currentBreak: 3, highestBreak: 10, framesWon: 0 },
      { name: 'Two', avatar: '🏆', frameScore: 7, currentBreak: 0, highestBreak: 5, framesWon: 0 },
    ];

    syncPlayersFromProfiles(state, [
      { ...p1, name: 'Uno', avatar: '⭐' },
      p2,
    ]);

    expect(state.players[0].name).toBe('Uno');
    expect(state.players[0].avatar).toBe('⭐');
    expect(state.players[0].frameScore).toBe(42);
    expect(state.players[1].frameScore).toBe(7);
  });
});
