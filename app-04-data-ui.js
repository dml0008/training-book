// ===== Data safety: merge, snapshots, and backups =====
// Background: cloud sync used to be naive last-write-wins by `updatedAt`. A
// device that woke up with empty/seeded defaults carried a brand-new timestamp,
// so its blank data could win and wipe real history off every other device.
// The functions below replace that with a content-preserving merge plus rolling
// local + cloud backups, so an empty/default copy can never destroy real work.

// True when the data holds anything the user would be upset to lose.
function hasRealHistory(data) {
  if (!data || typeof data !== "object") return false;
  const w = Array.isArray(data.workouts) ? data.workouts.length : 0;
  const c = Array.isArray(data.completedWorkouts) ? data.completedWorkouts.length : 0;
  const b = Array.isArray(data.bodyWeights) ? data.bodyWeights.length : 0;
  return w + c + b > 0;
}

// True when the plan looks like the untouched starter template - i.e. a freshly
// seeded device that has not been customised. Used so a fresh seed never
// overwrites a real, edited plan during a merge.
function looksLikeStarterPlan(data) {
  try {
    const starter = JSON.stringify(getStarterWeeklyPlan());
    const here = JSON.stringify(data?.weeklyPlan || {});
    if (here !== starter) return false;
    const starterIds = new Set(getStarterRoutines().map((r) => r.id));
    const ids = Array.isArray(data?.routines) ? data.routines.map((r) => r.id) : [];
    // Every routine is a starter routine and there are no extra/renamed ones.
    return ids.length > 0 && ids.every((id) => starterIds.has(id))
      && !(data?.activePlan && data.activePlan.name && data.activePlan.name !== "Current Training Plan");
  } catch {
    return false;
  }
}

