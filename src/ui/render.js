import {
  pointsLeftOnTable,
  snookerStatus,
  framesToWin,
  BALL_LABELS,
} from '../rules/snooker.js';
import {
  getPreset,
  getFoulOptions,
  getBallPoints,
  isRaceMode,
  isTimedMode,
  isSnookerTableMode,
  getModeSummary,
} from '../rules/game-presets.js';
import { getActivePreset, getMaxRedsForState, isMatchPlayable } from '../state/match-state.js';
import { formatTimer, getRemainingMs } from './timer.js';
import { avatarHtml } from './avatars.js';
import { escapeHtml } from './escape.js';

const BALL_VALUES = [1, 2, 3, 4, 5, 6, 7, 10];

function ballButtonHtml(playerIndex, value, preset) {
  const label = BALL_LABELS[value];
  const pts = getBallPoints(preset, value);
  const cls = value === 10 ? 'btn-10' : `btn-${value}`;
  return `<button type="button" class="${cls}" data-action="points" data-player="${playerIndex}" data-points="${value}" aria-label="${label} ${pts} points">
    <span>${label}</span>
    <span class="ball-pts">+${pts}</span>
  </button>`;
}

function sharedControlsHtml(preset) {
  const balls = BALL_VALUES.map((v) => ballButtonHtml('active', v, preset))
    .join('')
    .replace(/data-player="active"/g, 'data-player="__ACTIVE__"');
  return `${balls}
    <button type="button" class="btn-foul" data-action="foul" data-player="__ACTIVE__">Foul</button>`;
}

function playerCardHtml(i, twoPlayer) {
  if (twoPlayer) {
    const controls = BALL_VALUES.map((v) => ballButtonHtml(i, v, getPreset('ball15')))
      .join('');
    return `
      <article class="player" id="player-${i}" data-player="${i}" aria-pressed="false">
        <div class="player-info">
          <div class="player-profile" id="avatar-${i}"></div>
          <span class="player-name-display" id="name-${i}"></span>
          <div class="frames-won" id="frames-won-${i}"></div>
          <div class="score" id="score-${i}">0</div>
          <div class="break" id="break-${i}">Break: 0</div>
          <div class="highest-break" id="high-break-${i}">Best: 0</div>
        </div>
        <div class="controls" id="controls-${i}">${controls}
          <button type="button" class="btn-foul" data-action="foul" data-player="${i}">Foul</button>
        </div>
      </article>`;
  }
  return `
    <article class="player player-compact" id="player-${i}" data-player="${i}" aria-pressed="false">
      <div class="player-profile" id="avatar-${i}"></div>
      <span class="player-name-display" id="name-${i}"></span>
      <div class="score" id="score-${i}">0</div>
      <div class="break" id="break-${i}">0</div>
    </article>`;
}

export function buildGameHtml() {
  return `
    <header class="header">
      <button type="button" class="icon-btn" id="leave-match" aria-label="Leave match">←</button>
      <div class="header-center">
        <span id="mode-label"></span>
        <span class="timer-display hidden" id="timer-display" aria-live="polite"></span>
      </div>
      <div class="header-actions">
        <button type="button" class="icon-btn btn-share" id="share-btn" aria-label="Share">Share</button>
        <button type="button" class="btn-undo" id="undo-btn">Undo</button>
      </div>
    </header>

    <p class="match-complete hidden" id="match-complete" role="status"></p>
    <div class="race-banner hidden" id="race-banner" role="status"></div>
    <div class="leaderboard hidden" id="leaderboard"></div>

    <section class="rules-panel hidden" id="rules-panel" aria-label="Table status">
      <h2>Table</h2>
      <div class="rules-row"><span class="rules-label">On table</span><strong id="points-left">0</strong> pts</div>
      <div id="snooker-status-rows"></div>
    </section>

    <div class="container" id="game-container">
      <div class="players" id="players-container"></div>
      <div class="shared-controls hidden" id="shared-controls"></div>
    </div>

    <div class="settings-row game-settings">
      <label><input type="checkbox" id="auto-switch" /> Auto-switch turn</label>
    </div>

    <footer class="footer-actions" id="game-footer"></footer>

    <div class="foul-overlay hidden" id="foul-overlay" role="dialog" aria-modal="true">
      <div class="foul-dialog">
        <h3>Foul points</h3>
        <div class="foul-points" id="foul-points"></div>
        <button type="button" class="foul-cancel" data-action="foul-cancel">Cancel</button>
      </div>
    </div>
  `;
}

