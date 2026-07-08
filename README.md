# Training Book app

This folder contains the live Training Book app files that get uploaded to the
public GitHub repo named `training-book`.

> **Current state (2026-07-08).** Data now lives in **Firebase** (Cloud
> Firestore), not Dropbox — the older Dropbox notes below are historical. The
> app is **multi-user**: each person signs in with their own Google account and
> gets a private data space scoped to `users/{uid}`. A brand-new account starts
> with a blank plan on top of the shared exercise-library catalog. The Firestore
> security rules are in `firestore.rules` (any signed-in user reads/writes only
> their own document + `backups`, plus the shared app-notes document
> `shared/appNotes`). App/product Notes are intentionally one shared
> database-backed list for Daniel and Shaina; they are not saved locally and are
> not private per user. `styles.css` was split into ordered
> `styles-01..07` part files, and the app script is split into ordered
> `app-01..12` classic-script files. The Firebase web API key in
> `app-12-bootstrap.js` is a public project identifier, not a secret. Onboard a new person via the AI prompt in
> `../../ai-fitness-coach/new-user-plan-prompt.md`.

It is intentionally simple static web files so GitHub Pages can host it:

- `index.html` - the visible app frame
- `styles-01..07.css` - the Focused Dark styling, split into ordered no-build parts
- `app-01..12.js` - app state, workout logging, library, plan, progress, coach,
  history, manual import/export, and final bootstrap wiring, split into ordered
  classic scripts
- `manifest.webmanifest` - install information for phone/desktop
- `sw.js` - small offline helper for app files
- `icons/icon.svg` - temporary home-screen icon
- `assets/icons/` - the exercise library's shared line glyphs and start/finish
  reference photos used by the Library screen and the "How to do it" sheet. This
  is a **published copy**; the source of truth is the repo-root `assets/icons/`
  folder, synced in by its `node sync-to-app.mjs` script. Don't hand-edit files
  here - edit the source and re-run the sync. See `../../assets/icons/README.md`.

Step 3 added a temporary visible Dropbox save/load test on the Today screen. It writes the real app data file, `/workout-data.json`, inside Daniel's Dropbox app folder for the Dropbox app currently named "Daniel Workout Sync Proof" and keeps a local browser backup.

Step 4 added the first browse-only Exercise Library screen: a 12-exercise starter set with clean placeholder line visuals and filters for location/equipment.

Step 5 delivered the Today-first planned routine flow: normal use now starts on Today, shows Daniel the planned routine for the day, lets him check exercises off, shows progress, and saves through the existing Dropbox/local engine. Manual/ad-hoc logging remains available as a fallback.

Step 6 is implemented and ready for testing. Export/import is the AI coach loop, and the daily-driver UX stays on Today: quick difficulty logging, actual performance steppers, swaps, skips, extras, and plan-vs-logged clarity while working out.

Before Step 6 is accepted as done, the sync/update UX needs one more reliability pass: replace the clunky one-button Dropbox connect/sync flow with a clearer Sync panel, and add a visible build/version plus an update refresh action for stubborn browser/PWA cache.

Future routine planning should be AI-ready, not AI-connected: Training Book should store private goals, preferences, routines, weekly plans, and workout logs in Dropbox app data, generate a copyable review packet for an outside AI coach, and import updated routines back into the app.

No private workout data, goals, health notes, secrets, or passwords belong in this folder. GitHub Pages hosts these files publicly; each user's actual workout data and planning context stay in Firebase (Cloud Firestore), private to their own Google account and protected by the Firestore security rules in `firestore.rules`.

The one intentional shared data slice is app/product Notes: ideas, bugs, and feature requests live in Firestore at `shared/appNotes` so both signed-in users see and edit the same current list from any phone or computer. Older per-user `appNotes` are migration input only.
