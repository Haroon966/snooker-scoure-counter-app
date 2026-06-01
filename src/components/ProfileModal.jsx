import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import { alpha } from '@mui/material/styles';
import { AVATAR_EMOJIS, readImageAsAvatar } from '../storage/profiles.js';
import PlayerAvatar from './PlayerAvatar.jsx';
import { useAppTheme } from '../hooks/useAppTheme.js';

export default function ProfileModal({ open, mode, profile, onClose, onSave, onDelete }) {
  const { tokens, sx } = useAppTheme();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(profile?.name ?? '');
    setAvatar(profile?.avatar ?? null);
    setUploadError('');
    setUploading(false);
  }, [open, profile?.id, profile?.name, profile?.avatar]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ mode, profileId: profile?.id, name: trimmed, avatar });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      setAvatar(await readImageAsAvatar(file));
    } catch {
      setUploadError('Could not load that image — try another file.');
    } finally {
      setUploading(false);
    }
  };

  const hasPhoto = typeof avatar === 'string' && avatar.startsWith('data:');

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" disableRestoreFocus>
      <DialogTitle sx={{ fontFamily: tokens.font.heading, fontWeight: 700, pb: 1 }}>
        {mode === 'edit' ? 'Edit player' : 'New player'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
          <PlayerAvatar player={{ name: name || 'Player', avatar }} size="xl" ring />
          <TextField
            fullWidth
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 20 } }}
            autoFocus={open}
          />
          <Box sx={{ width: '100%' }}>
            <Typography sx={{ ...sx.labelCaps, mb: 1.5 }}>Avatar</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {AVATAR_EMOJIS.map((emoji) => (
                <IconButton
                  key={emoji}
                  onClick={() => {
                    setAvatar(emoji);
                    setUploadError('');
                  }}
                  aria-label={`Avatar ${emoji}`}
                  aria-pressed={avatar === emoji}
                  sx={{
                    fontSize: 26,
                    width: 48,
                    height: 48,
                    borderRadius: `${tokens.radius.md}px`,
                    border: `2px solid ${avatar === emoji ? tokens.color.baize.light : 'transparent'}`,
                    bgcolor: avatar === emoji ? alpha(tokens.color.baize.main, 0.2) : tokens.color.bg.elevated,
                    transition: 'all 250ms',
                  }}
                >
                  {emoji}
                </IconButton>
              ))}
            </Box>
          </Box>
          <Button
            variant={hasPhoto ? 'contained' : 'outlined'}
            component="label"
            size="small"
            disabled={uploading}
            startIcon={<PhotoCameraOutlinedIcon />}
            sx={{ minHeight: 44, borderRadius: `${tokens.radius.md}px` }}
          >
            {uploading ? 'Processing…' : hasPhoto ? 'Change photo' : 'Upload photo'}
            <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
          </Button>
          {uploadError && (
            <Typography variant="caption" color="error" sx={{ textAlign: 'center' }}>
              {uploadError}
            </Typography>
          )}
          {hasPhoto && (
            <Button
              size="small"
              color="inherit"
              onClick={() => setAvatar(null)}
              sx={{ color: 'text.secondary', minHeight: 36 }}
            >
              Remove photo
            </Button>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1, pb: 'env(safe-area-inset-bottom)' }}>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} fullWidth variant="outlined" sx={{ minHeight: 48, borderRadius: `${tokens.radius.md}px` }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            fullWidth
            variant="contained"
            disabled={!name.trim() || uploading}
            sx={{ minHeight: 48, borderRadius: `${tokens.radius.md}px` }}
          >
            Save
          </Button>
        </Stack>
        {mode === 'edit' && (
          <Button
            color="error"
            onClick={() => {
              const profileId = profile?.id;
              onClose();
              requestAnimationFrame(() => onDelete(profileId));
            }}
            sx={{ minHeight: 44 }}
          >
            Delete player
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
