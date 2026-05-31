import { useTheme } from '@mui/material/styles';

export function useAppTheme() {
  const theme = useTheme();
  return {
    mode: theme.palette.mode,
    tokens: theme.appTokens,
    sx: theme.appSx,
  };
}
