# GymApp

A personal workout and body-weight tracker for iPhone, built as an installable
web app (PWA). Everything is stored on the phone and works without signal.

## Layout

| Folder | What it is |
|---|---|
| `frontend/` | The app: React 19, Vite 8, Tailwind 3, `vite-plugin-pwa`, Dexie (IndexedDB) |
| `backend/` | Early Fastify + Prisma prototype, parked. May become optional sync/backup later |
| `legacy/static-prototype/` | The very first static HTML mockup, kept for reference |

## Run it

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Open the printed URL. To try it on an iPhone on the same Wi-Fi, open the
"Network" URL in Safari. `/design` shows all UI components.

```bash
npm --prefix frontend run build     # production build with service worker
npm --prefix frontend run preview   # serve the build locally
```

## Deploy

Every push to `main` builds, tests and publishes the app to GitHub Pages
(`.github/workflows/deploy.yml`) at `https://<user>.github.io/gymapp/`.
Pull requests run lint, tests and a build (`ci.yml`).

The site only holds the app's code. Workouts and weigh-ins are stored in the
phone's browser storage and never leave the phone.

On the iPhone: open the URL in **Safari** → **Share** → **Add to Home Screen**.
Updates install themselves the next time the app is opened online.

## Design

- Tabs: **Train · Exercises · Measure · History**; Settings from the gear on Train.
- Dark by default, light when the phone is in light mode; accent colour can be changed in Settings.
- Colours are CSS variables in `frontend/src/styles/tokens.css`, mapped to Tailwind
  names (`bg-surface`, `text-ink-2`, `bg-accent`, …) in `tailwind.config.js`.
- Weights and reps are entered with the app's own number pad, never the iOS keyboard.
