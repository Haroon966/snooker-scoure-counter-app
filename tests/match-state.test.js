import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  addPoints,
  applyFoul,
  undo,
  endBreak,
  awardFrame,
  nextFrameByScore,
  newFrame,
  setActivePlayer,
  incrementRedsPotted,
  startMatch,
  endTimedMatch,
  addPlayerToSetup,
  hasResumableGame,
  resumeMatch,
  isMatchPlayable,
  endMatchWithWinner,
  endMatchWithTie,
  endMatchByScore,
  openEndMatchPicker,
  getScoreLeaderIndices,
  getScoreLaggardIndices,
  getMultiPlayerOutcome,
  addPlayerToGame,
  canAddPlayerToGame,
  canRemovePlayerFromGame,
  showAddPlayerButton,
  showManagePlayersButton,
  removePlayerFromGame,
  unlinkProfileFromMatchSetup,
  setTeamMode,
  assignProfileToTeam,
  removeProfileFromTeam,
  isTeamSetupValid,
  initTeamsFromSetup,
  isTeamMode,
  wizardUsesFormatStep,
  createDefaultSetup,
} from '../src/state/match-state.js';
import { migrateV1ToV2 } from '../src/storage/persist.js';

describe('match state', () => {
  it('adds points and tracks break', () => {
    const state = createInitialState();
    addPoints(state, 0, 7);
    expect(state.players[0].frameScore).toBe(7);
    expect(state.players[0].currentBreak).toBe(7);
    expect(state.players[0].highestBreak).toBe(7);
    expect(state.players[0].callHistory).toHaveLength(1);
    expect(state.players[0].callHistory[0]).toMatchObject({ type: 'ball', ball: 7, points: 7 });
  });

  it('deducts foul points from fouling player only', () => {
    const state = createInitialState();
    addPoints(state, 0, 10);
    addPoints(state, 1, 8);
    applyFoul(state, 1, 5);
    expect(state.players[0].frameScore).toBe(10);
    expect(state.players[0].currentBreak).toBe(10);
    expect(state.players[1].frameScore).toBe(3);
    expect(state.players[1].currentBreak).toBe(0);
    expect(state.players[1].highestBreak).toBe(8);
  });

  it('deducts foul points from selected player when more than two players', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    const profiles = ['A', 'B', 'C'].map((n) => ({
      id: crypto.randomUUID(),
      name: n,
      avatar: null,
    }));
    state.setup.selectedProfileIds = profiles.map((p) => p.id);
    startMatch(state, profiles);
    addPoints(state, 1, 10);
    addPoints(state, 1, 10);
    applyFoul(state, 1, 7);
    expect(state.players[1].frameScore).toBe(13);
    expect(state.players[0].frameScore).toBe(0);
    expect(state.players[2].frameScore).toBe(0);
    expect(state.players[1].currentBreak).toBe(0);
    expect(state.players[1].highestBreak).toBe(20);
  });

  it('allows negative score after foul', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    const profiles = ['A', 'B', 'C'].map((n) => ({
      id: crypto.randomUUID(),
      name: n,
      avatar: null,
    }));
    state.setup.selectedProfileIds = profiles.map((p) => p.id);
    startMatch(state, profiles);
    applyFoul(state, 0, 10);
    expect(state.players[0].frameScore).toBe(-10);
  });

  it('undoes last action', () => {
    const state = createInitialState();
    addPoints(state, 0, 1);
    addPoints(state, 0, 2);
    undo(state);
    expect(state.players[0].frameScore).toBe(1);
  });

  it('ends break without changing score', () => {
    const state = createInitialState();
    addPoints(state, 0, 5);
    endBreak(state);
    expect(state.players[0].frameScore).toBe(5);
    expect(state.players[0].currentBreak).toBe(0);
    expect(state.players[0].highestBreak).toBe(5);
  });

  it('awards frame and resets frame scores', () => {
    const state = createInitialState();
    state.match.bestOf = 3;
    addPoints(state, 0, 50);
    awardFrame(state, 0);
    expect(state.players[0].framesWon).toBe(1);
    expect(state.players[0].frameScore).toBe(0);
  });

  it('awardFrame with bestOf 1 does not complete the match', () => {
    const state = createInitialState();
    state.setup.selectedProfileIds = ['a', 'b'];
    startMatch(state);
    addPoints(state, 0, 50);
    awardFrame(state, 0);
    expect(state.players[0].framesWon).toBe(1);
    expect(state.match.status).toBe('in_progress');
    expect(state.game.status).toBe('in_progress');
  });

  it('nextFrameByScore awards frame to the leader', () => {
    const state = createInitialState();
    state.setup.selectedProfileIds = ['a', 'b'];
    startMatch(state);
    addPoints(state, 0, 40);
    addPoints(state, 1, 12);
    openEndMatchPicker(state);
    nextFrameByScore(state);
    expect(state.players[0].framesWon).toBe(1);
    expect(state.players[0].frameScore).toBe(0);
    expect(state.endMatchPickerOpen).toBe(false);
  });

  it('endMatchByScore completes a frame snooker match', () => {
    const state = createInitialState();
    state.setup.selectedProfileIds = ['a', 'b'];
    startMatch(state);
    addPoints(state, 0, 5);
    addPoints(state, 1, 12);
    endMatchByScore(state);
    expect(state.match.status).toBe('complete');
    expect(state.game.winnerIndices).toEqual([1]);
    expect(state.players[1].framesWon).toBe(0);
  });

  it('new frame clears scores only', () => {
    const state = createInitialState();
    state.players[0].framesWon = 2;
    addPoints(state, 0, 30);
    newFrame(state);
    expect(state.players[0].framesWon).toBe(2);
    expect(state.players[0].frameScore).toBe(0);
  });

  it('switches active player', () => {
    const state = createInitialState();
    setActivePlayer(state, 1);
    expect(state.activePlayer).toBe(1);
  });

  it('enters colors phase after 15 reds', () => {
    const state = createInitialState();
    state.game.modeId = 'ball15';
    state.balls.maxReds = 15;
    for (let i = 0; i < 15; i++) incrementRedsPotted(state);
    expect(state.balls.redsPotted).toBe(15);
    expect(state.balls.colorsPhase).toBe(true);
  });

  it('starts match with 4 players in timed mode', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    const profiles = ['A', 'B', 'C', 'D'].map((n) => ({
      id: crypto.randomUUID(),
      name: n,
      avatar: null,
    }));
    state.setup.selectedProfileIds = profiles.map((p) => p.id);
    startMatch(state, profiles);
    expect(state.screen).toBe('game');
    expect(state.players).toHaveLength(4);
    expect(state.game.startedAt).toBeTruthy();
    expect(state.game.timerDurationMs).toBeNull();
  });

  it('stores start time for frame matches', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'ball15';
    state.setup.selectedProfileIds = ['a', 'b'];
    state.setup.playerNames = ['P1', 'P2'];
    startMatch(state);
    expect(state.game.startedAt).toBeTruthy();
  });

  it('wins race when target reached', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'race';
    state.setup.targetScore = 50;
    state.setup.selectedProfileIds = ['a', 'b'];
    state.setup.playerNames = ['P1', 'P2'];
    startMatch(state);
    addPoints(state, 0, 7);
    addPoints(state, 0, 7);
    addPoints(state, 0, 7);
    addPoints(state, 0, 7);
    addPoints(state, 0, 7);
    addPoints(state, 0, 7);
    addPoints(state, 0, 8);
    expect(state.game.status).toBe('complete');
  });

  it('timed mode scores red as 10', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    state.setup.selectedProfileIds = ['a', 'b'];
    state.setup.playerNames = ['P1', 'P2'];
    startMatch(state);
    addPoints(state, 0, 1);
    expect(state.players[0].frameScore).toBe(10);
  });

  it('endTimedMatch picks highest score', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    state.setup.selectedProfileIds = ['a', 'b'];
    state.setup.playerNames = ['P1', 'P2'];
    startMatch(state);
    addPoints(state, 0, 7);
    addPoints(state, 1, 7);
    addPoints(state, 1, 7);
    endTimedMatch(state);
    expect(state.game.winnerIndices).toContain(1);
  });

  it('resumes paused match from home', () => {
    const state = createInitialState();
    state.matchPaused = true;
    state.players[0].frameScore = 10;
    expect(hasResumableGame(state)).toBe(true);
    resumeMatch(state);
    expect(state.screen).toBe('game');
    expect(state.matchPaused).toBe(false);
  });

  it('blocks scoring when match is finished', () => {
    const state = createInitialState();
    state.game.status = 'complete';
    addPoints(state, 0, 1);
    expect(state.players[0].frameScore).toBe(0);
    expect(isMatchPlayable(state)).toBe(false);
  });

  it('ends match with selected winner', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'race';
    state.setup.targetScore = 100;
    state.setup.selectedProfileIds = ['a', 'b'];
    startMatch(state);
    endMatchWithWinner(state, 1);
    expect(state.game.status).toBe('complete');
    expect(state.game.winnerIndices).toEqual([1]);
  });

  it('endMatchByScore picks highest scorer as winner', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'race';
    state.setup.targetScore = 100;
    state.setup.selectedProfileIds = ['a', 'b'];
    startMatch(state);
    addPoints(state, 0, 5);
    addPoints(state, 1, 12);
    endMatchByScore(state);
    expect(state.game.status).toBe('complete');
    expect(state.game.winnerIndices).toEqual([1]);
  });

  it('endMatchByScore ends as tie when scores are equal', () => {
    const state = createInitialState();
    state.setup.selectedProfileIds = ['a', 'b'];
    startMatch(state);
    addPoints(state, 0, 10);
    addPoints(state, 1, 10);
    endMatchByScore(state);
    expect(state.game.tie).toBe(true);
    expect(state.match.status).toBe('complete');
  });

  it('getScoreLeaderIndices returns tied leaders', () => {
    const state = createInitialState();
    state.setup.selectedProfileIds = ['a', 'b'];
    startMatch(state);
    addPoints(state, 0, 8);
    addPoints(state, 1, 8);
    const { indices, isTie } = getScoreLeaderIndices(state);
    expect(isTie).toBe(true);
    expect(indices).toEqual([0, 1]);
  });

  it('getScoreLaggardIndices returns lowest scorers for multi-player', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    const profiles = ['A', 'B', 'C'].map((n) => ({
      id: crypto.randomUUID(),
      name: n,
      avatar: null,
    }));
    state.setup.selectedProfileIds = profiles.map((p) => p.id);
    startMatch(state, profiles);
    addPoints(state, 0, 10);
    addPoints(state, 1, 10);
    addPoints(state, 1, 10);
    const { indices, allTied } = getScoreLaggardIndices(state);
    expect(allTied).toBe(false);
    expect(indices).toEqual([2]);
  });

  it('endMatchByScore marks lowest scorer as loser and others as winners', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    const profiles = ['A', 'B', 'C'].map((n) => ({
      id: crypto.randomUUID(),
      name: n,
      avatar: null,
    }));
    state.setup.selectedProfileIds = profiles.map((p) => p.id);
    startMatch(state, profiles);
    addPoints(state, 0, 10);
    addPoints(state, 1, 10);
    addPoints(state, 1, 10);
    endMatchByScore(state);
    expect(state.match.status).toBe('complete');
    expect(state.game.tie).toBe(false);
    expect(state.game.winnerIndices).toEqual([0, 1]);
    expect(state.game.loserIndices).toEqual([2]);
    expect(getMultiPlayerOutcome(state).loserIndices).toEqual([2]);
  });

  it('endMatchByScore treats equal scores as all losers in multi-player', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    const profiles = ['A', 'B', 'C'].map((n) => ({
      id: crypto.randomUUID(),
      name: n,
      avatar: null,
    }));
    state.setup.selectedProfileIds = profiles.map((p) => p.id);
    startMatch(state, profiles);
    addPoints(state, 0, 10);
    addPoints(state, 1, 10);
    addPoints(state, 2, 10);
    endMatchByScore(state);
    expect(state.game.tie).toBe(false);
    expect(state.game.winnerIndices).toEqual([]);
    expect(state.game.loserIndices).toEqual([0, 1, 2]);
  });

  it('ends match as tie', () => {
    const state = createInitialState();
    state.setup.selectedProfileIds = ['a', 'b'];
    startMatch(state);
    endMatchWithTie(state);
    expect(state.game.tie).toBe(true);
    expect(state.match.status).toBe('complete');
  });

  it('replays tournament match on tie', () => {
    const state = createInitialState();
    const ps = [
      { id: 'a', name: 'A', avatar: null },
      { id: 'b', name: 'B', avatar: null },
      { id: 'c', name: 'C', avatar: null },
    ];
    state.setup.selectedProfileIds = ps.map((p) => p.id);
    state.setup.multiPlayerFormat = 'tournament';
    state.setup.gameModeId = 'ball15';
    startMatch(state, ps);
    addPoints(state, 0, 7);
    endMatchWithTie(state);
    expect(state.game.status).toBe('in_progress');
    expect(state.players[0].frameScore).toBe(0);
  });

  it('adds a player during a multi-player match', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    const profiles = ['A', 'B'].map((n) => ({
      id: crypto.randomUUID(),
      name: n,
      avatar: null,
    }));
    state.setup.selectedProfileIds = profiles.map((p) => p.id);
    startMatch(state, profiles);
    expect(canAddPlayerToGame(state)).toBe(true);
    const result = addPlayerToGame(state, { name: 'Charlie' });
    expect(result.ok).toBe(true);
    expect(state.players).toHaveLength(3);
    expect(state.players[2].name).toBe('Charlie');
    expect(state.players[2].frameScore).toBe(0);
  });

  it('rejects duplicate names when adding mid-match', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    const profiles = ['A', 'B'].map((n) => ({
      id: crypto.randomUUID(),
      name: n,
      avatar: null,
    }));
    state.setup.selectedProfileIds = profiles.map((p) => p.id);
    startMatch(state, profiles);
    const result = addPlayerToGame(state, { name: 'A' });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('duplicate');
  });

  it('removes a player from an in-progress match', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    const profiles = ['A', 'B', 'C'].map((n) => ({
      id: crypto.randomUUID(),
      name: n,
      avatar: null,
    }));
    state.setup.selectedProfileIds = profiles.map((p) => p.id);
    startMatch(state, profiles);
    expect(canRemovePlayerFromGame(state)).toBe(true);
    const result = removePlayerFromGame(state, 2);
    expect(result.ok).toBe(true);
    expect(state.players).toHaveLength(2);
    expect(state.players.map((p) => p.name)).toEqual(['A', 'B']);
    unlinkProfileFromMatchSetup(state, profiles[2].id);
    expect(state.setup.selectedProfileIds).toHaveLength(2);
  });

  it('cannot remove below two players', () => {
    const state = createInitialState();
    startMatch(state, []);
    expect(canRemovePlayerFromGame(state)).toBe(false);
    expect(removePlayerFromGame(state, 0).reason).toBe('not_allowed');
  });

  it('allows adding players in two-player snooker modes', () => {
    const state = createInitialState();
    startMatch(state, []);
    expect(canAddPlayerToGame(state)).toBe(true);
    const result = addPlayerToGame(state, { name: 'Extra' });
    expect(result.ok).toBe(true);
    expect(state.players).toHaveLength(3);
  });

  it('shows add button in timed mode with two players', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    const profiles = ['A', 'B'].map((n) => ({
      id: crypto.randomUUID(),
      name: n,
      avatar: null,
    }));
    state.setup.selectedProfileIds = profiles.map((p) => p.id);
    startMatch(state, profiles);
    state.screen = 'game';
    expect(showAddPlayerButton(state)).toBe(true);
    expect(canAddPlayerToGame(state)).toBe(true);
  });

  it('shows add button in frame snooker with two players', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'ball15';
    state.screen = 'game';
    state.game.status = 'in_progress';
    state.players = [
      { name: 'A', frameScore: 0, currentBreak: 0, highestBreak: 0, framesWon: 0, avatar: null },
      { name: 'B', frameScore: 0, currentBreak: 0, highestBreak: 0, framesWon: 0, avatar: null },
    ];
    expect(showAddPlayerButton(state)).toBe(true);
  });

  it('still allows adding after match grows past two players', () => {
    const state = createInitialState();
    state.setup.gameModeId = 'timed';
    const profiles = ['A', 'B', 'C'].map((n) => ({
      id: crypto.randomUUID(),
      name: n,
      avatar: null,
    }));
    state.setup.selectedProfileIds = profiles.map((p) => p.id);
    startMatch(state, profiles);
    expect(canAddPlayerToGame(state)).toBe(true);
    state.game.modeId = 'ball15';
    expect(canAddPlayerToGame(state)).toBe(true);
    addPlayerToGame(state, { name: 'D' });
    addPlayerToGame(state, { name: 'E' });
    addPlayerToGame(state, { name: 'F' });
    addPlayerToGame(state, { name: 'G' });
    expect(canAddPlayerToGame(state)).toBe(false);
  });
});

