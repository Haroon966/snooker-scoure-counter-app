import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useAppTheme } from '../../hooks/useAppTheme.js';

export default function WizardFooter({
  backLabel,
  nextLabel,
  canNext,
  onBack,
  onNext,
  isReview,
  sticky = false,
}) {
  const { tokens, sx } = useAppTheme();

  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={
        sticky
          ? {
              width: '100%',
              p: 1,
              borderRadius: `${tokens.radius.xl}px`,
              bgcolor: tokens.color.glass.bg,
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              border: `1px solid ${tokens.color.glass.border}`,
              boxShadow: tokens.shadow.lg,
            }
          : sx.wizardFooter
      }
    >
      <Button variant="outlined" fullWidth onClick={onBack} sx={{ minHeight: 44, borderRadius: '14px' }}>
        {backLabel}
      </Button>
      <Button
        variant="contained"
        fullWidth
        disabled={!canNext}
        onClick={onNext}
        color={isReview ? 'secondary' : 'primary'}
        sx={{ minHeight: 44, borderRadius: '14px', fontSize: '0.9375rem' }}
      >
        {nextLabel}
      </Button>
    </Stack>
  );
}
