# SkillTimer - Smart Sports Skill Training App

A personalized training timer designed for athletes to practice and improve specific sports skills through timed training sessions, automatic repetitions, and scheduled rest periods.

## Features

- Create, edit, and delete custom exercises
- Upload instructional videos for each exercise
- Configurable training duration, rounds, and rest periods
- Loop or Play Once video playback modes
- Automatic interval timer with sound notifications
- Arabic and English localization with RTL/LTR support
- Progressive Web App (PWA) support
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
    ├── icons/
    └── sounds/
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT
