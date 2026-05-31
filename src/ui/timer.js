import { isTimedMode } from '../rules/game-presets.js';
import { getActivePreset, endTimedMatch } from '../state/match-state.js';

export function getGameStartedAt(state) {
  return state.game?.startedAt ?? state.game?.timerStartedAt ?? null;
}

export function getRemainingMs(state) {
  const startedAt = getGameStartedAt(state);
  if (!startedAt || !state.game?.timerDurationMs) {
    return 0;
  }
  const elapsed = Date.now() - startedAt;
  return Math.max(0, state.game.timerDurationMs - elapsed);
}

export function getElapsedMs(state) {
  const startedAt = getGameStartedAt(state);
  if (!startedAt) return 0;
  return Date.now() - startedAt;
}

export function getTimerDisplayMs(state) {
  if (state.game?.timerDurationMs) return getRemainingMs(state);
  return getElapsedMs(state);
}

export function formatTimer(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatGameStartTime(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isTimerExpired(state) {
  if (!state.game?.timerDurationMs || !getGameStartedAt(state)) return false;
  return getRemainingMs(state) <= 0;
}

let intervalId = null;

export function startTimerTick(state, onTick) {
  stopTimerTick();
  const preset = getActivePreset(state);
  if (!isTimedMode(preset) || state.screen !== 'game') return;

  intervalId = setInterval(() => {
    if (isTimerExpired(state) && state.game.status === 'in_progress') {
      endTimedMatch(state);
      stopTimerTick();
    }
    onTick();
  }, 1000);
}

export function stopTimerTick() {
  if (intervalId != null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
