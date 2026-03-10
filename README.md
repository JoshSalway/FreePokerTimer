# Free Poker Timer

A free, open-source poker tournament blind timer built as a single-page application with React and Vite. Deployed on [Netlify](https://www.netlify.com/).

## Features

- Circular countdown timer with drift-free accuracy
- Configurable blind structure with drag-and-drop reordering
- Quick setup generator for common tournament formats
- Ad-hoc break insertion that preserves and resumes level progress
- Auto-advance through levels with optional sound alerts
- Persists state to localStorage (survives page refresh)
- Tap-to-edit remaining time
- Keyboard shortcut: Space to play/pause

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Related Projects

| Project | Description |
|---------|-------------|
| [FreePokerTimer](https://github.com/JoshSalway/FreePokerTimer) | This project — free Vite/React SPA timer |
| [FreePokerTimer-Laravel](https://github.com/JoshSalway/FreePokerTimer-Laravel) | Laravel rebuild of the free timer (future replacement for this project) |
| [PokerTimer](https://github.com/JoshSalway/PokerTimer) | Poker Timer Pro — the paid SaaS product with advanced features |

The **FreePokerTimer-Laravel** project is a ground-up rewrite using Laravel and will eventually replace this Vite SPA. **PokerTimer** (Poker Timer Pro) is the commercial product offering premium features beyond what the free timer provides.
