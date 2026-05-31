import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';
import { useAppTheme } from '../hooks/useAppTheme.js';

const SIZES = { sm: 36, md: 52, lg: 72, xl: 96 };

function avatarColor(name, colors) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name) {
  const parts = (name || '?').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name || '?').slice(0, 2).toUpperCase();
}

export default function PlayerAvatar({ player, size = 'md', ring = false }) {
  const { tokens } = useAppTheme();
  const name = player?.name ?? 'Player';
  const avatar = player?.avatar;
  const px = SIZES[size] ?? SIZES.md;

  const avatarColors = [
    tokens.color.baize.main,
    tokens.color.baize.light,
    '#6366F1',
    tokens.color.gold.main,
    '#0EA5E9',
    '#F97316',
  ];

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
