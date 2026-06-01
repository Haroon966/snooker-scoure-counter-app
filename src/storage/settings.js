const STORAGE_KEY = 'snookerScore.settings';

export const DEFAULT_PRICE_PER_HOUR = 500;

const DEFAULTS = {
  themeMode: 'dark',
  pricePerHour: DEFAULT_PRICE_PER_HOUR,
  hapticFeedback: true,
  keepScreenAwake: true,
  longPressUndo: false,
  installBannerDismissed: false,
};

export function normalizePricePerHour(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_PRICE_PER_HOUR;
  return Math.round(n);
}

function normalizeBool(value, fallback) {
  if (value === true || value === false) return value;
  return fallback;
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      themeMode: parsed.themeMode === 'light' ? 'light' : 'dark',
      pricePerHour: normalizePricePerHour(parsed.pricePerHour ?? DEFAULT_PRICE_PER_HOUR),
      hapticFeedback: normalizeBool(parsed.hapticFeedback, DEFAULTS.hapticFeedback),
      keepScreenAwake: normalizeBool(parsed.keepScreenAwake, DEFAULTS.keepScreenAwake),
      longPressUndo: normalizeBool(parsed.longPressUndo, DEFAULTS.longPressUndo),
      installBannerDismissed: normalizeBool(
        parsed.installBannerDismissed,
        DEFAULTS.installBannerDismissed
      ),
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
        hapticFeedback: next.hapticFeedback !== false,
        keepScreenAwake: next.keepScreenAwake !== false,
        longPressUndo: next.longPressUndo === true,
        installBannerDismissed: next.installBannerDismissed === true,
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
