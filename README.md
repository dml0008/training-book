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

Step 3 added a temporary visible Dropbox save/load test on the Today screen. It writes the real app data file, `/workout-data.json`, inside Daniel's Dropbox app folder for the Dropbox app currently named "Daniel Workout Sync Proof" and keeps a local browser backup.

Step 4 added the first browse-only Exercise Library screen: a 12-exercise starter set with clean placeholder line visuals and filters for location/equipment.

Step 5 started as a manual Log screen draft, but the product direction has pivoted: normal use should be Today-first planned routines. Manual/ad-hoc logging can remain as a fallback, while the main flow should show Daniel the planned routine for today, let him check/log it off, and save it through the existing Dropbox/local engine.

Future routine planning should be AI-ready, not AI-connected: Training Book should store private goals, preferences, routines, weekly plans, and workout logs in Dropbox app data, generate a copyable review packet for an outside AI coach, and import updated routines back into the app.

No private workout data, goals, health notes, Dropbox secrets, passwords, or hidden keys belong in this folder. GitHub Pages hosts these files publicly; Daniel's actual workout data and planning context stay in Dropbox behind Daniel's Dropbox login.
