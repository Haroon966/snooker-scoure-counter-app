import { useCallback, useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from './theme/muiTheme.js';
import { THEME_META_COLORS } from './theme/designTokens.js';
import { loadSettings, saveSettings, normalizePricePerHour } from './storage/settings.js';
import { useMatchApp } from './hooks/useMatchApp.js';
import HomeView from './components/HomeView.jsx';
import GameView from './components/GameView.jsx';
import HistoryView from './components/HistoryView.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import {
  loadProfiles,
  addProfile,
  updateProfile,
  deleteProfile,
} from './storage/profiles.js';
import { haptic } from './utils/haptic.js';
import { blurActiveElement } from './utils/dialogFocus.js';

export default function App() {
  const navigate = useNavigate();
  const [profileModal, setProfileModal] = useState(null);
  const [themeMode, setThemeMode] = useState(() => loadSettings().themeMode);
  const [pricePerHour, setPricePerHour] = useState(() => loadSettings().pricePerHour);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [, setTimerTick] = useState(0);

  const {
    state,
    profiles,
    toast,
    setToast,
    showToast,
    mutate,
    refreshProfiles,
    syncSetupNames,
    Match,
  } = useMatchApp({
    pricePerHour,
    onHistoryChange: () => setHistoryVersion((v) => v + 1),
  });

  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  useEffect(() => {
    saveSettings({ themeMode, pricePerHour });
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_META_COLORS[themeMode]);
  }, [themeMode, pricePerHour]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      return;
    }

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
      .catch(() => {});
  }, [showToast]);

  useEffect(() => {
    const onOffline = () => showToast('Offline — scores still save locally');
    window.addEventListener('offline', onOffline);
    return () => window.removeEventListener('offline', onOffline);
  }, [showToast]);

  const handleSaveProfile = useCallback(
    ({ mode, profileId, name, avatar }) => {
      const all = loadProfiles();
      if (mode === 'edit' && profileId) {
        updateProfile(all, profileId, { name, avatar });
      } else {
        const created = addProfile(all, name, avatar);
        if (created) {
          mutate((s) => s.setup.selectedProfileIds.push(created.id));
        } else {
          showToast('A player with that name already exists');
          return;
        }
      }
      setProfileModal(null);
      refreshProfiles();
      syncSetupNames();
      mutate(() => {});
    },
    [mutate, refreshProfiles, showToast, syncSetupNames]
  );

  const handleDeleteProfile = useCallback(
    (profileId) => {
      if (!profileId || !confirm('Delete this player?')) return;
      deleteProfile(loadProfiles(), profileId);
      mutate((s) => {
        s.setup.selectedProfileIds = s.setup.selectedProfileIds.filter((id) => id !== profileId);
      });
      refreshProfiles();
    },
    [mutate, refreshProfiles]
  );

  const handleTimerTick = useCallback(() => {
    setTimerTick((t) => t + 1);
  }, []);

  const goHome = useCallback(() => navigate('/'), [navigate]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
        {state.screen === 'game' ? (
          <GameView
            state={state}
            pricePerHour={pricePerHour}
            onLeave={() => {
              if (confirm('Leave this match? Progress is saved — you can resume from home.')) {
                mutate((s) => Match.leaveMatch(s));
                goHome();
              }
            }}
            onUndo={() => {
              mutate((s) => Match.undo(s));
              haptic();
            }}
            onPoints={(player, points) => {
              mutate((s) => Match.addPoints(s, player, points));
              haptic();
            }}
            onFoulOpen={(player) => {
              blurActiveElement();
              mutate((s) => Match.openFoulPicker(s, player));
            }}
            onFoulApply={(pts) => {
              mutate((s) => Match.applyFoul(s, s.foulByPlayer, pts));
              haptic();
            }}
            onFoulClose={() => mutate((s) => Match.closeFoulPicker(s))}
            onEndMatchOpen={() => {
              blurActiveElement();
              mutate((s) => Match.openEndMatchPicker(s));
            }}
            onEndMatchByScore={() => {
              mutate((s) => {
                Match.endMatchByScore(s);
                if (s.tournament && s.game.status === 'in_progress') {
                  showToast('Tie — replaying match');
                }
              });
              haptic();
            }}
            onEndMatchCancel={() => {
              if (confirm('Cancel this match and return home?')) {
                mutate((s) => Match.cancelMatch(s));
                goHome();
              }
            }}
            onEndMatchClose={() => mutate((s) => Match.closeEndMatchPicker(s))}
            onAwardFrame={(i) => {
              const name = state.players[i]?.name ?? 'Player';
              if (confirm(`${name} wins this frame?`)) {
                mutate((s) => Match.awardFrame(s, i));
                haptic();
              }
            }}
            onSetActivePlayer={(i) => {
              mutate((s) => Match.setActivePlayer(s, i));
              haptic();
            }}
            onTick={handleTimerTick}
            onGoHome={() => {
              mutate((s) => Match.goHomeFromGame(s));
              goHome();
            }}
          />
        ) : (
          <Routes>
            <Route
              path="/history"
              element={
                <HistoryView
                  historyVersion={historyVersion}
                  onHistoryChange={() => setHistoryVersion((v) => v + 1)}
                  onBack={goHome}
                />
              }
            />
            <Route
              path="/"
              element={
                <>
                  <HomeView
                    state={state}
                    profiles={profiles}
                    themeMode={themeMode}
                    onThemeModeChange={setThemeMode}
                    pricePerHour={pricePerHour}
                    onPricePerHourChange={(value) => setPricePerHour(normalizePricePerHour(value))}
                    onOpenHistory={() => navigate('/history')}
                    onOpenProfileModal={(mode, profile) => {
                      blurActiveElement();
                      setProfileModal({ mode, profile });
                    }}
                    onCloseProfileModal={() => setProfileModal(null)}
                    onSaveProfile={handleSaveProfile}
                    onDeleteProfile={handleDeleteProfile}
                    onContinue={() => mutate((s) => Match.setSetupStep(s, 1))}
                    onResume={() => {
                      goHome();
                      mutate((s) => Match.resumeMatch(s));
                    }}
                    onWizardBack={() =>
                      mutate((s) => {
                        if (s.setup.step === 1) Match.setSetupStep(s, 0);
                        else Match.setSetupStep(s, s.setup.step - 1);
                      })
                    }
                    onWizardNext={() => mutate((s) => Match.setSetupStep(s, s.setup.step + 1))}
                    onStartMatch={() => {
                      goHome();
                      mutate((s) => Match.startMatch(s, loadProfiles()));
                    }}
                    onToggleProfile={(id) => {
                      mutate((s) => Match.toggleProfileSelection(s.setup, id));
                      syncSetupNames();
                    }}
                    onPickFormat={(format) => mutate((s) => Match.setMultiPlayerFormat(s.setup, format))}
                    onChangeFormat={() =>
                      mutate((s) => {
                        s.setup.multiPlayerFormat = null;
                        s.setup.gameModeId = null;
                        Match.setSetupStep(s, 1);
                      })
                    }
                    onPickMode={(modeId) => mutate((s) => { s.setup.gameModeId = modeId; })}
                    onPickTarget={(target) =>
                      mutate((s) => {
                        s.setup.targetScore = target;
                        s.setup.customTarget = null;
                      })
                    }
                    onBestOfChange={(bestOf) => mutate((s) => { s.setup.bestOf = bestOf; })}
                    onCustomTargetChange={(val) =>
                      mutate((s) => {
                        const v = Number(val);
                        if (v > 0) {
                          s.setup.customTarget = v;
                          s.setup.targetScore = v;
                        }
                      })
                    }
                    onSwapSeeds={(from, to) => mutate((s) => Match.swapTournamentSeeds(s.setup, from, to))}
                  />
                  <ProfileModal
                    open={Boolean(profileModal)}
                    mode={profileModal?.mode}
                    profile={profileModal?.profile}
                    onClose={() => setProfileModal(null)}
                    onSave={handleSaveProfile}
                    onDelete={handleDeleteProfile}
                  />
                </>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Box>
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        message={toast}
        onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </ThemeProvider>
  );
}
