import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { alpha } from '@mui/material/styles';
import { createInitialMatches, estimateTotalRounds, roundLabel } from '../rules/tournament.js';
import PlayerAvatar from './PlayerAvatar.jsx';
import { useAppTheme } from '../hooks/useAppTheme.js';

function SeedSlot({ profile, seedIndex, isBye, onDragStart, onDragOver, onDrop, dragOver, tokens }) {
  return (
    <Paper
      draggable={!isBye}
      onDragStart={(e) => onDragStart(e, seedIndex)}
      onDragOver={(e) => onDragOver(e, seedIndex)}
      onDrop={(e) => onDrop(e, seedIndex)}
      variant="outlined"
      sx={{
        p: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: isBye ? 'default' : 'grab',
        borderStyle: isBye ? 'dashed' : 'solid',
        borderColor: dragOver ? tokens.color.baize.light : tokens.color.border.default,
        bgcolor: dragOver ? alpha(tokens.color.baize.main, 0.15) : tokens.color.bg.elevated,
        borderRadius: `${tokens.radius.md}px`,
        opacity: isBye ? 0.7 : 1,
        transition: 'border-color 200ms, background-color 200ms',
        minHeight: 44,
      }}
    >
      {!isBye && <DragIndicatorIcon sx={{ fontSize: 16, color: tokens.color.text.muted, flexShrink: 0 }} />}
      <PlayerAvatar player={profile} size="sm" />
      <Typography variant="body2" noWrap sx={{ flex: 1, fontWeight: 500 }}>
        {profile.name}
      </Typography>
      {isBye && (
        <Chip
          label="Bye"
          size="small"
          sx={{ bgcolor: alpha(tokens.color.gold.main, 0.15), color: tokens.color.gold.main, fontWeight: 600 }}
        />
      )}
    </Paper>
  );
}

export default function TournamentBracketSetup({ seedOrder, profiles, onSwap }) {
  const { tokens } = useAppTheme();
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const players = seedOrder.map((id) => profiles.find((p) => p.id === id)).filter(Boolean);
  const n = players.length;
  if (n < 3) return null;

  const r1Matches = createInitialMatches(n);
  const totalRounds = estimateTotalRounds(n);

  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setOverIndex(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== dropIndex) onSwap(dragIndex, dropIndex);
    setDragIndex(null);
    setOverIndex(null);
  };

  let slots = n;
  const futureColumns = [];
  for (let r = 2; r <= totalRounds; r++) {
    slots = Math.ceil(slots / 2);
    futureColumns.push({ round: r, slots });
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ color: tokens.color.gold.main, mb: 0.5 }}>
        First-round bracket
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Drag players to change first-match pairings
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
        <Stack spacing={1} sx={{ minWidth: 180 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing="0.08em">
            {roundLabel(1, totalRounds).toUpperCase()}
          </Typography>
          {r1Matches.map((match, i) => (
            <Stack key={i} spacing={0.5}>
              <SeedSlot
                profile={players[match.a]}
                seedIndex={match.a}
                isBye={match.b === null}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                dragOver={overIndex === match.a}
                tokens={tokens}
              />
              {match.b !== null && (
                <>
                  <Typography variant="caption" sx={{ color: tokens.color.gold.main, py: 0.25, textAlign: 'center', display: 'block' }}>
                    vs
                  </Typography>
                  <SeedSlot
                    profile={players[match.b]}
                    seedIndex={match.b}
                    isBye={false}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    dragOver={overIndex === match.b}
                    tokens={tokens}
                  />
                </>
              )}
            </Stack>
          ))}
        </Stack>

        {futureColumns.map(({ round, slots: colSlots }) => (
          <Stack key={round} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
            <Typography sx={{ pt: 2.5, color: tokens.color.text.muted }}>→</Typography>
            <Stack spacing={1} sx={{ minWidth: 100 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing="0.08em">
                {roundLabel(round, totalRounds).toUpperCase()}
              </Typography>
              {Array.from({ length: colSlots }).map((_, i) => (
                <Paper
                  key={i}
                  variant="outlined"
                  sx={{
                    p: 1,
                    opacity: 0.45,
                    textAlign: 'center',
                    borderRadius: `${tokens.radius.md}px`,
                    borderStyle: 'dashed',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Winner
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Stack>
        ))}

        <Stack direction="row" spacing={1}>
          <Typography sx={{ pt: 2.5, color: tokens.color.text.muted }}>→</Typography>
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing="0.08em">
              CHAMPION
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 1.25,
                opacity: 0.45,
                borderRadius: `${tokens.radius.md}px`,
                borderColor: alpha(tokens.color.gold.main, 0.3),
              }}
            >
              <Typography variant="body2" sx={{ color: tokens.color.gold.main }}>
                ?
              </Typography>
            </Paper>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
