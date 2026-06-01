import { BALL_LABELS } from '../rules/snooker.js';
import { getBallPoints } from '../rules/game-presets.js';
import { BALL_COLORS } from '../theme/designTokens.js';

/** Max scoring events kept per player for the current frame. */
export const CALL_HISTORY_CAP = 24;

export function createCallEntry(type, { ballValue, points } = {}) {
  if (type === 'foul') {
    const pts = Math.abs(Number(points) || 0);
    return { type: 'foul', points: pts };
  }
  const ball = Number(ballValue);
  const pts = Number(points) || 0;
  return { type: 'ball', ball, points: pts };
}

export function getCallPoints(entry, preset) {
  if (!entry) return 0;
  if (entry.type === 'foul') return Math.abs(entry.points ?? 0);
  return entry.points || getBallPoints(preset, entry.ball) || 0;
}

/** Full label for tooltips / screen readers */
export function formatCallLabel(entry, preset) {
  if (!entry || entry.type === 'foul') {
    const pts = getCallPoints(entry, preset);
    return pts > 0 ? `Foul −${pts}` : 'Foul';
  }
  const pts = getCallPoints(entry, preset);
  const name = BALL_LABELS[entry.ball] ?? 'Score';
  return `${name} +${pts}`;
}

export function getCallChipStyle(entry) {
  if (!entry || entry.type === 'foul') {
    return {
      bg: 'rgba(251, 113, 133, 0.22)',
      color: '#FECDD3',
      border: '1px solid rgba(251, 113, 133, 0.45)',
    };
  }
  const bg = BALL_COLORS[entry.ball] ?? '#4B5563';
  const color = entry.ball === 2 ? '#1A1A1A' : '#FFFFFF';
  const border =
    entry.ball === 7
      ? '1px solid rgba(255, 255, 255, 0.28)'
      : '1px solid rgba(255, 255, 255, 0.12)';
  return { bg, color, border };
}

export function pushPlayerCall(player, entry) {
  if (!player) return;
  if (!Array.isArray(player.callHistory)) player.callHistory = [];
  player.callHistory.push(entry);
  if (player.callHistory.length > CALL_HISTORY_CAP) {
    player.callHistory.shift();
  }
}

export function clearPlayerCallHistory(player) {
  if (player) player.callHistory = [];
}
