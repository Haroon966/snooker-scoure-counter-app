import { describe, it, expect } from 'vitest';
import {
  pointsLeftOnTable,
  snookersRequired,
  snookerStatus,
  framesToWin,
  COLORS_TOTAL,
  RED_BLACK_MAX,
} from '../src/rules/snooker.js';

describe('pointsLeftOnTable', () => {
  it('returns 147 at frame start', () => {
    expect(pointsLeftOnTable({ redsPotted: 0, colorsPhase: false })).toBe(147);
  });

  it('decreases by 8 per red potted in reds phase', () => {
    expect(pointsLeftOnTable({ redsPotted: 1, colorsPhase: false })).toBe(139);
    expect(pointsLeftOnTable({ redsPotted: 15, colorsPhase: false })).toBe(27);
  });

  it('uses colors points in colors phase', () => {
    expect(
      pointsLeftOnTable({
        redsPotted: 15,
        colorsPhase: true,
        colorsPointsLeft: 10,
      })
    ).toBe(10);
  });
});

describe('snookersRequired', () => {
  it('returns 0 when ahead or level', () => {
    expect(snookersRequired(50, 40, 100)).toBe(0);
    expect(snookersRequired(40, 40, 100)).toBe(0);
  });

  it('returns 0 when deficit can be cleared from table', () => {
    expect(snookersRequired(30, 50, 27)).toBe(0);
  });

  it('returns snookers when deficit exceeds points left', () => {
    expect(snookersRequired(0, 50, 27)).toBe(1);
    expect(snookersRequired(0, 80, 27)).toBe(2);
  });
});

describe('snookerStatus', () => {
  it('describes clear-table win', () => {
    expect(snookerStatus(40, 50, 27)).toMatch(/clear table wins/i);
  });

  it('describes snookers needed', () => {
    expect(snookerStatus(0, 60, 27)).toMatch(/snooker/i);
  });
});

describe('framesToWin', () => {
  it('calculates frames to win', () => {
    expect(framesToWin(1)).toBe(1);
    expect(framesToWin(3)).toBe(2);
    expect(framesToWin(7)).toBe(4);
  });
});

describe('constants', () => {
  it('has expected ball totals', () => {
    expect(RED_BLACK_MAX).toBe(8);
    expect(COLORS_TOTAL).toBe(27);
  });
});