describe('team mode', () => {
  const profiles = [
    { id: 'p1', name: 'Alice', avatar: null },
    { id: 'p2', name: 'Bob', avatar: null },
    { id: 'p3', name: 'Carol', avatar: null },
    { id: 'p4', name: 'Dave', avatar: null },
  ];

  it('setTeamMode splits selected profiles across two teams', () => {
    const setup = createDefaultSetup();
    setup.selectedProfileIds = ['p1', 'p2', 'p3', 'p4'];
    setTeamMode(setup, true);
    expect(setup.teamMode).toBe(true);
    expect(setup.teams[0].profileIds).toEqual(['p1', 'p3']);
    expect(setup.teams[1].profileIds).toEqual(['p2', 'p4']);
    expect(isTeamSetupValid(setup)).toBe(true);
  });

  it('isTeamSetupValid fails when a team is empty', () => {
    const setup = createDefaultSetup();
    setup.teamMode = true;
    setup.selectedProfileIds = ['p1', 'p2'];
    setup.teams[0].profileIds = ['p1', 'p2'];
    setup.teams[1].profileIds = [];
    expect(isTeamSetupValid(setup)).toBe(false);
  });

  it('assignProfileToTeam moves profile between teams', () => {
    const setup = createDefaultSetup();
    setup.teamMode = true;
    setup.selectedProfileIds = ['p1', 'p2'];
    setup.teams[0].profileIds = ['p1'];
    setup.teams[1].profileIds = ['p2'];
    assignProfileToTeam(setup, 'p1', 1);
    expect(setup.teams[0].profileIds).toEqual([]);
    expect(setup.teams[1].profileIds).toEqual(['p2', 'p1']);
  });

  it('assignProfileToTeam adds unassigned player to selected team', () => {
    const setup = createDefaultSetup();
    setup.teamMode = true;
    assignProfileToTeam(setup, 'p1', 0);
    assignProfileToTeam(setup, 'p2', 1);
    expect(setup.selectedProfileIds).toEqual(['p1', 'p2']);
    expect(setup.teams[0].profileIds).toEqual(['p1']);
    expect(setup.teams[1].profileIds).toEqual(['p2']);
  });

  it('removeProfileFromTeam removes player from roster', () => {
    const setup = createDefaultSetup();
    setup.teamMode = true;
    setup.selectedProfileIds = ['p1', 'p2'];
    setup.teams[0].profileIds = ['p1'];
    setup.teams[1].profileIds = ['p2'];
    removeProfileFromTeam(setup, 'p1');
    expect(setup.selectedProfileIds).toEqual(['p2']);
    expect(setup.teams[0].profileIds).toEqual([]);
  });

  it('initTeamsFromSetup creates two team scorers with members', () => {
    const state = createInitialState();
    state.setup.teamMode = true;
    state.setup.selectedProfileIds = ['p1', 'p2', 'p3'];
    state.setup.teams[0].profileIds = ['p1', 'p3'];
    state.setup.teams[1].profileIds = ['p2'];
    state.setup.teams[0].name = 'Reds';
    state.setup.teams[1].name = 'Blues';
    initTeamsFromSetup(state, profiles);
    expect(state.players).toHaveLength(2);
    expect(state.players[0].name).toBe('Reds');
    expect(state.players[1].name).toBe('Blues');
    expect(state.players[0].members).toHaveLength(2);
    expect(state.players[1].members).toHaveLength(1);
    expect(isTeamMode(state)).toBe(true);
  });

  it('startMatch in team mode scores teams not individuals', () => {
    const state = createInitialState();
    state.setup.teamMode = true;
    state.setup.gameModeId = 'ball15';
    state.setup.selectedProfileIds = ['p1', 'p2', 'p3'];
    state.setup.teams[0].profileIds = ['p1', 'p3'];
    state.setup.teams[1].profileIds = ['p2'];
    startMatch(state, profiles);
    expect(isTeamMode(state)).toBe(true);
    addPoints(state, 0, 7);
    expect(state.players[0].frameScore).toBe(7);
    expect(state.players[1].frameScore).toBe(0);
  });

  it('wizardUsesFormatStep is false in team mode with 3+ players', () => {
    const setup = createDefaultSetup();
    setup.teamMode = true;
    setup.selectedProfileIds = ['p1', 'p2', 'p3'];
    setup.teams[0].profileIds = ['p1'];
    setup.teams[1].profileIds = ['p2', 'p3'];
    expect(wizardUsesFormatStep(setup)).toBe(false);
  });

  it('addPlayerToGame in team mode adds to team roster only', () => {
    const state = createInitialState();
    state.setup.teamMode = true;
    state.setup.gameModeId = 'timed';
    state.setup.selectedProfileIds = ['p1', 'p2'];
    state.setup.teams[0].profileIds = ['p1'];
    state.setup.teams[1].profileIds = ['p2'];
    startMatch(state, profiles);
    const result = addPlayerToGame(state, {
      name: 'Eve',
      profileId: 'p-new',
      teamIndex: 0,
    });
    expect(result.ok).toBe(true);
    expect(state.players).toHaveLength(2);
    expect(state.players[0].members).toHaveLength(2);
  });
});

describe('migrateV1ToV2', () => {
  it('migrates legacy storage shape', () => {
    const v2 = migrateV1ToV2({
      score1: 10,
      score2: 20,
      currentBreak1: 5,
      currentBreak2: 0,
      activePlayer: 2,
      name1: 'Alice',
      name2: 'Bob',
      history: [{ score1: 0, score2: 0, currentBreak1: 0, currentBreak2: 0, activePlayer: 1 }],
    });
    expect(v2.players[0].frameScore).toBe(10);
    expect(v2.players[1].frameScore).toBe(20);
    expect(v2.players[0].name).toBe('Alice');
    expect(v2.activePlayer).toBe(1);
    expect(v2.history.length).toBe(1);
  });
});
