import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import { BALL_LABELS } from '../../rules/snooker.js';
import { getBallPoints } from '../../rules/game-presets.js';
import { BALL_COLORS } from '../../theme/muiTheme.js';

const PILL_HEIGHT = 48;

function getBallButtonStyle(value) {
  const bg = BALL_COLORS[value] ?? '#666666';
  const color = value === 2 ? '#1A1A1A' : '#FFFFFF';
  const border =
    value === 7 ? '2px solid rgba(255, 255, 255, 0.28)' : '2px solid rgba(255, 255, 255, 0.12)';
  return { bg, color, border };
}

const pillButtonSx = (bg, color, border) => ({
  width: '100%',
  minHeight: PILL_HEIGHT,
  height: PILL_HEIGHT,
  color,
  borderRadius: 9999,
  border,
  bgcolor: bg,
  background: bg,
  backgroundImage: 'none',
  boxShadow: `0 4px 14px ${alpha(bg, 0.55)}, inset 0 -2px 4px ${alpha('#000', 0.18)}`,
  transition: 'filter 150ms, transform 150ms, box-shadow 150ms',
  flexDirection: 'row',
  gap: 0.75,
  px: 1.5,
  py: 0,
  fontSize: 10,
  cursor: 'pointer',
  '&.Mui-disabled': {
    bgcolor: bg,
    background: bg,
    backgroundImage: 'none',
    color,
    opacity: 0.45,
  },
  '&:hover': {
    bgcolor: bg,
    background: bg,
    backgroundImage: 'none',
    filter: 'brightness(1.08)',
    boxShadow: `0 6px 18px ${alpha(bg, 0.6)}, inset 0 -2px 4px ${alpha('#000', 0.18)}`,
  },
  '&:active:not(:disabled)': { transform: 'scale(0.98)' },
});

export function BallButton({ value, preset, onClick, disabled }) {
  const label = BALL_LABELS[value];
  const pts = getBallPoints(preset, value);
  const { bg, color, border } = getBallButtonStyle(value);

  return (
    <Button
      variant="contained"
      disableElevation
      disabled={disabled}
      onClick={() => onClick(value)}
      aria-label={`${label}, ${pts} points`}
      sx={pillButtonSx(bg, color, border)}
    >
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontWeight: 800, lineHeight: 1 }}>{label}</span>
        <Typography component="span" variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem', lineHeight: 1, fontWeight: 700 }}>
          +{pts}
        </Typography>
      </Stack>
    </Button>
  );
}

function FoulBallButton({ disabled, onClick }) {
  const bg = '#F5F3EF';
  const color = '#1A1A1A';
  const border = '2px solid rgba(0, 0, 0, 0.12)';

  return (
    <Button
      variant="contained"
      disableElevation
      disabled={disabled}
      onClick={onClick}
      aria-label="Foul"
      sx={pillButtonSx(bg, color, border)}
    >
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontWeight: 800, lineHeight: 1 }}>Foul</span>
        <Typography component="span" variant="caption" sx={{ opacity: 0.85, fontSize: '0.7rem', lineHeight: 1 }}>
          pick pts
        </Typography>
      </Stack>
    </Button>
  );
}

export default function ScoringPad({ ballValues, preset, playable, activePlayerName, onScore, onFoul }) {
  return (
    <Box>
      {activePlayerName && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'center', display: 'block', mb: 1 }}
        >
          Scoring for {activePlayerName}
        </Typography>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1,
          width: '100%',
        }}
      >
        {ballValues.map((v) => (
          <BallButton key={v} value={v} preset={preset} disabled={!playable} onClick={onScore} />
        ))}
        <FoulBallButton disabled={!playable} onClick={onFoul} />
      </Box>
    </Box>
  );
}
