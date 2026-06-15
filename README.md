# Training Book app

This folder contains the live Training Book app files that get uploaded to the
public GitHub repo named `training-book`.

It is intentionally simple static web files so GitHub Pages can host it:

- `index.html` - the visible app frame
- `styles.css` - the Focused Dark styling
- `app.js` - tab navigation plus the Dropbox/local save-load engine
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

No private workout data, goals, health notes, Dropbox secrets, passwords, or hidden keys belong in this folder. GitHub Pages hosts these files publicly; Daniel's actual workout data and planning context stay in Dropbox behind Daniel's Dropbox login.
