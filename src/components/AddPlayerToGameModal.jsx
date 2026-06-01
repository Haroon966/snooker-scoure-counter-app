import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import {
  canAddPlayerToGame,
  canRemoveTeamMember,
  getMaxPlayersForState,
  getTotalTeamMembers,
  isProfileInMatch,
  isTeamMode,
  MIN_PLAYERS_IN_GAME,
} from '../state/match-state.js';
import { useAppTheme } from '../hooks/useAppTheme.js';
import GlassPanel from './ui/GlassPanel.jsx';
import PlayerAvatar from './PlayerAvatar.jsx';

export default function AddPlayerToGameModal({
  open,
  state,
  profiles,
  profilesVersion = 0,
  onClose,
  onAdd,
  onRemove,
}) {
  const { tokens, sx } = useAppTheme();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [addTeamIndex, setAddTeamIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setNewName('');
    setError('');
    setAddTeamIndex(0);
  }, [open, profilesVersion]);

  const teamMode = isTeamMode(state);
  const canAdd = canAddPlayerToGame(state);
  const maxPlayers = getMaxPlayersForState(state);
  const memberCount = teamMode ? getTotalTeamMembers(state) : state.players.length;
  const available = profiles.filter((p) => !isProfileInMatch(state, p));

  const handleAddResult = (result) => {
    if (result?.ok) {
      onClose();
      return;
    }
    if (result?.reason === 'duplicate') {
      setError('That player is already in this match');
    } else if (result?.reason === 'profile_duplicate') {
      setError('Could not save player — try a different name');
    } else if (result?.reason === 'not_allowed') {
      setError('Cannot add more players right now');
    } else if (result?.reason === 'empty') {
      setError('Enter a name');
    } else {
      setError('Could not add player');
    }
  };

  const handleRemove = (playerIndex, memberIndex = null) => {
    const result = onRemove(playerIndex, memberIndex);
    if (result?.ok) return;
    if (result?.reason === 'not_allowed') {
      setError(`At least ${MIN_PLAYERS_IN_GAME} players must stay in the match`);
    } else {
      setError('Could not remove player');
    }
  };

  const submitNewPlayer = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError('Enter a name');
      return;
    }
    handleAddResult(onAdd({ name: trimmed, teamIndex: addTeamIndex }));
  };

  const addProfile = (profile, teamIndex = addTeamIndex) => {
    handleAddResult(
      onAdd({
        name: profile.name,
        avatar: profile.avatar ?? null,
        profileId: profile.id,
        teamIndex,
      })
    );
  };

  const renderAddSection = (teamIndex) => (
    <Stack spacing={1} key={`add-${teamIndex}`}>
      {teamMode && (
        <Typography sx={sx.labelCaps}>
          Add to {state.players[teamIndex]?.name ?? `Team ${teamIndex === 0 ? 'A' : 'B'}`}
        </Typography>
      )}
      {canAdd && (
        <>
          <TextField
            fullWidth
            label="Name"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setError('');
            }}
            onFocus={() => setAddTeamIndex(teamIndex)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setAddTeamIndex(teamIndex);
                submitNewPlayer();
              }
            }}
            error={Boolean(error) && addTeamIndex === teamIndex}
            helperText={
              addTeamIndex === teamIndex
                ? error || 'Saved to your list and added to this match'
                : ' '
            }
            slotProps={{ htmlInput: { maxLength: 20 } }}
          />
          {available.length > 0 && (
            <Stack spacing={1}>
              <Typography sx={sx.labelCaps}>Add from saved list</Typography>
              {available.map((p) => (
                <GlassPanel
                  key={p.id}
                  onClick={() => addProfile(p, teamIndex)}
                  padding={1.25}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <PlayerAvatar player={p} size="md" />
                    <Typography fontWeight={700} noWrap sx={{ flex: 1, fontFamily: tokens.font.heading }}>
                      {p.name}
                    </Typography>
                    <PersonAddOutlinedIcon sx={{ color: tokens.color.baize.light, fontSize: 22 }} />
                  </Stack>
                </GlassPanel>
              ))}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );

  const renderTeamRoster = (teamIndex) => {
    const team = state.players[teamIndex];
    const members = team?.members ?? [];
    return (
      <Stack spacing={1} key={`roster-${teamIndex}`}>
        <Typography sx={sx.labelCaps}>{team?.name ?? `Team ${teamIndex === 0 ? 'A' : 'B'}`}</Typography>
        {members.map((m, memberIndex) => (
          <GlassPanel key={`${teamIndex}-${m.profileId ?? m.name}`} padding={1.25} sx={{ opacity: 0.92 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <PlayerAvatar player={m} size="md" />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={700} noWrap sx={{ fontFamily: tokens.font.heading }}>
                  {m.name}
                </Typography>
              </Box>
              <IconButton
                size="small"
                aria-label={`Remove ${m.name} from team`}
                disabled={!canRemoveTeamMember(state, teamIndex)}
                onClick={() => handleRemove(teamIndex, memberIndex)}
                sx={{
                  color: canRemoveTeamMember(state, teamIndex)
                    ? tokens.color.status.error
                    : 'text.disabled',
                  width: 40,
                  height: 40,
                }}
              >
                <PersonRemoveOutlinedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </GlassPanel>
        ))}
        {members.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            No players on this team yet
          </Typography>
        )}
      </Stack>
    );
  };

  const inMatchPlayers = state.players.map((player, index) => {
    const profile = profiles.find(
      (p) => (p.name || '').trim().toLowerCase() === (player.name || '').trim().toLowerCase()
    );
    return {
      index,
      ...player,
      avatar: player.avatar ?? profile?.avatar ?? null,
      profileId: profile?.id ?? null,
      saved: Boolean(profile),
    };
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" disableRestoreFocus>
      <DialogTitle sx={{ fontFamily: tokens.font.heading, fontWeight: 700, pb: 1 }}>
        {teamMode ? 'Teams' : 'Players'}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {memberCount} of {maxPlayers} in this match
          {teamMode ? ' · team scores only' : canAdd ? ' · tap remove to leave the match' : ''}
        </Typography>

        <Stack spacing={2}>
          {teamMode ? (
            <>
              {state.players.map((_, teamIndex) => renderTeamRoster(teamIndex))}
              {!canAdd && error && (
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              )}
              {canAdd && renderAddSection(addTeamIndex)}
              {canAdd && state.players.length === 2 && (
                <Stack direction="row" spacing={1}>
                  {state.players.map((team, i) => (
                    <Button
                      key={team.name}
                      size="small"
                      variant={addTeamIndex === i ? 'contained' : 'outlined'}
                      onClick={() => setAddTeamIndex(i)}
                      sx={{ flex: 1, minHeight: 40 }}
                    >
                      Add to {team.name}
                    </Button>
                  ))}
                </Stack>
              )}
            </>
          ) : (
            <>
              {canAdd && renderAddSection(0)}

              {!canAdd && error && (
                <Typography variant="body2" color="error" sx={{ mb: 0 }}>
                  {error}
                </Typography>
              )}

              <Stack spacing={1}>
                <Typography sx={sx.labelCaps}>In this match</Typography>
                {inMatchPlayers.map((p) => (
                  <GlassPanel key={`in-match-${p.index}-${p.name}`} padding={1.25} sx={{ opacity: 0.92 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <PlayerAvatar player={p} size="md" />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap sx={{ fontFamily: tokens.font.heading }}>
                          {p.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.frameScore} pts{p.saved ? ' · saved' : ''}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        aria-label={`Remove ${p.name} from match`}
                        disabled={state.players.length <= MIN_PLAYERS_IN_GAME}
                        onClick={() => handleRemove(p.index)}
                        sx={{
                          color:
                            state.players.length > MIN_PLAYERS_IN_GAME
                              ? tokens.color.status.error
                              : 'text.disabled',
                          width: 40,
                          height: 40,
                        }}
                      >
                        <PersonRemoveOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </GlassPanel>
                ))}
                {state.players.length <= MIN_PLAYERS_IN_GAME && (
                  <Typography variant="caption" color="text.secondary">
                    Need at least {MIN_PLAYERS_IN_GAME} players in the match
                  </Typography>
                )}
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1, px: 2, pb: 2 }}>
        {canAdd && !teamMode && (
          <Button
            fullWidth
            variant="contained"
            disabled={!newName.trim()}
            onClick={submitNewPlayer}
            sx={{ minHeight: 48 }}
          >
            Add to match
          </Button>
        )}
        {canAdd && teamMode && (
          <Button
            fullWidth
            variant="contained"
            disabled={!newName.trim()}
            onClick={submitNewPlayer}
            sx={{ minHeight: 48 }}
          >
            Add to {state.players[addTeamIndex]?.name ?? 'team'}
          </Button>
        )}
        <Button fullWidth variant="outlined" onClick={onClose} sx={{ minHeight: 48 }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
