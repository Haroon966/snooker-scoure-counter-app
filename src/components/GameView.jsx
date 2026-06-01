import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { alpha, keyframes } from '@mui/material/styles';
import { formatTwoPlayerLeadStatus } from '../rules/snooker.js';
import {
  getActivePreset,
  getScoreLeaderIndices,
  getMultiPlayerOutcome,
  isMatchPlayable,
  isTournamentMode,
  showManagePlayersButton,
} from '../state/match-state.js';
import {
  getFoulOptions,
  getScoringBallValues,
  isRaceMode,
  isTimedMode,
  isFrameMatchMode,
  isSnookerTableMode,
  getModeSummary,
} from '../rules/game-presets.js';
import { roundLabel, estimateTotalRounds } from '../rules/tournament.js';
import { formatTimer, getTimerDisplayMs, getGameStartedAt } from '../ui/timer.js';
import { calculateSessionCost, formatPkr } from '../utils/billing.js';
import { useAppTheme } from '../hooks/useAppTheme.js';
import PlayerAvatar, { PlayerCardBackdrop } from './PlayerAvatar.jsx';
import GlassPanel from './ui/GlassPanel.jsx';
import ScoringPad from './ui/ScoringPad.jsx';
import MatchWinnerOverlay, { isMatchFinished } from './MatchWinnerOverlay.jsx';
import AddPlayerToGameModal from './AddPlayerToGameModal.jsx';
import {
  getGridSlotCount,
  getPlayerGridLayout,
  shouldAddGridFiller,
} from '../utils/player-grid-layout.js';
import { formatCallLabel, getCallChipStyle, getCallPoints } from '../utils/call-history.js';

const scorePulseKeyframes = keyframes`
  0% { transform: scale(1); }
  40% { transform: scale(1.06); }
  100% { transform: scale(1); }
`;

const SAFE_BOTTOM = 'env(safe-area-inset-bottom, 0px)';
const SAFE_TOP = 'env(safe-area-inset-top, 0px)';
const SAFE_X = 'env(safe-area-inset-left, 0px)';
const SAFE_X_R = 'env(safe-area-inset-right, 0px)';
const GRID_GAP = 2;

function tournamentBanner(state) {
  const t = state.tournament;
  if (!t || t.status === 'complete') return null;
  const roster = t.roster;
  const label = roundLabel(t.round, estimateTotalRounds(roster.length));
  const match = t.matches.find(
    (m) => m.status === 'pending' && `${m.round}-${m.a}-${m.b}` === t.currentMatchId
  );
  if (match) return `${label} — ${roster[match.a].name} vs ${roster[match.b].name}`;
  return 'Tournament';
}

function tournamentBracketList(state) {
  const t = state.tournament;
  if (!t) return null;
  const roster = t.roster;
  return t.matches
    .filter((m) => m.b !== null)
    .map((m) => {
      const a = roster[m.a].name;
      const b = roster[m.b].name;
      if (m.status === 'complete') return `${a} vs ${b} — ${roster[m.winner].name} won`;
      if (m.status === 'pending' && `${m.round}-${m.a}-${m.b}` === t.currentMatchId) {
        return `${a} vs ${b} · playing now`;
      }
      return `${a} vs ${b}`;
    });
}

