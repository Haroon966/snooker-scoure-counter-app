import '../styles/app.css';
import { loadState, saveState } from './storage/persist.js';
import {
  loadProfiles,
  addProfile,
  updateProfile,
  deleteProfile,
  getProfileById,
  readImageAsAvatar,
} from './storage/profiles.js';
import * as Match from './state/match-state.js';
import {
  render,
  buildGameHtml,
  mountGamePlayers,
  formatShareText,
  haptic,
} from './ui/render.js';
import {
  buildHomeShellHtml,
  renderHome,
  openProfileModal,
  closeProfileModal,
  getProfileModalDraft,
  setProfileModalAvatar,
  updateProfileModalPreview,
} from './ui/home.js';
import { initTheme } from './ui/theme.js';
import { startTimerTick, stopTimerTick } from './ui/timer.js';

const app = document.getElementById('app');
let state = loadState();
let toastTimer = null;

function showToast(message) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast hidden';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 4000);
}

function persist() {
  const result = saveState(state);
  if (!result.ok) showToast(result.error ?? 'Could not save progress');
}

function refreshGame() {
  render(state);
  persist();
}

function refreshHome() {
  const profiles = loadProfiles();
  Match.syncPlayerNamesFromSelection(state.setup, profiles);
  renderHome(state);
  persist();
}

function mountHome() {
  stopTimerTick();
  app.innerHTML = buildHomeShellHtml();
  refreshHome();
}

function mountGame() {
  app.innerHTML = buildGameHtml();
  mountGamePlayers(state);
  refreshGame();
  startTimerTick(state, refreshGame);
}

function renderApp() {
  if (state.screen === 'game') {
    mountGame();
  } else {
    mountHome();
  }
}

function saveProfileFromModal() {
  const draft = getProfileModalDraft();
  const trimmed = draft.name.trim();
  if (!trimmed) return;

  const profiles = loadProfiles();

  if (draft.mode === 'edit' && draft.profileId) {
    updateProfile(profiles, draft.profileId, {
      name: trimmed,
      avatar: draft.avatar,
    });
  } else {
    const created = addProfile(profiles, trimmed, draft.avatar);
    if (created) {
      state.setup.selectedProfileIds.push(created.id);
    } else {
      showToast('A player with that name already exists');
      return;
    }
  }

  closeProfileModal();
  refreshHome();
}

async function shareScore() {
  const text = formatShareText(state);
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Snooker Score', text });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast('Score copied to clipboard');
  } catch {
    prompt('Copy score:', text);
  }
}

function onDocumentClick(e) {
  if (state.screen === 'home') {
    handleHomeClick(e);
  } else {
    handleGameClick(e);
  }
}

function handleHomeClick(e) {
  if (e.target.closest('#profile-modal') && !e.target.closest('.profile-modal-sheet')) {
    closeProfileModal();
    return;
  }

  const btn = e.target.closest(
    '[data-action], #continue-match, #resume-match, #wizard-next, #wizard-back, #start-match, #add-profile-card, #profile-modal-cancel, #profile-modal-save, #profile-modal-delete'
  );
  if (!btn) return;

  if (btn.id === 'continue-match') {
    if (state.setup.selectedProfileIds.length >= 2) {
      Match.setSetupStep(state, 1);
      refreshHome();
    }
    return;
  }

  if (btn.id === 'resume-match') {
    Match.resumeMatch(state);
    renderApp();
    return;
  }

  if (btn.id === 'wizard-back') {
    if (state.setup.step === 1) {
      Match.setSetupStep(state, 0);
    } else {
      Match.setSetupStep(state, state.setup.step - 1);
    }
    refreshHome();
    return;
  }

  if (btn.id === 'wizard-next') {
    if (Match.canAdvanceFromStep(state.setup)) {
      if (state.setup.step === 1) Match.clampPlayersForMode(state.setup);
      Match.setSetupStep(state, state.setup.step + 1);
      refreshHome();
    }
    return;
  }

  if (btn.id === 'start-match') {
    Match.startMatch(state, loadProfiles());
    renderApp();
    return;
  }

  if (btn.id === 'add-profile-card') {
    openProfileModal('add');
    return;
  }

  if (btn.id === 'profile-modal-cancel') {
    closeProfileModal();
    return;
  }

  if (btn.id === 'profile-modal-save') {
    saveProfileFromModal();
    return;
  }

  if (btn.id === 'profile-modal-delete') {
    const draft = getProfileModalDraft();
    const profiles = loadProfiles();
    if (draft.profileId && confirm('Delete this player?')) {
      deleteProfile(profiles, draft.profileId);
      state.setup.selectedProfileIds = state.setup.selectedProfileIds.filter(
        (id) => id !== draft.profileId
      );
      closeProfileModal();
      refreshHome();
    }
    return;
  }

  const action = btn.dataset?.action;

  if (action === 'toggle-profile') {
    if (e.target.closest('.profile-edit')) return;
    Match.toggleProfileSelection(state.setup, btn.dataset.id);
    refreshHome();
    return;
  }

  if (action === 'edit-profile') {
    e.stopPropagation();
    const profile = getProfileById(loadProfiles(), btn.dataset.id);
    if (profile) openProfileModal('edit', profile);
    return;
  }

  if (action === 'pick-emoji') {
    setProfileModalAvatar(btn.dataset.emoji);
    return;
  }

  if (action === 'pick-mode') {
    state.setup.gameModeId = btn.dataset.mode;
    Match.clampPlayersForMode(state.setup);
    refreshHome();
    return;
  }

  if (action === 'pick-target') {
    state.setup.targetScore = Number(btn.dataset.target);
    state.setup.customTarget = null;
    refreshHome();
    return;
  }

  if (action === 'pick-duration') {
    state.setup.timerMinutes = Number(btn.dataset.duration);
    refreshHome();
  }
}

