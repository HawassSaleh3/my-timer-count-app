# SkillTimer - Smart Sports Skill Training App

A personalized training timer designed for athletes to practice and improve specific sports skills through timed training sessions, automatic repetitions, and scheduled rest periods.

## Features

- Fully responsive layout for phones, tablets and desktop (portrait and landscape)
- Create, edit, and delete custom exercises
- Upload instructional videos for each exercise
- Configurable training duration, rounds, and rest periods
- Loop or Play Once video playback modes
- Automatic interval timer with work, rest, preparation and round phases
- Pause / resume / restart a session at any time
- Built-in Web Audio sound cues (no downloads needed)
- Arabic and English localization with full RTL/LTR support
- Progressive Web App (PWA) support with offline caching
- Local-first data storage with IndexedDB

## Installation

The app can be installed as a PWA on supported browsers. Simply visit the site and use the browser's "Add to Home Screen" option.

## Development

```bash
# Serve the app locally
npx serve
# or
python -m http.server 8000
```

## Project Structure

```
SkillTimer/
├── index.html
├── manifest.json
├── service-worker.js
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── timer.js
│   ├── video.js
│   ├── storage.js
│   ├── notifications.js
│   └── i18n.js
└── assets/
    └── icons/
```

Sound cues are generated with the Web Audio API, so no audio files are
required and the app still works fully offline.

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT
