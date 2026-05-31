import { createTheme, alpha } from '@mui/material/styles';
import { getTokens, BALL_COLORS } from './designTokens.js';

export { BALL_COLORS };

export function createSx(tokens) {
  const { color, radius, shadow, font } = tokens;

  const glassPanel = (active = false) => ({
    bgcolor: color.glass.bg,
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    border: `1px solid ${active ? color.baize.light : color.glass.border}`,
    borderRadius: `${radius.lg}px`,
    boxShadow: active ? `${shadow.glow}, ${shadow.inner}` : `${shadow.sm}, ${shadow.inner}`,
    transition: 'border-color 250ms, box-shadow 250ms, transform 250ms',
  });

  return {
    page: {
      maxWidth: 680,
      mx: 'auto',
      px: { xs: 1.5, sm: 2 },
      py: { xs: 1.25, sm: 1.5 },
      pb: { xs: 8, sm: 2 },
    },
    glassPanel,
    glassCard: glassPanel(false),
    selectCard: (selected) => ({
      ...glassPanel(selected),
      cursor: 'pointer',
      '&:hover': {
        borderColor: selected ? color.baize.light : alpha(color.baize.light, 0.45),
        transform: 'translateY(-1px)',
        boxShadow: selected ? shadow.glow : shadow.md,
      },
    }),
    scoreDisplay: {
      fontFamily: font.heading,
      fontWeight: 700,
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '-0.04em',
      lineHeight: 0.95,
    },
    wizardFooter: {
      position: 'fixed',
      bottom: 8,
      left: 8,
      right: 8,
      maxWidth: 680,
      mx: 'auto',
      p: 1,
      borderRadius: `${radius.xl}px`,
      bgcolor: color.glass.bg,
      backdropFilter: 'blur(24px) saturate(180%)',
      border: `1px solid ${color.glass.border}`,
      boxShadow: shadow.lg,
      zIndex: 10,
    },
    sectionTitle: {
      fontFamily: font.heading,
      fontWeight: 700,
      fontSize: '1.5rem',
      letterSpacing: '-0.025em',
      mb: 0.75,
    },
    sectionSubtitle: {
      color: color.text.secondary,
      fontSize: '0.9375rem',
      lineHeight: 1.5,
      mb: 1.5,
    },
    labelCaps: {
      color: color.gold.main,
      fontSize: '0.6875rem',
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
    },
    goldAccent: {
      color: color.gold.main,
    },
  };
}

