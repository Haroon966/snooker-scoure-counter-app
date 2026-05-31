import {
  GAME_MODES,
  RACE_TARGETS,
  TIMED_DURATIONS,
  getPreset,
  isRaceMode,
  isTimedMode,
  getModeSummary,
} from '../rules/game-presets.js';
import {
  canAdvanceFromStep,
  hasResumableGame,
} from '../state/match-state.js';
import { loadProfiles, AVATAR_EMOJIS } from '../storage/profiles.js';
import { avatarHtml } from './avatars.js';
import { escapeHtml } from './escape.js';

const STEP_LABELS = ['', 'Game', 'Options', 'Start'];

function stepIndicator(current) {
  return [1, 2, 3]
    .map((s) => {
      const cls = s === current ? 'step-active' : s < current ? 'step-done' : '';
      return `<span class="step-dot ${cls}">${STEP_LABELS[s]}</span>`;
    })
    .join('<span class="step-arrow">→</span>');
}

function homeHubHtml(state, profiles) {
  const selected = new Set(state.setup.selectedProfileIds);
  const resume = hasResumableGame(state)
    ? `<button type="button" class="btn-secondary btn-large" id="resume-match">Resume Match</button>`
    : '';

  const cards = profiles
    .map((p) => {
      const isSelected = selected.has(p.id);
      return `
        <article class="profile-card ${isSelected ? 'selected' : ''}" data-action="toggle-profile" data-id="${p.id}">
          <div class="profile-check">${isSelected ? '✓' : ''}</div>
          ${avatarHtml(p, 'lg')}
          <span class="profile-name">${escapeHtml(p.name)}</span>
          <button type="button" class="profile-edit" data-action="edit-profile" data-id="${p.id}" aria-label="Edit ${escapeHtml(p.name)}">⋯</button>
        </article>`;
    })
    .join('');

  const empty =
    profiles.length === 0
      ? `<p class="home-empty">Add players to get started</p>`
      : '';

  const selCount = state.setup.selectedProfileIds.length;
  const canContinue = selCount >= 2;

  return `
    <div class="home-hub">
      <div class="home-section-header">
        <h3>Players</h3>
        <span class="home-count">${profiles.length} total · ${selCount} selected</span>
      </div>

      <div class="profile-grid">
        ${cards}
        <button type="button" class="profile-card profile-add" id="add-profile-card" aria-label="Add player">
          <div class="avatar avatar-lg avatar-add">+</div>
          <span class="profile-name">Add player</span>
        </button>
      </div>
      ${empty}

      <div class="home-actions">
        <button type="button" class="btn-primary btn-large" id="continue-match" ${canContinue ? '' : 'disabled'}>
          Continue (${selCount}/2+)
        </button>
        ${resume}
      </div>
    </div>

    <div class="profile-modal hidden" id="profile-modal" role="dialog" aria-modal="true">
      <div class="profile-modal-sheet">
        <h3 id="profile-modal-title">Add player</h3>
        <div class="profile-modal-preview" id="profile-modal-preview"></div>
        <input type="text" id="profile-name-input" placeholder="Player name" maxlength="20" aria-label="Name" />
        <div class="emoji-picker">
          ${AVATAR_EMOJIS.map(
            (e) =>
              `<button type="button" class="emoji-btn" data-action="pick-emoji" data-emoji="${e}">${e}</button>`
          ).join('')}
        </div>
        <label class="photo-upload-btn">
          Upload photo
          <input type="file" id="profile-photo-input" accept="image/*" hidden />
        </label>
        <div class="profile-modal-actions">
          <button type="button" class="btn-secondary" id="profile-modal-cancel">Cancel</button>
          <button type="button" class="btn-primary" id="profile-modal-save">Save</button>
        </div>
        <button type="button" class="btn-danger hidden" id="profile-modal-delete">Delete player</button>
      </div>
    </div>
  `;
}

function gameStepHtml(setup) {
  const cards = Object.values(GAME_MODES)
    .map((m) => {
      const sel = setup.gameModeId === m.id ? 'selected' : '';
      const players = m.maxPlayers > 2 ? '2–7 players' : '2 players';
      return `<button type="button" class="game-card ${sel}" data-action="pick-mode" data-mode="${m.id}">
        <strong>${m.label}</strong>
        <span>${m.description}</span>
        <span class="game-card-meta">${players}</span>
      </button>`;
    })
    .join('');

  return `
    <h2 class="wizard-title">Choose game type</h2>
    <div class="game-grid">${cards}</div>
  `;
}

function optionsStepHtml(setup, profiles) {
  const preset = getPreset(setup.gameModeId);
  if (!preset) return '<p>Select a game type first.</p>';

  const selectedPlayers = setup.selectedProfileIds
    .map((id) => profiles.find((p) => p.id === id))
    .filter(Boolean);

  const playerList = selectedPlayers
    .map((p) => `<li class="review-player-row">${avatarHtml(p, 'sm')} ${escapeHtml(p.name)}</li>`)
    .join('');

  if (isRaceMode(preset)) {
    const chips = RACE_TARGETS.map(
      (t) =>
        `<button type="button" class="target-chip ${setup.targetScore === t && !setup.customTarget ? 'selected' : ''}" data-action="pick-target" data-target="${t}">${t}</button>`
    ).join('');
    return `
      <h2 class="wizard-title">Race settings</h2>
      <ul class="review-players-list">${playerList}</ul>
      <div class="target-chips">${chips}</div>
      <label class="custom-target">Custom <input type="number" id="custom-target" min="10" max="500" value="${setup.customTarget ?? ''}" placeholder="e.g. 75" /></label>
    `;
  }

  if (isTimedMode(preset)) {
    const durations = TIMED_DURATIONS.map(
      (m) =>
        `<button type="button" class="target-chip ${setup.timerMinutes === m ? 'selected' : ''}" data-action="pick-duration" data-duration="${m}">${m} min</button>`
    ).join('');
    return `
      <h2 class="wizard-title">Timed settings</h2>
      <p class="wizard-sub">Red = 10 pts · Fouls: 4–10</p>
      <ul class="review-players-list">${playerList}</ul>
      <div class="target-chips">${durations}</div>
    `;
  }

  const bestOf = [1, 3, 5, 7, 9]
    .map((b) => `<option value="${b}" ${setup.bestOf === b ? 'selected' : ''}>${b}</option>`)
    .join('');

  return `
    <h2 class="wizard-title">Frame settings</h2>
    <ul class="review-players-list">${playerList}</ul>
    <label>Best of <select id="setup-best-of">${bestOf}</select> frames</label>
  `;
}

