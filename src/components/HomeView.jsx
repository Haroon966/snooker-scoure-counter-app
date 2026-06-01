import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import GetAppOutlinedIcon from '@mui/icons-material/GetAppOutlined';
import { alpha } from '@mui/material/styles';
import { useState } from 'react';
import {
  RACE_TARGETS,
  getPreset,
  getAvailableModes,
  formatLabel,
  isRaceMode,
  isTimedMode,
  getModeSummary,
} from '../rules/game-presets.js';
import {
  canAdvanceFromStep,
  hasResumableGame,
  wizardUsesFormatStep,
  wizardGameStep,
  wizardOptionsStep,
  wizardReviewStep,
  wizardStepLabels,
  wizardActiveStep,
  ensureTournamentSeedOrder,
  needsTournamentBracketStep,
  getTeamForProfile,
  isTeamSetupValid,
} from '../state/match-state.js';
import PlayerAvatar from './PlayerAvatar.jsx';
import TournamentBracketSetup from './TournamentBracketSetup.jsx';
import PageShell from './ui/PageShell.jsx';
import SelectCard from './ui/SelectCard.jsx';
import StepIndicator from './ui/StepIndicator.jsx';
import WizardFooter from './ui/WizardFooter.jsx';
import SettingsModal from './SettingsModal.jsx';
import AppBrand from './ui/AppBrand.jsx';
import GlassPanel from './ui/GlassPanel.jsx';
import HomeActionBar from './ui/HomeActionBar.jsx';
import { useAppTheme } from '../hooks/useAppTheme.js';
import { blurActiveElement } from '../utils/dialogFocus.js';

function ChoiceChip({ label, selected, onClick, tokens }) {
  return (
    <Chip
      label={label}
      onClick={onClick}
      clickable
      sx={{
        minHeight: 44,
        px: 1.25,
        fontWeight: 700,
        fontSize: '0.9375rem',
        cursor: 'pointer',
        borderRadius: `${tokens.radius.md}px`,
        bgcolor: selected ? tokens.color.baize.main : 'transparent',
        color: selected ? '#fff' : tokens.color.text.secondary,
        border: `1.5px solid ${selected ? tokens.color.baize.light : tokens.color.border.default}`,
        boxShadow: selected ? tokens.shadow.glow : 'none',
        transition: 'all 250ms',
        '&:hover': {
          borderColor: tokens.color.baize.light,
          bgcolor: selected ? tokens.color.baize.light : alpha(tokens.color.baize.main, 0.12),
        },
      }}
    />
  );
}