function PlayerCallHistoryStrip({ calls, preset, tokens, reducedMotion }) {
  const scrollRef = useRef(null);
  const callCount = calls?.length ?? 0;

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || callCount === 0) return;
    el.scrollTo({
      left: 0,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [callCount, reducedMotion]);

  if (!callCount) return null;

  const recentFirst = [...calls].reverse();

  return (
    <Box
      sx={{
        position: 'relative',
        borderTop: `1px solid ${alpha(tokens.color.border.default, 0.45)}`,
        background: alpha(tokens.color.bg.default, 0.35),
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 20,
          pointerEvents: 'none',
          background: `linear-gradient(to left, ${alpha(tokens.color.bg.default, 0.9)}, transparent)`,
        },
      }}
    >
      <Box
        ref={scrollRef}
        role="list"
        aria-label="Scoring history"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        sx={{
          display: 'flex',
          gap: 0.5,
          alignItems: 'center',
          px: 1,
          py: 0.625,
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory',
          scrollBehavior: reducedMotion ? 'auto' : 'smooth',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {recentFirst.map((entry, i) => {
          const { bg, color, border } = getCallChipStyle(entry);
          const origIndex = calls.length - 1 - i;
          const pts = getCallPoints(entry, preset);
          const isFoul = entry.type === 'foul';
          const label = isFoul ? `−${pts}` : `+${pts}`;
          const chipSize = label.length > 3 ? 28 : 24;

          return (
            <Box
              key={`${entry.type}-${entry.ball ?? 'f'}-${entry.points}-${origIndex}`}
              role="listitem"
              component="span"
              title={formatCallLabel(entry, preset)}
              sx={{
                flexShrink: 0,
                scrollSnapAlign: 'start',
                width: chipSize,
                height: chipSize,
                minWidth: chipSize,
                boxSizing: 'border-box',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                fontSize: label.length > 3 ? '0.5625rem' : '0.625rem',
                fontWeight: 800,
                lineHeight: 1,
                fontFamily: tokens.font.mono,
                bgcolor: bg,
                color,
                border,
              }}
            >
              {label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function PlayerScoreCard({
  player,
  index,
  state,
  preset,
  playable,
  onSetActivePlayer,
  onLongPressUndo,
  longPressUndo,
  scorePulseTick,
  reducedMotion,
  tokens,
  sx,
}) {
  const isActive = state.activePlayer === index;
  const longPressTimer = useRef(null);
  const [pressing, setPressing] = useState(false);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setPressing(false);
  };

  const handlePointerDown = () => {
    if (!longPressUndo || !playable || !onLongPressUndo) return;
    setPressing(true);
    longPressTimer.current = setTimeout(() => {
      onLongPressUndo();
      clearLongPress();
    }, 500);
  };

  const handleCardClick = () => {
    if (!playable) return;
    onSetActivePlayer(index);
  };

  const pulseActive = scorePulseTick > 0;

  return (
    <Box
      role="button"
      tabIndex={playable ? 0 : -1}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (playable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleCardClick();
        }
      }}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: playable ? 'pointer' : 'default',
        borderRadius: 0,
        bgcolor: tokens.color.bg.elevated,
        transition: 'box-shadow 200ms',
        boxShadow:
          isActive && playable
            ? `inset 0 0 0 3px ${tokens.color.baize.light}, 0 0 24px ${alpha(tokens.color.baize.main, 0.35)}`
            : 'none',
        '&:focus-visible': {
          outline: `2px solid ${tokens.color.gold.main}`,
          outlineOffset: -2,
        },
      }}
    >
      <PlayerCardBackdrop player={player} isActive={isActive && playable} tokens={tokens} />
      {isActive && playable && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 2,
            width: 22,
            height: 22,
            borderRadius: '50%',
            bgcolor: tokens.color.baize.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: tokens.shadow.sm,
          }}
        >
          <CheckIcon sx={{ fontSize: 14, color: '#fff' }} />
        </Box>
      )}
      <Stack
        sx={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          zIndex: 1,
          p: 1.25,
          justifyContent: 'center',
        }}
      >
        <Typography
          key={scorePulseTick}
          onPointerDown={handlePointerDown}
          onPointerUp={clearLongPress}
          onPointerLeave={clearLongPress}
          onPointerCancel={clearLongPress}
          sx={{
            ...sx.scoreDisplay,
            textAlign: 'center',
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
            lineHeight: 1,
            color: isActive ? tokens.color.text.primary : tokens.color.text.secondary,
            textShadow: isActive
              ? `0 0 40px ${tokens.color.baize.glow}, 0 2px 12px ${alpha(tokens.color.bg.default, 0.9)}`
              : `0 2px 10px ${alpha(tokens.color.bg.default, 0.85)}`,
            animation:
              pulseActive && !reducedMotion ? `${scorePulseKeyframes} 150ms ease-out` : 'none',
            userSelect: 'none',
            touchAction: pressing ? 'none' : 'manipulation',
          }}
        >
          {player.frameScore}
        </Typography>
      </Stack>
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          px: 1.25,
          py: 1,
          background: `linear-gradient(to top, ${alpha(tokens.color.bg.default, 0.55)} 0%, transparent 100%)`,
        }}
      >
        <Typography
          variant="body2"
          fontWeight={700}
          noWrap
          sx={{ fontFamily: tokens.font.heading, letterSpacing: '-0.01em' }}
        >
          {player.name}
        </Typography>
        {player.members?.length > 0 && (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ justifyContent: 'center', flexWrap: 'wrap', mt: 0.75 }}
          >
            {player.members.map((m, mi) => (
              <Box
                key={m.profileId ?? `${m.name}-${mi}`}
                title={m.name}
                sx={{ lineHeight: 0, opacity: 0.85 }}
              >
                <PlayerAvatar player={m} size="xs" />
              </Box>
            ))}
          </Stack>
        )}
      </Box>
      <PlayerCallHistoryStrip
        calls={player.callHistory}
        preset={preset}
        tokens={tokens}
        reducedMotion={reducedMotion}
      />
    </Box>
  );
}

