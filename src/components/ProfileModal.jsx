import { useState } from 'react';
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
import { AVATAR_EMOJIS } from '../storage/profiles.js';
import PlayerAvatar from './PlayerAvatar.jsx';
import { useAppTheme } from '../hooks/useAppTheme.js';
import { blurActiveElement } from '../utils/dialogFocus.js';

export default function ProfileModal({ open, mode, profile, onClose, onSave, onDelete }) {
  const { tokens, sx } = useAppTheme();
  const [name, setName] = useState(profile?.name ?? '');
  const [avatar, setAvatar] = useState(profile?.avatar ?? null);

  const handleEnter = () => {
    setName(profile?.name ?? '');
    setAvatar(profile?.avatar ?? null);
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ mode, profileId: profile?.id, name: trimmed, avatar });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" disableRestoreFocus TransitionProps={{ onEnter: handleEnter }}>
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
            autoFocus
          />
          <Box sx={{ width: '100%' }}>
            <Typography sx={{ ...sx.labelCaps, mb: 1.5 }}>Avatar</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {AVATAR_EMOJIS.map((emoji) => (
                <IconButton
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  sx={{
                    fontSize: 26,
                    width: 48,
                    height: 48,
                    cursor: 'pointer',
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
            variant="outlined"
            component="label"
            size="small"
            startIcon={<PhotoCameraOutlinedIcon />}
            sx={{ minHeight: 44, borderRadius: `${tokens.radius.md}px` }}
          >
            Upload photo
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setAvatar(reader.result);
                reader.readAsDataURL(file);
              }}
            />
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} fullWidth variant="outlined" sx={{ borderRadius: `${tokens.radius.md}px` }}>
            Cancel
          </Button>
          <Button onClick={handleSave} fullWidth variant="contained" sx={{ borderRadius: `${tokens.radius.md}px` }}>
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
          >
            Delete player
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