function reviewStepHtml(state, profiles) {
  const preset = getPreset(state.setup.gameModeId);
  const selectedPlayers = state.setup.selectedProfileIds
    .map((id) => profiles.find((p) => p.id === id))
    .filter(Boolean);

  const playerRows = selectedPlayers
    .map((p) => `<div class="review-player-row">${avatarHtml(p, 'sm')} ${escapeHtml(p.name)}</div>`)
    .join('');

  const summary = getModeSummary({
    setup: state.setup,
    match: { bestOf: state.setup.bestOf },
    game: {
      modeId: state.setup.gameModeId,
      targetScore: state.setup.customTarget || state.setup.targetScore,
    },
  });

  return `
    <h2 class="wizard-title">Ready to start?</h2>
    <div class="review-card">
      <p><strong>Players</strong></p>
      <div class="review-players-grid">${playerRows}</div>
      <p><strong>Game</strong> ${escapeHtml(summary)}</p>
      ${isTimedMode(preset) ? '<p><strong>Rule</strong> Highest score when timer ends</p>' : ''}
      ${isRaceMode(preset) ? `<p><strong>Win</strong> First to ${state.setup.customTarget || state.setup.targetScore}</p>` : ''}
    </div>
  `;
}

export function buildHomeShellHtml() {
  return `
    <div class="step-indicator" id="step-indicator"></div>
    <main class="wizard-body" id="wizard-body"></main>
    <footer class="wizard-footer" id="wizard-footer"></footer>
  `;
}

export function renderHome(state) {
  const step = state.setup.step;
  const body = document.getElementById('wizard-body');
  const footer = document.getElementById('wizard-footer');
  const indicator = document.getElementById('step-indicator');
  const profiles = loadProfiles();

  if (!body) return;

  if (step === 0) {
    indicator.innerHTML = '';
    body.innerHTML = homeHubHtml(state, profiles);
    footer.innerHTML = '';
    return;
  }

  indicator.innerHTML = stepIndicator(step);

  switch (step) {
    case 1:
      body.innerHTML = gameStepHtml(state.setup);
      break;
    case 2:
      body.innerHTML = optionsStepHtml(state.setup, profiles);
      break;
    case 3:
      body.innerHTML = reviewStepHtml(state, profiles);
      break;
    default:
      body.innerHTML = homeHubHtml(state, profiles);
  }

  const canNext = canAdvanceFromStep(state.setup);
  const backLabel = step === 1 ? 'Players' : 'Back';
  const nextLabel = step === 3 ? 'Start Match' : 'Next';
  const nextId = step === 3 ? 'start-match' : 'wizard-next';

  footer.innerHTML = `
    <button type="button" class="btn-secondary" id="wizard-back">${backLabel}</button>
    <button type="button" class="btn-primary" id="${nextId}" ${canNext ? '' : 'disabled'}>${nextLabel}</button>
  `;
}

export function updateProfileModalPreview(name, avatar) {
  const el = document.getElementById('profile-modal-preview');
  if (el) {
    el.innerHTML = avatarHtml({ name: name || 'Player', avatar }, 'lg');
  }
}

export function openProfileModal(mode = 'add', profile = null) {
  const modal = document.getElementById('profile-modal');
  const title = document.getElementById('profile-modal-title');
  const input = document.getElementById('profile-name-input');
  const delBtn = document.getElementById('profile-modal-delete');
  if (!modal) return;

  modal.dataset.mode = mode;
  modal.dataset.profileId = profile?.id ?? '';
  modal.dataset.draftAvatar = profile?.avatar ?? '';
  title.textContent = mode === 'edit' ? 'Edit player' : 'Add player';
  input.value = profile?.name ?? '';
  delBtn?.classList.toggle('hidden', mode !== 'edit');
  updateProfileModalPreview(profile?.name ?? '', profile?.avatar ?? null);
  modal.classList.remove('hidden');
  input.focus();
}

export function closeProfileModal() {
  document.getElementById('profile-modal')?.classList.add('hidden');
  const fileInput = document.getElementById('profile-photo-input');
  if (fileInput) fileInput.value = '';
}

export function getProfileModalDraft() {
  const modal = document.getElementById('profile-modal');
  const name = document.getElementById('profile-name-input')?.value ?? '';
  return {
    mode: modal?.dataset.mode ?? 'add',
    profileId: modal?.dataset.profileId ?? '',
    name,
    avatar: modal?.dataset.draftAvatar || null,
  };
}

export function setProfileModalAvatar(avatar) {
  const modal = document.getElementById('profile-modal');
  if (modal) modal.dataset.draftAvatar = avatar ?? '';
  const name = document.getElementById('profile-name-input')?.value ?? '';
  updateProfileModalPreview(name, avatar);
}
