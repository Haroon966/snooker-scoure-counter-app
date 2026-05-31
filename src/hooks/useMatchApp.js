import { useCallback, useReducer, useRef, useState } from 'react';
import { loadState, saveState } from '../storage/persist.js';
import { loadProfiles } from '../storage/profiles.js';
import { tryRecordMatchHistory } from '../rules/matchHistory.js';
import * as Match from '../state/match-state.js';

function initState() {
  const s = loadState();
  if (s.screen === 'game' && s.matchPaused) s.screen = 'home';
  if (s.game && s.game.historyRecorded == null) s.game.historyRecorded = false;
  return s;
}

export function useMatchApp({ pricePerHour = 500, onHistoryChange } = {}) {
  const stateRef = useRef(initState());
  const [, tick] = useReducer((n) => n + 1, 0);
  const [toast, setToast] = useState('');
  const [profilesVersion, setProfilesVersion] = useState(0);

  const refreshProfiles = useCallback(() => {
    setProfilesVersion((v) => v + 1);
  }, []);

  const profiles = loadProfiles();

  const showToast = useCallback((message) => {
    setToast(message);
  }, []);

  const persist = useCallback(() => {
    const result = saveState(stateRef.current);
    if (!result.ok) showToast(result.error ?? 'Could not save progress');
    tick();
  }, [showToast]);

  const mutate = useCallback(
    (fn) => {
      fn(stateRef.current);
      if (tryRecordMatchHistory(stateRef.current, pricePerHour)) {
        onHistoryChange?.();
      }
      persist();
    },
    [persist, pricePerHour, onHistoryChange]
  );

  const syncSetupNames = useCallback(() => {
    Match.syncPlayerNamesFromSelection(stateRef.current.setup, loadProfiles());
  }, []);

  return {
    state: stateRef.current,
    profiles,
    profilesVersion,
    toast,
    setToast,
    showToast,
    mutate,
    persist,
    refreshProfiles,
    syncSetupNames,
    Match,
  };
}
