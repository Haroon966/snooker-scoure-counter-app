import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
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
import { useAppTheme } from '../hooks/useAppTheme.js';
import { blurActiveElement } from '../utils/dialogFocus.js';

function shouldShowTournamentBracketSetup(setup, preset) {
  return (
    setup.multiPlayerFormat === 'tournament' &&
    setup.selectedProfileIds.length > 2 &&
    preset?.maxReds != null
  );
}

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
  onBestOfChange,
  onCustomTargetChange,
  onSwapSeeds,
}) {
  const { tokens, sx } = useAppTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { setup } = state;
  const step = setup.step;
  const selected = new Set(setup.selectedProfileIds);
  const gameStep = wizardGameStep(setup);
  const optionsStep = wizardOptionsStep(setup);
  const reviewStep = wizardReviewStep(setup);
  const preset = getPreset(setup.gameModeId);

  if (step === 0) {
    return (
      <PageShell>
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

        <Typography sx={sx.labelCaps} gutterBottom>
          Select players
        </Typography>
        <Typography sx={{ ...sx.sectionSubtitle, mt: -1, mb: 1.5 }}>
          Choose at least two to start a match · {setup.selectedProfileIds.length}/{profiles.length} selected
        </Typography>

        <Stack spacing={1} sx={{ mb: 1.5 }}>
          {profiles.map((p) => {
            const isSelected = selected.has(p.id);
            return (
              <GlassPanel
                key={p.id}
                active={isSelected}
                onClick={() => onToggleProfile(p.id)}
                padding={1.25}
                sx={{ position: 'relative' }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <PlayerAvatar player={p} size="md" ring={isSelected} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} noWrap sx={{ fontFamily: tokens.font.heading }}>
                      {p.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isSelected ? 'Selected' : 'Tap to select'}
                    </Typography>
                  </Box>
                  {isSelected && <CheckCircleOutlinedIcon sx={{ color: tokens.color.baize.light }} />}
                  <IconButton
                    size="small"
                    aria-label={`Edit ${p.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProfileModal('edit', p);
                    }}
                    sx={{ color: 'text.secondary' }}
                  >
                    <EditOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Stack>
              </GlassPanel>
            );
          })}

          <GlassPanel onClick={() => onOpenProfileModal('add')} padding={1.25} sx={{ borderStyle: 'dashed' }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'center' }}>
              <AddIcon sx={{ color: tokens.color.gold.main }} />
              <Typography fontWeight={600} color="text.secondary">
                Add new player
              </Typography>
            </Stack>
          </GlassPanel>
        </Stack>

        {profiles.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
            Add at least two players to get started
          </Typography>
        )}

        <Stack spacing={1}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={setup.selectedProfileIds.length < 2}
            onClick={onContinue}
            startIcon={<PlayArrowOutlinedIcon />}
            sx={{ minHeight: 44, fontSize: '1rem', borderRadius: `${tokens.radius.lg}px` }}
          >
            Continue
          </Button>
          {hasResumableGame(state) && (
            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={onResume}
              startIcon={<ReplayOutlinedIcon />}
              sx={{ minHeight: 44, borderRadius: `${tokens.radius.lg}px` }}
            >
              Resume match
            </Button>
          )}
        </Stack>

        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          themeMode={themeMode}
          onThemeModeChange={onThemeModeChange}
          pricePerHour={pricePerHour}
          onPricePerHourChange={onPricePerHourChange}
        />
      </PageShell>
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
        onBestOfChange={onBestOfChange}
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
          <Typography sx={{ ...sx.labelCaps, mb: 1 }}>Players</Typography>
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
    <PageShell>
      <StepIndicator activeStep={wizardActiveStep(setup, step)} labels={stepLabels} />
      {body}
      <WizardFooter
        backLabel={step === 1 ? 'Players' : 'Back'}
        nextLabel={isReview ? 'Start match' : 'Next'}
        canNext={canNext}
        onBack={onWizardBack}
        onNext={isReview ? onStartMatch : onWizardNext}
        isReview={isReview}
      />
    </PageShell>
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
  return setup.selectedProfileIds.length > 2 && setup.multiPlayerFormat;
}

function playerMeta(setup, m) {
  if (setup.multiPlayerFormat === 'single' && setup.selectedProfileIds.length > 2) return '2–7 players';
  if (setup.multiPlayerFormat === 'tournament') return '2 per match';
  return m.maxPlayers > 2 ? '2–7 players' : '2 players';
}

function OptionsStep({
  setup,
  profiles,
  onPickTarget,
  onBestOfChange,
  onCustomTargetChange,
  onSwapSeeds,
}) {
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

  ensureTournamentSeedOrder(setup);
  return (
    <>
      <Typography sx={sx.sectionTitle}>Frame settings</Typography>
      <Typography sx={sx.sectionSubtitle}>Configure frames and bracket order</Typography>
      {shouldShowTournamentBracketSetup(setup, preset) && (
        <TournamentBracketSetup seedOrder={setup.tournamentSeedOrder} profiles={profiles} onSwap={onSwapSeeds} />
      )}
      <FormControl size="small" sx={{ minWidth: 160, mt: 1.5 }}>
        <InputLabel>Best of</InputLabel>
        <Select value={setup.bestOf} label="Best of" onChange={(e) => onBestOfChange(Number(e.target.value))}>
          {[1, 3, 5, 7, 9].map((b) => (
            <MenuItem key={b} value={b}>
              {b} frames
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
}
