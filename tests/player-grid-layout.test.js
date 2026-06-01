import { describe, expect, it } from 'vitest';
import {
  getGridSlotCount,
  getPlayerGridLayout,
  shouldAddGridFiller,
} from '../src/utils/player-grid-layout.js';

describe('getGridSlotCount', () => {
  it('pads odd counts above one', () => {
    expect(getGridSlotCount(1)).toBe(1);
    expect(getGridSlotCount(2)).toBe(2);
    expect(getGridSlotCount(3)).toBe(4);
    expect(getGridSlotCount(5)).toBe(6);
    expect(getGridSlotCount(7)).toBe(8);
  });

  it('flags when a filler tile is needed', () => {
    expect(shouldAddGridFiller(1)).toBe(false);
    expect(shouldAddGridFiller(2)).toBe(false);
    expect(shouldAddGridFiller(3)).toBe(true);
    expect(shouldAddGridFiller(5)).toBe(true);
  });
});

describe('getPlayerGridLayout', () => {
  it('handles 1–2 players with orientation', () => {
    expect(getPlayerGridLayout(1)).toEqual({ cols: 1, rows: 1 });
    expect(getPlayerGridLayout(2, { orientation: 'portrait' })).toEqual({
      cols: 1,
      rows: 2,
    });
    expect(getPlayerGridLayout(2, { orientation: 'landscape' })).toEqual({
      cols: 2,
      rows: 1,
    });
  });

  it('uses 2×2 for three players via four slots', () => {
    expect(getPlayerGridLayout(getGridSlotCount(3), { orientation: 'portrait' })).toEqual({
      cols: 2,
      rows: 2,
    });
  });

  it('fills even counts without waste', () => {
    expect(getPlayerGridLayout(4)).toEqual({ cols: 2, rows: 2 });
    expect(getPlayerGridLayout(6, { orientation: 'portrait' })).toEqual({
      cols: 2,
      rows: 3,
    });
    expect(getPlayerGridLayout(6, { orientation: 'landscape' })).toEqual({
      cols: 3,
      rows: 2,
    });
  });

  it('uses wider grid in landscape for five players via six slots', () => {
    expect(getPlayerGridLayout(getGridSlotCount(5), { orientation: 'portrait' })).toEqual({
      cols: 2,
      rows: 3,
    });
    expect(getPlayerGridLayout(getGridSlotCount(5), { orientation: 'landscape' })).toEqual({
      cols: 3,
      rows: 2,
    });
  });

  it('avoids a single column for many players', () => {
    expect(getPlayerGridLayout(getGridSlotCount(7), { orientation: 'portrait' }).cols).toBeGreaterThan(
      1
    );
    expect(getPlayerGridLayout(9, { orientation: 'portrait' })).toEqual({
      cols: 3,
      rows: 3,
    });
  });
});
