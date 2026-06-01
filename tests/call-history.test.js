import { describe, it, expect } from 'vitest';
import {
  createCallEntry,
  formatCallLabel,
  getCallPoints,
  pushPlayerCall,
  clearPlayerCallHistory,
  CALL_HISTORY_CAP,
} from '../src/utils/call-history.js';
import { createInitialState, addPoints, applyFoul, undo, newFrame } from '../src/state/match-state.js';
import { getPreset } from '../src/rules/game-presets.js';

describe('call history', () => {
  it('formats ball and foul labels', () => {
    const preset = getPreset('ball15');
    const red = createCallEntry('ball', { ballValue: 1, points: 1 });
    const black = createCallEntry('ball', { ballValue: 7, points: 7 });
    const foul = createCallEntry('foul', { points: 4 });

    expect(getCallPoints(red, preset)).toBe(1);
    expect(formatCallLabel(red, preset)).toBe('Red +1');

    expect(getCallPoints(black, preset)).toBe(7);
    expect(formatCallLabel(black, preset)).toBe('Black +7');

    expect(formatCallLabel(foul, preset)).toBe('Foul −4');
  });

  it('records balls and fouls per player', () => {
    const state = createInitialState();
    addPoints(state, 0, 7);
    addPoints(state, 0, 1);
    applyFoul(state, 1, 5);

    expect(state.players[0].callHistory).toHaveLength(2);
    expect(state.players[0].callHistory[0]).toMatchObject({ type: 'ball', ball: 7, points: 7 });
    expect(state.players[1].callHistory).toHaveLength(1);
    expect(state.players[1].callHistory[0]).toMatchObject({ type: 'foul', points: 5 });
  });

  it('clears on new frame and undo restores', () => {
    const state = createInitialState();
    addPoints(state, 0, 10);
    addPoints(state, 0, 10);
    expect(state.players[0].callHistory).toHaveLength(2);

    undo(state);
    expect(state.players[0].callHistory).toHaveLength(1);

    newFrame(state);
    expect(state.players[0].callHistory).toHaveLength(0);
  });

  it('caps history length', () => {
    const player = { callHistory: [] };
    for (let i = 0; i < CALL_HISTORY_CAP + 5; i += 1) {
      pushPlayerCall(player, createCallEntry('ball', { ballValue: 1, points: 1 }));
    }
    expect(player.callHistory).toHaveLength(CALL_HISTORY_CAP);
  });

  it('clearPlayerCallHistory resets array', () => {
    const player = { callHistory: [createCallEntry('ball', { ballValue: 1, points: 1 })] };
    clearPlayerCallHistory(player);
    expect(player.callHistory).toEqual([]);
  });
});
