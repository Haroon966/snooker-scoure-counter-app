const AVATAR_COLORS = [
  '#2563eb', '#16a34a', '#db2777', '#ea580c',
  '#7c3aed', '#0891b2', '#ca8a04', '#be123c',
];

export function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name) {
  const parts = (name || '?').trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (name || '?').slice(0, 2).toUpperCase();
}

export function isEmojiAvatar(avatar) {
  return avatar && !avatar.startsWith('data:');
}

/**
 * @param {{ name: string, avatar?: string | null }} player
 * @param {'sm' | 'md' | 'lg'} size
 */
export function avatarHtml(player, size = 'md') {
  const name = player?.name ?? 'Player';
  const avatar = player?.avatar;
  const cls = `avatar avatar-${size}`;

  if (avatar?.startsWith('data:')) {
    return `<div class="${cls}"><img src="${avatar}" alt="" /></div>`;
  }

  if (avatar && isEmojiAvatar(avatar)) {
    return `<div class="${cls} avatar-emoji"><span>${avatar}</span></div>`;
  }

  const bg = avatarColor(name);
  const initials = getInitials(name);
  return `<div class="${cls} avatar-initials" style="background:${bg}"><span>${initials}</span></div>`;
}
