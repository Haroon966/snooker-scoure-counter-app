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
  const interactive = Boolean(onClick);

  return (
    <Box
      onClick={onClick}
      sx={{
        ...appSx.glassPanel(active),
        p: padding,
        cursor: interactive ? 'pointer' : 'default',
        ...(interactive && {
          '&:hover': {
            borderColor: active ? tokens.color.baize.light : tokens.color.border.focus,
          },
          '&:focus-visible': {
            outline: `2px solid ${tokens.color.border.focus}`,
            outlineOffset: 2,
          },
        }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
