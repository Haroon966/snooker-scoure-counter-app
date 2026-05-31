import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useAppTheme } from '../../hooks/useAppTheme.js';

export default function WizardFooter({ backLabel, nextLabel, canNext, onBack, onNext, isReview }) {
  const { sx } = useAppTheme();

  return (
    <Stack direction="row" spacing={1.25} sx={sx.wizardFooter}>
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
