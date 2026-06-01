import { useCallback, useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from './theme/muiTheme.js';
import { THEME_META_COLORS } from './theme/designTokens.js';
import { loadSettings, saveSettings, normalizePricePerHour } from './storage/settings.js';
import { useMatchApp } from './hooks/useMatchApp.js';
import { useWakeLock } from './hooks/useWakeLock.js';
import { useReducedMotion } from './hooks/useReducedMotion.js';
import { useInstallPrompt } from './hooks/useInstallPrompt.js';
import HomeView from './components/HomeView.jsx';
import GameView from './components/GameView.jsx';
import HistoryView from './components/HistoryView.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import ConfirmDialog from './components/ui/ConfirmDialog.jsx';
import {
  loadProfiles,
  addProfile,
  updateProfile,
  deleteProfile,
} from './storage/profiles.js';
import { haptic, setHapticEnabled } from './utils/haptic.js';
import { blurActiveElement } from './utils/dialogFocus.js';

export default function App() {
  const navigate = useNavigate();
  const [profileModal, setProfileModal] = useState(null);
  const initialSettings = useMemo(() => loadSettings(), []);
  const [themeMode, setThemeMode] = useState(() => initialSettings.themeMode);
  const [pricePerHour, setPricePerHour] = useState(() => initialSettings.pricePerHour);
  const [hapticFeedback, setHapticFeedback] = useState(() => initialSettings.hapticFeedback);
  const [keepScreenAwake, setKeepScreenAwake] = useState(() => initialSettings.keepScreenAwake);
  const [longPressUndo, setLongPressUndo] = useState(() => initialSettings.longPressUndo);
  const [installBannerDismissed, setInstallBannerDismissed] = useState(
    () => initialSettings.installBannerDismissed
  );
  const [historyVersion, setHistoryVersion] = useState(0);
  const [, setTimerTick] = useState(0);
  const [gameConfirm, setGameConfirm] = useState(null);
  const [scorePulseByPlayer, setScorePulseByPlayer] = useState([]);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [swUpdatePending, setSwUpdatePending] = useState(false);

  const reducedMotion = useReducedMotion();
  const { canInstall, promptInstall } = useInstallPrompt();

  const {
    state,
    revision: stateRevision,
    profiles,
    profilesVersion,
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
  const inGame = state.screen === 'game';

  useWakeLock(inGame && keepScreenAwake);

  useEffect(() => {
    setHapticEnabled(hapticFeedback);
  }, [hapticFeedback]);

  useEffect(() => {
    saveSettings({
      themeMode,
      pricePerHour,
      hapticFeedback,
      keepScreenAwake,
      longPressUndo,
      installBannerDismissed,
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_META_COLORS[themeMode]);
  }, [themeMode, pricePerHour, hapticFeedback, keepScreenAwake, longPressUndo, installBannerDismissed]);

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
              setSwUpdatePending(true);
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

  const scoreHaptic = useCallback(() => {
    if (hapticFeedback) haptic();
  }, [hapticFeedback]);

  const handleSaveProfile = useCallback(
    ({ mode, profileId, name, avatar }) => {
      const all = loadProfiles();
      const addToGame = profileModal?.addToGame && state.screen === 'game';
      let createdProfile = null;

      if (mode === 'edit' && profileId) {
        const result = updateProfile(all, profileId, { name, avatar });
        if (!result.ok) {
          if (result.reason === 'duplicate') {
            showToast('A player with that name already exists');
          } else {
            showToast('Could not update player');
          }
          return;
        }
      } else {
        const created = addProfile(all, name, avatar);
        if (created) {
          createdProfile = created;
          mutate((s) => s.setup.selectedProfileIds.push(created.id));
        } else {
          showToast('A player with that name already exists');
          return;
        }
      }
      setProfileModal(null);
      refreshProfiles();
      mutate((s) => {
        const list = loadProfiles();
        Match.syncPlayerNamesFromSelection(s.setup, list);
        Match.syncPlayersFromProfiles(s, list);
        if (addToGame && createdProfile) {
          const added = Match.addPlayerToGame(s, {
            name: createdProfile.name,
            avatar: createdProfile.avatar ?? null,
            profileId: createdProfile.id,
          });
          if (!added.ok && added.reason === 'duplicate') {
            showToast('That player is already in this match');
          } else if (added.ok) {
            showToast(`${createdProfile.name} joined the match`);
          }
        }
      });
    },
    [mutate, refreshProfiles, showToast, Match, profileModal?.addToGame, state.screen]
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

  const handleInstall = useCallback(async () => {
    const accepted = await promptInstall();
    if (accepted) setInstallBannerDismissed(true);
  }, [promptInstall]);

  const dismissInstallBanner = useCallback(() => {
    setInstallBannerDismissed(true);
  }, []);

  const showInstallBanner = canInstall && !installBannerDismissed && !inGame;

  const confirmLeaveMatch = useCallback(() => {
    mutate((s) => Match.leaveMatch(s));
    goHome();
    setGameConfirm(null);
  }, [Match, goHome, mutate]);

  const confirmCancelMatch = useCallback(() => {
    mutate((s) => Match.cancelMatch(s));
    goHome();
    setGameConfirm(null);
  }, [Match, goHome, mutate]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100dvh',
          bgcolor: 'background.default',
          m: 0,
          p: 0,
          ...(inGame
            ? { height: '100dvh', overflow: 'hidden' }
            : { minHeight: '100dvh' }),
        }}
      >
        {inGame ? (
          <GameView
            state={state}
            stateRevision={stateRevision}
            profiles={profiles}
            profilesVersion={profilesVersion}
            pricePerHour={pricePerHour}
            scorePulseByPlayer={scorePulseByPlayer}
            reducedMotion={reducedMotion}
            longPressUndo={longPressUndo}
            liveAnnouncement={liveAnnouncement}
            onLeave={() => setGameConfirm('leave')}
            onUndo={() => {
              mutate((s) => Match.undo(s));
              showToast('Undone');
            }}
            onLongPressUndo={() => {
              mutate((s) => Match.undo(s));
              showToast('Undone');
              scoreHaptic();
            }}
            onPoints={(player, points) => {
              mutate((s) => {
                Match.addPoints(s, player, points);
                const p = s.players[player];
                if (p) {
                  setLiveAnnouncement(`${p.name} ${p.frameScore}, break ${p.currentBreak}`);
                }
                setScorePulseByPlayer((prev) => {
                  const next = [...prev];
                  next[player] = Date.now();
                  return next;
                });
              });
              scoreHaptic();
            }}
            onFoulOpen={(player) => {
              blurActiveElement();
              mutate((s) => Match.openFoulPicker(s, player));
            }}
            onFoulApply={(pts) => {
              mutate((s) => Match.applyFoul(s, s.foulByPlayer, pts));
              scoreHaptic();
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
              scoreHaptic();
            }}
            onEndMatchCancel={() => setGameConfirm('cancel')}
            onEndMatchClose={() => mutate((s) => Match.closeEndMatchPicker(s))}
            onNextFrame={() => {
              mutate((s) => Match.nextFrameByScore(s));
              scoreHaptic();
            }}
            onSetActivePlayer={(i) => {
              mutate((s) => Match.setActivePlayer(s, i));
            }}
            onAddPlayer={(payload) => {
              const trimmed = payload.name?.trim();
              if (!trimmed) return { ok: false, reason: 'empty' };

              const all = loadProfiles();
              let profile = payload.profileId
                ? all.find((p) => p.id === payload.profileId)
                : all.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());

              if (!profile) {
                profile = addProfile(all, trimmed, payload.avatar ?? null);
                if (!profile) {
                  showToast('A player with that name already exists in your list');
                  return { ok: false, reason: 'profile_duplicate' };
                }
                refreshProfiles();
              }

              let result = { ok: false };
              mutate((s) => {
                if (!s.setup.selectedProfileIds.includes(profile.id)) {
                  s.setup.selectedProfileIds.push(profile.id);
                }
                result = Match.addPlayerToGame(s, {
                  name: profile.name,
                  avatar: profile.avatar ?? null,
                  profileId: profile.id,
                  teamIndex: payload.teamIndex ?? 0,
                });
              });

              if (result.ok) {
                showToast(`${profile.name} joined the match`);
              } else if (result.reason === 'duplicate') {
                showToast('That player is already in this match');
              } else if (result.reason === 'not_allowed') {
                showToast('Cannot add more players for this mode');
              }
              return result;
            }}
            onRemovePlayer={(playerIndex, memberIndex = null) => {
              let result = { ok: false };
              let removedName = '';
              mutate((s) => {
                result = Match.removePlayerFromGame(s, playerIndex, memberIndex);
                if (result.ok) {
                  removedName = result.name;
                  const profileId =
                    result.profileId ??
                    loadProfiles().find(
                      (p) => p.name.trim().toLowerCase() === removedName.trim().toLowerCase()
                    )?.id;
                  Match.unlinkProfileFromMatchSetup(s, profileId);
                }
              });
              if (result.ok) {
                showToast(`${removedName} left the match`);
              } else if (result.reason === 'not_allowed') {
                showToast('Need at least 2 players in the match');
              }
              return result;
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
                    hapticFeedback={hapticFeedback}
                    onHapticFeedbackChange={setHapticFeedback}
                    keepScreenAwake={keepScreenAwake}
                    onKeepScreenAwakeChange={setKeepScreenAwake}
                    longPressUndo={longPressUndo}
                    onLongPressUndoChange={setLongPressUndo}
                    showInstallBanner={showInstallBanner}
                    onInstallApp={handleInstall}
                    onDismissInstallBanner={dismissInstallBanner}
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
                    onSetTeamMode={(enabled) =>
                      mutate((s) => Match.setTeamMode(s.setup, enabled))
                    }
                    onAssignToTeam={(profileId, teamIndex) => {
                      mutate((s) => Match.assignProfileToTeam(s.setup, profileId, teamIndex));
                      syncSetupNames();
                    }}
                    onRemoveFromTeam={(profileId) => {
                      mutate((s) => Match.removeProfileFromTeam(s.setup, profileId));
                      syncSetupNames();
                    }}
                    onRenameTeam={(teamIndex, name) =>
                      mutate((s) => Match.renameTeam(s.setup, teamIndex, name))
                    }
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

      <ConfirmDialog
        open={gameConfirm === 'leave'}
        title="Leave match?"
        message="Progress is saved — you can resume from home."
        confirmLabel="Leave"
        onConfirm={confirmLeaveMatch}
        onCancel={() => setGameConfirm(null)}
      />
      <ConfirmDialog
        open={gameConfirm === 'cancel'}
        title="Cancel match?"
        message="This will discard the current match and return home."
        confirmLabel="Cancel match"
        destructive
        onConfirm={confirmCancelMatch}
        onCancel={() => setGameConfirm(null)}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={swUpdatePending ? null : 4000}
        message={toast}
        onClose={() => {
          setToast('');
          if (!swUpdatePending) return;
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 'env(safe-area-inset-bottom)' }}
        action={
          swUpdatePending ? (
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setSwUpdatePending(false);
                setToast('');
                window.location.reload();
              }}
            >
              Refresh
            </Button>
          ) : null
        }
      />
    </ThemeProvider>
  );
}
