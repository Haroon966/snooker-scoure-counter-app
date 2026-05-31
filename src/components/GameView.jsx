import { useEffect } from 'react';
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
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { alpha } from '@mui/material/styles';
import { formatTwoPlayerLeadStatus, BALL_LABELS } from '../rules/snooker.js';
import {
  getActivePreset,
  getScoreLeaderIndices,
  getMultiPlayerOutcome,
  isMatchPlayable,
  isTournamentMode,
} from '../state/match-state.js';
import {
  getFoulOptions,
  getScoringBallValues,
  getBallPoints,
  isRaceMode,
  isTimedMode,
  isSnookerTableMode,
  getModeSummary,
} from '../rules/game-presets.js';
import { roundLabel, estimateTotalRounds } from '../rules/tournament.js';
import { formatTimer, getTimerDisplayMs, formatGameStartTime, getGameStartedAt } from '../ui/timer.js';
import { calculateSessionCost, formatPkr } from '../utils/billing.js';
import { BALL_COLORS } from '../theme/muiTheme.js';
import { useAppTheme } from '../hooks/useAppTheme.js';
import PlayerAvatar from './PlayerAvatar.jsx';
import GlassPanel from './ui/GlassPanel.jsx';
import MatchWinnerOverlay, { isMatchFinished } from './MatchWinnerOverlay.jsx';

function getBallButtonStyle(value) {
  const bg = BALL_COLORS[value] ?? '#666666';
  const color = value === 2 ? '#1A1A1A' : '#FFFFFF';
  const border =
    value === 7 ? '2px solid rgba(255, 255, 255, 0.28)' : '2px solid rgba(255, 255, 255, 0.12)';

  return { bg, color, border };
}

function BallButton({ value, preset, onClick, disabled, compact }) {
  const label = BALL_LABELS[value];
  const pts = getBallPoints(preset, value);
  const { bg, color, border } = getBallButtonStyle(value);
  const size = compact ? 56 : 52;
  return (
    <Button
      variant="contained"
      disableElevation
      disabled={disabled}
      onClick={() => onClick(value)}
      sx={{
        minWidth: size,
        width: compact ? size : undefined,
        height: size,
        minHeight: size,
        flex: compact ? '0 0 auto' : 1,
        color,
        borderRadius: '50%',
        border,
        bgcolor: bg,
        background: bg,
        backgroundImage: 'none',
        boxShadow: `0 4px 14px ${alpha(bg, 0.55)}, inset 0 -2px 4px ${alpha('#000', 0.18)}`,
        transition: 'filter 150ms, transform 150ms, box-shadow 150ms',
        flexDirection: 'column',
        p: 0,
        fontSize: 10,
        cursor: disabled ? 'default' : 'pointer',
        '&.Mui-disabled': {
          bgcolor: bg,
          background: bg,
          backgroundImage: 'none',
          color,
          opacity: 0.45,
        },
        '&:hover': {
          bgcolor: bg,
          background: bg,
          backgroundImage: 'none',
          filter: 'brightness(1.08)',
          boxShadow: `0 6px 18px ${alpha(bg, 0.6)}, inset 0 -2px 4px ${alpha('#000', 0.18)}`,
        },
        '&:active:not(:disabled)': { transform: 'scale(0.92)' },
      }}
    >
      <span style={{ fontWeight: 800, lineHeight: 1 }}>{label}</span>
      <Typography component="span" variant="caption" sx={{ opacity: 0.9, fontSize: '0.6rem', lineHeight: 1 }}>
        +{pts}
      </Typography>
    </Button>
  );
}

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

