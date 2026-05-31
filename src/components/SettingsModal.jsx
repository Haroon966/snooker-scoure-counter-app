import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Link from '@mui/material/Link';
import CloseIcon from '@mui/icons-material/Close';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import TextField from '@mui/material/TextField';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import GlassPanel from './ui/GlassPanel.jsx';
import { useState } from 'react';
import { useAppTheme } from '../hooks/useAppTheme.js';
import { blurActiveElement } from '../utils/dialogFocus.js';

const DEVELOPER = {
  name: 'Haroon Ali',
  handle: 'Haroon966',
  url: 'https://github.com/Haroon966',
  avatar: 'https://github.com/Haroon966.png?size=192',
  avatarLarge: 'https://github.com/Haroon966.png?size=460',
};

export default function SettingsModal({
  open,
  onClose,
  themeMode,
  onThemeModeChange,
  pricePerHour,
  onPricePerHourChange,
}) {
  const { tokens, sx } = useAppTheme();
  const isDark = themeMode === 'dark';
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);

  const handleClose = () => {
    setAvatarPreviewOpen(false);
    onClose();
  };

  const openAvatarPreview = () => {
    blurActiveElement();
    setAvatarPreviewOpen(true);
  };

  return (
    <>
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle
        sx={{
          fontFamily: tokens.font.heading,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        Settings
        <IconButton aria-label="Close settings" onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography sx={{ ...sx.labelCaps, mb: 1.5 }}>Appearance</Typography>
        <GlassPanel padding={1.25} sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              {isDark ? (
                <DarkModeOutlinedIcon sx={{ color: tokens.color.baize.light }} />
              ) : (
                <LightModeOutlinedIcon sx={{ color: tokens.color.gold.main }} />
              )}
              <Box>
                <Typography variant="body2" fontWeight={700}>
                  Dark mode
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isDark ? 'Emerald Glass dark' : 'Emerald Glass light'}
                </Typography>
              </Box>
            </Stack>
            <Switch
              checked={isDark}
              onChange={(e) => onThemeModeChange(e.target.checked ? 'dark' : 'light')}
              slotProps={{ input: { 'aria-label': 'Toggle dark mode' } }}
            />
          </Stack>
        </GlassPanel>

        <Divider sx={{ mb: 1.5, borderColor: tokens.color.border.default }} />

        <Typography sx={{ ...sx.labelCaps, mb: 1.5 }}>Pricing</Typography>
        <GlassPanel padding={1.25} sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
            <AttachMoneyOutlinedIcon sx={{ color: tokens.color.gold.main, mt: 0.75 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                Price per hour
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
                Used to estimate table cost during timed games
              </Typography>
              <TextField
                type="number"
                size="small"
                fullWidth
                label="PKR per hour"
                value={pricePerHour}
                onChange={(e) => onPricePerHourChange(e.target.value)}
                slotProps={{ htmlInput: { min: 0, step: 50 } }}
              />
            </Box>
          </Stack>
        </GlassPanel>

        <Divider sx={{ mb: 1.5, borderColor: tokens.color.border.default }} />

        <Typography sx={{ ...sx.labelCaps, mb: 1 }}>Credits</Typography>
        <GlassPanel padding={1.5}>
          <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
            <IconButton
              onClick={openAvatarPreview}
              aria-label={`View ${DEVELOPER.name} photo`}
              sx={{
                p: 0,
                cursor: 'pointer',
                borderRadius: '50%',
                '&:hover .MuiAvatar-root': {
                  filter: 'brightness(1.05)',
                },
              }}
            >
              <Avatar
                src={DEVELOPER.avatar}
                alt={DEVELOPER.name}
                sx={{
                  width: 112,
                  height: 112,
                  border: `3px solid ${tokens.color.gold.main}`,
                  boxShadow: tokens.shadow.gold,
                  transition: 'filter 200ms',
                }}
              />
            </IconButton>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ fontFamily: tokens.font.heading, color: 'text.primary', letterSpacing: '-0.02em' }}
              >
                {DEVELOPER.name}
              </Typography>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', justifyContent: 'center', mt: 0.75 }}>
                <GitHubIcon sx={{ fontSize: 18, color: tokens.color.baize.light }} />
                <Link
                  href={DEVELOPER.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: tokens.color.baize.light,
                    cursor: 'pointer',
                  }}
                >
                  @{DEVELOPER.handle}
                </Link>
              </Stack>
            </Box>
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} {DEVELOPER.name}
            </Typography>
          </Stack>
        </GlassPanel>
      </DialogContent>
    </Dialog>

    <Dialog
      open={avatarPreviewOpen}
      onClose={() => setAvatarPreviewOpen(false)}
      maxWidth="xs"
      fullWidth
      disableRestoreFocus
      slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.85)' } } }}
    >
      <DialogContent
        sx={{
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          position: 'relative',
        }}
      >
        <IconButton
          aria-label="Close photo"
          onClick={() => setAvatarPreviewOpen(false)}
          autoFocus
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'text.secondary',
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box
          component="img"
          src={DEVELOPER.avatarLarge}
          alt={DEVELOPER.name}
          sx={{
            width: '100%',
            maxWidth: 320,
            aspectRatio: '1',
            objectFit: 'cover',
            borderRadius: `${tokens.radius.lg}px`,
            border: `3px solid ${tokens.color.gold.main}`,
            boxShadow: tokens.shadow.lg,
          }}
        />
        <Typography variant="h6" fontWeight={700} sx={{ fontFamily: tokens.font.heading }}>
          {DEVELOPER.name}
        </Typography>
      </DialogContent>
    </Dialog>
    </>
  );
}