export function mountGamePlayers(state) {
  const container = document.getElementById('players-container');
  const shared = document.getElementById('shared-controls');
  const twoPlayer = state.players.length === 2;
  const preset = getActivePreset(state);

  container.className = twoPlayer ? 'players' : 'players players-scroll';
  container.innerHTML = state.players
    .map((_, i) => playerCardHtml(i, twoPlayer))
    .join('');

  if (!twoPlayer) {
    shared.classList.remove('hidden');
    shared.innerHTML = `<p class="scoring-hint">Tap a player, then score</p><div class="controls">${sharedControlsHtml(preset).replace(/__ACTIVE__/g, String(state.activePlayer))}</div>`;
  } else {
    shared.classList.add('hidden');
    state.players.forEach((_, i) => {
      const ctrl = document.getElementById(`controls-${i}`);
      if (ctrl) {
        ctrl.innerHTML =
          BALL_VALUES.map((v) => ballButtonHtml(i, v, preset)).join('') +
          `<button type="button" class="btn-foul" data-action="foul" data-player="${i}">Foul</button>`;
      }
    });
  }

  const footer = document.getElementById('game-footer');
  const presetId = preset.id;
  const frameBtns =
    !isRaceMode(preset) && !isTimedMode(preset) && state.match.bestOf > 1
      ? state.players
          .map(
            (_, i) =>
              `<button type="button" class="btn-frame" data-action="award" data-player="${i}">${state.players[i].name} wins frame</button>`
          )
          .join('')
      : '';

  footer.innerHTML = `
    <button type="button" class="btn-miss" id="miss-btn">End break</button>
    ${!isRaceMode(preset) && !isTimedMode(preset) ? '<button type="button" class="btn-frame" id="new-frame-btn">New frame</button>' : ''}
    ${frameBtns}
  `;
}

