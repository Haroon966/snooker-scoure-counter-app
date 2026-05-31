# 🎱 Snooker Score Counter

A simple, mobile-friendly Progressive Web App (PWA) for keeping track of snooker scores.

**Live Demo**: https://haroon966.github.io/snooker-scoure-counter-app/

## Features

- **Dual Player Score Tracking** - Keep track of scores for both players
- **Break Counter** - Track the current break/run for each player
- **Ball Point Buttons** - Quick buttons for all ball values (1-7 points + 10 ball)
- **Foul Tracking** - Register fouls with automatic point allocation
- **Undo Function** - Revert the last action with full state restoration
- **Persistent Storage** - Scores automatically saved to browser storage
- **Offline Support** - Works completely offline as a PWA
- **Responsive Design** - Optimized for mobile and tablet devices
- **Customizable Player Names** - Edit player names during the match

## How to Use

1. **Open the App** - Visit the [live demo](https://haroon966.github.io/snooker-scoure-counter-app/) or open `index.html` in your browser
2. **Edit Player Names** - Click on player names to customize them
3. **Add Points** - Click the ball buttons (+1 to +7, +10) to add points
4. **Register Fouls** - Click the "Foul" button to add 4 points to opponent
5. **Undo** - Use the "↩ Undo Last Action" button to revert mistakes
6. **Reset** - Use "Reset Match" to start over

## Installation

### As a PWA on Mobile

- **iPhone**: Open in Safari, tap Share → Add to Home Screen
- **Android**: Open in Chrome, tap Menu → Install app

### Local Development

1. Clone the repository
   ```bash
   git clone https://github.com/Haroon966/snooker-scoure-counter-app.git
   ```
2. Open `index.html` in your browser
3. Start tracking scores!

## Ball Values in Snooker

- Red: 1 point
- Yellow: 2 points
- Green: 3 points
- Brown: 4 points
- Blue: 5 points
- Pink: 6 points
- Black: 7 points

## Files

- `index.html` - Main application
- `manifest.json` - PWA configuration
- `sw.js` - Service worker for offline support
- `README.md` - This file

## Browser Support

Works on all modern browsers that support:
- LocalStorage
- Service Workers
- ES6 JavaScript

## License

MIT License - Feel free to use and modify!