import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { alpha } from '@mui/material/styles';
import PageShell from './ui/PageShell.jsx';
import GlassPanel from './ui/GlassPanel.jsx';
import PlayerAvatar from './PlayerAvatar.jsx';
import { useAppTheme } from '../hooks/useAppTheme.js';
import { loadMatchHistory, clearMatchHistory, deleteMatchHistoryEntry } from '../storage/matchHistory.js';
import { formatHistoryDate, formatHistoryTime, formatHistoryDuration } from '../rules/matchHistory.js';
import { formatPkr } from '../utils/billing.js';
import { blurActiveElement } from '../utils/dialogFocus.js';

function HistoryMetaRow({ label, value }) {
  return (
    <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', gap: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="caption" fontWeight={600} sx={{ textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}

function HistoryCard({ entry, onRequestDelete, tokens, sx }) {
  const showScores = entry.players.some((p) => p.score != null && p.score > 0);

  return (
    <GlassPanel padding={1.25}>
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} sx={{ fontFamily: tokens.font.heading }}>
            {entry.summary}
          </Typography>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              color: entry.loserNames?.length ? tokens.color.status.error : tokens.color.baize.light,
              mt: 0.5,
              fontFamily: tokens.font.heading,
            }}
          >
            {entry.resultLabel}
          </Typography>
        </Box>
        <IconButton
          size="small"
          aria-label="Delete match record"
          onClick={() => onRequestDelete(entry)}
          sx={{ color: tokens.color.text.muted, mt: -0.5 }}
        >
          <DeleteOutlinedIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box sx={{ mt: 1.25, p: 1, borderRadius: `${tokens.radius.md}px`, bgcolor: tokens.color.bg.elevated }}>
        <Stack spacing={0.5}>
          <HistoryMetaRow label="Started" value={formatHistoryDate(entry.startedAt)} />
          <HistoryMetaRow label="Start time" value={formatHistoryTime(entry.startedAt)} />
          <HistoryMetaRow label="Ended" value={formatHistoryDate(entry.endedAt)} />
          <HistoryMetaRow label="End time" value={formatHistoryTime(entry.endedAt)} />
          <HistoryMetaRow label="Duration" value={formatHistoryDuration(entry.durationMs)} />
          {entry.costPkr > 0 && <HistoryMetaRow label="Table cost" value={formatPkr(entry.costPkr)} />}
          {entry.targetScore && <HistoryMetaRow label="Target" value={String(entry.targetScore)} />}
          {entry.bestOf > 1 && <HistoryMetaRow label="Best of" value={`${entry.bestOf} frames`} />}
        </Stack>
      </Box>

      <Typography sx={{ ...sx.labelCaps, mt: 1.25, mb: 0.75 }}>Scores</Typography>
      <Stack spacing={0.75}>
        {entry.players.map((player) => (
          <Stack
            key={`${entry.id}-${player.name}`}
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              py: player.isLoser ? 0.5 : 0,
              px: player.isLoser ? 0.75 : 0,
              borderRadius: player.isLoser ? `${tokens.radius.md}px` : 0,
              bgcolor: player.isLoser ? alpha(tokens.color.status.error, 0.08) : 'transparent',
            }}
          >
            <PlayerAvatar player={player} size="sm" ring={player.isWinner} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                noWrap
                fontWeight={player.isWinner || player.isLoser ? 700 : 500}
                sx={{ color: player.isLoser ? tokens.color.status.error : 'inherit' }}
              >
                {player.name}
                {player.isLoser ? ' · lost' : ''}
              </Typography>
              {player.highestBreak > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Highest break: {player.highestBreak}
                </Typography>
              )}
            </Box>
            <Stack sx={{ alignItems: 'flex-end' }}>
              {showScores && player.score != null && (
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{
                    fontFamily: tokens.font.mono,
                    color: player.isLoser
                      ? tokens.color.status.error
                      : player.isWinner
                        ? tokens.color.baize.light
                        : 'text.secondary',
                  }}
                >
                  {player.score} pts
                </Typography>
              )}
              {entry.bestOf > 1 && player.framesWon > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {player.framesWon} frame{player.framesWon === 1 ? '' : 's'} won
                </Typography>
              )}
            </Stack>
            {player.isWinner && (
              <EmojiEventsOutlinedIcon sx={{ fontSize: 16, color: tokens.color.gold.main }} />
            )}
            {player.isLoser && (
              <TrendingDownOutlinedIcon sx={{ fontSize: 16, color: tokens.color.status.error }} />
            )}
          </Stack>
        ))}
      </Stack>

      {entry.tournamentBracket?.length > 0 && (
        <Box sx={{ mt: 1.25 }}>
          <Typography sx={{ ...sx.labelCaps, mb: 0.75 }}>Bracket</Typography>
          <Stack spacing={0.5}>
            {entry.tournamentBracket.map((match, i) => (
              <Typography key={i} variant="caption" color="text.secondary">
                R{match.round}: {match.playerA} vs {match.playerB}
                {match.winner ? ` — ${match.winner} won` : ''}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}
    </GlassPanel>
  );
}

export default function HistoryView({ historyVersion, onHistoryChange, onBack }) {
  const { tokens, sx } = useAppTheme();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const entries = useMemo(() => loadMatchHistory(), [historyVersion]);

  const refreshList = () => {
    onHistoryChange?.();
  };

  const openDeleteDialog = (target) => {
    blurActiveElement();
    setDeleteTarget(target);
  };

  const closeDeleteDialog = () => setDeleteTarget(null);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget === 'all') {
      clearMatchHistory();
    } else {
      deleteMatchHistoryEntry(deleteTarget.id);
    }
    closeDeleteDialog();
    refreshList();
  };

  const deleteTitle = deleteTarget === 'all' ? 'Clear all history?' : 'Delete match?';
  const deleteMessage =
    deleteTarget === 'all'
      ? 'This will permanently remove all recorded matches from your history.'
      : deleteTarget
        ? `Remove "${deleteTarget.summary}" from match history? This cannot be undone.`
        : '';

  return (
    <PageShell>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
        <IconButton aria-label="Back" onClick={onBack} size="small" sx={{ color: 'text.secondary' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography sx={sx.sectionTitle}>Match history</Typography>
          <Typography sx={{ ...sx.sectionSubtitle, mb: 0 }}>
            {entries.length} recorded {entries.length === 1 ? 'match' : 'matches'}
          </Typography>
        </Box>
      </Stack>

      {entries.length === 0 ? (
        <GlassPanel padding={2}>
          <Stack spacing={1.5} sx={{ alignItems: 'center', py: 2 }}>
            <HistoryOutlinedIcon sx={{ fontSize: 40, color: tokens.color.text.muted }} />
            <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
              Completed matches will appear here with scores, winner, start/end times, and duration.
            </Typography>
            <Button variant="outlined" onClick={onBack}>
              Back to home
            </Button>
          </Stack>
        </GlassPanel>
      ) : (
        <>
          <Stack spacing={1}>
            {entries.map((entry) => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                onRequestDelete={openDeleteDialog}
                tokens={tokens}
                sx={sx}
              />
            ))}
          </Stack>
          <Button
            color="error"
            variant="outlined"
            fullWidth
            onClick={() => openDeleteDialog('all')}
            sx={{ mt: 2, minHeight: 44 }}
          >
            Clear all history
          </Button>
        </>
      )}

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth="xs"
        disableRestoreFocus
      >
        <DialogTitle sx={{ fontFamily: tokens.font.heading }}>{deleteTitle}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {deleteMessage}
          </Typography>
          {deleteTarget && deleteTarget !== 'all' && (
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ mt: 1.5, color: tokens.color.baize.light, fontFamily: tokens.font.heading }}
            >
              {deleteTarget.resultLabel}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button fullWidth variant="outlined" onClick={closeDeleteDialog} sx={{ minHeight: 44 }}>
            Cancel
          </Button>
          <Button fullWidth variant="contained" color="error" onClick={confirmDelete} sx={{ minHeight: 44 }}>
            {deleteTarget === 'all' ? 'Clear all' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
