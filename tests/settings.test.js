import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSettings,
  saveSettings,
  DEFAULT_PRICE_PER_HOUR,
  normalizePricePerHour,
} from '../src/storage/settings.js';
import { calculateSessionCost, formatPkr } from '../src/utils/billing.js';

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

describe('settings', () => {
  beforeEach(() => {
    mockLocalStorage();
    localStorage.clear();
  });

  it('defaults price per hour to 500 PKR', () => {
    expect(loadSettings().pricePerHour).toBe(DEFAULT_PRICE_PER_HOUR);
  });

  it('defaults mobile UX preferences', () => {
    const s = loadSettings();
    expect(s.hapticFeedback).toBe(true);
    expect(s.keepScreenAwake).toBe(true);
    expect(s.longPressUndo).toBe(false);
    expect(s.installBannerDismissed).toBe(false);
  });

  it('persists price per hour without overwriting theme', () => {
    saveSettings({ themeMode: 'light', pricePerHour: 750 });
    expect(loadSettings()).toMatchObject({ themeMode: 'light', pricePerHour: 750 });
  });

  it('persists mobile UX toggles', () => {
    saveSettings({
      hapticFeedback: false,
      keepScreenAwake: false,
      longPressUndo: true,
      installBannerDismissed: true,
    });
    expect(loadSettings()).toMatchObject({
      hapticFeedback: false,
      keepScreenAwake: false,
      longPressUndo: true,
      installBannerDismissed: true,
    });
  });

  it('normalizes invalid price values', () => {
    expect(normalizePricePerHour('abc')).toBe(DEFAULT_PRICE_PER_HOUR);
    expect(normalizePricePerHour(-10)).toBe(DEFAULT_PRICE_PER_HOUR);
    expect(normalizePricePerHour(650.7)).toBe(651);
  });
});

describe('billing', () => {
  it('calculates hourly session cost', () => {
    expect(calculateSessionCost(500, 30 * 60 * 1000)).toBe(250);
    expect(calculateSessionCost(500, 60 * 60 * 1000)).toBe(500);
  });

  it('formats PKR amounts', () => {
    expect(formatPkr(500)).toBe('Rs 500');
    expect(formatPkr(1250)).toBe('Rs 1,250');
  });
});