export default function HomeView({
  state,
  profiles,
  themeMode,
  onThemeModeChange,
  pricePerHour,
  onPricePerHourChange,
  hapticFeedback,
  onHapticFeedbackChange,
  keepScreenAwake,
  onKeepScreenAwakeChange,
  longPressUndo,
  onLongPressUndoChange,
  showInstallBanner,
  onInstallApp,
  onDismissInstallBanner,
  onOpenHistory,
  onOpenProfileModal,
  onContinue,
  onResume,
  onWizardBack,
  onWizardNext,
  onStartMatch,
  onToggleProfile,
  onPickFormat,
  onChangeFormat,
  onPickMode,
  onPickTarget,
  onCustomTargetChange,
  onSwapSeeds,
  onSetTeamMode,
  onAssignToTeam,
  onRemoveFromTeam,
  onRenameTeam,
}) {
  const { tokens, sx } = useAppTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const { setup } = state;
  const step = setup.step;
  const selected = new Set(setup.selectedProfileIds);
  const gameStep = wizardGameStep(setup);
  const optionsStep = wizardOptionsStep(setup);
  const reviewStep = wizardReviewStep(setup);
  const preset = getPreset(setup.gameModeId);

  const canResume = hasResumableGame(state);
  const selectedPlayers = setup.selectedProfileIds
    .map((id) => profiles.find((p) => p.id === id))
    .filter(Boolean);
  const selectedCount = selectedPlayers.length;
  const canContinue = selectedCount >= 2 && isTeamSetupValid(setup);

  if (step === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: 680,
          mx: 'auto',
          height: '100dvh',
          maxHeight: '100dvh',
          overflow: 'hidden',
          pt: 'max(16px, env(safe-area-inset-top))',
          px: { xs: 1.5, sm: 2 },
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            pb: 1,
          }}
        >
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <AppBrand size="lg" />
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-start' }}>
            <IconButton
              aria-label="Match history"
              onClick={() => {
                blurActiveElement();
                onOpenHistory();
              }}
              sx={{
                mt: 0.5,
                width: 48,
                height: 48,
                color: 'text.secondary',
                bgcolor: tokens.color.glass.bg,
                backdropFilter: 'blur(12px)',
                border: `1px solid ${tokens.color.glass.border}`,
                borderRadius: `${tokens.radius.md}px`,
                '&:hover': { color: tokens.color.baize.light, borderColor: tokens.color.baize.light },
              }}
            >
              <HistoryOutlinedIcon />
            </IconButton>
            <IconButton
              aria-label="Settings"
              onClick={() => {
                blurActiveElement();
                setSettingsOpen(true);
              }}
              sx={{
                mt: 0.5,
                width: 48,
                height: 48,
                color: 'text.secondary',
                bgcolor: tokens.color.glass.bg,
                backdropFilter: 'blur(12px)',
                border: `1px solid ${tokens.color.glass.border}`,
                borderRadius: `${tokens.radius.md}px`,
                '&:hover': { color: tokens.color.gold.main, borderColor: tokens.color.gold.main },
              }}
            >
              <SettingsOutlinedIcon />
            </IconButton>
          </Stack>
        </Stack>

        {showInstallBanner && (
          <GlassPanel padding={1.25} sx={{ mb: 1.5 }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
              <GetAppOutlinedIcon sx={{ color: tokens.color.gold.main, mt: 0.25 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} sx={{ fontFamily: tokens.font.heading }}>
                  Install for full-screen scoring
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Add to your home screen for a faster, app-like experience at the table.
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={onInstallApp}
                    sx={{ minHeight: 44, flex: 1 }}
                  >
                    Install
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onDismissInstallBanner}
                    sx={{ minHeight: 44, flex: 1 }}
                  >
                    Not now
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </GlassPanel>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            mb: 1.5,
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              columnGap: 0.75,
              rowGap: 0.25,
            }}
          >
            <Typography component="span" sx={{ ...sx.labelCaps, mb: 0 }}>
              Select players
            </Typography>
            <Typography component="span" sx={{ ...sx.sectionSubtitle, mt: 0 }}>
              · choose at least two · {setup.selectedProfileIds.length}/{profiles.length} selected
              {setup.teamMode ? ' · pick a team, then tap players' : ''}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => onOpenProfileModal('add')}
            sx={{
              flexShrink: 0,
              width: 56,
              height: 56,
              minWidth: 56,
              p: 0.5,
              flexDirection: 'column',
              gap: 0.25,
              border: `1.5px solid ${tokens.color.border.default}`,
              color: tokens.color.gold.main,
              borderRadius: `${tokens.radius.md}px`,
              textTransform: 'none',
              '&:hover': {
                borderColor: tokens.color.border.focus,
                bgcolor: alpha(tokens.color.gold.main, 0.08),
              },
            }}
          >
            <AddIcon sx={{ fontSize: 20 }} />
            <Typography
              component="span"
              sx={{
                fontSize: '0.625rem',
                lineHeight: 1.1,
                fontWeight: 700,
                textAlign: 'center',
                maxWidth: '100%',
              }}
            >
              Add player
            </Typography>
          </Button>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={Boolean(setup.teamMode)}
              onChange={(e) => {
                if (e.target.checked) setActiveTeamIndex(0);
                onSetTeamMode(e.target.checked);
              }}
              color="primary"
            />
          }
          label={
            <Typography variant="body2" fontWeight={600} sx={{ fontFamily: tokens.font.heading }}>
              Play as teams
            </Typography>
          }
          sx={{ mb: 1.5, ml: 0 }}
        />

        {setup.teamMode && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Select a team, then tap players below to add them
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1,
                mb: 1.5,
              }}
            >
              {setup.teams.map((team, teamIndex) => {
                const isActiveTeam = activeTeamIndex === teamIndex;
                const teamAccent =
                  teamIndex === 0
                    ? {
                        main: tokens.color.baize.light,
                        dim: alpha(tokens.color.baize.main, 0.22),
                        glow: alpha(tokens.color.baize.light, 0.4),
                      }
                    : {
                        main: tokens.color.gold.main,
                        dim: alpha(tokens.color.gold.main, 0.2),
                        glow: alpha(tokens.color.gold.main, 0.35),
                      };
                return (
                  <GlassPanel
                    key={team.id}
                    active={false}
                    onClick={() => setActiveTeamIndex(teamIndex)}
                    padding={1.25}
                    sx={{
                      cursor: 'pointer',
                      border: `2px solid ${
                        isActiveTeam ? teamAccent.main : tokens.color.border.default
                      }`,
                      bgcolor: isActiveTeam ? teamAccent.dim : tokens.color.glass.bg,
                      boxShadow: isActiveTeam
                        ? `0 0 28px ${teamAccent.glow}, ${tokens.shadow.inner}`
                        : `${tokens.shadow.sm}, ${tokens.shadow.inner}`,
                      transition:
                        'border-color 250ms, box-shadow 250ms, background-color 250ms',
                      '&:hover': {
                        borderColor: isActiveTeam
                          ? teamAccent.main
                          : tokens.color.border.focus,
                        bgcolor: isActiveTeam
                          ? teamAccent.dim
                          : alpha(tokens.color.bg.elevated, 0.6),
                      },
                    }}
                  >
                    <TextField
                      size="small"
                      fullWidth
                      label={`Team ${teamIndex === 0 ? 'A' : 'B'}`}
                      value={team.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onRenameTeam(teamIndex, e.target.value)}
                      slotProps={{ htmlInput: { maxLength: 20 } }}
                      sx={{ mb: 1 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mb: 0.75,
                        fontWeight: isActiveTeam ? 700 : 500,
                        color: isActiveTeam ? teamAccent.main : 'text.secondary',
                      }}
                    >
                      {isActiveTeam ? 'Selected — tap players to add' : 'Tap to select'}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', minHeight: 32 }}>
                      {team.profileIds.map((id) => {
                        const p = profiles.find((pr) => pr.id === id);
                        if (!p) return null;
                        return (
                          <Chip
                            key={id}
                            size="small"
                            avatar={<PlayerAvatar player={p} size="sm" />}
                            label={p.name}
                            onDelete={(e) => {
                              e.stopPropagation();
                              onRemoveFromTeam(id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            sx={{ bgcolor: tokens.color.bg.elevated }}
                          />
                        );
                      })}
                      {team.profileIds.length === 0 && (
                        <Typography variant="caption" color="text.secondary">
                          No players yet
                        </Typography>
                      )}
                    </Stack>
                  </GlassPanel>
                );
              })}
            </Box>
          </>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
            mb: 1.5,
          }}
        >
          {profiles.map((p) => {
            const isSelected = selected.has(p.id);
            const teamIdx = setup.teamMode ? getTeamForProfile(setup, p.id) : null;
            const activeTeam = setup.teamMode ? setup.teams[activeTeamIndex] : null;
            return (
              <GlassPanel
                key={p.id}
                active={setup.teamMode ? teamIdx != null : isSelected}
                onClick={() => {
                  if (setup.teamMode) {
                    onAssignToTeam(p.id, activeTeamIndex);
                  } else {
                    onToggleProfile(p.id);
                  }
                }}
                padding={1}
                sx={{
                  position: 'relative',
                  minHeight: 108,
                  opacity:
                    setup.teamMode && selectedCount >= 7 && teamIdx == null ? 0.45 : 1,
                }}
              >
                <IconButton
                  size="small"
                  aria-label={`Edit ${p.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenProfileModal('edit', p);
                  }}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    color: 'text.secondary',
                    width: 32,
                    height: 32,
                  }}
                >
                  <EditOutlinedIcon sx={{ fontSize: 16 }} />
                </IconButton>
                {isSelected && (
                  <CheckCircleOutlinedIcon
                    sx={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      fontSize: 18,
                      color: tokens.color.baize.light,
                    }}
                  />
                )}
                <Stack
                  spacing={0.75}
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    pt: 0.5,
                    px: 0.5,
                  }}
                >
                  <PlayerAvatar player={p} size="md" ring={isSelected} />
                  <Typography
                    fontWeight={700}
                    noWrap
                    sx={{ fontFamily: tokens.font.heading, width: '100%', fontSize: '0.9rem' }}
                  >
                    {p.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ width: '100%' }}>
                    {setup.teamMode
                      ? teamIdx === 0
                        ? setup.teams[0].name
                        : teamIdx === 1
                          ? setup.teams[1].name
                          : activeTeam
                            ? `Add to ${activeTeam.name}`
                            : 'Select a team first'
                      : isSelected
                        ? 'Selected'
                        : 'Tap to select'}
                  </Typography>
                </Stack>
              </GlassPanel>
            );
          })}
        </Box>

        {profiles.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
            Add at least two players to get started
          </Typography>
        )}
        </Box>

        <HomeActionBar
          selectedPlayers={selectedPlayers}
          canContinue={canContinue}
          canResume={canResume}
          onContinue={onContinue}
          onResume={onResume}
        />

        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          themeMode={themeMode}
          onThemeModeChange={onThemeModeChange}
          pricePerHour={pricePerHour}
          onPricePerHourChange={onPricePerHourChange}
          hapticFeedback={hapticFeedback}
          onHapticFeedbackChange={onHapticFeedbackChange}
          keepScreenAwake={keepScreenAwake}
          onKeepScreenAwakeChange={onKeepScreenAwakeChange}
          longPressUndo={longPressUndo}
          onLongPressUndoChange={onLongPressUndoChange}
        />
      </Box>
    );
  }

  const canNext = canAdvanceFromStep(setup);
  const isReview = step === reviewStep;
  const stepLabels = wizardStepLabels(setup);

  let body = null;
  if (step === 1 && wizardUsesFormatStep(setup)) {
    body = (
      <>
        <Typography sx={sx.sectionTitle}>Match format</Typography>
        <Typography sx={sx.sectionSubtitle}>
          {setup.selectedProfileIds.length} players ready
        </Typography>
        <Stack spacing={1}>
          <SelectCard
            selected={setup.multiPlayerFormat === 'tournament'}
            title="Tournament"
            description="Knockout bracket — winner advances each round"
            onClick={() => onPickFormat('tournament')}
          />
          <SelectCard
            selected={setup.multiPlayerFormat === 'single'}
            title="All in one game"
            description="Everyone scores together in the same session"
            onClick={() => onPickFormat('single')}
          />
        </Stack>
      </>
    );
  } else if (step === gameStep) {
    const modes = getAvailableModes(setup);
    body = (
      <>
        {needsFormatLine(setup) && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {formatLabel(setup.multiPlayerFormat)} ·{' '}
            <Button size="small" onClick={onChangeFormat} sx={{ ml: -0.5 }}>
              Change
            </Button>
          </Typography>
        )}
        <Typography sx={sx.sectionTitle}>Game type</Typography>
        <Typography sx={sx.sectionSubtitle}>Choose how you want to play</Typography>
        <Stack spacing={1}>
          {modes.map((m) => (
            <SelectCard
              key={m.id}
              selected={setup.gameModeId === m.id}
              title={m.label}
              description={m.description}
              meta={playerMeta(setup, m)}
              onClick={() => onPickMode(m.id)}
            />
          ))}
        </Stack>
      </>
    );
  } else if (optionsStep != null && step === optionsStep) {
    body = (
      <OptionsStep
        setup={setup}
        profiles={profiles}
        onPickTarget={onPickTarget}
        onCustomTargetChange={onCustomTargetChange}
        onSwapSeeds={onSwapSeeds}
      />
    );
  } else if (step === reviewStep) {
    const selectedPlayers = setup.selectedProfileIds
      .map((id) => profiles.find((p) => p.id === id))
      .filter(Boolean);
    const summary = getModeSummary({
      setup,
      match: { bestOf: setup.bestOf },
      game: { modeId: setup.gameModeId, targetScore: setup.customTarget || setup.targetScore },
    });
    body = (
      <>
        <Typography sx={sx.sectionTitle}>Ready to start</Typography>
        <Typography sx={sx.sectionSubtitle}>Review your match settings</Typography>
        <GlassPanel padding={1.5}>
          <Typography sx={{ ...sx.labelCaps, mb: 1 }}>
            {setup.teamMode ? 'Teams' : 'Players'}
          </Typography>
          {setup.teamMode ? (
            <Stack spacing={1.5} sx={{ mb: 1.5 }}>
              {setup.teams.map((team) => (
                <Box key={team.id}>
                  <Typography variant="body2" fontWeight={700} sx={{ mb: 0.75, fontFamily: tokens.font.heading }}>
                    {team.name}
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }}>
                    {team.profileIds.map((id) => {
                      const p = profiles.find((pr) => pr.id === id);
                      if (!p) return null;
                      return (
                        <Chip
                          key={id}
                          avatar={<PlayerAvatar player={p} size="sm" />}
                          label={p.name}
                          sx={{ bgcolor: tokens.color.bg.elevated }}
                        />
                      );
                    })}
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', mb: 1.5 }}>
              {selectedPlayers.map((p) => (
                <Chip
                  key={p.id}
                  avatar={<PlayerAvatar player={p} size="sm" />}
                  label={p.name}
                  sx={{ bgcolor: tokens.color.bg.elevated }}
                />
              ))}
            </Stack>
          )}
          {wizardUsesFormatStep(setup) && setup.multiPlayerFormat && (
            <ReviewRow label="Format" value={formatLabel(setup.multiPlayerFormat)} />
          )}
          <ReviewRow label="Game" value={summary} />
          {isTimedMode(preset) && <ReviewRow label="Rule" value="Highest score when match ends" />}
          {isRaceMode(preset) && (
            <ReviewRow label="Win" value={`First to ${setup.customTarget || setup.targetScore}`} />
          )}
        </GlassPanel>
      </>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: 680,
        mx: 'auto',
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        pt: 'max(16px, env(safe-area-inset-top))',
        px: { xs: 1.5, sm: 2 },
      }}
    >
      <Box sx={{ flexShrink: 0, pb: 1 }}>
        <StepIndicator activeStep={wizardActiveStep(setup, step)} labels={stepLabels} />
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          pb: 1,
        }}
      >
        {body}
      </Box>
      <Box
        sx={{
          flexShrink: 0,
          pb: 'max(8px, env(safe-area-inset-bottom))',
        }}
      >
        <WizardFooter
          backLabel={step === 1 ? 'Players' : 'Back'}
          nextLabel={isReview ? 'Start match' : 'Next'}
          canNext={canNext}
          onBack={onWizardBack}
          onNext={isReview ? onStartMatch : onWizardNext}
          isReview={isReview}
          sticky
        />
      </Box>
    </Box>
  );
}

function ReviewRow({ label, value }) {
  const { tokens } = useAppTheme();
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', py: 0.75, borderTop: `1px solid ${tokens.color.border.default}` }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}

function needsFormatLine(setup) {
  if (setup.teamMode) return false;
  return setup.selectedProfileIds.length > 2 && setup.multiPlayerFormat;
}

function playerMeta(setup, m) {
  if (setup.teamMode) return '2 teams';
  if (setup.multiPlayerFormat === 'single' && setup.selectedProfileIds.length > 2) return '2–7 players';
  if (setup.multiPlayerFormat === 'tournament') return '2 per match';
  return m.maxPlayers > 2 ? '2–7 players' : '2 players';
}

function OptionsStep({ setup, profiles, onPickTarget, onCustomTargetChange, onSwapSeeds }) {
  const { tokens, sx } = useAppTheme();
  const preset = getPreset(setup.gameModeId);
  if (!preset) return <Typography>Select a game type first.</Typography>;

  const selectedPlayers = setup.selectedProfileIds
    .map((id) => profiles.find((p) => p.id === id))
    .filter(Boolean);

  if (isRaceMode(preset)) {
    return (
      <>
        <Typography sx={sx.sectionTitle}>Race settings</Typography>
        <Typography sx={sx.sectionSubtitle}>First to reach the target wins</Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
          {selectedPlayers.map((p) => (
            <Chip key={p.id} avatar={<PlayerAvatar player={p} size="sm" />} label={p.name} />
          ))}
        </Stack>
        <Typography variant="subtitle2" sx={{ color: tokens.color.gold.main, mb: 1 }}>
          Target score
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
          {RACE_TARGETS.map((t) => (
            <ChoiceChip
              key={t}
              label={String(t)}
              selected={setup.targetScore === t && !setup.customTarget}
              onClick={() => onPickTarget(t)}
              tokens={tokens}
            />
          ))}
        </Stack>
        <TextField
          label="Custom target"
          type="number"
          size="small"
          fullWidth
          value={setup.customTarget ?? ''}
          onChange={(e) => onCustomTargetChange(e.target.value)}
          placeholder="e.g. 75"
          slotProps={{ htmlInput: { min: 10, max: 500 } }}
        />
      </>
    );
  }

  if (!needsTournamentBracketStep(setup)) return null;

  ensureTournamentSeedOrder(setup);
  return (
    <>
      <Typography sx={sx.sectionTitle}>Bracket order</Typography>
      <Typography sx={sx.sectionSubtitle}>Set seed order for the knockout draw</Typography>
      <TournamentBracketSetup seedOrder={setup.tournamentSeedOrder} profiles={profiles} onSwap={onSwapSeeds} />
    </>
  );
}
