import Box from '@mui/material/Box';
import { useAppTheme } from '../../hooks/useAppTheme.js';

export default function PageShell({ children, maxWidth = 720, noBottomPad = false }) {
  const { sx } = useAppTheme();

  return (
    <Box
      sx={{
        ...sx.page,
        maxWidth,
        pt: 'max(16px, env(safe-area-inset-top))',
        ...(noBottomPad
          ? { pb: { xs: 2, sm: 2.5 } }
          : { pb: 'calc(24px + env(safe-area-inset-bottom))' }),
      }}
    >
      {children}
    </Box>
  );
}
