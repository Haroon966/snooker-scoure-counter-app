import Box from '@mui/material/Box';
import { useAppTheme } from '../../hooks/useAppTheme.js';

export default function GlassPanel({
  children,
  active = false,
  onClick,
  sx = {},
  padding = 1.25,
  ...props
}) {
  const { tokens, sx: appSx } = useAppTheme();

  return (
    <Box
      onClick={onClick}
      sx={{
        ...appSx.glassPanel(active),
        p: padding,
        cursor: onClick ? 'pointer' : 'default',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
