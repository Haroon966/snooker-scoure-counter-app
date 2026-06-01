import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import { alpha } from '@mui/material/styles';
import PlayerAvatar from '../PlayerAvatar.jsx';
import { useAppTheme } from '../../hooks/useAppTheme.js';

const MAX_BUBBLES = 5;

function PlayerBubbleStrip({ players, tokens }) {
  const visible = players.slice(0, MAX_BUBBLES);
  const overflow = players.length - visible.length;

  return (
    <Stack
      direction="row"
      aria-hidden
      sx={{
        alignItems: 'center',
        px: 0.75,
        py: 0.5,
        borderRadius: 999,
        bgcolor: alpha(tokens.color.bg.elevated, 0.95),
        border: `1px solid ${alpha(tokens.color.gold.main, 0.35)}`,
        boxShadow: `${tokens.shadow.md}, 0 0 20px ${alpha(tokens.color.baize.main, 0.15)}`,
        backdropFilter: 'blur(12px)',
        '& .player-bubble': {
          boxShadow: `0 0 0 2px ${tokens.color.bg.default}`,
        },
        '& .player-bubble + .player-bubble': {
          ml: '-8px',
        },
      }}
    >
      {visible.map((p) => (
        <Box key={p.id} className="player-bubble" sx={{ borderRadius: '50%', lineHeight: 0 }}>
          <PlayerAvatar player={p} size="xs" />
        </Box>
      ))}
      {overflow > 0 && (
        <Box
          className="player-bubble"
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            ml: '-8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: tokens.color.baize.main,
            boxShadow: `0 0 0 2px ${tokens.color.bg.default}`,
            fontSize: '0.6rem',
            fontWeight: 800,
            color: '#fff',
            fontFamily: tokens.font.mono,
          }}
        >
          +{overflow}
        </Box>
      )}
    </Stack>
  );
}

export default function HomeActionBar({
  selectedPlayers,
  canContinue,
  canResume,
  onContinue,
  onResume,
}) {
  const { tokens, sx } = useAppTheme();
  const count = selectedPlayers.length;
  const showBubbles = count > 0;

  return (
    <Box
      component="nav"
      aria-label="Match actions"
      sx={{
        flexShrink: 0,
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        overflow: 'visible',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          top: -20,
          height: 20,
          background: `linear-gradient(to bottom, transparent, ${tokens.color.bg.default})`,
          pointerEvents: 'none',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          overflow: 'visible',
          pt: showBubbles ? 2.75 : 1.25,
          pb: 'max(12px, env(safe-area-inset-bottom))',
          px: { xs: 1.5, sm: 2 },
        }}
      >
        {showBubbles && (
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: 4,
              transform: 'translateX(-50%)',
              zIndex: 3,
              pointerEvents: 'none',
            }}
          >
            <PlayerBubbleStrip players={selectedPlayers} tokens={tokens} />
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 1,
            p: 1,
            borderRadius: `${tokens.radius.xl}px`,
            bgcolor: tokens.color.glass.bg,
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: `1px solid ${tokens.color.glass.border}`,
            boxShadow: `${tokens.shadow.lg}, inset 0 1px 0 ${alpha('#fff', 0.06)}`,
          }}
        >
          <Button
            fullWidth
            disabled={!canContinue}
            onClick={onContinue}
            sx={{
              flex: 1,
              minHeight: 56,
              px: 1.75,
              py: 1.25,
              justifyContent: 'space-between',
              textAlign: 'left',
              borderRadius: `${tokens.radius.lg}px`,
              textTransform: 'none',
              color: '#fff',
              bgcolor: canContinue ? tokens.color.baize.main : alpha(tokens.color.bg.elevated, 0.8),
              background: canContinue
                ? `linear-gradient(135deg, ${tokens.color.baize.light} 0%, ${tokens.color.baize.main} 55%, ${tokens.color.baize.dark} 100%)`
                : alpha(tokens.color.bg.elevated, 0.8),
              border: canContinue
                ? `1px solid ${alpha(tokens.color.baize.light, 0.5)}`
                : `1px solid ${tokens.color.border.default}`,
              boxShadow: canContinue ? tokens.shadow.glow : 'none',
              transition: 'transform 150ms, box-shadow 150ms, filter 150ms',
              '&:hover': {
                bgcolor: canContinue ? tokens.color.baize.light : undefined,
                background: canContinue
                  ? `linear-gradient(135deg, ${tokens.color.baize.light} 0%, ${tokens.color.baize.main} 100%)`
                  : undefined,
                filter: canContinue ? 'brightness(1.05)' : undefined,
              },
              '&:active:not(:disabled)': { transform: 'scale(0.98)' },
              '&.Mui-disabled': {
                color: tokens.color.text.muted,
                border: `1px solid ${tokens.color.border.default}`,
              },
            }}
          >
            <Stack spacing={0.25} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
              <Typography
                sx={{
                  ...sx.labelCaps,
                  fontSize: '0.625rem',
                  color: canContinue ? alpha(tokens.color.gold.main, 0.95) : tokens.color.text.muted,
                  lineHeight: 1.2,
                }}
              >
                {canContinue ? `${count} players ready` : 'Select players'}
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontFamily: tokens.font.heading,
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                }}
              >
                {canContinue ? 'Next' : 'Pick 2+'}
              </Typography>
            </Stack>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha('#000', canContinue ? 0.15 : 0.08),
                border: `1px solid ${alpha('#fff', canContinue ? 0.2 : 0.08)}`,
              }}
            >
              <ArrowForwardIcon sx={{ fontSize: 20 }} />
            </Box>
          </Button>

          {canResume && (
            <IconButton
              onClick={onResume}
              aria-label="Resume saved match"
              sx={{
                flexShrink: 0,
                alignSelf: 'center',
                width: 56,
                height: 56,
                borderRadius: `${tokens.radius.lg}px`,
                color: tokens.color.gold.main,
                bgcolor: alpha(tokens.color.gold.main, 0.08),
                border: `1px solid ${alpha(tokens.color.gold.main, 0.45)}`,
                boxShadow: `inset 0 1px 0 ${alpha('#fff', 0.08)}`,
                transition: 'all 200ms',
                '&:hover': {
                  bgcolor: alpha(tokens.color.gold.main, 0.16),
                  borderColor: tokens.color.gold.main,
                  boxShadow: tokens.shadow.gold,
                },
              }}
            >
              <ReplayOutlinedIcon sx={{ fontSize: 26 }} />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
}
