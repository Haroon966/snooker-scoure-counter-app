import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import { useAppTheme } from '../hooks/useAppTheme.js';

const SIZES = { xs: 24, sm: 36, md: 52, lg: 72, xl: 96 };

function avatarColor(name, colors) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function getInitials(name) {
  const parts = (name || '?').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name || '?').slice(0, 2).toUpperCase();
}

function getAvatarColors(tokens) {
  return [
    tokens.color.baize.main,
    tokens.color.baize.light,
    '#6366F1',
    tokens.color.gold.main,
    '#0EA5E9',
    '#F97316',
  ];
}

/** Full-bleed decorative backdrop for score cards (photo, emoji, or initials). */
export function PlayerCardBackdrop({ player, isActive, tokens }) {
  const name = player?.name ?? 'Player';
  const avatar = player?.avatar;
  const avatarColors = getAvatarColors(tokens);
  const tint = avatarColor(name, avatarColors);
  const photoOpacity = isActive ? 0.58 : 0.48;
  const scrim = alpha(tokens.color.bg.default, isActive ? 0.28 : 0.36);

  if (avatar?.startsWith('data:')) {
    return (
      <>
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${avatar})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: photoOpacity,
          }}
        />
        <Box aria-hidden sx={{ position: 'absolute', inset: 0, bgcolor: scrim }} />
      </>
    );
  }

  if (avatar && !avatar.startsWith('data:')) {
    return (
      <>
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: { xs: '4rem', sm: '5rem' },
            lineHeight: 1,
            opacity: isActive ? 0.38 : 0.3,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {avatar}
        </Box>
        <Box aria-hidden sx={{ position: 'absolute', inset: 0, bgcolor: scrim }} />
      </>
    );
  }

  return (
    <>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: { xs: '4.5rem', sm: '5.5rem' },
          fontWeight: 800,
          fontFamily: tokens.font.heading,
          color: alpha(tint, isActive ? 0.4 : 0.28),
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {getInitials(name)}
      </Box>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(160deg, ${alpha(tint, 0.18)} 0%, ${alpha(tokens.color.bg.default, 0.55)} 70%)`,
        }}
      />
    </>
  );
}

export default function PlayerAvatar({ player, size = 'md', ring = false }) {
  const { tokens } = useAppTheme();
  const name = player?.name ?? 'Player';
  const avatar = player?.avatar;
  const px = SIZES[size] ?? SIZES.md;

  const avatarColors = getAvatarColors(tokens);

  const sharedSx = {
    width: px,
    height: px,
    border: ring
      ? `3px solid ${tokens.color.gold.main}`
      : `2px solid ${alpha(tokens.color.baize.light, 0.35)}`,
    boxShadow: ring ? tokens.shadow.gold : tokens.shadow.sm,
  };

  if (avatar?.startsWith('data:')) {
    return <Avatar src={avatar} alt="" sx={sharedSx} />;
  }

  if (avatar && !avatar.startsWith('data:')) {
    return (
      <Avatar sx={{ ...sharedSx, fontSize: px * 0.42, bgcolor: tokens.color.bg.elevated }}>
        {avatar}
      </Avatar>
    );
  }

  return (
    <Avatar
      sx={{
        ...sharedSx,
        bgcolor: avatarColor(name, avatarColors),
        fontSize: px * 0.34,
        fontFamily: tokens.font.heading,
        fontWeight: 700,
        background: `linear-gradient(135deg, ${avatarColor(name, avatarColors)} 0%, ${alpha(avatarColor(name, avatarColors), 0.7)} 100%)`,
      }}
    >
      {getInitials(name)}
    </Avatar>
  );
}
