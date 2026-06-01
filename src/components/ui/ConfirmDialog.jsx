import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useAppTheme } from '../../hooks/useAppTheme.js';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  const { tokens } = useAppTheme();

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs" disableRestoreFocus>
      <DialogTitle sx={{ fontFamily: tokens.font.heading }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1, px: 2, pb: `calc(16px + env(safe-area-inset-bottom))` }}>
        <Button
          variant="contained"
          color={destructive ? 'error' : 'primary'}
          fullWidth
          autoFocus
          onClick={onConfirm}
          sx={{ minHeight: 48 }}
        >
          {confirmLabel}
        </Button>
        <Button variant="outlined" fullWidth onClick={onCancel} sx={{ minHeight: 48 }}>
          {cancelLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