// Union two arrays by a stable key, keeping the *first* seen for a given key.
// Callers pass the preferred list first.
function unionBy(preferred, other, keyFn) {
  const out = [];
  const seen = new Set();
  for (const item of [...(preferred || []), ...(other || [])]) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

// App notes need real per-item delete, unlike workout history which is unioned
// forever on purpose. A plain union can't tell "deleted on device A" apart from
// "never seen this device yet" - both just look like the id being absent from
// one side - so a stale copy anywhere always wins the note back. Fixing that
// means a delete has to leave behind a small tombstone ({ id, deleted: true,
// deletedAt }) instead of removing the item, so it's present-and-comparable on
// both sides. For each id seen on either side, keep whichever copy has the
// later updatedAt (a delete always stamps a fresh updatedAt, so it beats a
// stale add/edit from a device that hasn't caught up yet). Tombstones stay in
// data.appNotes permanently so a third, even-more-stale device can't undo the
// delete later; getVisibleNotes() is what hides them from the UI/export.
function mergeAppNotes(newer, older) {
  const byId = new Map();
  for (const note of [...(older || []), ...(newer || [])]) {
    if (!note || !note.id) continue;
    const existing = byId.get(note.id);
    if (!existing || Date.parse(note.updatedAt || 0) >= Date.parse(existing.updatedAt || 0)) {
      byId.set(note.id, note);
    }
  }
  return Array.from(byId.values());
}

// completedWorkouts (the dates the calendar / streak / weekly ring count as
// "worked out") is DERIVED data: it should be exactly the distinct dates that
// have a saved workout. Saving adds both together, but deleting or re-dating a
// workout used to leave a stale date behind - so a day showed as "done" with
// nothing in History (and the reverse: a re-dated workout's new day wasn't
// counted). Recompute it from the real workouts so it can never drift. Returns
// true if it changed anything (so callers can decide whether to persist/sync).
function reconcileCompletedWorkouts(data) {
  if (!data || !Array.isArray(data.workouts)) return false;
  const dates = Array.from(new Set(data.workouts.map((w) => w?.date).filter(Boolean))).sort();
  const prev = (Array.isArray(data.completedWorkouts) ? data.completedWorkouts : []).slice().sort();
  const changed = prev.length !== dates.length || prev.some((d, i) => d !== dates[i]);
  data.completedWorkouts = dates;
  return changed;
}

// Merge two copies of the whole data blob without ever dropping history.
// Lists (workouts, missed, body weights) are unioned; completed dates are then
// re-derived from the merged workouts (see reconcileCompletedWorkouts); plan and
// library follow whichever copy is newer, except a freshly-seeded starter plan
// never overrides a customised one. The result carries the latest timestamp.
function mergeWorkoutData(local, remote) {
  if (!remote) return local;
  if (!local) return remote;

  const lt = Date.parse(local.updatedAt || 0) || 0;
  const rt = Date.parse(remote.updatedAt || 0) || 0;
  const newer = lt >= rt ? local : remote;
  const older = lt >= rt ? remote : local;

  // Settings/plan/library come from the newer copy by default...
  const merged = { ...older, ...newer };

  // ...but a freshly-seeded starter plan must not clobber a customised one.
  if (looksLikeStarterPlan(newer) && !looksLikeStarterPlan(older)) {
    merged.activePlan = older.activePlan;
    merged.routines = older.routines;
    merged.weeklyPlan = older.weeklyPlan;
    if (Array.isArray(older.library) && older.library.length >= (newer.library?.length || 0)) {
      merged.library = older.library;
      merged.categories = older.categories;
    }
  }

  // History lists are always unioned so two devices can never delete each
  // other's sessions. Prefer the newer copy's version of a duplicate key.
  merged.workouts = unionBy(newer.workouts, older.workouts, (w) => w?.id || JSON.stringify(w));
  // Completed dates are derived from the (unioned) workouts, never unioned on
  // their own - that's what kept stale "done" days alive after a delete/re-date.
  reconcileCompletedWorkouts(merged);
  merged.missedWorkouts = unionBy(
    newer.missedWorkouts, older.missedWorkouts,
    (m) => (typeof m === "string" ? m : (m?.id || m?.date || JSON.stringify(m)))
  );
  merged.bodyWeights = unionBy(newer.bodyWeights, older.bodyWeights, (b) => b?.date || JSON.stringify(b));
  // App notes: a real per-item delete, tombstone-protected against resurrection
  // by a stale device - see mergeAppNotes() for why this can't be a plain union.
  merged.appNotes = mergeAppNotes(newer.appNotes, older.appNotes);
  const newerCoach = getCoachMeta(newer);
  const olderCoach = getCoachMeta(older);
  merged.coach = {
    ...olderCoach,
    ...newerCoach,
    history: unionBy(newerCoach.history, olderCoach.history, (entry) => entry?.id || JSON.stringify(entry)).slice(0, 20)
  };

  // Custom exercise photos are unusually easy to lose. The library is taken
  // wholesale from the newer copy, so any device carrying a library WITHOUT a
  // photo (e.g. one that hasn't run the library reseed, or a stale sync) would
  // silently drop a photo the user added elsewhere. Union custom photos across
  // BOTH copies onto the merged library so a photo that still exists anywhere
  // survives. The bias is deliberately toward keeping photos: a rare intentional
  // removal may need redoing, but an accidental wipe can never delete one.
  merged.library = preserveCustomPhotos(merged.library, newer.library, older.library);

  merged.updatedAt = new Date(Math.max(lt, rt)).toISOString();
  return merged;
}

// For each exercise in `library`, fill any missing customPhotos start/finish
// slot from the first source copy (passed newest-first) that still has it, so a
// merge never drops a custom photo that exists in either copy.
function preserveCustomPhotos(library, ...sources) {
  if (!Array.isArray(library)) return library;
  const byId = new Map();
  for (const src of sources) {
    if (!Array.isArray(src)) continue;
    for (const ex of src) {
      if (!ex || !ex.id || !ex.customPhotos) continue;
      const acc = byId.get(ex.id) || {};
      for (const slot of ["start", "finish"]) {
        if (ex.customPhotos[slot] && !acc[slot]) acc[slot] = ex.customPhotos[slot];
      }
      byId.set(ex.id, acc);
    }
  }
  if (!byId.size) return library;
  return library.map((ex) => {
    if (!ex || !ex.id) return ex;
    const saved = byId.get(ex.id);
    if (!saved) return ex;
    const next = { ...(ex.customPhotos || {}) };
    let changed = false;
    for (const slot of ["start", "finish"]) {
      if (!next[slot] && saved[slot]) { next[slot] = saved[slot]; changed = true; }
    }
    return changed ? { ...ex, customPhotos: next } : ex;
  });
}

// Cheap "do these differ in anything worth syncing" check, used to decide
// whether a merge result needs to be pushed back to the cloud.
function dataChanged(a, b) {
  const pick = (d) => JSON.stringify({
    workouts: d?.workouts || [],
    completedWorkouts: d?.completedWorkouts || [],
    missedWorkouts: d?.missedWorkouts || [],
    bodyWeights: d?.bodyWeights || [],
    weeklyPlan: d?.weeklyPlan || {},
    routines: d?.routines || [],
    activePlan: d?.activePlan || {},
    library: d?.library || [],
    categories: d?.categories || [],
    weightTarget: d?.weightTarget ?? null,
    appNotes: d?.appNotes || []
  });
  return pick(a) !== pick(b);
}

// ---- Rolling on-device snapshots (instant in-app undo) ----
// Each snapshot is a FULL copy of the data blob, so this count multiplies the
// app's localStorage footprint directly. Keep it modest: 6 undo points is plenty
// of safety net without crowding the per-site quota (which is what overflowed and
// blocked saves before). persistSnapshots() also trims further under pressure.
const LOCAL_SNAPSHOT_KEEP = 6;

// Store the snapshot list, dropping the oldest entries until it fits. Snapshots
// are the largest, most expendable thing we hold, so they yield space first
// rather than letting an oversized undo history wedge the quota for real saves.
function persistSnapshots(list) {
  let trimmed = list.slice(0, LOCAL_SNAPSHOT_KEEP);
  while (trimmed.length) {
    try {
      localStorage.setItem(STORAGE.localSnapshots, JSON.stringify(trimmed));
      return;
    } catch (error) {
      if (!isQuotaError(error) || trimmed.length === 1) {
        // Can't fit even a single snapshot: drop the cache entirely and move on.
        // Saves don't depend on snapshots, so this stays silent.
        localStorage.removeItem(STORAGE.localSnapshots);
        return;
      }
      trimmed = trimmed.slice(0, Math.ceil(trimmed.length / 2));
    }
  }
}

function getLocalSnapshots() {
  const list = readJson(STORAGE.localSnapshots);
  return Array.isArray(list) ? list : [];
}

// Save a snapshot of `data` (defaults to current local) under a short label,
// keeping the most recent LOCAL_SNAPSHOT_KEEP. Skips no-op duplicates so a row
// of identical syncs doesn't flood the list.
function pushLocalSnapshot(label, data) {
  try {
    const payload = data || readJson(STORAGE.localData);
    if (!payload || !hasRealHistory(payload)) return;
    const list = getLocalSnapshots();
    const last = list[0];
    if (last && !dataChanged(last.data, payload)) return;
    list.unshift({
      id: `${Date.now()}-${randomString(4)}`,
      savedAt: new Date().toISOString(),
      label: label || "snapshot",
      workoutCount: Array.isArray(payload.workouts) ? payload.workouts.length : 0,
      planName: payload.activePlan?.name || "",
      data: payload
    });
    persistSnapshots(list);
  } catch (e) {
    // Snapshots are a safety net; never let one break a save (e.g. quota).
    console.error("Local snapshot skipped:", e);
  }
}

// ---- Apply a recovered/merged blob everywhere and refresh the UI ----
// Used by reconcile and every restore path so screens update consistently.
function applyRecoveredData(data, { pushToCloud = false } = {}) {
  saveLocalData(data);
  refreshLibrary();
  renderFilterStrip();
  renderExercises();
  renderExercisePicker();
  renderTodayRoutine();
  renderActiveWorkout();
  renderPlan();
  renderHistory();
  if (typeof renderProgress === "function") renderProgress();
  if (pushToCloud && navigator.onLine) {
    uploadWorkoutData(data).then(clearPendingData).catch((e) => {
      markPendingData(data);
      console.error("Restore cloud push queued:", e);
    });
  }
}

// Wipe all logged history from THIS account while keeping the plan, routines and
// library. It sources the plan from the AUTHORITATIVE CLOUD copy (not the local
// cache), because right after a profile switch the local cache is momentarily
// empty - and an empty cache reads back as a blank starter plan, which must
// never be pushed over a real plan (the bug that wiped a freshly-switched
// account). It also archives the pre-clear state to cloud version history first
// so the clear stays undoable, then pushes the emptied copy (setDoc overwrite,
// not the union-merge) so it sticks. Returns { ok } for the caller's status.
// NOTE: run it on the device holding the data; switch OTHER devices away first
// or they can merge the old history back.
async function resetAccountHistory() {
  // Prefer the authoritative cloud copy for the plan/library; fall back to the
  // local cache only when signed out / offline. This is what stops a blank local
  // cache from clobbering a real plan.
  let base = null;
  if (_fb && _fbDoc) {
    try {
      const snap = await _fb.getDoc(_fbDoc);
      if (snap.exists()) base = snap.data();
    } catch (e) {
      console.error("Reset: cloud read failed, falling back to local copy:", e);
    }
  }
  if (!base) base = getLocalData();

  // Guard: a blank starter plan with no history is almost certainly an unloaded
  // cache, not a real account. Refuse rather than push a blank plan to the cloud.
  if (looksLikeStarterPlan(base) && !hasRealHistory(base)) {
    return { ok: false, reason: "not-loaded" };
  }

  // Safety net: keep an undo point of the pre-clear state in cloud version
  // history (only archives when there is real history worth keeping).
  if (hasRealHistory(base)) {
    try { await saveCloudBackup(base); }
    catch (e) { console.error("Reset: pre-clear backup skipped:", e); }
  }

  base.workouts = [];
  base.completedWorkouts = [];
  base.missedWorkouts = [];
  base.bodyWeights = [];
  base.updatedAt = new Date().toISOString();
  base.updatedBy = getDeviceId();
  // Drop on-device undo snapshots - they still hold the old history.
  localStorage.removeItem(STORAGE.localSnapshots);
  // Save + re-render every screen from the cleaned copy, and push it up
  // (overwrite, not union-merge).
  applyRecoveredData(base, { pushToCloud: true });
  return { ok: true };
}

// ---- Download / restore a backup file (works on every browser) ----
function downloadBackup() {
  const data = getLocalData();
  const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `training-book-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Read a chosen .json backup, snapshot the current state first, then merge it in
// (merge, not replace, so importing an old file can only add back lost history).
async function restoreFromFile(file) {
  const text = await file.text();
  const incoming = JSON.parse(text);
  if (!incoming || typeof incoming !== "object" || !Array.isArray(incoming.workouts)) {
    throw new Error("That file doesn't look like a Training Book backup.");
  }
  pushLocalSnapshot("before restore (file)");
  const merged = mergeWorkoutData(getLocalData(), incoming);
  merged.updatedAt = new Date().toISOString();
  merged.updatedBy = getDeviceId();
  applyRecoveredData(merged, { pushToCloud: true });
  return merged;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ===== Exercise glyphs =====
// Shared line glyphs (Tabler, MIT + Lucide biceps-flexed, ISC), inlined so the
// app works offline and the icons inherit the accent color via `stroke`. Each
// library exercise points at one of these by name in its `icon` field (which
// mirrors exercises.json -> icon.glyph). The matching source SVGs live in
// assets/icons/glyphs/. The decorative bounding-box <path> from each source
// file is intentionally dropped here so the card CSS does not draw a square.
// To add a glyph: copy the inner <path> shapes (minus the M0 0h24v24H0z box)
// from the new assets/icons/glyphs/<name>.svg and add a key below.
const EXERCISE_GLYPHS = {
  barbell: '<path d="M2 12h1" /><path d="M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2" /><path d="M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" /><path d="M9 12h6" /><path d="M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" /><path d="M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2" /><path d="M22 12h-1" />',
  "biceps-flexed": '<path d="M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1" /><path d="M15 14a5 5 0 0 0-7.584 2" /><path d="M9.964 6.825C8.019 7.977 9.5 13 8 15" />',
  dumbbell: '<path d="M7.026 9.61l-.95 -4.18a2 2 0 0 1 1.95 -2.43h8a2 2 0 0 1 2 2.43l-1 4.2" /><path d="M9.026 17.001h6" /><path d="M18.906 20.06a7.92 7.92 0 0 0 1 -5.33a8 8 0 1 0 -14.77 5.33a2 2 0 0 0 1.71 .94h10.36a2 2 0 0 0 1.7 -.94" />',
  gymnastics: '<path d="M7 7a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" /><path d="M13 21l1 -9l7 -6" /><path d="M3 11h6l5 1" /><path d="M11.5 8.5l4.5 -3.5" />',
  "jump-rope": '<path d="M6 14v-6a3 3 0 1 1 6 0v8a3 3 0 0 0 6 0v-6" /><path d="M16 5a2 2 0 0 1 2 -2a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2a2 2 0 0 1 -2 -2l0 -3" /><path d="M4 16a2 2 0 0 1 2 -2a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2a2 2 0 0 1 -2 -2l0 -3" />',
  run: '<path d="M11.007 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 17l5 1l.75 -1.5" /><path d="M15 21v-4l-4 -3l1 -6" /><path d="M7 12v-3l5 -1l3 3l3 1" />',
  soccer: '<path d="M3 17l5 1l.75 -1.5" /><path d="M14 21v-4l-4 -3l1 -6" /><path d="M6 12v-3l5 -1l3 3l3 1" /><path d="M18.007 19.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" /><path d="M10.007 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />',
  "stretching-2": '<path d="M6.5 21l3.5 -5" /><path d="M5 11l7 -2" /><path d="M16 21l-4 -7v-5l7 -4" /><path d="M9.007 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />',
  stretching: '<path d="M15 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M5 20l5 -.5l1 -2" /><path d="M18 20v-5h-5.5l2.5 -6.5l-5.5 1l1.5 2" />',
  walk: '<path d="M12 4a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M7 21l3 -4" /><path d="M16 21l-2 -4l-3 -3l1 -6" /><path d="M6 12l2 -3l4 -1l3 3l3 1" />',
  weight: '<path d="M9 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M6.835 9h10.33a1 1 0 0 1 .984 .821l1.637 9a1 1 0 0 1 -.984 1.179h-13.604a1 1 0 0 1 -.984 -1.179l1.637 -9a1 1 0 0 1 .984 -.821" />',
  yoga: '<path d="M4 20h4l1.5 -3" /><path d="M17 20l-1 -5h-5l1 -7" /><path d="M4 10l4 -1l4 -1l4 1.5l4 1.5" /><path d="M10.007 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />'
};

// Older custom-exercise icon names (from before the glyph library) map onto the
// closest glyph so any exercises Daniel already created keep a sensible icon.
const LEGACY_ICON_ALIASES = {
  pushup: "gymnastics", bench: "barbell", squat: "barbell", goblet: "dumbbell",
  deadlift: "barbell", pulldown: "weight", row: "dumbbell", press: "dumbbell",
  plank: "yoga", curl: "biceps-flexed", pressdown: "weight", treadmill: "run"
};

function getExerciseIcon(name) {
  const key = EXERCISE_GLYPHS[name] ? name : (LEGACY_ICON_ALIASES[name] || "dumbbell");
  return `<svg class="lw-glyph" viewBox="0 0 24 24" role="img" aria-label="${escapeHtml(name)} icon">${EXERCISE_GLYPHS[key]}</svg>`;
}

// ===== Lucide UI icons =====
// Small set of interface icons (nav bar, arrows, marks) embedded directly so
// the app needs no external icon library and keeps working offline. These are
// Lucide icons (ISC licensed) - the inner shapes only; getUiIcon wraps them in
// a consistent stroke-style <svg>. Add new ones here as we replace more symbols.
const UI_ICONS = {
  // Bottom nav
  dumbbell: '<path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.768 1.768a2 2 0 1 1-2.828-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>',
  "circle-plus": '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>',
  "layout-grid": '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  "clipboard-list": '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  "trending-up": '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  // Arrows / marks (used on back buttons; more of the sweep to follow)
  "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  "chevron-left": '<path d="m15 18-6-6 6-6"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  // Row actions (Edit / Swap / Remove + the edit-mode Save / Cancel)
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  "repeat": '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  "arrow-left-right": '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  "trash-2": '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  "help-circle": '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  "grip-vertical": '<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',
  "chevron-up": '<path d="m18 15-6-6-6 6"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  "plus-circle": '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/>',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  // Notes (header + live-workout topbar): durable product notes, not chat.
  "notebook-pen": '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  // Per-set "more" toggle in the History editor (reveals effort + note).
  "more-horizontal": '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  // "Report an issue" on the exercise how-to sheet.
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>'
};

function getUiIcon(name) {
  const inner = UI_ICONS[name];
  if (!inner) return "";
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

// Fill any element marked with data-icon="name" with its Lucide SVG. Called
// once at startup; safe to call again if more icons are added to the DOM.
function renderUiIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    const svg = getUiIcon(el.dataset.icon);
    if (svg) el.innerHTML = svg;
  });
}

// Settings sheet - opened from the gear button in the header. Holds the style
// guide link plus the Data & backups tools (download/restore + version history).
let settingsModalOpen = false;
let settingsBackupsView = false;      // is the "restore a previous version" list expanded?
let cloudBackupsCache = null;         // null = not loaded; [] = loaded but empty
let cloudBackupsLoading = false;

function formatBackupTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  });
}

function renderBackupRow(source, entry) {
  const when = formatBackupTime(entry.savedAt);
  const count = entry.workoutCount ?? (Array.isArray(entry.data?.workouts) ? entry.data.workouts.length : 0);
  const plan = entry.planName || entry.data?.activePlan?.name || "";
  const detail = [`${count} workout${count === 1 ? "" : "s"}`, plan].filter(Boolean).join(" · ");
  return `
    <div class="backup-row">
      <div class="backup-row-text">
        <span class="backup-row-when">${escapeHtml(when)}</span>
        <span class="backup-row-detail">${escapeHtml(detail)}</span>
      </div>
      <button class="quiet-button small-button" type="button"
        data-action="restore-backup" data-source="${source}" data-id="${escapeHtml(entry.id)}">Restore</button>
    </div>`;
}

function renderBackupsView() {
  const locals = getLocalSnapshots();
  const localHtml = locals.length
    ? locals.map((s) => renderBackupRow("local", s)).join("")
    : `<p class="plan-muted">No on-device versions yet.</p>`;

  let cloudHtml;
  if (!cloudUser) {
    cloudHtml = `<p class="plan-muted">Sign in to see cloud version history.</p>`;
  } else if (cloudBackupsLoading) {
    cloudHtml = `<p class="plan-muted">Loading cloud versions…</p>`;
  } else if (cloudBackupsCache === null) {
    cloudHtml = `<button class="quiet-button small-button" type="button" data-action="load-cloud-backups">Load cloud versions</button>`;
  } else if (cloudBackupsCache.length === 0) {
    cloudHtml = `<p class="plan-muted">No cloud versions yet.</p>`;
  } else {
    cloudHtml = cloudBackupsCache.map((b) => renderBackupRow("cloud", b)).join("");
  }

  return `
    <div class="settings-backups">
      <p class="backups-group-label">On this device</p>
      ${localHtml}
      <p class="backups-group-label">In the cloud</p>
      ${cloudHtml}
    </div>`;
}

function renderSettingsModal() {
  const root = document.querySelector("#settings-modal-root");
  if (!root) return;
  if (!settingsModalOpen) {
    root.innerHTML = "";
    return;
  }
  const localCount = getLocalSnapshots().length;
  root.innerHTML = `
    <div class="lw-sheet-scrim" role="presentation" data-settings-scrim>
      <section class="lw-sheet settings-sheet" role="dialog" aria-modal="true" aria-label="Settings">
        <div class="lw-sheet-head">
          <div>
            <h3>Settings</h3>
            <p>Tools and preferences for your training book.</p>
          </div>
          <button class="lw-sheet-close" type="button" data-action="close-settings" aria-label="Close settings">&times;</button>
        </div>
        <div class="settings-list">
          <a class="settings-row" href="styleguide.html">
            <span class="settings-row-icon" data-icon="sparkles" aria-hidden="true"></span>
            <span class="settings-row-text">
              <span class="settings-row-title">Style guide</span>
              <span class="settings-row-sub">Design tokens &amp; component reference</span>
            </span>
            <span class="settings-row-chev" data-icon="chevron-right" aria-hidden="true"></span>
          </a>

          <p class="settings-section-label">Data &amp; backups</p>

          <button class="settings-row" type="button" data-action="download-backup">
            <span class="settings-row-icon" data-icon="clipboard-list" aria-hidden="true"></span>
            <span class="settings-row-text">
              <span class="settings-row-title">Download backup file</span>
              <span class="settings-row-sub">Save a .json copy (keep it in your data folder)</span>
            </span>
          </button>

          <button class="settings-row" type="button" data-action="pick-restore-file">
            <span class="settings-row-icon" data-icon="circle-plus" aria-hidden="true"></span>
            <span class="settings-row-text">
              <span class="settings-row-title">Restore from a file</span>
              <span class="settings-row-sub">Load a backup .json — only ever adds back history</span>
            </span>
          </button>
          <input type="file" id="restore-file-input" accept="application/json,.json" hidden />

          <button class="settings-row" type="button" data-action="toggle-backups" aria-expanded="${settingsBackupsView}">
            <span class="settings-row-icon" data-icon="history" aria-hidden="true"></span>
            <span class="settings-row-text">
              <span class="settings-row-title">Restore a previous version</span>
              <span class="settings-row-sub">${localCount} saved on this device${cloudUser ? " · cloud history available" : ""}</span>
            </span>
            <span class="settings-row-chev" data-icon="${settingsBackupsView ? "chevron-up" : "chevron-down"}" aria-hidden="true"></span>
          </button>
          ${settingsBackupsView ? renderBackupsView() : ""}

          <button class="settings-row settings-row-danger" type="button" data-action="reset-history">
            <span class="settings-row-icon" data-icon="trash-2" aria-hidden="true"></span>
            <span class="settings-row-text">
              <span class="settings-row-title">Clear workout history</span>
              <span class="settings-row-sub">Start this account fresh — keeps your plan &amp; library</span>
            </span>
          </button>

          <p class="settings-foot-note" id="settings-data-status" role="status"></p>
        </div>
      </section>
    </div>
  `;
  renderUiIcons(root);
}

function setSettingsDataStatus(message, tone = "") {
  const el = document.querySelector("#settings-data-status");
  if (!el) return;
  el.textContent = message;
  el.className = `settings-foot-note${tone ? " " + tone : ""}`;
}

function openSettingsModal() {
  settingsModalOpen = true;
  settingsBackupsView = false;
  cloudBackupsCache = null;
  renderSettingsModal();
}

function closeSettingsModal() {
  settingsModalOpen = false;
  renderSettingsModal();
}

// Pull restored data into the app: keep the restored plan/library, but union in
// any workouts the current copy has that the snapshot lacks, so a restore can
// never delete a session logged since the snapshot. Bumps the timestamp so the
// recovered copy propagates to the other devices.
function restoreSnapshotData(restored) {
  if (!restored || typeof restored !== "object") return;
  pushLocalSnapshot("before restore", getLocalData());
  const current = getLocalData();
  const merged = { ...restored };
  merged.workouts = unionBy(restored.workouts, current.workouts, (w) => w?.id || JSON.stringify(w));
  merged.completedWorkouts = Array.from(new Set([
    ...(restored.completedWorkouts || []),
    ...(current.completedWorkouts || [])
  ]));
  merged.bodyWeights = unionBy(restored.bodyWeights, current.bodyWeights, (b) => b?.date || JSON.stringify(b));
  merged.updatedAt = new Date().toISOString();
  merged.updatedBy = getDeviceId();
  applyRecoveredData(merged, { pushToCloud: true });
}

// Wire the Data & backups controls. Attached once; works across re-renders
// because the listener lives on the modal root and matches by data-action.
async function handleSettingsDataAction(event) {
  const btn = event.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  try {
    if (action === "download-backup") {
      downloadBackup();
      setSettingsDataStatus("Backup file downloaded.", "good");
    } else if (action === "pick-restore-file") {
      document.querySelector("#restore-file-input")?.click();
    } else if (action === "toggle-backups") {
      settingsBackupsView = !settingsBackupsView;
      renderSettingsModal();
    } else if (action === "load-cloud-backups") {
      cloudBackupsLoading = true; renderSettingsModal();
      cloudBackupsCache = await listCloudBackups();
      cloudBackupsLoading = false; renderSettingsModal();
    } else if (action === "restore-backup") {
      const { source, id } = btn.dataset;
      let data = null;
      if (source === "local") {
        data = getLocalSnapshots().find((s) => s.id === id)?.data || null;
      } else {
        setSettingsDataStatus("Fetching that version…");
        data = await fetchCloudBackup(id);
      }
      if (!data) { setSettingsDataStatus("Couldn't load that version.", "bad"); return; }
      restoreSnapshotData(data);
      const n = Array.isArray(data.workouts) ? data.workouts.length : 0;
      setSettingsDataStatus(`Restored: ${n} workout${n === 1 ? "" : "s"} are back.`, "good");
    } else if (action === "reset-history") {
      const who = cloudUser ? (cloudUser.name || cloudUser.email) : "this device";
      const ok = await showConfirmModal({
        title: "Clear all workout history?",
        message: `This removes every logged workout, completed day and body-weight entry from ${who}. Your plan, routines and exercise library are kept, and a restore point is saved to version history first. Switch any other devices away from this account before doing this so the history can't sync back.`,
        confirmLabel: "Clear history",
        danger: true
      });
      if (!ok) return;
      setSettingsDataStatus("Clearing history…");
      const result = await resetAccountHistory();
      if (!result?.ok) {
        setSettingsDataStatus("Your data isn't fully loaded yet — close and reopen the app, let it sync, then try again.", "bad");
        return;
      }
      setSettingsDataStatus("History cleared. Your plan and library were kept.", "good");
    }
  } catch (error) {
    setSettingsDataStatus(error.message || "Something went wrong.", "bad");
  }
}

async function handleRestoreFileChosen(event) {
  if (event.target.id !== "restore-file-input") return;
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    setSettingsDataStatus("Reading backup…");
    const merged = await restoreFromFile(file);
    const n = Array.isArray(merged.workouts) ? merged.workouts.length : 0;
    setSettingsDataStatus(`Restored from file: ${n} workout${n === 1 ? "" : "s"} now on this device.`, "good");
  } catch (error) {
    setSettingsDataStatus(error.message || "That file could not be read.", "bad");
  } finally {
    event.target.value = "";
  }
}
