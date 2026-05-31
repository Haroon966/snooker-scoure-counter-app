import { isTimedMode } from '../rules/game-presets.js';
import { getActivePreset, endTimedMatch } from '../state/match-state.js';

export function getRemainingMs(state) {
  if (!state.game?.timerStartedAt || !state.game?.timerDurationMs) {
    return 0;
  }
  const elapsed = Date.now() - state.game.timerStartedAt;
  return Math.max(0, state.game.timerDurationMs - elapsed);
}

export function formatTimer(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function isTimerExpired(state) {
  return getRemainingMs(state) <= 0 && state.game?.timerStartedAt != null;
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
