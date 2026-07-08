const DROPBOX_AUTHORIZE_URL = "https://www.dropbox.com/oauth2/authorize";
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload";
const DROPBOX_DOWNLOAD_URL = "https://content.dropboxapi.com/2/files/download";
const DATA_FILE_PATH = "/04_Technical/06_Side_Projects/Workout and Nutrition App/data/workout-data.json";
const APP_VERSION = "1.0.35";
const SOCCER_DURATION_MINUTES = 60;

const STORAGE = {
  appKey: "trainingBookDropboxAppKey",
  verifier: "trainingBookDropboxVerifier",
  state: "trainingBookDropboxState",
  accessToken: "trainingBookDropboxAccessToken",
  accessTokenExpiresAt: "trainingBookDropboxAccessTokenExpiresAt",
  refreshToken: "trainingBookDropboxRefreshToken",
  localData: "trainingBookWorkoutData",
  pendingData: "trainingBookPendingWorkoutData",
  localSnapshots: "trainingBookLocalSnapshots",
  // The uid of the account whose data currently sits in localData. Used to
  // detect a profile switch (a DIFFERENT person signing in on this device) so
  // one account's working copy can never bleed into - or, via merge, overwrite
  // - another account's data. See clearDeviceLocalData / onAuthStateChanged.
  localDataOwner: "trainingBookLocalDataOwner",
  activeWorkoutDraft: "trainingBookActiveWorkoutDraft",
  workoutFlowMode: "trainingBookWorkoutFlowMode",
  deviceId: "trainingBookDeviceId",
  activeTab: "trainingBookActiveTab",
  soccerSeeded: "trainingBookSoccerSeeded",
  libraryV2Seeded: "trainingBookLibraryV2Seeded",
  libraryV3Merged: "trainingBookLibraryV3Merged",
  libraryFieldsRefreshed: "trainingBookLibraryFieldsRefreshed",
  pelotonSeeded: "trainingBookPelotonSeeded",
  pickleballSeeded: "trainingBookPickleballSeeded",
  sportTypeFixed: "trainingBookSportTypeFixed",
  catalogDataFixed: "trainingBookCatalogDataFixed",
  pelotonBikeHistoryFixed: "trainingBookPelotonBikeHistoryFixed"
};

const screens = Array.from(document.querySelectorAll(".screen"));
const tabs = Array.from(document.querySelectorAll(".tab"));
const dateLabel = document.querySelector("#today-date");
const todayRoutineName = document.querySelector("#today-routine-name");
const todayRoutineList = document.querySelector("#today-routine-list");
const reviewReminder = document.querySelector("#review-reminder");
const reviewReminderSub = document.querySelector("#review-reminder-sub");
const reviewReminderGo = document.querySelector("#review-reminder-go");
const reviewReminderDismiss = document.querySelector("#review-reminder-dismiss");
const todayProgressNumber = document.querySelector("#today-progress-number");
const todayProgressLabel = document.querySelector("#today-progress-label");
const saveTodayWorkoutButton = document.querySelector("#save-today-workout");
const todayStartRow = document.querySelector("#today-start-row");
const startTodayButton = document.querySelector("#start-today-workout");
const startCustomButton = document.querySelector("#start-custom-workout");
const todayBackButton = document.querySelector("#today-back-button");
const todayPreviewSub = document.querySelector("#today-preview-sub");
const todayDaySwitch = document.querySelector("#today-day-switch");
const todayDayName = document.querySelector("#today-day-name");
const dayPrevButton = document.querySelector("#day-prev");
const dayNextButton = document.querySelector("#day-next");
const dayTodayResetButton = document.querySelector("#day-today-reset");
const openCalendarButton = document.querySelector("#open-calendar");
const calendarModalRoot = document.querySelector("#calendar-modal-root");
const todayFooter = document.querySelector(".today-footer");
const todayAddExtra = document.querySelector(".today-add-extra");
const todayExtraPicker = document.querySelector("#today-extra-picker");
const addTodayExtraButton = document.querySelector("#add-today-extra");
const syncPill = document.querySelector("#sync-pill");
const syncPillLabel = document.querySelector("#sync-pill-label");
const syncPanel = document.querySelector("#sync-panel");
const appVersionLabel = document.querySelector("#app-version");
const connectDropboxButton = document.querySelector("#connect-dropbox");
const retrySyncButton = document.querySelector("#retry-sync");
const loadLatestButton = document.querySelector("#load-latest");
const resetDropboxButton = document.querySelector("#reset-dropbox");
const refreshAppButton = document.querySelector("#refresh-app");
const historyContent = document.querySelector("#history-content");
const progressContent = document.querySelector("#progress-content");
const planContent = document.querySelector("#plan-content");
const coachContent = document.querySelector("#coach-content");
const exerciseList = document.querySelector("#exercise-list");
const libraryCount = document.querySelector("#library-count");
const filterStrip = document.querySelector("#filter-strip");
const logDate = document.querySelector("#log-date");
const workoutNameInput = document.querySelector("#workout-name");
const exercisePicker = document.querySelector("#exercise-picker");
const addExerciseButton = document.querySelector("#add-exercise");
const activeWorkoutList = document.querySelector("#active-workout-list");
const workoutProgressNumber = document.querySelector("#workout-progress-number");
const workoutProgressLabel = document.querySelector("#workout-progress-label");
const workoutSaveStatus = document.querySelector("#workout-save-status");
const saveWorkoutButton = document.querySelector("#save-workout");
const appKeyInput = document.querySelector("#app-key");
const syncStatus = document.querySelector("#sync-status");
const cloudSignInButton = document.querySelector("#cloud-signin");
const cloudSignOutButton = document.querySelector("#cloud-signout");
const cloudSwitchButton = document.querySelector("#cloud-switch");
const signinGate = document.querySelector("#signin-gate");

let confirmModalResolve = null;

function getConfirmModalRoot() {
  let root = document.querySelector("#confirm-modal-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "confirm-modal-root";
    document.body.appendChild(root);
  }
  return root;
}

function closeConfirmModal(result = false) {
  const root = document.querySelector("#confirm-modal-root");
  if (root) root.innerHTML = "";
  if (confirmModalResolve) {
    confirmModalResolve(result);
    confirmModalResolve = null;
  }
}

function showConfirmModal({ title, message, confirmLabel = "Delete", danger = true, kicker = null, hideCancel = false }) {
  if (confirmModalResolve) closeConfirmModal(false);
  const root = getConfirmModalRoot();
  // The kicker labels what kind of dialog this is. Callers can set it
  // explicitly (e.g. status modals); otherwise fall back to confirm-action
  // wording. Never assume "danger" means a deletion - a failed save is also
  // "danger" but is not a deletion, which is what used to mislabel it.
  const kickerText = kicker || (danger ? "Confirm deletion" : "Confirm change");
  root.innerHTML = `
    <div class="confirm-scrim" role="presentation" data-action="confirm-cancel">
      <section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <p class="card-kicker">${escapeHtml(kickerText)}</p>
        <h2 id="confirm-title">${escapeHtml(title)}</h2>
        <p>${escapeHtml(message)}</p>
        <div class="confirm-actions">
          ${hideCancel ? "" : `<button class="quiet-button small-button" type="button" data-action="confirm-cancel">Cancel</button>`}
          <button class="primary-button small-button${danger ? " danger-button" : ""}" type="button" data-action="confirm-ok">${escapeHtml(confirmLabel)}</button>
        </div>
      </section>
    </div>
  `;
  return new Promise((resolve) => {
    confirmModalResolve = resolve;
    root.querySelector("[data-action='confirm-ok']")?.focus();
  });
}

// An informational dialog (success / warning / error) - not a yes/no choice.
// It reuses the confirm modal's chrome but shows a tone-appropriate kicker and
// a single dismiss button, so it never reads as a deletion or a real decision.
function showStatusModal({ title, message, tone = "good", confirmLabel = "Done" }) {
  const kicker =
    tone === "bad" ? "Something went wrong" :
    tone === "warn" ? "Heads up" :
    tone === "danger" ? "Please note" :
    "All set";
  return showConfirmModal({
    title,
    message,
    confirmLabel,
    danger: tone === "danger" || tone === "bad",
    kicker,
    hideCancel: true
  });
}

document.addEventListener("click", (event) => {
  const confirmRoot = event.target.closest("#confirm-modal-root");
  if (!confirmRoot) return;
  const actionTarget = event.target.closest("[data-action]");
  const action = actionTarget?.dataset.action;
  if (!action && event.target.closest(".confirm-modal")) return;
  if (action === "confirm-ok") closeConfirmModal(true);
  if (action === "confirm-cancel" && !event.target.closest(".confirm-modal, [data-action='confirm-ok']")) closeConfirmModal(false);
  if (action === "confirm-cancel" && actionTarget?.tagName === "BUTTON") closeConfirmModal(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.querySelector("#confirm-modal-root .confirm-modal")) {
    closeConfirmModal(false);
  }
  if (event.key === "Escape" && coachChangeReview) closeCoachChanges();
  else if (event.key === "Escape" && coachModalMode) closeCoachReviewModal();
});

// ===== Firebase cloud sync state (replaces the old Dropbox sync) =====
// These hold the signed-in user and the live database connection. They are
// filled in once Firebase loads (see initCloud at the bottom of this file).
let cloudUser = null;     // { uid, email, name } when signed in, else null
let firebaseLoaded = false; // true once the Firebase SDK has loaded this session
let authChecked = false;    // true once Firebase has reported the initial auth state
let _fbDoc = null;        // reference to this user's data document
let _setDoc = null;       // Firebase's save function, captured after it loads
let _cloudUnsub = null;   // function to stop listening for remote changes
let _sharedAppNotesDoc = null; // shared product notes document for every signed-in user
let _sharedNotesUnsub = null;  // listener for the shared notes document
let sharedAppNotesCache = null; // latest shared list, reapplied after user-data syncs
let _fb = null;           // captured Firestore module helpers (see initCloud)
let _coachReviewCallable = null; // callable cloud helper; reads only this signed-in user's Firestore doc

const coachReviewState = {
  status: "idle",
  action: "",
  reviewType: "",
  checkin: "",
  changes: [],
  importBlock: "",
  message: "",
  generatedAt: "",
  packetMeta: null
};
let coachSessionCostConfirmed = false;
let coachModalReviewId = "";
let coachModalMode = "";
let coachChangeReview = null;
// Coach-apply wizard: "select" (pick changes) -> "confirm" (final review) ->
// "done" (applied confirmation). The whole flow now lives in the Coach modal
// instead of handing off to the Plan importer.
let coachChangeStep = "select";
let coachChangeSelection = [];
let coachChangeAppliedCount = 0;

// How many rolling version-history copies to keep in the cloud. Each is a small
// JSON snapshot; 30 is plenty to undo an accident and stays free-tier friendly.
const CLOUD_BACKUP_KEEP = 30;

// Save the whole data blob to the cloud database for the signed-in user, and
// (best-effort) tuck a timestamped copy into a version-history subcollection so
// a bad overwrite from any single device can always be rolled back. The history
// write never blocks or fails the main save.
async function cloudSave(data) {
  if (!_fbDoc || !_setDoc) throw new Error("Sign in to sync across your devices.");
  normalizeSoccerDurationInData(data);
  await _setDoc(_fbDoc, data);
  saveCloudBackup(data).catch((e) => console.error("Cloud backup write skipped:", e));
}

// Write one version-history snapshot and prune the oldest beyond the keep limit.
async function saveCloudBackup(data) {
  if (!_fb || !cloudUser) return;
  // Don't archive empty/default states - they are not worth keeping and would
  // push real snapshots out of the keep window.
  if (!hasRealHistory(data)) return;
  const col = _fb.collection(_fb.db, "users", cloudUser.uid, "backups");
  const id = `${Date.now()}-${getDeviceId()}`;
  await _fb.setDoc(_fb.doc(col, id), {
    savedAt: new Date().toISOString(),
    savedBy: getDeviceId(),
    workoutCount: Array.isArray(data.workouts) ? data.workouts.length : 0,
    planName: data.activePlan?.name || "",
    data
  });
  // Prune oldest beyond the keep limit.
  try {
    const snap = await _fb.getDocs(_fb.query(col, _fb.orderBy("savedAt", "desc")));
    const docs = snap.docs;
    for (let i = CLOUD_BACKUP_KEEP; i < docs.length; i += 1) {
      _fb.deleteDoc(docs[i].ref).catch(() => {});
    }
  } catch {
    // Pruning is best-effort; a failure here is harmless.
  }
}

