import Box from '@mui/material/Box';
import { useAppTheme } from '../../hooks/useAppTheme.js';

export default function PageShell({ children, maxWidth = 720, noBottomPad = false }) {
  const { sx } = useAppTheme();

  return (
    <Box
      sx={{
        ...sx.page,
        maxWidth,
        ...(noBottomPad ? { pb: { xs: 2, sm: 2.5 } } : {}),
      }}
    >
      {children}
    </Box>
  );
}
