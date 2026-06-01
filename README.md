# Snooker Score Counter

A mobile-friendly Progressive Web App (PWA) for keeping track of snooker scores, frames, breaks, and table math.

**Live Demo**: https://haroon966.github.io/snooker-scoure-counter-app/

## Features

- **Match setup wizard** — Add players → choose game → options → review → start
- **Game modes** — 1/6/10/15-ball snooker, race to score (50–150 or custom), timed (2–7 players)
- **Timed rules** — Countdown timer, red = 10 points, fouls 4/5/6/7/10, highest score wins
- **Dual / multi-player scoring** — Ball-labeled buttons; 3+ players use tap-to-select + shared pad
- **At the table** — Tap a player card to mark who is active; optional auto-switch on score
- **Break tracking** — Current break and highest break per player
- **Table helpers** — Reds potted (mode-dependent), points left, snookers required
- **Foul picker** — Mode-specific penalty points (includes 10 in timed)
- **Saved player roster** — Quick-add names from previous matches
- **Undo**, **share**, **PWA** offline support

## Development

```bash
npm install
npm run dev      # http://localhost:5173/snooker-scoure-counter-app/
npm test
npm run build    # output in dist/
npm run preview
```

## Deploy (GitHub Pages)

Push to `main`/`master` — GitHub Actions runs tests, builds `dist/`, and deploys via `.github/workflows/pages.yml`.

Enable **Settings → Pages → Source: GitHub Actions** on the repository.

The app is served at `/snooker-scoure-counter-app/` (`vite.config.js` `base`). Deep links (e.g. `/history`) use `public/404.html` to redirect into the app on GitHub Pages reload; `index.html` restores the route before React loads. The service worker cache version is set automatically at build time from `package.json` and the JS bundle hash.

## Production notes

- **Offline** — Production builds precache the app shell (HTML, JS, fonts, icons). Match data lives in `localStorage` and works without a network. Test with `npm run build && npm run preview`, open the app once online, then DevTools → Network → Offline and hard-reload. `npm run dev` disables the service worker so Vite HMR is not affected.
- **Persistence** — Match and profiles save to `localStorage`; quota errors show a toast and trim undo history automatically.
- **Resume** — Leaving a match saves progress; use **Resume Match** on the home screen.
- **Security** — Player names are escaped in the UI; photo avatars are resized before storage.
- **CI** — `npm test` and `npm run build` run on every push (see `.github/workflows/ci.yml`).

## How to Use

1. **Add players** on the home screen (profiles with name and photo/emoji).
2. **Select** at least 2 players, then **Continue**.
3. **Choose game type** — 1/6/10/15-ball, race to score, or timed.
4. Set **options** (target score, timer length, or best-of frames).
5. **Review** and **Start Match**.
6. Score during play; **Leave** (←) saves progress; **Resume Match** continues later.

| Ball   | Points |
|--------|--------|
| Red    | 1      |
| Yellow | 2      |
| Green  | 3      |
| Brown  | 4      |
| Blue   | 5      |
| Pink   | 6      |
| Black  | 7      |

## Project Structure

```
src/
  main.js           — App bootstrap and events
  state/            — Match state and actions
  rules/            — Snooker calculations
  storage/          — localStorage v2 + v1 migration
  ui/               — Render, avatars, home wizard
styles/             — CSS tokens and layout
public/             — manifest.json, service worker
tests/              — Vitest unit tests
```

## Browser Support

Modern browsers with ES modules, `localStorage`, and (optional) Service Workers.

## License

MIT License — feel free to use and modify!