function PlayerScoreCard({
  player,
  index,
  state,
  twoPlayer,
  playable,
  preset,
  ballValues,
  onPoints,
  onFoulOpen,
  onSetActivePlayer,
  tokens,
  sx,
}) {
  const isActive = state.activePlayer === index;
  const showBallPad = twoPlayer;

  return (
    <GlassPanel
      active={isActive && playable}
      onClick={() => playable && !twoPlayer && onSetActivePlayer(index)}
      padding={twoPlayer ? 1.5 : 1.25}
      sx={{
        flex: twoPlayer ? 1 : '0 0 auto',
        minWidth: twoPlayer ? 0 : 150,
        cursor: !twoPlayer && playable ? 'pointer' : 'default',
        transition: 'background-color 250ms, border-color 250ms, box-shadow 250ms',
        ...(isActive &&
          playable && {
            bgcolor: alpha(tokens.color.baize.main, 0.2),
            backgroundImage: `linear-gradient(145deg, ${alpha(tokens.color.baize.light, 0.28)} 0%, ${alpha(tokens.color.baize.dark, 0.14)} 100%)`,
            border: `2px solid ${tokens.color.baize.light}`,
            boxShadow: `${tokens.shadow.glow}, inset 0 1px 0 ${alpha('#fff', 0.1)}`,
          }),
      }}
    >
      <Stack spacing={1} sx={{ alignItems: 'center' }}>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <PlayerAvatar player={player} size={twoPlayer ? 'lg' : 'md'} ring={isActive} />
          {isActive && playable && (
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 22,
                height: 22,
                borderRadius: '50%',
                bgcolor: tokens.color.baize.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${tokens.color.bg.default}`,
                boxShadow: tokens.shadow.sm,
              }}
            >
              <CheckIcon sx={{ fontSize: 14, color: '#fff' }} />
            </Box>
          )}
        </Box>
        <Typography
          variant="body2"
          fontWeight={700}
          noWrap
          sx={{ maxWidth: '100%', fontFamily: tokens.font.heading, letterSpacing: '-0.01em' }}
        >
          {player.name}
        </Typography>
        <Typography
          sx={{
            ...sx.scoreDisplay,
            fontSize: { xs: '3.25rem', sm: '4rem' },
            color: isActive ? tokens.color.text.primary : tokens.color.text.secondary,
            textShadow: isActive ? `0 0 40px ${tokens.color.baize.glow}` : 'none',
          }}
        >
          {player.frameScore}
        </Typography>
        <Stack direction="row" spacing={2}>
          <StatPill label="Break" value={player.currentBreak} tokens={tokens} />
          {twoPlayer && <StatPill label="Best" value={player.highestBreak} tokens={tokens} />}
        </Stack>
      </Stack>

      {showBallPad && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {ballValues.map((v) => (
              <BallButton
                key={v}
                value={v}
                preset={preset}
                compact
                disabled={!playable}
                onClick={() => onPoints(index, v)}
              />
            ))}
          </Box>
          <Button
            variant="outlined"
            color="error"
            size="small"
            disabled={!playable}
            onClick={() => onFoulOpen(index)}
            sx={{ minHeight: 48, borderRadius: `${tokens.radius.md}px` }}
          >
            Foul
          </Button>
        </Stack>
      )}
    </GlassPanel>
  );
}

function StatPill({ label, value, tokens }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.625rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', fontFamily: tokens.font.mono }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function GameView({
  state,
  pricePerHour,
  onLeave,
  onUndo,
  onPoints,
  onFoulOpen,
  onFoulApply,
  onFoulClose,
  onEndMatchOpen,
  onEndMatchByScore,
  onEndMatchCancel,
  onEndMatchClose,
  onAwardFrame,
  onSetActivePlayer,
  onTick,
  onGoHome,
}) {
  const { tokens, sx } = useAppTheme();
  const preset = getActivePreset(state);
  const twoPlayer = state.players.length === 2;
  const playable = isMatchPlayable(state);
  const ballValues = getScoringBallValues(preset);

  useEffect(() => {
    if (state.screen !== 'game') return undefined;
    const id = setInterval(() => onTick(), 1000);
    return () => clearInterval(id);
  }, [state.screen, onTick]);

  const completeMsg = getCompleteMessage(state, preset);
  const showWinnerOverlay = isMatchFinished(state) && completeMsg;
  const bracketLines = tournamentBracketList(state);
  const gameStartedAt = getGameStartedAt(state);
  const startTimeLabel = formatGameStartTime(gameStartedAt);
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
  const endMatchConfirmLabel = getEndMatchConfirmLabel({
    scoresTied,
    multiPlayer,
    scoreLeader,
    multiLoserNames,
  });

  let leadStatusLabel = null;
  if (isSnookerTableMode(preset) && twoPlayer && state.players.length === 2) {
    const [a, b] = state.players;
    if (a.frameScore !== b.frameScore) {
      const leader = a.frameScore > b.frameScore ? a : b;
      const opponent = a.frameScore > b.frameScore ? b : a;
      leadStatusLabel = formatTwoPlayerLeadStatus(leader.name, leader.frameScore, opponent.frameScore);
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', pb: 1 }}>
      <Box sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
        <GlassPanel padding={1}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <IconButton onClick={onLeave} aria-label="Leave match" size="small" sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              <Typography variant="caption" sx={{ ...sx.labelCaps, display: 'block', mb: 0.25 }}>
                Live match
              </Typography>
              <Typography variant="body2" fontWeight={700} noWrap sx={{ fontFamily: tokens.font.heading }}>
                {getModeSummary(state)}
              </Typography>
              {startTimeLabel && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                  Started {startTimeLabel}
                </Typography>
              )}
              {timerDisplay && (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center', justifyContent: 'center', mt: 0.25, flexWrap: 'wrap' }}
                >
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <TimerOutlinedIcon sx={{ fontSize: 14, color: tokens.color.gold.main }} />
                    <Typography
                      variant="caption"
                      sx={{ color: tokens.color.gold.main, fontWeight: 700, fontFamily: tokens.font.mono }}
                    >
                      {timerDisplay}
                    </Typography>
                  </Stack>
                  {sessionCost && (
                    <Typography variant="caption" sx={{ color: tokens.color.text.secondary, fontWeight: 600 }}>
                      · {sessionCost}
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>
            <Button size="small" onClick={onUndo} sx={{ color: 'text.secondary', minWidth: 0, borderRadius: `${tokens.radius.sm}px` }}>
              <UndoOutlinedIcon fontSize="small" />
            </Button>
          </Stack>
        </GlassPanel>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 1.5,
          py: 0.5,
          opacity: playable ? 1 : 0.5,
          transition: 'opacity 250ms',
        }}
      >
        {completeMsg && !showWinnerOverlay && (
          <Alert
            severity="success"
            icon={<EmojiEventsOutlinedIcon />}
            sx={{ mb: 1.5, borderRadius: `${tokens.radius.md}px` }}
          >
            {completeMsg}
          </Alert>
        )}

        {isTournamentMode(state) && tournamentBanner(state) && (
          <Alert severity="info" sx={{ mb: 1.5, borderRadius: `${tokens.radius.md}px` }}>
            {tournamentBanner(state)}
          </Alert>
        )}

        {isRaceMode(preset) && state.game.targetScore && !isTournamentMode(state) && (
          <GlassPanel padding={1.25} sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Race to {state.game.targetScore}
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: tokens.color.gold.main }}>
              {state.players.reduce((a, b) => (a.frameScore >= b.frameScore ? a : b)).name} leads
            </Typography>
          </GlassPanel>
        )}

        {bracketLines && completeMsg && (
          <GlassPanel padding={1.25} sx={{ mb: 1.5 }}>
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
          <GlassPanel padding={1.25} sx={{ mb: 1.5 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ fontFamily: tokens.font.heading, color: tokens.color.baize.light }}
            >
              {leadStatusLabel}
            </Typography>
          </GlassPanel>
        )}

        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', mb: 1.5, pb: 0.25 }}>
          {state.players.map((p, i) => (
            <PlayerScoreCard
              key={i}
              player={p}
              index={i}
              state={state}
              twoPlayer={twoPlayer}
              playable={playable}
              preset={preset}
              ballValues={ballValues}
              onPoints={onPoints}
              onFoulOpen={onFoulOpen}
              onSetActivePlayer={onSetActivePlayer}
              tokens={tokens}
              sx={sx}
            />
          ))}
        </Stack>

        {!twoPlayer && (
          <GlassPanel padding={1.5}>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mb: 1.5 }}>
              Tap a player above, then score below
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, justifyContent: 'center', mb: 1.5 }}>
              {ballValues.map((v) => (
                <BallButton
                  key={v}
                  value={v}
                  preset={preset}
                  compact
                  disabled={!playable}
                  onClick={(val) => onPoints(state.activePlayer, val)}
                />
              ))}
            </Box>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              disabled={!playable}
              onClick={() => onFoulOpen(state.activePlayer)}
              sx={{ minHeight: 44 }}
            >
              Foul
            </Button>
          </GlassPanel>
        )}
      </Box>

      <Box sx={{ px: 1.5, pb: 1 }}>
        <GlassPanel padding={1}>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        {!isRaceMode(preset) &&
          !isTimedMode(preset) &&
          state.match.bestOf > 1 &&
          state.players.map((p, i) => (
            <Button
              key={i}
              size="small"
              variant="outlined"
              disabled={!playable}
              onClick={() => onAwardFrame(i)}
              sx={{ minHeight: 44 }}
            >
              {p.name} wins frame
            </Button>
          ))}
        <Stack direction="row" spacing={1} sx={{ ml: 'auto', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="error"
            disabled={!playable}
            onClick={onEndMatchCancel}
            sx={{ minHeight: 48, borderRadius: `${tokens.radius.md}px` }}
          >
            Cancel match
          </Button>
          <Button
            variant="contained"
            color="secondary"
            disabled={!playable}
            onClick={onEndMatchOpen}
            sx={{ minHeight: 48, borderRadius: `${tokens.radius.md}px` }}
          >
            End match
          </Button>
        </Stack>
          </Stack>
        </GlassPanel>
      </Box>

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
                sx={{ minHeight: 44, fontSize: '1.1rem', fontWeight: 700 }}
              >
                {pts}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onFoulClose} fullWidth variant="outlined">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={state.endMatchPickerOpen} onClose={onEndMatchClose} fullWidth maxWidth="xs" disableRestoreFocus>
        <DialogTitle sx={{ fontFamily: tokens.font.heading }}>End match</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {multiPlayer
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
                  <Typography fontWeight={isLeader || isWinner || isLoser ? 700 : 500} sx={{ flex: 1 }}>
                    {p.name}
                  </Typography>
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
        <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1, px: 2, pb: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            autoFocus
            onClick={onEndMatchByScore}
            sx={{ minHeight: 48 }}
          >
            {endMatchConfirmLabel}
          </Button>
          <Button variant="outlined" color="error" fullWidth onClick={onEndMatchCancel} sx={{ minHeight: 44 }}>
            Cancel match
          </Button>
          <Button onClick={onEndMatchClose} sx={{ color: 'text.secondary' }}>
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