export function createAppTheme(mode = 'dark') {
  const tokens = getTokens(mode);
  const { color, radius, shadow, font } = tokens;
  const appSx = createSx(tokens);
  const isDark = mode === 'dark';

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: color.baize.light,
        dark: color.baize.main,
        light: '#3DA882',
        contrastText: isDark ? color.text.primary : '#FFFFFF',
      },
      secondary: {
        main: color.gold.main,
        light: color.gold.light,
        contrastText: isDark ? color.bg.default : '#1A1F1C',
      },
      success: {
        main: color.status.success,
        contrastText: isDark ? color.bg.default : '#FFFFFF',
      },
      error: {
        main: color.status.error,
      },
      info: {
        main: color.status.info,
      },
      background: {
        default: color.bg.default,
        paper: color.bg.paper,
      },
      text: {
        primary: color.text.primary,
        secondary: color.text.secondary,
      },
      divider: color.border.default,
    },
    shape: { borderRadius: radius.md },
    typography: {
      fontFamily: font.body,
      h1: { fontFamily: font.heading, fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontFamily: font.heading, fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontFamily: font.heading, fontWeight: 600, letterSpacing: '-0.01em' },
      h4: { fontFamily: font.heading, fontWeight: 600, letterSpacing: '-0.01em' },
      h5: { fontFamily: font.heading, fontWeight: 600 },
      h6: { fontFamily: font.heading, fontWeight: 600 },
      subtitle1: { fontWeight: 600 },
      subtitle2: {
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        fontSize: '0.7rem',
      },
      button: { fontWeight: 600, letterSpacing: '0.01em' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: color.bg.default,
            backgroundImage: isDark
              ? `
              radial-gradient(ellipse 100% 80% at 50% -30%, ${alpha(color.baize.light, 0.14)}, transparent 55%),
              radial-gradient(ellipse 50% 40% at 100% 0%, ${alpha(color.gold.main, 0.07)}, transparent),
              radial-gradient(ellipse 40% 30% at 0% 100%, ${alpha(color.baize.main, 0.1)}, transparent)
            `
              : `
              radial-gradient(ellipse 100% 60% at 50% -10%, ${alpha(color.baize.light, 0.1)}, transparent),
              radial-gradient(ellipse 50% 40% at 100% 100%, ${alpha(color.gold.main, 0.08)}, transparent)
            `,
            minHeight: '100dvh',
            touchAction: 'manipulation',
          },
          '*': {
            '@media (prefers-reduced-motion: reduce)': {
              animationDuration: '0.01ms !important',
              animationIterationCount: '1 !important',
              transitionDuration: '0.01ms !important',
            },
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: radius.md,
            minHeight: 44,
            transition: 'background-color 200ms, border-color 200ms, color 200ms, box-shadow 200ms',
          },
          contained: {
            background: `linear-gradient(135deg, ${color.baize.light} 0%, ${color.baize.main} 100%)`,
            boxShadow: shadow.glow,
            '&:hover': {
              background: `linear-gradient(135deg, ${color.baize.light} 0%, ${color.baize.dark} 100%)`,
              boxShadow: shadow.glow,
            },
          },
          containedSecondary: {
            background: `linear-gradient(135deg, ${color.gold.light} 0%, ${color.gold.main} 100%)`,
            color: isDark ? color.bg.default : '#1A1F1C',
            '&:hover': {
              background: `linear-gradient(135deg, #E0CC8E 0%, ${color.gold.light} 100%)`,
            },
          },
          outlined: {
            borderColor: color.border.default,
            '&:hover': {
              borderColor: color.gold.main,
              backgroundColor: color.gold.muted,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: color.bg.paper,
            borderRadius: radius.lg,
            border: `1px solid ${color.border.default}`,
            boxShadow: shadow.sm,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: color.bg.paper,
            borderRadius: radius.lg,
          },
          outlined: {
            borderColor: color.border.default,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: radius.sm,
            fontWeight: 500,
          },
          filled: {
            backgroundColor: color.bg.elevated,
          },
          outlined: {
            borderColor: color.border.default,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: radius.md,
              backgroundColor: color.bg.elevated,
              '& fieldset': { borderColor: color.border.default },
              '&:hover fieldset': { borderColor: alpha(color.gold.main, 0.4) },
              '&.Mui-focused fieldset': { borderColor: color.baize.light },
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: color.glass.bg,
            backdropFilter: 'blur(24px)',
            borderRadius: radius.xl,
            border: `1px solid ${color.glass.border}`,
            boxShadow: shadow.lg,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { padding: '10px 12px 4px' },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { padding: '6px 12px' },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: { padding: '6px 12px 10px' },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: alpha(color.bg.paper, 0.85),
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${color.border.default}`,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: radius.md },
          standardSuccess: {
            backgroundColor: alpha(color.status.success, 0.12),
            color: color.status.success,
          },
          standardInfo: {
            backgroundColor: alpha(color.status.info, 0.12),
            color: color.status.info,
          },
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            '& .MuiSnackbarContent-root': {
              backgroundColor: color.bg.elevated,
              border: `1px solid ${color.border.default}`,
              borderRadius: radius.md,
              boxShadow: shadow.md,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: radius.md,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'background-color 200ms, color 200ms',
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': {
              color: color.baize.light,
              '& + .MuiSwitch-track': {
                backgroundColor: color.baize.main,
                opacity: 0.8,
              },
            },
          },
        },
      },
    },
  });

  theme.appTokens = tokens;
  theme.appSx = appSx;
  return theme;
}

/** @deprecated Use createAppTheme(mode) */
export const muiTheme = createAppTheme('dark');

/** @deprecated Use theme.appSx via useAppTheme() */
export const sx = createSx(getTokens('dark'));
