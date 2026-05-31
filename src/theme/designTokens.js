/** Emerald Glass — liquid glass snooker score design system */

const shared = {
  baize: {
    main: '#047857',
    light: '#10B981',
    dark: '#065F46',
  },
  gold: {
    main: '#D4AF37',
    light: '#E8CC7A',
  },
  status: {
    success: '#34D399',
    error: '#FB7185',
    info: '#38BDF8',
  },
  radius: { sm: 10, md: 14, lg: 20, xl: 28, full: 9999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64 },
  font: {
    heading: '"Sora", system-ui, sans-serif',
    body: '"DM Sans", system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: '400ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
};

const darkTokens = {
  ...shared,
  color: {
    bg: {
      default: '#030504',
      paper: '#0C1210',
      elevated: '#141A17',
      subtle: '#1A221E',
    },
    baize: {
      ...shared.baize,
      glow: 'rgba(16, 185, 129, 0.35)',
    },
    gold: {
      ...shared.gold,
      muted: 'rgba(212, 175, 55, 0.12)',
    },
    text: {
      primary: '#F4F7F5',
      secondary: '#94A399',
      muted: '#5C6B63',
    },
    border: {
      default: 'rgba(255, 255, 255, 0.08)',
      focus: 'rgba(16, 185, 129, 0.55)',
      active: '#10B981',
    },
    glass: {
      bg: 'rgba(12, 18, 16, 0.72)',
      border: 'rgba(255, 255, 255, 0.1)',
    },
    status: shared.status,
  },
  shadow: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.45)',
    md: '0 8px 32px rgba(0, 0, 0, 0.5)',
    lg: '0 16px 48px rgba(0, 0, 0, 0.6)',
    glow: '0 0 40px rgba(16, 185, 129, 0.18)',
    gold: '0 0 32px rgba(212, 175, 55, 0.12)',
    inner: 'inset 0 1px 0 rgba(255,255,255,0.06)',
  },
};

const lightTokens = {
  ...shared,
  color: {
    bg: {
      default: '#F7F9F8',
      paper: '#FFFFFF',
      elevated: '#EEF2F0',
      subtle: '#E4EBE8',
    },
    baize: {
      ...shared.baize,
      glow: 'rgba(4, 120, 87, 0.2)',
    },
    gold: {
      ...shared.gold,
      muted: 'rgba(212, 175, 55, 0.18)',
    },
    text: {
      primary: '#0F1714',
      secondary: '#4B5C55',
      muted: '#7A8B83',
    },
    border: {
      default: 'rgba(4, 120, 87, 0.12)',
      focus: 'rgba(16, 185, 129, 0.45)',
      active: '#059669',
    },
    glass: {
      bg: 'rgba(255, 255, 255, 0.82)',
      border: 'rgba(4, 120, 87, 0.1)',
    },
    status: shared.status,
  },
  shadow: {
    sm: '0 2px 8px rgba(15, 23, 20, 0.06)',
    md: '0 8px 32px rgba(15, 23, 20, 0.08)',
    lg: '0 16px 48px rgba(15, 23, 20, 0.12)',
    glow: '0 0 32px rgba(16, 185, 129, 0.15)',
    gold: '0 0 24px rgba(212, 175, 55, 0.15)',
    inner: 'inset 0 1px 0 rgba(255,255,255,0.8)',
  },
};

export const tokens = darkTokens;

export function getTokens(mode = 'dark') {
  return mode === 'light' ? lightTokens : darkTokens;
}

export const BALL_COLORS = {
  1: '#DC2626',
  2: '#FACC15',
  3: '#16A34A',
  4: '#92400E',
  5: '#2563EB',
  6: '#EC4899',
  7: '#171717',
  10: '#7C3AED',
};

export const THEME_META_COLORS = {
  dark: darkTokens.color.bg.default,
  light: lightTokens.color.bg.default,
};
