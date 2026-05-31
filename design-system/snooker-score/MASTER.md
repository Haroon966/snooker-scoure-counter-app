# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/snooker-score/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Snooker Score
**Direction:** Baize & Brass — Apple-inspired club elegance
**Target:** Professionals 25–40, clean and premium
**Stack:** React + MUI (tokens in `src/theme/`)

---

## Design Direction

Dark-first premium sports utility. Inspired by private snooker clubs: deep baize green, warm brass gold accents, generous spacing, and tabular score typography. Not playful or neon — refined, confident, tactile.

---

## Color Palette

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Background | `#0C1210` | `--color-bg` | App canvas |
| Surface | `#141C18` | `--color-surface` | Cards, panels |
| Elevated | `#1A2420` | `--color-elevated` | Inputs, chips |
| Baize Primary | `#1B6B52` | `--color-baize` | Brand, CTAs |
| Baize Light | `#2D8F6F` | `--color-baize-light` | Active states |
| Gold Accent | `#C9A962` | `--color-gold` | Labels, highlights |
| Text Primary | `#F5F3EF` | `--color-text` | Headings, scores |
| Text Secondary | `#9CA89F` | `--color-text-muted` | Descriptions |
| Success | `#34D399` | `--color-success` | Active player |
| Error | `#F87171` | `--color-error` | Fouls, destructive |
| Border | `rgba(201,169,98,0.12)` | `--color-border` | Dividers |

---

## Typography

- **Headings:** Outfit (500–700) — geometric, modern
- **Body:** Inter (400–700) — readable, professional
- **Scores:** Outfit, tabular-nums, -0.03em tracking

**Scale:** h5 page titles · subtitle2 section labels (uppercase gold) · body2 secondary · h4/h3 score display

---

## Spacing (8px grid)

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |

Page padding: 24–32px. Card padding: 20–24px. Section gaps: 24px+.

---

## Radius & Depth

| Element | Radius |
|---------|--------|
| Buttons, inputs | 12px |
| Cards | 16px |
| Modals | 24px |
| Avatars | 50% |

Shadows: subtle dark (`0 4px 16px rgba(0,0,0,0.4)`). Active glow: baize `0 0 24px rgba(45,143,111,0.2)`.

---

## Components

### Buttons
- Primary: baize gradient, 44px min-height, no uppercase
- Secondary (gold): start match, end match CTAs
- Outlined: gold border on hover

### Cards
- Dark surface + subtle gold border
- Selected: baize border + glow
- cursor: pointer on interactive cards

### Score Display
- Large tabular nums (2.75–3.5rem)
- Active player: baize tint background

### Ball Pad
- Authentic ball colors, 52px touch targets
- Active press scale 0.96 (not hover layout shift)

### Wizard
- Custom step indicator (not MUI Stepper)
- Fixed blur footer on mobile

---

## Anti-Patterns

- ❌ Pink/playful sports palette
- ❌ Emojis as UI icons (player avatar emojis OK)
- ❌ Cramped layouts (< 16px padding)
- ❌ Generic blue MUI defaults
- ❌ Hover-only interactions on mobile
- ❌ Layout-shifting scale on hover

---

## Pre-Delivery Checklist

- [ ] 44px minimum touch targets
- [ ] Tabular nums on all scores
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px
- [ ] Gold labels for section hierarchy
- [ ] Blur footers don't hide content (pb: 12 on wizard pages)