function handleGameClick(e) {
  if (e.target.closest('#leave-match')) {
    if (confirm('Leave this match? Progress is saved — you can resume from home.')) {
      Match.leaveMatch(state);
      renderApp();
    }
    return;
  }

  if (e.target.closest('#share-btn')) {
    shareScore();
    return;
  }

  if (e.target.closest('#undo-btn')) {
    if (Match.undo(state)) {
      haptic();
      refreshGame();
    }
    return;
  }

  if (e.target.closest('#miss-btn')) {
    Match.endBreak(state);
    haptic();
    refreshGame();
    return;
  }

  if (e.target.closest('#new-frame-btn')) {
    if (confirm('Start a new frame?')) {
      Match.newFrame(state);
      haptic();
      refreshGame();
    }
    return;
  }

  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const card = e.target.closest('.player, .player-compact');
  if (
    card &&
    !btn.dataset.action?.match(/points|foul|award|foul-apply|foul-cancel/)
  ) {
    const idx = Number(card.dataset.player);
    if (!Number.isNaN(idx) && state.activePlayer !== idx) {
      Match.setActivePlayer(state, idx);
      haptic();
      refreshGame();
      return;
    }
  }

  const action = btn.dataset.action;

  if (action === 'points') {
    let player = Number(btn.dataset.player);
    if (Number.isNaN(player)) player = state.activePlayer;
    Match.addPoints(state, player, Number(btn.dataset.points));
    haptic();
    refreshGame();
    return;
  }

  if (action === 'foul') {
    let player = Number(btn.dataset.player);
    if (Number.isNaN(player)) player = state.activePlayer;
    Match.openFoulPicker(state, player);
    refreshGame();
    return;
  }

  if (action === 'foul-apply' && state.foulByPlayer !== null) {
    Match.applyFoul(state, state.foulByPlayer, Number(btn.dataset.points));
    haptic();
    refreshGame();
    return;
  }

  if (action === 'foul-cancel') {
    Match.closeFoulPicker(state);
    refreshGame();
    return;
  }

  if (action === 'award') {
    const player = Number(btn.dataset.player);
    const name = state.players[player]?.name ?? 'Player';
    if (confirm(`${name} wins this frame?`)) {
      Match.awardFrame(state, player);
      haptic();
      refreshGame();
    }
    return;
  }
}

function onDocumentChange(e) {
  if (state.screen === 'home') {
    if (e.target.id === 'setup-best-of') {
      state.setup.bestOf = Number(e.target.value);
      persist();
    }
    if (e.target.id === 'custom-target') {
      const v = Number(e.target.value);
      if (v > 0) {
        state.setup.customTarget = v;
        state.setup.targetScore = v;
      }
      persist();
    }
    if (e.target.id === 'profile-photo-input' && e.target.files?.[0]) {
      readImageAsAvatar(e.target.files[0])
        .then(setProfileModalAvatar)
        .catch(() => showToast('Could not load image'));
    }
    return;
  }

  if (e.target.id === 'best-of') {
    Match.setBestOf(state, Number(e.target.value));
    refreshGame();
  }
  if (e.target.id === 'auto-switch') {
    state.settings.autoSwitchTurn = e.target.checked;
    persist();
  }
}

function onDocumentInput(e) {
  if (e.target.id === 'profile-name-input') {
    const draft = getProfileModalDraft();
    updateProfileModalPreview(e.target.value, draft.avatar);
  }
}

function onDocumentKeydown(e) {
  if (e.key === 'Escape') {
    closeProfileModal();
    if (state.foulPickerOpen) {
      Match.closeFoulPicker(state);
      refreshGame();
    }
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js`)
    .then((reg) => {
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('Update available — refresh to get the latest version');
          }
        });
      });
    })
    .catch(() => {
      /* offline or blocked — app still works */
    });
}

function boot() {
  if (!app) {
    document.body.textContent = 'App failed to load.';
    return;
  }

  initTheme();
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('change', onDocumentChange);
  document.addEventListener('input', onDocumentInput);
  document.addEventListener('keydown', onDocumentKeydown);

  if (state.screen === 'game' && state.matchPaused) {
    state.screen = 'home';
  }

  renderApp();
  registerServiceWorker();
}

boot();