export function render(state) {
  const preset = getActivePreset(state);
  const maxReds = getMaxRedsForState(state);
  const twoPlayer = state.players.length === 2;
  const pointsLeft = pointsLeftOnTable(state.balls, maxReds);

  document.getElementById('mode-label').textContent = getModeSummary(state);

  const timerEl = document.getElementById('timer-display');
  if (isTimedMode(preset)) {
    timerEl.classList.remove('hidden');
    timerEl.textContent = formatTimer(getRemainingMs(state));
  } else {
    timerEl.classList.add('hidden');
  }

  const rulesPanel = document.getElementById('rules-panel');
  if (isSnookerTableMode(preset)) {
    rulesPanel.classList.remove('hidden');
    document.getElementById('points-left').textContent = String(pointsLeft);

    const statusRows = document.getElementById('snooker-status-rows');
    if (twoPlayer) {
      statusRows.innerHTML = [0, 1]
        .map((i) => {
          const opp = 1 - i;
          return `<div class="rules-row"><span class="rules-label">${state.players[i].name}</span><span class="snooker-status" role="status">${snookerStatus(state.players[i].frameScore, state.players[opp].frameScore, pointsLeft)}</span></div>`;
        })
        .join('');
    } else {
      statusRows.innerHTML = '';
    }
  } else {
    rulesPanel.classList.add('hidden');
  }

  const raceBanner = document.getElementById('race-banner');
  if (isRaceMode(preset) && state.game.targetScore) {
    raceBanner.classList.remove('hidden');
    const leader = state.players.reduce((a, b) =>
      a.frameScore >= b.frameScore ? a : b
    );
    raceBanner.textContent = `Race to ${state.game.targetScore} — Leader: ${leader.name} (${leader.frameScore})`;
  } else {
    raceBanner.classList.add('hidden');
  }

  if (!document.getElementById(`player-${state.players.length - 1}`)) {
    mountGamePlayers(state);
  }

  state.players.forEach((p, i) => {
    const el = document.getElementById(`player-${i}`);
    if (!el) return;
    el.classList.toggle('active', state.activePlayer === i);
    el.setAttribute('aria-pressed', String(state.activePlayer === i));

    const nameEl = document.getElementById(`name-${i}`);
    if (nameEl) nameEl.textContent = p.name;

    const avatarEl = document.getElementById(`avatar-${i}`);
    if (avatarEl) avatarEl.innerHTML = avatarHtml(p, twoPlayer ? 'md' : 'sm');

    document.getElementById(`score-${i}`).textContent = p.frameScore;
    const breakEl = document.getElementById(`break-${i}`);
    breakEl.textContent = twoPlayer ? `Break: ${p.currentBreak}` : `Br: ${p.currentBreak}`;

    const highEl = document.getElementById(`high-break-${i}`);
    if (highEl) highEl.textContent = `Best: ${p.highestBreak}`;

    const fw = document.getElementById(`frames-won-${i}`);
    if (fw) fw.textContent = '';
  });

  if (!twoPlayer) {
    const sharedHtml = sharedControlsHtml(preset).replace(
      /__ACTIVE__/g,
      String(state.activePlayer)
    );
    const inner = document.querySelector('#shared-controls .controls');
    if (inner) inner.innerHTML = sharedHtml;
  }

  document.getElementById('auto-switch').checked = state.settings.autoSwitchTurn;

  const completeEl = document.getElementById('match-complete');
  const leaderboard = document.getElementById('leaderboard');

  if (state.game.status === 'time_up' || state.match.status === 'complete') {
    const winners = state.game.winnerIndices ?? [];
    if (isTimedMode(preset) && state.game.status === 'time_up') {
      const ranked = [...state.players]
        .map((p, i) => ({ ...p, i }))
        .sort((a, b) => b.frameScore - a.frameScore);
      leaderboard.classList.remove('hidden');
      leaderboard.innerHTML =
        '<h3>Final scores</h3><ol>' +
        ranked
          .map((p) => `<li>${p.name}: ${p.frameScore}</li>`)
          .join('') +
        '</ol>';
      const top = ranked[0];
      completeEl.textContent =
        winners.length > 1
          ? `Time's up — tie at ${top.frameScore}!`
          : `Time's up — ${top.name} wins with ${top.frameScore}!`;
    } else if (winners.length > 0) {
      const isFrameMatch = !isRaceMode(preset) && !isTimedMode(preset);
      if (isFrameMatch) {
        const needed = framesToWin(state.match.bestOf);
        const bestOfLine =
          state.match.bestOf > 1
            ? `<p class="leaderboard-meta">Best of ${state.match.bestOf} · first to ${needed}</p>`
            : '';
        leaderboard.classList.remove('hidden');
        leaderboard.innerHTML =
          `${bestOfLine}<h3>Frames won</h3><ol>` +
          [...state.players]
            .sort((a, b) => b.framesWon - a.framesWon)
            .map((p) => `<li>${p.name}: ${p.framesWon}</li>`)
            .join('') +
          '</ol>';
      } else {
        leaderboard.classList.add('hidden');
      }

      const names = winners.map((i) => state.players[i].name).join(', ');
      if (isFrameMatch && winners.length === 1 && state.players.length === 2) {
        const w = winners[0];
        const opp = 1 - w;
        completeEl.textContent = `Match over — ${state.players[w].name} wins ${state.players[w].framesWon}–${state.players[opp].framesWon}!`;
      } else {
        completeEl.textContent = `Match over — ${names} wins!`;
      }
    } else {
      completeEl.classList.add('hidden');
    }
    completeEl.classList.remove('hidden');
  } else {
    completeEl.classList.add('hidden');
    leaderboard.classList.add('hidden');
  }

  const foulContainer = document.getElementById('foul-points');
  foulContainer.innerHTML = getFoulOptions(preset)
    .map(
      (pts) =>
        `<button type="button" data-action="foul-apply" data-points="${pts}">${pts}</button>`
    )
    .join('');

  document.getElementById('foul-overlay').classList.toggle(
    'hidden',
    !state.foulPickerOpen
  );

  const playable = isMatchPlayable(state);
  document.getElementById('game-container')?.classList.toggle('match-finished', !playable);
  document.querySelectorAll('[data-action="points"], [data-action="foul"], #miss-btn, #new-frame-btn, [data-action="award"]').forEach((el) => {
    el.disabled = !playable;
  });
}

export function formatShareText(state) {
  const preset = getActivePreset(state);
  const lines = [
    'Snooker Score',
    getModeSummary(state),
    ...state.players.map((p) => `${p.name}: ${p.frameScore}`),
  ];
  if (isTimedMode(preset)) {
    lines.push(`Time left: ${formatTimer(getRemainingMs(state))}`);
  }
  return lines.join('\n');
}

export function haptic() {
  if (navigator.vibrate) navigator.vibrate(10);
}
