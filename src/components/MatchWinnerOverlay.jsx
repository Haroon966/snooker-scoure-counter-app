import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { alpha } from '@mui/material/styles';
import PlayerAvatar from './PlayerAvatar.jsx';
import GlassPanel from './ui/GlassPanel.jsx';
import { useAppTheme } from '../hooks/useAppTheme.js';
import { isRaceMode, isTimedMode } from '../rules/game-presets.js';

function getWinnerPlayers(state, preset) {
  if (state.tournament?.status === 'complete' && state.tournament.championIdx != null) {
    const champion = state.tournament.roster[state.tournament.championIdx];
    return champion ? [champion] : [];
  }

  const indices = state.game?.winnerIndices ?? [];
  if (indices.length > 0) {
    return indices.map((i) => state.players[i]).filter(Boolean);
  }

  if ((isTimedMode(preset) || isRaceMode(preset)) && state.match?.status === 'complete') {
    const max = Math.max(...state.players.map((p) => p.frameScore), 0);
    return state.players.filter((p) => p.frameScore === max);
  }

  return [];
}

function getLoserPlayers(state) {
  const indices = state.game?.loserIndices ?? [];
  if (!indices.length) return [];
  return indices.map((i) => state.players[i]).filter(Boolean);
}

const SAFE_TOP = 'env(safe-area-inset-top, 0px)';
const SAFE_BOTTOM = 'env(safe-area-inset-bottom, 0px)';
const SAFE_X = 'env(safe-area-inset-left, 0px)';
const SAFE_X_R = 'env(safe-area-inset-right, 0px)';

function OutcomePlayerRow({ player, tone, compact, tokens }) {
  const isWin = tone === 'win';
  const accent = isWin ? tokens.color.baize.light : tokens.color.status.error;
  const Icon = isWin ? EmojiEventsOutlinedIcon : TrendingDownOutlinedIcon;

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: 'center',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        py: compact ? 0.375 : 0.5,
        px: compact ? 0.75 : 1,
        borderRadius: `${tokens.radius.md}px`,
        bgcolor: isWin
          ? alpha(tokens.color.baize.main, 0.1)
          : alpha(tokens.color.status.error, 0.08),
        border: `1px solid ${alpha(accent, 0.35)}`,
      }}
    >
      <PlayerAvatar player={player} size={compact ? 'sm' : 'md'} ring={isWin} />
      <Typography
        fontWeight={700}
        noWrap
        sx={{
          flex: 1,
          minWidth: 0,
          textAlign: 'left',
          color: accent,
          fontSize: compact ? '0.9rem' : '1rem',
        }}
      >
        {player.name}
      </Typography>
      <Icon sx={{ fontSize: compact ? 16 : 18, color: accent, flexShrink: 0 }} />
    </Stack>
  );
}