function PlayerGridFillerCard({ tokens }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: 0,
        height: '100%',
        bgcolor: alpha(tokens.color.bg.elevated, 0.45),
        border: `1px dashed ${alpha(tokens.color.border.default, 0.6)}`,
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    />
  );
}

export default function GameView({
  state,
  stateRevision = 0,
  profiles,
  profilesVersion = 0,
  pricePerHour,
  scorePulseByPlayer,
  reducedMotion,
  longPressUndo,
  liveAnnouncement,
  onLeave,
  onAddPlayer,
  onRemovePlayer,
  onUndo,
  onLongPressUndo,
  onPoints,
  onFoulOpen,
  onFoulApply,
  onFoulClose,
  onEndMatchOpen,
  onEndMatchByScore,
  onEndMatchCancel,
  onEndMatchClose,
  onNextFrame,
  onSetActivePlayer,
  onTick,
  onGoHome,
}) {
  const { tokens, sx } = useAppTheme();
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isNarrow = useMediaQuery('(max-width: 600px)');
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const showManagePlayers = useMemo(
    () => showManagePlayersButton(state),
    [
      stateRevision,
      state.screen,
      state.tournament,
      state.game?.status,
      state.game?.modeId,
      state.setup?.gameModeId,
      state.setup?.multiPlayerFormat,
      state.setup?.selectedProfileIds?.length,
      state.players.length,
    ]
  );
  const preset = getActivePreset(state);
  const twoPlayer = state.players.length === 2;
  const playable = isMatchPlayable(state);
  const ballValues = getScoringBallValues(preset);
  const activePlayer = state.players[state.activePlayer];

  useEffect(() => {
    if (state.screen !== 'game') return undefined;
    const id = setInterval(() => onTick(), 1000);
    return () => clearInterval(id);
  }, [state.screen, onTick]);

  const completeMsg = getCompleteMessage(state, preset);
  const showWinnerOverlay = isMatchFinished(state) && completeMsg;
  const bracketLines = tournamentBracketList(state);
  const gameStartedAt = getGameStartedAt(state);
  const timerDisplay = isTimedMode(preset) && gameStartedAt ? formatTimer(getTimerDisplayMs(state)) : null;
  const sessionCost =
    isTimedMode(preset) && gameStartedAt
      ? formatPkr(calculateSessionCost(pricePerHour, getTimerDisplayMs(state)))
      : null;
  const { indices: leaderIndices, isTie: scoresTied } = getScoreLeaderIndices(state);
  const multiPlayer = state.players.length > 2;
  const multiOutcome = multiPlayer ? getMultiPlayerOutcome(state) : null;
  const scoreLeader = scoresTied ? null : state.players[leaderIndices[0]];
  const multiWinnerIndices = multiOutcome ? multiOutcome.winnerIndices : [];
  const multiLoserIndices = multiOutcome ? multiOutcome.loserIndices : [];
  const multiLoserNames = multiLoserIndices.map((i) => state.players[i]?.name).filter(Boolean);
  const frameMatch = isFrameMatchMode(preset) && twoPlayer && !state.tournament;
  const endMatchConfirmLabel = getEndMatchConfirmLabel({
    scoresTied,
    multiPlayer,
    scoreLeader,
    multiLoserNames,
  });
  const nextFrameLabel = getNextFrameLabel({ scoresTied, scoreLeader });

  let leadStatusLabel = null;
  if (isSnookerTableMode(preset) && twoPlayer && state.players.length === 2) {
    const [a, b] = state.players;
    if (a.frameScore !== b.frameScore) {
      const leader = a.frameScore > b.frameScore ? a : b;
      const opponent = a.frameScore > b.frameScore ? b : a;
      leadStatusLabel = formatTwoPlayerLeadStatus(leader.name, leader.frameScore, opponent.frameScore);
    }
  }

  const handleScore = (value) => {
    onPoints(state.activePlayer, value);
  };

  const handleFoul = () => {
    onFoulOpen(state.activePlayer);
  };

  const playerCount = state.players.length;
  const gridSlotCount = getGridSlotCount(playerCount);
  const grid = getPlayerGridLayout(gridSlotCount, {
    orientation: isLandscape ? 'landscape' : 'portrait',
  });
  const showGridFiller = shouldAddGridFiller(playerCount);
  const hasStatusBanners =
    (completeMsg && !showWinnerOverlay) ||
    (isTournamentMode(state) && tournamentBanner(state)) ||
    (isRaceMode(preset) && state.game.targetScore && !isTournamentMode(state)) ||
    (bracketLines && completeMsg) ||
    leadStatusLabel;

  const stickyChrome = {
    width: '100%',
    flexShrink: 0,
    m: 0,
    bgcolor: tokens.color.bg.default,
    borderColor: tokens.color.border.default,
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100dvh',
        maxHeight: '100dvh',
        m: 0,
        p: 0,
        overflow: 'hidden',
        overscrollBehaviorY: 'contain',
      }}
    >
      <Box
        component="div"
        aria-live="polite"
        aria-atomic="true"
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {liveAnnouncement}
      </Box>

      <Box
        component="header"
        sx={{
          ...stickyChrome,
          position: 'sticky',
          top: 0,
          zIndex: 20,
          pt: SAFE_TOP,
          pb: 0,
          borderBottom: `1px solid ${tokens.color.border.default}`,
          boxShadow: `0 4px 16px ${alpha(tokens.color.bg.default, 0.9)}`,
        }}
      >
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            alignItems: 'center',
            minHeight: 44,
            py: 0.5,
            pl: `calc(4px + ${SAFE_X})`,
            pr: `calc(4px + ${SAFE_X_R})`,
          }}
        >
          <IconButton
            onClick={onLeave}
            aria-label="Leave match"
            size="small"
            sx={{ color: 'text.secondary', width: 40, height: 40, flexShrink: 0 }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1, textAlign: 'center', minWidth: 0, px: 0.5 }}>
            <Typography
              variant="body2"
              fontWeight={700}
              noWrap
              sx={{ fontFamily: tokens.font.heading, lineHeight: 1.3 }}
            >
              {getModeSummary(state)}
            </Typography>
            {(timerDisplay || sessionCost) && (
              <Typography
                variant="caption"
                noWrap
                sx={{
                  display: 'block',
                  lineHeight: 1.3,
                  color: timerDisplay ? tokens.color.gold.main : 'text.secondary',
                  fontFamily: timerDisplay ? tokens.font.mono : undefined,
                  fontWeight: timerDisplay ? 700 : 500,
                }}
              >
                {timerDisplay}
                {timerDisplay && sessionCost ? ` · ${sessionCost}` : sessionCost}
              </Typography>
            )}
          </Box>
          {showManagePlayers ? (
            <IconButton
              onClick={() => setAddPlayerOpen(true)}
              aria-label="Manage players"
              size="small"
              sx={{ color: tokens.color.baize.light, width: 40, height: 40, flexShrink: 0 }}
            >
              <PersonAddOutlinedIcon fontSize="small" />
            </IconButton>
          ) : (
            <Box sx={{ width: 40, flexShrink: 0 }} aria-hidden />
          )}
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          opacity: playable ? 1 : 0.5,
          transition: 'opacity 250ms',
        }}
      >
        {hasStatusBanners && (
          <Box
            sx={{
              flexShrink: 0,
              maxHeight: '38%',
              overflowY: 'auto',
              px: 1.5,
              py: 0.5,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {completeMsg && !showWinnerOverlay && (
              <Alert
                severity="success"
                icon={<EmojiEventsOutlinedIcon />}
                sx={{ mb: 1, borderRadius: `${tokens.radius.md}px` }}
              >
                {completeMsg}
              </Alert>
            )}

            {isTournamentMode(state) && tournamentBanner(state) && (
              <Alert severity="info" sx={{ mb: 1, borderRadius: `${tokens.radius.md}px` }}>
                {tournamentBanner(state)}
              </Alert>
            )}

            {isRaceMode(preset) && state.game.targetScore && !isTournamentMode(state) && (
              <GlassPanel
                padding={1.25}
                sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Typography variant="body2" color="text.secondary">
                  Race to {state.game.targetScore}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: tokens.color.gold.main }}>
                  {state.players.reduce((a, b) => (a.frameScore >= b.frameScore ? a : b)).name} leads
                </Typography>
              </GlassPanel>
            )}

            {bracketLines && completeMsg && (
              <GlassPanel padding={1.25} sx={{ mb: 1 }}>
                <Typography sx={{ ...sx.labelCaps, mb: 1 }}>Bracket</Typography>
                <Stack component="ol" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
                  {bracketLines.map((line, i) => (
                    <Typography key={i} component="li" variant="body2" color="text.secondary">
                      {line}
                    </Typography>
                  ))}
                </Stack>
              </GlassPanel>
            )}

            {leadStatusLabel && (
              <GlassPanel padding={1.25} sx={{ mb: 1 }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ fontFamily: tokens.font.heading, color: tokens.color.baize.light }}
                >
                  {leadStatusLabel}
                </Typography>
              </GlassPanel>
            )}
          </Box>
        )}

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
            gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
            gap: `${GRID_GAP}px`,
            p: `${GRID_GAP}px`,
            bgcolor: tokens.color.bg.default,
            boxSizing: 'border-box',
          }}
        >
          {state.players.map((p, i) => (
            <PlayerScoreCard
              key={i}
              player={p}
              index={i}
              state={state}
              preset={preset}
              playable={playable}
              onSetActivePlayer={onSetActivePlayer}
              onLongPressUndo={onLongPressUndo}
              longPressUndo={longPressUndo}
              scorePulseTick={scorePulseByPlayer?.[i] ?? 0}
              reducedMotion={reducedMotion}
              tokens={tokens}
              sx={sx}
            />
          ))}
          {showGridFiller && <PlayerGridFillerCard tokens={tokens} />}
        </Box>
      </Box>

      <Box
        component="footer"
        sx={{
          ...stickyChrome,
          position: 'sticky',
          bottom: 0,
          zIndex: 20,
          pt: 0,
          pb: SAFE_BOTTOM,
          borderTop: `1px solid ${tokens.color.border.default}`,
          boxShadow: `0 -8px 24px ${alpha(tokens.color.bg.default, 0.92)}`,
        }}
      >
        <Box
          sx={{
            py: 1,
            pl: `calc(12px + ${SAFE_X})`,
            pr: `calc(12px + ${SAFE_X_R})`,
            borderBottom: `1px solid ${tokens.color.border.default}`,
          }}
        >
          <ScoringPad
            ballValues={ballValues}
            preset={preset}
            playable={playable}
            activePlayerName={activePlayer?.name}
            onScore={handleScore}
            onFoul={handleFoul}
          />
        </Box>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            flexWrap: 'wrap',
            alignItems: 'stretch',
            py: 1,
            pl: `calc(12px + ${SAFE_X})`,
            pr: `calc(12px + ${SAFE_X_R})`,
            m: 0,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<UndoOutlinedIcon />}
            disabled={!playable}
            onClick={onUndo}
            aria-label="Undo last action"
            sx={{ minHeight: 48, flex: { xs: '1 1 45%', sm: '0 0 auto' }, borderRadius: `${tokens.radius.md}px`, m: 0 }}
          >
            Undo
          </Button>
          <Button
            variant="outlined"
            color="error"
            disabled={!playable}
            onClick={onEndMatchCancel}
            sx={{ minHeight: 48, flex: 1, borderRadius: `${tokens.radius.md}px`, m: 0 }}
          >
            Cancel match
          </Button>
          <Button
            variant="contained"
            color="secondary"
            disabled={!playable}
            onClick={onEndMatchOpen}
            sx={{ minHeight: 48, flex: 1, borderRadius: `${tokens.radius.md}px`, m: 0 }}
          >
            End match
          </Button>
        </Stack>
      </Box>

      <AddPlayerToGameModal
        open={addPlayerOpen}
        state={state}
        profiles={profiles ?? []}
        profilesVersion={profilesVersion}
        onClose={() => setAddPlayerOpen(false)}
        onAdd={onAddPlayer}
        onRemove={onRemovePlayer}
      />

      <Dialog open={state.foulPickerOpen} onClose={onFoulClose} maxWidth="xs" fullWidth disableRestoreFocus>
        <DialogTitle sx={{ fontFamily: tokens.font.heading }}>Foul points</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
            {getFoulOptions(preset).map((pts, idx) => (
              <Button
                key={pts}
                variant="contained"
                color="error"
                autoFocus={idx === 0}
                onClick={() => onFoulApply(pts)}
                sx={{ minHeight: 48, fontSize: '1.1rem', fontWeight: 700 }}
              >
                {pts}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: SAFE_BOTTOM }}>
          <Button onClick={onFoulClose} fullWidth variant="outlined" sx={{ minHeight: 48 }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={state.endMatchPickerOpen}
        onClose={onEndMatchClose}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        disableRestoreFocus
        PaperProps={{
          sx: {
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: '100%' },
            maxHeight: {
              xs: `calc(100dvh - 16px - ${SAFE_TOP} - ${SAFE_BOTTOM})`,
              sm: 'min(90vh, 640px)',
            },
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: tokens.font.heading,
            fontSize: isNarrow ? '1.1rem' : undefined,
            py: isNarrow ? 1.25 : undefined,
          }}
        >
          End match
        </DialogTitle>
        <DialogContent
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            px: { xs: 1.5, sm: 3 },
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, lineHeight: 1.5, wordBreak: 'break-word' }}
          >
            {frameMatch
              ? scoresTied
                ? 'Scores are tied — pick who won the frame or end the match as a tie.'
                : 'Award this frame to the leader, or end the whole match.'
              : multiPlayer
                ? 'Lowest score loses. All other players win.'
                : scoresTied
                  ? 'Scores are tied — match will end as a tie.'
                  : 'Winner is the player with the highest score.'}
          </Typography>
          <Stack spacing={1} sx={{ mb: 1 }}>
            {state.players.map((p, i) => {
              const isLeader = !multiPlayer && !scoresTied && leaderIndices[0] === i;
              const isWinner = multiPlayer && multiWinnerIndices.includes(i);
              const isLoser = multiPlayer && multiLoserIndices.includes(i);
              const rowBorder = isLoser
                ? tokens.color.status.error
                : isLeader || isWinner
                  ? tokens.color.baize.light
                  : tokens.color.border.default;
              const rowBg = isLoser
                ? alpha(tokens.color.status.error, 0.1)
                : isLeader || isWinner
                  ? alpha(tokens.color.baize.main, 0.12)
                  : 'transparent';

              return (
                <Stack
                  key={i}
                  direction="row"
                  spacing={1.25}
                  sx={{
                    alignItems: 'center',
                    py: 1,
                    px: 1.25,
                    borderRadius: `${tokens.radius.md}px`,
                    border: `1px solid ${rowBorder}`,
                    bgcolor: rowBg,
                  }}
                >
                  <PlayerAvatar player={p} size="sm" ring={isLeader || isWinner} />
                  <Typography
                    fontWeight={isLeader || isWinner || isLoser ? 700 : 500}
                    noWrap
                    sx={{ flex: 1, minWidth: 0 }}
                  >
                    {p.name}
                  </Typography>
                  <Stack spacing={0.25} sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
                    <Typography
                      fontWeight={700}
                      sx={{
                        fontVariantNumeric: 'tabular-nums',
                        fontFamily: tokens.font.mono,
                        color: isLoser
                          ? tokens.color.status.error
                          : isWinner || isLeader
                            ? tokens.color.baize.light
                            : 'inherit',
                      }}
                    >
                      {p.frameScore}
                    </Typography>
                    {frameMatch && p.framesWon > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {p.framesWon} frame{p.framesWon === 1 ? '' : 's'} won
                      </Typography>
                    )}
                  </Stack>
                  {(isLeader || isWinner) && (
                    <EmojiEventsOutlinedIcon sx={{ color: tokens.color.gold.main, fontSize: 20 }} />
                  )}
                  {isLoser && (
                    <TrendingDownOutlinedIcon sx={{ color: tokens.color.status.error, fontSize: 20 }} />
                  )}
                </Stack>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 1,
            px: { xs: 1.5, sm: 2 },
            pt: 1,
            pb: `calc(12px + ${SAFE_BOTTOM})`,
            flexShrink: 0,
          }}
        >
          {frameMatch && (
            <Button
              variant="contained"
              fullWidth
              autoFocus
              disabled={scoresTied}
              onClick={onNextFrame}
              sx={{
                minHeight: 48,
                whiteSpace: 'normal',
                lineHeight: 1.25,
                py: 1.25,
                fontSize: isNarrow ? '0.875rem' : undefined,
              }}
            >
              {nextFrameLabel}
            </Button>
          )}
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            autoFocus={!frameMatch}
            onClick={onEndMatchByScore}
            sx={{
              minHeight: 48,
              whiteSpace: 'normal',
              lineHeight: 1.25,
              py: 1.25,
              fontSize: isNarrow ? '0.875rem' : undefined,
            }}
          >
            {endMatchConfirmLabel}
          </Button>
          <Button variant="outlined" color="error" fullWidth onClick={onEndMatchCancel} sx={{ minHeight: 48 }}>
            Cancel match
          </Button>
          <Button onClick={onEndMatchClose} sx={{ color: 'text.secondary', minHeight: 44 }}>
            Back
          </Button>
        </DialogActions>
      </Dialog>

      {showWinnerOverlay && (
        <MatchWinnerOverlay
          state={state}
          preset={preset}
          message={completeMsg}
          onGoHome={onGoHome}
        />
      )}
    </Box>
  );
}

