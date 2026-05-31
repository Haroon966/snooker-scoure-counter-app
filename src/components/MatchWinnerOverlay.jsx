import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
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

export default function MatchWinnerOverlay({ state, preset, message, onGoHome }) {
  const { tokens } = useAppTheme();
  const isTie = Boolean(state.game?.tie);
  const winners = getWinnerPlayers(state, preset);
  const losers = getLoserPlayers(state);
  const isTournament = state.tournament?.status === 'complete';
  const multiOutcome = losers.length > 0 && winners.length > 0;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
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
        padding={2}
        sx={{
          width: '100%',
          maxWidth: 360,
          textAlign: 'center',
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
            mb: 1.5,
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
          <EmojiEventsOutlinedIcon sx={{ fontSize: 64, color: tokens.color.gold.main }} />
        </Box>

        <Typography
          variant="overline"
          sx={{ color: tokens.color.gold.main, letterSpacing: '0.16em', fontWeight: 700 }}
        >
          {isTie ? 'Match tied' : multiOutcome ? 'Winners' : isTournament ? 'Champion' : 'Winner'}
        </Typography>

        {!isTie && winners.length > 0 && (
          <Stack spacing={1.5} sx={{ alignItems: 'center', my: 2 }}>
            {winners.map((player) => (
              <Stack key={player.name} spacing={1} sx={{ alignItems: 'center' }}>
                <PlayerAvatar player={player} size="xl" ring />
                <Typography
                  variant="h5"
                  fontWeight={700}
                  sx={{ fontFamily: tokens.font.heading, letterSpacing: '-0.02em', color: tokens.color.baize.light }}
                >
                  {player.name}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}

        {!isTie && losers.length > 0 && (
          <Box
            sx={{
              mb: 2,
              p: 1.25,
              borderRadius: `${tokens.radius.md}px`,
              bgcolor: alpha(tokens.color.status.error, 0.1),
              border: `1px solid ${alpha(tokens.color.status.error, 0.35)}`,
            }}
          >
            <Typography
              variant="overline"
              sx={{ color: tokens.color.status.error, letterSpacing: '0.12em', fontWeight: 700 }}
            >
              Lost
            </Typography>
            <Stack spacing={1} sx={{ alignItems: 'center', mt: 1 }}>
              {losers.map((player) => (
                <Stack key={player.name} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <PlayerAvatar player={player} size="sm" />
                  <Typography variant="body1" fontWeight={700} sx={{ color: tokens.color.status.error }}>
                    {player.name}
                  </Typography>
                  <TrendingDownOutlinedIcon sx={{ fontSize: 18, color: tokens.color.status.error }} />
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.5 }}>
          {message}
        </Typography>

        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={<HomeOutlinedIcon />}
          onClick={onGoHome}
          sx={{ minHeight: 48, borderRadius: `${tokens.radius.lg}px` }}
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