export default function MatchWinnerOverlay({ state, preset, message, onGoHome }) {
  const { tokens } = useAppTheme();
  const compact = useMediaQuery('(max-width: 600px)');
  const isTie = Boolean(state.game?.tie);
  const winners = getWinnerPlayers(state, preset);
  const losers = getLoserPlayers(state);
  const isTournament = state.tournament?.status === 'complete';
  const multiOutcome = losers.length > 0 && winners.length > 0;
  const manyPlayers = winners.length + losers.length > 3;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        display: 'flex',
        alignItems: compact ? 'flex-start' : 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        pt: `calc(${compact ? 12 : 16}px + ${SAFE_TOP})`,
        pb: `calc(${compact ? 12 : 16}px + ${SAFE_BOTTOM})`,
        pl: `calc(${compact ? 12 : 16}px + ${SAFE_X})`,
        pr: `calc(${compact ? 12 : 16}px + ${SAFE_X_R})`,
        bgcolor: alpha(tokens.color.bg.default, 0.82),
        backdropFilter: 'blur(10px)',
        animation: 'winnerFadeIn 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        '@keyframes winnerFadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
    >
      <GlassPanel
        padding={compact ? 1.5 : 2}
        sx={{
          width: '100%',
          maxWidth: 400,
          my: compact ? 0 : 'auto',
          textAlign: 'center',
          flexShrink: 0,
          animation: 'winnerPop 500ms cubic-bezier(0.22, 1, 0.36, 1)',
          '@keyframes winnerPop': {
            '0%': { opacity: 0, transform: 'scale(0.88) translateY(24px)' },
            '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
          },
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            mb: compact ? 1 : 1.5,
            animation: 'trophyGlow 1.8s ease-in-out infinite',
            '@keyframes trophyGlow': {
              '0%, 100%': {
                filter: `drop-shadow(0 0 10px ${alpha(tokens.color.gold.main, 0.45)})`,
                transform: 'scale(1)',
              },
              '50%': {
                filter: `drop-shadow(0 0 24px ${alpha(tokens.color.gold.main, 0.95)})`,
                transform: 'scale(1.1)',
              },
            },
          }}
        >
          <EmojiEventsOutlinedIcon
            sx={{ fontSize: compact ? 48 : 64, color: tokens.color.gold.main }}
          />
        </Box>

        <Typography
          variant="overline"
          sx={{
            color: tokens.color.gold.main,
            letterSpacing: compact ? '0.12em' : '0.16em',
            fontWeight: 700,
            fontSize: compact ? '0.65rem' : undefined,
          }}
        >
          {isTie ? 'Match tied' : multiOutcome ? 'Winners' : isTournament ? 'Champion' : 'Winner'}
        </Typography>

        {!isTie && winners.length > 0 && (
          <Stack
            spacing={1}
            sx={{
              alignItems: 'stretch',
              my: compact ? 1.25 : 2,
              width: '100%',
            }}
          >
            {winners.length === 1 && !manyPlayers ? (
              <Stack spacing={1} sx={{ alignItems: 'center' }}>
                <PlayerAvatar player={winners[0]} size={compact ? 'lg' : 'xl'} ring />
                <Typography
                  variant={compact ? 'h6' : 'h5'}
                  fontWeight={700}
                  noWrap
                  sx={{
                    fontFamily: tokens.font.heading,
                    letterSpacing: '-0.02em',
                    color: tokens.color.baize.light,
                    maxWidth: '100%',
                    px: 0.5,
                  }}
                >
                  {winners[0].name}
                </Typography>
              </Stack>
            ) : (
              winners.map((player) => (
                <OutcomePlayerRow
                  key={player.name}
                  player={player}
                  tone="win"
                  compact={compact}
                  tokens={tokens}
                />
              ))
            )}
          </Stack>
        )}

        {!isTie && losers.length > 0 && (
          <Box
            sx={{
              mb: compact ? 1.25 : 2,
              p: compact ? 1 : 1.25,
              borderRadius: `${tokens.radius.md}px`,
              bgcolor: alpha(tokens.color.status.error, 0.1),
              border: `1px solid ${alpha(tokens.color.status.error, 0.35)}`,
              textAlign: 'left',
            }}
          >
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                textAlign: 'center',
                color: tokens.color.status.error,
                letterSpacing: '0.12em',
                fontWeight: 700,
                fontSize: compact ? '0.65rem' : undefined,
              }}
            >
              Lost
            </Typography>
            <Stack spacing={0.75} sx={{ mt: 1, width: '100%' }}>
              {losers.map((player) => (
                <OutcomePlayerRow
                  key={player.name}
                  player={player}
                  tone="lose"
                  compact={compact}
                  tokens={tokens}
                />
              ))}
            </Stack>
          </Box>
        )}

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: compact ? 1.5 : 2.5,
            lineHeight: 1.5,
            fontSize: compact ? '0.8125rem' : undefined,
            wordBreak: 'break-word',
          }}
        >
          {message}
        </Typography>

        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={<HomeOutlinedIcon />}
          onClick={onGoHome}
          sx={{
            minHeight: 48,
            borderRadius: `${tokens.radius.lg}px`,
            fontSize: compact ? '0.9375rem' : undefined,
          }}
        >
          Go home
        </Button>
      </GlassPanel>
    </Box>
  );
}

export function isMatchFinished(state) {
  if (state.tournament?.status === 'complete') return true;
  return state.match?.status === 'complete';
}
