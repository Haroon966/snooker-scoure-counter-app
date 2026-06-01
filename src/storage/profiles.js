const PROFILES_KEY = 'snookerProfiles.v1';
const LEGACY_ROSTER_KEY = 'snookerPlayers.v1';

export function createProfile(name, avatar = null) {
  return {
    id: generateId(),
    name: name.trim(),
    avatar,
  };
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function migrateLegacyRoster() {
  try {
    const raw = localStorage.getItem(LEGACY_ROSTER_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .filter((n) => typeof n === 'string' && n.trim())
      .map((n) => createProfile(n));
  } catch {
    return [];
  }
}

export function loadProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list.filter((p) => p?.id && p?.name);
      }
    }
    const migrated = migrateLegacyRoster();
    if (migrated.length > 0) {
      saveProfiles(migrated);
    }
    return migrated;
  } catch {
    return [];
  }
}

export function saveProfiles(profiles) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles.slice(0, 30)));
  } catch {
    /* storage full — ignore */
  }
}

export function addProfile(profiles, name, avatar = null) {
  const trimmed = (name || '').trim();
  if (!trimmed) return null;
  if (profiles.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
    return null;
  }
  const profile = createProfile(trimmed, avatar);
  profiles.push(profile);
  saveProfiles(profiles);
  return profile;
}

/**
 * @returns {{ ok: true } | { ok: false, reason: 'not_found' | 'duplicate' | 'empty_name' }}
 */
export function updateProfile(profiles, id, updates) {
  const i = profiles.findIndex((p) => p.id === id);
  if (i < 0) return { ok: false, reason: 'not_found' };

  if (updates.name != null) {
    const trimmed = String(updates.name).trim();
    if (!trimmed) return { ok: false, reason: 'empty_name' };
    const duplicate = profiles.some(
      (p) => p.id !== id && p.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) return { ok: false, reason: 'duplicate' };
    profiles[i].name = trimmed;
  }

  if ('avatar' in updates) {
    profiles[i].avatar = updates.avatar ?? null;
  }

  saveProfiles(profiles);
  return { ok: true };
}

export function deleteProfile(profiles, id) {
  const i = profiles.findIndex((p) => p.id === id);
  if (i < 0) return false;
  profiles.splice(i, 1);
  saveProfiles(profiles);
  return true;
}

export function getProfileById(profiles, id) {
  return profiles.find((p) => p.id === id);
}

/** Resize image for localStorage (max ~128px) */
export function readImageAsAvatar(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('Not an image'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 128;
        let { width, height } = img;
        if (width > max || height > max) {
          const scale = max / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const AVATAR_EMOJIS = ['🎱', '🎯', '🏆', '⭐', '🔥', '👤', '🟢', '🔵', '🟡', '🔴'];
