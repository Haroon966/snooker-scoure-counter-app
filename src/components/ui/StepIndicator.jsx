import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import { useAppTheme } from '../../hooks/useAppTheme.js';

export default function StepIndicator({ activeStep, labels }) {
  const { tokens } = useAppTheme();
  const progress = labels.length > 1 ? ((activeStep + 1) / labels.length) * 100 : 100;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          mb: 1,
        }}
      >
        <Typography sx={{ fontFamily: tokens.font.heading, fontWeight: 700, fontSize: '0.8125rem' }}>
          Step {activeStep + 1} of {labels.length}
        </Typography>
        <Typography variant="caption" sx={{ color: tokens.color.gold.main, fontWeight: 600 }}>
          {labels[activeStep]}
        </Typography>
      </Box>
      <Box
        sx={{
          height: 6,
          borderRadius: radiusFull(tokens.radius.full),
          bgcolor: alpha(tokens.color.baize.main, 0.15),
          overflow: 'hidden',
          border: `1px solid ${tokens.color.border.default}`,
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${progress}%`,
            borderRadius: radiusFull(tokens.radius.full),
            background: `linear-gradient(90deg, ${tokens.color.baize.main}, ${tokens.color.baize.light})`,
            boxShadow: tokens.shadow.glow,
            transition: 'width 400ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
        {labels.map((label, i) => (
          <Typography
            key={label}
            variant="caption"
            sx={{
              fontSize: '0.625rem',
              fontWeight: i === activeStep ? 700 : 400,
              color: i <= activeStep ? tokens.color.text.secondary : tokens.color.text.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

function radiusFull(v) {
  return `${v}px`;
}