function getNextFrameLabel({ scoresTied, scoreLeader }) {
  if (scoresTied) return 'Next frame — scores tied';
  return `Next frame — ${scoreLeader?.name ?? 'Player'} wins`;
}

function getEndMatchConfirmLabel({ scoresTied, multiPlayer, scoreLeader, multiLoserNames }) {
  if (multiPlayer) {
    if (multiLoserNames.length === 1) {
      return `End match — ${multiLoserNames[0]} loses`;
    }
    return `End match — ${multiLoserNames.join(', ')} lose`;
  }
  if (scoresTied) return 'End match — tie';
  return `End match — ${scoreLeader?.name ?? 'Player'} wins`;
}

function getCompleteMessage(state, preset) {
  if (state.tournament?.status === 'complete' && state.tournament.championIdx !== null) {
    const champion = state.tournament.roster[state.tournament.championIdx];
    return `Tournament over — ${champion.name} wins!`;
  }
  if (state.game.status !== 'time_up' && state.match.status !== 'complete') return null;
  if (state.game.tie) return 'Match tied';

  const winners = state.game.winnerIndices ?? [];
  const losers = state.game.loserIndices ?? [];

  if (losers.length > 0 && state.players.length > 2) {
    const loserNames = losers.map((i) => state.players[i]?.name).filter(Boolean).join(', ');
    const loserStats = losers.map((i) => state.players[i]?.frameScore ?? 0);
    if (losers.length === 1) {
      return `Match over — ${loserNames} lost with ${loserStats[0]} pts`;
    }
    if (winners.length === 0) {
      return `Match over — ${loserNames} lost — tied at ${loserStats[0]} pts`;
    }
    return `Match over — ${loserNames} lost`;
  }

  if (isTimedMode(preset) && state.match.status === 'complete') {
    const ranked = [...state.players].sort((a, b) => b.frameScore - a.frameScore);
    const top = ranked[0];
    return winners.length > 1
      ? `Match over — tie at ${top.frameScore}!`
      : `Match over — ${top.name} wins with ${top.frameScore}!`;
  }
  if (winners.length > 0) {
    const isFrameMatch = !isRaceMode(preset) && !isTimedMode(preset);
    const names = winners.map((i) => state.players[i].name).join(', ');
    if (isFrameMatch && winners.length === 1 && state.players.length === 2) {
      const w = winners[0];
      const opp = 1 - w;
      return `Match over — ${state.players[w].name} wins ${state.players[w].framesWon}–${state.players[opp].framesWon}!`;
    }
    return `Match over — ${names} wins!`;
  }
  return null;
}
