const STORAGE_KEY = 'snookerScore.settings';

export const DEFAULT_PRICE_PER_HOUR = 500;

const DEFAULTS = {
  themeMode: 'dark',
  pricePerHour: DEFAULT_PRICE_PER_HOUR,
};

export function normalizePricePerHour(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_PRICE_PER_HOUR;
  return Math.round(n);
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      themeMode: parsed.themeMode === 'light' ? 'light' : 'dark',
      pricePerHour: normalizePricePerHour(parsed.pricePerHour ?? DEFAULT_PRICE_PER_HOUR),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(partial) {
  try {
    const next = { ...loadSettings(), ...partial };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        themeMode: next.themeMode === 'light' ? 'light' : 'dark',
        pricePerHour: normalizePricePerHour(next.pricePerHour),
      })
    );
  } catch {
    /* ignore quota errors */
  }
}

export function saveThemeMode(themeMode) {
  saveSettings({ themeMode: themeMode === 'light' ? 'light' : 'dark' });
}

export function savePricePerHour(pricePerHour) {
  saveSettings({ pricePerHour: normalizePricePerHour(pricePerHour) });
}
