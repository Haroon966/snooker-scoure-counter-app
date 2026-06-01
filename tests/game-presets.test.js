import { describe, it, expect } from 'vitest';
import {
  getPreset,
  getBallPoints,
  getMaxReds,
  getFoulOptions,
  getAvailableModes,
  isRaceMode,
  isTimedMode,
  isSnookerTableMode,
} from '../src/rules/game-presets.js';
import { pointsLeftOnTable } from '../src/rules/snooker.js';

describe('game presets', () => {
  it('timed mode scores red as 10', () => {
    const preset = getPreset('timed');
    expect(getBallPoints(preset, 1)).toBe(10);
    expect(getBallPoints(preset, 7)).toBe(7);
  });

  it('ball6 has max 6 reds', () => {
    expect(getMaxReds(getPreset('ball6'))).toBe(6);
    expect(pointsLeftOnTable({ redsPotted: 0, colorsPhase: false }, 6)).toBe(
      6 * 8 + 27
    );
  });

  it('timed has foul 10 and up to 7 players', () => {
    const preset = getPreset('timed');
    expect(getFoulOptions(preset)).toContain(10);
    expect(preset.maxPlayers).toBe(7);
  });

  it('non-timed modes do not have foul 10', () => {
    for (const id of ['ball15', 'ball6', 'race']) {
      expect(getFoulOptions(getPreset(id))).not.toContain(10);
    }
  });

  it('team mode shows all game types with 3+ roster players', () => {
    const modes = getAvailableModes({
      teamMode: true,
      selectedProfileIds: ['a', 'b', 'c', 'd'],
      multiPlayerFormat: null,
    });
    expect(modes.map((m) => m.id).sort()).toEqual(
      ['ball1', 'ball10', 'ball15', 'ball6', 'race', 'timed'].sort()
    );
  });

  it('classifies modes', () => {
    expect(isRaceMode(getPreset('race'))).toBe(true);
    expect(isTimedMode(getPreset('timed'))).toBe(true);
    expect(isSnookerTableMode(getPreset('ball15'))).toBe(true);
    expect(isSnookerTableMode(getPreset('race'))).toBe(false);
  });
});
