import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { useAppTheme } from '../../hooks/useAppTheme.js';

const LOGO_SRC = `${import.meta.env.BASE_URL}logo.jpg`;

export default function AppBrand({ subtitle = null, size = 'md' }) {
  const { tokens } = useAppTheme();
  const isLg = size === 'lg';

  return (
    <Stack spacing={0.75}>
      <Box
        component="img"
        src={LOGO_SRC}
        alt="Snooker Score"
        sx={{
          height: isLg ? 56 : 48,
          width: 'auto',
          maxWidth: isLg ? 220 : 200,
          display: 'block',
          objectFit: 'contain',
        }}
      />
      {subtitle ? (
        <Typography
          variant="body2"
          sx={{
            color: tokens.color.text.secondary,
            fontSize: '0.8125rem',
            pl: 0.25,
          }}
        >
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  );
}