// List version-history snapshots (newest first) for the restore UI.
async function listCloudBackups() {
  if (!_fb || !cloudUser) return [];
  const col = _fb.collection(_fb.db, "users", cloudUser.uid, "backups");
  const snap = await _fb.getDocs(_fb.query(col, _fb.orderBy("savedAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function fetchCloudBackup(id) {
  if (!_fb || !cloudUser) return null;
  const col = _fb.collection(_fb.db, "users", cloudUser.uid, "backups");
  const d = await _fb.getDoc(_fb.doc(col, id));
  return d.exists() ? d.data().data : null;
}

function sharedAppNotesPayload(notes) {
  return {
    notes: Array.isArray(notes) ? notes : [],
    updatedAt: new Date().toISOString(),
    updatedBy: getDeviceId()
  };
}

async function saveSharedAppNotes(notes) {
  if (!_sharedAppNotesDoc || !_fb?.setDoc) throw new Error("Sign in to sync shared notes.");
  await _fb.setDoc(_sharedAppNotesDoc, sharedAppNotesPayload(notes));
}

// The short label shown in the header pill while signed in: the account's first
// name (from the Google display name) or, failing that, the part of the email
// before the @. This is what tells Daniel at a glance WHICH profile is active -
// important now the app is multi-user and he switches between his and his wife's.
function signedInLabel() {
  if (!cloudUser) return "";
  const name = (cloudUser.name || "").trim();
  if (name) return name.split(/\s+/)[0];
  const email = (cloudUser.email || "").trim();
  return email ? email.split("@")[0] : "Account";
}

// Update the header pill and the sync panel to reflect signed-in / signed-out.
function updateCloudUi() {
  const signedIn = Boolean(cloudUser);
  // Signed-out gate: only once Firebase has actually reported "no user" (never
  // during the brief load, and never when the SDK failed to load - offline mode
  // still works locally there). While it's up, the device holds no account data.
  if (signinGate) signinGate.hidden = !(firebaseLoaded && authChecked && !signedIn);
  if (cloudSignInButton) cloudSignInButton.hidden = signedIn;
  if (cloudSignOutButton) cloudSignOutButton.hidden = !signedIn;
  if (cloudSwitchButton) cloudSwitchButton.hidden = !signedIn;
  // Pill shows the signed-in person's name (not just "Synced") so it's always
  // clear whose data is loaded; the green dot/state still signals it's syncing.
  if (syncPillLabel) syncPillLabel.textContent = signedIn ? signedInLabel() : "Sign in";
  if (syncPill) {
    syncPill.className = signedIn ? "sync-pill good" : "sync-pill";
    syncPill.title = signedIn ? `Signed in as ${cloudUser.email}` : "Open sync panel";
  }
  if (syncStatus) {
    const who = cloudUser ? (cloudUser.name ? `${cloudUser.name} (${cloudUser.email})` : cloudUser.email) : "";
    syncStatus.textContent = signedIn
      ? `Signed in as ${who}. Your workouts sync automatically across your devices. Use "Switch account" to load a different person's plan on this device.`
      : "Sign in with Google to sync your workouts across your phone and desktop.";
    syncStatus.className = signedIn ? "sync-status good" : "sync-status";
  }
  refreshCoachIfVisible();
}

function refreshCoachIfVisible() {
  const active = document.querySelector(".screen.is-active");
  if (active?.dataset.screen === "coach" && typeof renderCoach === "function") {
    renderCoach();
  }
}

if (appVersionLabel) {
  appVersionLabel.textContent = `v${APP_VERSION}`;
}

const today = new Date();
const todayDisplay = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric"
}).format(today);

// The exercise library now lives in Daniel's saved/synced data (data.library).
// getStarterExercises() is the one-time seed used the first time the app runs
// (or after a data reset). `exercises` is the live list the whole app reads;
// refreshLibrary() reloads it from saved data after a change or a cloud sync.
let exercises = getStarterExercises();

// Filter categories are now editable user data (data.categories) rather than
// hardcoded chips. Each is { key, label }: `key` is what gets stored in an
// exercise's `tags` array; `label` is what we show. `categories` is the live
// list; refreshLibrary() reloads it alongside the exercises.
let categories = getStarterCategories();

function getStarterCategories() {
  return [
    { key: "home", label: "Home" },
    { key: "gym", label: "Gym" },
    { key: "bodyweight", label: "No equipment" },
    { key: "dumbbells", label: "Dumbbells" },
    { key: "machine", label: "Cable/machine" },
    { key: "cardio", label: "Cardio" }
  ];
}

function getStarterExercises() {
  return [
  {
    id: "barbell-bench-press",
    name: "Barbell Bench Press",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "barbell",
    primaryMuscle: "chest",
    secondaryMuscles: [{"muscle":"shoulders","weight":0.4},{"muscle":"triceps","weight":0.3}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/barbell-bench-press/start.jpg", finish: "assets/icons/photos/barbell-bench-press/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "incline-bench-press",
    name: "Incline Bench Press",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "barbell",
    primaryMuscle: "chest",
    secondaryMuscles: [{"muscle":"shoulders","weight":0.5},{"muscle":"triceps","weight":0.3}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/incline-bench-press/start.jpg", finish: "assets/icons/photos/incline-bench-press/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "dumbbell-bench-press",
    name: "Dumbbell Bench Press",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "dumbbell",
    primaryMuscle: "chest",
    secondaryMuscles: [{"muscle":"shoulders","weight":0.4},{"muscle":"triceps","weight":0.3}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/dumbbell-bench-press/start.jpg", finish: "assets/icons/photos/dumbbell-bench-press/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "dumbbell-fly",
    name: "Dumbbell Fly",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "dumbbell",
    primaryMuscle: "chest",
    secondaryMuscles: [],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/dumbbell-fly/start.jpg", finish: "assets/icons/photos/dumbbell-fly/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "push-up",
    name: "Push-Up",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "body only",
    primaryMuscle: "chest",
    secondaryMuscles: [{"muscle":"shoulders","weight":0.3},{"muscle":"triceps","weight":0.3},{"muscle":"abdominals","weight":0.2}],
    dualStack: false,
    icon: "gymnastics",
    photos: { start: "assets/icons/photos/push-up/start.jpg", finish: "assets/icons/photos/push-up/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "chest-dip",
    name: "Chest Dip",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "body only",
    primaryMuscle: "chest",
    secondaryMuscles: [{"muscle":"triceps","weight":0.5},{"muscle":"shoulders","weight":0.3}],
    dualStack: false,
    icon: "gymnastics",
    photos: { start: "assets/icons/photos/chest-dip/start.jpg", finish: "assets/icons/photos/chest-dip/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "cable-crossover",
    name: "Cable Crossover",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "cable",
    primaryMuscle: "chest",
    secondaryMuscles: [],
    dualStack: true,
    icon: "weight",
    photos: { start: "assets/icons/photos/cable-crossover/start.jpg", finish: "assets/icons/photos/cable-crossover/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "deadlift",
    name: "Deadlift",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "barbell",
    primaryMuscle: "lower back",
    secondaryMuscles: [{"muscle":"hamstrings","weight":0.7},{"muscle":"glutes","weight":0.6},{"muscle":"forearms","weight":0.3}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/deadlift/start.jpg", finish: "assets/icons/photos/deadlift/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "barbell",
    primaryMuscle: "hamstrings",
    secondaryMuscles: [{"muscle":"glutes","weight":0.6},{"muscle":"lower back","weight":0.4}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/romanian-deadlift/start.jpg", finish: "assets/icons/photos/romanian-deadlift/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "pull-up",
    name: "Pull-Up",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "body only",
    primaryMuscle: "lats",
    secondaryMuscles: [{"muscle":"biceps","weight":0.5},{"muscle":"shoulders","weight":0.2}],
    dualStack: false,
    icon: "gymnastics",
    photos: { start: "assets/icons/photos/pull-up/start.jpg", finish: "assets/icons/photos/pull-up/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "chin-up",
    name: "Chin-Up",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "body only",
    primaryMuscle: "lats",
    secondaryMuscles: [{"muscle":"biceps","weight":0.6},{"muscle":"shoulders","weight":0.2}],
    dualStack: false,
    icon: "gymnastics",
    photos: { start: "assets/icons/photos/chin-up/start.jpg", finish: "assets/icons/photos/chin-up/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "cable",
    primaryMuscle: "lats",
    secondaryMuscles: [{"muscle":"biceps","weight":0.4}],
    dualStack: true,
    icon: "weight",
    photos: { start: "assets/icons/photos/lat-pulldown/start.jpg", finish: "assets/icons/photos/lat-pulldown/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "bent-over-row",
    name: "Bent-Over Barbell Row",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "barbell",
    primaryMuscle: "middle back",
    secondaryMuscles: [{"muscle":"biceps","weight":0.4},{"muscle":"lats","weight":0.3}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/bent-over-row/start.jpg", finish: "assets/icons/photos/bent-over-row/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "seated-cable-row",
    name: "Seated Cable Row",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "cable",
    primaryMuscle: "middle back",
    secondaryMuscles: [{"muscle":"biceps","weight":0.4},{"muscle":"lats","weight":0.2}],
    dualStack: true,
    icon: "weight",
    photos: { start: "assets/icons/photos/seated-cable-row/start.jpg", finish: "assets/icons/photos/seated-cable-row/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "one-arm-dumbbell-row",
    name: "One-Arm Dumbbell Row",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "dumbbell",
    primaryMuscle: "middle back",
    secondaryMuscles: [{"muscle":"biceps","weight":0.4},{"muscle":"lats","weight":0.3}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/one-arm-dumbbell-row/start.jpg", finish: "assets/icons/photos/one-arm-dumbbell-row/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "face-pull",
    name: "Face Pull",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "cable",
    primaryMuscle: "shoulders",
    secondaryMuscles: [{"muscle":"middle back","weight":0.3}],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/face-pull/start.jpg", finish: "assets/icons/photos/face-pull/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "overhead-press",
    name: "Overhead Barbell Press",
    type: "strength",
    area: "Shoulders",
    group: "shoulders",
    equipment: "barbell",
    primaryMuscle: "shoulders",
    secondaryMuscles: [{"muscle":"triceps","weight":0.4},{"muscle":"abdominals","weight":0.2}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/overhead-press/start.jpg", finish: "assets/icons/photos/overhead-press/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "dumbbell-shoulder-press",
    name: "Dumbbell Shoulder Press",
    type: "strength",
    area: "Shoulders",
    group: "shoulders",
    equipment: "dumbbell",
    primaryMuscle: "shoulders",
    secondaryMuscles: [{"muscle":"triceps","weight":0.3}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/dumbbell-shoulder-press/start.jpg", finish: "assets/icons/photos/dumbbell-shoulder-press/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "lateral-raise",
    name: "Lateral Raise",
    type: "strength",
    area: "Shoulders",
    group: "shoulders",
    equipment: "dumbbell",
    primaryMuscle: "shoulders",
    secondaryMuscles: [],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/lateral-raise/start.jpg", finish: "assets/icons/photos/lateral-raise/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "front-raise",
    name: "Front Raise",
    type: "strength",
    area: "Shoulders",
    group: "shoulders",
    equipment: "dumbbell",
    primaryMuscle: "shoulders",
    secondaryMuscles: [],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/front-raise/start.jpg", finish: "assets/icons/photos/front-raise/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "rear-delt-fly",
    name: "Rear Delt Fly",
    type: "strength",
    area: "Shoulders",
    group: "shoulders",
    equipment: "dumbbell",
    primaryMuscle: "shoulders",
    secondaryMuscles: [],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/rear-delt-fly/start.jpg", finish: "assets/icons/photos/rear-delt-fly/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "arnold-press",
    name: "Arnold Press",
    type: "strength",
    area: "Shoulders",
    group: "shoulders",
    equipment: "dumbbell",
    primaryMuscle: "shoulders",
    secondaryMuscles: [{"muscle":"triceps","weight":0.3}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/arnold-press/start.jpg", finish: "assets/icons/photos/arnold-press/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "shrug",
    name: "Shrug",
    type: "strength",
    area: "Shoulders",
    group: "shoulders",
    equipment: "barbell",
    primaryMuscle: "traps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/shrug/start.jpg", finish: "assets/icons/photos/shrug/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "back-squat",
    name: "Barbell Back Squat",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "barbell",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [{"muscle":"glutes","weight":0.5},{"muscle":"hamstrings","weight":0.3}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/back-squat/start.jpg", finish: "assets/icons/photos/back-squat/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "front-squat",
    name: "Front Squat",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "barbell",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [{"muscle":"glutes","weight":0.4},{"muscle":"hamstrings","weight":0.2}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/front-squat/start.jpg", finish: "assets/icons/photos/front-squat/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "goblet-squat",
    name: "Goblet Squat",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "dumbbell",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [{"muscle":"glutes","weight":0.4},{"muscle":"hamstrings","weight":0.2}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/goblet-squat/start.jpg", finish: "assets/icons/photos/goblet-squat/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "leg-press",
    name: "Leg Press",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "machine",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [{"muscle":"glutes","weight":0.4},{"muscle":"hamstrings","weight":0.2}],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/leg-press/start.jpg", finish: "assets/icons/photos/leg-press/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "lunge",
    name: "Lunge",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "dumbbell",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [{"muscle":"glutes","weight":0.4},{"muscle":"hamstrings","weight":0.2}],
    dualStack: false,
    icon: "walk",
    photos: { start: "assets/icons/photos/lunge/start.jpg", finish: "assets/icons/photos/lunge/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "dumbbell",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [{"muscle":"glutes","weight":0.5},{"muscle":"hamstrings","weight":0.2}],
    dualStack: false,
    icon: "walk",
    photos: { start: "assets/icons/photos/bulgarian-split-squat/start.jpg", finish: "assets/icons/photos/bulgarian-split-squat/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "machine",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/leg-extension/start.jpg", finish: "assets/icons/photos/leg-extension/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "leg-curl",
    name: "Leg Curl",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "machine",
    primaryMuscle: "hamstrings",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/leg-curl/start.jpg", finish: "assets/icons/photos/leg-curl/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "calf-raise",
    name: "Calf Raise",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "machine",
    primaryMuscle: "calves",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/calf-raise/start.jpg", finish: "assets/icons/photos/calf-raise/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "barbell",
    primaryMuscle: "glutes",
    secondaryMuscles: [{"muscle":"hamstrings","weight":0.4}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/hip-thrust/start.jpg", finish: "assets/icons/photos/hip-thrust/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "barbell-curl",
    name: "Barbell Curl",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "barbell",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "biceps-flexed",
    photos: { start: "assets/icons/photos/barbell-curl/start.jpg", finish: "assets/icons/photos/barbell-curl/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "dumbbell-curl",
    name: "Dumbbell Curl",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "dumbbell",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "biceps-flexed",
    photos: { start: "assets/icons/photos/dumbbell-curl/start.jpg", finish: "assets/icons/photos/dumbbell-curl/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "hammer-curl",
    name: "Hammer Curl",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "dumbbell",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "biceps-flexed",
    photos: { start: "assets/icons/photos/hammer-curl/start.jpg", finish: "assets/icons/photos/hammer-curl/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "preacher-curl",
    name: "Preacher Curl",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "barbell",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "biceps-flexed",
    photos: { start: "assets/icons/photos/preacher-curl/start.jpg", finish: "assets/icons/photos/preacher-curl/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "triceps-pushdown",
    name: "Triceps Pushdown",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "cable",
    primaryMuscle: "triceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/triceps-pushdown/start.jpg", finish: "assets/icons/photos/triceps-pushdown/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "skullcrusher",
    name: "Skullcrusher",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "barbell",
    primaryMuscle: "triceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/skullcrusher/start.jpg", finish: "assets/icons/photos/skullcrusher/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "overhead-triceps-extension",
    name: "Overhead Triceps Extension",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "dumbbell",
    primaryMuscle: "triceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/overhead-triceps-extension/start.jpg", finish: "assets/icons/photos/overhead-triceps-extension/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "close-grip-bench-press",
    name: "Close-Grip Bench Press",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "barbell",
    primaryMuscle: "triceps",
    secondaryMuscles: [{"muscle":"chest","weight":0.4},{"muscle":"shoulders","weight":0.3}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/close-grip-bench-press/start.jpg", finish: "assets/icons/photos/close-grip-bench-press/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "plank",
    name: "Plank",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "yoga",
    photos: { start: "assets/icons/photos/plank/start.jpg", finish: "assets/icons/photos/plank/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "crunch",
    name: "Crunch",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "stretching",
    photos: { start: "assets/icons/photos/crunch/start.jpg", finish: "assets/icons/photos/crunch/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "sit-up",
    name: "Sit-Up",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "stretching",
    photos: { start: "assets/icons/photos/sit-up/start.jpg", finish: "assets/icons/photos/sit-up/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "hanging-leg-raise",
    name: "Hanging Leg Raise",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "gymnastics",
    photos: { start: "assets/icons/photos/hanging-leg-raise/start.jpg", finish: "assets/icons/photos/hanging-leg-raise/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "russian-twist",
    name: "Russian Twist",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "dumbbell",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "stretching-2",
    photos: { start: "assets/icons/photos/russian-twist/start.jpg", finish: "assets/icons/photos/russian-twist/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "cable-crunch",
    name: "Cable Crunch",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "cable",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/cable-crunch/start.jpg", finish: "assets/icons/photos/cable-crunch/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "mountain-climber",
    name: "Mountain Climber",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "run",
    photos: { start: "assets/icons/photos/mountain-climber/start.jpg", finish: "assets/icons/photos/mountain-climber/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "burpee",
    name: "Burpee",
    type: "strength",
    area: "Cardio",
    group: "cardio",
    equipment: "body only",
    primaryMuscle: "full body",
    secondaryMuscles: [],
    dualStack: false,
    icon: "run",
    photos: null,
    tags: ["home","gym","bodyweight","cardio"]
  },
  {
    id: "kettlebell-swing",
    name: "Kettlebell Swing",
    type: "strength",
    area: "Cardio",
    group: "cardio",
    equipment: "kettlebell",
    primaryMuscle: "glutes",
    secondaryMuscles: [{"muscle":"hamstrings","weight":0.5},{"muscle":"lower back","weight":0.3},{"muscle":"shoulders","weight":0.2}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/kettlebell-swing/start.jpg", finish: "assets/icons/photos/kettlebell-swing/finish.jpg" },
    tags: ["home","gym","cardio"]
  },
  {
    id: "jumping-jack",
    name: "Jumping Jack",
    type: "strength",
    area: "Cardio",
    group: "cardio",
    equipment: "body only",
    primaryMuscle: "full body",
    secondaryMuscles: [],
    dualStack: false,
    icon: "jump-rope",
    photos: { start: "assets/icons/photos/jumping-jack/start.jpg", finish: "assets/icons/photos/jumping-jack/finish.jpg" },
    tags: ["home","gym","bodyweight","cardio"]
  },
  {
    id: "box-jump",
    name: "Box Jump",
    type: "strength",
    area: "Cardio",
    group: "cardio",
    equipment: "body only",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "jump-rope",
    photos: { start: "assets/icons/photos/box-jump/start.jpg", finish: "assets/icons/photos/box-jump/finish.jpg" },
    tags: ["home","gym","bodyweight","cardio"]
  },
  {
    id: "soccer",
    name: "Soccer",
    type: "sport",
    area: "Cardio",
    group: "cardio",
    equipment: "body only",
    primaryMuscle: "full body",
    secondaryMuscles: [],
    dualStack: false,
    icon: "soccer",
    photos: null,
    tags: ["sport"]
  },
  {
    id: "pickleball",
    name: "Pickleball",
    type: "sport",
    area: "Cardio",
    group: "cardio",
    equipment: "body only",
    primaryMuscle: "full body",
    secondaryMuscles: [],
    dualStack: false,
    icon: "soccer",
    photos: null,
    tags: ["sport"]
  },
  {
    id: "dumbbell-pullover",
    name: "Dumbbell Pullover",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "dumbbell",
    primaryMuscle: "chest",
    secondaryMuscles: [{"muscle":"lats","weight":0.4},{"muscle":"triceps","weight":0.2}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/dumbbell-pullover/start.jpg", finish: "assets/icons/photos/dumbbell-pullover/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "machine-chest-press",
    name: "Machine Chest Press",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "machine",
    primaryMuscle: "chest",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/machine-chest-press/start.jpg", finish: "assets/icons/photos/machine-chest-press/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "pec-deck-fly",
    name: "Pec Deck Fly",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "machine",
    primaryMuscle: "chest",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/pec-deck-fly/start.jpg", finish: "assets/icons/photos/pec-deck-fly/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "dumbbell",
    primaryMuscle: "chest",
    secondaryMuscles: [{"muscle":"shoulders","weight":0.5},{"muscle":"triceps","weight":0.3}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/incline-dumbbell-press/start.jpg", finish: "assets/icons/photos/incline-dumbbell-press/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "decline-bench-press",
    name: "Decline Bench Press",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "barbell",
    primaryMuscle: "chest",
    secondaryMuscles: [{"muscle":"triceps","weight":0.3}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/decline-bench-press/start.jpg", finish: "assets/icons/photos/decline-bench-press/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "incline-dumbbell-fly",
    name: "Incline Dumbbell Fly",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "dumbbell",
    primaryMuscle: "chest",
    secondaryMuscles: [],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/incline-dumbbell-fly/start.jpg", finish: "assets/icons/photos/incline-dumbbell-fly/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "diamond-push-up",
    name: "Diamond Push-Up",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "body only",
    primaryMuscle: "triceps",
    secondaryMuscles: [{"muscle":"chest","weight":0.4},{"muscle":"shoulders","weight":0.3}],
    dualStack: false,
    icon: "gymnastics",
    photos: { start: "assets/icons/photos/diamond-push-up/start.jpg", finish: "assets/icons/photos/diamond-push-up/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "inverted-row",
    name: "Inverted Row",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "body only",
    primaryMuscle: "middle back",
    secondaryMuscles: [{"muscle":"biceps","weight":0.4}],
    dualStack: false,
    icon: "gymnastics",
    photos: { start: "assets/icons/photos/inverted-row/start.jpg", finish: "assets/icons/photos/inverted-row/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "decline-dumbbell-press",
    name: "Decline Dumbbell Press",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "dumbbell",
    primaryMuscle: "chest",
    secondaryMuscles: [{"muscle":"triceps","weight":0.3}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/decline-dumbbell-press/start.jpg", finish: "assets/icons/photos/decline-dumbbell-press/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "t-bar-row",
    name: "T-Bar Row",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "barbell",
    primaryMuscle: "middle back",
    secondaryMuscles: [{"muscle":"biceps","weight":0.4},{"muscle":"lats","weight":0.3}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/t-bar-row/start.jpg", finish: "assets/icons/photos/t-bar-row/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "good-morning",
    name: "Good Morning",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "barbell",
    primaryMuscle: "lower back",
    secondaryMuscles: [{"muscle":"hamstrings","weight":0.6},{"muscle":"glutes","weight":0.4}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/good-morning/start.jpg", finish: "assets/icons/photos/good-morning/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "rack-pull",
    name: "Rack Pull",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "barbell",
    primaryMuscle: "lower back",
    secondaryMuscles: [{"muscle":"hamstrings","weight":0.5},{"muscle":"glutes","weight":0.4},{"muscle":"forearms","weight":0.3}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/rack-pull/start.jpg", finish: "assets/icons/photos/rack-pull/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "straight-arm-pulldown",
    name: "Straight-Arm Pulldown",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "cable",
    primaryMuscle: "lats",
    secondaryMuscles: [{"muscle":"chest","weight":0.2}],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/straight-arm-pulldown/start.jpg", finish: "assets/icons/photos/straight-arm-pulldown/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "back-extension",
    name: "Back Extension",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "body only",
    primaryMuscle: "lower back",
    secondaryMuscles: [{"muscle":"hamstrings","weight":0.3},{"muscle":"glutes","weight":0.3}],
    dualStack: false,
    icon: "gymnastics",
    photos: { start: "assets/icons/photos/back-extension/start.jpg", finish: "assets/icons/photos/back-extension/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "dumbbell-shrug",
    name: "Dumbbell Shrug",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "dumbbell",
    primaryMuscle: "traps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/dumbbell-shrug/start.jpg", finish: "assets/icons/photos/dumbbell-shrug/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "cable-pulldown-underhand",
    name: "Cable Pulldown (Underhand)",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "cable",
    primaryMuscle: "lats",
    secondaryMuscles: [{"muscle":"biceps","weight":0.5}],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/cable-pulldown-underhand/start.jpg", finish: "assets/icons/photos/cable-pulldown-underhand/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "wide-grip-pull-up",
    name: "Wide-Grip Pull-Up",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "body only",
    primaryMuscle: "lats",
    secondaryMuscles: [{"muscle":"biceps","weight":0.4},{"muscle":"shoulders","weight":0.2}],
    dualStack: false,
    icon: "gymnastics",
    photos: { start: "assets/icons/photos/wide-grip-pull-up/start.jpg", finish: "assets/icons/photos/wide-grip-pull-up/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "upright-row",
    name: "Upright Row",
    type: "strength",
    area: "Shoulders",
    group: "shoulders",
    equipment: "barbell",
    primaryMuscle: "shoulders",
    secondaryMuscles: [{"muscle":"traps","weight":0.3}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/upright-row/start.jpg", finish: "assets/icons/photos/upright-row/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "cable-lateral-raise",
    name: "Cable Lateral Raise",
    type: "strength",
    area: "Shoulders",
    group: "shoulders",
    equipment: "cable",
    primaryMuscle: "shoulders",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/cable-lateral-raise/start.jpg", finish: "assets/icons/photos/cable-lateral-raise/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "reverse-dumbbell-fly",
    name: "Reverse Dumbbell Fly",
    type: "strength",
    area: "Shoulders",
    group: "shoulders",
    equipment: "dumbbell",
    primaryMuscle: "shoulders",
    secondaryMuscles: [],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/reverse-dumbbell-fly/start.jpg", finish: "assets/icons/photos/reverse-dumbbell-fly/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "seated-dumbbell-press",
    name: "Seated Dumbbell Press",
    type: "strength",
    area: "Shoulders",
    group: "shoulders",
    equipment: "dumbbell",
    primaryMuscle: "shoulders",
    secondaryMuscles: [{"muscle":"triceps","weight":0.3}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/seated-dumbbell-press/start.jpg", finish: "assets/icons/photos/seated-dumbbell-press/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "reverse-pec-deck",
    name: "Reverse Pec Deck",
    type: "strength",
    area: "Shoulders",
    group: "shoulders",
    equipment: "machine",
    primaryMuscle: "shoulders",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/reverse-pec-deck/start.jpg", finish: "assets/icons/photos/reverse-pec-deck/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "external-rotation",
    name: "External Rotation",
    type: "strength",
    area: "Shoulders",
    group: "shoulders",
    equipment: "dumbbell",
    primaryMuscle: "shoulders",
    secondaryMuscles: [],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/external-rotation/start.jpg", finish: "assets/icons/photos/external-rotation/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "push-press",
    name: "Push Press",
    type: "strength",
    area: "Shoulders",
    group: "shoulders",
    equipment: "barbell",
    primaryMuscle: "shoulders",
    secondaryMuscles: [{"muscle":"triceps","weight":0.4},{"muscle":"quadriceps","weight":0.3}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/push-press/start.jpg", finish: "assets/icons/photos/push-press/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "hack-squat",
    name: "Hack Squat",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "machine",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [{"muscle":"glutes","weight":0.3}],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/hack-squat/start.jpg", finish: "assets/icons/photos/hack-squat/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "barbell-lunge",
    name: "Barbell Lunge",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "barbell",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [{"muscle":"glutes","weight":0.4},{"muscle":"hamstrings","weight":0.2}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/barbell-lunge/start.jpg", finish: "assets/icons/photos/barbell-lunge/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "walking-lunge",
    name: "Walking Lunge",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "barbell",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [{"muscle":"glutes","weight":0.4},{"muscle":"hamstrings","weight":0.2}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/walking-lunge/start.jpg", finish: "assets/icons/photos/walking-lunge/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "dumbbell-step-up",
    name: "Dumbbell Step-Up",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "dumbbell",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [{"muscle":"glutes","weight":0.4}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/dumbbell-step-up/start.jpg", finish: "assets/icons/photos/dumbbell-step-up/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "sumo-deadlift",
    name: "Sumo Deadlift",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "barbell",
    primaryMuscle: "hamstrings",
    secondaryMuscles: [{"muscle":"glutes","weight":0.6},{"muscle":"lower back","weight":0.4},{"muscle":"quadriceps","weight":0.3}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/sumo-deadlift/start.jpg", finish: "assets/icons/photos/sumo-deadlift/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "glute-bridge",
    name: "Glute Bridge",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "barbell",
    primaryMuscle: "glutes",
    secondaryMuscles: [{"muscle":"hamstrings","weight":0.3}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/glute-bridge/start.jpg", finish: "assets/icons/photos/glute-bridge/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "cable-pull-through",
    name: "Cable Pull Through",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "cable",
    primaryMuscle: "glutes",
    secondaryMuscles: [{"muscle":"hamstrings","weight":0.4},{"muscle":"lower back","weight":0.2}],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/cable-pull-through/start.jpg", finish: "assets/icons/photos/cable-pull-through/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "reverse-lunge",
    name: "Reverse Lunge",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "dumbbell",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [{"muscle":"glutes","weight":0.4},{"muscle":"hamstrings","weight":0.2}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/reverse-lunge/start.jpg", finish: "assets/icons/photos/reverse-lunge/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "pli-dumbbell-squat",
    name: "Plié Dumbbell Squat",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "dumbbell",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [{"muscle":"glutes","weight":0.4},{"muscle":"adductors","weight":0.3}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/pli-dumbbell-squat/start.jpg", finish: "assets/icons/photos/pli-dumbbell-squat/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "glute-kickback",
    name: "Glute Kickback",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "body only",
    primaryMuscle: "glutes",
    secondaryMuscles: [],
    dualStack: false,
    icon: "walk",
    photos: { start: "assets/icons/photos/glute-kickback/start.jpg", finish: "assets/icons/photos/glute-kickback/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "seated-leg-curl",
    name: "Seated Leg Curl",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "machine",
    primaryMuscle: "hamstrings",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/seated-leg-curl/start.jpg", finish: "assets/icons/photos/seated-leg-curl/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "box-squat",
    name: "Box Squat",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "barbell",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [{"muscle":"glutes","weight":0.4},{"muscle":"hamstrings","weight":0.2}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/box-squat/start.jpg", finish: "assets/icons/photos/box-squat/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "hip-adduction-machine",
    name: "Hip Adduction (Machine)",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "machine",
    primaryMuscle: "adductors",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/hip-adduction-machine/start.jpg", finish: "assets/icons/photos/hip-adduction-machine/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "step-up-with-knee-raise",
    name: "Step-Up with Knee Raise",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "body only",
    primaryMuscle: "glutes",
    secondaryMuscles: [],
    dualStack: false,
    icon: "walk",
    photos: { start: "assets/icons/photos/step-up-with-knee-raise/start.jpg", finish: "assets/icons/photos/step-up-with-knee-raise/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "ez-bar-curl",
    name: "EZ-Bar Curl",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "barbell",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "biceps-flexed",
    photos: { start: "assets/icons/photos/ez-bar-curl/start.jpg", finish: "assets/icons/photos/ez-bar-curl/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "bodyweight-squat",
    name: "Bodyweight Squat",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "body only",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [{"muscle":"glutes","weight":0.3}],
    dualStack: false,
    icon: "walk",
    photos: { start: "assets/icons/photos/bodyweight-squat/start.jpg", finish: "assets/icons/photos/bodyweight-squat/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "stiff-legged-deadlift",
    name: "Stiff-Legged Deadlift",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "dumbbell",
    primaryMuscle: "hamstrings",
    secondaryMuscles: [{"muscle":"glutes","weight":0.5},{"muscle":"lower back","weight":0.3}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/stiff-legged-deadlift/start.jpg", finish: "assets/icons/photos/stiff-legged-deadlift/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "hip-abduction-machine",
    name: "Hip Abduction (Machine)",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "machine",
    primaryMuscle: "abductors",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/hip-abduction-machine/start.jpg", finish: "assets/icons/photos/hip-abduction-machine/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "concentration-curl",
    name: "Concentration Curl",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "dumbbell",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "biceps-flexed",
    photos: { start: "assets/icons/photos/concentration-curl/start.jpg", finish: "assets/icons/photos/concentration-curl/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "cable-hammer-curl",
    name: "Cable Hammer Curl",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "cable",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "biceps-flexed",
    photos: { start: "assets/icons/photos/cable-hammer-curl/start.jpg", finish: "assets/icons/photos/cable-hammer-curl/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "incline-dumbbell-curl",
    name: "Incline Dumbbell Curl",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "dumbbell",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "biceps-flexed",
    photos: { start: "assets/icons/photos/incline-dumbbell-curl/start.jpg", finish: "assets/icons/photos/incline-dumbbell-curl/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "cable-curl",
    name: "Cable Curl",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "cable",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "biceps-flexed",
    photos: { start: "assets/icons/photos/cable-curl/start.jpg", finish: "assets/icons/photos/cable-curl/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "reverse-curl",
    name: "Reverse Curl",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "barbell",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "biceps-flexed",
    photos: { start: "assets/icons/photos/reverse-curl/start.jpg", finish: "assets/icons/photos/reverse-curl/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "wrist-curl",
    name: "Wrist Curl",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "cable",
    primaryMuscle: "forearms",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/wrist-curl/start.jpg", finish: "assets/icons/photos/wrist-curl/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "bench-dip",
    name: "Bench Dip",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "body only",
    primaryMuscle: "triceps",
    secondaryMuscles: [{"muscle":"shoulders","weight":0.2}],
    dualStack: false,
    icon: "gymnastics",
    photos: { start: "assets/icons/photos/bench-dip/start.jpg", finish: "assets/icons/photos/bench-dip/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "floor-press",
    name: "Floor Press",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "barbell",
    primaryMuscle: "triceps",
    secondaryMuscles: [{"muscle":"chest","weight":0.4},{"muscle":"shoulders","weight":0.3}],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/floor-press/start.jpg", finish: "assets/icons/photos/floor-press/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "reverse-crunch",
    name: "Reverse Crunch",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "yoga",
    photos: { start: "assets/icons/photos/reverse-crunch/start.jpg", finish: "assets/icons/photos/reverse-crunch/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "seated-triceps-press",
    name: "Seated Triceps Press",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "dumbbell",
    primaryMuscle: "triceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/seated-triceps-press/start.jpg", finish: "assets/icons/photos/seated-triceps-press/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "dips-triceps",
    name: "Dips (Triceps)",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "body only",
    primaryMuscle: "triceps",
    secondaryMuscles: [{"muscle":"chest","weight":0.3},{"muscle":"shoulders","weight":0.3}],
    dualStack: false,
    icon: "gymnastics",
    photos: { start: "assets/icons/photos/dips-triceps/start.jpg", finish: "assets/icons/photos/dips-triceps/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "triceps-kickback",
    name: "Triceps Kickback",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "dumbbell",
    primaryMuscle: "triceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/triceps-kickback/start.jpg", finish: "assets/icons/photos/triceps-kickback/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "side-plank",
    name: "Side Plank",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "yoga",
    photos: { start: "assets/icons/photos/side-plank/start.jpg", finish: "assets/icons/photos/side-plank/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "cross-body-crunch",
    name: "Cross-Body Crunch",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "yoga",
    photos: { start: "assets/icons/photos/cross-body-crunch/start.jpg", finish: "assets/icons/photos/cross-body-crunch/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "lying-leg-raise",
    name: "Lying Leg Raise",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "yoga",
    photos: null,
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "v-up",
    name: "V-Up",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "yoga",
    photos: { start: "assets/icons/photos/v-up/start.jpg", finish: "assets/icons/photos/v-up/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "flutter-kicks",
    name: "Flutter Kicks",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "glutes",
    secondaryMuscles: [],
    dualStack: false,
    icon: "yoga",
    photos: { start: "assets/icons/photos/flutter-kicks/start.jpg", finish: "assets/icons/photos/flutter-kicks/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "bicycle-crunch",
    name: "Bicycle Crunch",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "yoga",
    photos: { start: "assets/icons/photos/bicycle-crunch/start.jpg", finish: "assets/icons/photos/bicycle-crunch/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "ab-rollout",
    name: "Ab Rollout",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [{"muscle":"shoulders","weight":0.3},{"muscle":"lower back","weight":0.2}],
    dualStack: false,
    icon: "yoga",
    photos: { start: "assets/icons/photos/ab-rollout/start.jpg", finish: "assets/icons/photos/ab-rollout/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "decline-crunch",
    name: "Decline Crunch",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "yoga",
    photos: { start: "assets/icons/photos/decline-crunch/start.jpg", finish: "assets/icons/photos/decline-crunch/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "dead-bug",
    name: "Dead Bug",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "yoga",
    photos: { start: "assets/icons/photos/dead-bug/start.jpg", finish: "assets/icons/photos/dead-bug/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "hip-raise",
    name: "Hip Raise",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "yoga",
    photos: { start: "assets/icons/photos/hip-raise/start.jpg", finish: "assets/icons/photos/hip-raise/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "oblique-crunch",
    name: "Oblique Crunch",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "yoga",
    photos: { start: "assets/icons/photos/oblique-crunch/start.jpg", finish: "assets/icons/photos/oblique-crunch/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "cable-woodchopper",
    name: "Cable Woodchopper",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "cable",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/cable-woodchopper/start.jpg", finish: "assets/icons/photos/cable-woodchopper/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "jump-rope",
    name: "Jump Rope",
    type: "strength",
    area: "Cardio",
    group: "cardio",
    equipment: "body only",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "run",
    photos: { start: "assets/icons/photos/jump-rope/start.jpg", finish: "assets/icons/photos/jump-rope/finish.jpg" },
    tags: ["home","gym","bodyweight","cardio"]
  },
  {
    id: "broad-jump",
    name: "Broad Jump",
    type: "strength",
    area: "Cardio",
    group: "cardio",
    equipment: "body only",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "run",
    photos: { start: "assets/icons/photos/broad-jump/start.jpg", finish: "assets/icons/photos/broad-jump/finish.jpg" },
    tags: ["home","gym","bodyweight","cardio"]
  },
  {
    id: "stationary-bike",
    name: "Stationary Bike",
    type: "cardio",
    area: "Cardio",
    group: "cardio",
    equipment: "machine",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/stationary-bike/start.jpg", finish: "assets/icons/photos/stationary-bike/finish.jpg" },
    tags: ["gym","machine","cardio"]
  },
  {
    id: "squat-jump",
    name: "Squat Jump",
    type: "strength",
    area: "Cardio",
    group: "cardio",
    equipment: "body only",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "run",
    photos: { start: "assets/icons/photos/squat-jump/start.jpg", finish: "assets/icons/photos/squat-jump/finish.jpg" },
    tags: ["home","gym","bodyweight","cardio"]
  },
  {
    id: "rowing-machine",
    name: "Rowing Machine",
    type: "cardio",
    area: "Cardio",
    group: "cardio",
    equipment: "machine",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/rowing-machine/start.jpg", finish: "assets/icons/photos/rowing-machine/finish.jpg" },
    tags: ["gym","machine","cardio"]
  },
  {
    id: "treadmill-run",
    name: "Treadmill Run",
    type: "cardio",
    area: "Cardio",
    group: "cardio",
    equipment: "machine",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "run",
    photos: { start: "assets/icons/photos/treadmill-run/start.jpg", finish: "assets/icons/photos/treadmill-run/finish.jpg" },
    tags: ["gym","machine","cardio"]
  },
  {
    id: "skater-jump",
    name: "Skater Jump",
    type: "strength",
    area: "Cardio",
    group: "cardio",
    equipment: "body only",
    primaryMuscle: "adductors",
    secondaryMuscles: [],
    dualStack: false,
    icon: "run",
    photos: { start: "assets/icons/photos/skater-jump/start.jpg", finish: "assets/icons/photos/skater-jump/finish.jpg" },
    tags: ["home","gym","bodyweight","cardio"]
  },
  {
    id: "chest-supported-row",
    name: "Chest-Supported Row",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "dumbbell",
    primaryMuscle: "middle back",
    secondaryMuscles: [{"muscle":"biceps","weight":0.3},{"muscle":"lats","weight":0.2}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/chest-supported-row/start.jpg", finish: "assets/icons/photos/chest-supported-row/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "renegade-row",
    name: "Renegade Row",
    type: "strength",
    area: "Back",
    group: "back",
    equipment: "kettlebell",
    primaryMuscle: "middle back",
    secondaryMuscles: [{"muscle":"biceps","weight":0.3},{"muscle":"abdominals","weight":0.3}],
    dualStack: false,
    icon: "dumbbell",
    photos: { start: "assets/icons/photos/renegade-row/start.jpg", finish: "assets/icons/photos/renegade-row/finish.jpg" },
    tags: ["home","gym"]
  },
  {
    id: "zottman-curl",
    name: "Zottman Curl",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "dumbbell",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "biceps-flexed",
    photos: { start: "assets/icons/photos/zottman-curl/start.jpg", finish: "assets/icons/photos/zottman-curl/finish.jpg" },
    tags: ["home","gym","dumbbells"]
  },
  {
    id: "tuck-jump",
    name: "Tuck Jump",
    type: "strength",
    area: "Cardio",
    group: "cardio",
    equipment: "body only",
    primaryMuscle: "hamstrings",
    secondaryMuscles: [],
    dualStack: false,
    icon: "run",
    photos: { start: "assets/icons/photos/tuck-jump/start.jpg", finish: "assets/icons/photos/tuck-jump/finish.jpg" },
    tags: ["home","gym","bodyweight","cardio"]
  },
  {
    id: "plyo-push-up",
    name: "Plyo Push-Up",
    type: "strength",
    area: "Cardio",
    group: "cardio",
    equipment: "body only",
    primaryMuscle: "chest",
    secondaryMuscles: [],
    dualStack: false,
    icon: "run",
    photos: { start: "assets/icons/photos/plyo-push-up/start.jpg", finish: "assets/icons/photos/plyo-push-up/finish.jpg" },
    tags: ["home","gym","bodyweight","cardio"]
  },
  {
    id: "sissy-squat",
    name: "Sissy Squat",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "barbell",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/sissy-squat/start.jpg", finish: "assets/icons/photos/sissy-squat/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "seated-calf-raise",
    name: "Seated Calf Raise",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "machine",
    primaryMuscle: "calves",
    secondaryMuscles: [],
    dualStack: false,
    icon: "weight",
    photos: { start: "assets/icons/photos/seated-calf-raise/start.jpg", finish: "assets/icons/photos/seated-calf-raise/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "standing-cable-curl",
    name: "Standing Cable Curl",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "cable",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "biceps-flexed",
    photos: { start: "assets/icons/photos/standing-cable-curl/start.jpg", finish: "assets/icons/photos/standing-cable-curl/finish.jpg" },
    tags: ["gym","machine"]
  },
  {
    id: "spider-curl",
    name: "Spider Curl",
    type: "strength",
    area: "Arms",
    group: "arms",
    equipment: "barbell",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    dualStack: false,
    icon: "biceps-flexed",
    photos: { start: "assets/icons/photos/spider-curl/start.jpg", finish: "assets/icons/photos/spider-curl/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "donkey-calf-raise",
    name: "Donkey Calf Raise",
    type: "strength",
    area: "Legs",
    group: "legs",
    equipment: "body only",
    primaryMuscle: "calves",
    secondaryMuscles: [],
    dualStack: false,
    icon: "walk",
    photos: { start: "assets/icons/photos/donkey-calf-raise/start.jpg", finish: "assets/icons/photos/donkey-calf-raise/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "barbell-front-raise",
    name: "Barbell Front Raise",
    type: "strength",
    area: "Shoulders",
    group: "shoulders",
    equipment: "barbell",
    primaryMuscle: "shoulders",
    secondaryMuscles: [],
    dualStack: false,
    icon: "barbell",
    photos: { start: "assets/icons/photos/barbell-front-raise/start.jpg", finish: "assets/icons/photos/barbell-front-raise/finish.jpg" },
    tags: ["gym"]
  },
  {
    id: "superman",
    name: "Superman",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "lower back",
    secondaryMuscles: [{"muscle":"glutes","weight":0.3},{"muscle":"hamstrings","weight":0.2}],
    dualStack: false,
    icon: "yoga",
    photos: { start: "assets/icons/photos/superman/start.jpg", finish: "assets/icons/photos/superman/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "wide-grip-push-up",
    name: "Wide-Grip Push-Up",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "body only",
    primaryMuscle: "chest",
    secondaryMuscles: [{"muscle":"shoulders","weight":0.3},{"muscle":"triceps","weight":0.2}],
    dualStack: false,
    icon: "gymnastics",
    photos: { start: "assets/icons/photos/wide-grip-push-up/start.jpg", finish: "assets/icons/photos/wide-grip-push-up/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "decline-push-up",
    name: "Decline Push-Up",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "body only",
    primaryMuscle: "chest",
    secondaryMuscles: [{"muscle":"shoulders","weight":0.4},{"muscle":"triceps","weight":0.3}],
    dualStack: false,
    icon: "gymnastics",
    photos: { start: "assets/icons/photos/decline-push-up/start.jpg", finish: "assets/icons/photos/decline-push-up/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "seated-leg-tuck",
    name: "Seated Leg Tuck",
    type: "strength",
    area: "Core",
    group: "core",
    equipment: "body only",
    primaryMuscle: "abdominals",
    secondaryMuscles: [],
    dualStack: false,
    icon: "yoga",
    photos: { start: "assets/icons/photos/seated-leg-tuck/start.jpg", finish: "assets/icons/photos/seated-leg-tuck/finish.jpg" },
    tags: ["home","gym","bodyweight"]
  },
  {
    id: "incline-cable-fly",
    name: "Incline Cable Fly",
    type: "strength",
    area: "Chest",
    group: "chest",
    equipment: "cable",
    primaryMuscle: "chest",
    secondaryMuscles: [],
    dualStack: true,
    icon: "weight",
    photos: { start: "assets/icons/photos/incline-cable-fly/start.jpg", finish: "assets/icons/photos/incline-cable-fly/finish.jpg" },
    tags: ["gym","machine"]
  }
  ];
}

// The Soccer move: a "sport" activity logged as a duration plus free notes
// (no Peloton power numbers). Kept as its own helper so the one-time seeding
// for existing saves and the new-install starter list stay in sync.
function getSoccerStarterExercise() {
  return {
    id: "soccer",
    name: "Soccer",
    type: "sport",
    area: "Sport",
    icon: "soccer",
    tags: ["sport"]
  };
}

function isSoccerExerciseReference(plannedExercise, library = exercises) {
  const exerciseId = String(plannedExercise?.exerciseId || "").toLowerCase();
  if (exerciseId === "soccer") return true;
  const exercise = (Array.isArray(library) ? library : []).find((item) => item?.id === plannedExercise?.exerciseId);
  return String(exercise?.name || "").trim().toLowerCase() === "soccer";
}

function normalizeSoccerDurationInData(data) {
  if (!data || !Array.isArray(data.routines)) return false;
  const library = Array.isArray(data.library) ? data.library : exercises;
  let changed = false;
  data.routines.forEach((routine) => {
    if (!Array.isArray(routine.exercises)) return;
    routine.exercises.forEach((plannedExercise) => {
      if (!isSoccerExerciseReference(plannedExercise, library)) return;
      if (Number(plannedExercise.targetDuration) === SOCCER_DURATION_MINUTES) return;
      plannedExercise.targetDuration = SOCCER_DURATION_MINUTES;
      changed = true;
    });
  });
  return changed;
}

function repairSoccerDurationInvariant({ rerender = false } = {}) {
  const data = getLocalData();
  if (!normalizeSoccerDurationInData(data)) return false;
  commitProgressData(data);
  if (rerender) {
    renderPlan();
    renderTodayRoutine();
  }
  return true;
}

// One-time migration to the photo/glyph exercise library (the 53-exercise set
// in assets/icons/exercises.json). Replaces whatever library the synced data
// currently holds with the new starter set, so reference photos and the shared
// glyphs light up for existing installs - not just brand-new ones. Guarded by a
// localStorage flag so it runs exactly once per device and never re-imposes
// itself after Daniel edits his library later. Routines that pointed at old ids
// (e.g. "squat", "treadmill-walk") will show "Not in your library" until re-added
// - an accepted trade for a clean library. Runs after the freshest synced data
// is in hand (same timing as seedSoccerOnce) so a stale device can't clobber
// newer cloud data.
function reseedLibraryOnce() {
  if (localStorage.getItem(STORAGE.libraryV2Seeded)) return;

  const data = getLocalData();
  // Reseed the canonical starter set for clean ids/metadata, but never wipe the
  // user's own data in the process: carry custom photos + favourites onto the
  // matching starter records, and keep any exercise the user added that isn't
  // part of the starter set. (Previously this was a blind full replace, which is
  // how a single device that hadn't run the reseed could nuke every custom photo
  // for all devices once its photoless library synced up.)
  const prior = Array.isArray(data.library) ? data.library : [];
  const priorById = new Map(prior.filter((ex) => ex && ex.id).map((ex) => [ex.id, ex]));
  const starters = getStarterExercises();
  const starterIds = new Set(starters.map((ex) => ex.id));
  const reseeded = starters.map((ex) => {
    const prev = priorById.get(ex.id);
    if (!prev) return ex;
    const next = { ...ex };
    if (prev.customPhotos) next.customPhotos = prev.customPhotos;
    if (prev.favorite) next.favorite = prev.favorite;
    return next;
  });
  const extras = prior.filter((ex) => ex && ex.id && !starterIds.has(ex.id));
  data.library = [...reseeded, ...extras];
  data.updatedAt = new Date().toISOString();
  data.updatedBy = getDeviceId();
  saveLocalData(data);
  markPendingData(data);
  exercises = data.library;
  renderExercises();
  renderExercisePicker();
  renderTodayRoutine();
  if (navigator.onLine) {
    uploadWorkoutData(data).then(clearPendingData).catch(() => {
      // Not signed in yet or offline: the change is queued and syncs later.
    });
  }

  localStorage.setItem(STORAGE.libraryV2Seeded, "1");
}

// One-time, ADDITIVE library expansion (the curated ~140 set). Unlike the V2
// reseed, this never replaces the library: it only appends starter exercises
// whose id is missing, so any exercises Daniel added, removed-then-kept, favourited,
// or gave custom photos are left exactly as they are.
function mergeLibraryV3Once() {
  if (localStorage.getItem(STORAGE.libraryV3Merged)) return;

  const data = getLocalData();
  const library = Array.isArray(data.library) ? data.library : [];
  const haveIds = new Set(library.map((ex) => ex.id));
  const additions = getStarterExercises().filter((ex) => !haveIds.has(ex.id));

  if (additions.length) {
    data.library = [...library, ...additions];
    data.updatedAt = new Date().toISOString();
    data.updatedBy = getDeviceId();
    saveLocalData(data);
    markPendingData(data);
    exercises = data.library;
    renderExercises();
    renderExercisePicker();
    if (navigator.onLine) {
      uploadWorkoutData(data).then(clearPendingData).catch(() => {
        // Not signed in yet or offline: queued, syncs later.
      });
    }
  }

  localStorage.setItem(STORAGE.libraryV3Merged, "1");
}

// One-time, purely additive catch-up for starter-exercise METADATA fields.
// mergeLibraryV3Once above only adds an exercise when its id is entirely
// missing, so a field added to the starter catalog later (F3's
// secondaryMuscles, F6's dualStack) never reaches an id that was already
// installed before that field existed - which is exactly what happened here:
// F6 shipped dualStack: true on 4 exercises, but Daniel's and Shaina's
// already-synced library entries for those ids kept the old shape and the
// live app kept showing plain "lb". Fixed by backfilling ONLY the fields
// listed below, and ONLY when the existing entry is missing the field
// entirely - never touching name/type/equipment/category/photos, since the
// Library "Edit exercise" screen lets Daniel and Shaina customize those per
// exercise and a blind full replace would silently discard that.
function refreshLibraryFieldsOnce() {
  if (localStorage.getItem(STORAGE.libraryFieldsRefreshed)) return;

  const FIELDS_TO_BACKFILL = ["dualStack", "secondaryMuscles"];
  const data = getLocalData();
  const library = Array.isArray(data.library) ? data.library : [];
  const starterById = new Map(getStarterExercises().map((ex) => [ex.id, ex]));
  let changed = false;
  const updated = library.map((ex) => {
    const starter = ex && ex.id ? starterById.get(ex.id) : null;
    if (!starter) return ex;
    let next = ex;
    FIELDS_TO_BACKFILL.forEach((field) => {
      if (next[field] === undefined && starter[field] !== undefined) {
        if (next === ex) next = { ...ex };
        next[field] = starter[field];
        changed = true;
      }
    });
    return next;
  });

  if (changed) {
    data.library = updated;
    data.updatedAt = new Date().toISOString();
    data.updatedBy = getDeviceId();
    saveLocalData(data);
    markPendingData(data);
    exercises = data.library;
    renderExercises();
    renderExercisePicker();
    renderTodayRoutine();
    if (navigator.onLine) {
      uploadWorkoutData(data).then(clearPendingData).catch(() => {
        // Not signed in yet or offline: queued, syncs later.
      });
    }
  }

  localStorage.setItem(STORAGE.libraryFieldsRefreshed, "1");
}

// One-time, additive seed that adds the Soccer exercise to the shared library
// catalog if it is missing. It is LIBRARY-ONLY (like seedPelotonOnce and
// seedPickleballOnce): it never touches routines or the weekly plan, so it can
// never pollute a brand-new account's blank plan with an auto-scheduled Soccer
// day. Guarded by a localStorage flag so it runs once per device and never
// re-imposes itself if someone later removes Soccer.
function seedSoccerOnce() {
  if (localStorage.getItem(STORAGE.soccerSeeded)) return;

  const data = getLocalData();
  let changed = false;

  // Ensure the Soccer exercise exists in the library.
  if (Array.isArray(data.library) && !data.library.some((ex) => ex.id === "soccer")) {
    data.library = [...data.library, getSoccerStarterExercise()];
    changed = true;
  }

  if (changed) {
    data.updatedAt = new Date().toISOString();
    data.updatedBy = getDeviceId();
    saveLocalData(data);
    markPendingData(data);
    exercises = data.library;
    renderExercises();
    renderExercisePicker();
    renderTodayRoutine();
    if (navigator.onLine) {
      uploadWorkoutData(data).then(clearPendingData).catch(() => {
        // Not signed in yet or offline: the change is queued and syncs later.
      });
    }
  }

  localStorage.setItem(STORAGE.soccerSeeded, "1");
}

function seedPelotonOnce() {
  if (localStorage.getItem(STORAGE.pelotonSeeded) === "1") return;
  const data = getLocalData();
  const library = Array.isArray(data.library) ? data.library.slice() : getStarterExercises();
  let changed = false;
  const addIfMissing = (exercise) => {
    if (library.some((item) => item.id === exercise.id || item.name.toLowerCase() === exercise.name.toLowerCase())) return;
    library.push(exercise);
    changed = true;
  };

  addIfMissing({
    id: "peloton-tread",
    name: "Peloton Tread",
    type: "cardio",
    metricProfile: "peloton",
    area: "Cardio",
    icon: "run",
    group: "cardio",
    photos: { start: "assets/icons/photos/treadmill-run/start.jpg", finish: "assets/icons/photos/treadmill-run/finish.jpg" },
    tags: ["home", "cardio", "machine"]
  });
  addIfMissing({
    id: "peloton-bike",
    name: "Peloton Bike",
    type: "cardio",
    metricProfile: "peloton",
    area: "Cardio",
    icon: "run",
    group: "cardio",
    photos: { start: "assets/icons/photos/stationary-bike/start.jpg", finish: "assets/icons/photos/stationary-bike/finish.jpg" },
    tags: ["home", "cardio", "machine"]
  });

  localStorage.setItem(STORAGE.pelotonSeeded, "1");
  if (!changed) return;
  data.library = library;
  data.updatedAt = new Date().toISOString();
  data.updatedBy = getDeviceId();
  saveLocalData(data);
  markPendingData(data);
  refreshLibrary();
  renderExercises();
  renderExercisePicker();
  renderTodayRoutine();
  if (navigator.onLine) {
    uploadWorkoutData(data).then(clearPendingData).catch(() => {});
  }
}

// One-time, additive seed so Pickleball shows up in the library on Daniel's
// existing install (getStarterExercises only seeds brand-new installs, and the
// V3 merge flag is already set). Library-only - it never touches routines or the
// weekly plan - and guarded by a localStorage flag, so it never re-imposes itself
// if Daniel later removes Pickleball. Mirrors seedPelotonOnce.
function seedPickleballOnce() {
  if (localStorage.getItem(STORAGE.pickleballSeeded) === "1") return;
  const data = getLocalData();
  const library = Array.isArray(data.library) ? data.library.slice() : getStarterExercises();
  let changed = false;
  const addIfMissing = (exercise) => {
    if (library.some((item) => item.id === exercise.id || item.name.toLowerCase() === exercise.name.toLowerCase())) return;
    library.push(exercise);
    changed = true;
  };

  addIfMissing({
    id: "pickleball",
    name: "Pickleball",
    type: "sport",
    area: "Cardio",
    group: "cardio",
    equipment: "body only",
    primaryMuscle: "full body",
    icon: "soccer",
    photos: null,
    tags: ["sport"]
  });

  localStorage.setItem(STORAGE.pickleballSeeded, "1");
  if (!changed) return;
  data.library = library;
  data.updatedAt = new Date().toISOString();
  data.updatedBy = getDeviceId();
  saveLocalData(data);
  markPendingData(data);
  refreshLibrary();
  renderExercises();
  renderExercisePicker();
  renderTodayRoutine();
  if (navigator.onLine) {
    uploadWorkoutData(data).then(clearPendingData).catch(() => {});
  }
}

// One-time repair: the Edit-exercise modal used to omit the "Sport" type, so
// saving an edited sport move (e.g. Pickleball or Soccer - opening it just to add
// photos was enough) silently reset its type to "strength" while KEEPING its
// "sport" tag. That mismatch made the live workout show Sets/Reps/Weight instead
// of minutes + notes. Restore the type for any library exercise still tagged
// "sport" but mistyped. The Edit modal now offers Sport, so this can't recur; the
// flag keeps it a one-shot. Does not touch an already-running workout draft - a
// mistyped exercise added to one needs re-adding.
function restoreSportTypesOnce() {
  if (localStorage.getItem(STORAGE.sportTypeFixed) === "1") return;
  const data = getLocalData();
  const library = Array.isArray(data.library) ? data.library : null;
  if (!library) { localStorage.setItem(STORAGE.sportTypeFixed, "1"); return; }

  let changed = false;
  library.forEach((ex) => {
    if (ex && Array.isArray(ex.tags) && ex.tags.includes("sport") && ex.type !== "sport") {
      ex.type = "sport";
      changed = true;
    }
  });

  localStorage.setItem(STORAGE.sportTypeFixed, "1");
  if (!changed) return;
  data.updatedAt = new Date().toISOString();
  data.updatedBy = getDeviceId();
  saveLocalData(data);
  markPendingData(data);
  refreshLibrary();
  renderExercises();
  renderExercisePicker();
  renderTodayRoutine();
  if (navigator.onLine) {
    uploadWorkoutData(data).then(clearPendingData).catch(() => {});
  }
}

// One-time repair for catalog metadata that was generated incorrectly in older
// builds. It only touches the built-in exercise ids when they still look like
// the old starter records: no workouts/history are changed, and custom/user
// edits on unrelated exercises are left alone.
function repairCatalogDataOnce() {
  if (localStorage.getItem(STORAGE.catalogDataFixed) === "1") return;
  const data = getLocalData();
  const library = Array.isArray(data.library) ? data.library : null;
  if (!library) { localStorage.setItem(STORAGE.catalogDataFixed, "1"); return; }

  let changed = false;
  const treadmill = library.find((ex) => ex?.id === "treadmill-run");
  if (treadmill && treadmill.name === "Treadmill Run") {
    if (treadmill.type !== "cardio") { treadmill.type = "cardio"; changed = true; }
    if (treadmill.group !== "cardio") { treadmill.group = "cardio"; changed = true; }
    if (treadmill.area !== "Cardio") { treadmill.area = "Cardio"; changed = true; }
    if (treadmill.icon === "weight") { treadmill.icon = "run"; changed = true; }
    if (!Array.isArray(treadmill.tags) || !treadmill.tags.includes("cardio")) {
      treadmill.tags = Array.from(new Set([...(Array.isArray(treadmill.tags) ? treadmill.tags : []), "cardio"]));
      changed = true;
    }
  }

  const lyingLegRaise = library.find((ex) => ex?.id === "lying-leg-raise");
  if (lyingLegRaise && lyingLegRaise.name === "Lying Leg Raise") {
    if (lyingLegRaise.primaryMuscle === "glutes") {
      lyingLegRaise.primaryMuscle = "abdominals";
      changed = true;
    }
    const defaultBadPhotos = lyingLegRaise.photos
      && lyingLegRaise.photos.start === "assets/icons/photos/lying-leg-raise/start.jpg"
      && lyingLegRaise.photos.finish === "assets/icons/photos/lying-leg-raise/finish.jpg";
    if (defaultBadPhotos) {
      lyingLegRaise.photos = null;
      changed = true;
    }
  }

  localStorage.setItem(STORAGE.catalogDataFixed, "1");
  if (!changed) return;
  data.updatedAt = new Date().toISOString();
  data.updatedBy = getDeviceId();
  saveLocalData(data);
  markPendingData(data);
  refreshLibrary();
  renderExercises();
  renderExercisePicker();
  renderTodayRoutine();
  if (navigator.onLine) {
    uploadWorkoutData(data).then(clearPendingData).catch(() => {});
  }
}

function isPelotonBikeLikeEntry(entry) {
  if (!entry || entry.exerciseId !== "stationary-bike") return false;
  const stats = entry.stats || {};
  const note = String(entry.notes || "").toLowerCase();
  return note.includes("peloton") || Number(stats.output) > 0 || Number(stats.avgPower) > 0;
}

function readNumberNearLabel(text, patterns) {
  const source = String(text || "");
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (!match) continue;
    const value = Number(match[1]);
    if (value > 0) return value;
  }
  return 0;
}

function extractPelotonBikeStatsFromNote(note) {
  return {
    output: readNumberNearLabel(note, [/\boutput\b\s*[:=]?\s*(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*(?:kj|kJ)\b/]),
    avgPower: readNumberNearLabel(note, [/\bavg(?:erage)?\s*power\b\s*[:=]?\s*(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*(?:w|watts?)\b/i]),
    distance: readNumberNearLabel(note, [/\bdistance\b\s*[:=]?\s*(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*(?:mi|miles?)\b/i]),
    calories: readNumberNearLabel(note, [/\b(?:calories|cals?|kcal)\b\s*[:=]?\s*(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*(?:kcal|calories|cals?)\b/i])
  };
}

function repairPelotonBikeHistoryOnce() {
  if (localStorage.getItem(STORAGE.pelotonBikeHistoryFixed) === "1") return;
  const data = getLocalData();
  const workouts = Array.isArray(data.workouts) ? data.workouts : [];
  let changed = false;

  workouts.forEach((workout) => {
    (Array.isArray(workout.entries) ? workout.entries : []).forEach((entry) => {
      if (!isPelotonBikeLikeEntry(entry)) return;
      entry.exerciseId = "peloton-bike";
      entry.exerciseName = "Peloton Bike";
      entry.metricProfile = "peloton";
      const parsedStats = extractPelotonBikeStatsFromNote(entry.notes);
      entry.stats = { ...(entry.stats || {}) };
      ["output", "avgPower", "distance", "calories"].forEach((key) => {
        if (!(Number(entry.stats[key]) > 0) && Number(parsedStats[key]) > 0) {
          entry.stats[key] = parsedStats[key];
        }
      });
      if (!Object.keys(entry.stats).some((key) => Number(entry.stats[key]) > 0)) delete entry.stats;
      if (entry.planned && entry.planned.exerciseId === "stationary-bike") {
        entry.planned.exerciseId = "peloton-bike";
      }
      changed = true;
    });
  });

  localStorage.setItem(STORAGE.pelotonBikeHistoryFixed, "1");
  if (!changed) return;
  data.updatedAt = new Date().toISOString();
  data.updatedBy = getDeviceId();
  saveLocalData(data);
  markPendingData(data);
  renderHistory();
  renderProgress();
  renderCoach();
  if (navigator.onLine) {
    uploadWorkoutData(data).then(clearPendingData).catch(() => {});
  }
}

// Reload the live exercise list from saved data (after an edit or a cloud sync).
function refreshLibrary() {
  const data = getLocalData();
  exercises = Array.isArray(data.library) ? data.library : getStarterExercises();
  categories = Array.isArray(data.categories) ? data.categories : getStarterCategories();
}

if (dateLabel) {
  dateLabel.textContent = todayDisplay;
}

if (logDate) {
  logDate.textContent = todayDisplay;
}

const activeWorkout = {
  startedAt: new Date().toISOString(),
  exercises: [],
  started: false,
  routineId: null,
  routineName: "",
  isCustom: false,
  substitutionNote: "",
  replacedRoutineId: null,
  replacedRoutineName: "",
  flowMode: localStorage.getItem(STORAGE.workoutFlowMode) || "straight",
  roundNumber: 0,
  addExerciseOpen: false,
  addExerciseQuery: "",
  addExerciseFilter: "all",
  flowChoiceOpen: false,
  restoredFromDraft: false,
  // Slice 2 (focused workout): which exercise screen we're on, and whether
  // we're showing an exercise ("exercise") or the finish/summary ("finish").
  currentIndex: 0,
  // Strength exercises page one set at a time: which set of the current
  // exercise is on screen. currentSet === sets.length is the "add another set
  // or move on" wrap page shown after the last set.
  currentSet: 0,
  phase: "exercise",
  editTargetsOpen: false,
  referenceOpen: false,
  // Which set/hold has its optional effort chips expanded, as "exId:index".
  // null = none open. Single key because only one unit is on screen at a time.
  effortOpenKey: null,
  // Slice 2b (built-in timer for held moves like a plank). Lives outside the
  // exercise list because it's about the live countdown, not saved data.
  timer: {
    total: 45000,      // chosen hold length in milliseconds
    remaining: 45000,  // milliseconds left on the current countdown
    running: false,    // true while counting down
    raf: null,         // requestAnimationFrame handle
    lastTs: 0,         // last animation timestamp, for accurate elapsed time
    finished: false,   // true for a moment after hitting zero (drives the flash)
    holdIndex: 0       // which hold the countdown is currently pointed at
  },
  // Guided rest countdown shown between sets/holds. It can auto-start when the
  // coach turned on restTimer, or be opened by tapping a visible rest label.
  // Separate from the hold timer above because it's about the gap between units,
  // not a held move. Always skippable.
  rest: {
    active: false,     // true while the between-set rest screen is showing
    total: 0,          // chosen rest length in milliseconds
    remaining: 0,      // milliseconds left
    running: false,    // true while counting down
    raf: null,         // requestAnimationFrame handle
    lastTs: 0,         // last animation timestamp
    exerciseId: null   // which exercise this rest belongs to
  }
};

// Held / "timed" moves are done for a number of seconds, not weight x reps
// (e.g. a plank held 3 x 45 sec). We detect them by id so existing plans work
// straight away; a future tweak can let custom exercises be tagged this way.
const TIMED_HOLD_IDS = ["plank", "side-plank", "wall-sit", "hollow-hold", "dead-hang", "l-sit"];

// >>> EXERCISE_INSTRUCTIONS (generated by sync-to-app.mjs from assets/icons/
// exercises.json; verbatim Free Exercise DB instructions, public domain, with a
// few authored locally). Do not hand-edit; edit exercises.json and re-run sync.
const EXERCISE_INSTRUCTIONS = {
  "barbell-bench-press": [
    "Lie back on a flat bench. Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.",
    "From the starting position, breathe in and begin coming down slowly until the bar touches your middle chest.",
    "After a brief pause, push the bar back to the starting position as you breathe out. Focus on pushing the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position at the top of the motion, hold for a second and then start coming down slowly again. Tip: Ideally, lowering the weight should take about twice as long as raising it.",
    "Repeat the movement for the prescribed amount of repetitions.",
    "When you are done, place the bar back in the rack."
  ],
  "incline-bench-press": [
    "Lie back on an incline bench. Using a medium-width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.",
    "As you breathe in, come down slowly until you feel the bar on you upper chest.",
    "After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms in the contracted position, squeeze your chest, hold for a second and then start coming down slowly again. Tip: it should take at least twice as long to go down than to come up.",
    "Repeat the movement for the prescribed amount of repetitions.",
    "When you are done, place the bar back in the rack."
  ],
  "dumbbell-bench-press": [
    "Lie down on a flat bench with a dumbbell in each hand resting on top of your thighs. The palms of your hands will be facing each other.",
    "Then, using your thighs to help raise the dumbbells up, lift the dumbbells one at a time so that you can hold them in front of you at shoulder width.",
    "Once at shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. The dumbbells should be just to the sides of your chest, with your upper arm and forearm creating a 90 degree angle. Be sure to maintain full control of the dumbbells at all times. This will be your starting position.",
    "Then, as you breathe out, use your chest to push the dumbbells up. Lock your arms at the top of the lift and squeeze your chest, hold for a second and then begin coming down slowly. Tip: Ideally, lowering the weight should take about twice as long as raising it.",
    "Repeat the movement for the prescribed amount of repetitions of your training program."
  ],
  "dumbbell-fly": [
    "Lie down on a flat bench with a dumbbell on each hand resting on top of your thighs. The palms of your hand will be facing each other.",
    "Then using your thighs to help raise the dumbbells, lift the dumbbells one at a time so you can hold them in front of you at shoulder width with the palms of your hands facing each other. Raise the dumbbells up like you're pressing them, but stop and hold just before you lock out. This will be your starting position.",
    "With a slight bend on your elbows in order to prevent stress at the biceps tendon, lower your arms out at both sides in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms should remain stationary; the movement should only occur at the shoulder joint.",
    "Return your arms back to the starting position as you squeeze your chest muscles and breathe out. Tip: Make sure to use the same arc of motion used to lower the weights.",
    "Hold for a second at the contracted position and repeat the movement for the prescribed amount of repetitions."
  ],
  "push-up": [
    "Lie on the floor face down and place your hands about 36 inches apart while holding your torso up at arms length.",
    "Next, lower yourself downward until your chest almost touches the floor as you inhale.",
    "Now breathe out and press your upper body back up to the starting position while squeezing your chest.",
    "After a brief pause at the top contracted position, you can begin to lower yourself downward again for as many repetitions as needed."
  ],
  "chest-dip": [
    "For this exercise you will need access to parallel bars. To get yourself into the starting position, hold your body at arms length (arms locked) above the bars.",
    "While breathing in, lower yourself slowly with your torso leaning forward around 30 degrees or so and your elbows flared out slightly until you feel a slight stretch in the chest.",
    "Once you feel the stretch, use your chest to bring your body back to the starting position as you breathe out. Tip: Remember to squeeze the chest at the top of the movement for a second.",
    "Repeat the movement for the prescribed amount of repetitions."
  ],
  "cable-crossover": [
    "To get yourself into the starting position, place the pulleys on a high position (above your head), select the resistance to be used and hold the pulleys in each hand.",
    "Step forward in front of an imaginary straight line between both pulleys while pulling your arms together in front of you. Your torso should have a small forward bend from the waist. This will be your starting position.",
    "With a slight bend on your elbows in order to prevent stress at the biceps tendon, extend your arms to the side (straight out at both sides) in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms and torso should remain stationary; the movement should only occur at the shoulder joint.",
    "Return your arms back to the starting position as you breathe out. Make sure to use the same arc of motion used to lower the weights.",
    "Hold for a second at the starting position and repeat the movement for the prescribed amount of repetitions."
  ],
  "deadlift": [
    "Stand in front of a loaded barbell.",
    "While keeping the back as straight as possible, bend your knees, bend forward and grasp the bar using a medium (shoulder width) overhand grip. This will be the starting position of the exercise. Tip: If it is difficult to hold on to the bar with this grip, alternate your grip or use wrist straps.",
    "While holding the bar, start the lift by pushing with your legs while simultaneously getting your torso to the upright position as you breathe out. In the upright position, stick your chest out and contract the back by bringing the shoulder blades back. Think of how the soldiers in the military look when they are in standing in attention.",
    "Go back to the starting position by bending at the knees while simultaneously leaning the torso forward at the waist while keeping the back straight. When the weights on the bar touch the floor you are back at the starting position and ready to perform another repetition.",
    "Perform the amount of repetitions prescribed in the program."
  ],
  "romanian-deadlift": [
    "Put a barbell in front of you on the ground and grab it using a pronated (palms facing down) grip that a little wider than shoulder width. Tip: Depending on the weight used, you may need wrist wraps to perform the exercise and also a raised platform in order to allow for better range of motion.",
    "Bend the knees slightly and keep the shins vertical, hips back and back straight. This will be your starting position.",
    "Keeping your back and arms completely straight at all times, use your hips to lift the bar as you exhale. Tip: The movement should not be fast but steady and under control.",
    "Once you are standing completely straight up, lower the bar by pushing the hips back, only slightly bending the knees, unlike when squatting. Tip: Take a deep breath at the start of the movement and keep your chest up. Hold your breath as you lower and exhale as you complete the movement.",
    "Repeat for the recommended amount of repetitions."
  ],
  "pull-up": [
    "Grab the pull-up bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than your shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width.",
    "As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.",
    "Pull your torso up until the bar touches your upper chest by drawing the shoulders and the upper arms down and back. Exhale as you perform this portion of the movement. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar.",
    "After a second on the contracted position, start to inhale and slowly lower your torso back to the starting position when your arms are fully extended and the lats are fully stretched.",
    "Repeat this motion for the prescribed amount of repetitions."
  ],
  "chin-up": [
    "Grab the pull-up bar with the palms facing your torso and a grip closer than the shoulder width.",
    "As you have both arms extended in front of you holding the bar at the chosen grip width, keep your torso as straight as possible while creating a curvature on your lower back and sticking your chest out. This is your starting position. Tip: Keeping the torso as straight as possible maximizes biceps stimulation while minimizing back involvement.",
    "As you breathe out, pull your torso up until your head is around the level of the pull-up bar. Concentrate on using the biceps muscles in order to perform the movement. Keep the elbows close to your body. Tip: The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar.",
    "After a second of squeezing the biceps in the contracted position, slowly lower your torso back to the starting position; when your arms are fully extended. Breathe in as you perform this portion of the movement.",
    "Repeat this motion for the prescribed amount of repetitions."
  ],
  "lat-pulldown": [
    "Sit down on a pull-down machine with a wide bar attached to the top pulley. Make sure that you adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar.",
    "Grab the bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width.",
    "As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.",
    "As you breathe out, bring the bar down until it touches your upper chest by drawing the shoulders and the upper arms down and back. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary and only the arms should move. The forearms should do no other work except for holding the bar; therefore do not try to pull down the bar using the forearms.",
    "After a second at the contracted position squeezing your shoulder blades together, slowly raise the bar back to the starting position when your arms are fully extended and the lats are fully stretched. Inhale during this portion of the movement.",
    "Repeat this motion for the prescribed amount of repetitions."
  ],
  "bent-over-row": [
    "Holding a barbell with a pronated grip (palms facing down), bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The barbell should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position.",
    "Now, while keeping the torso stationary, breathe out and lift the barbell to you. Keep the elbows close to the body and only use the forearms to hold the weight. At the top contracted position, squeeze the back muscles and hold for a brief pause.",
    "Then inhale and slowly lower the barbell back to the starting position.",
    "Repeat for the recommended amount of repetitions."
  ],
  "seated-cable-row": [
    "For this exercise you will need access to a low pulley row machine with a V-bar. Note: The V-bar will enable you to have a neutral grip where the palms of your hands face each other. To get into the starting position, first sit down on the machine and place your feet on the front platform or crossbar provided making sure that your knees are slightly bent and not locked.",
    "Lean over as you keep the natural alignment of your back and grab the V-bar handles.",
    "With your arms extended pull back until your torso is at a 90-degree angle from your legs. Your back should be slightly arched and your chest should be sticking out. You should be feeling a nice stretch on your lats as you hold the bar in front of you. This is the starting position of the exercise.",
    "Keeping the torso stationary, pull the handles back towards your torso while keeping the arms close to it until you touch the abdominals. Breathe out as you perform that movement. At that point you should be squeezing your back muscles hard. Hold that contraction for a second and slowly go back to the original position while breathing in.",
    "Repeat for the recommended amount of repetitions."
  ],
  "one-arm-dumbbell-row": [
    "Choose a flat bench and place a dumbbell on each side of it.",
    "Place the right leg on top of the end of the bench, bend your torso forward from the waist until your upper body is parallel to the floor, and place your right hand on the other end of the bench for support.",
    "Use the left hand to pick up the dumbbell on the floor and hold the weight while keeping your lower back straight. The palm of the hand should be facing your torso. This will be your starting position.",
    "Pull the resistance straight up to the side of your chest, keeping your upper arm close to your side and keeping the torso stationary. Breathe out as you perform this step. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. Also, make sure that the force is performed with the back muscles and not the arms. Finally, the upper torso should remain stationary and only the arms should move. The forearms should do no other work except for holding the dumbbell; therefore do not try to pull the dumbbell up using the forearms.",
    "Lower the resistance straight down to the starting position. Breathe in as you perform this step.",
    "Repeat the movement for the specified amount of repetitions.",
    "Switch sides and repeat again with the other arm."
  ],
  "face-pull": [
    "Facing a high pulley with a rope or dual handles attached, pull the weight directly towards your face, separating your hands as you do so. Keep your upper arms parallel to the ground."
  ],
  "overhead-press": [
    "Start by placing a barbell that is about chest high on a squat rack. Once you have selected the weights, grab the barbell using a pronated (palms facing forward) grip. Make sure to grip the bar wider than shoulder width apart from each other.",
    "Slightly bend the knees and place the barbell on your collar bone. Lift the barbell up keeping it lying on your chest. Take a step back and position your feet shoulder width apart from each other.",
    "Once you pick up the barbell with the correct grip length, lift the bar up over your head by locking your arms. Hold at about shoulder level and slightly in front of your head. This is your starting position.",
    "Lower the bar down to the collarbone slowly as you inhale.",
    "Lift the bar back up to the starting position as you exhale.",
    "Repeat for the recommended amount of repetitions."
  ],
  "dumbbell-shoulder-press": [
    "While holding a dumbbell in each hand, sit on a military press bench or utility bench that has back support. Place the dumbbells upright on top of your thighs.",
    "Now raise the dumbbells to shoulder height one at a time using your thighs to help propel them up into position.",
    "Make sure to rotate your wrists so that the palms of your hands are facing forward. This is your starting position.",
    "Now, exhale and push the dumbbells upward until they touch at the top.",
    "Then, after a brief pause at the top contracted position, slowly lower the weights back down to the starting position while inhaling.",
    "Repeat for the recommended amount of repetitions."
  ],
  "lateral-raise": [
    "Pick a couple of dumbbells and stand with a straight torso and the dumbbells by your side at arms length with the palms of the hand facing you. This will be your starting position.",
    "While maintaining the torso in a stationary position (no swinging), lift the dumbbells to your side with a slight bend on the elbow and the hands slightly tilted forward as if pouring water in a glass. Continue to go up until you arms are parallel to the floor. Exhale as you execute this movement and pause for a second at the top.",
    "Lower the dumbbells back down slowly to the starting position as you inhale.",
    "Repeat for the recommended amount of repetitions."
  ],
  "front-raise": [
    "Pick a couple of dumbbells and stand with a straight torso and the dumbbells on front of your thighs at arms length with the palms of the hand facing your thighs. This will be your starting position.",
    "While maintaining the torso stationary (no swinging), lift the left dumbbell to the front with a slight bend on the elbow and the palms of the hands always facing down. Continue to go up until you arm is slightly above parallel to the floor. Exhale as you execute this portion of the movement and pause for a second at the top. Inhale after the second pause.",
    "Now lower the dumbbell back down slowly to the starting position as you simultaneously lift the right dumbbell.",
    "Continue alternating in this fashion until all of the recommended amount of repetitions have been performed for each arm."
  ],
  "rear-delt-fly": [
    "Adjust the pulleys to the appropriate height and adjust the weight. The pulleys should be above your head.",
    "Grab the left pulley with your right hand and the right pulley with your left hand, crossing them in front of you. This will be your starting position.",
    "Initiate the movement by moving your arms back and outward, keeping your arms straight as you execute the movement.",
    "Pause at the end of the motion before returning the handles to the start position."
  ],
  "arnold-press": [
    "Sit on an exercise bench with back support and hold two dumbbells in front of you at about upper chest level with your palms facing your body and your elbows bent. Tip: Your arms should be next to your torso. The starting position should look like the contracted portion of a dumbbell curl.",
    "Now to perform the movement, raise the dumbbells as you rotate the palms of your hands until they are facing forward.",
    "Continue lifting the dumbbells until your arms are extended above you in straight arm position. Breathe out as you perform this portion of the movement.",
    "After a second pause at the top, begin to lower the dumbbells to the original position by rotating the palms of your hands towards you. Tip: The left arm will be rotated in a counter clockwise manner while the right one will be rotated clockwise. Breathe in as you perform this portion of the movement.",
    "Repeat for the recommended amount of repetitions."
  ],
  "shrug": [
    "Stand up straight with your feet at shoulder width as you hold a barbell with both hands in front of you using a pronated grip (palms facing the thighs). Tip: Your hands should be a little wider than shoulder width apart. You can use wrist wraps for this exercise for a better grip. This will be your starting position.",
    "Raise your shoulders up as far as you can go as you breathe out and hold the contraction for a second. Tip: Refrain from trying to lift the barbell by using your biceps.",
    "Slowly return to the starting position as you breathe in.",
    "Repeat for the recommended amount of repetitions."
  ],
  "back-squat": [
    "This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack just above shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.",
    "Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.",
    "Step away from the rack and position your legs using a shoulder-width medium stance with the toes slightly pointed out. Keep your head up at all times and maintain a straight back. This will be your starting position.",
    "Begin to slowly lower the bar by bending the knees and sitting back with your hips as you maintain a straight posture with the head up. Continue down until your hamstrings are on your calves. Inhale as you perform this portion of the movement.",
    "Begin to raise the bar as you exhale by pushing the floor with the heel or middle of your foot as you straighten the legs and extend the hips to go back to the starting position.",
    "Repeat for the recommended amount of repetitions."
  ],
  "front-squat": [
    "This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, bring your arms up under the bar while keeping the elbows high and the upper arm slightly above parallel to the floor. Rest the bar on top of the deltoids and cross your arms while grasping the bar for total control.",
    "Lift the bar off the rack by first pushing with your legs and at the same time straightening your torso.",
    "Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section).",
    "Begin to slowly lower the bar by bending the knees as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.",
    "Begin to raise the bar as you exhale by pushing the floor mainly with the middle of your foot as you straighten the legs again and go back to the starting position.",
    "Repeat for the recommended amount of repetitions."
  ],
  "goblet-squat": [
    "Stand holding a light kettlebell by the horns close to your chest. This will be your starting position.",
    "Squat down between your legs until your hamstrings are on your calves. Keep your chest and head up and your back straight.",
    "At the bottom position, pause and use your elbows to push your knees out. Return to the starting position, and repeat for 10-20 repetitions."
  ],
  "leg-press": [
    "Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a medium (shoulder width) foot stance. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section).",
    "Lower the safety bars holding the weighted platform in place and press the platform all the way up until your legs are fully extended in front of you. Tip: Make sure that you do not lock your knees. Your torso and the legs should make a perfect 90-degree angle. This will be your starting position.",
    "As you inhale, slowly lower the platform until your upper and lower legs make a 90-degree angle.",
    "Pushing mainly with the heels of your feet and using the quadriceps go back to the starting position as you exhale.",
    "Repeat for the recommended amount of repetitions and ensure to lock the safety pins properly once you are done. You do not want that platform falling on you fully loaded."
  ],
  "lunge": [
    "Stand with your torso upright holding two dumbbells in your hands by your sides. This will be your starting position.",
    "Step forward with your right leg around 2 feet or so from the foot being left stationary behind and lower your upper body down, while keeping the torso upright and maintaining balance. Inhale as you go down. Note: As in the other exercises, do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. Make sure that you keep your front shin perpendicular to the ground.",
    "Using mainly the heel of your foot, push up and go back to the starting position as you exhale.",
    "Repeat the movement for the recommended amount of repetitions and then perform with the left leg."
  ],
  "bulgarian-split-squat": [
    "Position yourself into a staggered stance with the rear foot elevated and front foot forward.",
    "Hold a dumbbell in each hand, letting them hang at the sides. This will be your starting position.",
    "Begin by descending, flexing your knee and hip to lower your body down. Maintain good posture througout the movement. Keep the front knee in line with the foot as you perform the exercise.",
    "At the bottom of the movement, drive through the heel to extend the knee and hip to return to the starting position."
  ],
  "leg-extension": [
    "For this exercise you will need to use a leg extension machine. First choose your weight and sit on the machine with your legs under the pad (feet pointed forward) and the hands holding the side bars. This will be your starting position. Tip: You will need to adjust the pad so that it falls on top of your lower leg (just above your feet). Also, make sure that your legs form a 90-degree angle between the lower and upper leg. If the angle is less than 90-degrees then that means the knee is over the toes which in turn creates undue stress at the knee joint. If the machine is designed that way, either look for another machine or just make sure that when you start executing the exercise you stop going down once you hit the 90-degree angle.",
    "Using your quadriceps, extend your legs to the maximum as you exhale. Ensure that the rest of the body remains stationary on the seat. Pause a second on the contracted position.",
    "Slowly lower the weight back to the original position as you inhale, ensuring that you do not go past the 90-degree angle limit.",
    "Repeat for the recommended amount of times."
  ],
  "leg-curl": [
    "Adjust the machine lever to fit your height and lie face down on the leg curl machine with the pad of the lever on the back of your legs (just a few inches under the calves). Tip: Preferably use a leg curl machine that is angled as opposed to flat since an angled position is more favorable for hamstrings recruitment.",
    "Keeping the torso flat on the bench, ensure your legs are fully stretched and grab the side handles of the machine. Position your toes straight (or you can also use any of the other two stances described on the foot positioning section). This will be your starting position.",
    "As you exhale, curl your legs up as far as possible without lifting the upper legs from the pad. Once you hit the fully contracted position, hold it for a second.",
    "As you inhale, bring the legs back to the initial position. Repeat for the recommended amount of repetitions."
  ],
  "calf-raise": [
    "Adjust the padded lever of the calf raise machine to fit your height.",
    "Place your shoulders under the pads provided and position your toes facing forward (or using any of the two other positions described at the beginning of the chapter). The balls of your feet should be secured on top of the calf block with the heels extending off it. Push the lever up by extending your hips and knees until your torso is standing erect. The knees should be kept with a slight bend; never locked. Toes should be facing forward, outwards or inwards as described at the beginning of the chapter. This will be your starting position.",
    "Raise your heels as you breathe out by extending your ankles as high as possible and flexing your calf. Ensure that the knee is kept stationary at all times. There should be no bending at any time. Hold the contracted position by a second before you start to go back down.",
    "Go back slowly to the starting position as you breathe in by lowering your heels as you bend the ankles until calves are stretched.",
    "Repeat for the recommended amount of repetitions."
  ],
  "hip-thrust": [
    "Begin seated on the ground with a bench directly behind you. Have a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise.",
    "Roll the bar so that it is directly above your hips, and lean back against the bench so that your shoulder blades are near the top of it.",
    "Begin the movement by driving through your feet, extending your hips vertically through the bar. Your weight should be supported by your shoulder blades and your feet. Extend as far as possible, then reverse the motion to return to the starting position."
  ],
  "barbell-curl": [
    "Stand up with your torso upright while holding a barbell at a shoulder-width grip. The palm of your hands should be facing forward and the elbows should be close to the torso. This will be your starting position.",
    "While holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Tip: Only the forearms should move.",
    "Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second and squeeze the biceps hard.",
    "Slowly begin to bring the bar back to starting position as your breathe in.",
    "Repeat for the recommended amount of repetitions."
  ],
  "dumbbell-curl": [
    "Stand up straight with a dumbbell in each hand at arm's length. Keep your elbows close to your torso and rotate the palms of your hands until they are facing forward. This will be your starting position.",
    "Now, keeping the upper arms stationary, exhale and curl the weights while contracting your biceps. Continue to raise the weights until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a brief pause as you squeeze your biceps.",
    "Then, inhale and slowly begin to lower the dumbbells back to the starting position.",
    "Repeat for the recommended amount of repetitions."
  ],
  "hammer-curl": [
    "Stand up with your torso upright and a dumbbell on each hand being held at arms length. The elbows should be close to the torso.",
    "The palms of the hands should be facing your torso. This will be your starting position.",
    "Now, while holding your upper arm stationary, exhale and curl the weight forward while contracting the biceps. Continue to raise the weight until the biceps are fully contracted and the dumbbell is at shoulder level. Hold the contracted position for a brief moment as you squeeze the biceps. Tip: Focus on keeping the elbow stationary and only moving your forearm.",
    "After the brief pause, inhale and slowly begin the lower the dumbbells back down to the starting position.",
    "Repeat for the recommended amount of repetitions."
  ],
  "preacher-curl": [
    "To perform this movement you will need a preacher bench and an E-Z bar. Grab the E-Z curl bar at the close inner handle (either have someone hand you the bar which is preferable or grab the bar from the front bar rest provided by most preacher benches). The palm of your hands should be facing forward and they should be slightly tilted inwards due to the shape of the bar.",
    "With the upper arms positioned against the preacher bench pad and the chest against it, hold the E-Z Curl Bar at shoulder length. This will be your starting position.",
    "As you breathe in, slowly lower the bar until your upper arm is extended and the biceps is fully stretched.",
    "As you exhale, use the biceps to curl the weight up until your biceps is fully contracted and the bar is at shoulder height. Squeeze the biceps hard and hold this position for a second.",
    "Repeat for the recommended amount of repetitions."
  ],
  "triceps-pushdown": [
    "Attach a straight or angled bar to a high pulley and grab with an overhand grip (palms facing down) at shoulder width.",
    "Standing upright with the torso straight and a very small inclination forward, bring the upper arms close to your body and perpendicular to the floor. The forearms should be pointing up towards the pulley as they hold the bar. This is your starting position.",
    "Using the triceps, bring the bar down until it touches the front of your thighs and the arms are fully extended perpendicular to the floor. The upper arms should always remain stationary next to your torso and only the forearms should move. Exhale as you perform this movement.",
    "After a second hold at the contracted position, bring the bar slowly up to the starting point. Breathe in as you perform this step.",
    "Repeat for the recommended amount of repetitions."
  ],
  "skullcrusher": [
    "Using a close grip, lift the EZ bar and hold it with your elbows in as you lie on the bench. Your arms should be perpendicular to the floor. This will be your starting position.",
    "Keeping the upper arms stationary, lower the bar by allowing the elbows to flex. Inhale as you perform this portion of the movement. Pause once the bar is directly above the forehead.",
    "Lift the bar back to the starting position by extending the elbow and exhaling.",
    "Repeat."
  ],
  "overhead-triceps-extension": [
    "Attach a rope to the bottom pulley of the pulley machine.",
    "Grasping the rope with both hands, extend your arms with your hands directly above your head using a neutral grip (palms facing each other). Your elbows should be in close to your head and the arms should be perpendicular to the floor with the knuckles aimed at the ceiling. This will be your starting position.",
    "Slowly lower the rope behind your head as you hold the upper arms stationary. Inhale as you perform this movement and pause when your triceps are fully stretched.",
    "Return to the starting position by flexing your triceps as you breathe out.",
    "Repeat for the recommended amount of repetitions."
  ],
  "close-grip-bench-press": [
    "Lie back on a flat bench. Using a close grip (around shoulder width), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.",
    "As you breathe in, come down slowly until you feel the bar on your middle chest. Tip: Make sure that - as opposed to a regular bench press - you keep the elbows close to the torso at all times in order to maximize triceps involvement.",
    "After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your triceps muscles. Lock your arms in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up.",
    "Repeat the movement for the prescribed amount of repetitions.",
    "When you are done, place the bar back in the rack."
  ],
  "plank": [
    "Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder.",
    "Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised."
  ],
  "crunch": [
    "Lie flat on your back with your feet flat on the ground, or resting on a bench with your knees bent at a 90 degree angle. If you are resting your feet on a bench, place them three to four inches apart and point your toes inward so they touch.",
    "Now place your hands lightly on either side of your head keeping your elbows in. Tip: Don't lock your fingers behind your head.",
    "While pushing the small of your back down in the floor to better isolate your abdominal muscles, begin to roll your shoulders off the floor.",
    "Continue to push down as hard as you can with your lower back as you contract your abdominals and exhale. Your shoulders should come up off the floor only about four inches, and your lower back should remain on the floor. At the top of the movement, contract your abdominals hard and keep the contraction for a second. Tip: Focus on slow, controlled movement - don't cheat yourself by using momentum.",
    "After the one second contraction, begin to come down slowly again to the starting position as you inhale.",
    "Repeat for the recommended amount of repetitions."
  ],
  "sit-up": [
    "Lie down on the floor placing your feet either under something that will not move or by having a partner hold them. Your legs should be bent at the knees.",
    "Place your hands behind your head and lock them together by clasping your fingers. This is the starting position.",
    "Elevate your upper body so that it creates an imaginary V-shape with your thighs. Breathe out when performing this part of the exercise.",
    "Once you feel the contraction for a second, lower your upper body back down to the starting position while inhaling.",
    "Repeat for the recommended amount of repetitions."
  ],
  "hanging-leg-raise": [
    "Hang from a chin-up bar with both arms extended at arms length in top of you using either a wide grip or a medium grip. The legs should be straight down with the pelvis rolled slightly backwards. This will be your starting position.",
    "Raise your legs until the torso makes a 90-degree angle with the legs. Exhale as you perform this movement and hold the contraction for a second or so.",
    "Go back slowly to the starting position as you breathe in.",
    "Repeat for the recommended amount of repetitions."
  ],
  "russian-twist": [
    "Lie down on the floor placing your feet either under something that will not move or by having a partner hold them. Your legs should be bent at the knees.",
    "Elevate your upper body so that it creates an imaginary V-shape with your thighs. Hold a light dumbbell or plate at your chest, or keep your hands clasped when practicing bodyweight. This is the starting position.",
    "Twist your torso to the right side until your arms are parallel with the floor while breathing out.",
    "Hold the contraction for a second and move back to the starting position. Now move to the opposite side using the same control.",
    "Count one rep as a right-side touch plus a left-side touch, then repeat for the prescribed reps."
  ],
  "cable-crunch": [
    "Kneel below a high pulley that contains a rope attachment.",
    "Grasp cable rope attachment and lower the rope until your hands are placed next to your face.",
    "Flex your hips slightly and allow the weight to hyperextend the lower back. This will be your starting position.",
    "With the hips stationary, flex the waist as you contract the abs so that the elbows travel towards the middle of the thighs. Exhale as you perform this portion of the movement and hold the contraction for a second.",
    "Slowly return to the starting position as you inhale. Tip: Make sure that you keep constant tension on the abs throughout the movement. Also, do not choose a weight so heavy that the lower back handles the brunt of the work.",
    "Repeat for the recommended amount of repetitions."
  ],
  "mountain-climber": [
    "Begin in a pushup position, with your weight supported by your hands and toes. Flexing the knee and hip, bring one leg until the knee is approximately under the hip. This will be your starting position.",
    "Explosively reverse the positions of your legs, extending the bent leg until the leg is straight and supported by the toe, and bringing the other foot up with the hip and knee flexed. Repeat in an alternating fashion for 20-30 seconds."
  ],
  "burpee": [
    "Stand with your feet shoulder-width apart and your arms at your sides.",
    "Drop into a squat and place your hands on the floor in front of you.",
    "Kick your feet back into a push-up position, then lower your chest to the floor.",
    "Press up and jump your feet back to your hands, then explode upward into a jump with your arms overhead.",
    "Land softly and immediately begin the next rep."
  ],
  "kettlebell-swing": [
    "Stand with feet slightly wider than shoulder-width, a kettlebell on the floor about a foot in front of you.",
    "Hinge at the hips, push your butt back, and grab the handle with both hands, keeping your back flat.",
    "Hike the bell back between your legs, then snap your hips forward to swing it up to chest height. Let your hips, not your arms, drive the movement.",
    "Let the bell fall back down, absorbing it with another hip hinge, and flow straight into the next rep."
  ],
  "jumping-jack": [
    "Begin in a relaxed stance with your feet shoulder width apart and hold your arms close to the body.",
    "To initiate the move, squat down halfway and explode back up as high as possible. Fully extend your entire body, spreading your legs and arms away from the body.",
    "As you land, bring your limbs back in and absorb your impact through the legs."
  ],
  "box-jump": [
    "Begin with a box of an appropriate height 1-2 feet in front of you. Stand with your feet should width apart. This will be your starting position.",
    "Perform a short squat in preparation for jumping, swinging your arms behind you.",
    "Rebound out of this position, extending through the hips, knees, and ankles to jump as high as possible. Swing your arms forward and up.",
    "Land on the box with the knees bent, absorbing the impact through the legs. You can jump from the box back to the ground, or preferably step down one leg at a time."
  ],
  "soccer": [
    "Log the minutes you spent playing and add any notes about the session.",
    "Warm up with light jogging and dynamic stretches before intense play.",
    "Stay hydrated and listen to your body during and after the match."
  ],
  "pickleball": [
    "Log the minutes you spent playing and add any notes about the session.",
    "Warm up with light footwork drills and dynamic stretches before fast rallies.",
    "Stay light on your feet, keep paddle up, and listen to your body between games."
  ],
  "dumbbell-pullover": [
    "Place a dumbbell standing up on a flat bench.",
    "Ensuring that the dumbbell stays securely placed at the top of the bench, lie perpendicular to the bench (torso across it as in forming a cross) with only your shoulders lying on the surface. Hips should be below the bench and legs bent with feet firmly on the floor. The head will be off the bench as well.",
    "Grasp the dumbbell with both hands and hold it straight over your chest with a bend in your arms. Both palms should be pressing against the underside one of the sides of the dumbbell. This will be your starting position. Caution: Always ensure that the dumbbell used for this exercise is secure. Using a dumbbell with loose plates can result in the dumbbell falling apart and falling on your face.",
    "While keeping your arms locked in the bent arm position, lower the weight slowly in an arc behind your head while breathing in until you feel a stretch on the chest.",
    "At that point, bring the dumbbell back to the starting position using the arc through which the weight was lowered and exhale as you perform this movement.",
    "Hold the weight on the initial position for a second and repeat the motion for the prescribed number of repetitions."
  ],
  "machine-chest-press": [
    "Sit down on the Chest Press Machine and select the weight.",
    "Step on the lever provided by the machine since it will help you to bring the handles forward so that you can grab the handles and fully extend the arms.",
    "Grab the handles with a palms-down grip and lift your elbows so that your upper arms are parallel to the floor to the sides of your torso. Tip: Your forearms will be pointing forward since you are grabbing the handles. Once you bring the handles forward and extend the arms you will be at the starting position.",
    "Now bring the handles back towards you as you breathe in.",
    "Push the handles away from you as you flex your pecs and you breathe out. Hold the contraction for a second before going back to the starting position.",
    "Repeat for the recommended amount of reps.",
    "When finished step on the lever again and slowly get the handles back to their original place."
  ],
  "pec-deck-fly": [
    "Sit on the machine with your back flat on the pad.",
    "Take hold of the handles. Tip: Your upper arms should be positioned parallel to the floor; adjust the machine accordingly. This will be your starting position.",
    "Push the handles together slowly as you squeeze your chest in the middle. Breathe out during this part of the motion and hold the contraction for a second.",
    "Return back to the starting position slowly as you inhale until your chest muscles are fully stretched.",
    "Repeat for the recommended amount of repetitions."
  ],
  "incline-dumbbell-press": [
    "Lie back on an incline bench with a dumbbell in each hand atop your thighs. The palms of your hands will be facing each other.",
    "Then, using your thighs to help push the dumbbells up, lift the dumbbells one at a time so that you can hold them at shoulder width.",
    "Once you have the dumbbells raised to shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. This will be your starting position.",
    "Be sure to keep full control of the dumbbells at all times. Then breathe out and push the dumbbells up with your chest.",
    "Lock your arms at the top, hold for a second, and then start slowly lowering the weight. Tip Ideally, lowering the weights should take about twice as long as raising them.",
    "Repeat the movement for the prescribed amount of repetitions.",
    "When you are done, place the dumbbells back on your thighs and then on the floor. This is the safest manner to release the dumbbells."
  ],
  "decline-bench-press": [
    "Secure your legs at the end of the decline bench and slowly lay down on the bench.",
    "Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. The arms should be perpendicular to the floor. This will be your starting position. Tip: In order to protect your rotator cuff, it is best if you have a spotter help you lift the barbell off the rack.",
    "As you breathe in, come down slowly until you feel the bar on your lower chest.",
    "After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up).",
    "Repeat the movement for the prescribed amount of repetitions.",
    "When you are done, place the bar back in the rack."
  ],
  "incline-dumbbell-fly": [
    "Hold a dumbbell on each hand and lie on an incline bench that is set to an incline angle of no more than 30 degrees.",
    "Extend your arms above you with a slight bend at the elbows.",
    "Now rotate the wrists so that the palms of your hands are facing you. Tip: The pinky fingers should be next to each other. This will be your starting position.",
    "As you breathe in, start to slowly lower the arms to the side while keeping the arms extended and while rotating the wrists until the palms of the hand are facing each other. Tip: At the end of the movement the arms will be by your side with the palms facing the ceiling.",
    "As you exhale start to bring the dumbbells back up to the starting position by reversing the motion and rotating the hands so that the pinky fingers are next to each other again. Tip: Keep in mind that the movement will only happen at the shoulder joint and at the wrist. There is no motion that happens at the elbow joint.",
    "Repeat for the recommended amount of repetitions."
  ],
  "diamond-push-up": [
    "Lie on the floor face down and place your hands closer than shoulder width for a close hand position. Make sure that you are holding your torso up at arms' length.",
    "Lower yourself until your chest almost touches the floor as you inhale.",
    "Using your triceps and some of your pectoral muscles, press your upper body back up to the starting position and squeeze your chest. Breathe out as you perform this step.",
    "After a second pause at the contracted position, repeat the movement for the prescribed amount of repetitions."
  ],
  "inverted-row": [
    "Position a bar in a rack to about waist height. You can also use a smith machine.",
    "Take a wider than shoulder width grip on the bar and position yourself hanging underneath the bar. Your body should be straight with your heels on the ground with your arms fully extended. This will be your starting position.",
    "Begin by flexing the elbow, pulling your chest towards the bar. Retract your shoulder blades as you perform the movement.",
    "Pause at the top of the motion, and return yourself to the start position.",
    "Repeat for the desired number of repetitions."
  ],
  "decline-dumbbell-press": [
    "Secure your legs at the end of the decline bench and lie down with a dumbbell on each hand on top of your thighs. The palms of your hand will be facing each other.",
    "Once you are laying down, move the dumbbells in front of you at shoulder width.",
    "Once at shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. This will be your starting position.",
    "Bring down the weights slowly to your side as you breathe out. Keep full control of the dumbbells at all times. Tip: Throughout the motion, the forearms should always be perpendicular to the floor.",
    "As you breathe out, push the dumbbells up using your pectoral muscles. Lock your arms in the contracted position, squeeze your chest, hold for a second and then start coming down slowly. Tip: It should take at least twice as long to go down than to come up..",
    "Repeat the movement for the prescribed amount of repetitions of your training program."
  ],
  "t-bar-row": [
    "Position a bar into a landmine or in a corner to keep it from moving. Load an appropriate weight onto your end.",
    "Stand over the bar, and position a Double D row handle around the bar next to the collar. Using your hips and legs, rise to a standing position.",
    "Assume a wide stance with your hips back and your chest up. Your arms should be extended. This will be your starting position.",
    "Pull the weight to your upper abdomen by retracting the shoulder blades and flexing the elbows. Do not jerk the weight or cheat during the movement.",
    "After a brief pause, return to the starting position."
  ],
  "good-morning": [
    "This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.",
    "Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.",
    "Step away from the rack and position your legs using a shoulder width medium stance. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position.",
    "Keeping your legs stationary, move your torso forward by bending at the hips while inhaling. Lower your torso until it is parallel with the floor.",
    "Begin to raise the bar as you exhale by elevating your torso back to the starting position.",
    "Repeat for the recommended amount of repetitions."
  ],
  "rack-pull": [
    "Set up in a power rack with the bar on the pins. The pins should be set to the desired point; just below the knees, just above, or in the mid thigh position. Position yourself against the bar in proper deadlifting position. Your feet should be under your hips, your grip shoulder width, back arched, and hips back to engage the hamstrings. Since the weight is typically heavy, you may use a mixed grip, a hook grip, or use straps to aid in holding the weight.",
    "With your head looking forward, extend through the hips and knees, pulling the weight up and back until lockout. Be sure to pull your shoulders back as you complete the movement.",
    "Return the weight to the pins and repeat."
  ],
  "straight-arm-pulldown": [
    "You will start by grabbing the wide bar from the top pulley of a pulldown machine and using a wider than shoulder-width pronated (palms down) grip. Step backwards two feet or so.",
    "Bend your torso forward at the waist by around 30-degrees with your arms fully extended in front of you and a slight bend at the elbows. If your arms are not fully extended then you need to step a bit more backwards until they are. Once your arms are fully extended and your torso is slightly bent at the waist, tighten the lats and then you are ready to begin.",
    "While keeping the arms straight, pull the bar down by contracting the lats until your hands are next to the side of the thighs. Breathe out as you perform this step.",
    "While keeping the arms straight, go back to the starting position while breathing in.",
    "Repeat for the recommended amount of repetitions."
  ],
  "back-extension": [
    "Lie face down on a hyperextension bench, tucking your ankles securely under the footpads.",
    "Adjust the upper pad if possible so your upper thighs lie flat across the wide pad, leaving enough room for you to bend at the waist without any restriction.",
    "With your body straight, cross your arms in front of you (my preference) or behind your head. This will be your starting position. Tip: You can also hold a weight plate for extra resistance in front of you under your crossed arms.",
    "Start bending forward slowly at the waist as far as you can while keeping your back flat. Inhale as you perform this movement. Keep moving forward until you feel a nice stretch on the hamstrings and you can no longer keep going without a rounding of the back. Tip: Never round the back as you perform this exercise. Also, some people can go farther than others. The key thing is that you go as far as your body allows you to without rounding the back.",
    "Slowly raise your torso back to the initial position as you inhale. Tip: Avoid the temptation to arch your back past a straight line. Also, do not swing the torso at any time in order to protect the back from injury.",
    "Repeat for the recommended amount of repetitions."
  ],
  "dumbbell-shrug": [
    "Stand erect with a dumbbell on each hand (palms facing your torso), arms extended on the sides.",
    "Lift the dumbbells by elevating the shoulders as high as possible while you exhale. Hold the contraction at the top for a second. Tip: The arms should remain extended at all times. Refrain from using the biceps to help lift the dumbbells. Only the shoulders should be moving up and down.",
    "Lower the dumbbells back to the original position.",
    "Repeat for the recommended amount of repetitions."
  ],
  "cable-pulldown-underhand": [
    "Sit down on a pull-down machine with a wide bar attached to the top pulley. Adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar.",
    "Grab the pull-down bar with the palms facing your torso (a supinated grip). Make sure that the hands are placed closer than the shoulder width.",
    "As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.",
    "As you breathe out, pull the bar down until it touches your upper chest by drawing the shoulders and the upper arms down and back. Tip: Concentrate on squeezing the back muscles once you reach the fully contracted position and keep the elbows close to your body. The upper torso should remain stationary as your bring the bar to you and only the arms should move. The forearms should do no other work other than hold the bar.",
    "After a second on the contracted position, while breathing in, slowly bring the bar back to the starting position when your arms are fully extended and the lats are fully stretched.",
    "Repeat this motion for the prescribed amount of repetitions."
  ],
  "wide-grip-pull-up": [
    "Grab the pull-up bar with the palms facing forward using a wide grip.",
    "As you have both arms extended in front of you holding the bar, bring your torso forward and head so that there is an imaginary line from the pull-up bar to the back of your neck. This is your starting position.",
    "Pull your torso up until the bar is near the back of your neck. To do this, draw the shoulders and upper arms down and back while slightly leaning your head forward. Exhale as you perform this portion of the movement. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar.",
    "After a second on the contracted position, start to inhale and slowly lower your torso back to the starting position when your arms are fully extended and the lats are fully stretched.",
    "Repeat this motion for the prescribed amount of repetitions."
  ],
  "upright-row": [
    "Grasp a barbell with an overhand grip that is slightly less than shoulder width. The bar should be resting on the top of your thighs with your arms extended and a slight bend in your elbows. Your back should also be straight. This will be your starting position.",
    "Now exhale and use the sides of your shoulders to lift the bar, raising your elbows up and to the side. Keep the bar close to your body as you raise it. Continue to lift the bar until it nearly touches your chin. Tip: Your elbows should drive the motion, and should always be higher than your forearms. Remember to keep your torso stationary and pause for a second at the top of the movement.",
    "Lower the bar back down slowly to the starting position. Inhale as you perform this portion of the movement.",
    "Repeat for the recommended amount of repetitions."
  ],
  "cable-lateral-raise": [
    "Stand in the middle of two low pulleys that are opposite to each other and place a flat bench right behind you (in perpendicular fashion to you; the narrow edge of the bench should be the one behind you). Select the weight to be used on each pulley.",
    "Now sit at the edge of the flat bench behind you with your feet placed in front of your knees.",
    "Bend forward while keeping your back flat and rest your torso on the thighs.",
    "Have someone give you the single handles attached to the pulleys. Grasp the left pulley with the right hand and the right pulley with the left after you select your weight. The pulleys should run under your knees and your arms will be extended with palms facing each other and a slight bend at the elbows. This will be the starting position.",
    "While keeping the arms stationary, raise the upper arms to the sides until they are parallel to the floor and at shoulder height. Exhale during the execution of this movement and hold the contraction for a second.",
    "Slowly lower your arms to the starting position as you inhale.",
    "Repeat for the recommended amount of repetitions. Tip: Maintain upper arms perpendicular to torso and a fixed elbow position (10 degree to 30 degree angle) throughout exercise."
  ],
  "reverse-dumbbell-fly": [
    "To begin, lie down on an incline bench with the chest and stomach pressing against the incline. Have the dumbbells in each hand with the palms facing each other (neutral grip).",
    "Extend the arms in front of you so that they are perpendicular to the angle of the bench. The legs should be stationary while applying pressure with the ball of your toes. This is the starting position.",
    "Maintaining the slight bend of the elbows, move the weights out and away from each other (to the side) in an arc motion while exhaling. Tip: Try to squeeze your shoulder blades together to get the best results from this exercise.",
    "The arms should be elevated until they are parallel to the floor.",
    "Feel the contraction and slowly lower the weights back down to the starting position while inhaling.",
    "Repeat for the recommended amount of repetitions."
  ],
  "seated-dumbbell-press": [
    "Grab a couple of dumbbells and sit on a military press bench or a utility bench that has a back support on it as you place the dumbbells upright on top of your thighs.",
    "Clean the dumbbells up one at a time by using your thighs to bring the dumbbells up to shoulder height at each side.",
    "Rotate the wrists so that the palms of your hands are facing forward. This is your starting position.",
    "As you exhale, push the dumbbells up until they touch at the top.",
    "After a second pause, slowly come down back to the starting position as you inhale.",
    "Repeat for the recommended amount of repetitions."
  ],
  "reverse-pec-deck": [
    "Adjust the handles so that they are fully to the rear. Make an appropriate weight selection and adjust the seat height so the handles are at shoulder level. Grasp the handles with your hands facing inwards. This will be your starting position.",
    "In a semicircular motion, pull your hands out to your side and back, contracting your rear delts.",
    "Keep your arms slightly bent throughout the movement, with all of the motion occurring at the shoulder joint.",
    "Pause at the rear of the movement, and slowly return the weight to the starting position."
  ],
  "external-rotation": [
    "Lie sideways on a flat bench with one arm holding a dumbbell and the other hand on top of the bench folded so that you can rest your head on it.",
    "Bend the elbows of the arm holding the dumbbell so that it creates a 90-degree angle between the upper arm and the forearm. Tip: Keep the arm parallel to your torso.",
    "Now bend the elbow while keeping the upper arm stationary. In this manner, the forearm will be parallel to the floor and perpendicular to your torso (Tip: So the forearm will be directly in front of you). The upper arm will be stationary by your torso and should be parallel to the floor (aligned with your torso at all times). This will be your starting position.",
    "As you breathe out, externally rotate your forearm so that the dumbbell is lifted up in a semicircle motion as you maintain the 90 degree angle bend between the upper arms and the forearm. You will continue this external rotation until the forearm is perpendicular to the floor and the torso pointing towards the ceiling. At this point you will hold the contraction for a second.",
    "As you breathe in, slowly go back to the starting position.",
    "Repeat for the recommended amount of repetitions and then switch to the other arm."
  ],
  "push-press": [
    "Standing with the weight racked on the back of the shoulders, begin with the dip. With your feet directly under your hips, flex the knees without moving the hips backward. Go down only slightly, and reverse direction as powerfully as possible. Drive through the heels create as much speed and force as possible, moving the bar in a vertical path.",
    "Using the momentum generated, finish pressing the weight overhead be extending through the arms.",
    "Return to the starting position, using your legs to absorb the impact."
  ],
  "hack-squat": [
    "Place the back of your torso against the back pad of the machine and hook your shoulders under the shoulder pads provided.",
    "Position your legs in the platform using a shoulder width medium stance with the toes slightly pointed out. Tip: Keep your head up at all times and also maintain the back on the pad at all times.",
    "Place your arms on the side handles of the machine and disengage the safety bars (which on most designs is done by moving the side handles from a facing front position to a diagonal position).",
    "Now straighten your legs without locking the knees. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section).",
    "Begin to slowly lower the unit by bending the knees as you maintain a straight posture with the head up (back on the pad at all times). Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.",
    "Begin to raise the unit as you exhale by pushing the floor with mainly with the heel of your foot as you straighten the legs again and go back to the starting position.",
    "Repeat for the recommended amount of repetitions."
  ],
  "barbell-lunge": [
    "This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack just below shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.",
    "Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.",
    "Step away from the rack and step forward with your right leg and squat down through your hips, while keeping the torso upright and maintaining balance. Inhale as you go down. Note: Do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. li>",
    "Using mainly the heel of your foot, push up and go back to the starting position as you exhale.",
    "Repeat the movement for the recommended amount of repetitions and then perform with the left leg."
  ],
  "walking-lunge": [
    "Begin standing with your feet shoulder width apart and a barbell across your upper back.",
    "Step forward with one leg, flexing the knees to drop your hips. Descend until your rear knee nearly touches the ground. Your posture should remain upright, and your front knee should stay above the front foot.",
    "Drive through the heel of your lead foot and extend both knees to raise yourself back up.",
    "Step forward with your rear foot, repeating the lunge on the opposite leg."
  ],
  "dumbbell-step-up": [
    "Stand up straight while holding a dumbbell on each hand (palms facing the side of your legs).",
    "Place the right foot on the elevated platform. Step on the platform by extending the hip and the knee of your right leg. Use the heel mainly to lift the rest of your body up and place the foot of the left leg on the platform as well. Breathe out as you execute the force required to come up.",
    "Step down with the left leg by flexing the hip and knee of the right leg as you inhale. Return to the original standing position by placing the right foot of to next to the left foot on the initial position.",
    "Repeat with the right leg for the recommended amount of repetitions and then perform with the left leg."
  ],
  "sumo-deadlift": [
    "Begin with a bar loaded on the ground. Approach the bar so that the bar intersects the middle of the feet. The feet should be set very wide, near the collars. Bend at the hips to grip the bar. The arms should be directly below the shoulders, inside the legs, and you can use a pronated grip, a mixed grip, or hook grip. Relax the shoulders, which in effect lengthens your arms.",
    "Take a breath, and then lower your hips, looking forward with your head with your chest up. Drive through the floor, spreading your feet apart, with your weight on the back half of your feet. Extend through the hips and knees.",
    "As the bar passes through the knees, lean back and drive the hips into the bar, pulling your shoulder blades together.",
    "Return the weight to the ground by bending at the hips and controlling the weight on the way down."
  ],
  "glute-bridge": [
    "Begin seated on the ground with a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise. Roll the bar so that it is directly above your hips, and lay down flat on the floor.",
    "Begin the movement by driving through with your heels, extending your hips vertically through the bar. Your weight should be supported by your upper back and the heels of your feet.",
    "Extend as far as possible, then reverse the motion to return to the starting position."
  ],
  "cable-pull-through": [
    "Begin standing a few feet in front of a low pulley with a rope or handle attached. Face away from the machine, straddling the cable, with your feet set wide apart.",
    "Begin the movement by reaching through your legs as far as possible, bending at the hips. Keep your knees slightly bent. Keeping your arms straight, extend through the hip to stand straight up. Avoid pulling upward through the shoulders; all of the motion should originate through the hips."
  ],
  "reverse-lunge": [
    "Stand with your torso upright holding two dumbbells in your hands by your sides. This will be your starting position.",
    "Step backward with your right leg around two feet or so from the left foot and lower your upper body down, while keeping the torso upright and maintaining balance. Inhale as you go down. Tip: As in the other exercises, do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. Make sure that you keep your front shin perpendicular to the ground. Keep the torso upright during the lunge; flexible hip flexors are important. A long lunge emphasizes the Gluteus Maximus; a short lunge emphasizes Quadriceps.",
    "Push up and go back to the starting position as you exhale. Tip: Use the ball of your feet to push in order to accentuate the quadriceps. To focus on the glutes, press with your heels.",
    "Now repeat with the opposite leg."
  ],
  "pli-dumbbell-squat": [
    "Hold a dumbbell at the base with both hands and stand straight up. Move your legs so that they are wider than shoulder width apart from each other with your knees slightly bent.",
    "Your toes should be facing out. Note: Your arms should be stationary while performing the exercise. This is the starting position.",
    "Slowly bend the knees and lower your legs until your thighs are parallel to the floor. Make sure to inhale as this is the eccentric part of the exercise.",
    "Press mainly with the heel of the foot to bring the body back to the starting position while exhaling.",
    "Repeat for the recommended amount of repetitions."
  ],
  "glute-kickback": [
    "Kneel on the floor or an exercise mat and bend at the waist with your arms extended in front of you (perpendicular to the torso) in order to get into a kneeling push-up position but with the arms spaced at shoulder width. Your head should be looking forward and the bend of the knees should create a 90-degree angle between the hamstrings and the calves. This will be your starting position.",
    "As you exhale, lift up your right leg until the hamstrings are in line with the back while maintaining the 90-degree angle bend. Contract the glutes throughout this movement and hold the contraction at the top for a second. Tip: At the end of the movement the upper leg should be parallel to the floor while the calf should be perpendicular to it.",
    "Go back to the initial position as you inhale and now repeat with the left leg.",
    "Continue to alternate legs until all of the recommended repetitions have been performed."
  ],
  "seated-leg-curl": [
    "Adjust the machine lever to fit your height and sit on the machine with your back against the back support pad.",
    "Place the back of lower leg on top of padded lever (just a few inches under the calves) and secure the lap pad against your thighs, just above the knees. Then grasp the side handles on the machine as you point your toes straight (or you can also use any of the other two stances) and ensure that the legs are fully straight right in front of you. This will be your starting position.",
    "As you exhale, pull the machine lever as far as possible to the back of your thighs by flexing at the knees. Keep your torso stationary at all times. Hold the contracted position for a second.",
    "Slowly return to the starting position as you breathe in.",
    "Repeat for the recommended amount of repetitions."
  ],
  "box-squat": [
    "The box squat allows you to squat to desired depth and develop explosive strength in the squat movement. Begin in a power rack with a box at the appropriate height behind you. Typically, you would aim for a box height that brings you to a parallel squat, but you can train higher or lower if desired.",
    "Begin by stepping under the bar and placing it across the back of the shoulders. Squeeze your shoulder blades together and rotate your elbows forward, attempting to bend the bar across your shoulders. Remove the bar from the rack, creating a tight arch in your lower back, and step back into position. Place your feet wider for more emphasis on the back, glutes, adductors, and hamstrings, or closer together for more quad development. Keep your head facing forward.",
    "With your back, shoulders, and core tight, push your knees and butt out and you begin your descent. Sit back with your hips until you are seated on the box. Ideally, your shins should be perpendicular to the ground. Pause when you reach the box, and relax the hip flexors. Never bounce off of a box.",
    "Keeping the weight on your heels and pushing your feet and knees out, drive upward off of the box as you lead the movement with your head. Continue upward, maintaining tightness head to toe."
  ],
  "hip-adduction-machine": [
    "To begin, sit down on the adductor machine and select a weight you are comfortable with. When your legs are positioned properly on the leg pads of the machine, grip the handles on each side. Your entire upper body (from the waist up) should be stationary. This is the starting position.",
    "Slowly press against the machine with your legs to move them towards each other while exhaling.",
    "Feel the contraction for a second and begin to move your legs back to the starting position while breathing in. Note: Remember to keep your upper body stationary and avoid fast jerking motions in order to prevent any injuries from occurring.",
    "Repeat for the recommended amount of repetitions."
  ],
  "step-up-with-knee-raise": [
    "Stand facing a box or bench of an appropriate height with your feet together. This will be your starting position.",
    "Begin the movement by stepping up, putting your left foot on the top of the bench. Extend through the hip and knee of your front leg to stand up on the box. As you stand on the box with your left leg, flex your right knee and hip, bringing your knee as high as you can.",
    "Reverse this motion to step down off the box, and then repeat the sequence on the opposite leg."
  ],
  "ez-bar-curl": [
    "Stand up straight while holding an EZ curl bar at the wide outer handle. The palms of your hands should be facing forward and slightly tilted inward due to the shape of the bar. Keep your elbows close to your torso. This will be your starting position.",
    "Now, while keeping your upper arms stationary, exhale and curl the weights forward while contracting the biceps. Focus on only moving your forearms.",
    "Continue to raise the weight until your biceps are fully contracted and the bar is at shoulder level. Hold the top contracted position for a moment and squeeze the biceps.",
    "Then inhale and slowly lower the bar back to the starting position.",
    "Repeat for the recommended amount of repetitions."
  ],
  "bodyweight-squat": [
    "Stand with your feet shoulder width apart. You can place your hands behind your head. This will be your starting position.",
    "Begin the movement by flexing your knees and hips, sitting back with your hips.",
    "Continue down to full depth if you are able,and quickly reverse the motion until you return to the starting position. As you squat, keep your head and chest up and push your knees out."
  ],
  "stiff-legged-deadlift": [
    "Grasp a couple of dumbbells holding them by your side at arm's length.",
    "Stand with your torso straight and your legs spaced using a shoulder width or narrower stance. The knees should be slightly bent. This is your starting position.",
    "Keeping the knees stationary, lower the dumbbells to over the top of your feet by bending at the waist while keeping your back straight. Keep moving forward as if you were going to pick something from the floor until you feel a stretch on the hamstrings. Exhale as you perform this movement",
    "Start bringing your torso up straight again by extending your hips and waist until you are back at the starting position. Inhale as you perform this movement.",
    "Repeat for the recommended amount of repetitions."
  ],
  "hip-abduction-machine": [
    "To begin, sit down on the abductor machine and select a weight you are comfortable with. When your legs are positioned properly, grip the handles on each side. Your entire upper body (from the waist up) should be stationary. This is the starting position.",
    "Slowly press against the machine with your legs to move them away from each other while exhaling.",
    "Feel the contraction for a second and begin to move your legs back to the starting position while breathing in. Note: Remember to keep your upper body stationary to prevent any injuries from occurring.",
    "Repeat for the recommended amount of repetitions."
  ],
  "concentration-curl": [
    "Sit down on a flat bench with one dumbbell in front of you between your legs. Your legs should be spread with your knees bent and feet on the floor.",
    "Use your right arm to pick the dumbbell up. Place the back of your right upper arm on the top of your inner right thigh. Rotate the palm of your hand until it is facing forward away from your thigh. Tip: Your arm should be extended and the dumbbell should be above the floor. This will be your starting position.",
    "While holding the upper arm stationary, curl the weights forward while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Tip: At the top of the movement make sure that the little finger of your arm is higher than your thumb. This guarantees a good contraction. Hold the contracted position for a second as you squeeze the biceps.",
    "Slowly begin to bring the dumbbells back to starting position as your breathe in. Caution: Avoid swinging motions at any time.",
    "Repeat for the recommended amount of repetitions. Then repeat the movement with the left arm."
  ],
  "cable-hammer-curl": [
    "Attach a rope attachment to a low pulley and stand facing the machine about 12 inches away from it.",
    "Grasp the rope with a neutral (palms-in) grip and stand straight up keeping the natural arch of the back and your torso stationary.",
    "Put your elbows in by your side and keep them there stationary during the entire movement. Tip: Only the forearms should move; not your upper arms. This will be your starting position.",
    "Using your biceps, pull your arms up as you exhale until your biceps touch your forearms. Tip: Remember to keep the elbows in and your upper arms stationary.",
    "After a 1 second contraction where you squeeze your biceps, slowly start to bring the weight back to the original position.",
    "Repeat for the recommended amount of repetitions."
  ],
  "incline-dumbbell-curl": [
    "Sit back on an incline bench with a dumbbell in each hand held at arms length. Keep your elbows close to your torso and rotate the palms of your hands until they are facing forward. This will be your starting position.",
    "While holding the upper arm stationary, curl the weights forward while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second.",
    "Slowly begin to bring the dumbbells back to starting position as your breathe in.",
    "Repeat for the recommended amount of repetitions."
  ],
  "cable-curl": [
    "Place a preacher bench about 2 feet in front of a pulley machine.",
    "Attach a straight bar to the low pulley.",
    "Sit at the preacher bench with your elbow and upper arms firmly on top of the bench pad and have someone hand you the bar from the low pulley.",
    "Grab the bar and fully extend your arms on top of the preacher bench pad. This will be your starting position.",
    "Now start pilling the weight up towards your shoulders and squeeze the biceps hard at the top of the movement. Exhale as you perform this motion. Also, hold for a second at the top.",
    "Now slowly lower the weight to the starting position.",
    "Repeat for the recommended amount of repetitions."
  ],
  "reverse-curl": [
    "Stand up with your torso upright while holding a barbell at shoulder width with the elbows close to the torso. The palm of your hands should be facing down (pronated grip). This will be your starting position.",
    "While holding the upper arms stationary, curl the weights while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second as you squeeze the muscle.",
    "Slowly begin to bring the bar back to starting position as your breathe in.",
    "Repeat for the recommended amount of repetitions."
  ],
  "wrist-curl": [
    "Start out by placing a flat bench in front of a low pulley cable that has a straight bar attachment.",
    "Use your arms to grab the cable bar with a narrow to shoulder width supinated grip (palms up) and bring them up so that your forearms are resting against the top of your thighs. Your wrists should be hanging just beyond your knees.",
    "Start out by curling your wrist upwards and exhaling. Keep the contraction for a second.",
    "Slowly lower your wrists back down to the starting position while inhaling.",
    "Your forearms should be stationary as your wrist is the only movement needed to perform this exercise.",
    "Repeat for the recommended amount of repetitions."
  ],
  "bench-dip": [
    "For this exercise you will need to place a bench behind your back. With the bench perpendicular to your body, and while looking away from it, hold on to the bench on its edge with the hands fully extended, separated at shoulder width. The legs will be extended forward, bent at the waist and perpendicular to your torso. This will be your starting position.",
    "Slowly lower your body as you inhale by bending at the elbows until you lower yourself far enough to where there is an angle slightly smaller than 90 degrees between the upper arm and the forearm. Tip: Keep the elbows as close as possible throughout the movement. Forearms should always be pointing down.",
    "Using your triceps to bring your torso up again, lift yourself back to the starting position.",
    "Repeat for the recommended amount of repetitions."
  ],
  "floor-press": [
    "Adjust the j-hooks so they are at the appropriate height to rack the bar. Begin lying on the floor with your head near the end of a power rack. Keeping your shoulder blades pulled together; pull the bar off of the hooks.",
    "Lower the bar towards the bottom of your chest or upper stomach, squeezing the bar and attempting to pull it apart as you do so. Ensure that you tuck your elbows throughout the movement. Lower the bar until your upper arm contacts the ground and pause, preventing any slamming or bouncing of the weight.",
    "Press the bar back up as fast as you can, keeping the bar, your wrists, and elbows in line as you do so."
  ],
  "reverse-crunch": [
    "Lie on your back on a decline bench and hold on to the top of the bench with both hands. Don't let your body slip down from this position.",
    "Hold your legs parallel to the floor using your abs to hold them there while keeping your knees and feet together. Tip: Your legs should be fully extended with a slight bend on the knee. This will be your starting position.",
    "While exhaling, move your legs towards the torso as you roll your pelvis backwards and you raise your hips off the bench. At the end of this movement your knees will be touching your chest.",
    "Hold the contraction for a second and move your legs back to the starting position while inhaling.",
    "Repeat for the recommended amount of repetitions."
  ],
  "seated-triceps-press": [
    "Sit down on a bench with back support and grasp a dumbbell with both hands and hold it overhead at arm's length. Tip: a better way is to have somebody hand it to you especially if it is very heavy. The resistance should be resting in the palms of your hands with your thumbs around it. The palm of the hand should be facing inward. This will be your starting position.",
    "Keeping your upper arms close to your head (elbows in) and perpendicular to the floor, lower the resistance in a semi-circular motion behind your head until your forearms touch your biceps. Tip: The upper arms should remain stationary and only the forearms should move. Breathe in as you perform this step.",
    "Go back to the starting position by using the triceps to raise the dumbbell. Breathe out as you perform this step.",
    "Repeat for the recommended amount of repetitions."
  ],
  "dips-triceps": [
    "To get into the starting position, hold your body at arm's length with your arms nearly locked above the bars.",
    "Now, inhale and slowly lower yourself downward. Your torso should remain upright and your elbows should stay close to your body. This helps to better focus on tricep involvement. Lower yourself until there is a 90 degree angle formed between the upper arm and forearm.",
    "Then, exhale and push your torso back up using your triceps to bring your body back to the starting position.",
    "Repeat the movement for the prescribed amount of repetitions."
  ],
  "triceps-kickback": [
    "Start with a dumbbell in each hand and your palms facing your torso. Keep your back straight with a slight bend in the knees and bend forward at the waist. Your torso should be almost parallel to the floor. Make sure to keep your head up. Your upper arms should be close to your torso and parallel to the floor. Your forearms should be pointed towards the floor as you hold the weights. There should be a 90-degree angle formed between your forearm and upper arm. This is your starting position.",
    "Now, while keeping your upper arms stationary, exhale and use your triceps to lift the weights until the arm is fully extended. Focus on moving the forearm.",
    "After a brief pause at the top contraction, inhale and slowly lower the dumbbells back down to the starting position.",
    "Repeat the movement for the prescribed amount of repetitions."
  ],
  "side-plank": [
    "Lie on your side with your legs straight and prop yourself up on your forearm, elbow directly under your shoulder.",
    "Stack your feet and lift your hips so your body forms a straight line from head to feet.",
    "Brace your core and hold, keeping your hips high without letting them sag.",
    "Hold for the set time, then switch sides."
  ],
  "cross-body-crunch": [
    "Lie flat on your back and bend your knees about 60 degrees.",
    "Keep your feet flat on the floor and place your hands loosely behind your head. This will be your starting position.",
    "Now curl up and bring your right elbow and shoulder across your body while bring your left knee in toward your left shoulder at the same time. Reach with your elbow and try to touch your knee. Exhale as you perform this movement. Tip: Try to bring your shoulder up towards your knee rather than just your elbow and remember that the key is to contract the abs as you perform the movement; not just to move the elbow.",
    "Now go back down to the starting position as you inhale and repeat with the left elbow and the right knee.",
    "Continue alternating in this manner until all prescribed repetitions are done."
  ],
  "lying-leg-raise": [
    "Lie on your back on a mat with your legs straight and your arms by your sides or lightly under your hips for support.",
    "Brace your abs and press your lower back gently toward the floor.",
    "Keeping your legs mostly straight, raise them until your hips are flexed and your feet point upward.",
    "Lower your legs slowly under control, stopping before your lower back arches off the floor.",
    "Repeat for the prescribed reps with steady breathing and controlled movement."
  ],
  "v-up": [
    "Lie flat on the floor (or exercise mat) on your back with your arms extended straight back behind your head and your legs extended also. This will be your starting position.",
    "As you exhale, bend at the waist while simultaneously raising your legs and arms to meet in a jackknife position. Tip: The legs should be extended and lifted at approximately a 35-45 degree angle from the floor and the arms should be extended and parallel to your legs. The upper torso should be off the floor.",
    "While inhaling, lower your arms and legs back to the starting position.",
    "Repeat for the recommended amount of repetitions."
  ],
  "flutter-kicks": [
    "On a flat bench lie facedown with the hips on the edge of the bench, the legs straight with toes high off the floor and with the arms on top of the bench holding on to the front edge.",
    "Squeeze your glutes and hamstrings and straighten the legs until they are level with the hips. This will be your starting position.",
    "Start the movement by lifting the left leg higher than the right leg.",
    "Then lower the left leg as you lift the right leg.",
    "Continue alternating in this manner (as though you are doing a flutter kick in water) until you have done the recommended amount of repetitions for each leg. Make sure that you keep a controlled movement at all times. Tip: You will breathe normally as you perform this movement."
  ],
  "bicycle-crunch": [
    "Lie flat on the floor with your lower back pressed to the ground. For this exercise, you will need to put your hands beside your head. Be careful however to not strain with the neck as you perform it. Now lift your shoulders into the crunch position.",
    "Bring knees up to where they are perpendicular to the floor, with your lower legs parallel to the floor. This will be your starting position.",
    "Now simultaneously, slowly go through a cycle pedal motion kicking forward with the right leg and bringing in the knee of the left leg. Bring your right elbow close to your left knee by crunching to the side, as you breathe out.",
    "Go back to the initial position as you breathe in.",
    "Crunch to the opposite side as you cycle your legs and bring closer your left elbow to your right knee and exhale.",
    "Continue alternating in this manner until all of the recommended repetitions for each side have been completed."
  ],
  "ab-rollout": [
    "Hold the Ab Roller with both hands and kneel on the floor.",
    "Now place the ab roller on the floor in front of you so that you are on all your hands and knees (as in a kneeling push up position). This will be your starting position.",
    "Slowly roll the ab roller straight forward, stretching your body into a straight position. Tip: Go down as far as you can without touching the floor with your body. Breathe in during this portion of the movement.",
    "After a pause at the stretched position, start pulling yourself back to the starting position as you breathe out. Tip: Go slowly and keep your abs tight at all times."
  ],
  "decline-crunch": [
    "Secure your legs at the end of the decline bench and lie down.",
    "Now place your hands lightly on either side of your head keeping your elbows in. Tip: Don't lock your fingers behind your head.",
    "While pushing the small of your back down in the bench to better isolate your abdominal muscles, begin to roll your shoulders off it.",
    "Continue to push down as hard as you can with your lower back as you contract your abdominals and exhale. Your shoulders should come up off the bench only about four inches, and your lower back should remain on the bench. At the top of the movement, contract your abdominals hard and keep the contraction for a second. Tip: Focus on slow, controlled movement - don't cheat yourself by using momentum.",
    "After the one second contraction, begin to come down slowly again to the starting position as you inhale.",
    "Repeat for the recommended amount of repetitions."
  ],
  "dead-bug": [
    "Begin lying on your back with your hands extended above you toward the ceiling.",
    "Bring your feet, knees, and hips up to 90 degrees.",
    "Exhale hard to bring your ribcage down and flatten your back onto the floor, rotating your pelvis up and squeezing your glutes. Hold this position throughout the movement. This will be your starting position.",
    "Initiate the exercise by extending one leg, straightening the knee and hip to bring the leg just above the ground.",
    "Maintain the position of your lumbar and pelvis as you perform the movement, as your back is going to want to arch.",
    "Stay tight and return the working leg to the starting position.",
    "Repeat on the opposite side. Count one rep as right leg plus left leg, then continue alternating until the set is complete."
  ],
  "hip-raise": [
    "Lay flat on the floor with your arms next to your sides.",
    "Now bend your knees at around a 75 degree angle and lift your feet off the floor by around 2 inches.",
    "Using your lower abs, bring your knees in towards you as you maintain the 75 degree angle bend in your legs. Continue this movement until you raise your hips off of the floor by rolling your pelvis backward. Breathe out as you perform this portion of the movement. Tip: At the end of the movement your knees will be over your chest.",
    "Squeeze your abs at the top of the movement for a second and then return to the starting position slowly as you breathe in. Tip: Maintain a controlled motion at all times.",
    "Repeat for the recommended amount of repetitions."
  ],
  "oblique-crunch": [
    "Lie flat on the floor with your lower back pressed to the ground. For this exercise, you will need to put one hand beside your head and the other to the side against the floor.",
    "Make sure your feet are elevated and resting on a flat surface.",
    "Now lift the shoulder in which your hand is touching your head.",
    "Simply elevate your shoulder and body upward until you touch your knee. For example, if you have your right hand besides your head, then you want to elevate your body upwards until your right elbow touches your left knee. The same variation can be applied doing the inverse and using your left elbow to touch your right knee.",
    "After your knee touches your elbow, lower your body until you have reached the starting position.",
    "Remember to breathe in during the eccentric (lowering) part of the exercise and to breathe out during the concentric (upward) part of the exercise.",
    "Continue alternating in this manner until all of the recommended repetitions for each side have been completed."
  ],
  "cable-woodchopper": [
    "Connect a standard handle to a tower, and move the cable to the highest pulley position.",
    "With your side to the cable, grab the handle with one hand and step away from the tower. You should be approximately arm's length away from the pulley, with the tension of the weight on the cable. Your outstretched arm should be aligned with the cable.",
    "With your feet positioned shoulder width apart, reach upward with your other hand and grab the handle with both hands. Your arms should still be fully extended.",
    "In one motion, pull the handle down and across your body to your front knee while rotating your torso.",
    "Keep your back and arms straight and core tight while you pivot your back foot and bend your knees to get a full range of motion.",
    "Maintain your stance and straight arms. Return to the neutral position in a slow and controlled manner.",
    "Repeat to failure.",
    "Then, reposition and repeat the same series of movements on the opposite side."
  ],
  "jump-rope": [
    "Hold an end of the rope in each hand. Position the rope behind you on the ground. Raise your arms up and turn the rope over your head bringing it down in front of you. When it reaches the ground, jump over it. Find a good turning pace that can be maintained. Different speeds and techniques can be used to introduce variation.",
    "Rope jumping is exciting, challenges your coordination, and requires a lot of energy. A 150 lb person will burn about 350 calories jumping rope for 30 minutes, compared to over 450 calories running."
  ],
  "broad-jump": [
    "This drill is best done in sand or other soft landing surface. Ensure that you are able to measure distance. Stand in a partial squat stance with feet shoulder width apart.",
    "Utilizing a big arm swing and a countermovement of the legs, jump forward as far as you can.",
    "Attempt to land with your feet out in front you, reaching as far as possible with your legs.",
    "Measure the distance from your landing point to the starting point and track results."
  ],
  "stationary-bike": [
    "To begin, seat yourself on the bike and adjust the seat to your height.",
    "Select the desired option from the menu. You may have to start pedaling to turn it on. You can use the manual setting, or you can select a program to use. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. The level of resistance can be changed throughout the workout. The handles can be used to monitor your heart rate to help you stay at an appropriate intensity."
  ],
  "squat-jump": [
    "Cross your arms over your chest.",
    "With your head up and your back straight, position your feet at shoulder width.",
    "Keeping your back straight and chest up, squat down as you inhale until your upper thighs are parallel, or lower, to the floor.",
    "Now pressing mainly with the ball of your feet, jump straight up in the air as high as possible, using the thighs like springs. Exhale during this portion of the movement.",
    "When you touch the floor again, immediately squat down and jump again.",
    "Repeat for the recommended amount of repetitions."
  ],
  "rowing-machine": [
    "To begin, seat yourself on the rower. Make sure that your heels are resting comfortably against the base of the foot pedals and that the straps are secured. Select the program that you wish to use, if applicable. Sit up straight and bend forward at the hips.",
    "There are three phases of movement when using a rower. The first phase is when you come forward on the rower. Your knees are bent and against your chest. Your upper body is leaning slightly forward while still maintaining good posture. Next, push against the foot pedals and extend your legs while bringing your hands to your upper abdominal area, squeezing your shoulders back as you do so. To avoid straining your back, use primarily your leg and hip muscles.",
    "The recovery phase simply involves straightening your arms, bending the knees, and bringing your body forward again as you transition back into the first phase."
  ],
  "treadmill-run": [
    "To begin, step onto the treadmill and select the desired option from the menu. Most treadmills have a manual setting, or you can select a program to run. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. Elevation can be adjusted to change the intensity of the workout.",
    "Treadmills offer convenience, cardiovascular benefits, and usually have less impact than running outside. A 150 lb person will burn over 450 calories running 8 miles per hour for 30 minutes. Maintain proper posture as you run, and only hold onto the handles when necessary, such as when dismounting or checking your heart rate."
  ],
  "skater-jump": [
    "Assume a half squat position facing 90 degrees from your direction of travel. This will be your starting position.",
    "Allow your lead leg to do a countermovement inward as you shift your weight to the outside leg.",
    "Immediately push off and extend, attempting to bound to the side as far as possible.",
    "Upon landing, immediately push off in the opposite direction, returning to your original start position.",
    "Continue back and forth for several repetitions."
  ],
  "chest-supported-row": [
    "With a dumbbell in each hand (palms facing your torso), bend your knees slightly and bring your torso forward by bending at the waist; as you bend make sure to keep your back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The weights should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position.",
    "While keeping the torso stationary, lift the dumbbells to your side (as you breathe out), keeping the elbows close to the body (do not exert any force with the forearm other than holding the weights). On the top contracted position, squeeze the back muscles and hold for a second.",
    "Slowly lower the weight again to the starting position as you inhale.",
    "Repeat for the recommended amount of repetitions."
  ],
  "renegade-row": [
    "Place two kettlebells on the floor about shoulder width apart. Position yourself on your toes and your hands as though you were doing a pushup, with the body straight and extended. Use the handles of the kettlebells to support your upper body. You may need to position your feet wide for support.",
    "Push one kettlebell into the floor and row the other kettlebell, retracting the shoulder blade of the working side as you flex the elbow, pulling it to your side.",
    "Then lower the kettlebell to the floor and begin the kettlebell in the opposite hand. Repeat for several reps."
  ],
  "zottman-curl": [
    "Stand up with your torso upright and a dumbbell in each hand being held at arms length. The elbows should be close to the torso.",
    "Make sure the palms of the hands are facing each other. This will be your starting position.",
    "While holding the upper arm stationary, curl the weights while contracting the biceps as you breathe out. Only the forearms should move. Your wrist should rotate so that you have a supinated (palms up) grip. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level.",
    "Hold the contracted position for a second as you squeeze the biceps.",
    "Now during the contracted position, rotate your wrist until you now have a pronated (palms facing down) grip with the thumb at a higher position than the pinky.",
    "Slowly begin to bring the dumbbells back down using the pronated grip.",
    "As the dumbbells close your thighs, start rotating the wrist so that you go back to a neutral (palms facing your body) grip.",
    "Repeat for the recommended amount of repetitions."
  ],
  "tuck-jump": [
    "Begin in a comfortable standing position with your knees slightly bent. Hold your hands in front of you, palms down with your fingertips together at chest height. This will be your starting position.",
    "Rapidly dip down into a quarter squat and immediately explode upward. Drive the knees towards the chest, attempting to touch them to the palms of the hands.",
    "Jump as high as you can, raising your knees up, and then ensure a good land be re-extending your legs, absorbing impact through be allowing the knees to rebend."
  ],
  "plyo-push-up": [
    "Move into a prone position on the floor, supporting your weight on your hands and toes.",
    "Your arms should be fully extended with the hands around shoulder width. Keep your body straight throughout the movement. This will be your starting position.",
    "Descend by flexing at the elbow, lowering your chest towards the ground.",
    "At the bottom, reverse the motion by pushing yourself up through elbow extension as quickly as possible. Attempt to push your upper body up until your hands leave the ground.",
    "Return to the starting position and repeat the exercise.",
    "For added difficulty, add claps into the movement while you are air borne."
  ],
  "sissy-squat": [
    "Standing upright, with feet at shoulder width and toes raised, use one hand to hold onto the beams of a squat rack and the opposite arm to hold a plate on top of your chest. This is your starting position.",
    "As you use one arm to hold yourself, bend at the knees and slowly lower your torso toward the ground by bringing your pelvis and knees forward. Inhale as you go down and stop when your upper and lower legs almost create a 90-degree angle. Hold the stretch position for a second.",
    "After your one second hold, use your thigh muscles to bring your torso back up to the starting position. Exhale as you move up.",
    "Repeat for the recommended amount of times."
  ],
  "seated-calf-raise": [
    "Adjust the seat so that your legs are only slightly bent in the start position. The balls of your feet should be firmly on the platform.",
    "Select an appropriate weight, and grasp the handles. This will be your starting position.",
    "Straighten the legs by extending the knees, just barely lifting the weight from the stack. Your ankle should be fully flexed, toes pointing up. Execute the movement by pressing downward through the balls of your feet as far as possible.",
    "After a brief pause, reverse the motion and repeat."
  ],
  "standing-cable-curl": [
    "Stand up with your torso upright while holding a cable curl bar that is attached to a low pulley. Grab the cable bar at shoulder width and keep the elbows close to the torso. The palm of your hands should be facing up (supinated grip). This will be your starting position.",
    "While holding the upper arms stationary, curl the weights while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second as you squeeze the muscle.",
    "Slowly begin to bring the curl bar back to starting position as your breathe in.",
    "Repeat for the recommended amount of repetitions."
  ],
  "spider-curl": [
    "Start out by setting the bar on the part of the preacher bench that you would normally sit on. Make sure to align the barbell properly so that it is balanced and will not fall off.",
    "Move to the front side of the preacher bench (the part where the arms usually lay) and position yourself to lay at a 45 degree slant with your torso and stomach pressed against the front side of the preacher bench.",
    "Make sure that your feet (especially the toes) are well positioned on the floor and place your upper arms on top of the pad located on the inside part of the preacher bench.",
    "Use your arms to grab the barbell with a supinated grip (palms facing up) at about shoulder width apart or slightly closer from each other.",
    "Slowly begin to lift the barbell upwards and exhale. Hold the contracted position for a second as you squeeze the biceps.",
    "Slowly begin to bring the barbell back to the starting position as your breathe in. .",
    "Repeat for the recommended amount of repetitions."
  ],
  "donkey-calf-raise": [
    "For this exercise you will need access to a donkey calf raise machine. Start by positioning your lower back and hips under the padded lever provided. The tailbone area should be the one making contact with the pad.",
    "Place both of your arms on the side handles and place the balls of your feet on the calf block with the heels extending off. Align the toes forward, inward or outward, depending on the area you wish to target, and straighten the knees without locking them. This will be your starting position.",
    "Raise your heels as you breathe out by extending your ankles as high as possible and flexing your calf. Ensure that the knee is kept stationary at all times. There should be no bending at any time. Hold the contracted position by a second before you start to go back down.",
    "Go back slowly to the starting position as you breathe in by lowering your heels as you bend the ankles until calves are stretched.",
    "Repeat for the recommended amount of repetitions."
  ],
  "barbell-front-raise": [
    "To begin, stand straight with a barbell in your hands. You should grip the bar with palms facing down and a closer than shoulder width grip apart from each other.",
    "Your feet should be shoulder width apart from each other. Your elbows should be slightly bent. This is the starting position.",
    "Lift the barbell up until it is directly over your head while exhaling. Make sure to keep your elbows slightly bent when performing each repetition.",
    "Once you feel the contraction, begin to lower the barbell back down to the starting position as you inhale.",
    "Repeat for the recommended amount of repetitions."
  ],
  "superman": [
    "To begin, lie straight and face down on the floor or exercise mat. Your arms should be fully extended in front of you. This is the starting position.",
    "Simultaneously raise your arms, legs, and chest off of the floor and hold this contraction for 2 seconds. Tip: Squeeze your lower back to get the best results from this exercise. Remember to exhale during this movement. Note: When holding the contracted position, you should look like superman when he is flying.",
    "Slowly begin to lower your arms, legs and chest back down to the starting position while inhaling.",
    "Repeat for the recommended amount of repetitions prescribed in your program."
  ],
  "wide-grip-push-up": [
    "With your hands wide apart, support your body on your toes and hands in a plank position. Your elbows should be extended and your body straight. Do not allow your hips to sag. This will be your starting position.",
    "To begin, allow the elbows to flex, lowering your chest to the floor as you inhale.",
    "Using your pectoral muscles, press your upper body back up to the starting position by extending the elbows. Exhale as you perform this step.",
    "After pausing at the contracted position, repeat the movement for the prescribed amount of repetitions."
  ],
  "decline-push-up": [
    "Lie on the floor face down and place your hands about 36 inches apart from each other holding your torso up at arms length.",
    "Place your toes on top of a flat bench. This will allow your body to be elevated. Note: The higher the elevation of the flat bench, the higher the resistance of the exercise is.",
    "Lower yourself until your chest almost touches the floor as you inhale.",
    "Using your pectoral muscles, press your upper body back up to the starting position and squeeze your chest. Breathe out as you perform this step.",
    "After a second pause at the contracted position, repeat the movement for the prescribed amount of repetitions."
  ],
  "seated-leg-tuck": [
    "Sit on a bench with the legs stretched out in front of you slightly below parallel and your arms holding on to the sides of the bench. Your torso should be leaning backwards around a 45-degree angle from the bench. This will be your starting position.",
    "Bring the knees in toward you as you move your torso closer to them at the same time. Breathe out as you perform this movement.",
    "After a second pause, go back to the starting position as you inhale.",
    "Repeat for the recommended amount of repetitions."
  ],
  "incline-cable-fly": [
    "To get yourself into the starting position, set the pulleys at the floor level (lowest level possible on the machine that is below your torso).",
    "Place an incline bench (set at 45 degrees) in between the pulleys, select a weight on each one and grab a pulley on each hand.",
    "With a handle on each hand, lie on the incline bench and bring your hands together at arms length in front of your face. This will be your starting position.",
    "With a slight bend of your elbows (in order to prevent stress at the biceps tendon), lower your arms out at both sides in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms should remain stationary. The movement should only occur at the shoulder joint.",
    "Return your arms back to the starting position as you squeeze your chest muscles and exhale. Hold the contracted position for a second. Tip: Make sure to use the same arc of motion used to lower the weights.",
    "Repeat the movement for the prescribed amount of repetitions."
  ],
};
// <<< EXERCISE_INSTRUCTIONS <<<

// >>> MUSCLE_FIGURES (generated by mockups/MuscleGroups/sync-muscle-figures.mjs) >>>
// Shared front+back body outline (identical across all 10 source SVGs, so one
// canonical copy is kept) plus one independently-togglable lime fill-path
// group per figure group. See buildMuscleFigure() for how these compose into
// the per-exercise badge and the weekly heat-map card.
const MUSCLE_FIGURE_VIEWBOX = "0 0 579.9 528";
const MUSCLE_FIGURE_OUTLINE = "<g>\n      <g>\n        <path class=\"st1\" d=\"M133,110.9c-1.9-1.9-3.7-4-5.2-6.1-8.8-12.3-11.1-26.2-11.1-26.2.2-2.5,0-9.8-.3-14.9,1.5,1.7,3.5,3.4,5.4,4.9h0c3.4,7.5,9.2,22.8,11.2,42.3Z\"/>\n        <path class=\"st1\" d=\"M127.8,104.8h-34.5c-.1-2.4-.6-4.9-1.5-7.4,4-1.5,25-18.8,25-18.8,0,0,2.3,13.9,11.1,26.2Z\"/>\n        <path class=\"st1\" d=\"M78.3,134.2c-7,6.3-14.8,10.7-19.6,12.3,0,0-3.6-15.5,3.1-31.3,6.7-15.8,26-16.3,30-17.8.9,2.5,1.4,5,1.5,7.4.7,11.5-6.6,21.9-15.1,29.5Z\"/>\n        <path class=\"st1\" d=\"M54,196.8c-1.8,3.6-3.1,7.6-4.2,11.8-1.1,1.1-2,2.2-2.6,3.2-4,7.3-10.2,22.6-17.5,34-1.5-.4-3-.6-4.6-.5,8.7-19.2,9.3-26.9,12.1-37.8,4.6-18,15.4-25.3,15.4-25.3,1.3,8.4,1.5,14.7,1.5,14.7Z\"/>\n        <path class=\"st1\" d=\"M78.3,134.2s-.9,19.5-2.1,27.3c-.3,2.3-1.2,4.9-2.4,7.6h0c-2.8,6.2-7.6,12.8-12.6,17.6-1.4,1.3-2.6,2.7-3.7,4.3-1.3,1.8-2.4,3.7-3.4,5.8,0,0-.2-6.3-1.5-14.7l-.7-14.7c-1.4-14.3,6.9-20.9,6.9-20.9,4.8-1.6,12.6-6,19.6-12.3Z\"/>\n        <path class=\"st1\" d=\"M109.4,389.8c-8.4,11.7-16.6,20.1-15.5,43,.9,19,2.5,35,6.2,47.6.3,3.5.7,6.8,1.2,9.4,2.1,11.1.8,14.4-5.9,20.6-6.7,6.3-2.5,9.5-7.7,13.3s-11.3,3.6-14.2,2.6c-2.9-1-9.3,1-12.1-2-2.9-3,3.5-8.2,6.4-11.9,2.9-3.7,11.5-17,11.5-17,.7-3.4.9-9.3.9-15.3,8.4-24,6.6-67.9,5.7-96.9,4.5,4.9,14.9,1.1,14.9,1.1,7-6.1,1-19.8,1-19.8,6-1.1,9.3-9,10.7-13.5.4,8.1,1,15.8,2,22.1-1.7,10.8-5.1,16.5-5.1,16.5Z\"/>\n        <path class=\"st1\" d=\"M130.5,281.3c-.1,28.3-4,39.6-9,52.6-1.4,3.6-2.5,7.2-3.3,10.5-.5-7.8-.8-16.8-.5-23.9.8-16.3-3.3-29.2-5.3-35.2,0,0,0-.2-.2-.6-1.2-4.8,2.4-10.7,6.8-15.1.1,0,.2.2.3.3,6.4,6.3,11.3,11.3,11.3,11.6Z\"/>\n        <path class=\"st1\" d=\"M118.2,344.3h0c-2.2,8.5-2.7,14.9-2.7,14.9,0,5.4-.3,10.1-1,14.1-1-6.3-1.6-14-2-22.1-.9-17.9-.9-37.6-3.1-47.2-.2-.7-.3-1.3-.5-2.1-2.9-13.4-6.2-34.6-5.3-47.7,1.1,1.1,2.3,2.3,3.5,3.5.1.1.3.3.4.4-.2,11.2,3.7,23.6,4.6,26.4.1.4.2.6.2.6,2.1,6,6.1,18.9,5.3,35.2-.3,7.1,0,16.1.5,23.9Z\"/>\n        <path class=\"st1\" d=\"M133.1,111.1s0,0-.1-.1c-2-19.5-7.8-34.8-11.2-42.3,1.7,1.4,3.4,2.6,4.5,3.4,1,.7,2.3,1.1,3.5,1.1h3.3c0,11.9,0,24.8,0,37.9Z\"/>\n        <path class=\"st1\" d=\"M133.2,174h0v-27.5c0,0-15.3,9.7-15.3,9.7,0,0-6.1.1-14.7,0-2.3,0-4.2-.2-5.9-.7-4.4-1.2-7.4-5.6-11.9-14.1,0,0,0,0,0,0-1.4-4.5-7-7.1-7-7.1,8.4-7.6,15.7-18,15.1-29.5h34.5c1.5,2.1,3.2,4.2,5.2,6.1,0,0,0,0,.1.1,0,20.7,0,42.3,0,62.9Z\"/>\n        <path class=\"st1\" d=\"M113,196.7c-8-.8-16.7-10.6-19.4-13.6-2.5-2.9-2.1-9.4-6.7-13.5h0c-.9-6.9-1.4-12-1.4-12,0,0,0-3.1,0-6.8.9,9,6.5,14,6.5,14,1.5,7.9,9.5,15.9,15.9,18.8h0c0,7.3.3,12.6,5,13.2Z\"/>\n        <path class=\"st1\" d=\"M101.3,449.4c-2.1,5.8-2.2,19.8-1.2,31-3.6-12.6-5.2-28.6-6.2-47.6-1.1-23,7.1-31.3,15.5-43,4.2,33.7-5.4,52-8.1,59.6Z\"/>\n        <path class=\"st1\" d=\"M80.2,480.3c0-9.7-.7-19.6-.7-19.6-7.7-49.2-2.6-65.9.6-76,.7-2.1,1.1-4.6,1.4-7.3l3.4,4.7c.3.5.6,1,1,1.4.9,28.9,2.7,72.9-5.7,96.9Z\"/>\n        <path class=\"st1\" d=\"M100.8,384.6s-10.4,3.8-14.9-1.1c-.4-.4-.7-.8-1-1.4l-3.4-4.7c1.2-10,0-21.9,0-21.9-12.9-75,9.6-113.6,9.6-113.6,0,0,3,3,7.4,7.3-13.4,20.1-20.2,33.6-20.2,46.9s7.1,41.1,11,57.2c.6,2.7,1.2,5,1.6,6.7.4,1.6,2.5,2.1,3.6.9,2.1-2.3,4.7-6.3,5.9-12.8-.4,4.3-.2,10.2,1.5,16.7,0,0,6,13.7-1,19.8Z\"/>\n        <path class=\"st1\" d=\"M85.6,150.6h0c0,3.8,0,6.9,0,6.9,0,0-1.4,10.7-4.9,14.8-2.9,3.4-5.5,11.2-6.3,13.8,0,0-.6-7.7-.6-17h0c1.2-2.7,2.1-5.3,2.4-7.6,1.2-7.8,2.1-27.3,2.1-27.3,0,0,5.6,2.6,7,7.1,0,0,0,0,0,0,.2.6.3,1.2.3,1.9,0,2.2,0,4.9,0,7.3Z\"/>\n        <path class=\"st1\" d=\"M40.9,251.5s-.3,10.9-1.7,14.5c-1.4,3.6-4,4.4-5.3,10.1-1.1,4.6-3.8,12.2-4.9,15-.2.7-.9,1.1-1.6,1.1-1,0-1.8-.9-1.7-1.9l2.5-16.9-6.7,19.5c-.3.9-1.1,1.4-1.9,1.4s-.3,0-.5,0c-1.1-.3-1.8-1.4-1.4-2.5l5.5-19.8-11.1,17.9c-.5.8-1.3,1.2-2.2,1.2s-1-.1-1.4-.4c-1.1-.7-1.4-2.1-.8-3.3l9.1-17.3-11.2,15.8c-.5.7-1.2,1-2,1s-1.1-.2-1.6-.6c-.9-.8-1.1-2.1-.5-3.1l13.9-22.3c-1.6.8-3.2,2-5.7,3.1-3,1.4-5,.4-6.2-.6-.7-.6-.8-1.6-.3-2.3,1.4-1.9,4.5-5.9,8.9-9.8,6-5.2,13-6.1,13-6.1,1.6,0,3.2.2,4.6.5,1.6.4,3.2,1,4.6,1.6,4,1.8,6.6,4.2,6.6,4.2Z\"/>\n        <path class=\"st1\" d=\"M72.8,195.2c-1.3,6.6-3,12-4.9,16.5-7.1,5.1-14.6,11.4-17,24.9t0,0c-4.9,6.8-10,14.9-10,14.9,0,0-2.7-2.3-6.6-4.2,2-2.3,5.6-6.9,11.5-15.9,8.1-12.4,19.1-28.5,27-36.2Z\"/>\n        <path class=\"st1\" d=\"M73,193.7c0,.5-.2,1-.3,1.5h0c-7.9,7.7-18.9,23.8-27,36.2-5.9,9-9.5,13.6-11.5,15.9-1.4-.6-2.9-1.2-4.6-1.6,7.3-11.4,13.5-26.7,17.5-34,.6-1,1.5-2.1,2.6-3.2,5.6-5.4,17-11.6,23.2-14.8Z\"/>\n        <path class=\"st1\" d=\"M74.3,186.1c-.2.5-.3.9-.3.9-.3,2.4-.6,4.6-1,6.7-6.3,3.2-17.7,9.4-23.2,14.8,1.1-4.2,2.4-8.2,4.2-11.8,1-2.1,2.1-4,3.4-5.8,5.4-.9,16.9-4.9,16.9-4.9Z\"/>\n        <path class=\"st1\" d=\"M67.9,211.7c-3.9,9.3-8.6,14.8-12,18.5-1.5,1.7-3.2,3.9-5,6.4,2.4-13.4,9.9-19.8,17-24.9Z\"/>\n        <path class=\"st1\" d=\"M108,208.2c0,1.6,0,3,.2,4.2-4.2-3.7-6.9-10.6-10.5-16.2-3.2-5.1-4-6.8-7.8-6.1-1.1-6.6-2.1-14.3-2.9-20.6,4.6,4.1,4.1,10.6,6.7,13.5,2.6,3,11.3,12.8,19.4,13.6.3,0,.5,0,.8,0-1.3,0-5.8.8-5.8,11.5Z\"/>\n        <path class=\"st1\" d=\"M109.3,225.4c0,2.1,1.8,7.5,4.3,13.7-6.5-2.4-14.9-14.2-21.5-37.4-.7-2.8-1.5-7-2.3-11.7,3.8-.7,4.6,1.1,7.8,6.1,3.6,5.7,6.3,12.6,10.5,16.2.8,6.8,3.7,7.1,6.1,7-1.8.2-5,1.2-5,6Z\"/>\n        <path class=\"st1\" d=\"M74.3,186.1s-11.5,4-16.9,4.9c1.1-1.6,2.4-3,3.7-4.3,5-4.8,9.8-11.4,12.6-17.6,0,9.3.6,17,.6,17Z\"/>\n        <path class=\"st1\" d=\"M133.1,196.8h-19c-.1,0-.2,0-.4,0-.3,0-.5,0-.8,0-4.7-.7-5-5.9-5-13.2v-.7c0-8.2,4.4-8.8,4.4-8.8h20.7v22.8Z\"/>\n        <path class=\"st1\" d=\"M133.2,219.4h-17.7s-.5,0-1.1,0c0,0,0,0,0,0-2.4,0-5.3-.3-6.1-7-.1-1.2-.2-2.6-.2-4.2,0-10.7,4.4-11.5,5.8-11.5.1,0,.2,0,.4,0h19v22.7Z\"/>\n        <path class=\"st1\" d=\"M133.3,269.3h-3.7c-1.6,0-3.1-.9-3.8-2.4-2.4-5.1-8.1-17.6-12.1-27.7-2.5-6.2-4.3-11.6-4.3-13.7,0-4.8,3.2-5.8,5-6,0,0,0,0,0,0,.4,0,.8,0,1.1,0h17.7v17.9s0,12.6,0,12.6c0,7.7,0,14.3,0,19.4Z\"/>\n        <path class=\"st1\" d=\"M109,301.9c-1.6,7.8-6.1,29.7-8,41.3-.3,1.2-.5,2.8-.7,4.7,0,0,0,0,0,0-1.2,6.4-3.8,10.5-5.9,12.8-1.1,1.3-3.2.8-3.6-.9-.4-1.7-1-4-1.6-6.7-3.9-16.2-11-47.1-11-57.2s6.9-26.8,20.2-46.9c1.6,1.5,3.3,3.3,5.2,5.1-.8,13.1,2.4,34.3,5.3,47.7Z\"/>\n        <path class=\"st1\" d=\"M112.2,284.6c-1-2.9-4.9-15.3-4.6-26.4,3.8,3.8,7.8,7.7,11.4,11.3-4.4,4.4-7.9,10.4-6.8,15.1Z\"/>\n        <path class=\"st1\" d=\"M112.6,351.2c-1.4,4.6-4.8,12.4-10.7,13.5-1.8-6.5-1.9-12.4-1.5-16.7,0,0,0,0,0,0,0-.5.2-1,.2-1.5.1-1,.3-2,.5-3.2,1.9-11.7,6.3-33.5,8-41.3.2.7.3,1.4.5,2.1,2.2,9.6,2.2,29.3,3.1,47.2Z\"/>\n        <path class=\"st1\" d=\"M99.3,167c-.4,0-.7,0-1.1,0-.9,0-2.6-.3-6.1-2.2,0,0-5.6-5-6.5-14h0c0-2.5,0-5.2,0-7.4,0-.7-.1-1.3-.3-1.9,4.5,8.5,7.5,12.8,11.9,14.1.2,3.9,1.4,8.8,2.2,11.5Z\"/>\n        <path class=\"st1\" d=\"M133.1,174h-20.7c-2.1,0-3.2-1.6-3.8-3.2-.6-1.7-.6-3.4-.6-3.4,0-6.9,9.8-11.2,9.8-11.2l15.2-9.7v27.5Z\"/>\n        <path class=\"st1\" d=\"M112.4,174s-4.4.6-4.4,8.8v.7c-6.4-2.9-14.3-10.8-15.9-18.8,3.5,2,5.3,2.3,6.1,2.2.4,0,.7,0,1.1,0,.5,0,.9.3,1.3.5,1.8.9,4.9,2.4,7.9,3.3.6,1.6,1.7,3.2,3.8,3.2Z\"/>\n        <path class=\"st1\" d=\"M108,167.4s0,1.7.6,3.4c-3.1-.9-6.1-2.4-7.9-3.3-.4-.2-.9-.4-1.3-.5-.8-2.7-2-7.6-2.2-11.5,1.6.5,3.5.7,5.9.7,8.6.1,14.7,0,14.7,0,0,0-9.8,4.3-9.8,11.2Z\"/>\n      </g>\n      <g>\n        <path class=\"st1\" d=\"M149.9,78.6s-2.3,13.9-11.1,26.2c-1.5,2.1-3.2,4.2-5.2,6.1,2-19.5,7.8-34.8,11.2-42.3h0c1.9-1.5,3.8-3.2,5.4-4.9-.3,5.1-.6,12.4-.3,14.9Z\"/>\n        <path class=\"st1\" d=\"M138.8,104.8h34.5c.1-2.4.6-4.9,1.5-7.4-4-1.5-25-18.8-25-18.8,0,0-2.3,13.9-11.1,26.2Z\"/>\n        <path class=\"st1\" d=\"M188.4,134.2c7,6.3,14.8,10.7,19.6,12.3,0,0,3.6-15.5-3.1-31.3-6.7-15.8-26-16.3-30-17.8-.9,2.5-1.4,5-1.5,7.4-.7,11.5,6.6,21.9,15.1,29.5Z\"/>\n        <path class=\"st1\" d=\"M212.6,196.8c1.8,3.6,3.1,7.6,4.2,11.8,1.1,1.1,2,2.2,2.6,3.2,4,7.3,10.2,22.6,17.5,34,1.5-.4,3-.6,4.6-.5-8.7-19.2-9.3-26.9-12.1-37.8-4.6-18-15.4-25.3-15.4-25.3-1.3,8.4-1.5,14.7-1.5,14.7Z\"/>\n        <path class=\"st1\" d=\"M188.4,134.2s.9,19.5,2.1,27.3c.3,2.3,1.2,4.9,2.4,7.6h0c2.8,6.2,7.6,12.8,12.6,17.6,1.4,1.3,2.6,2.7,3.7,4.3,1.3,1.8,2.4,3.7,3.4,5.8,0,0,.2-6.3,1.5-14.7l.7-14.7c1.4-14.3-6.9-20.9-6.9-20.9-4.8-1.6-12.6-6-19.6-12.3Z\"/>\n        <path class=\"st1\" d=\"M157.2,389.8c8.4,11.7,16.6,20.1,15.5,43-.9,19-2.5,35-6.2,47.6-.3,3.5-.7,6.8-1.2,9.4-2.1,11.1-.8,14.4,5.9,20.6,6.7,6.3,2.5,9.5,7.7,13.3s11.3,3.6,14.2,2.6c2.9-1,9.3,1,12.1-2,2.9-3-3.5-8.2-6.4-11.9-2.9-3.7-11.5-17-11.5-17-.7-3.4-.9-9.3-.9-15.3-8.4-24-6.6-67.9-5.7-96.9-4.5,4.9-14.9,1.1-14.9,1.1-7-6.1-1-19.8-1-19.8-6-1.1-9.3-9-10.7-13.5-.4,8.1-1,15.8-2,22.1,1.7,10.8,5.1,16.5,5.1,16.5Z\"/>\n        <path class=\"st1\" d=\"M154.4,284.6c-.1.4-.2.6-.2.6-2.1,6-6.1,18.9-5.3,35.2.3,7.1,0,16.1-.5,23.9-.8-3.3-1.9-6.9-3.3-10.5-5-12.9-8.9-24.3-9-52.6,0-.2,4.9-5.2,11.3-11.6,0,0,.2-.2.3-.3,4.4,4.4,7.9,10.4,6.8,15.1Z\"/>\n        <path class=\"st1\" d=\"M157.6,301.9c-.2.7-.3,1.4-.5,2.1-2.2,9.6-2.2,29.3-3.1,47.2-.4,8.1-1,15.8-2,22.1-.7-4-1.1-8.7-1-14.1,0,0-.5-6.5-2.7-14.9h0c.5-7.8.8-16.8.5-24-.8-16.3,3.3-29.2,5.3-35.2,0,0,0-.2.2-.6,1-2.9,4.9-15.3,4.6-26.4.1-.2.3-.3.4-.4,1.2-1.2,2.4-2.4,3.5-3.5.8,13.1-2.4,34.3-5.3,47.7Z\"/>\n        <path class=\"st1\" d=\"M144.8,68.6c-3.4,7.5-9.2,22.8-11.2,42.3,0,0,0,0-.1.1,0-13.2,0-26,0-37.9h3.3c1.3,0,2.5-.4,3.5-1.1,1.2-.8,2.8-2,4.5-3.4Z\"/>\n        <path class=\"st1\" d=\"M188.4,134.2s-5.6,2.6-7,7.1c0,0,0,0,0,0-4.5,8.5-7.5,12.8-11.9,14.1-1.6.5-3.5.7-5.9.7-8.6.1-14.7,0-14.7,0l-15.2-9.7v27.5h-.2c0-20.6,0-42.2,0-62.9,0,0,0,0,.1-.1,1.9-1.9,3.7-4,5.2-6.1h34.5c-.7,11.5,6.6,21.9,15.1,29.5Z\"/>\n        <path class=\"st1\" d=\"M153.7,196.7c8-.8,16.7-10.6,19.4-13.6,2.5-2.9,2.1-9.4,6.7-13.5h0c.9-6.9,1.4-12,1.4-12,0,0,0-3.1,0-6.8-.9,9-6.5,14-6.5,14-1.5,7.9-9.5,15.9-15.9,18.8h0c0,7.3-.3,12.6-5,13.2Z\"/>\n        <path class=\"st1\" d=\"M175.5,241.8s-3,3-7.4,7.3c-1.6,1.5-3.3,3.3-5.2,5.1-1.1,1.1-2.3,2.3-3.5,3.5-.1.1-.3.3-.4.4-3.8,3.8-7.8,7.7-11.4,11.3,0,0-.2.2-.3.3-6.4,6.3-11.3,11.3-11.3,11.6h-5.6c0-.2-4.9-5.2-11.3-11.6,0,0-.2-.2-.3-.3-3.6-3.6-7.5-7.5-11.4-11.3-.1-.2-.3-.3-.4-.4-1.2-1.2-2.4-2.4-3.5-3.5-1.9-1.8-3.6-3.6-5.2-5.1-4.4-4.3-7.4-7.3-7.4-7.3,0,0-2.4-12.7-1.6-20.9s2.6-19.1,2.6-19.1c6.6,23.2,15,35,21.5,37.4,4,10.1,9.7,22.6,12.1,27.7.7,1.5,2.2,2.4,3.8,2.4h3.7c0-5.1,0-11.7,0-19.4v-12.6s0-17.9,0-17.9v-22.7c0,0-.1-22.8-.1-22.8h0c0-20.6,0-42.2,0-62.9,0-13.2,0-26,0-37.9h-3.3c-1.3,0-2.5-.4-3.5-1.1-1.2-.8-2.8-2-4.5-3.4h0c-1.9-1.5-3.8-3.2-5.4-4.9-.1-.1-.2-.3-.4-.4-4.1-4.7-4.2-14.3-4.2-14.3-4.8-1.1-6.2-9.4-5.4-12.5.7-3.1,4.5-1.4,4.5-1.4v-15.6C114.9,1,133.3,1,133.3,1c0,0,18.5,0,22.4,18.5v15.6s3.8-1.7,4.5,1.4c.7,3.1-.6,11.3-5.4,12.5,0,0-.1,9.6-4.2,14.3-.1.1-.2.3-.4.4-1.5,1.7-3.5,3.4-5.4,4.9h0c-1.7,1.4-3.4,2.6-4.5,3.4-1,.7-2.3,1.1-3.5,1.1h-3.3c0,11.9,0,24.8,0,37.9,0,20.7,0,42.3,0,62.9h.1v22.8c0,0-.1,22.7-.1,22.7v17.9s0,12.6,0,12.6c0,7.7,0,14.3,0,19.4h3.7c1.6,0,3.1-.9,3.8-2.4,2.4-5.1,8.1-17.6,12.1-27.7,6.5-2.4,14.9-14.2,21.5-37.4,0,0,1.7,10.9,2.6,19.1s-1.6,20.9-1.6,20.9Z\"/>\n        <path class=\"st1\" d=\"M165.3,449.4c2.1,5.8,2.2,19.8,1.2,31,3.6-12.6,5.2-28.6,6.2-47.6,1.1-23-7.1-31.3-15.5-43-4.2,33.7,5.4,52,8.1,59.6Z\"/>\n        <path class=\"st1\" d=\"M186.5,480.3c0-9.7.7-19.6.7-19.6,7.7-49.2,2.6-65.9-.6-76-.7-2.1-1.1-4.6-1.4-7.3l-3.4,4.7c-.3.5-.6,1-1,1.4-.9,28.9-2.7,72.9,5.7,96.9Z\"/>\n        <path class=\"st1\" d=\"M185.2,377.4l-3.4,4.7c-.3.5-.6,1-1,1.4-4.5,4.9-14.9,1.1-14.9,1.1-7-6.1-1-19.8-1-19.8,1.8-6.5,1.9-12.4,1.5-16.7,1.2,6.4,3.8,10.5,5.9,12.8,1.1,1.3,3.2.8,3.6-.9.4-1.7,1-4,1.6-6.7,3.9-16.2,11-47.1,11-57.2s-6.9-26.8-20.2-46.9c4.4-4.3,7.4-7.3,7.4-7.3,0,0,22.5,38.6,9.6,113.6,0,0-1.1,11.9,0,21.9Z\"/>\n        <path class=\"st1\" d=\"M181.1,150.6h0c0,3.8,0,6.9,0,6.9,0,0,1.4,10.7,4.9,14.8,2.9,3.4,5.5,11.2,6.3,13.8,0,0,.6-7.7.6-17h0c-1.2-2.7-2.1-5.3-2.4-7.6-1.2-7.8-2.1-27.3-2.1-27.3,0,0-5.6,2.6-7,7.1,0,0,0,0,0,0-.2.6-.3,1.2-.3,1.9,0,2.2,0,4.9,0,7.3Z\"/>\n        <path class=\"st1\" d=\"M225.7,251.5s.3,10.9,1.7,14.5c1.4,3.6,4,4.4,5.3,10.1,1.1,4.6,3.8,12.2,4.9,15,.2.7.9,1.1,1.6,1.1,1,0,1.8-.9,1.7-1.9l-2.5-16.9,6.7,19.5c.3.9,1.1,1.4,1.9,1.4s.3,0,.5,0c1.1-.3,1.8-1.4,1.4-2.5l-5.5-19.8,11.1,17.9c.5.8,1.3,1.2,2.2,1.2s1-.1,1.4-.4c1.1-.7,1.4-2.1.8-3.3l-9.1-17.3,11.2,15.8c.5.7,1.2,1,2,1s1.1-.2,1.6-.6c.9-.8,1.1-2.1.5-3.1l-13.9-22.3c1.6.8,3.2,2,5.7,3.1,3,1.4,5,.4,6.2-.6.7-.6.8-1.6.3-2.3-1.4-1.9-4.5-5.9-8.9-9.8-6-5.2-13-6.1-13-6.1-1.6,0-3.2.2-4.6.5-1.6.4-3.2,1-4.6,1.6-4,1.8-6.6,4.2-6.6,4.2Z\"/>\n        <path class=\"st1\" d=\"M193.9,195.2c1.3,6.6,3,12,4.9,16.5,7.1,5.1,14.6,11.4,17,24.9t0,0c4.9,6.8,10,14.9,10,14.9,0,0,2.7-2.3,6.6-4.2-2-2.3-5.6-6.9-11.5-15.9-8.1-12.4-19.1-28.5-27-36.2Z\"/>\n        <path class=\"st1\" d=\"M193.6,193.7c0,.5.2,1,.3,1.5h0c7.9,7.7,18.9,23.8,27,36.2,5.9,9,9.5,13.6,11.5,15.9,1.4-.6,2.9-1.2,4.6-1.6-7.3-11.4-13.5-26.7-17.5-34-.6-1-1.5-2.1-2.6-3.2-5.6-5.4-17-11.6-23.2-14.8Z\"/>\n        <path class=\"st1\" d=\"M192.3,186.1c.2.5.3.9.3.9.3,2.4.6,4.6,1,6.7,6.3,3.2,17.7,9.4,23.2,14.8-1.1-4.2-2.4-8.2-4.2-11.8-1-2.1-2.1-4-3.4-5.8-5.4-.9-16.9-4.9-16.9-4.9Z\"/>\n        <path class=\"st1\" d=\"M198.7,211.7c3.9,9.3,8.6,14.8,12,18.5,1.5,1.7,3.2,3.9,5,6.4-2.4-13.4-9.9-19.8-17-24.9Z\"/>\n        <path class=\"st1\" d=\"M158.7,208.2c0,1.6,0,3-.2,4.2,4.2-3.7,6.9-10.6,10.5-16.2,3.2-5.1,4-6.8,7.8-6.1,1.1-6.6,2.1-14.3,2.9-20.6-4.6,4.1-4.1,10.6-6.7,13.5-2.6,3-11.3,12.8-19.4,13.6-.3,0-.5,0-.8,0,1.3,0,5.8.8,5.8,11.5Z\"/>\n        <path class=\"st1\" d=\"M176.8,190.1c-.8,4.7-1.5,8.9-2.3,11.7-6.6,23.2-15,35-21.5,37.4,2.5-6.2,4.3-11.6,4.3-13.7,0-4.8-3.2-5.8-5-6,2.4,0,5.3-.3,6.1-7,4.2-3.7,6.9-10.6,10.5-16.2,3.2-5.1,4-6.8,7.8-6.1Z\"/>\n        <path class=\"st1\" d=\"M192.3,186.1s11.5,4,16.9,4.9c-1.1-1.6-2.4-3-3.7-4.3-5-4.8-9.8-11.4-12.6-17.6,0,9.3-.6,17-.6,17Z\"/>\n        <path class=\"st1\" d=\"M158.7,182.8v.7c0,7.3-.3,12.5-5,13.2-.3,0-.5,0-.8,0-.1,0-.2,0-.4,0h-19v-22.8h20.7s4.4.6,4.4,8.8Z\"/>\n        <path class=\"st1\" d=\"M158.7,208.2c0,1.6,0,3-.2,4.2-.8,6.8-3.7,7.1-6.1,7,0,0,0,0-.1,0-.7,0-1.1,0-1.1,0h-17.7v-22.7h19.1c.1,0,.2,0,.4,0,1.3,0,5.8.8,5.8,11.5Z\"/>\n        <path class=\"st1\" d=\"M157.3,225.4c0,2.1-1.8,7.5-4.3,13.7-4,10.1-9.7,22.6-12.1,27.7-.7,1.5-2.2,2.4-3.8,2.4h-3.7c0-5.1,0-11.7,0-19.4v-12.6s0-17.9,0-17.9h17.7c.4,0,.7,0,1.1,0,0,0,0,0,.1,0,1.8.2,5,1.2,5,6Z\"/>\n        <path class=\"st1\" d=\"M188.4,296c0,10.1-7.1,41.1-11,57.2-.6,2.7-1.2,5-1.6,6.7-.4,1.6-2.5,2.1-3.6.9-2.1-2.3-4.7-6.3-5.9-12.8,0,0,0,0,0,0-.2-2-.5-3.6-.7-4.7-1.9-11.7-6.3-33.5-8-41.3,2.9-13.4,6.2-34.6,5.3-47.7,1.9-1.8,3.6-3.6,5.2-5.1,13.4,20.1,20.2,33.6,20.2,46.9Z\"/>\n        <path class=\"st1\" d=\"M154.4,284.6c1.2-4.8-2.4-10.7-6.8-15.1,3.6-3.6,7.5-7.5,11.4-11.3.2,11.2-3.7,23.6-4.6,26.4Z\"/>\n        <path class=\"st1\" d=\"M154.1,351.2c1.4,4.6,4.8,12.4,10.7,13.5,1.8-6.5,1.9-12.4,1.5-16.7,0,0,0,0,0,0,0-.5-.2-1-.2-1.5-.1-1-.3-2-.5-3.2-1.9-11.7-6.3-33.5-8-41.3-.2.7-.3,1.4-.5,2.1-2.2,9.6-2.2,29.3-3.1,47.2Z\"/>\n        <path class=\"st1\" d=\"M167.3,167c.4,0,.7,0,1.1,0,.9,0,2.6-.3,6.1-2.2,0,0,5.6-5,6.5-14h0c0-2.5,0-5.2,0-7.4,0-.7.1-1.3.3-1.9-4.5,8.5-7.5,12.8-11.9,14.1-.2,3.9-1.4,8.8-2.2,11.5Z\"/>\n        <path class=\"st1\" d=\"M133.6,174h20.7c2.1,0,3.2-1.6,3.8-3.2.6-1.7.6-3.4.6-3.4,0-6.9-9.8-11.2-9.8-11.2l-15.2-9.7v27.5Z\"/>\n        <path class=\"st1\" d=\"M154.2,174s4.4.6,4.4,8.8v.7c6.4-2.9,14.3-10.8,15.9-18.8-3.5,2-5.3,2.3-6.1,2.2-.4,0-.7,0-1.1,0-.5,0-.9.3-1.3.5-1.8.9-4.9,2.4-7.9,3.3-.6,1.6-1.7,3.2-3.8,3.2Z\"/>\n        <path class=\"st1\" d=\"M158.7,167.4s0,1.7-.6,3.4c3.1-.9,6.1-2.4,7.9-3.3.4-.2.9-.4,1.3-.5.8-2.7,2-7.6,2.2-11.5-1.6.5-3.5.7-5.9.7-8.6.1-14.7,0-14.7,0,0,0,9.8,4.3,9.8,11.2Z\"/>\n      </g>\n    </g>\n    <g>\n      <g>\n        <path class=\"st1\" d=\"M446.5,52.2v151.4c-1.8-2.4-3.9-5.3-6-8.5-2.9-4.2-5.9-8.8-8.4-13.2-3.6-6.2-5.7-16.6-7.2-26.4h0c-1.7-10.9-2.6-20.9-3.9-23.5-1.3-2.7-3.8-6.5-7.2-10.6-2.8-3.4-6.2-7-10.2-10.3-4.4-3.8-8.5-5-13.1-4.4,4.7-1.6,8.9-1.5,10.6-1.6,5.1-.4,31.5-23.4,31.5-23.4v-9.8c1.9-12.9,2.8-19.7,7.1-19.7h6.8Z\"/>\n        <path class=\"st1\" d=\"M424.9,155.6h0c-8,7.2-17.4,4.1-26.1-4.1-.6-4.2-1.3-7.8-2-10.6,6.3-4.7,12.9-11,17-19.4,3.4,4.1,5.9,7.9,7.2,10.6,1.3,2.6,2.2,12.6,3.9,23.5Z\"/>\n        <path class=\"st1\" d=\"M413.8,121.5c-4.1,8.4-10.7,14.6-17,19.4,0,0,0,0-.2,0-1.5.9-13.7,8.2-25,11.4-2.8-32.4,9.1-42.4,18.9-45.6h0c4.6-.6,8.7.6,13.1,4.4,3.9,3.4,7.3,7,10.2,10.3Z\"/>\n        <path class=\"st1\" d=\"M396.6,141c-4,3-7.7,5.4-10.7,7.4-7.1,4.9-11,13.1-12,20-4.3,2.3-8.1,6.1-11,10.7.5-16.8,8.7-26.6,8.7-26.6,11.3-3.2,23.5-10.5,25-11.4Z\"/>\n        <path class=\"st1\" d=\"M373.7,178.1c-2.8,1.8-6.5,4.4-10.6,8-.3-2.5-.3-4.9-.3-7.1,2.9-4.5,6.7-8.4,11-10.7-.2,1.1-.2,2.1-.3,3.1,0,1.6,0,3.9,0,6.6Z\"/>\n        <path class=\"st1\" d=\"M373.9,186.1s-.2.3-.6.8c-5.1,3.8-11.6,7.2-16.6,9.6,3.6-8,6.4-10.4,6.4-10.4,4.1-3.7,7.7-6.3,10.6-8,0,2.4.1,5.2.2,8Z\"/>\n        <path class=\"st1\" d=\"M373.3,186.9c-2.2,3.1-10.8,15.2-15.1,22.3-2.9,4.8-6.6,13.5-13.2,26.2,1.1-3.9,2.4-9,4-15.5,2.6-10.7,5.3-18.2,7.7-23.3,5-2.4,11.4-5.8,16.6-9.6Z\"/>\n        <path class=\"st1\" d=\"M399.8,170.1c-.8,3.3-11.7,15.4-11.7,15.4-3.6,5-10.1,10.3-14.2,13.4.1-3.9,0-8.3,0-12.5,0-.1,0-.2,0-.3,0-2.9-.1-5.6-.2-8,0-2.7-.1-5,0-6.6,0-1,0-2.1.3-3.1,1-6.9,5-15.1,12-20,2.9-2,6.7-4.4,10.7-7.4.1,0,.2,0,.2,0,.7,2.8,1.4,6.4,2,10.6.7,5.4,1.2,11.7,1,18.6Z\"/>\n        <path class=\"st1\" d=\"M373.9,198.9c-.1,3.8-.4,7.1-.9,9.3-1.8,7.9-17.4,37.7-24.1,45-4.9-.1-8.6-4.1-8.6-4.1,0,0,1.2-1.2,4.7-13.7t0,0c6.7-12.6,10.3-21.4,13.2-26.2,4.3-7.1,12.9-19.2,15.1-22.3.2-.1.4-.3.6-.4,0,4.2,0,8.6,0,12.5Z\"/>\n        <path class=\"st1\" d=\"M388.1,185.5c-1.8,33.9-13.4,45-18.9,51-5.5,6-14.1,20.3-14.1,20.3-2.3-1.9-6.1-3.6-6.1-3.6,6.7-7.3,22.3-37.1,24.1-45,.5-2.2.8-5.5.9-9.3,4.1-3.1,10.5-8.4,14.2-13.4Z\"/>\n        <path class=\"st1\" d=\"M355.1,256.8c0,3.3-1.5,12.4-4.1,17.2-1.4,2.6-3.3,9.1-3.7,12.6-.3,2.6-3.3,8-4.8,10.6-.5.8-1.5,1.2-2.4.9-.8-.3-1.3-1.1-1.3-1.9s0-.5.1-.7c.8-2,2-5,2.6-6.5.9-2.3,1.1-9.4.3-9.9-.8-.5-1.4,5-2.3,8.7-.7,2.8-3.5,8.2-5,10.9-.5.9-1.5,1.2-2.4.9h0c-1-.4-1.6-1.4-1.3-2.4.4-1.3,1.1-3.2,2.3-5.6,2.3-4.8,3.2-12.4,2.7-13.1-.5-.7-2.6,4.5-2.6,4.5l-7.9,14.3c-.5,1-1.8,1.3-2.7.8l-.5-.3c-1-.6-1.3-1.8-.7-2.8.7-1.1,1.6-2.7,2.5-4.7,1.7-3.9,6.2-15.9,6.8-17-.7,1-8.1,12.9-11.5,18.3-.9,1.4-2.8,1.7-4.1.7-.7-.5-1-1.3-1-2.1s.2-1.1.5-1.5c1.8-2.6,5-7.2,7.1-10.4,2.7-4,6.9-11.8,7.9-13.8,0,0,0-.2-.1,0-1.2,1.2-5,4.8-8.6,6-2.3.8-3.8,0-4.8-.8-.8-.8-.8-2,0-2.8,1.8-1.9,5.8-5.8,11.1-10,7.4-5.8,13.2-7.7,13.2-7.7,0,0,3.7,4,8.6,4.1,0,0,3.8,1.7,6.1,3.6Z\"/>\n        <path class=\"st1\" d=\"M408.4,278.1c-3.8,13.4-1.5,13.9-1.5,13.9-12.9,22.3-15.7,40.7-12.6,64.9-2.2-13.9-5.9-40.1-4.8-56,.9-12.8,5.5-29.5,9.3-41.5,8,1.8,12.9,7.1,9.6,18.7Z\"/>\n        <path class=\"st1\" d=\"M446.5,256.8v24c-3.7,1.7-7.4,5.8-9.5,8.5-1.4,1.7-3.4,2.7-5.6,2.7h-24.4s-2.3-.5,1.5-13.9c3.3-11.6-1.7-16.9-9.6-18.7,2.7-8.4,4.9-14.6,5.3-15.5h0c5.1-3.2,10.9-7.4,14.5-12,1.9-2.4,3.6-5.3,5.4-8.6,9.9,7.9,19.8,17.8,22.5,33.5Z\"/>\n        <path class=\"st1\" d=\"M424,223.3c-1.8,3.3-3.6,6.2-5.4,8.6-3.6,4.6-9.3,8.8-14.5,12,0,0,0,0,0,0-2.9-20.3,2.2-34.6,2.2-34.6,4.5,4.5,11.1,8.8,17.6,14.1Z\"/>\n        <path class=\"st1\" d=\"M440.5,195.2c-6.6,7.7-11.6,19.1-16.5,28.1-6.6-5.2-13.2-9.5-17.6-14.1-6.4-17.1-6.5-39.1-6.5-39.1.2-6.9-.3-13.3-1-18.6,8.6,8.2,18.1,11.3,26.1,4.1,1.5,9.8,3.6,20.2,7.2,26.4,2.5,4.3,5.5,9,8.4,13.2Z\"/>\n        <path class=\"st1\" d=\"M446.5,203.6v53.2c-2.8-15.7-12.6-25.6-22.5-33.5,5-9.1,10-20.4,16.5-28.1,2.1,3.1,4.2,6,6,8.5Z\"/>\n        <path class=\"st1\" d=\"M446.5,280.9v6.8s-2.6-.6-2.5,11.7c.2,15.1-5,31-9.4,39.1-1.7-30.3-6.6-37.9-8.8-46.4h5.5c2.2,0,4.3-1,5.6-2.7,2.2-2.7,5.8-6.8,9.5-8.5Z\"/>\n        <path class=\"st1\" d=\"M434.7,338.4s0,0,0,0c-4.3,8.1-6.6,27-6.6,27-1.9,12.4-8.6,16.2-8.6,16.2-.6-3.1-.9-6-1.1-8.9-.6-6.4-1.1-12.8-3.8-21.5.2-.5.3-1,.4-1.5,2.8-10.6,3.3-32.9,5.2-57.8h5.8c2.3,8.5,7.1,16.1,8.8,46.4Z\"/>\n        <path class=\"st1\" d=\"M420,292.1c-1.8,25-2.3,47.2-5.2,57.8-.1.5-.3,1-.4,1.5-1.6,5.4-4.4,13.1-8.8,22.5-1.2,2.5-2.4,5.2-3.8,7.9-1.3-2.8-3.5-7.9-5.9-15.4,0,0-.7-3.7-1.6-9.4-3-24.2-.3-42.6,12.6-64.9h13.1Z\"/>\n        <path class=\"st1\" d=\"M401.8,381.9c-3.6,7.4-8.1,15.6-13.3,24.6,1-5.7,2.5-10,4-14,3.9-10.6,3.4-25.9,3.4-25.9,2.4,7.5,4.6,12.6,5.9,15.4Z\"/>\n        <path class=\"st1\" d=\"M428,365.5c-.1,19.7-4.4,30.7-4.4,30.7-2.2-5.5-3.5-10.2-4.2-14.4,0,0,6.7-3.8,8.6-16.2Z\"/>\n        <path class=\"st1\" d=\"M419.8,443.4c-.7,2.2-1.5,4.9-2.2,7.8-4.6,2.1-9.1-1.5-9.6-11.2h0c3.2-17.1,2.9-35.1,3.3-51.3,0,0,4.4-6.3,6.9-15.9.3,2.9.6,5.8,1.1,8.9.7,4.3,2,8.9,4.2,14.4,2,22.9-.7,37.8-3.8,47.2Z\"/>\n        <path class=\"st1\" d=\"M412.6,479.3c-.4,6.4,3.3,22,3.9,34.8.6,12.8-13.4,9.3-16.6,7.6-3.1-1.7-6.5-4-12-3.9-5.5.1-10.7,0-14.9-2.5-4.2-2.5,1.6-4.2,5.1-5.6,3.5-1.4,15.1-11.7,15.1-11.7,0,0,3.8-15.3-2.6-48.5-.7-3.9-1.3-7.5-1.8-10.8,7.5,18.7,15.7,18.4,18.7,3.4.1-.6.2-1.3.4-1.9.6,9.8,5,13.3,9.6,11.2-.3,1.3-.6,2.7-.9,4.1-2.1,9.2-3.8,19.6-4,23.9Z\"/>\n        <path class=\"st1\" d=\"M411.3,388.7c-.4,16.2-.2,34.2-3.3,51.2h0c-.1.7-.2,1.3-.4,2-3,15-11.3,15.4-18.7-3.4h0c-2.1-14.6-1.7-24.5-.4-32.1,5.3-9,9.7-17.2,13.3-24.6,1.4-2.8,2.6-5.4,3.8-7.9,2.2,8.2,5.7,14.8,5.7,14.8Z\"/>\n        <path class=\"st1\" d=\"M418.2,372.8c-2.6,9.5-6.9,15.9-6.9,15.9,0,0-3.4-6.6-5.7-14.8,4.4-9.5,7.2-17.1,8.8-22.5,2.7,8.6,3.2,15.1,3.8,21.5Z\"/>\n      </g>\n      <g>\n        <path class=\"st1\" d=\"M474.1,42.8c0,3.1-.8,12.8-5.8,12.4,0,0-.2,12.8-8,16.7-1.9-12.9-2.8-19.7-7.1-19.7h-13.6c-4.2,0-5.2,6.8-7.1,19.7-7.8-4-8-16.7-8-16.7-5,.4-5.8-9.4-5.8-12.4s4.6-2.1,4.6-2.1c0,0-.8-5.6.6-13.3,1.4-7.7,5-19.5,22.4-19.5s21,11.8,22.4,19.5c1.4,7.7.6,13.3.6,13.3,0,0,4.6-1,4.6,2.1Z\"/>\n        <path class=\"st1\" d=\"M502.5,106.8c-4.6-.6-8.7.6-13.1,4.4-3.9,3.4-7.3,7-10.2,10.3-3.4,4.1-5.9,7.9-7.2,10.6-1.3,2.6-2.2,12.6-3.9,23.5h0c-1.5,9.8-3.6,20.2-7.2,26.4-2.5,4.3-5.5,9-8.4,13.2-2.1,3.1-4.2,6-6,8.5V52.2h6.8c4.2,0,5.2,6.8,7.1,19.7v9.8s26.4,23,31.5,23.4c1.7.1,5.9,0,10.6,1.6Z\"/>\n        <path class=\"st1\" d=\"M496.2,140.9c-.7,2.8-1.4,6.4-2,10.6-8.6,8.2-18.1,11.3-26.1,4.1h0c1.7-10.9,2.6-20.9,3.9-23.5,1.3-2.7,3.8-6.5,7.2-10.6,4.1,8.4,10.7,14.6,17,19.4Z\"/>\n        <path class=\"st1\" d=\"M521.4,152.4c-11.3-3.2-23.5-10.5-25-11.4-.1,0-.2,0-.2,0-6.3-4.7-12.9-11-17-19.4,2.8-3.4,6.2-7,10.2-10.3,4.4-3.8,8.5-5,13.1-4.4h0c9.7,3.2,21.7,13.2,18.9,45.6Z\"/>\n        <path class=\"st1\" d=\"M530.1,179c-2.9-4.5-6.7-8.4-11-10.7-1-6.9-5-15.1-12-20-2.9-2-6.7-4.4-10.7-7.4,1.5.9,13.7,8.2,25,11.4,0,0,8.3,9.8,8.7,26.6Z\"/>\n        <path class=\"st1\" d=\"M529.8,186.1c-4.1-3.7-7.7-6.3-10.6-8,0-2.7.1-5,0-6.6,0-1,0-2.1-.3-3.1,4.3,2.3,8.1,6.1,11,10.7,0,2.3,0,4.6-.3,7.1Z\"/>\n        <path class=\"st1\" d=\"M536.2,196.5c-5-2.4-11.4-5.8-16.6-9.6-.4-.5-.6-.8-.6-.8,0-2.9.1-5.6.2-8,2.8,1.8,6.5,4.4,10.6,8,0,0,2.8,2.4,6.4,10.4Z\"/>\n        <path class=\"st1\" d=\"M548,235.4c-6.7-12.6-10.3-21.4-13.2-26.2-4.3-7.1-12.9-19.2-15.1-22.3,5.1,3.8,11.6,7.2,16.6,9.6,2.4,5.2,5.1,12.6,7.7,23.3,1.6,6.5,2.9,11.6,4,15.5Z\"/>\n        <path class=\"st1\" d=\"M519.3,178.1c0,2.4-.1,5.2-.2,8,0,0,0,.2,0,.3,0,4.2,0,8.6,0,12.5-4.1-3.1-10.5-8.4-14.2-13.4,0,0-11-12.1-11.7-15.4-.2-6.9.3-13.3,1-18.6.6-4.2,1.3-7.8,2-10.6,0,0,0,0,.2,0,4,3,7.7,5.4,10.7,7.4,7.1,4.9,11,13.1,12,20,.2,1.1.2,2.1.3,3.1,0,1.6,0,3.9,0,6.6Z\"/>\n        <path class=\"st1\" d=\"M552.7,249.1s-3.7,4-8.6,4.1c-6.7-7.3-22.3-37.1-24.1-45-.5-2.2-.8-5.5-.9-9.3,0-3.9,0-8.3,0-12.5.2.1.4.3.6.4,2.2,3.1,10.8,15.2,15.1,22.3,2.9,4.8,6.6,13.5,13.2,26.2t0,0c3.5,12.5,4.7,13.7,4.7,13.7Z\"/>\n        <path class=\"st1\" d=\"M544.1,253.2s-3.8,1.7-6.1,3.6c0,0-8.6-14.2-14.1-20.3-5.5-6-17.1-17.1-18.9-51,3.6,5,10.1,10.3,14.2,13.4.1,3.8.4,7.1.9,9.3,1.8,7.9,17.4,37.7,24.1,45Z\"/>\n        <path class=\"st1\" d=\"M578.9,290.2c0,.8-.4,1.6-1,2.1-1.3,1-3.2.7-4.1-.7-3.4-5.4-10.9-17.3-11.5-18.3.5,1.1,5,13.1,6.8,17,.9,2,1.8,3.6,2.5,4.7.6,1,.3,2.2-.7,2.8l-.5.3c-1,.5-2.2.2-2.7-.8l-7.9-14.3s-2-5.2-2.6-4.5c-.5.7.4,8.3,2.7,13.1,1.2,2.4,1.9,4.3,2.3,5.6.3,1-.3,2.1-1.3,2.4h0c-.9.3-1.9,0-2.4-.9-1.4-2.6-4.3-8.1-5-10.9-.9-3.7-1.5-9.2-2.3-8.7-.8.5-.6,7.6.3,9.9.6,1.5,1.8,4.5,2.6,6.5,0,.2.1.5.1.7,0,.8-.5,1.6-1.3,1.9-.9.3-1.9,0-2.4-.9-1.5-2.6-4.5-8-4.8-10.6-.4-3.5-2.3-9.9-3.7-12.6-2.6-4.7-4.1-13.9-4.1-17.2,2.3-1.9,6.1-3.6,6.1-3.6,4.9-.1,8.6-4.1,8.6-4.1,0,0,5.8,1.9,13.2,7.7,5.3,4.1,9.3,8.1,11.1,10,.8.8.8,2.1,0,2.8-.9.9-2.4,1.6-4.8.8-3.6-1.3-7.4-4.9-8.6-6,0,0-.2,0-.1,0,1.1,2,5.3,9.8,7.9,13.8,2.1,3.1,5.2,7.7,7.1,10.4.3.5.5,1,.5,1.5Z\"/>\n        <path class=\"st1\" d=\"M498.7,357c3-24.2.3-42.6-12.6-64.9,0,0,2.3-.5-1.5-13.9-3.3-11.6,1.7-16.9,9.6-18.7,3.8,12,8.4,28.7,9.3,41.5,1.1,16-2.5,42.1-4.8,56Z\"/>\n        <path class=\"st1\" d=\"M484.6,278.1c3.8,13.4,1.5,13.9,1.5,13.9h-24.4c-2.2,0-4.3-1-5.6-2.7-2.2-2.7-5.8-6.8-9.5-8.5v-24c2.8-15.7,12.6-25.6,22.5-33.5,1.8,3.3,3.6,6.2,5.4,8.6,3.6,4.6,9.3,8.8,14.5,12h0c.3.9,2.6,7.1,5.3,15.5-8,1.8-12.9,7.1-9.6,18.7Z\"/>\n        <path class=\"st1\" d=\"M488.9,243.8s0,0,0,0c-5.1-3.2-10.9-7.4-14.5-12-1.9-2.4-3.6-5.3-5.4-8.6,6.6-5.2,13.2-9.5,17.6-14.1,0,0,5.1,14.2,2.2,34.6Z\"/>\n        <path class=\"st1\" d=\"M493.2,170.1s-.1,22.1-6.5,39.1c-4.5,4.5-11.1,8.8-17.6,14.1-5-9.1-10-20.4-16.5-28.1,2.9-4.2,5.9-8.8,8.4-13.2,3.6-6.2,5.7-16.6,7.2-26.4,8,7.1,17.4,4.1,26.1-4.1-.7,5.4-1.2,11.7-1,18.6Z\"/>\n        <path class=\"st1\" d=\"M469,223.3c-9.9,7.9-19.8,17.8-22.5,33.5v-53.2c1.8-2.4,3.9-5.3,6-8.5,6.6,7.7,11.6,19.1,16.5,28.1Z\"/>\n        <path class=\"st1\" d=\"M467.2,292.1c-2.3,8.5-7.1,16.1-8.8,46.4-4.3-8.1-9.5-24-9.4-39.1.1-12.4-2.5-11.7-2.5-11.7v-6.8c3.7,1.7,7.4,5.8,9.5,8.5,1.4,1.7,3.4,2.7,5.6,2.7h5.5Z\"/>\n        <path class=\"st1\" d=\"M478.6,351.4c-2.7,8.6-3.2,15.1-3.8,21.5-.3,2.9-.6,5.8-1.1,8.9,0,0-6.7-3.8-8.6-16.2,0,0-2.3-18.9-6.6-27,0,0,0,0,0,0,1.7-30.3,6.6-37.9,8.8-46.4h5.8c1.8,25,2.3,47.2,5.2,57.8.1.5.3,1,.4,1.5Z\"/>\n        <path class=\"st1\" d=\"M498.7,357c-.9,5.8-1.6,9.4-1.6,9.4-2.4,7.5-4.6,12.6-5.9,15.4-1.4-2.8-2.6-5.4-3.8-7.9-4.4-9.5-7.2-17.1-8.8-22.5-.2-.5-.3-1-.4-1.5-2.8-10.6-3.3-32.9-5.2-57.8h13.1c12.9,22.3,15.7,40.7,12.6,64.9Z\"/>\n        <path class=\"st1\" d=\"M504.5,406.4c-5.3-9-9.7-17.2-13.3-24.6,1.3-2.8,3.5-7.9,5.9-15.4,0,0-.5,15.4,3.4,25.9,1.5,4,3,8.4,4,14Z\"/>\n        <path class=\"st1\" d=\"M473.7,381.8c-.7,4.3-2,8.9-4.2,14.4,0,0-4.3-11-4.4-30.7,1.9,12.4,8.6,16.2,8.6,16.2Z\"/>\n        <path class=\"st1\" d=\"M485,439.6c-.4,12-4.3,14.8-9.8,10.6-.7-2.6-1.3-4.9-1.9-6.8-3.1-9.4-5.7-24.3-3.8-47.2,2.2-5.5,3.5-10.2,4.2-14.4.6-3.1.9-6,1.1-8.9,2.6,9.5,6.9,15.9,6.9,15.9.4,16.1.2,33.9,3.3,50.9Z\"/>\n        <path class=\"st1\" d=\"M519.9,515.3c-4.2,2.5-9.4,2.6-14.9,2.5-5.5-.1-8.9,2.2-12,3.9-3.1,1.7-17.2,5.2-16.6-7.6.7-12.8,4.3-28.4,3.9-34.8-.3-4.3-2-14.7-4-23.9-.4-1.8-.8-3.5-1.2-5.1,5.5,4.1,9.4,1.4,9.8-10.6.1.8.3,1.6.4,2.3,3,15,11.3,15.4,18.7-3.4-.5,3.4-1.1,7-1.8,10.8-6.4,33.3-2.6,48.5-2.6,48.5,0,0,11.6,10.3,15.1,11.7,3.5,1.4,9.3,3.1,5.1,5.6Z\"/>\n        <path class=\"st1\" d=\"M504.1,438.5h0c-7.5,18.8-15.7,18.4-18.7,3.4-.2-.8-.3-1.5-.4-2.3-3.1-16.9-2.9-34.8-3.3-50.9,0,0,3.4-6.6,5.7-14.8,1.2,2.5,2.4,5.2,3.8,7.9,3.6,7.4,8.1,15.6,13.3,24.6,1.3,7.6,1.7,17.5-.4,32.1Z\"/>\n        <path class=\"st1\" d=\"M487.4,373.9c-2.2,8.2-5.7,14.8-5.7,14.8,0,0-4.4-6.3-6.9-15.9.6-6.4,1.1-12.8,3.8-21.5,1.6,5.4,4.4,13.1,8.8,22.5Z\"/>\n      </g>\n    </g>";
const MUSCLE_FIGURE_FILLS = {
  abs: "<path class=\"st0\" d=\"M133.1,196.8h-19c-.1,0-.2,0-.4,0-.3,0-.5,0-.8,0-4.7-.7-5-5.9-5-13.2v-.7c0-8.2,4.4-8.8,4.4-8.8h20.7v22.8Z\"/>\n    <path class=\"st0\" d=\"M133.2,219.4h-17.7s-.5,0-1.1,0c0,0,0,0,0,0-2.4,0-5.3-.3-6.1-7-.1-1.2-.2-2.6-.2-4.2,0-10.7,4.4-11.5,5.8-11.5.1,0,.2,0,.4,0h19v22.7Z\"/>\n    <path class=\"st0\" d=\"M133.3,269.3h-3.7c-1.6,0-3.1-.9-3.8-2.4-2.4-5.1-8.1-17.6-12.1-27.7-2.5-6.2-4.3-11.6-4.3-13.7,0-4.8,3.2-5.8,5-6,0,0,0,0,0,0,.4,0,.8,0,1.1,0h17.7v17.9s0,12.6,0,12.6c0,7.7,0,14.3,0,19.4Z\"/>\n    <path class=\"st0\" d=\"M133.1,174h-20.7c-2.1,0-3.2-1.6-3.8-3.2-.6-1.7-.6-3.4-.6-3.4,0-6.9,9.8-11.2,9.8-11.2l15.2-9.7v27.5Z\"/>\n    <path class=\"st0\" d=\"M158.7,182.8v.7c0,7.3-.3,12.5-5,13.2-.3,0-.5,0-.8,0-.1,0-.2,0-.4,0h-19v-22.8h20.7s4.4.6,4.4,8.8Z\"/>\n    <path class=\"st0\" d=\"M158.7,208.2c0,1.6,0,3-.2,4.2-.8,6.8-3.7,7.1-6.1,7,0,0,0,0-.1,0-.7,0-1.1,0-1.1,0h-17.7v-22.7h19.1c.1,0,.2,0,.4,0,1.3,0,5.8.8,5.8,11.5Z\"/>\n    <path class=\"st0\" d=\"M157.3,225.4c0,2.1-1.8,7.5-4.3,13.7-4,10.1-9.7,22.6-12.1,27.7-.7,1.5-2.2,2.4-3.8,2.4h-3.7c0-5.1,0-11.7,0-19.4v-12.6s0-17.9,0-17.9h17.7c.4,0,.7,0,1.1,0,0,0,0,0,.1,0,1.8.2,5,1.2,5,6Z\"/>\n    <path class=\"st0\" d=\"M133.6,174h20.7c2.1,0,3.2-1.6,3.8-3.2.6-1.7.6-3.4.6-3.4,0-6.9-9.8-11.2-9.8-11.2l-15.2-9.7v27.5Z\"/>\n    <path class=\"st0\" d=\"M424,223.3c-1.8,3.3-3.6,6.2-5.4,8.6-3.6,4.6-9.3,8.8-14.5,12,0,0,0,0,0,0-2.9-20.3,2.2-34.6,2.2-34.6,4.5,4.5,11.1,8.8,17.6,14.1Z\"/>\n    <path class=\"st0\" d=\"M488.9,243.8s0,0,0,0c-5.1-3.2-10.9-7.4-14.5-12-1.9-2.4-3.6-5.3-5.4-8.6,6.6-5.2,13.2-9.5,17.6-14.1,0,0,5.1,14.2,2.2,34.6Z\"/>\n    <path class=\"st0\" d=\"M113,196.7c-8-.8-16.7-10.6-19.4-13.6-2.5-2.9-2.1-9.4-6.7-13.5h0c-.9-6.9-1.4-12-1.4-12,0,0,0-3.1,0-6.8.9,9,6.5,14,6.5,14,1.5,7.9,9.5,15.9,15.9,18.8h0c0,7.3.3,12.6,5,13.2Z\"/>\n    <path class=\"st0\" d=\"M108,208.2c0,1.6,0,3,.2,4.2-4.2-3.7-6.9-10.6-10.5-16.2-3.2-5.1-4-6.8-7.8-6.1-1.1-6.6-2.1-14.3-2.9-20.6,4.6,4.1,4.1,10.6,6.7,13.5,2.6,3,11.3,12.8,19.4,13.6.3,0,.5,0,.8,0-1.3,0-5.8.8-5.8,11.5Z\"/>\n    <path class=\"st0\" d=\"M109.3,225.4c0,2.1,1.8,7.5,4.3,13.7-6.5-2.4-14.9-14.2-21.5-37.4-.7-2.8-1.5-7-2.3-11.7,3.8-.7,4.6,1.1,7.8,6.1,3.6,5.7,6.3,12.6,10.5,16.2.8,6.8,3.7,7.1,6.1,7-1.8.2-5,1.2-5,6Z\"/>\n    <path class=\"st0\" d=\"M112.4,174s-4.4.6-4.4,8.8v.7c-6.4-2.9-14.3-10.8-15.9-18.8,3.5,2,5.3,2.3,6.1,2.2.4,0,.7,0,1.1,0,.5,0,.9.3,1.3.5,1.8.9,4.9,2.4,7.9,3.3.6,1.6,1.7,3.2,3.8,3.2Z\"/>\n    <path class=\"st0\" d=\"M153.7,196.7c8-.8,16.7-10.6,19.4-13.6,2.5-2.9,2.1-9.4,6.7-13.5h0c.9-6.9,1.4-12,1.4-12,0,0,0-3.1,0-6.8-.9,9-6.5,14-6.5,14-1.5,7.9-9.5,15.9-15.9,18.8h0c0,7.3-.3,12.6-5,13.2Z\"/>\n    <path class=\"st0\" d=\"M177.1,220.9c-.9-8.3-2.6-19.1-2.6-19.1-6.6,23.2-15,35-21.5,37.4-4,10.1-9.7,22.6-12.1,27.7-.7,1.5-2.2,2.4-3.8,2.4h-7.6c-1.6,0-3.1-.9-3.8-2.4-2.4-5.1-8.1-17.6-12.1-27.7-6.5-2.4-14.9-14.2-21.5-37.4,0,0-1.7,10.9-2.6,19.1s1.6,20.9,1.6,20.9c0,0,3,3,7.4,7.3,1.6,1.5,3.3,3.3,5.2,5.1,1.1,1.1,2.3,2.3,3.5,3.5.1.1.3.3.4.4,3.8,3.8,7.8,7.7,11.4,11.3.1,0,.2.2.3.3,6.4,6.3,11.3,11.3,11.3,11.6h5.6c0-.2,4.9-5.2,11.3-11.6,0,0,.2-.2.3-.3,3.6-3.6,7.5-7.5,11.4-11.3.1-.2.3-.3.4-.4,1.2-1.2,2.4-2.4,3.5-3.5,1.9-1.8,3.6-3.6,5.2-5.1,4.4-4.3,7.4-7.3,7.4-7.3,0,0,2.4-12.7,1.6-20.9Z\"/>\n    <path class=\"st0\" d=\"M158.7,208.2c0,1.6,0,3-.2,4.2,4.2-3.7,6.9-10.6,10.5-16.2,3.2-5.1,4-6.8,7.8-6.1,1.1-6.6,2.1-14.3,2.9-20.6-4.6,4.1-4.1,10.6-6.7,13.5-2.6,3-11.3,12.8-19.4,13.6-.3,0-.5,0-.8,0,1.3,0,5.8.8,5.8,11.5Z\"/>\n    <path class=\"st0\" d=\"M176.8,190.1c-.8,4.7-1.5,8.9-2.3,11.7-6.6,23.2-15,35-21.5,37.4,2.5-6.2,4.3-11.6,4.3-13.7,0-4.8-3.2-5.8-5-6,2.4,0,5.3-.3,6.1-7,4.2-3.7,6.9-10.6,10.5-16.2,3.2-5.1,4-6.8,7.8-6.1Z\"/>\n    <path class=\"st0\" d=\"M154.2,174s4.4.6,4.4,8.8v.7c6.4-2.9,14.3-10.8,15.9-18.8-3.5,2-5.3,2.3-6.1,2.2-.4,0-.7,0-1.1,0-.5,0-.9.3-1.3.5-1.8.9-4.9,2.4-7.9,3.3-.6,1.6-1.7,3.2-3.8,3.2Z\"/>",
  arms: "<path class=\"st0\" d=\"M78.3,134.2s-.9,19.5-2.1,27.3c-.3,2.3-1.2,4.9-2.4,7.6h0c-2.8,6.2-7.6,12.8-12.6,17.6-1.4,1.3-2.6,2.7-3.7,4.3-1.3,1.8-2.4,3.7-3.4,5.8,0,0-.2-6.3-1.5-14.7l-.7-14.7c-1.4-14.3,6.9-20.9,6.9-20.9,4.8-1.6,12.6-6,19.6-12.3Z\"/>\n    <path class=\"st0\" d=\"M85.6,150.6h0c0,3.8,0,6.9,0,6.9,0,0-1.4,10.7-4.9,14.8-2.9,3.4-5.5,11.2-6.3,13.8,0,0-.6-7.7-.6-17h0c1.2-2.7,2.1-5.3,2.4-7.6,1.2-7.8,2.1-27.3,2.1-27.3,0,0,5.6,2.6,7,7.1,0,0,0,0,0,0,.2.6.3,1.2.3,1.9,0,2.2,0,4.9,0,7.3Z\"/>\n    <path class=\"st0\" d=\"M188.4,134.2s.9,19.5,2.1,27.3c.3,2.3,1.2,4.9,2.4,7.6h0c2.8,6.2,7.6,12.8,12.6,17.6,1.4,1.3,2.6,2.7,3.7,4.3,1.3,1.8,2.4,3.7,3.4,5.8,0,0,.2-6.3,1.5-14.7l.7-14.7c1.4-14.3-6.9-20.9-6.9-20.9-4.8-1.6-12.6-6-19.6-12.3Z\"/>\n    <path class=\"st0\" d=\"M181.1,150.6h0c0,3.8,0,6.9,0,6.9,0,0,1.4,10.7,4.9,14.8,2.9,3.4,5.5,11.2,6.3,13.8,0,0,.6-7.7.6-17h0c-1.2-2.7-2.1-5.3-2.4-7.6-1.2-7.8-2.1-27.3-2.1-27.3,0,0-5.6,2.6-7,7.1,0,0,0,0,0,0-.2.6-.3,1.2-.3,1.9,0,2.2,0,4.9,0,7.3Z\"/>\n    <path class=\"st0\" d=\"M396.6,141c-4,3-7.7,5.4-10.7,7.4-7.1,4.9-11,13.1-12,20-4.3,2.3-8.1,6.1-11,10.7.5-16.8,8.7-26.6,8.7-26.6,11.3-3.2,23.5-10.5,25-11.4Z\"/>\n    <path class=\"st0\" d=\"M373.7,178.1c-2.8,1.8-6.5,4.4-10.6,8-.3-2.5-.3-4.9-.3-7.1,2.9-4.5,6.7-8.4,11-10.7-.2,1.1-.2,2.1-.3,3.1,0,1.6,0,3.9,0,6.6Z\"/>\n    <path class=\"st0\" d=\"M399.8,170.1c-.8,3.3-11.7,15.4-11.7,15.4-3.6,5-10.1,10.3-14.2,13.4.1-3.9,0-8.3,0-12.5,0-.1,0-.2,0-.3,0-2.9-.1-5.6-.2-8,0-2.7-.1-5,0-6.6,0-1,0-2.1.3-3.1,1-6.9,5-15.1,12-20,2.9-2,6.7-4.4,10.7-7.4.1,0,.2,0,.2,0,.7,2.8,1.4,6.4,2,10.6.7,5.4,1.2,11.7,1,18.6Z\"/>\n    <path class=\"st0\" d=\"M530.1,179c-2.9-4.5-6.7-8.4-11-10.7-1-6.9-5-15.1-12-20-2.9-2-6.7-4.4-10.7-7.4,1.5.9,13.7,8.2,25,11.4,0,0,8.3,9.8,8.7,26.6Z\"/>\n    <path class=\"st0\" d=\"M529.8,186.1c-4.1-3.7-7.7-6.3-10.6-8,0-2.7.1-5,0-6.6,0-1,0-2.1-.3-3.1,4.3,2.3,8.1,6.1,11,10.7,0,2.3,0,4.6-.3,7.1Z\"/>\n    <path class=\"st0\" d=\"M519.3,178.1c0,2.4-.1,5.2-.2,8,0,0,0,.2,0,.3,0,4.2,0,8.6,0,12.5-4.1-3.1-10.5-8.4-14.2-13.4,0,0-11-12.1-11.7-15.4-.2-6.9.3-13.3,1-18.6.6-4.2,1.3-7.8,2-10.6,0,0,0,0,.2,0,4,3,7.7,5.4,10.7,7.4,7.1,4.9,11,13.1,12,20,.2,1.1.2,2.1.3,3.1,0,1.6,0,3.9,0,6.6Z\"/>",
  back: "<path class=\"st0\" d=\"M446.5,52.2v151.4c-1.8-2.4-3.9-5.3-6-8.5-2.9-4.2-5.9-8.8-8.4-13.2-3.6-6.2-5.7-16.6-7.2-26.4h0c-1.7-10.9-2.6-20.9-3.9-23.5-1.3-2.7-3.8-6.5-7.2-10.6-2.8-3.4-6.2-7-10.2-10.3-4.4-3.8-8.5-5-13.1-4.4,4.7-1.6,8.9-1.5,10.6-1.6,5.1-.4,31.5-23.4,31.5-23.4v-9.8c1.9-12.9,2.8-19.7,7.1-19.7h6.8Z\"/>\n    <path class=\"st0\" d=\"M424.9,155.6h0c-8,7.2-17.4,4.1-26.1-4.1-.6-4.2-1.3-7.8-2-10.6,6.3-4.7,12.9-11,17-19.4,3.4,4.1,5.9,7.9,7.2,10.6,1.3,2.6,2.2,12.6,3.9,23.5Z\"/>\n    <path class=\"st0\" d=\"M440.5,195.2c-6.6,7.7-11.6,19.1-16.5,28.1-6.6-5.2-13.2-9.5-17.6-14.1-6.4-17.1-6.5-39.1-6.5-39.1.2-6.9-.3-13.3-1-18.6,8.6,8.2,18.1,11.3,26.1,4.1,1.5,9.8,3.6,20.2,7.2,26.4,2.5,4.3,5.5,9,8.4,13.2Z\"/>\n    <path class=\"st0\" d=\"M446.5,203.6v53.2c-2.8-15.7-12.6-25.6-22.5-33.5,5-9.1,10-20.4,16.5-28.1,2.1,3.1,4.2,6,6,8.5Z\"/>\n    <path class=\"st0\" d=\"M502.5,106.8c-4.6-.6-8.7.6-13.1,4.4-3.9,3.4-7.3,7-10.2,10.3-3.4,4.1-5.9,7.9-7.2,10.6-1.3,2.6-2.2,12.6-3.9,23.5h0c-1.5,9.8-3.6,20.2-7.2,26.4-2.5,4.3-5.5,9-8.4,13.2-2.1,3.1-4.2,6-6,8.5V52.2h6.8c4.2,0,5.2,6.8,7.1,19.7v9.8s26.4,23,31.5,23.4c1.7.1,5.9,0,10.6,1.6Z\"/>\n    <path class=\"st0\" d=\"M496.2,140.9c-.7,2.8-1.4,6.4-2,10.6-8.6,8.2-18.1,11.3-26.1,4.1h0c1.7-10.9,2.6-20.9,3.9-23.5,1.3-2.7,3.8-6.5,7.2-10.6,4.1,8.4,10.7,14.6,17,19.4Z\"/>\n    <path class=\"st0\" d=\"M493.2,170.1s-.1,22.1-6.5,39.1c-4.5,4.5-11.1,8.8-17.6,14.1-5-9.1-10-20.4-16.5-28.1,2.9-4.2,5.9-8.8,8.4-13.2,3.6-6.2,5.7-16.6,7.2-26.4,8,7.1,17.4,4.1,26.1-4.1-.7,5.4-1.2,11.7-1,18.6Z\"/>\n    <path class=\"st0\" d=\"M469,223.3c-9.9,7.9-19.8,17.8-22.5,33.5v-53.2c1.8-2.4,3.9-5.3,6-8.5,6.6,7.7,11.6,19.1,16.5,28.1Z\"/>",
  calves: "<path class=\"st0\" d=\"M101.3,449.4c-2.1,5.8-2.2,19.8-1.2,31-3.6-12.6-5.2-28.6-6.2-47.6-1.1-23,7.1-31.3,15.5-43,4.2,33.7-5.4,52-8.1,59.6Z\"/>\n    <path class=\"st0\" d=\"M80.2,480.3c0-9.7-.7-19.6-.7-19.6-7.7-49.2-2.6-65.9.6-76,.7-2.1,1.1-4.6,1.4-7.3l3.4,4.7c.3.5.6,1,1,1.4.9,28.9,2.7,72.9-5.7,96.9Z\"/>\n    <path class=\"st0\" d=\"M165.3,449.4c2.1,5.8,2.2,19.8,1.2,31,3.6-12.6,5.2-28.6,6.2-47.6,1.1-23-7.1-31.3-15.5-43-4.2,33.7,5.4,52,8.1,59.6Z\"/>\n    <path class=\"st0\" d=\"M186.5,480.3c0-9.7.7-19.6.7-19.6,7.7-49.2,2.6-65.9-.6-76-.7-2.1-1.1-4.6-1.4-7.3l-3.4,4.7c-.3.5-.6,1-1,1.4-.9,28.9-2.7,72.9,5.7,96.9Z\"/>\n    <path class=\"st0\" d=\"M419.8,443.4c-.7,2.2-1.5,4.9-2.2,7.8-4.6,2.1-9.1-1.5-9.6-11.2h0c3.2-17.1,2.9-35.1,3.3-51.3,0,0,4.4-6.3,6.9-15.9.3,2.9.6,5.8,1.1,8.9.7,4.3,2,8.9,4.2,14.4,2,22.9-.7,37.8-3.8,47.2Z\"/>\n    <path class=\"st0\" d=\"M411.3,388.7c-.4,16.2-.2,34.2-3.3,51.2h0c-.1.7-.2,1.3-.4,2-3,15-11.3,15.4-18.7-3.4h0c-2.1-14.6-1.7-24.5-.4-32.1,5.3-9,9.7-17.2,13.3-24.6,1.4-2.8,2.6-5.4,3.8-7.9,2.2,8.2,5.7,14.8,5.7,14.8Z\"/>\n    <path class=\"st0\" d=\"M485,439.6c-.4,12-4.3,14.8-9.8,10.6-.7-2.6-1.3-4.9-1.9-6.8-3.1-9.4-5.7-24.3-3.8-47.2,2.2-5.5,3.5-10.2,4.2-14.4.6-3.1.9-6,1.1-8.9,2.6,9.5,6.9,15.9,6.9,15.9.4,16.1.2,33.9,3.3,50.9Z\"/>\n    <path class=\"st0\" d=\"M504.1,438.5h0c-7.5,18.8-15.7,18.4-18.7,3.4-.2-.8-.3-1.5-.4-2.3-3.1-16.9-2.9-34.8-3.3-50.9,0,0,3.4-6.6,5.7-14.8,1.2,2.5,2.4,5.2,3.8,7.9,3.6,7.4,8.1,15.6,13.3,24.6,1.3,7.6,1.7,17.5-.4,32.1Z\"/>",
  chest: "<path class=\"st0\" d=\"M133,146.5l-15.2,9.7s-6.1.1-14.7,0c-2.3,0-4.2-.2-5.9-.7-4.4-1.2-7.4-5.6-11.9-14.1,0,0,0,0,0,0-1.4-4.5-7-7.1-7-7.1,8.4-7.6,15.7-18,15.1-29.5h34.5c1.5,2.1,3.2,4.2,5.2,6.1,0,0,0,0,.1.1,0,20.7-.1,35.4-.1,35.4Z\"/>\n    <path class=\"st0\" d=\"M188.4,134.2s-5.6,2.6-7,7.1c0,0,0,0,0,0-4.5,8.5-7.5,12.8-11.9,14.1-1.6.5-3.5.7-5.9.7-8.6.1-14.7,0-14.7,0l-15.2-9.7s-.1-14.7-.1-35.4c0,0,0,0,.1-.1,1.9-1.9,3.7-4,5.2-6.1h34.5c-.7,11.5,6.6,21.9,15.1,29.5Z\"/>",
  forearms: "<path class=\"st0\" d=\"M54,196.8c-1.8,3.6-3.1,7.6-4.2,11.8-1.1,1.1-2,2.2-2.6,3.2-4,7.3-10.2,22.6-17.5,34-1.5-.4-3-.6-4.6-.5,8.7-19.2,9.3-26.9,12.1-37.8,4.6-18,15.4-25.3,15.4-25.3,1.3,8.4,1.5,14.7,1.5,14.7Z\"/>\n    <path class=\"st0\" d=\"M72.8,195.2c-1.3,6.6-3,12-4.9,16.5-7.1,5.1-14.6,11.4-17,24.9t0,0c-4.9,6.8-10,14.9-10,14.9,0,0-2.7-2.3-6.6-4.2,2-2.3,5.6-6.9,11.5-15.9,8.1-12.4,19.1-28.5,27-36.2Z\"/>\n    <path class=\"st0\" d=\"M73,193.7c0,.5-.2,1-.3,1.5h0c-7.9,7.7-18.9,23.8-27,36.2-5.9,9-9.5,13.6-11.5,15.9-1.4-.6-2.9-1.2-4.6-1.6,7.3-11.4,13.5-26.7,17.5-34,.6-1,1.5-2.1,2.6-3.2,5.6-5.4,17-11.6,23.2-14.8Z\"/>\n    <path class=\"st0\" d=\"M74.3,186.1c-.2.5-.3.9-.3.9-.3,2.4-.6,4.6-1,6.7-6.3,3.2-17.7,9.4-23.2,14.8,1.1-4.2,2.4-8.2,4.2-11.8,1-2.1,2.1-4,3.4-5.8,5.4-.9,16.9-4.9,16.9-4.9Z\"/>\n    <path class=\"st0\" d=\"M67.9,211.7c-3.9,9.3-8.6,14.8-12,18.5-1.5,1.7-3.2,3.9-5,6.4,2.4-13.4,9.9-19.8,17-24.9Z\"/>\n    <path class=\"st0\" d=\"M212.6,196.8c1.8,3.6,3.1,7.6,4.2,11.8,1.1,1.1,2,2.2,2.6,3.2,4,7.3,10.2,22.6,17.5,34,1.5-.4,3-.6,4.6-.5-8.7-19.2-9.3-26.9-12.1-37.8-4.6-18-15.4-25.3-15.4-25.3-1.3,8.4-1.5,14.7-1.5,14.7Z\"/>\n    <path class=\"st0\" d=\"M193.9,195.2c1.3,6.6,3,12,4.9,16.5,7.1,5.1,14.6,11.4,17,24.9t0,0c4.9,6.8,10,14.9,10,14.9,0,0,2.7-2.3,6.6-4.2-2-2.3-5.6-6.9-11.5-15.9-8.1-12.4-19.1-28.5-27-36.2Z\"/>\n    <path class=\"st0\" d=\"M193.6,193.7c0,.5.2,1,.3,1.5h0c7.9,7.7,18.9,23.8,27,36.2,5.9,9,9.5,13.6,11.5,15.9,1.4-.6,2.9-1.2,4.6-1.6-7.3-11.4-13.5-26.7-17.5-34-.6-1-1.5-2.1-2.6-3.2-5.6-5.4-17-11.6-23.2-14.8Z\"/>\n    <path class=\"st0\" d=\"M192.3,186.1c.2.5.3.9.3.9.3,2.4.6,4.6,1,6.7,6.3,3.2,17.7,9.4,23.2,14.8-1.1-4.2-2.4-8.2-4.2-11.8-1-2.1-2.1-4-3.4-5.8-5.4-.9-16.9-4.9-16.9-4.9Z\"/>\n    <path class=\"st0\" d=\"M198.7,211.7c3.9,9.3,8.6,14.8,12,18.5,1.5,1.7,3.2,3.9,5,6.4-2.4-13.4-9.9-19.8-17-24.9Z\"/>\n    <path class=\"st0\" d=\"M373.9,186.1s-.2.3-.6.8c-5.1,3.8-11.6,7.2-16.6,9.6,3.6-8,6.4-10.4,6.4-10.4,4.1-3.7,7.7-6.3,10.6-8,0,2.4.1,5.2.2,8Z\"/>\n    <path class=\"st0\" d=\"M373.3,186.9c-2.2,3.1-10.8,15.2-15.1,22.3-2.9,4.8-6.6,13.5-13.2,26.2,1.1-3.9,2.4-9,4-15.5,2.6-10.7,5.3-18.2,7.7-23.3,5-2.4,11.4-5.8,16.6-9.6Z\"/>\n    <path class=\"st0\" d=\"M373.9,198.9c-.1,3.8-.4,7.1-.9,9.3-1.8,7.9-17.4,37.7-24.1,45-4.9-.1-8.6-4.1-8.6-4.1,0,0,1.2-1.2,4.7-13.7t0,0c6.7-12.6,10.3-21.4,13.2-26.2,4.3-7.1,12.9-19.2,15.1-22.3.2-.1.4-.3.6-.4,0,4.2,0,8.6,0,12.5Z\"/>\n    <path class=\"st0\" d=\"M388.1,185.5c-1.8,33.9-13.4,45-18.9,51-5.5,6-14.1,20.3-14.1,20.3-2.3-1.9-6.1-3.6-6.1-3.6,6.7-7.3,22.3-37.1,24.1-45,.5-2.2.8-5.5.9-9.3,4.1-3.1,10.5-8.4,14.2-13.4Z\"/>\n    <path class=\"st0\" d=\"M536.2,196.5c-5-2.4-11.4-5.8-16.6-9.6-.4-.5-.6-.8-.6-.8,0-2.9.1-5.6.2-8,2.8,1.8,6.5,4.4,10.6,8,0,0,2.8,2.4,6.4,10.4Z\"/>\n    <path class=\"st0\" d=\"M548,235.4c-6.7-12.6-10.3-21.4-13.2-26.2-4.3-7.1-12.9-19.2-15.1-22.3,5.1,3.8,11.6,7.2,16.6,9.6,2.4,5.2,5.1,12.6,7.7,23.3,1.6,6.5,2.9,11.6,4,15.5Z\"/>\n    <path class=\"st0\" d=\"M552.7,249.1s-3.7,4-8.6,4.1c-6.7-7.3-22.3-37.1-24.1-45-.5-2.2-.8-5.5-.9-9.3,0-3.9,0-8.3,0-12.5.2.1.4.3.6.4,2.2,3.1,10.8,15.2,15.1,22.3,2.9,4.8,6.6,13.5,13.2,26.2t0,0c3.5,12.5,4.7,13.7,4.7,13.7Z\"/>\n    <path class=\"st0\" d=\"M544.1,253.2s-3.8,1.7-6.1,3.6c0,0-8.6-14.2-14.1-20.3-5.5-6-17.1-17.1-18.9-51,3.6,5,10.1,10.3,14.2,13.4.1,3.8.4,7.1.9,9.3,1.8,7.9,17.4,37.7,24.1,45Z\"/>",
  glutes: "<path class=\"st0\" d=\"M446.5,256.8v24c-3.7,1.7-7.4,5.8-9.5,8.5-1.4,1.7-3.4,2.7-5.6,2.7h-24.4s-2.3-.5,1.5-13.9c3.3-11.6-1.7-16.9-9.6-18.7,2.7-8.4,4.9-14.6,5.3-15.5h0c5.1-3.2,10.9-7.4,14.5-12,1.9-2.4,3.6-5.3,5.4-8.6,9.9,7.9,19.8,17.8,22.5,33.5Z\"/>\n    <path class=\"st0\" d=\"M484.6,278.1c3.8,13.4,1.5,13.9,1.5,13.9h-24.4c-2.2,0-4.3-1-5.6-2.7-2.2-2.7-5.8-6.8-9.5-8.5v-24c2.8-15.7,12.6-25.6,22.5-33.5,1.8,3.3,3.6,6.2,5.4,8.6,3.6,4.6,9.3,8.8,14.5,12h0c.3.9,2.6,7.1,5.3,15.5-8,1.8-12.9,7.1-9.6,18.7Z\"/>",
  hamstrings: "<path class=\"st0\" d=\"M434.7,338.4s0,0,0,0c-4.3,8.1-6.6,27-6.6,27-1.9,12.4-8.6,16.2-8.6,16.2-.6-3.1-.9-6-1.1-8.9-.6-6.4-1.1-12.8-3.8-21.5.2-.5.3-1,.4-1.5,2.8-10.6,3.3-32.9,5.2-57.8h5.8c2.3,8.5,7.1,16.1,8.8,46.4Z\"/>\n    <path class=\"st0\" d=\"M420,292.1c-1.8,25-2.3,47.2-5.2,57.8-.1.5-.3,1-.4,1.5-1.6,5.4-4.4,13.1-8.8,22.5-1.2,2.5-2.4,5.2-3.8,7.9-1.3-2.8-3.5-7.9-5.9-15.4,0,0-.7-3.7-1.6-9.4-3-24.2-.3-42.6,12.6-64.9h13.1Z\"/>\n    <path class=\"st0\" d=\"M401.8,381.9c-3.6,7.4-8.1,15.6-13.3,24.6,1-5.7,2.5-10,4-14,3.9-10.6,3.4-25.9,3.4-25.9,2.4,7.5,4.6,12.6,5.9,15.4Z\"/>\n    <path class=\"st0\" d=\"M428,365.5c-.1,19.7-4.4,30.7-4.4,30.7-2.2-5.5-3.5-10.2-4.2-14.4,0,0,6.7-3.8,8.6-16.2Z\"/>\n    <path class=\"st0\" d=\"M478.6,351.4c-2.7,8.6-3.2,15.1-3.8,21.5-.3,2.9-.6,5.8-1.1,8.9,0,0-6.7-3.8-8.6-16.2,0,0-2.3-18.9-6.6-27,0,0,0,0,0,0,1.7-30.3,6.6-37.9,8.8-46.4h5.8c1.8,25,2.3,47.2,5.2,57.8.1.5.3,1,.4,1.5Z\"/>\n    <path class=\"st0\" d=\"M498.7,357c-.9,5.8-1.6,9.4-1.6,9.4-2.4,7.5-4.6,12.6-5.9,15.4-1.4-2.8-2.6-5.4-3.8-7.9-4.4-9.5-7.2-17.1-8.8-22.5-.2-.5-.3-1-.4-1.5-2.8-10.6-3.3-32.9-5.2-57.8h13.1c12.9,22.3,15.7,40.7,12.6,64.9Z\"/>\n    <path class=\"st0\" d=\"M504.5,406.4c-5.3-9-9.7-17.2-13.3-24.6,1.3-2.8,3.5-7.9,5.9-15.4,0,0-.5,15.4,3.4,25.9,1.5,4,3,8.4,4,14Z\"/>\n    <path class=\"st0\" d=\"M473.7,381.8c-.7,4.3-2,8.9-4.2,14.4,0,0-4.3-11-4.4-30.7,1.9,12.4,8.6,16.2,8.6,16.2Z\"/>",
  quads: "<path class=\"st0\" d=\"M118.2,344.3h0c-2.2,8.5-2.7,14.9-2.7,14.9,0,5.4-.3,10.1-1,14.1-1-6.3-1.6-14-2-22.1-.9-17.9-.9-37.6-3.1-47.2-.2-.7-.3-1.3-.5-2.1-2.9-13.4-6.2-34.6-5.3-47.7,1.1,1.1,2.3,2.3,3.5,3.5.1.1.3.3.4.4-.2,11.2,3.7,23.6,4.6,26.4.1.4.2.6.2.6,2.1,6,6.1,18.9,5.3,35.2-.3,7.1,0,16.1.5,23.9Z\"/>\n    <path class=\"st0\" d=\"M109,301.9c-1.6,7.8-6.1,29.7-8,41.3-.3,1.2-.5,2.8-.7,4.7,0,0,0,0,0,0-1.2,6.4-3.8,10.5-5.9,12.8-1.1,1.3-3.2.8-3.6-.9-.4-1.7-1-4-1.6-6.7-3.9-16.2-11-47.1-11-57.2s6.9-26.8,20.2-46.9c1.6,1.5,3.3,3.3,5.2,5.1-.8,13.1,2.4,34.3,5.3,47.7Z\"/>\n    <path class=\"st0\" d=\"M112.6,351.2c-1.4,4.6-4.8,12.4-10.7,13.5-1.8-6.5-1.9-12.4-1.5-16.7,0,0,0,0,0,0,0-.5.2-1,.2-1.5.1-1,.3-2,.5-3.2,1.9-11.7,6.3-33.5,8-41.3.2.7.3,1.4.5,2.1,2.2,9.6,2.2,29.3,3.1,47.2Z\"/>\n    <path class=\"st0\" d=\"M157.6,301.9c-.2.7-.3,1.4-.5,2.1-2.2,9.6-2.2,29.3-3.1,47.2-.4,8.1-1,15.8-2,22.1-.7-4-1.1-8.7-1-14.1,0,0-.5-6.5-2.7-14.9h0c.5-7.8.8-16.8.5-24-.8-16.3,3.3-29.2,5.3-35.2,0,0,0-.2.2-.6,1-2.9,4.9-15.3,4.6-26.4.1-.2.3-.3.4-.4,1.2-1.2,2.4-2.4,3.5-3.5.8,13.1-2.4,34.3-5.3,47.7Z\"/>\n    <path class=\"st0\" d=\"M188.4,296c0,10.1-7.1,41.1-11,57.2-.6,2.7-1.2,5-1.6,6.7-.4,1.6-2.5,2.1-3.6.9-2.1-2.3-4.7-6.3-5.9-12.8,0,0,0,0,0,0-.2-2-.5-3.6-.7-4.7-1.9-11.7-6.3-33.5-8-41.3,2.9-13.4,6.2-34.6,5.3-47.7,1.9-1.8,3.6-3.6,5.2-5.1,13.4,20.1,20.2,33.6,20.2,46.9Z\"/>\n    <path class=\"st0\" d=\"M154.1,351.2c1.4,4.6,4.8,12.4,10.7,13.5,1.8-6.5,1.9-12.4,1.5-16.7,0,0,0,0,0,0,0-.5-.2-1-.2-1.5-.1-1-.3-2-.5-3.2-1.9-11.7-6.3-33.5-8-41.3-.2.7-.3,1.4-.5,2.1-2.2,9.6-2.2,29.3-3.1,47.2Z\"/>\n    <path class=\"st0\" d=\"M408.4,278.1c-3.8,13.4-1.5,13.9-1.5,13.9-12.9,22.3-15.7,40.7-12.6,64.9-2.2-13.9-5.9-40.1-4.8-56,.9-12.8,5.5-29.5,9.3-41.5,8,1.8,12.9,7.1,9.6,18.7Z\"/>\n    <path class=\"st0\" d=\"M498.7,357c3-24.2.3-42.6-12.6-64.9,0,0,2.3-.5-1.5-13.9-3.3-11.6,1.7-16.9,9.6-18.7,3.8,12,8.4,28.7,9.3,41.5,1.1,16-2.5,42.1-4.8,56Z\"/>",
  shoulders: "<path class=\"st0\" d=\"M78.3,134.2c-7,6.3-14.8,10.7-19.6,12.3,0,0-3.6-15.5,3.1-31.3,6.7-15.8,26-16.3,30-17.8.9,2.5,1.4,5,1.5,7.4.7,11.5-6.6,21.9-15.1,29.5Z\"/>\n    <path class=\"st0\" d=\"M188.4,134.2c7,6.3,14.8,10.7,19.6,12.3,0,0,3.6-15.5-3.1-31.3-6.7-15.8-26-16.3-30-17.8-.9,2.5-1.4,5-1.5,7.4-.7,11.5,6.6,21.9,15.1,29.5Z\"/>\n    <path class=\"st0\" d=\"M413.8,121.5c-4.1,8.4-10.7,14.6-17,19.4,0,0,0,0-.2,0-1.5.9-13.7,8.2-25,11.4-2.8-32.4,9.1-42.4,18.9-45.6h0c4.6-.6,8.7.6,13.1,4.4,3.9,3.4,7.3,7,10.2,10.3Z\"/>\n    <path class=\"st0\" d=\"M521.4,152.4c-11.3-3.2-23.5-10.5-25-11.4-.1,0-.2,0-.2,0-6.3-4.7-12.9-11-17-19.4,2.8-3.4,6.2-7,10.2-10.3,4.4-3.8,8.5-5,13.1-4.4h0c9.7,3.2,21.7,13.2,18.9,45.6Z\"/>"
};
// <<< MUSCLE_FIGURES <<<

// True when an exercise should use the built-in countdown timer (a hold),
// rather than weight/reps rows (strength) or a minutes box (steady cardio).
function isTimedHoldExercise(exerciseInfo, plannedEx) {
  if (!exerciseInfo) return false;
  if (exerciseInfo.type === "timed") return true;
  // A plain duration target (e.g. "30 min") is steady cardio, not a hold.
  if (plannedEx && Number(plannedEx.targetDuration) > 0 && exerciseInfo.type === "cardio") return false;
  return TIMED_HOLD_IDS.includes(exerciseInfo.id);
}

let planImportPreview = null;
let planImportSummary = "";
let planImportMessage = "";

// Plan editing state: which routine (if any) is expanded into its edit form,
// and a snapshot of the routine taken when edit mode opened so Cancel can revert
// all changes.
let editingRoutineId = null;
let routineEditSnapshot = null;
let routineEditIsNew = false;

// The Plan "add an exercise" picker: a searchable, photo-row sheet that replaces
// the old long <select>. routineId is the routine being added to (null = closed);
// query is the live search text. Mirrors the live-workout add-exercise sheet.
let planPicker = { routineId: null, query: "" };

// Shared milestone-goal editor (Plan tab "Add goal"/"Edit" and the Progress
// focus-goal card's edit icon all open this same modal). step "pick" is the
// exercise-choice sheet (new goals only); "edit" is the target-fields form.
let goalEditor = { step: "closed", goalId: null, exerciseId: null, exerciseName: "", targetWeight: "", targetReps: "", targetSets: "", note: "", query: "" };

function getTodayDateString() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

function getDayOfWeek() {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
}

// Which day's planned workout the Today tab is currently showing. Defaults to
// the real today, but the day-switcher lets Daniel preview/start any day (e.g.
// do tomorrow's workout today). Saving always records the real today's date.
let viewedDay = getDayOfWeek();

// Week order for the prev/next day arrows (Monday-first, as Daniel reads a week).
const WEEK_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function shiftViewedDay(delta) {
  const current = WEEK_ORDER.indexOf(viewedDay);
  const base = current === -1 ? 0 : current;
  const next = (base + delta + WEEK_ORDER.length) % WEEK_ORDER.length;
  viewedDay = WEEK_ORDER[next];
}

function resetViewedDayToToday() {
  viewedDay = getDayOfWeek();
}

// Update the day-switcher row: the day name, a "today" hint, and the reset
// button. Hidden while a live workout is in progress (you can't change day
// mid-workout) and shown in the calm preview / rest states.
function updateDaySwitch(mode) {
  if (!todayDaySwitch) return;
  const show = mode === "preview" || mode === "rest";
  todayDaySwitch.hidden = !show;
  if (!show) return;

  const isRealToday = viewedDay === getDayOfWeek();
  if (todayDayName) {
    todayDayName.textContent = isRealToday
      ? `${formatDayName(viewedDay)} (today)`
      : formatDayName(viewedDay);
  }
  if (dayTodayResetButton) dayTodayResetButton.hidden = isRealToday;
}

function getRoutineById(routineId) {
  const data = getLocalData();
  return data.routines?.find((r) => r.id === routineId) || null;
}

function getTodayPlannedRoutine() {
  const data = getLocalData();
  const dayOfWeek = viewedDay || getDayOfWeek();
  const weeklyPlan = data.weeklyPlan || getStarterWeeklyPlan();
  const routineId = weeklyPlan[dayOfWeek];

  if (!routineId) return null;
  return getRoutineById(routineId);
}

function isTodayCompleted() {
  const data = getLocalData();
  const todayStr = getTodayDateString();
  return data.completedWorkouts?.includes(todayStr) || false;
}

function markTodayAsCompleted() {
  const data = getLocalData();
  const todayStr = getTodayDateString();
  data.completedWorkouts = Array.isArray(data.completedWorkouts) ? data.completedWorkouts : [];
  if (!data.completedWorkouts.includes(todayStr)) {
    data.completedWorkouts.push(todayStr);
  }
  data.updatedAt = new Date().toISOString();
  data.updatedBy = getDeviceId();
  saveLocalData(data);
  markPendingData(data);
}

function getTodayWorkoutProgress() {
  if (!activeWorkout.exercises || activeWorkout.exercises.length === 0) {
    return { total: 0, done: 0, percent: 0 };
  }

  const total = activeWorkout.exercises.length;
  const done = activeWorkout.exercises.filter((ex) => isExerciseLogged(ex) || ex.skipped).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return { total, done, percent };
}

function getExerciseById(exerciseId) {
  return exercises.find((exercise) => exercise.id === exerciseId) || null;
}
