const DROPBOX_AUTHORIZE_URL = "https://www.dropbox.com/oauth2/authorize";
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload";
const DROPBOX_DOWNLOAD_URL = "https://content.dropboxapi.com/2/files/download";
const DATA_FILE_PATH = "/04_Technical/06_Side_Projects/Workout and Nutrition App/data/workout-data.json";
const APP_VERSION = "1.0.29";
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

// ===== F3: muscle-group anatomy figures + worked-muscle heat map =====
// Maps a library exercise's primaryMuscle/secondaryMuscles (real anatomy) onto
// the 10 figure groups the prepared SVGs cover (mockups/MuscleGroups/, synced
// in via MUSCLE_FIGURES above). A few real muscles don't get their own figure
// and fall back to the closest visible group: traps -> back, adductors ->
// quads, abductors -> glutes.
const MUSCLE_GROUP_MAP = {
  chest: "chest",
  "lower back": "back",
  "middle back": "back",
  lats: "back",
  traps: "back",
  shoulders: "shoulders",
  biceps: "arms",
  triceps: "arms",
  forearms: "forearms",
  abdominals: "abs",
  quadriceps: "quads",
  adductors: "quads",
  hamstrings: "hamstrings",
  glutes: "glutes",
  abductors: "glutes",
  calves: "calves"
};

const MUSCLE_FIGURE_GROUP_ORDER = ["chest", "back", "shoulders", "arms", "forearms", "abs", "quads", "hamstrings", "glutes", "calves"];
const MUSCLE_FIGURE_GROUP_LABELS = {
  chest: "Chest", back: "Back", shoulders: "Shoulders", arms: "Arms", forearms: "Forearms",
  abs: "Abs", quads: "Quads", hamstrings: "Hamstrings", glutes: "Glutes", calves: "Calves"
};

// Per-exercise muscle-group involvement, weighted 0-1. The primary muscle is
// full weight; hand-curated secondary muscles (see exercises.json) are
// lighter. "full body" moves (burpees, soccer, ...) have no single dominant
// muscle, so every group gets one flat, modest weight instead of guessing.
function getExerciseMuscleWeights(lib) {
  const weights = {};
  if (!lib) return weights;
  if (lib.primaryMuscle === "full body") {
    MUSCLE_FIGURE_GROUP_ORDER.forEach((g) => { weights[g] = 0.3; });
  } else {
    const primaryGroup = MUSCLE_GROUP_MAP[lib.primaryMuscle];
    if (primaryGroup) weights[primaryGroup] = 1;
  }
  (Array.isArray(lib.secondaryMuscles) ? lib.secondaryMuscles : []).forEach((entry) => {
    const group = MUSCLE_GROUP_MAP[entry?.muscle];
    const weight = Number(entry?.weight);
    if (!group || !Number.isFinite(weight) || weight <= 0) return;
    weights[group] = Math.max(weights[group] || 0, weight);
  });
  return weights;
}

// Compose a front+back figure from the shared outline plus one lime fill
// layer per group with nonzero weight (opacity = weight). Fill layers render
// first and the outline on top, matching the source SVGs' own stacking (the
// outline's anatomical crease lines are meant to show over a filled muscle).
function buildMuscleFigure(weights, opts = {}) {
  const ariaLabel = opts.ariaLabel || "Muscles worked";
  const layers = MUSCLE_FIGURE_GROUP_ORDER
    .filter((g) => (weights[g] || 0) > 0)
    .map((g) => `<g class="muscle-fill" style="opacity:${Math.min(1, weights[g]).toFixed(2)}">${MUSCLE_FIGURE_FILLS[g]}</g>`)
    .join("");
  return `
    <svg class="muscle-figure${opts.className ? ` ${opts.className}` : ""}" viewBox="${MUSCLE_FIGURE_VIEWBOX}" role="img" aria-label="${escapeHtml(ariaLabel)}">
      ${layers}
      <g class="muscle-outline">${MUSCLE_FIGURE_OUTLINE}</g>
    </svg>`;
}

// Shared badge markup for both the how-to sheet and the live-workout hero -
// same figure, sized/positioned differently by the wrapper class.
function renderMuscleBadge(exerciseId, wrapperClass, ariaLabel) {
  const weights = getExerciseMuscleWeights(getExerciseById(exerciseId));
  if (!Object.keys(weights).length) return "";
  return `<div class="${wrapperClass}">${buildMuscleFigure(weights, { className: "muscle-figure-badge", ariaLabel })}</div>`;
}

function getMetricProfile(exerciseInfo, plannedEx = {}) {
  if (plannedEx.metricProfile) return plannedEx.metricProfile;
  if (!exerciseInfo) return "strength-weighted";
  if (exerciseInfo.metricProfile) return exerciseInfo.metricProfile;
  if (exerciseInfo.type === "timed") return "timed-hold";
  if (exerciseInfo.type === "sport") return "sport-duration";
  if (exerciseInfo.type === "cardio") {
    return exerciseInfo.id === "peloton-tread" || exerciseInfo.id === "peloton-bike"
      ? "peloton"
      : "cardio-duration";
  }
  const tags = Array.isArray(exerciseInfo.tags) ? exerciseInfo.tags : [];
  const text = `${exerciseInfo.area || ""} ${exerciseInfo.primaryMuscle || ""}`.toLowerCase();
  if (tags.includes("bodyweight") || text.includes("core") || text.includes("abs")) return "strength-bodyweight";
  return "strength-weighted";
}

function usesWeightMetric(ex) {
  return ex?.metricProfile !== "strength-bodyweight";
}

// ===== Barbell plate helper =====
// Daniel's barbell weight in pounds. If his bar is NOT a standard 45 lb Olympic
// bar, change this one number (e.g. 35, or 33 for a 15 kg bar) and the live
// workout's plate hint updates everywhere automatically.
const BAR_WEIGHT_LB = 45;
// Plates available per side, heaviest first (standard home/Olympic set).
const AVAILABLE_PLATES_LB = [45, 35, 25, 10, 5, 2.5];

// A logged exercise carries only an exerciseId; the library entry holds the
// equipment tag, so look it up to decide if this is a barbell lift.
function isBarbellLift(ex) {
  return getExerciseById(ex?.exerciseId)?.equipment === "barbell";
}

// Given a TOTAL target weight (bar + all plates), work out what to load on EACH
// side of the bar. Returns { status, perSide, leftover }.
//   status: "below-bar" | "bar-only" | "ok" | "approx"
function computePlateLoad(total, bar = BAR_WEIGHT_LB, plates = AVAILABLE_PLATES_LB) {
  const t = Number(total) || 0;
  if (t < bar) return { status: "below-bar", perSide: [], leftover: 0 };
  if (t === bar) return { status: "bar-only", perSide: [], leftover: 0 };
  let remaining = (t - bar) / 2; // weight needed on each side
  const perSide = [];
  for (const p of plates) {
    while (remaining >= p - 1e-9) {
      perSide.push(p);
      remaining = Math.round((remaining - p) * 100) / 100;
    }
  }
  return { status: remaining > 1e-9 ? "approx" : "ok", perSide, leftover: remaining };
}

function formatPlateNum(p) {
  return Number.isInteger(p) ? String(p) : String(p); // 2.5 stays "2.5"
}

// The live barbell screen is dialed in as PLATES PER SIDE, but set.weight stays
// the TOTAL (bar + both sides) so Progress/PRs keep reading real total weight.
// This converts a stored total back to the per-side number shown in the stepper.
function perSideFromTotal(total) {
  const perSide = ((Number(total) || 0) - BAR_WEIGHT_LB) / 2;
  return perSide > 0 ? Math.round(perSide * 100) / 100 : 0;
}

// Returns a small HTML hint that explains the additive math for barbell lifts
// ("X per side + 45 bar = Y total"), "" otherwise.
function renderPlateHint(ex, weight) {
  if (!isBarbellLift(ex)) return "";
  const total = Number(weight) || 0;
  const { status, perSide, leftover } = computePlateLoad(total);
  let text;
  if (status === "below-bar" || status === "bar-only") {
    text = `Just the empty bar &middot; <strong>${BAR_WEIGHT_LB} lb</strong> total`;
  } else {
    const build = perSide.map(formatPlateNum).join(" + ");
    const extra = status === "approx" ? ` (+${formatPlateNum(leftover)} short)` : "";
    text = `<strong>${formatPlateNum(total)} lb</strong> total &middot; load ${escapeHtml(build)}/side + ${BAR_WEIGHT_LB} bar${extra}`;
  }
  return `<p class="lw-plate-hint" aria-live="polite">${text}</p>`;
}

// ===== Dual weight-tower (cable) helper =====
// A small set of cable/functional-trainer exercises (Cable Crossover, Incline
// Cable Fly, Lat Pulldown, Seated Cable Row on Daniel's Ares 2.0 rack) pull
// off two fully independent weight stacks. Unlike a barbell, the logged/target
// number here is naturally ALREADY per-side (that's what you dial in on each
// stack) -- there's nothing to derive, just label it so it's never mistaken
// for a combined total. Flip the catalog's dualStack: true on any exercise to
// add/remove it from this list.
function isDualStackLift(ex) {
  return getExerciseById(ex?.exerciseId)?.dualStack === true;
}

// "lb" normally, "lb per side" for a flagged dual-stack exercise.
function weightUnitLabel(ex) {
  return isDualStackLift(ex) ? "lb per side" : "lb";
}

// Returns a small HTML hint showing the combined total for a flagged
// dual-stack exercise ("45 lb per side · 90 lb combined"), "" otherwise.
function renderDualStackHint(ex, weight) {
  if (!isDualStackLift(ex)) return "";
  const perSide = Number(weight) || 0;
  return `<p class="lw-plate-hint" aria-live="polite"><strong>${formatPlateNum(perSide)} lb</strong> per side &middot; ${formatPlateNum(perSide * 2)} lb combined</p>`;
}

function getExerciseSubtypeOptions(exerciseId) {
  if (exerciseId === "peloton-tread") return ["Incline Walk", "Run", "Walk", "Run + Walk", "Hike"];
  if (exerciseId === "peloton-bike") return ["Just Ride", "Ride Class", "Power Zone"];
  return [];
}

function defaultExerciseSubtype(exerciseId) {
  return getExerciseSubtypeOptions(exerciseId)[0] || "";
}

function latestLoggedEntryForExercise(exerciseId) {
  const data = getLocalData();
  const workouts = Array.isArray(data.workouts) ? data.workouts.slice() : [];
  workouts.sort((a, b) => {
    const ad = Date.parse(a.savedAt || a.startedAt || a.date || 0) || 0;
    const bd = Date.parse(b.savedAt || b.startedAt || b.date || 0) || 0;
    return bd - ad;
  });

  for (const workout of workouts) {
    const entries = Array.isArray(workout.entries) ? workout.entries : [];
    const entry = entries.find((item) => item?.exerciseId === exerciseId && !item.skipped);
    if (entry) return entry;
  }
  return null;
}

function defaultRoutineExerciseFromHistory(exerciseId) {
  const entry = latestLoggedEntryForExercise(exerciseId);
  if (!entry) return null;

  if (entry.type === "cardio" || entry.type === "sport") {
    const targetDuration = Math.round(Number(entry.durationMinutes) || Number(entry.planned?.durationMinutes) || 0);
    if (!(targetDuration > 0)) return null;
    return {
      exerciseId,
      targetDuration,
      ...(entry.subtype || entry.planned?.subtype ? { targetSubtype: entry.subtype || entry.planned?.subtype } : {})
    };
  }

  if (entry.type === "timed") {
    const holds = Array.isArray(entry.holds) ? entry.holds.filter((hold) => hold?.done !== false) : [];
    const seconds = Number(holds[0]?.seconds) || Number(entry.actualSummary?.seconds) || Number(entry.planned?.seconds) || 0;
    const sets = holds.length || Number(entry.actualSummary?.sets) || Number(entry.planned?.sets) || 0;
    if (!(sets > 0 && seconds > 0)) return null;
    return { exerciseId, targetSets: Math.round(sets), targetReps: Math.round(seconds), targetRest: 0 };
  }

  const sets = Array.isArray(entry.sets) ? entry.sets.filter((set) => set?.done !== false) : [];
  const summarySets = Number(entry.actualSummary?.sets) || Number(entry.planned?.sets) || 0;
  const setCount = sets.length || summarySets;
  const topWeight = sets.reduce((max, set) => Math.max(max, Number(set.weight) || 0), 0);
  const summaryWeight = Number(entry.actualSummary?.weight) || Number(entry.planned?.weight) || 0;
  const targetWeight = topWeight || summaryWeight;
  const repsAtTop = sets.find((set) => (Number(set.weight) || 0) === topWeight)?.reps;
  const targetReps = Number(repsAtTop) || Number(entry.actualSummary?.reps) || Number(entry.planned?.reps) || 0;
  if (!(setCount > 0 && targetReps > 0)) return null;
  return {
    exerciseId,
    targetSets: Math.round(setCount),
    targetReps: Math.round(targetReps),
    ...(targetWeight > 0 ? { targetWeight } : {}),
    targetRest: 0
  };
}

// Cardio stat fields, each with a clear label + unit. Average power (watts) is a
// Peloton BIKE metric only — the tread has no power meter, so it gets elevation
// instead. Which fields a given exercise shows is decided by getCardioMetrics().
const CARDIO_METRIC_META = {
  output:    { label: "Total Output",     unit: "kJ",    step: "1"   },
  avgPower:  { label: "Average Power",     unit: "watts", step: "1"   },
  distance:  { label: "Distance",          unit: "mi",    step: "0.1" },
  elevation: { label: "Elevation Climbed", unit: "ft",    step: "1"   },
  calories:  { label: "Calories",          unit: "kcal",  step: "1"   }
};

function getCardioMetrics(exerciseId) {
  if (exerciseId === "peloton-bike") return ["output", "avgPower", "distance", "calories"];
  if (exerciseId === "peloton-tread") return ["output", "distance", "elevation", "calories"];
  return ["distance", "elevation", "calories"];
}

// data-hfield name the editor uses for a stat (output -> statOutput, etc.).
function cardioStatField(metric) {
  return "stat" + metric.charAt(0).toUpperCase() + metric.slice(1);
}

// Live-workout field name for a metric (output -> cardioOutput, etc.). These
// are the keys collectCardioStats() reads back off the exercise at save time.
function liveCardioField(metric) {
  return "cardio" + metric.charAt(0).toUpperCase() + metric.slice(1);
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function makeTodayExercise(plannedEx, source = "planned") {
  // If the planned exercise was removed from the library, show a clear
  // placeholder rather than silently substituting a different exercise.
  const exerciseInfo = getExerciseById(plannedEx.exerciseId) || {
    id: plannedEx.exerciseId || "removed",
    name: "(removed exercise)",
    type: plannedEx.targetDuration ? "cardio" : "strength",
    area: "Not in your library",
    icon: "dumbbell"
  };
  // Soccer and other "sport" moves log like cardio (a duration) but with free
  // notes instead of Peloton power numbers.
  const isSport = exerciseInfo.type === "sport";
  const isTimed = !isSport && isTimedHoldExercise(exerciseInfo, plannedEx);
  const isCardio = !isTimed && !isSport && (Boolean(plannedEx.targetDuration) || exerciseInfo.type === "cardio");
  const durationLike = isCardio || isSport;
  const targetSets = Number(plannedEx.targetSets) || (durationLike ? 0 : 3);
  const targetReps = Number(plannedEx.targetReps) || 0;
  const targetWeight = Number(plannedEx.targetWeight) || 0;
  const targetDuration = Number(plannedEx.targetDuration) || (durationLike ? 20 : 0);
  const metricProfile = getMetricProfile(exerciseInfo, plannedEx);
  const targetSubtype = plannedEx.targetSubtype || defaultExerciseSubtype(exerciseInfo.id);
  // Rest target (seconds) between sets/holds. 0 = none. Usually set by the AI
  // coach in the weekly plan, but also editable in the plan; shown as a quiet
  // note on the live set screen, or as a live countdown when restTimer is on.
  const targetRest = Number(plannedEx.targetRest) || 0;
  // A free-text note from the AI coach for this move (e.g. "ease off the last
  // set — you burned out here last week"). Shown as a callout while working out.
  const coachNote = (plannedEx.coachNote || "").trim();
  // When the coach turns the rest into a guided countdown between sets/holds.
  // Only meaningful when targetRest > 0; you can always tap past it.
  const restTimer = Boolean(plannedEx.restTimer) && targetRest > 0;

  // For a held move, the planned target reads like "3 x 45 sec": targetSets
  // holds, each held for some seconds. The seconds come through as the reps
  // number (e.g. "Plank: 3x45") or a duration; default to 45 if not given.
  // Each hold is paged like a set, carrying its own actual seconds, note, and
  // optional effort so e.g. 60/60/45 is captured faithfully.
  const holdSeconds = isTimed ? (targetDuration || targetReps || 45) : 0;
  const holdCount = isTimed ? (targetSets || 1) : 0;
  const holds = Array.from({ length: holdCount }).map(() => ({
    seconds: holdSeconds,
    done: false,
    notes: "",
    difficulty: null
  }));

  // One row per planned set, each holding the weight/reps actually done, a
  // done flag, an optional note, and an optional 1-10 effort. Pre-filled with
  // the planned reps.
  const setCount = targetSets || (durationLike || isTimed ? 0 : 1);
  const sets = Array.from({ length: (isTimed || isSport) ? 0 : setCount }).map(() => ({
    weight: targetWeight,
    reps: targetReps,
    done: false,
    notes: "",
    difficulty: null,
    touchedWeight: false,
    touchedReps: false
  }));

  const type = isSport ? "sport" : (isTimed ? "timed" : (isCardio ? "cardio" : "strength"));

  return {
    id: `today-${exerciseInfo.id}-${randomString(5)}`,
    exerciseId: exerciseInfo.id,
    name: exerciseInfo.name,
    type,
    area: exerciseInfo.area,
    icon: exerciseInfo.icon,
    source,
    targetSets,
    targetReps,
    targetDuration,
    targetWeight,
    targetSubtype,
    metricProfile,
    targetRest,
    restSeconds: targetRest,
    coachNote,
    restTimer,
    sets,
    holds,
    holdSeconds,
    actualDuration: targetDuration || 30,
    cardioDone: false,
    // Optional cardio summary numbers, typed by hand off the machine's summary
    // screen. Which of these actually show is decided by getCardioMetrics().
    // Blank by default; never required.
    cardioOutput: "",
    cardioAvgPower: "",
    cardioDistance: "",
    cardioElevation: "",
    cardioCalories: "",
    notes: "",
    skipped: false,
    // Sport moves (e.g. soccer): a "done" flag and a free-text note, alongside
    // the shared actualDuration minutes above.
    sportDone: false,
    sportNotes: "",
    // Optional overall effort (1-10) for cardio/sport, which have no per-set
    // rows. Strength/timed effort is logged per set/hold instead. null = unrated.
    difficulty: null,
    checked: false
  };
}

function formatTodayTarget(exercise) {
  if (exercise.type === "timed") return `${(exercise.holds || []).length} x ${exercise.holdSeconds || 0} sec planned`;
  if (exercise.type === "cardio" || exercise.type === "sport") return `${exercise.targetDuration || exercise.actualDuration} min planned`;
  if (exercise.targetReps) return `${exercise.targetSets} sets x ${exercise.targetReps} reps planned`;
  return `${exercise.targetSets} sets planned`;
}

function renderStepper(exercise, field, label, step = 1, min = 0, max = 999, suffix = "") {
  const value = Number(exercise[field]) || 0;
  return `
    <div class="today-stepper" data-field="${escapeHtml(field)}">
      <span>${escapeHtml(label)}</span>
      <div class="stepper-controls">
        <button type="button" class="stepper-button" data-action="adjust-today" data-field="${escapeHtml(field)}" data-delta="${-step}" data-min="${min}" data-max="${max}" aria-label="Decrease ${escapeHtml(label)}">-</button>
        <strong>${escapeHtml(value)}${suffix ? ` ${escapeHtml(suffix)}` : ""}</strong>
        <button type="button" class="stepper-button" data-action="adjust-today" data-field="${escapeHtml(field)}" data-delta="${step}" data-min="${min}" data-max="${max}" aria-label="Increase ${escapeHtml(label)}">+</button>
      </div>
    </div>
  `;
}

function renderTodayActualControls(exercise) {
  if (exercise.type === "cardio") {
    return `<div class="today-actual-grid">${renderStepper(exercise, "actualDuration", "Minutes", 5, 0, 240)}</div>`;
  }

  return `
    <div class="today-actual-grid">
      ${renderStepper(exercise, "actualSets", "Sets", 1, 1, 8)}
      ${renderStepper(exercise, "actualReps", "Reps", 1, 0, 50)}
      ${renderStepper(exercise, "actualWeight", "Weight", 5, 0, 500, "lb")}
    </div>
  `;
}

function renderDifficultyScale(exercise) {
  return `
    <div class="today-difficulty" aria-label="Difficulty for ${escapeHtml(exercise.name)}">
      <span>Difficulty</span>
      <div class="difficulty-scale">
        ${Array.from({ length: 10 }).map((_, index) => {
          const value = index + 1;
          const active = value === Number(exercise.difficulty) ? " is-active" : "";
          return `<button type="button" class="difficulty-chip${active}" data-action="set-difficulty" data-value="${value}">${value}</button>`;
        }).join("")}
      </div>
    </div>
  `;
}

function renderExerciseSwapOptions(currentExerciseId) {
  return exercises.map((exercise) => `
    <option value="${escapeHtml(exercise.id)}" ${exercise.id === currentExerciseId ? "selected" : ""}>${escapeHtml(exercise.name)}</option>
  `).join("");
}

function updateTodayProgress() {
  const progress = getTodayWorkoutProgress();
  if (todayProgressNumber) {
    todayProgressNumber.textContent = `${progress.percent}%`;
  }
  if (todayProgressLabel) {
    todayProgressLabel.textContent = progress.total
      ? `${progress.done} of ${progress.total} exercises done`
      : "ready to start";
  }
}

function getCoachMeta(data = getLocalData()) {
  const coach = data.coach && typeof data.coach === "object" ? data.coach : {};
  const parsedLastCheckin = parseCoachCheckinChanges(coach.lastCheckin);
  const savedLastChanges = normalizeCoachChanges(coach.lastChanges);
  const history = Array.isArray(coach.history)
    ? coach.history.map(normalizeCoachHistoryEntry).filter(Boolean).slice(0, 20)
    : [];
  return {
    lastReviewAt: coach.lastReviewAt || "",
    lastReviewType: coach.lastReviewType || "",
    lastReviewDueDate: coach.lastReviewDueDate || "",
    lastCheckin: parsedLastCheckin.checkin || "",
    lastCheckinMeta: coach.lastCheckinMeta || null,
    lastChanges: savedLastChanges.length ? savedLastChanges : parsedLastCheckin.changes,
    history,
    reminderSnoozedUntil: coach.reminderSnoozedUntil || ""
  };
}

function normalizeCoachChanges(changes) {
  if (!Array.isArray(changes)) return [];
  const allowed = new Set(["weight", "swap", "note", "target", "add", "remove", "goal"]);
  return changes.map((change, index) => {
    if (!change || typeof change !== "object") return null;
    const type = String(change.type || "").toLowerCase().trim();
    if (!allowed.has(type)) return null;
    const summary = String(change.summary || "").trim();
    if (!summary) return null;
    const out = {
      id: String(change.id || `c${index + 1}`).trim() || `c${index + 1}`,
      type,
      routines: Array.isArray(change.routines) ? change.routines.map((item) => String(item || "").trim()).filter(Boolean) : [],
      exercise: String(change.exercise || "").trim(),
      summary,
      detail: String(change.detail || "").trim()
    };
    ["targetWeight", "targetReps", "targetSets", "targetDuration"].forEach((key) => {
      const value = Number(change[key]);
      if (Number.isFinite(value) && value > 0) out[key] = value;
    });
    if (change.swapTo) out.swapTo = String(change.swapTo).trim();
    if (change.note) out.note = String(change.note).trim();
    return out;
  }).filter(Boolean).slice(0, 20);
}

function normalizeCoachHistoryEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const parsed = parseCoachCheckinChanges(entry.checkin);
  const checkin = parsed.checkin;
  const generatedAt = String(entry.generatedAt || "").trim();
  if (!checkin || !generatedAt) return null;
  const savedChanges = normalizeCoachChanges(entry.changes);
  return {
    id: String(entry.id || `coach-${generatedAt}`).trim(),
    generatedAt,
    type: entry.type === "deep" ? "deep" : "quick",
    checkin,
    changes: savedChanges.length ? savedChanges : parsed.changes,
    appliedChangeIds: Array.isArray(entry.appliedChangeIds) ? entry.appliedChangeIds.map(String) : [],
    packetMeta: entry.packetMeta || null
  };
}

function parseCoachCheckinChanges(text) {
  const source = String(text || "").trim();
  const fallback = { checkin: source, changes: [] };
  const fenced = source.match(/```json\s*([\s\S]*?)\s*```\s*$/i);
  const openFence = fenced || source.match(/```json\s*([\s\S]*)$/i);
  if (!openFence) return fallback;
  try {
    const parsed = JSON.parse(openFence[1]);
    return {
      checkin: source.slice(0, openFence.index).trim(),
      changes: normalizeCoachChanges(parsed?.changes)
    };
  } catch (_) {
    const recovered = recoverCoachChangeObjects(openFence[1]);
    return {
      checkin: source.slice(0, openFence.index).trim() || source,
      changes: normalizeCoachChanges(recovered)
    };
  }
}

function recoverCoachChangeObjects(jsonText) {
  const start = String(jsonText || "").indexOf("[");
  if (start < 0) return [];
  const objects = [];
  let depth = 0;
  let objectStart = -1;
  let inString = false;
  let escaped = false;
  for (let i = start + 1; i < jsonText.length; i += 1) {
    const char = jsonText[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === "\"") inString = false;
      continue;
    }
    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === "{") {
      if (depth === 0) objectStart = i;
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0 && objectStart >= 0) {
        try { objects.push(JSON.parse(jsonText.slice(objectStart, i + 1))); }
        catch (_) {}
        objectStart = -1;
      }
    }
  }
  return objects;
}

function getActiveReviewDate(data = getLocalData()) {
  const activePlan = { ...getStarterActivePlan(), ...(data.activePlan || {}) };
  const reviewDate = (activePlan.nextReviewDate || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(reviewDate) ? reviewDate : "";
}

function addDaysToDateKey(dateKey, days) {
  const base = toDateKeyDate(dateKey) || new Date();
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function toDateKeyDate(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey || ""))) return null;
  const date = new Date(`${dateKey}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isReviewCycleHandled(coach, reviewDate) {
  return Boolean(reviewDate && coach.lastReviewAt && coach.lastReviewDueDate === reviewDate);
}

function renderReviewReminder() {
  if (!reviewReminder) return;

  const data = getLocalData();
  const coach = getCoachMeta(data);
  const reviewDate = getActiveReviewDate(data);
  const today = getTodayDateString();

  // Only show when a valid review date is set and today is on or past it.
  const isDue = Boolean(reviewDate && today >= reviewDate);
  const snoozed = coach.reminderSnoozedUntil && today <= coach.reminderSnoozedUntil;
  const handled = isReviewCycleHandled(coach, reviewDate);

  if (!isDue || snoozed || handled) {
    reviewReminder.hidden = true;
    return;
  }

  const title = reviewReminder.querySelector("#review-reminder-title");
  if (title) title.textContent = "Review window is open";
  if (reviewReminderSub) {
    const overdue = today > reviewDate;
    reviewReminderSub.textContent = overdue
      ? `Your review was due ${formatWorkoutDate(reviewDate)}. Open Coach for a check-in, or snooze this for a week.`
      : "Open Coach for a check-in, or snooze this for a week.";
  }
  reviewReminder.hidden = false;
}

function snoozeCoachReminder(days = 7) {
  const data = getLocalData();
  data.coach = { ...getCoachMeta(data), reminderSnoozedUntil: addDaysToDateKey(getTodayDateString(), days) };
  commitProgressData(data);
  renderReviewReminder();
  renderCoach();
}

// Switches the Today tab between its three states and shows/hides the
// matching controls. "rest" = nothing planned, "preview" = the calm read-only
// overview with a Start button, "active" = the live logging view.
function setTodayMode(mode) {
  // Full-screen focus: while a workout is running, hide the app chrome (header,
  // banners, bottom nav) via a body class so the live workout reads as its own
  // program. CSS in styles.css keys off body.in-workout.
  document.body.classList.toggle("in-workout", mode === "active");
  if (todayStartRow) todayStartRow.hidden = mode !== "preview";
  // The focused workout (Slice 2) draws its own back / next / save buttons
  // inside the routine list, so the old header back button, add-extra picker,
  // and footer Save bar stay hidden in every mode now.
  if (todayBackButton) todayBackButton.hidden = true;
  if (todayAddExtra) todayAddExtra.hidden = true;
  if (todayFooter) todayFooter.hidden = true;
  if (todayPreviewSub) todayPreviewSub.hidden = mode !== "preview";
  updateDaySwitch(mode);
}

// Plain-language target line for a preview card, e.g. "3 × 8" or "10 min".
function formatPreviewMeta(exercise) {
  if (exercise.type === "timed") {
    return `${(exercise.holds || []).length} × ${exercise.holdSeconds || 0} sec`;
  }
  if (exercise.type === "cardio" || exercise.type === "sport") {
    const mins = exercise.targetDuration || exercise.actualDuration || 0;
    return `${exercise.targetSubtype ? `${exercise.targetSubtype} · ` : ""}${mins} min`;
  }
  if (exercise.targetReps) {
    const weight = Number(exercise.targetWeight) > 0 ? ` · ${exercise.targetWeight} ${weightUnitLabel(exercise)}` : "";
    return `${exercise.targetSets} × ${exercise.targetReps}${weight}`;
  }
  return exercise.targetSets ? `${exercise.targetSets} sets` : "";
}

function renderTodayPreview(routine) {
  // Resolve each planned exercise to read-only display info.
  const items = routine.exercises.map((plannedEx) => makeTodayExercise(plannedEx));

  if (todayPreviewSub) {
    const count = items.length;
    todayPreviewSub.textContent = `${count} exercise${count === 1 ? "" : "s"} planned`;
  }

  todayRoutineList.innerHTML = `${items.map((ex, index) => {
    // Show the exercise's start photo (black & white, like the Library) behind
    // the position number, dimmed so the number stays legible. Falls back to a
    // plain numbered square for moves without a photo.
    const lib = getExerciseById(ex.exerciseId);
    const photo = lib ? getExerciseStartImage(lib) : null;
    const thumb = photo
      ? `<span class="pv-num pv-num-photo" style="background-image:url('${escapeHtml(photo)}')"><span class="pv-num-label">${index + 1}</span></span>`
      : `<span class="pv-num"><span class="pv-num-label">${index + 1}</span></span>`;
    const tag = ex.type === "sport"
      ? `<span class="pv-tag">SPORT</span>`
      : ((ex.type === "cardio" || ex.type === "timed") ? `<span class="pv-tag">TIMED</span>` : "");
    const muscleBadge = renderMuscleBadge(ex.exerciseId, "pv-muscle-badge", `Muscles worked: ${ex.area || ex.name}`);
    return `
    <article class="today-preview-card" data-action="preview-how-to" data-id="${escapeHtml(ex.exerciseId)}" role="button" tabindex="0" aria-label="How to do ${escapeHtml(ex.name)}">
      ${thumb}
      <div class="pv-info">
        <h3 class="pv-name">${escapeHtml(ex.name)}</h3>
        <p class="pv-meta">${escapeHtml(formatPreviewMeta(ex))}</p>
        ${ex.coachNote ? `<p class="pv-note">${getUiIcon("sparkles")}${escapeHtml(ex.coachNote)}</p>` : ""}
      </div>
      <div class="pv-right">${tag}${muscleBadge}</div>
    </article>`;
  }).join("")}${renderWorkoutFlowChoiceSheet()}`;
}

function persistActiveWorkoutDraft() {
  if (!activeWorkout.started) return;
  const draft = {
    savedAt: new Date().toISOString(),
    viewedDay,
    startedAt: activeWorkout.startedAt,
    routineId: activeWorkout.routineId,
    routineName: activeWorkout.routineName,
    isCustom: activeWorkout.isCustom,
    substitutionNote: activeWorkout.substitutionNote,
    replacedRoutineId: activeWorkout.replacedRoutineId,
    replacedRoutineName: activeWorkout.replacedRoutineName,
    exercises: activeWorkout.exercises,
    currentIndex: activeWorkout.currentIndex,
    currentSet: activeWorkout.currentSet,
    phase: activeWorkout.phase,
    flowMode: activeWorkout.flowMode,
    roundNumber: activeWorkout.roundNumber
  };
  // Quota-safe: the in-progress draft is how a workout survives a closed tab, so
  // a full snapshot cache must never block it from being saved.
  setItemSafe(STORAGE.activeWorkoutDraft, JSON.stringify(draft));
}

function clearActiveWorkoutDraft() {
  localStorage.removeItem(STORAGE.activeWorkoutDraft);
}

function readActiveWorkoutDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(STORAGE.activeWorkoutDraft) || "null");
    if (!draft || !Array.isArray(draft.exercises) || draft.exercises.length === 0) return null;
    return draft;
  } catch {
    return null;
  }
}

async function offerResumeWorkoutDraft() {
  if (activeWorkout.started) return;
  const draft = readActiveWorkoutDraft();
  if (!draft) return;
  const ok = await showConfirmModal({
    title: "Resume workout?",
    message: `Training Book found an unfinished ${draft.routineName || "workout"} from ${formatWorkoutDate((draft.savedAt || "").slice(0, 10))}.`,
    confirmLabel: "Resume",
    danger: false
  });
  if (!ok) {
    clearActiveWorkoutDraft();
    return;
  }
  viewedDay = draft.viewedDay || viewedDay;
  activeWorkout.started = true;
  activeWorkout.startedAt = draft.startedAt || new Date().toISOString();
  activeWorkout.routineId = draft.routineId || null;
  activeWorkout.routineName = draft.routineName || "";
  activeWorkout.isCustom = Boolean(draft.isCustom);
  activeWorkout.substitutionNote = draft.substitutionNote || "";
  activeWorkout.replacedRoutineId = draft.replacedRoutineId || null;
  activeWorkout.replacedRoutineName = draft.replacedRoutineName || "";
  activeWorkout.exercises = draft.exercises;
  activeWorkout.currentIndex = Number(draft.currentIndex) || 0;
  activeWorkout.currentSet = Number(draft.currentSet) || 0;
  activeWorkout.phase = draft.phase === "finish" ? "finish" : "exercise";
  activeWorkout.flowMode = draft.flowMode === "round" ? "round" : "straight";
  activeWorkout.roundNumber = Number(draft.roundNumber) || 0;
  activeWorkout.restoredFromDraft = true;
  renderTodayRoutine();
}

function resetLiveWorkoutState() {
  stopTimer();
  activeWorkout.started = false;
  activeWorkout.exercises = [];
  activeWorkout.routineId = null;
  activeWorkout.routineName = "";
  activeWorkout.isCustom = false;
  activeWorkout.substitutionNote = "";
  activeWorkout.replacedRoutineId = null;
  activeWorkout.replacedRoutineName = "";
  activeWorkout.currentIndex = 0;
  activeWorkout.currentSet = 0;
  activeWorkout.roundNumber = 0;
  activeWorkout.phase = "exercise";
  activeWorkout.editTargetsOpen = false;
  activeWorkout.referenceOpen = false;
  activeWorkout.addExerciseOpen = false;
  activeWorkout.addExerciseQuery = "";
  activeWorkout.addExerciseFilter = "all";
  activeWorkout.flowChoiceOpen = false;
}

function openWorkoutFlowChoice() {
  const routine = getTodayPlannedRoutine();
  if (!routine) return;
  activeWorkout.flowChoiceOpen = true;
  renderTodayRoutine();
}

function closeWorkoutFlowChoice() {
  activeWorkout.flowChoiceOpen = false;
  renderTodayRoutine();
}

function renderWorkoutFlowChoiceSheet() {
  if (!activeWorkout.flowChoiceOpen) return "";
  const selected = activeWorkout.flowMode || localStorage.getItem(STORAGE.workoutFlowMode) || "straight";
  return `
    <div class="lw-sheet-scrim" role="presentation">
      <section class="lw-sheet workout-flow-sheet" role="dialog" aria-modal="true" aria-label="Choose workout flow">
        <div class="lw-sheet-head">
          <div>
            <h3>Start workout</h3>
            <p>Pick how you want to move through today.</p>
          </div>
          <button class="lw-sheet-close" type="button" data-action="close-flow-choice" aria-label="Close">&times;</button>
        </div>
        <div class="flow-choice-grid">
          <button class="flow-choice${selected === "straight" ? " is-active" : ""}" type="button" data-action="start-flow" data-flow="straight">
            <strong>Straight sets</strong>
            <span>Finish all sets for one exercise, then move on.</span>
          </button>
          <button class="flow-choice${selected === "round" ? " is-active" : ""}" type="button" data-action="start-flow" data-flow="round">
            <strong>Round-by-round</strong>
            <span>Set 1 of each exercise, then Set 2, and so on.</span>
          </button>
        </div>
      </section>
    </div>
  `;
}

function startTodayWorkout(flowMode = activeWorkout.flowMode || "straight") {
  const routine = getTodayPlannedRoutine();
  if (!routine) return;
  activeWorkout.started = true;
  activeWorkout.startedAt = new Date().toISOString();
  activeWorkout.routineId = routine.id;
  activeWorkout.routineName = routine.name;
  activeWorkout.isCustom = false;
  activeWorkout.substitutionNote = "";
  activeWorkout.replacedRoutineId = null;
  activeWorkout.replacedRoutineName = "";
  activeWorkout.flowMode = flowMode === "round" ? "round" : "straight";
  localStorage.setItem(STORAGE.workoutFlowMode, activeWorkout.flowMode);
  activeWorkout.currentIndex = 0;
  activeWorkout.currentSet = 0;
  activeWorkout.roundNumber = 0;
  activeWorkout.phase = "exercise";
  activeWorkout.editTargetsOpen = false;
  activeWorkout.referenceOpen = false;
  activeWorkout.addExerciseOpen = false;
  activeWorkout.flowChoiceOpen = false;
  activeWorkout.exercises = routine.exercises.map((plannedEx) => makeTodayExercise(plannedEx));
  persistActiveWorkoutDraft();
  renderTodayRoutine();
}

function startCustomWorkout() {
  const replacedRoutine = getTodayPlannedRoutine();
  activeWorkout.started = true;
  activeWorkout.startedAt = new Date().toISOString();
  activeWorkout.routineId = null;
  activeWorkout.routineName = "Custom workout";
  activeWorkout.isCustom = true;
  activeWorkout.substitutionNote = "";
  activeWorkout.replacedRoutineId = replacedRoutine?.id || null;
  activeWorkout.replacedRoutineName = replacedRoutine?.name || "";
  activeWorkout.flowMode = localStorage.getItem(STORAGE.workoutFlowMode) || "straight";
  activeWorkout.currentIndex = 0;
  activeWorkout.currentSet = 0;
  activeWorkout.roundNumber = 0;
  activeWorkout.phase = "exercise";
  activeWorkout.editTargetsOpen = false;
  activeWorkout.referenceOpen = false;
  activeWorkout.exercises = [];
  activeWorkout.addExerciseOpen = true;
  persistActiveWorkoutDraft();
  setTodayMode("active");
  renderTodayWorkout();
}

const startEmptyWorkout = startCustomWorkout;

function exitTodayWorkout() {
  resetLiveWorkoutState();
  clearActiveWorkoutDraft();
  renderTodayRoutine();
}

function renderTodayRoutine() {
  renderReviewReminder();

  if (!todayRoutineList) return;

  const routine = getTodayPlannedRoutine();

  if (activeWorkout.started) {
    if (todayRoutineName) todayRoutineName.textContent = activeWorkout.routineName || routine?.name || "Workout";
    setTodayMode("active");
    renderTodayWorkout();
    return;
  }

  if (!routine) {
    activeWorkout.exercises = [];
    activeWorkout.started = false;
    todayRoutineList.innerHTML = `
      <div class="empty-routine">
        <p class="eyebrow">No workout today</p>
        <p>You have a rest day scheduled. Start a custom workout when you want to add an exercise anyway.</p>
        <button class="primary-button today-start-button" type="button" data-action="start-custom-workout">Start custom workout</button>
      </div>
    `;
    if (todayRoutineName) {
      todayRoutineName.textContent = "Rest day";
    }
    setTodayMode("rest");
    updateTodayProgress();
    return;
  }

  if (todayRoutineName) {
    todayRoutineName.textContent = routine.name;
  }

  renderTodayPreview(routine);
  setTodayMode("preview");
  updateTodayProgress();
}

function handleTodayExerciseCheck(event) {
  const checkbox = event.target.closest(".today-exercise-checkbox");
  if (!checkbox) return;

  const card = checkbox.closest(".today-exercise-card");
  const exerciseId = card?.dataset.exerciseId;
  if (!exerciseId) return;

  const exercise = activeWorkout.exercises.find((ex) => ex.id === exerciseId);
  if (exercise) {
    exercise.checked = checkbox.checked;
    updateTodayProgress();
  }
}

// True once at least one set is checked off (strength) or the cardio move is
// marked done. Used to decide what gets saved and how the recap reads.
function isExerciseLogged(ex) {
  if (ex.type === "cardio") return Boolean(ex.cardioDone) && Number(ex.actualDuration) > 0;
  if (ex.type === "sport") return Boolean(ex.sportDone) && Number(ex.actualDuration) > 0;
  if (ex.type === "timed") return Array.isArray(ex.holds) && ex.holds.some((hold) => hold.done);
  return Array.isArray(ex.sets) && ex.sets.some((set) => set.done);
}

// Plain one-line summary of what actually happened, for the finish recap.
function formatExerciseRecap(ex) {
  if (ex.skipped && !isExerciseLogged(ex)) return "Skipped";
  if (ex.type === "cardio") {
    return ex.cardioDone ? `${Number(ex.actualDuration) || 0} min${formatCardioStats(collectCardioStats(ex))}` : "Not logged";
  }
  if (ex.type === "sport") {
    if (!ex.sportDone) return "Not logged";
    const note = (ex.sportNotes || "").trim();
    return `${Number(ex.actualDuration) || 0} min${note ? " · note" : ""}`;
  }
  if (ex.type === "timed") {
    const done = (ex.holds || []).filter((hold) => hold.done);
    if (!done.length) return "Not logged";
    // Show each hold's actual length so e.g. 60/60/45 reads faithfully.
    return done.map((hold) => `${Number(hold.seconds) || ex.holdSeconds || 0}s`).join(" · ");
  }
  const doneSets = (ex.sets || []).filter((set) => set.done);
  if (doneSets.length === 0) return "Not logged";
  const topWeight = Math.max(...doneSets.map((set) => Number(set.weight) || 0));
  const repsAtTop = doneSets.find((set) => (Number(set.weight) || 0) === topWeight)?.reps || 0;
  const weightPart = topWeight > 0 ? ` · ${topWeight} ${weightUnitLabel(ex)} × ${repsAtTop}` : "";
  return `${doneSets.length} set${doneSets.length === 1 ? "" : "s"}${weightPart}`;
}

// A friendly rest label. Rest is usually given in seconds (e.g. "90s"), so keep
// seconds up to two minutes; only switch to minutes for longer rests ("3m").
function formatRest(seconds) {
  const sec = Math.max(0, Math.round(Number(seconds) || 0));
  if (sec < 120) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

// Plain target line for the focused screen, e.g. "3 × 8 · 135 lb" or "10 min".
function formatFocusTarget(ex, includeRest = true) {
  const rest = includeRest && Number(ex.restSeconds) > 0 ? ` · rest ${formatRest(ex.restSeconds)}` : "";
  if (ex.type === "timed") return `${(ex.holds || []).length} × ${ex.holdSeconds || 0} sec${rest}`;
  if (ex.type === "cardio" || ex.type === "sport") return `${ex.targetSubtype ? `${ex.targetSubtype} · ` : ""}${ex.targetDuration || ex.actualDuration || 0} min`;
  if (ex.targetReps) {
    const weight = Number(ex.targetWeight) > 0 ? ` · ${ex.targetWeight} ${weightUnitLabel(ex)}` : "";
    return `${ex.targetSets || (ex.sets || []).length} × ${ex.targetReps}${weight}${rest}`;
  }
  return `${ex.targetSets || (ex.sets || []).length} sets${rest}`;
}

function canStartVisibleRest(ex) {
  if (!ex || !(ex.type === "strength" || ex.type === "timed")) return false;
  if (activeWorkout.rest.active || activeWorkout.timer.running) return false;
  if (Number(ex.restSeconds) <= 0) return false;
  return activeWorkout.currentSet < activeUnits(ex).length;
}

function renderVisibleRestButton(ex, className = "lw-rest-start") {
  if (!canStartVisibleRest(ex)) return "";
  const label = `${formatRest(ex.restSeconds)} rest`;
  return `<button class="${className}" type="button" data-action="start-rest" aria-label="Start ${escapeHtml(label)} timer">${escapeHtml(label)}</button>`;
}

function renderFocusTarget(ex) {
  const restSec = Number(ex.restSeconds) || 0;
  const base = escapeHtml(formatFocusTarget(ex, false));
  if (!(ex.type === "strength" || ex.type === "timed") || restSec <= 0) return base;
  const button = renderVisibleRestButton(ex);
  return button ? `${base}${button}` : `${base} · rest ${escapeHtml(formatRest(restSec))}`;
}

// The progress bar across the top: a filled dot per exercise, with done ones
// solid, the current one highlighted, and upcoming ones dim.
function renderProgressDots(currentIndex, total, finished) {
  return Array.from({ length: total }).map((_, i) => {
    let cls = "lw-dot";
    if (finished || i < currentIndex) cls += " is-done";
    else if (i === currentIndex) cls += " is-active";
    return `<span class="${cls}"></span>`;
  }).join("");
}

function renderTargetStepper(label, field, value, step, min, max, suffix = "") {
  const displayValue = Number(value) || 0;
  const safeLabel = escapeHtml(label);
  return `
    <div class="lw-stepper">
      <span class="lw-step-label">${safeLabel}</span>
      <div class="lw-step-controls">
        <button class="lw-step-btn" type="button" data-action="target-step" data-field="${escapeHtml(field)}" data-delta="${-step}" data-min="${min}" data-max="${max}" aria-label="Decrease ${safeLabel}">-</button>
        <span class="lw-step-num">${escapeHtml(displayValue)}${suffix ? ` ${escapeHtml(suffix)}` : ""}</span>
        <button class="lw-step-btn" type="button" data-action="target-step" data-field="${escapeHtml(field)}" data-delta="${step}" data-min="${min}" data-max="${max}" aria-label="Increase ${safeLabel}">+</button>
      </div>
    </div>
  `;
}

function renderEditTargetsSheet(ex) {
  if (!activeWorkout.editTargetsOpen) return "";

  let controls = "";
  if (ex.type === "timed") {
    controls = `
      ${renderTargetStepper("Holds", "holds", (ex.holds || []).length, 1, 1, 10)}
      ${renderTargetStepper("Seconds", "holdSeconds", ex.holdSeconds || 45, 5, 5, 300)}
    `;
  } else if (ex.type === "cardio" || ex.type === "sport") {
    controls = renderTargetStepper("Minutes", "targetDuration", ex.targetDuration || ex.actualDuration || 0, 5, 0, 300);
  } else {
    controls = `
      ${renderTargetStepper("Sets", "targetSets", ex.targetSets || (ex.sets || []).length, 1, 1, 12)}
      ${renderTargetStepper("Reps", "targetReps", ex.targetReps || 0, 1, 0, 100)}
      ${renderTargetStepper(isDualStackLift(ex) ? "Weight (per side)" : "Weight", "targetWeight", ex.targetWeight || 0, 5, 0, 1000, "lb")}
    `;
  }

  return `
    <div class="lw-sheet-scrim" role="presentation">
      <section class="lw-sheet" role="dialog" aria-modal="true" aria-label="Edit targets for ${escapeHtml(ex.name)}">
        <div class="lw-sheet-head">
          <div>
            <h3>Edit targets</h3>
            <p>Changes apply to today only.</p>
          </div>
          <button class="lw-sheet-close" type="button" data-action="close-targets" aria-label="Close edit targets">&times;</button>
        </div>
        ${controls}
        <button class="primary-button lw-sheet-done" type="button" data-action="close-targets">Done</button>
      </section>
    </div>
  `;
}

// Build the "How to do it" reference for an exercise. The how-to steps come
// from EXERCISE_INSTRUCTIONS (the real per-exercise instructions imported from
// the Free Exercise DB into exercises.json); muscles/equipment come from the
// library entry. Start/finish photos and any per-exercise video link are read
// from the library entry (see exercises.json -> photos / optional video).
function getExerciseReference(ex) {
  const lib = getExerciseById(ex.exerciseId);
  const steps = EXERCISE_INSTRUCTIONS[ex.exerciseId];
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  return {
    muscles: lib?.primaryMuscle ? cap(lib.primaryMuscle) : (ex.area || "Main working area"),
    equipment: lib?.equipment ? cap(lib.equipment) : (ex.type === "cardio" ? "Cardio equipment" : "As planned"),
    photos: getEffectivePhotos(lib),
    video: lib?.video || null,
    steps: (Array.isArray(steps) && steps.length) ? steps : [
      "Set up in a comfortable, controlled position.",
      "Move slowly enough that you can keep good form.",
      "Stop the set if you feel sharp pain or lose control."
    ],
    // The imported instructions cover form already, so there are no separate
    // one-line cues; the cue chips render only when an exercise supplies them.
    cues: []
  };
}

// Merge a library entry's bundled photos with the user's uploaded ones (custom
// wins per slot). Returns null when there's nothing to show.
function getEffectivePhotos(lib) {
  if (!lib) return null;
  const start = lib.customPhotos?.start || lib.photos?.start || null;
  const finish = lib.customPhotos?.finish || lib.photos?.finish || null;
  if (!start && !finish) return null;
  return { start, finish };
}

// Shared markup for the "How to do it" sheet. Used both inside a live workout
// and from the Library tab; `closeAction` is the data-action the scrim / close /
// Done controls fire. (Photo editing now lives in the Library edit card, not
// here, so this sheet is read-only.)
function buildReferenceSheetMarkup(ex, closeAction) {
  const ref = getExerciseReference(ex);
  const muscleBadge = renderMuscleBadge(ex.exerciseId, "lw-ref-muscle-badge", `Muscles worked: ${ref.muscles}`);

  // Generic tutorial link: a per-exercise `video` URL from the library if one
  // is set, otherwise a YouTube search for the move (placeholder for now).
  const videoHref = ref.video
    || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${ex.name} how to`)}`;

  const photoFigure = (src, caption, alt) => src
    ? `<figure class="lw-ref-photo"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" /><figcaption>${caption}</figcaption></figure>`
    : "";
  const photosBlock = ref.photos
    ? `<div class="lw-ref-photos">
          ${photoFigure(ref.photos.start, "Start position", `${ex.name} start position`)}
          ${photoFigure(ref.photos.finish, "Finish position", `${ex.name} finish position`)}
        </div>`
    : "";

  return `
    <div class="lw-sheet-scrim" role="presentation">
      <section class="lw-sheet lw-reference-sheet" role="dialog" aria-modal="true" aria-label="How to do ${escapeHtml(ex.name)}">
        <div class="lw-sheet-head">
          <div>
            <h3>${escapeHtml(ex.name)}</h3>
            <p>${escapeHtml(ref.muscles)}</p>
          </div>
          <div class="lw-sheet-head-actions">
            ${muscleBadge}
            <button class="lw-sheet-close" type="button" data-action="${closeAction}" aria-label="Close how to do it">&times;</button>
          </div>
        </div>
        ${photosBlock}
        <div class="lw-ref-meta">
          <span>${escapeHtml(ref.equipment)}</span>
          <span>${escapeHtml(ex.type === "timed" ? "Timed hold" : ex.type)}</span>
        </div>
        <ol class="lw-ref-steps">
          ${ref.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ol>
        ${ref.cues.length ? `<div class="lw-ref-cues">
          ${ref.cues.map((cue) => `<span>${escapeHtml(cue)}</span>`).join("")}
        </div>` : ""}
        <a class="lw-ref-video" href="${escapeHtml(videoHref)}" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none"/></svg>
          Watch video tutorial
        </a>
        ${ref.photos ? `<p class="lw-ref-source">Reference photos from the public-domain Free Exercise DB</p>` : ""}
        <button class="lw-ref-report btn-ico" type="button" data-action="report-exercise-issue" data-id="${escapeHtml(ex.exerciseId)}" data-name="${escapeHtml(ex.name)}">${getUiIcon("flag")}Report an issue with this exercise</button>
        <button class="primary-button lw-sheet-done" type="button" data-action="${closeAction}">Done</button>
      </section>
    </div>
  `;
}

function renderReferenceSheet(ex) {
  if (!activeWorkout.referenceOpen) return "";
  return buildReferenceSheetMarkup(ex, "close-reference");
}

// "Report an issue" from any how-to sheet: close the sheet, then open Notes
// pre-filled as a Bug tagged with the exercise, so catalog mistakes land in the
// same appNotes list as the rest of Daniel's ideas (nothing private required).
function reportExerciseIssue(exerciseId, name) {
  if (activeWorkout.referenceOpen) {
    activeWorkout.referenceOpen = false;
    renderTodayWorkout();
  }
  if (libraryReferenceId) closeLibraryReference();
  if (todayReferenceId) closeTodayReference();
  const label = name || getExerciseById(exerciseId)?.name || "this exercise";
  const idPart = exerciseId ? ` (${exerciseId})` : "";
  openNotesModal({ source: "catalog", lane: "bug", prefill: `Exercise issue — ${label}${idPart}: ` });
}

function renderLiveExerciseArt(ex) {
  const lib = getExerciseById(ex.exerciseId);
  const photo = lib ? getExerciseStartImage(lib) : null;
  if (photo) {
    return `<img class="lw-hero-photo" src="${escapeHtml(photo)}" alt="" loading="lazy">`;
  }
  return `<span class="lw-hero-glyph">${getExerciseIcon(ex.icon)}</span>`;
}

function openLiveAddExercise() {
  activeWorkout.addExerciseOpen = true;
  activeWorkout.addExerciseQuery = "";
  activeWorkout.addExerciseFilter = "all";
  activeWorkout.editTargetsOpen = false;
  activeWorkout.referenceOpen = false;
  renderTodayWorkout();
  setTimeout(() => document.querySelector("#live-add-search")?.focus(), 0);
}

function closeLiveAddExercise() {
  activeWorkout.addExerciseOpen = false;
  activeWorkout.addExerciseQuery = "";
  activeWorkout.addExerciseFilter = "all";
  renderTodayWorkout();
}

function addExerciseToLiveWorkout(exerciseId) {
  const exercise = getExerciseById(exerciseId);
  if (!exercise) return;
  activeWorkout.exercises.push(makeTodayExercise(defaultRoutineExercise(exerciseId, { preferHistory: true }), "added"));
  activeWorkout.currentIndex = activeWorkout.exercises.length - 1;
  activeWorkout.currentSet = activeWorkout.flowMode === "round" ? activeWorkout.roundNumber : 0;
  activeWorkout.addExerciseOpen = false;
  activeWorkout.addExerciseQuery = "";
  activeWorkout.addExerciseFilter = "all";
  persistActiveWorkoutDraft();
  renderTodayWorkout();
}

// Just the results list for the live add-exercise sheet. Split out so a search
// keystroke can refresh only this list (preserving the input's focus and the
// mobile keyboard) rather than re-rendering the whole workout screen, which
// would tear the focused <input> out of the DOM mid-keystroke and lock up the
// sheet on mobile.
function renderLiveAddResults() {
  const query = (activeWorkout.addExerciseQuery || "").trim().toLowerCase();
  const filter = activeWorkout.addExerciseFilter || "all";
  const matches = exercises
    .filter((exercise) => {
      let matchesFilter;
      if (filter === "all") matchesFilter = true;
      else if (filter === "favorites") matchesFilter = Boolean(exercise.favorite);
      else matchesFilter = (exercise.tags || []).includes(filter);
      if (!matchesFilter) return false;
      if (!query) return true;
      return `${exercise.name} ${exercise.area || ""} ${(exercise.tags || []).join(" ")}`.toLowerCase().includes(query);
    })
    .slice(0, 60);

  // A clean, compact row per exercise: small photo/glyph thumbnail + name + type.
  // Deliberately NOT renderExerciseArt — that nests the How-to and favourite
  // <button>s inside this result <button>, which is invalid HTML; the browser
  // reshuffles it, the stray How-to button floats over the row, and taps land on
  // it instead of adding the exercise (matches the History add-exercise fix).
  return matches.map((exercise) => {
    const photo = getExerciseStartImage(exercise);
    const thumb = photo
      ? `<span class="live-add-result-icon" style="background-image:url('${escapeHtml(photo)}')"></span>`
      : `<span class="live-add-result-icon">${getExerciseIcon(exercise.icon)}</span>`;
    const sub = `${formatExerciseType(exercise.type || "strength")}${exercise.area ? ` · ${exercise.area}` : ""}`;
    return `
      <button class="live-add-result" type="button" data-action="add-live-exercise" data-id="${escapeHtml(exercise.id)}">
        ${thumb}
        <span class="live-add-result-text"><strong>${escapeHtml(exercise.name)}</strong><small>${escapeHtml(sub)}</small></span>
      </button>
    `;
  }).join("") || `<p class="empty-state">No matching exercises.</p>`;
}

// Same chip set as the Library tab's renderFilterStrip(), but scoped to this
// sheet's own addExerciseFilter state instead of the global library filter, so
// opening this sheet never disturbs whatever the Library tab has selected.
function renderLiveAddFilterStrip() {
  const filter = activeWorkout.addExerciseFilter || "all";
  const chip = (value, label, extraClass = "", iconHtml = "") => {
    const active = filter === value ? " is-active" : "";
    return `<button class="filter-chip${extraClass}${active}" type="button" data-action="live-add-filter" data-filter="${escapeHtml(value)}">${iconHtml}${escapeHtml(label)}</button>`;
  };
  return `
    <div class="filter-strip live-add-filter-strip">
      ${[
        chip("all", "All"),
        chip("favorites", "Favorites", " filter-chip-fav", getUiIcon("star")),
        ...categories.map((cat) => chip(cat.key, cat.label))
      ].join("")}
    </div>
  `;
}

function renderLiveAddExerciseSheet() {
  if (!activeWorkout.addExerciseOpen) return "";
  return `
    <div class="lw-sheet-scrim" role="presentation">
      <section class="lw-sheet live-add-sheet" role="dialog" aria-modal="true" aria-label="Add exercise to workout">
        <div class="lw-sheet-head">
          <div>
            <h3>Add exercise</h3>
            <p>Add it to this workout only.</p>
          </div>
          <button class="lw-sheet-close" type="button" data-action="close-live-add" aria-label="Close add exercise">&times;</button>
        </div>
        <div class="library-search live-add-search">
          <span class="library-search-icon" data-icon="search" aria-hidden="true"></span>
          <input type="search" id="live-add-search" value="${escapeHtml(activeWorkout.addExerciseQuery)}" data-action="live-add-search" placeholder="Search exercises" autocomplete="off" aria-label="Search exercises" />
        </div>
        ${renderLiveAddFilterStrip()}
        <div class="live-add-results">
          ${renderLiveAddResults()}
        </div>
      </section>
    </div>
  `;
}

function resizeTodaySets(ex, count) {
  const sets = Array.isArray(ex.sets) ? ex.sets : [];
  const safeCount = clampNumber(count, 1, 12);
  while (sets.length < safeCount) {
    const last = sets[sets.length - 1];
    sets.push({
      weight: last ? last.weight : (ex.targetWeight || 0),
      reps: ex.targetReps || (last ? last.reps : 0),
      done: false,
      notes: "",
      touchedWeight: false,
      touchedReps: false
    });
  }
  while (sets.length > safeCount) sets.pop();
  ex.sets = sets;
  ex.targetSets = safeCount;
}

function resizeTodayHolds(ex, count) {
  const holds = Array.isArray(ex.holds) ? ex.holds : [];
  const safeCount = clampNumber(count, 1, 10);
  while (holds.length < safeCount) {
    const last = holds[holds.length - 1];
    holds.push({ seconds: last ? last.seconds : (ex.holdSeconds || 45), done: false, notes: "", difficulty: null });
  }
  while (holds.length > safeCount) holds.pop();
  ex.holds = holds;
  ex.targetSets = safeCount;
}

function adjustTodayTarget(ex, field, delta, min, max) {
  const current = field === "holds"
    ? (ex.holds || []).length
    : Number(ex[field]) || 0;
  const next = clampNumber(current + delta, min, max);

  if (field === "targetSets") {
    resizeTodaySets(ex, next);
    return;
  }

  if (field === "targetReps") {
    ex.targetReps = next;
    (ex.sets || []).forEach((set) => {
      if (!set.done) set.reps = next;
    });
    return;
  }

  if (field === "targetWeight") {
    ex.targetWeight = next;
    (ex.sets || []).forEach((set) => {
      if (!set.done) set.weight = next;
    });
    return;
  }

  if (field === "holds") {
    resizeTodayHolds(ex, next);
    return;
  }

  if (field === "holdSeconds") {
    ex.holdSeconds = next;
    initTimerForExercise(ex);
    return;
  }

  if (field === "targetDuration") {
    ex.targetDuration = next;
    if (!ex.cardioDone && !ex.sportDone) ex.actualDuration = next;
  }
}

// The set "breadcrumb": a row of right-pointing arrow segments, one per set,
// with the current one highlighted. Capped at 6 arrows (more than that and we
// fall back to a plain label). A single set shows one tidy box instead.
function renderSetSteps(current, total, unit = "Set") {
  const label = `${unit} ${current + 1} of ${total}`;
  if (total === 1) {
    return `<div class="lw-steps"><span class="lw-step-single">${escapeHtml(label)}</span></div>`;
  }
  if (total > 6) {
    return `<p class="lw-setpage-num">${escapeHtml(label)}</p>`;
  }
  let segs = "";
  for (let k = 0; k < total; k++) {
    const state = k < current ? "is-done" : (k === current ? "is-current" : "is-upcoming");
    segs += `<button class="lw-step ${state}" type="button" data-action="goto-set" data-set-index="${k}" aria-label="Go to ${unit.toLowerCase()} ${k + 1}"${k === current ? ' aria-current="step"' : ""}>${k + 1}</button>`;
  }
  return `<div class="lw-steps" role="group" aria-label="${escapeHtml(label)}">${segs}</div>`;
}

function isExerciseAvailableInRound(ex, round) {
  if (!ex || ex.skipped) return false;
  if (ex.type === "strength") return Boolean(ex.sets?.[round]);
  return round === 0 && !isExerciseLogged(ex);
}

function findNextRoundPosition(fromIndex = activeWorkout.currentIndex, fromRound = activeWorkout.roundNumber) {
  const list = activeWorkout.exercises || [];
  for (let i = fromIndex + 1; i < list.length; i++) {
    if (isExerciseAvailableInRound(list[i], fromRound)) return { index: i, round: fromRound };
  }
  for (let round = fromRound + 1; round < 20; round++) {
    for (let i = 0; i < list.length; i++) {
      if (isExerciseAvailableInRound(list[i], round)) return { index: i, round };
    }
  }
  return null;
}

function findPreviousRoundPosition(fromIndex = activeWorkout.currentIndex, fromRound = activeWorkout.roundNumber) {
  const list = activeWorkout.exercises || [];
  for (let i = fromIndex - 1; i >= 0; i--) {
    if (isExerciseAvailableInRound(list[i], fromRound)) return { index: i, round: fromRound };
  }
  for (let round = fromRound - 1; round >= 0; round--) {
    for (let i = list.length - 1; i >= 0; i--) {
      if (isExerciseAvailableInRound(list[i], round)) return { index: i, round };
    }
  }
  return null;
}

function moveToRoundPosition(position) {
  if (!position) {
    activeWorkout.phase = "finish";
    return;
  }
  activeWorkout.currentIndex = position.index;
  activeWorkout.roundNumber = position.round;
  activeWorkout.currentSet = position.round;
}

function getNextExerciseLabel() {
  if (activeWorkout.flowMode === "round") {
    const next = findNextRoundPosition();
    return next ? `Next: ${escapeHtml(activeWorkout.exercises[next.index].name)} &rarr;` : "Finish workout &rarr;";
  }
  const i = activeWorkout.currentIndex;
  return i >= activeWorkout.exercises.length - 1
    ? "Finish workout &rarr;"
    : `Next: ${escapeHtml(activeWorkout.exercises[i + 1].name)} &rarr;`;
}

// Strength and timed moves both page one unit at a time: a "set" (weight x
// reps) or a "hold" (seconds). This returns the array currentSet indexes into.
function activeUnits(ex) {
  return ex?.type === "timed" ? (ex.holds || []) : (ex.sets || []);
}

// The seconds the live countdown should run for the hold currently on screen.
function currentHoldSeconds(ex) {
  const hold = (ex.holds || [])[activeWorkout.currentSet];
  return Math.max(5, Number(hold?.seconds) || Number(ex.holdSeconds) || 45);
}

// A quiet "Rest ~90s before your next set" note for the live set/hold page,
// shown only when the plan set a rest target. Tapping it opens the same guided
// rest countdown used by automatic rest timers when that makes sense.
// Suppressed when the guided rest countdown will take over instead (restTimer
// in straight mode); round-by-round flows still get the quiet hint.
function renderRestHint(ex) {
  const sec = Number(ex.restSeconds) || 0;
  const timerTakesOver = ex.restTimer && activeWorkout.flowMode !== "round";
  if (sec <= 0 || timerTakesOver) return "";
  const what = ex.type === "timed" ? "between holds" : "before your next set";
  if (!canStartVisibleRest(ex)) {
    return `<p class="lw-rest-hint">Rest ~<strong>${escapeHtml(formatRest(sec))}</strong> ${what}</p>`;
  }
  return `<button class="lw-rest-hint" type="button" data-action="start-rest">Rest ~<strong>${escapeHtml(formatRest(sec))}</strong> ${what}</button>`;
}

// A note from the AI coach for this move (e.g. "ease off the last set — you
// burned out here last week"). Shown as a calm callout on every set/hold page
// of the exercise so it's in view the whole time you're on it. "" when none.
function renderCoachNote(ex) {
  const note = (ex.coachNote || "").trim();
  if (!note) return "";
  return `
    <div class="lw-coach-note" role="note">
      <span class="lw-coach-note-icon" aria-hidden="true">${getUiIcon("sparkles")}</span>
      <div class="lw-coach-note-body">
        <span class="lw-coach-note-label">Coach</span>
        <p class="lw-coach-note-text">${escapeHtml(note)}</p>
      </div>
    </div>`;
}

// Optional 1-10 effort control under a set/hold's note (request: a small red
// button you can tap to rate, then proceed). Collapsed until tapped; tapping the
// active number again clears it. Never required. index === -1 rates the whole
// exercise (used for cardio/sport, which have no per-set rows).
function renderEffortControl(ex, index) {
  const unit = index === -1 ? ex : activeUnits(ex)[index];
  if (!unit) return "";
  const val = Number.isFinite(unit.difficulty) ? unit.difficulty : null;
  const open = activeWorkout.effortOpenKey === `${ex.id}:${index}`;
  const chips = open
    ? `<div class="lw-effort-row" role="group" aria-label="Effort, 1 easy to 10 all-out">
        ${Array.from({ length: 10 }, (_, k) => {
          const v = k + 1;
          return `<button type="button" class="lw-effort-chip${v === val ? " is-active" : ""}" data-action="set-effort" data-set-index="${index}" data-value="${v}" aria-pressed="${v === val}" aria-label="Effort ${v} of 10">${v}</button>`;
        }).join("")}
      </div>`
    : "";
  return `
    <div class="lw-effort${val ? " has-val" : ""}">
      <button type="button" class="lw-effort-toggle${val ? " has-val" : ""}" data-action="toggle-effort" data-set-index="${index}" aria-expanded="${open}">
        <span class="lw-effort-dot" aria-hidden="true"></span>${val ? `Effort ${val}/10` : "Rate effort (optional)"}
      </button>
      ${chips}
    </div>`;
}

// F3: the same muscle badge as the how-to sheet, bigger and right-aligned in
// the live hero row - Daniel wanted it prominent while actually training, not
// just tucked behind the how-to sheet.
function renderLiveMuscleBadge(ex) {
  return renderMuscleBadge(ex.exerciseId, "lw-hero-muscle-badge", `Muscles worked: ${ex.area || ex.name}`);
}

function renderFocusedExercise() {
  const exercises = activeWorkout.exercises;
  const i = activeWorkout.currentIndex;
  const ex = exercises[i];
  const total = exercises.length;
  const routineName = todayRoutineName?.textContent || "Workout";

  // Strength and timed moves page one unit at a time; keep the index in range
  // (0..length, where length is the wrap "add another?" page).
  if (ex.type === "strength" || ex.type === "timed") {
    const units = activeUnits(ex);
    activeWorkout.currentSet = activeWorkout.flowMode === "round"
      ? clampNumber(activeWorkout.roundNumber, 0, Math.max(0, units.length - 1))
      : clampNumber(activeWorkout.currentSet, 0, units.length);
  }
  const nextLabel = getNextExerciseLabel();

  // If a guided rest is mid-countdown but we've moved to a different exercise,
  // drop it so it can't bleed onto the wrong screen.
  if (activeWorkout.rest.active && activeWorkout.rest.exerciseId !== ex.id) stopRest();
  const restingHere = activeWorkout.rest.active && activeWorkout.rest.exerciseId === ex.id;

  let body;
  if (restingHere) {
    body = renderRestBody(ex);
  } else if (ex.type === "timed") {
    // Held move (e.g. plank): paged one hold at a time, just like strength sets.
    // Each hold has its own seconds (so 60/60/45 is captured), an optional
    // countdown timer helper, a note, and optional effort. After the last hold a
    // wrap page offers another hold or moving on.
    const holds = ex.holds || [];
    const n = holds.length;
    const s = activeWorkout.currentSet;

    if (s >= n) {
      body = `
        <div class="lw-wrap">
          <p class="lw-wrap-title">That&rsquo;s all ${n} hold${n === 1 ? "" : "s"} of ${escapeHtml(ex.name)}.</p>
          <p class="lw-wrap-sub">Add another hold, or move on.</p>
          <div class="lw-wrap-actions">
            <button class="lw-skip" type="button" data-action="add-set-page">+ Another hold</button>
            <button class="primary-button lw-complete" type="button" data-action="lw-next">${nextLabel}</button>
          </div>
        </div>
      `;
    } else {
      // Keep the live countdown pointed at this hold's seconds.
      if (activeWorkout.timer.exerciseId !== ex.id || activeWorkout.timer.holdIndex !== s) initTimerForExercise(ex);
      const hold = holds[s];
      const t = activeWorkout.timer;
      const running = t.running;
      const lock = running ? " disabled" : "";
      const toggleLabel = running
        ? "Pause"
        : (t.remaining < t.total && t.remaining > 0 ? "Resume" : "Start");
      body = `
        <div class="lw-setpage lw-hold-page" data-set-index="${s}">
          ${renderSetSteps(s, n, "Hold")}
          <div class="lw-bigstep">
            <span class="lw-bigstep-label">Hold for</span>
            <div class="lw-bigstep-row">
              <button class="lw-wbtn lw-wbtn-lg" type="button" data-action="set-seconds-step" data-set-index="${s}" data-delta="-5" aria-label="Lower hold seconds"${lock}>&minus;</button>
              <span class="lw-bigstep-val"><strong>${escapeHtml(Number(hold.seconds) || 0)}</strong> sec</span>
              <button class="lw-wbtn lw-wbtn-lg" type="button" data-action="set-seconds-step" data-set-index="${s}" data-delta="5" aria-label="Raise hold seconds"${lock}>+</button>
            </div>
          </div>
          <div class="lw-hold-timer">
            <p class="lw-hold-timer-label">Countdown timer</p>
            <div class="lw-timer${running ? " is-running" : ""}${t.finished ? " is-finished" : ""}">
              <div class="lw-timer-num${t.finished ? " flash" : ""}" id="lw-timer-num" aria-live="off">${formatTimer(t.remaining)}</div>
              <div class="lw-timer-controls">
                <button class="lw-tbtn primary" type="button" data-action="timer-toggle">${toggleLabel}</button>
                <button class="lw-tbtn" type="button" data-action="timer-reset"${lock}>Reset</button>
              </div>
              <p class="lw-note">${t.finished ? "Time&rsquo;s up! Tap Complete hold to log it." : "Counts down this hold&rsquo;s seconds — logging stays on the number above."}</p>
            </div>
          </div>
          <label class="lw-live-note">
            <span>Hold note (optional)</span>
            <textarea rows="2" data-action="set-notes" data-set-index="${s}" placeholder="Form, how it felt, cut short...">${escapeHtml(hold.notes || "")}</textarea>
          </label>
          ${renderEffortControl(ex, s)}
          ${renderRestHint(ex)}
          <div class="lw-setpage-actions">
            <button class="lw-skip" type="button" data-action="skip-set">Skip hold</button>
            <button class="primary-button lw-complete btn-ico" type="button" data-action="complete-set">${getUiIcon("check")}Complete hold</button>
          </div>
        </div>
      `;
    }
  } else if (ex.type === "cardio") {
    const subtypes = getExerciseSubtypeOptions(ex.exerciseId);
    body = `
      ${subtypes.length ? `
        <label class="lw-subtype">
          <span>Session type</span>
          <select data-action="cardio-subtype" aria-label="Session type for ${escapeHtml(ex.name)}">
            ${subtypes.map((item) => `<option value="${escapeHtml(item)}"${item === ex.targetSubtype ? " selected" : ""}>${escapeHtml(item)}</option>`).join("")}
          </select>
        </label>
      ` : ""}
      <div class="lw-cardio">
        <label class="lw-field lw-field-lg">
          <input type="number" inputmode="numeric" min="0" step="1" value="${escapeHtml(ex.actualDuration)}" data-action="cardio-minutes" aria-label="Minutes for ${escapeHtml(ex.name)}">
          <span>min</span>
        </label>
        <button class="lw-bigcheck${ex.cardioDone ? " is-done" : ""}" type="button" data-action="toggle-cardio">${ex.cardioDone ? "Done &#10003;" : "Mark done"}</button>
      </div>
      ${(() => {
        // Show exactly the stat fields this machine reports (bike gets power,
        // tread gets elevation, etc.), driven off the same config the History
        // editor uses so live and edit stay in lockstep.
        const metrics = getCardioMetrics(ex.exerciseId);
        if (!metrics.length) return "";
        const anyFilled = metrics.some((m) => Number(ex[liveCardioField(m)]) > 0);
        const inputs = metrics.map((m) => {
          const meta = CARDIO_METRIC_META[m];
          const field = liveCardioField(m);
          return `
          <label class="lw-field">
            <input type="number" inputmode="decimal" min="0" step="${meta.step}" value="${escapeHtml(ex[field] || "")}" data-action="cardio-stat" data-field="${field}" aria-label="${escapeHtml(`${meta.label} in ${meta.unit}`)}" placeholder="0">
            <span>${escapeHtml(meta.unit)}</span>
          </label>`;
        }).join("");
        return `
      <details class="lw-cardio-stats"${anyFilled ? " open" : ""}>
        <summary>Cardio stats (optional)</summary>
        <div class="lw-cardio-stat-grid">${inputs}</div>
        <p class="lw-cardio-stat-hint">Numbers from your machine&rsquo;s summary screen. Leave any blank &mdash; blank calories get a rough <span aria-hidden="true">~</span>estimate from your effort.</p>
      </details>`;
      })()}
      <label class="lw-live-note">
        <span>Notes (optional)</span>
        <textarea rows="2" data-action="exercise-notes" placeholder="Anything to remember about this session">${escapeHtml(ex.notes || "")}</textarea>
      </label>
      ${renderEffortControl(ex, -1)}
      <p class="lw-note">Enter your minutes and mark it done.</p>
    `;
  } else if (ex.type === "sport") {
    body = `
      <div class="lw-cardio">
        <label class="lw-field lw-field-lg">
          <input type="number" inputmode="numeric" min="0" step="1" value="${escapeHtml(ex.actualDuration)}" data-action="cardio-minutes" aria-label="Minutes for ${escapeHtml(ex.name)}">
          <span>min</span>
        </label>
        <button class="lw-bigcheck${ex.sportDone ? " is-done" : ""}" type="button" data-action="toggle-sport">${ex.sportDone ? "Done &#10003;" : "Mark done"}</button>
      </div>
      <label class="lw-sport-notes">
        <span>Notes (optional)</span>
        <textarea rows="3" data-action="sport-notes" placeholder="How it went, score, who you played, how you felt...">${escapeHtml(ex.sportNotes || "")}</textarea>
      </label>
      ${renderEffortControl(ex, -1)}
      <p class="lw-note">Enter how long you played and mark it done.</p>
    `;
  } else {
    // Strength: one set per page. Big -/+ steppers for weight (by 5) and reps
    // (by 1), with Skip / Complete at the bottom. After the last set we show a
    // wrap page that offers another set or moving on.
    const sets = ex.sets || [];
    const n = sets.length;
    const s = activeWorkout.currentSet;

    if (s >= n) {
      body = `
        <div class="lw-wrap">
          <p class="lw-wrap-title">That&rsquo;s all ${n} set${n === 1 ? "" : "s"} of ${escapeHtml(ex.name)}.</p>
          <p class="lw-wrap-sub">Add another set, or move on.</p>
          <div class="lw-wrap-actions">
            <button class="lw-skip" type="button" data-action="add-set-page">+ Another set</button>
            <button class="primary-button lw-complete" type="button" data-action="lw-next">${nextLabel}</button>
          </div>
        </div>
      `;
    } else {
      const set = sets[s];
      // Barbell lifts are entered as plates-per-side (set.weight stays the total).
      const barbell = isBarbellLift(ex);
      // Dual-stack cable lifts (e.g. Seated Cable Row, Lat Pulldown on Daniel's
      // Ares 2.0) are naturally already per-side -- nothing to derive, just label it.
      const dualStack = !barbell && isDualStackLift(ex);
      const weightLabel = barbell ? "Per side" : (dualStack ? "Weight (per side)" : "Weight");
      const weightShown = barbell ? perSideFromTotal(set.weight) : (Number(set.weight) || 0);
      const weightUnitText = dualStack ? "lb/side" : "lb";
      const lowerAria = barbell ? "Lower plates 5 pounds per side" : (dualStack ? "Lower weight 5 pounds per side" : "Lower weight 5 pounds");
      const raiseAria = barbell ? "Raise plates 5 pounds per side" : (dualStack ? "Raise weight 5 pounds per side" : "Raise weight 5 pounds");
      const weightControl = usesWeightMetric(ex) ? `
          <div class="lw-bigstep">
            <span class="lw-bigstep-label">${weightLabel}</span>
            <div class="lw-bigstep-row">
              <button class="lw-wbtn lw-wbtn-lg" type="button" data-action="set-weight-step" data-set-index="${s}" data-delta="-5" aria-label="${lowerAria}">&minus;</button>
              <span class="lw-bigstep-val"><strong>${escapeHtml(weightShown)}</strong> ${weightUnitText}</span>
              <button class="lw-wbtn lw-wbtn-lg" type="button" data-action="set-weight-step" data-set-index="${s}" data-delta="5" aria-label="${raiseAria}">+</button>
            </div>
            ${renderPlateHint(ex, set.weight)}
            ${renderDualStackHint(ex, set.weight)}
          </div>
      ` : "";
      body = `
        <div class="lw-setpage" data-set-index="${s}">
          ${renderSetSteps(s, n)}
          ${weightControl}
          <div class="lw-bigstep">
            <span class="lw-bigstep-label">Reps</span>
            <div class="lw-bigstep-row">
              <button class="lw-wbtn lw-wbtn-lg" type="button" data-action="set-reps-step" data-set-index="${s}" data-delta="-1" aria-label="Lower reps">&minus;</button>
              <span class="lw-bigstep-val"><strong>${escapeHtml(set.reps)}</strong></span>
              <button class="lw-wbtn lw-wbtn-lg" type="button" data-action="set-reps-step" data-set-index="${s}" data-delta="1" aria-label="Raise reps">+</button>
            </div>
          </div>
          <label class="lw-live-note">
            <span>Set note (optional)</span>
            <textarea rows="2" data-action="set-notes" data-set-index="${s}" placeholder="Form, pain, setup, felt easy/hard...">${escapeHtml(set.notes || "")}</textarea>
          </label>
          ${renderEffortControl(ex, s)}
          ${renderRestHint(ex)}
          <div class="lw-setpage-actions">
            <button class="lw-skip" type="button" data-action="skip-set">Skip set</button>
            <button class="primary-button lw-complete btn-ico" type="button" data-action="complete-set">${getUiIcon("check")}Complete set</button>
          </div>
        </div>
      `;
    }
  }

  todayRoutineList.innerHTML = `
    <div class="live-workout">
      <div class="lw-progress">
        <div class="lw-topbar">
          <button class="quiet-button small-button btn-ico lw-back" type="button" data-action="lw-back" aria-label="${i > 0 ? "Previous exercise" : "Back to plan"}">${getUiIcon("arrow-left")}</button>
          <span class="lw-count">${activeWorkout.flowMode === "round" ? `Round ${activeWorkout.roundNumber + 1} · ` : ""}${i + 1} of ${total}</span>
          <div class="lw-top-actions">
            <button class="lw-top-note" type="button" data-action="open-notes" aria-label="Add a note">${getUiIcon("notebook-pen")}</button>
            <button class="lw-exit" type="button" data-action="lw-exit">Exit</button>
          </div>
        </div>
        <div class="lw-dots">${renderProgressDots(i, total, false)}</div>
      </div>
      <div class="lw-hero">
        <div class="lw-hero-icon" aria-hidden="true">${renderLiveExerciseArt(ex)}</div>
        <div class="lw-hero-text">
          <div class="lw-name-row">
            <h3 class="lw-name">${escapeHtml(ex.name)}</h3>
            <button class="lw-help-btn" type="button" data-action="open-reference" aria-label="How to do ${escapeHtml(ex.name)}">${getUiIcon("help-circle")}</button>
          </div>
          <p class="lw-area">${escapeHtml(ex.area || "")}${ex.source === "added" ? " · added today" : ""}${ex.skipped ? " · skipped" : ""}</p>
        </div>
        ${renderLiveMuscleBadge(ex)}
      </div>
      <div class="lw-target">
        <span class="lw-target-line">Target: <strong>${renderFocusTarget(ex)}</strong></span>
        <button class="lw-edit-targets" type="button" data-action="open-targets"${activeWorkout.timer.running ? " disabled" : ""}>Edit targets</button>
      </div>
      ${renderCoachNote(ex)}
      ${body}
      ${(ex.type === "strength" || ex.type === "timed") ? "" : `
      <div class="lw-next-row">
        <button class="primary-button lw-next" type="button" data-action="lw-next">${nextLabel}</button>
      </div>`}
      <div class="lw-toolbar">
        <button class="quiet-button small-button btn-ico danger-text" type="button" data-action="skip-exercise">${getUiIcon("x")}Skip exercise</button>
        <button class="quiet-button small-button btn-ico" type="button" data-action="open-live-add">${getUiIcon("plus-circle")}Add exercise</button>
      </div>
      ${renderEditTargetsSheet(ex)}
      ${renderReferenceSheet(ex)}
      ${renderLiveAddExerciseSheet()}
    </div>
  `;
  renderUiIcons();
}

// A read-only one-line summary of the efforts logged for an exercise, for the
// finish recap. Effort is now rated per set/hold while working out, so this just
// reflects what was already entered (e.g. "Effort 7 · 8 · 6"). "" when unrated.
function formatLoggedEffort(ex) {
  if (ex.type === "cardio" || ex.type === "sport") {
    return Number.isFinite(ex.difficulty) && ex.difficulty > 0 ? `Effort ${ex.difficulty}/10` : "";
  }
  const rated = activeUnits(ex)
    .filter((u) => u.done && Number.isFinite(u.difficulty) && u.difficulty > 0)
    .map((u) => u.difficulty);
  return rated.length ? `Effort ${rated.join(" · ")}` : "";
}

function renderFinishScreen() {
  const exercises = activeWorkout.exercises;
  const total = exercises.length;
  const routineName = todayRoutineName?.textContent || "Workout";
  const loggedCount = exercises.filter(isExerciseLogged).length;
  const anyLogged = loggedCount > 0;
  // A broader, whole-session note - not tied to any one exercise - so
  // "skipped X because..." or "added Y because..." has somewhere to live.
  // Custom workouts get their original "why custom" framing; planned
  // workouts get a general prompt. Both write the same substitutionNote.
  const customNote = `
        <label class="lw-live-note lw-custom-note">
          <span>${activeWorkout.isCustom ? "Why custom today? (optional)" : "Workout note (optional)"}</span>
          <textarea rows="2" data-action="custom-workout-note" placeholder="${activeWorkout.isCustom ? "Example: swapped in a lighter session, gym was crowded, short on time..." : "Example: skipped bench because of shoulder soreness, added an extra set of rows..."}">${escapeHtml(activeWorkout.substitutionNote || "")}</textarea>
        </label>`;

  todayRoutineList.innerHTML = `
    <div class="live-workout lw-finish-screen">
      <div class="lw-dots">${renderProgressDots(total, total, true)}</div>
      <div class="lw-finish">
        <div class="lw-ring" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>
        </div>
        <h3 class="lw-finish-title">Workout complete</h3>
        <p class="lw-finish-sub">${escapeHtml(routineName)} · ${loggedCount} of ${total} logged</p>
        ${anyLogged ? `<p class="lw-recap-hint">Here's what you logged. Effort you rated on each set is saved for your coach.</p>` : ""}
        ${customNote}
        <div class="lw-recap">
          ${exercises.map((ex) => {
            const effort = isExerciseLogged(ex) ? formatLoggedEffort(ex) : "";
            return `
            <div class="lw-recap-row${effort ? " has-diff" : ""}">
              <div class="lw-recap-top">
                <span>${escapeHtml(ex.name)}</span>
                <b>${escapeHtml(formatExerciseRecap(ex))}</b>
              </div>
              ${effort ? `<p class="lw-recap-effort">${escapeHtml(effort)}</p>` : ""}
            </div>
          `;
          }).join("")}
        </div>
        <button class="primary-button lw-save" type="button" data-action="finish-save">Save workout</button>
        <button class="quiet-button lw-finish-back" type="button" data-action="finish-back">Back to workout</button>
      </div>
    </div>
  `;
}

function renderTodayWorkout() {
  if (!todayRoutineList) return;

  if (!activeWorkout.exercises.length) {
    todayRoutineList.innerHTML = `
      <div class="live-workout">
        <div class="lw-topbar">
          <button class="quiet-button small-button btn-ico lw-back" type="button" data-action="lw-exit">${getUiIcon("arrow-left")}Exit</button>
          <span class="lw-count">${escapeHtml(activeWorkout.routineName || "Workout")}</span>
          <div class="lw-top-actions">
            <button class="lw-top-note" type="button" data-action="open-notes" aria-label="Add a note">${getUiIcon("notebook-pen")}</button>
            <button class="lw-exit" type="button" data-action="lw-exit">Exit</button>
          </div>
        </div>
        <div class="empty-routine">
          <p class="eyebrow">${activeWorkout.isCustom ? "Custom workout" : "Empty workout"}</p>
          <p>Add an exercise to start logging.</p>
          <button class="primary-button today-start-button btn-ico" type="button" data-action="open-live-add">${getUiIcon("plus-circle")}Add exercise</button>
        </div>
        ${renderLiveAddExerciseSheet()}
      </div>
    `;
    renderUiIcons();
    return;
  }

  // Keep the current index inside the list even if it somehow drifts.
  activeWorkout.currentIndex = clampNumber(activeWorkout.currentIndex, 0, activeWorkout.exercises.length - 1);

  if (activeWorkout.phase === "finish") {
    renderFinishScreen();
  } else {
    renderFocusedExercise();
  }
}

function getActiveExercise() {
  return activeWorkout.exercises[activeWorkout.currentIndex] || null;
}

// Live-update set weight/reps and cardio minutes as Daniel types, without
// re-rendering (so the field he's editing keeps focus).
function handleTodayWorkoutChange(event) {
  const input = event.target;
  const action = input.dataset?.action;
  const exercise = getActiveExercise();
  if (action === "custom-workout-note") {
    activeWorkout.substitutionNote = input.value;
    persistActiveWorkoutDraft();
    return;
  }
  if (!exercise) return;

  if (action === "set-field") {
    const si = Number(input.dataset.setIndex);
    const field = input.dataset.field;
    const set = exercise.sets?.[si];
    if (set && (field === "weight" || field === "reps")) {
      set[field] = clampNumber(input.value, 0, 9999);
    }
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "cardio-minutes") {
    exercise.actualDuration = clampNumber(input.value, 0, 1000);
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "cardio-subtype") {
    exercise.targetSubtype = input.value;
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "exercise-notes") {
    exercise.notes = input.value;
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "set-notes") {
    // Works for both strength sets and timed holds (whichever is on screen).
    const unit = activeUnits(exercise)[Number(input.dataset.setIndex)];
    if (unit) unit.notes = input.value;
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "live-add-search") {
    activeWorkout.addExerciseQuery = input.value;
    // Refresh only the results list so the search field keeps focus and the
    // mobile keyboard stays up. Re-rendering the whole screen here used to
    // recreate the focused input on every keystroke, which froze the sheet.
    const resultsEl = todayRoutineList.querySelector(".live-add-results");
    if (resultsEl) {
      resultsEl.innerHTML = renderLiveAddResults();
    } else {
      renderTodayWorkout();
    }
    return;
  }

  if (action === "sport-notes") {
    // Keep notes as typed (free text); never required.
    exercise.sportNotes = input.value;
    exercise.notes = input.value;
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "cardio-stat") {
    const field = input.dataset.field;
    const allowed = Object.keys(CARDIO_METRIC_META).map(liveCardioField);
    if (allowed.includes(field)) {
      // Keep as a string so an empty box stays empty rather than becoming 0.
      exercise[field] = input.value;
      persistActiveWorkoutDraft();
    }
  }
}

// MET value for a cardio activity, used only for the blank-calorie estimate.
// Deliberately coarse — it's a "roughly this many" fallback, not a lab figure.
function cardioMet(exerciseId, subtype) {
  const id = String(exerciseId || "");
  const sub = String(subtype || "").toLowerCase();
  if (sub.includes("walk")) return 3.8;
  if (id === "peloton-bike") return 8.5;
  if (id === "peloton-tread" || sub.includes("run")) return 9.8;
  return 7; // generic cardio default
}

// A rough calorie estimate for when the calories field is left blank. Peloton
// reports mechanical work in kJ and human efficiency makes burned kcal ~= that
// output, so output is the best signal; otherwise fall back to METs x body
// weight x time. Returns null when there isn't enough to estimate — a typed
// value always wins over this.
function estimateCardioCalories(ex) {
  const output = Number(ex.cardioOutput);
  if (output > 0) return Math.round(output);
  const minutes = Number(ex.actualDuration) || 0;
  if (minutes <= 0) return null;
  const weights = getBodyWeights();
  const latestLb = weights.length ? Number(weights[weights.length - 1].weight) : 0;
  if (!(latestLb > 0)) return null; // no body weight logged -> can't estimate
  const kg = latestLb / 2.20462;
  return Math.round(cardioMet(ex.exerciseId, ex.targetSubtype) * kg * (minutes / 60));
}

// Pull the filled-in cardio numbers off a live cardio exercise into a small
// object (only the ones actually entered). Calories fall back to a marked
// estimate when left blank. Returns null if there's nothing to save.
function collectCardioStats(ex) {
  const stats = {};
  const output = Number(ex.cardioOutput);
  const avgPower = Number(ex.cardioAvgPower);
  const distance = Number(ex.cardioDistance);
  const elevation = Number(ex.cardioElevation);
  const calories = Number(ex.cardioCalories);
  if (output > 0) stats.output = output;
  if (avgPower > 0) stats.avgPower = avgPower;
  if (distance > 0) stats.distance = distance;
  if (elevation > 0) stats.elevation = elevation;
  if (calories > 0) {
    stats.calories = calories; // a typed number always wins
  } else {
    const est = estimateCardioCalories(ex);
    if (est > 0) { stats.calories = est; stats.caloriesEstimated = true; }
  }
  return Object.keys(stats).length ? stats : null;
}

// Plain one-line "· 245 kJ · 136 w · 8.4 mi" tail for recaps/history, from a
// saved stats object. Empty string when there are no stats.
function formatCardioStats(stats) {
  if (!stats) return "";
  const parts = [];
  if (Number(stats.output) > 0) parts.push(`${stats.output} kJ`);
  if (Number(stats.avgPower) > 0) parts.push(`${stats.avgPower} w`);
  if (Number(stats.distance) > 0) parts.push(`${stats.distance} mi`);
  if (Number(stats.elevation) > 0) parts.push(`${stats.elevation} ft`);
  if (Number(stats.calories) > 0) parts.push(`${stats.caloriesEstimated ? "~" : ""}${stats.calories} kcal`);
  return parts.length ? ` · ${parts.join(" · ")}` : "";
}

// ---- Built-in countdown timer for held moves (Slice 2b) ----

// "M:SS.cc" readout (minutes, seconds, hundredths) like the mockup.
function formatTimer(ms) {
  if (ms < 0) ms = 0;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${m}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

// Point the live timer at the hold currently on screen: set the countdown to
// that hold's seconds and clear any previous run.
function initTimerForExercise(ex) {
  const t = activeWorkout.timer;
  cancelAnimationFrame(t.raf);
  const ms = Math.max(1, currentHoldSeconds(ex)) * 1000;
  t.total = ms;
  t.remaining = ms;
  t.running = false;
  t.finished = false;
  t.lastTs = 0;
  t.exerciseId = ex.id;
  t.holdIndex = activeWorkout.currentSet;
}

// Pause and clear the timer (used when leaving an exercise screen).
function stopTimer() {
  const t = activeWorkout.timer;
  t.running = false;
  cancelAnimationFrame(t.raf);
  t.lastTs = 0;
  t.finished = false;
}

// The countdown itself: updates the readout each animation frame so it doesn't
// trigger a full re-render while ticking. On reaching zero it flashes, buzzes,
// resets ready for the next hold, then clears the flash.
function timerLoop(ts) {
  const t = activeWorkout.timer;
  if (!t.running) return;
  if (!t.lastTs) t.lastTs = ts;
  t.remaining -= (ts - t.lastTs);
  t.lastTs = ts;

  const numEl = document.getElementById("lw-timer-num");
  if (numEl) numEl.textContent = formatTimer(t.remaining);

  if (t.remaining <= 0) {
    t.remaining = t.total;
    t.running = false;
    t.finished = true;
    t.lastTs = 0;
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    renderTodayWorkout();
    setTimeout(() => {
      if (activeWorkout.timer.finished) {
        activeWorkout.timer.finished = false;
        if (activeWorkout.started && activeWorkout.phase !== "finish") renderTodayWorkout();
      }
    }, 2200);
    return;
  }
  t.raf = requestAnimationFrame(timerLoop);
}

// Whole-second clock for the rest countdown ("1:30", "0:45"). Calmer than the
// centisecond hold readout, and it reaches 0:00 exactly when rest is up.
function formatClockSeconds(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Begin the guided rest countdown before the next set/hold of `ex`.
function startRestTimer(ex) {
  const r = activeWorkout.rest;
  cancelAnimationFrame(r.raf);
  const ms = Math.max(1, Number(ex.restSeconds) || 0) * 1000;
  r.active = true;
  r.total = ms;
  r.remaining = ms;
  r.running = true;
  r.lastTs = 0;
  r.exerciseId = ex.id;
  r.raf = requestAnimationFrame(restLoop);
  renderTodayWorkout();
}

// Cancel the rest countdown without advancing (used when leaving the screen).
function stopRest() {
  const r = activeWorkout.rest;
  cancelAnimationFrame(r.raf);
  r.active = false;
  r.running = false;
  r.lastTs = 0;
}

// End the rest (timer hit zero, or you tapped Proceed) and show the next set.
// currentSet was already advanced when the set was completed, so a plain
// re-render lands on the next set/hold.
function finishRest() {
  stopRest();
  if (activeWorkout.started && activeWorkout.phase !== "finish") renderTodayWorkout();
  persistActiveWorkoutDraft();
}

// The rest countdown loop: updates the readout each frame without a full
// re-render, then buzzes and auto-advances to the next set when it reaches zero.
function restLoop(ts) {
  const r = activeWorkout.rest;
  if (!r.running) return;
  if (!r.lastTs) r.lastTs = ts;
  r.remaining -= (ts - r.lastTs);
  r.lastTs = ts;

  const numEl = document.getElementById("lw-rest-num");
  if (numEl) numEl.textContent = formatClockSeconds(r.remaining);

  if (r.remaining <= 0) {
    r.remaining = 0;
    r.running = false;
    r.lastTs = 0;
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    finishRest();
    return;
  }
  r.raf = requestAnimationFrame(restLoop);
}

// The rest screen body (slots into the focused-exercise shell, so the hero,
// target and coach note stay in view). One clear "Proceed" override plus +15s.
function renderRestBody(ex) {
  const r = activeWorkout.rest;
  const units = activeUnits(ex);
  const nextIdx = activeWorkout.currentSet;
  const unitWord = ex.type === "timed" ? "hold" : "set";
  const nextLabel = nextIdx < units.length
    ? `Next: ${unitWord} ${nextIdx + 1} of ${units.length}`
    : "Next exercise";
  return `
    <div class="lw-rest-screen">
      <p class="lw-rest-eyebrow">Rest</p>
      <div class="lw-rest-num" id="lw-rest-num" aria-live="off">${formatClockSeconds(r.remaining)}</div>
      <p class="lw-rest-next">${escapeHtml(nextLabel)}</p>
      <div class="lw-rest-controls">
        <button class="lw-tbtn" type="button" data-action="rest-add" data-delta="15">+15s</button>
        <button class="lw-tbtn primary btn-ico" type="button" data-action="rest-proceed">${getUiIcon("chevron-right")}Proceed to ${unitWord}</button>
      </div>
    </div>`;
}

function advanceLiveWorkout() {
  if (activeWorkout.flowMode === "round") {
    moveToRoundPosition(findNextRoundPosition());
  } else if (activeWorkout.currentIndex < activeWorkout.exercises.length - 1) {
    activeWorkout.currentIndex += 1;
    activeWorkout.currentSet = 0;
  } else {
    activeWorkout.phase = "finish";
  }
}

function moveBackLiveWorkout() {
  if (activeWorkout.flowMode === "round") {
    const prev = findPreviousRoundPosition();
    if (prev) {
      moveToRoundPosition(prev);
      return true;
    }
    return false;
  }
  const exercise = getActiveExercise();
  const paged = exercise && (exercise.type === "strength" || exercise.type === "timed");
  if (paged && activeWorkout.currentSet > 0) {
    activeWorkout.currentSet -= 1;
    return true;
  }
  if (activeWorkout.currentIndex > 0) {
    activeWorkout.currentIndex -= 1;
    const prev = activeWorkout.exercises[activeWorkout.currentIndex];
    activeWorkout.currentSet = (prev && (prev.type === "strength" || prev.type === "timed"))
      ? Math.max(0, activeUnits(prev).length - 1)
      : 0;
    return true;
  }
  return false;
}

async function handleTodayWorkoutClick(event) {
  // Tapping a preview row (before a workout starts) opens its "How to do it"
  // card. Handled before the button check since the row is an <article>.
  const previewCard = event.target.closest('[data-action="preview-how-to"]');
  if (previewCard) {
    openTodayReference(previewCard.dataset.id);
    return;
  }

  const button = event.target.closest("button");
  if (!button) return;
  const action = button.dataset.action;
  const exercise = getActiveExercise();

  // Capture an idea mid-workout. Handled before the rest-timer checks so opening
  // notes never cancels an active rest countdown.
  if (action === "open-notes") {
    openNotesModal({ source: "workout" });
    return;
  }

  if (action === "start-rest" && exercise) {
    if (!canStartVisibleRest(exercise)) return;
    startRestTimer(exercise);
    persistActiveWorkoutDraft();
    return;
  }

  // Extend the rest countdown without leaving the rest screen.
  if (action === "rest-add") {
    const r = activeWorkout.rest;
    if (!r.active) return;
    const delta = (Number(button.dataset.delta) || 0) * 1000;
    r.remaining = Math.max(1000, r.remaining + delta);
    r.total += delta;
    const numEl = document.getElementById("lw-rest-num");
    if (numEl) numEl.textContent = formatClockSeconds(r.remaining);
    persistActiveWorkoutDraft();
    return;
  }

  // Any other tap while resting leaves the rest screen (Proceed is the explicit
  // override; navigation buttons cancel rest then run their own handler below).
  if (activeWorkout.rest.active) {
    stopRest();
    if (action === "rest-proceed" || !action) {
      renderTodayWorkout();
      persistActiveWorkoutDraft();
      return;
    }
  }

  if (action === "close-flow-choice") {
    closeWorkoutFlowChoice();
    return;
  }

  if (action === "start-flow") {
    startTodayWorkout(button.dataset.flow || "straight");
    return;
  }

  if (action === "start-empty-workout" || action === "start-custom-workout") {
    startCustomWorkout();
    return;
  }

  if (action === "lw-back") {
    stopTimer();
    activeWorkout.editTargetsOpen = false;
    activeWorkout.referenceOpen = false;
    const moved = moveBackLiveWorkout();
    if (!moved) {
      const ok = await showConfirmModal({
        title: "Leave this workout?",
        message: "Your progress is saved as a draft, but leaving exits the focused workout screen.",
        confirmLabel: "Leave workout",
        danger: false
      });
      if (!ok) return;
      exitTodayWorkout();
      return;
    }
    persistActiveWorkoutDraft();
    renderTodayWorkout();
    return;
  }

  if (action === "lw-exit") {
    const ok = await showConfirmModal({
      title: "Exit workout?",
      message: "Your current progress is saved as a draft. You can resume it later unless you discard it.",
      confirmLabel: "Exit",
      danger: false
    });
    if (!ok) return;
    exitTodayWorkout();
    return;
  }

  if (action === "lw-next") {
    stopTimer();
    activeWorkout.editTargetsOpen = false;
    activeWorkout.referenceOpen = false;
    if (exercise && !exercise.skipped && !isExerciseLogged(exercise)) {
      const ok = await showConfirmModal({
        title: "Move on without logging this?",
        message: "You can continue, but this exercise will not count unless you log work or skip it intentionally.",
        confirmLabel: "Move on",
        danger: false
      });
      if (!ok) return;
    }
    advanceLiveWorkout();
    persistActiveWorkoutDraft();
    renderTodayWorkout();
    return;
  }

  if (action === "timer-toggle" && exercise) {
    const t = activeWorkout.timer;
    if (t.exerciseId !== exercise.id || t.holdIndex !== activeWorkout.currentSet) initTimerForExercise(exercise);
    if (t.running) {
      t.running = false;
      cancelAnimationFrame(t.raf);
    } else {
      t.running = true;
      t.finished = false;
      t.lastTs = 0;
      t.raf = requestAnimationFrame(timerLoop);
    }
    renderTodayWorkout();
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "timer-reset" && exercise) {
    const t = activeWorkout.timer;
    if (t.running) return;
    t.remaining = t.total;
    t.finished = false;
    t.lastTs = 0;
    renderTodayWorkout();
    persistActiveWorkoutDraft();
    return;
  }

  // Adjust the seconds for the hold on screen (timed move). Keeps the live
  // countdown in sync if it's pointed at this hold and not currently running.
  if (action === "set-seconds-step" && exercise) {
    if (activeWorkout.timer.running) return;
    const si = Number(button.dataset.setIndex);
    const hold = exercise.holds?.[si];
    if (hold) {
      const delta = Number(button.dataset.delta) || 0;
      hold.seconds = clampNumber((Number(hold.seconds) || 0) + delta, 5, 600);
      if (activeWorkout.timer.exerciseId === exercise.id && activeWorkout.currentSet === si) {
        initTimerForExercise(exercise);
      }
      renderTodayWorkout();
      persistActiveWorkoutDraft();
    }
    return;
  }

  // Expand/collapse the optional 1-10 effort chips for a set/hold.
  if (action === "toggle-effort" && exercise) {
    const key = `${exercise.id}:${Number(button.dataset.setIndex)}`;
    activeWorkout.effortOpenKey = activeWorkout.effortOpenKey === key ? null : key;
    renderTodayWorkout();
    return;
  }

  // Pick (or clear, by re-tapping) the optional effort for a set/hold/exercise.
  if (action === "set-effort" && exercise) {
    const si = Number(button.dataset.setIndex);
    const value = Number(button.dataset.value);
    const unit = si === -1 ? exercise : activeUnits(exercise)[si];
    if (unit && value >= 1 && value <= 10) {
      unit.difficulty = unit.difficulty === value ? null : value;
      activeWorkout.effortOpenKey = null;
      renderTodayWorkout();
      persistActiveWorkoutDraft();
    }
    return;
  }

  if (action === "open-targets" && exercise) {
    if (activeWorkout.timer.running) return;
    activeWorkout.editTargetsOpen = true;
    activeWorkout.referenceOpen = false;
    renderTodayWorkout();
    return;
  }

  if (action === "close-targets") {
    activeWorkout.editTargetsOpen = false;
    renderTodayWorkout();
    return;
  }

  if (action === "open-reference" && exercise) {
    activeWorkout.referenceOpen = true;
    activeWorkout.editTargetsOpen = false;
    renderTodayWorkout();
    return;
  }

  if (action === "close-reference") {
    activeWorkout.referenceOpen = false;
    renderTodayWorkout();
    return;
  }

  if (action === "target-step" && exercise) {
    if (activeWorkout.timer.running) return;
    const field = button.dataset.field;
    const delta = Number(button.dataset.delta) || 0;
    const min = Number(button.dataset.min) || 0;
    const max = Number(button.dataset.max) || 9999;
    adjustTodayTarget(exercise, field, delta, min, max);
    renderTodayWorkout();
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "set-weight-step" && exercise) {
    const si = Number(button.dataset.setIndex);
    const set = exercise.sets?.[si];
    if (set) {
      const delta = Number(button.dataset.delta) || 0;
      if (isBarbellLift(exercise)) {
        // delta is per-side; keep set.weight as the TOTAL = bar + both sides.
        const newPerSide = Math.max(0, perSideFromTotal(set.weight) + delta);
        set.weight = clampNumber(BAR_WEIGHT_LB + 2 * newPerSide, BAR_WEIGHT_LB, 9999);
      } else {
        set.weight = clampNumber((Number(set.weight) || 0) + delta, 0, 9999);
      }
      set.touchedWeight = true;
      if (si === 0) {
        (exercise.sets || []).forEach((futureSet, idx) => {
          if (idx > 0 && !futureSet.done && !futureSet.touchedWeight) futureSet.weight = set.weight;
        });
      }
      renderTodayWorkout();
      persistActiveWorkoutDraft();
    }
    return;
  }

  if (action === "set-reps-step" && exercise) {
    const si = Number(button.dataset.setIndex);
    const set = exercise.sets?.[si];
    if (set) {
      const delta = Number(button.dataset.delta) || 0;
      set.reps = clampNumber((Number(set.reps) || 0) + delta, 0, 9999);
      set.touchedReps = true;
      if (si === 0) {
        (exercise.sets || []).forEach((futureSet, idx) => {
          if (idx > 0 && !futureSet.done && !futureSet.touchedReps) futureSet.reps = set.reps;
        });
      }
      renderTodayWorkout();
      persistActiveWorkoutDraft();
    }
    return;
  }

  // Complete / Skip drive the one-set-per-page flow (strength sets and timed
  // holds alike): mark the unit, then advance to the next (or the wrap page once
  // past the last one).
  if ((action === "complete-set" || action === "skip-set") && exercise) {
    const s = activeWorkout.currentSet;
    const unit = activeUnits(exercise)[s];
    if (unit) unit.done = action === "complete-set";
    activeWorkout.effortOpenKey = null;
    if (exercise.type === "timed") stopTimer();
    if (activeWorkout.flowMode === "round") {
      advanceLiveWorkout();
    } else {
      activeWorkout.currentSet = s + 1;
      // Guided rest before the next set/hold, when the coach asked for a timer
      // and there's actually another unit to come. Skipping a set goes straight
      // through (no rest earned). The rest screen always offers Proceed.
      const units = activeUnits(exercise);
      if (action === "complete-set" && exercise.restTimer && Number(exercise.restSeconds) > 0
          && activeWorkout.currentSet < units.length) {
        startRestTimer(exercise);
        persistActiveWorkoutDraft();
        return;
      }
    }
    persistActiveWorkoutDraft();
    renderTodayWorkout();
    return;
  }

  if (action === "goto-set" && exercise) {
    if (exercise.type === "timed") stopTimer();
    activeWorkout.effortOpenKey = null;
    activeWorkout.currentSet = clampNumber(Number(button.dataset.setIndex), 0, activeUnits(exercise).length);
    renderTodayWorkout();
    return;
  }

  if (action === "add-set-page" && exercise) {
    if (exercise.type === "timed") {
      const holds = exercise.holds || (exercise.holds = []);
      const last = holds[holds.length - 1];
      holds.push({
        seconds: last ? last.seconds : (exercise.holdSeconds || 45),
        done: false,
        notes: "",
        difficulty: null
      });
      activeWorkout.currentSet = holds.length - 1;
    } else {
      const last = exercise.sets?.[exercise.sets.length - 1];
      exercise.sets.push({
        weight: last ? last.weight : 0,
        reps: last ? last.reps : (exercise.targetReps || 0),
        done: false,
        notes: "",
        difficulty: null,
        touchedWeight: false,
        touchedReps: false
      });
      activeWorkout.currentSet = exercise.sets.length - 1;
    }
    renderTodayWorkout();
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "toggle-set" && exercise) {
    const si = Number(button.dataset.setIndex);
    const set = exercise.sets?.[si];
    if (set) set.done = !set.done;
    renderTodayWorkout();
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "add-set" && exercise) {
    const last = exercise.sets?.[exercise.sets.length - 1];
    exercise.sets.push({
      weight: last ? last.weight : 0,
      reps: last ? last.reps : (exercise.targetReps || 0),
      done: false,
      notes: "",
      touchedWeight: false,
      touchedReps: false
    });
    renderTodayWorkout();
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "remove-set" && exercise) {
    if ((exercise.sets || []).length > 1) exercise.sets.pop();
    renderTodayWorkout();
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "toggle-cardio" && exercise) {
    exercise.cardioDone = !exercise.cardioDone;
    renderTodayWorkout();
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "toggle-sport" && exercise) {
    exercise.sportDone = !exercise.sportDone;
    renderTodayWorkout();
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "open-live-add") {
    openLiveAddExercise();
    return;
  }

  if (action === "close-live-add") {
    closeLiveAddExercise();
    return;
  }

  if (action === "add-live-exercise") {
    addExerciseToLiveWorkout(button.dataset.id);
    return;
  }

  if (action === "live-add-filter") {
    activeWorkout.addExerciseFilter = button.dataset.filter || "all";
    renderTodayWorkout();
    return;
  }

  if (action === "skip-exercise" && exercise) {
    const ok = await showConfirmModal({
      title: `Skip ${exercise.name}?`,
      message: "This skips the whole exercise for this workout. You can still review it in the finish screen.",
      confirmLabel: "Skip exercise",
      danger: false
    });
    if (!ok) return;
    exercise.skipped = true;
    advanceLiveWorkout();
    persistActiveWorkoutDraft();
    renderTodayWorkout();
    return;
  }

  if (action === "finish-back") {
    activeWorkout.phase = "exercise";
    persistActiveWorkoutDraft();
    renderTodayWorkout();
    return;
  }

  if (action === "finish-save") {
    // Guard against double-submit: while the save is in flight the button is
    // disabled and shows a spinner, so a second tap can't create a duplicate.
    if (isSavingWorkout) return;
    isSavingWorkout = true;
    if (button) {
      button.disabled = true;
      button.classList.add("is-saving");
      button.innerHTML = `<span class="lw-save-spinner" aria-hidden="true"></span>Saving…`;
    }
    saveTodayWorkout()
      .catch((error) => {
        console.error("Error saving today's workout:", error);
        showStatusModal({ title: "Save failed", message: error.message, tone: "bad" });
      })
      .finally(() => {
        isSavingWorkout = false;
        // The button may be gone (save resets the screen on success); only
        // restore it if it's still on screen (e.g. after "nothing to save").
        if (button && button.isConnected) {
          button.disabled = false;
          button.classList.remove("is-saving");
          button.textContent = "Save workout";
        }
      });
  }
}

// True while a workout save is in flight, so finish-save can't be fired twice.
let isSavingWorkout = false;

// Roll a list of per-set/per-hold efforts up into one exercise-level number
// (rounded average of the rated ones) for Progress and the AI export, which
// read a single entry.difficulty. Returns null when nothing was rated.
function rollupDifficulty(units) {
  const rated = (units || [])
    .map((u) => Number(u.difficulty))
    .filter((v) => Number.isFinite(v) && v > 0);
  if (!rated.length) return null;
  return Math.round(rated.reduce((a, b) => a + b, 0) / rated.length);
}

async function saveTodayWorkout() {
  const viewedRoutine = getTodayPlannedRoutine();
  const routine = activeWorkout.routineId && viewedRoutine?.id === activeWorkout.routineId
    ? viewedRoutine
    : null;
  const workoutName = activeWorkout.isCustom
    ? (activeWorkout.routineName || "Custom workout")
    : (routine?.name || activeWorkout.routineName || "Workout");

  const loggedExercises = activeWorkout.exercises.filter((ex) => isExerciseLogged(ex) || ex.skipped);
  if (loggedExercises.length === 0) {
    await showStatusModal({ title: "Nothing to save yet", message: "Log at least one set or skip an exercise before saving.", tone: "warn" });
    return;
  }

  const data = getLocalData();
  const savedAt = new Date().toISOString();
  data.updatedAt = savedAt;
  data.updatedBy = getDeviceId();
  data.workouts = Array.isArray(data.workouts) ? data.workouts : [];

  const loggedEntries = loggedExercises
    .map((ex) => {
      if (ex.skipped && !isExerciseLogged(ex)) {
        return {
          id: ex.id,
          type: ex.type,
          exerciseId: ex.exerciseId,
          exerciseName: ex.name,
          planned: {
            sets: ex.targetSets || 0,
            reps: ex.targetReps || 0,
            weight: ex.targetWeight || 0,
            durationMinutes: ex.targetDuration || 0,
            subtype: ex.targetSubtype || ""
          },
          skipped: true,
          flowMode: activeWorkout.flowMode
        };
      }

      if (ex.type === "cardio") {
        const stats = collectCardioStats(ex);
        const entry = {
          id: ex.id,
          type: "cardio",
          exerciseId: ex.exerciseId,
          exerciseName: ex.name,
          planned: {
            durationMinutes: ex.targetDuration || 0,
            subtype: ex.targetSubtype || ""
          },
          subtype: ex.targetSubtype || "",
          durationMinutes: Number(ex.actualDuration) || 0,
          done: true,
          notes: (ex.notes || "").trim(),
          flowMode: activeWorkout.flowMode
        };
        if (Number.isFinite(ex.difficulty) && ex.difficulty > 0) entry.difficulty = ex.difficulty;
        if (!entry.notes) delete entry.notes;
        if (stats) entry.stats = stats;
        return entry;
      }

      // Sport (e.g. soccer): a duration plus an optional free-text note.
      if (ex.type === "sport") {
        const note = (ex.sportNotes || "").trim();
        const entry = {
          id: ex.id,
          type: "sport",
          exerciseId: ex.exerciseId,
          exerciseName: ex.name,
          planned: {
            durationMinutes: ex.targetDuration || 0
          },
          durationMinutes: Number(ex.actualDuration) || 0,
          done: true,
          flowMode: activeWorkout.flowMode
        };
        if (Number.isFinite(ex.difficulty) && ex.difficulty > 0) entry.difficulty = ex.difficulty;
        if (note) entry.notes = note;
        return entry;
      }

      // Held move: record each completed hold with its own seconds (so 60/60/45
      // reads faithfully), plus optional per-hold note and effort.
      if (ex.type === "timed") {
        const doneHolds = (ex.holds || []).filter((hold) => hold.done);
        const entry = {
          id: ex.id,
          type: "timed",
          exerciseId: ex.exerciseId,
          exerciseName: ex.name,
          planned: {
            sets: ex.targetSets || (ex.holds || []).length,
            seconds: ex.holdSeconds || 0
          },
          actualSummary: {
            sets: doneHolds.length,
            // Back-compat single number = the first completed hold's length.
            seconds: Number(doneHolds[0]?.seconds) || Number(ex.holdSeconds) || 0
          },
          holds: doneHolds.map((hold, idx) => {
            const row = { id: `hold-${idx + 1}`, holdNumber: idx + 1, seconds: Number(hold.seconds) || 0, done: true };
            const note = (hold.notes || "").trim();
            if (note) row.notes = note;
            if (Number.isFinite(hold.difficulty) && hold.difficulty > 0) row.difficulty = hold.difficulty;
            return row;
          }),
          notes: (ex.notes || "").trim(),
          flowMode: activeWorkout.flowMode
        };
        const rolled = rollupDifficulty(doneHolds);
        if (rolled) entry.difficulty = rolled;
        if (!entry.notes) delete entry.notes;
        return entry;
      }

      // Save the sets that were actually checked off, each with its own
      // weight and reps. The summary keeps History's one-line view working.
      const doneSets = (ex.sets || []).filter((set) => set.done);
      const topWeight = doneSets.reduce((max, set) => Math.max(max, Number(set.weight) || 0), 0);
      const repsAtTop = doneSets.find((set) => (Number(set.weight) || 0) === topWeight)?.reps || 0;

      const entry = {
        id: ex.id,
        type: "strength",
        exerciseId: ex.exerciseId,
        exerciseName: ex.name,
        planned: {
          sets: ex.targetSets || 0,
          reps: ex.targetReps || 0,
          weight: ex.targetWeight || 0
        },
        actualSummary: {
          sets: doneSets.length,
          reps: Number(repsAtTop) || 0,
          weight: usesWeightMetric(ex) ? (Number(topWeight) || 0) : 0
        },
        sets: doneSets.map((set, i) => {
          const row = {
            id: `set-${i + 1}`,
            setNumber: i + 1,
            reps: Number(set.reps) || 0,
            weight: usesWeightMetric(ex) ? (Number(set.weight) || 0) : 0,
            done: true,
            notes: (set.notes || "").trim()
          };
          if (Number.isFinite(set.difficulty) && set.difficulty > 0) row.difficulty = set.difficulty;
          return row;
        }),
        notes: (ex.notes || "").trim(),
        metricProfile: ex.metricProfile,
        flowMode: activeWorkout.flowMode
      };
      const rolled = rollupDifficulty(doneSets);
      if (rolled) entry.difficulty = rolled;
      return entry;
    });

  const savedWorkout = {
    id: `workout-${Date.now()}-${randomString(6)}`,
    name: workoutName,
    date: getTodayDateString(),
    startedAt: activeWorkout.startedAt,
    savedAt,
    createdBy: getDeviceId(),
    fromRoutine: routine?.id || null,
    routineName: workoutName,
    flowMode: activeWorkout.flowMode,
    entries: loggedEntries
  };
  // A whole-session note is available on any workout, not just custom ones -
  // only `custom`/`replacedRoutine` stay custom-only, since those describe a
  // routine swap that a planned workout never has.
  const sessionNote = (activeWorkout.substitutionNote || "").trim();
  if (sessionNote) savedWorkout.substitutionNote = sessionNote;
  if (activeWorkout.isCustom) {
    savedWorkout.custom = true;
    if (activeWorkout.replacedRoutineId || activeWorkout.replacedRoutineName) {
      savedWorkout.replacedRoutine = {
        id: activeWorkout.replacedRoutineId || null,
        name: activeWorkout.replacedRoutineName || ""
      };
    }
  }

  data.workouts.push(savedWorkout);
  data.completedWorkouts = Array.isArray(data.completedWorkouts) ? data.completedWorkouts : [];
  if (!data.completedWorkouts.includes(getTodayDateString())) {
    data.completedWorkouts.push(getTodayDateString());
  }
  saveLocalData(data);
  markPendingData(data);

  if (!navigator.onLine) {
    await showStatusModal({ title: "Workout saved", message: "Saved on this device. It will sync when internet is back.", tone: "warn" });
    resetLiveWorkoutState();
    clearActiveWorkoutDraft();
    resetViewedDayToToday();
    renderTodayRoutine();
    renderHistory();
    return;
  }

  try {
    await uploadWorkoutData(data);
    clearPendingData();
    await showStatusModal({ title: "Workout saved", message: "Saved and synced across your devices.", tone: "good" });
    resetLiveWorkoutState();
    clearActiveWorkoutDraft();
    resetViewedDayToToday();
    renderTodayRoutine();
    renderHistory();
  } catch (error) {
    await showStatusModal({ title: "Saved locally", message: `${error.message} Workout is saved on this device for now.`, tone: "warn" });
    renderHistory();
  }
}

const savedAppKey = localStorage.getItem(STORAGE.appKey);
if (savedAppKey && appKeyInput) {
  appKeyInput.value = savedAppKey;
}

function showScreen(name, remember = false) {
  const requestedName = name === "log" ? "today" : name;
  const validName = screens.some((screen) => screen.dataset.screen === requestedName) ? requestedName : "today";
  if (remember) localStorage.setItem(STORAGE.activeTab, validName);

  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === validName);
  });

  tabs.forEach((tab) => {
    const isActive = tab.dataset.target === validName;
    tab.classList.toggle("is-active", isActive);
    if (isActive) {
      tab.setAttribute("aria-current", "page");
    } else {
      tab.removeAttribute("aria-current");
    }
  });

  if (validName === "history") {
    renderHistory();
  }

  if (validName === "plan") {
    renderPlan();
  }

  if (validName === "coach") {
    renderCoach();
  }

  if (validName === "progress") {
    renderProgress();
  }

  // The review reminder is a global banner above the tabs, so keep it current
  // on every navigation regardless of which screen we land on.
  renderReviewReminder();
}

function setSyncStatus(message, tone = "") {
  if (syncStatus) {
    syncStatus.textContent = message;
    syncStatus.className = tone ? `sync-status ${tone}` : "sync-status";
  }

  if (syncPill) {
    syncPill.title = message;
  }
}

function setConnectionUi(message, tone = "") {
  if (syncPill) {
    const hasDropbox = Boolean(localStorage.getItem(STORAGE.refreshToken) || getStoredAccessToken());
    syncPill.className = tone ? `sync-pill ${tone}` : "sync-pill";
    syncPill.disabled = false;
    syncPill.title = "Open sync panel";
    if (syncPillLabel) {
      syncPillLabel.textContent = message;
    }
    if (connectDropboxButton) connectDropboxButton.disabled = !navigator.onLine || hasDropbox;
    if (retrySyncButton) retrySyncButton.disabled = !navigator.onLine || !hasDropbox || !hasPendingData();
    if (loadLatestButton) loadLatestButton.disabled = !navigator.onLine || !hasDropbox || hasPendingData();
    if (resetDropboxButton) resetDropboxButton.disabled = !hasDropbox;
  }
}

function toggleSyncPanel(forceOpen) {
  if (!syncPanel || !syncPill) return;
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : syncPanel.hidden;
  syncPanel.hidden = !shouldOpen;
  syncPill.setAttribute("aria-expanded", String(shouldOpen));
}

function closeSyncPanelFromOutside(event) {
  if (!syncPanel || syncPanel.hidden) return;
  if (event.target.closest(".sync-menu")) return;
  toggleSyncPanel(false);
}

function describeCurrentSyncState() {
  const hasDropbox = Boolean(localStorage.getItem(STORAGE.refreshToken) || getStoredAccessToken());
  if (!navigator.onLine) {
    return hasPendingData()
      ? ["Offline. Changes are safe here and waiting to sync.", "warn"]
      : ["Offline. Local backup is ready on this device.", "warn"];
  }
  if (hasPendingData()) return ["Changes are waiting to sync to Dropbox.", "warn"];
  if (hasDropbox) return ["Dropbox is connected and ready.", "good"];
  return ["Local backup is ready. Connect Dropbox to sync across devices.", ""];
}

function refreshSyncPanelText() {
  updateCloudUi();
}

function getRedirectUri() {
  return `${window.location.origin}${window.location.pathname}`;
}

function getDeviceId() {
  let deviceId = localStorage.getItem(STORAGE.deviceId);
  if (!deviceId) {
    deviceId = `device-${randomString(10)}`;
    localStorage.setItem(STORAGE.deviceId, deviceId);
  }
  return deviceId;
}

function randomString(length = 64) {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => possible[value % possible.length]).join("");
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  return crypto.subtle.digest("SHA-256", data);
}

function makeEmptyData() {
  return {
    schemaVersion: 1,
    appName: "Training Book",
    updatedAt: null,
    updatedBy: getDeviceId(),
    activePlan: getStarterActivePlan(),
    routines: getStarterRoutines(),
    weeklyPlan: getStarterWeeklyPlan(),
    library: getStarterExercises(),
    categories: getStarterCategories(),
    completedWorkouts: [],
    missedWorkouts: [],
    testEntries: [],
    workouts: [],
    bodyWeights: [],
    weightTarget: null,
    // App/product notes (feature ideas, bugs). Deliberately separate from
    // workout history so a quick idea can never land in a logged session.
    appNotes: []
  };
}

function getStarterActivePlan() {
  return {
    name: "Current Training Plan",
    mainGoal: "",
    notes: "",
    reviewCadence: "Weekly AI review",
    nextReviewDate: "",
    // A small number of plan-aware focus goals (F2 slice: Bench Press first,
    // 1-3 max later). Empty until the coach or Daniel sets one through the
    // user-confirmed coach apply flow - never invented by the app.
    focusGoals: []
  };
}

// A brand-new account starts with a BLANK plan: no routines and an empty weekly
// schedule. Each person builds their own plan (or imports one from their AI
// coach) on top of the shared starter exercise library. This keeps the app
// genuinely multi-user - e.g. a second person signs in with their own Google
// account and gets a clean slate, not someone else's starter routines. (The
// shared catalog still comes from getStarterExercises / getStarterCategories.)
function getStarterRoutines() {
  return [];
}

function getStarterWeeklyPlan() {
  return {
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null
  };
}

function readJson(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getLocalData() {
  const data = readJson(STORAGE.localData) || makeEmptyData();

  if (!data.activePlan || typeof data.activePlan !== "object") {
    data.activePlan = getStarterActivePlan();
  } else {
    data.activePlan = { ...getStarterActivePlan(), ...data.activePlan };
  }

  // Migrate old data to include routines and weekly plan if missing. An empty
  // routines array is valid: it means Daniel intentionally cleared routines.
  if (!Array.isArray(data.routines)) {
    data.routines = getStarterRoutines();
  }
  if (!data.weeklyPlan || typeof data.weeklyPlan !== 'object') {
    data.weeklyPlan = getStarterWeeklyPlan();
  }
  // Older saved data predates the editable library: seed it once with the
  // 12 starters. (An empty array is left alone - that means Daniel cleared it.)
  if (!Array.isArray(data.library)) {
    data.library = getStarterExercises();
  }
  // Filter categories became editable data after the library did. Older saved
  // data has no `categories`, so seed it once with the original six.
  if (!Array.isArray(data.categories)) {
    data.categories = getStarterCategories();
  }
  if (!Array.isArray(data.completedWorkouts)) {
    data.completedWorkouts = [];
  }
  if (!Array.isArray(data.missedWorkouts)) {
    data.missedWorkouts = [];
  }
  // Body-weight tracking (Step 9): a list of { date, weight } and an optional
  // target weight. Older saved data predates these, so seed them once.
  if (!Array.isArray(data.bodyWeights)) {
    data.bodyWeights = [];
  }
  if (typeof data.weightTarget === "undefined") {
    data.weightTarget = null;
  }
  // App/product notes arrived after the rest of the shape. Older saved data has
  // no `appNotes`, so seed it once with an empty list. An empty array is valid:
  // it just means no notes have been captured yet.
  if (!Array.isArray(data.appNotes)) {
    data.appNotes = [];
  }

  return data;
}

// localStorage is capped per-site (~5MB in Safari), separate from the device's
// own free space. The rolling undo snapshots are by far the largest tenants, so
// when a write overflows we shed them first (then the pending-sync mirror, whose
// data also lives in localData) and retry. The real working data must always win
// the space fight: losing an undo cache is recoverable; losing the save the user
// just tapped is not.
function isQuotaError(error) {
  return Boolean(error) && (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.code === 22 || error.code === 1014
  );
}

function setItemSafe(key, value) {
  try {
    localStorage.setItem(key, value);
    return;
  } catch (error) {
    if (!isQuotaError(error)) throw error;
  }
  // Out of room: drop the most expendable keys one at a time, retrying after
  // each, so the write that matters can still land.
  for (const dropKey of [STORAGE.localSnapshots, STORAGE.pendingData]) {
    if (dropKey === key) continue;
    localStorage.removeItem(dropKey);
    try {
      localStorage.setItem(key, value);
      return;
    } catch (error) {
      if (!isQuotaError(error)) throw error;
    }
  }
  // Even after clearing the caches there is no room. Surface a clear, honest
  // message instead of a cryptic quota exception.
  throw new Error("This device's browser storage for the app is full. Your data is safe in the cloud - sign out and back in on this device to free space.");
}

function saveLocalData(data) {
  setItemSafe(STORAGE.localData, JSON.stringify(data));
}

function markPendingData(data) {
  setItemSafe(STORAGE.pendingData, JSON.stringify(data));
  // Every real edit becomes a one-tap undo point on this device (deduped, so a
  // run of identical saves doesn't flood the list).
  pushLocalSnapshot("after edit", data);
  updateConnectionState();
}

function clearPendingData() {
  localStorage.removeItem(STORAGE.pendingData);
  updateConnectionState();
}

function hasPendingData() {
  return Boolean(localStorage.getItem(STORAGE.pendingData));
}

// Multi-user safety: the working copy in localStorage belongs to exactly ONE
// account at a time. When a different person signs in on this device, wipe that
// working set so the new account starts clean from its own cloud document and
// the previous account's data can never bleed in (or, worse, be merged back and
// pushed onto the wrong cloud doc). The previous account's real data is
// untouched - it lives safely in its own users/{uid} document and version
// history. Local snapshots and any in-progress workout draft belong to the
// previous owner too, so they're cleared as well.
function clearDeviceLocalData() {
  localStorage.removeItem(STORAGE.localData);
  localStorage.removeItem(STORAGE.localSnapshots);
  localStorage.removeItem(STORAGE.pendingData);
  localStorage.removeItem(STORAGE.activeWorkoutDraft);
}

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

// ===== App / product notes =====
// A small global notes surface for Daniel's feature ideas and agent notes,
// opened from the header (and from the live-workout topbar, where the header is
// hidden). Notes live under data.appNotes, completely separate from workout
// history, and can be copied/exported as plain markdown so a future coding agent
// can read them without any private Firebase credentials.
let notesModalOpen = false;
let editingNoteId = null;           // id of the note being edited inline (null = none)
let pendingNoteSource = "manual";   // tags new notes with where they were captured

// The lanes a note can sit in. Kept tiny on purpose: enough to triage, not a
// whole project board. Order here is the order shown in the compose dropdown.
const NOTE_LANES = [
  { key: "idea", label: "Idea" },
  { key: "bug", label: "Bug" },
  { key: "now", label: "Priority" }
];

function noteLaneLabel(key) {
  return NOTE_LANES.find((l) => l.key === key)?.label || "Idea";
}

function makeNoteId() {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Raw list, including delete tombstones - only mergeAppNotes() and the
// add/edit/delete/toggle actions below (which must pass tombstones through
// unchanged when they persist) should read this directly.
function getAppNotes() {
  const data = getLocalData();
  return Array.isArray(data.appNotes) ? data.appNotes : [];
}

// What the UI and the Copy all / Export .md output should ever show: real
// notes only, tombstones hidden.
function getVisibleNotes() {
  return getAppNotes().filter((n) => !n?.deleted);
}

// Save the notes list everywhere (local + pending queue + cloud), mirroring how
// persistCategories handles its own slice. Real workout data is never touched.
function persistAppNotes(notes) {
  const data = getLocalData();
  data.appNotes = notes;
  data.updatedAt = new Date().toISOString();
  data.updatedBy = getDeviceId();
  saveLocalData(data);
  markPendingData(data);
  syncOrWarn(data);
}

// Short, human date for a note's meta line: "Today" / "Yesterday" / "Jun 28".
function formatNoteWhen(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function setNotesStatus(message, tone = "") {
  const el = document.querySelector("#notes-status");
  if (!el) return;
  el.textContent = message;
  el.className = `settings-foot-note${tone ? " " + tone : ""}`;
}

function renderNoteCard(note) {
  const isDone = note.status === "done";
  const editing = editingNoteId === note.id;
  const meta = [
    `<span class="note-lane note-lane-${escapeHtml(note.lane || "idea")}">${escapeHtml(noteLaneLabel(note.lane))}</span>`,
    `<span class="note-when">${escapeHtml(formatNoteWhen(note.createdAt))}</span>`,
    note.source === "workout" ? `<span class="note-src">from a workout</span>`
      : note.source === "catalog" ? `<span class="note-src">exercise report</span>` : ""
  ].filter(Boolean).join("");

  if (editing) {
    return `
      <div class="note-card is-editing" data-note-id="${escapeHtml(note.id)}">
        <textarea class="note-edit-input" rows="3" data-note-edit="${escapeHtml(note.id)}">${escapeHtml(note.text)}</textarea>
        <div class="note-card-actions">
          <button class="primary-button small-button" type="button" data-action="save-note" data-note-id="${escapeHtml(note.id)}">Save</button>
          <button class="quiet-button small-button" type="button" data-action="cancel-edit" data-note-id="${escapeHtml(note.id)}">Cancel</button>
        </div>
      </div>`;
  }

  return `
    <div class="note-card${isDone ? " is-done" : ""}" data-note-id="${escapeHtml(note.id)}">
      <p class="note-card-text">${escapeHtml(note.text)}</p>
      <div class="note-card-foot">
        <div class="note-card-meta">${meta}</div>
        <div class="note-card-actions">
          <button class="quiet-button small-button" type="button" data-action="toggle-note-status" data-note-id="${escapeHtml(note.id)}">${isDone ? "Reopen" : "Done"}</button>
          <button class="quiet-button small-button" type="button" data-action="edit-note" data-note-id="${escapeHtml(note.id)}">Edit</button>
          <button class="quiet-button small-button danger-text" type="button" data-action="delete-note" data-note-id="${escapeHtml(note.id)}" aria-label="Delete note">${getUiIcon("trash-2")}</button>
        </div>
      </div>
    </div>`;
}

function renderNotesModal() {
  const root = document.querySelector("#notes-modal-root");
  if (!root) return;
  if (!notesModalOpen) {
    root.innerHTML = "";
    return;
  }
  const notes = getVisibleNotes();
  const open = notes.filter((n) => n.status !== "done");
  const done = notes.filter((n) => n.status === "done");
  const laneOptions = NOTE_LANES.map((l) => `<option value="${l.key}">${l.label}</option>`).join("");

  const listHtml = notes.length
    ? `${open.map(renderNoteCard).join("")}${done.length ? `
        <p class="notes-group-label">Done (${done.length})</p>
        ${done.map(renderNoteCard).join("")}` : ""}`
    : `<p class="plan-muted notes-empty">No notes yet. Jot the first idea above — it stays out of your workout history.</p>`;

  root.innerHTML = `
    <div class="lw-sheet-scrim" role="presentation" data-notes-scrim>
      <section class="lw-sheet notes-sheet" role="dialog" aria-modal="true" aria-label="App notes">
        <div class="lw-sheet-head">
          <div>
            <h3>Notes</h3>
            <p>Capture app ideas and feature requests. Kept separate from your workout history.</p>
          </div>
          <button class="lw-sheet-close" type="button" data-action="close-notes" aria-label="Close notes">&times;</button>
        </div>
        <div class="notes-compose">
          <textarea id="note-input" rows="3" placeholder="New idea, bug, or feature request..."></textarea>
          <div class="notes-compose-row">
            <select id="note-lane" aria-label="Note type">${laneOptions}</select>
            <button class="primary-button small-button" type="button" data-action="add-note">Add note</button>
          </div>
        </div>
        <div class="notes-list">${listHtml}</div>
        <div class="notes-foot">
          <button class="quiet-button small-button btn-ico" type="button" data-action="copy-notes">${getUiIcon("copy")}Copy all</button>
          <button class="quiet-button small-button btn-ico" type="button" data-action="export-notes">${getUiIcon("download")}Export .md</button>
        </div>
        <p class="settings-foot-note" id="notes-status" role="status"></p>
      </section>
    </div>
  `;
  renderUiIcons(root);
}

function openNotesModal(opts = {}) {
  notesModalOpen = true;
  editingNoteId = null;
  pendingNoteSource = opts.source || "manual";
  renderNotesModal();
  requestAnimationFrame(() => {
    const input = document.querySelector("#note-input");
    if (input) {
      if (opts.prefill) input.value = opts.prefill;
      input.focus();
      // Drop the cursor at the end so a pre-filled template reads as a prompt.
      const end = input.value.length;
      try { input.setSelectionRange(end, end); } catch (_) {}
    }
    if (opts.lane) {
      const laneSelect = document.querySelector("#note-lane");
      if (laneSelect) laneSelect.value = opts.lane;
    }
  });
}

function closeNotesModal() {
  notesModalOpen = false;
  editingNoteId = null;
  renderNotesModal();
}

function addNoteFromInput() {
  const input = document.querySelector("#note-input");
  const laneSelect = document.querySelector("#note-lane");
  const text = (input?.value || "").trim();
  if (!text) {
    setNotesStatus("Type a note first.");
    input?.focus();
    return;
  }
  const now = new Date().toISOString();
  const note = {
    id: makeNoteId(),
    createdAt: now,
    updatedAt: now,
    text,
    status: "open",
    lane: laneSelect?.value || "idea",
    source: pendingNoteSource
  };
  // Newest first so a fresh idea is right under the compose box.
  persistAppNotes([note, ...getAppNotes()]);
  renderNotesModal();
  setNotesStatus("Note saved.", "good");
  requestAnimationFrame(() => document.querySelector("#note-input")?.focus());
}

function toggleNoteStatus(id) {
  const notes = getAppNotes();
  const note = notes.find((n) => n.id === id);
  if (!note) return;
  note.status = note.status === "done" ? "open" : "done";
  note.updatedAt = new Date().toISOString();
  persistAppNotes(notes);
  renderNotesModal();
}

function startEditNote(id) {
  editingNoteId = id;
  renderNotesModal();
  requestAnimationFrame(() => {
    const ta = document.querySelector(`[data-note-edit="${id}"]`);
    if (ta) {
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }
  });
}

function cancelEditNote() {
  editingNoteId = null;
  renderNotesModal();
}

function saveEditNote(id) {
  const ta = document.querySelector(`[data-note-edit="${id}"]`);
  const text = (ta?.value || "").trim();
  if (!text) {
    setNotesStatus("A note can't be empty. Use Delete if you don't need it.");
    return;
  }
  const notes = getAppNotes();
  const note = notes.find((n) => n.id === id);
  if (!note) return;
  note.text = text;
  note.updatedAt = new Date().toISOString();
  persistAppNotes(notes);
  editingNoteId = null;
  renderNotesModal();
  setNotesStatus("Note updated.", "good");
}

async function deleteNote(id) {
  const ok = await showConfirmModal({
    title: "Delete this note?",
    message: "This removes the note only. Your workouts and history are not affected.",
    confirmLabel: "Delete note",
    danger: true
  });
  if (!ok) return;
  const now = new Date().toISOString();
  // Leave a tombstone rather than filtering the id out entirely - see
  // mergeAppNotes() for why an outright removal doesn't survive a sync from a
  // device that still has the old copy.
  persistAppNotes(getAppNotes().map((n) => (
    n.id === id ? { id: n.id, deleted: true, deletedAt: now, updatedAt: now } : n
  )));
  if (editingNoteId === id) editingNoteId = null;
  renderNotesModal();
  setNotesStatus("Note deleted.");
}

// Plain markdown the way a coding agent can read it: open notes first, done
// notes after, each with its lane, date, and capture source.
function buildNotesMarkdown() {
  const notes = getVisibleNotes();
  const today = new Date().toISOString().slice(0, 10);
  const lines = ["# Training Book - App Notes", `Exported ${today}`, ""];
  if (!notes.length) {
    lines.push("_No notes captured yet._");
    return lines.join("\n") + "\n";
  }
  const fmt = (n) => {
    const lane = n.lane ? `[${noteLaneLabel(n.lane)}] ` : "";
    const when = (n.createdAt || "").slice(0, 10);
    const src = n.source === "workout" ? " (from a workout)" : (n.source === "catalog" ? " (exercise report)" : "");
    const text = String(n.text || "").trim().replace(/\r?\n+/g, " ");
    return `- ${lane}${text}${when ? ` — ${when}` : ""}${src}`;
  };
  const open = notes.filter((n) => n.status !== "done");
  const done = notes.filter((n) => n.status === "done");
  if (open.length) {
    lines.push(`## Open (${open.length})`, ...open.map(fmt), "");
  }
  if (done.length) {
    lines.push(`## Done (${done.length})`, ...done.map(fmt), "");
  }
  return lines.join("\n").trim() + "\n";
}

async function copyNotes() {
  try {
    await copyTextToClipboard(buildNotesMarkdown());
    setNotesStatus("Notes copied - paste them into an agent session.", "good");
  } catch {
    setNotesStatus("Couldn't copy automatically. Use Export .md instead.", "bad");
  }
}

async function exportNotes() {
  const fileName = `training-book-notes-${new Date().toISOString().slice(0, 10)}.md`;
  try {
    const mode = await saveTextFile(buildNotesMarkdown(), fileName);
    setNotesStatus(mode === "picked" ? `Saved as ${fileName}.` : `Downloaded as ${fileName}.`, "good");
  } catch (error) {
    if (error?.name === "AbortError") return;
    setNotesStatus(`Export didn't finish: ${error.message}`, "bad");
  }
}

function handleNotesAction(action, noteId) {
  switch (action) {
    case "close-notes": closeNotesModal(); break;
    case "add-note": addNoteFromInput(); break;
    case "toggle-note-status": toggleNoteStatus(noteId); break;
    case "edit-note": startEditNote(noteId); break;
    case "save-note": saveEditNote(noteId); break;
    case "cancel-edit": cancelEditNote(); break;
    case "delete-note": deleteNote(noteId); break;
    case "copy-notes": copyNotes(); break;
    case "export-notes": exportNotes(); break;
    default: break;
  }
}

// Library tab state: the filter currently selected, the live search text, the
// id of the exercise being edited inline (null when nothing is being edited),
// and the id of the exercise whose "How to do it" sheet is open (null = none).
let currentLibraryFilter = "all";
let librarySearch = "";
let editingExerciseId = null;
let libraryReferenceId = null;
// Photos staged while an exercise edit card is open (committed on Save, dropped
// on Cancel). Keys: "start"/"finish"; value is a new data URL, or null to mean
// "remove the custom photo for this slot". An absent key means "leave as-is".
let editingDraftPhotos = null;

// Build the filter chips from the editable categories. "All" and "Favorites"
// are always present; the rest come from `categories`. If the active filter is
// a category that no longer exists, fall back to "All".
function renderFilterStrip() {
  if (!filterStrip) return;
  const validFilters = new Set(["all", "favorites", ...categories.map((c) => c.key)]);
  if (!validFilters.has(currentLibraryFilter)) currentLibraryFilter = "all";

  const chip = (filter, label, extraClass = "", iconHtml = "") => {
    const active = currentLibraryFilter === filter ? " is-active" : "";
    return `<button class="filter-chip${extraClass}${active}" type="button" data-filter="${escapeHtml(filter)}">${iconHtml}${escapeHtml(label)}</button>`;
  };

  filterStrip.innerHTML = [
    chip("all", "All"),
    chip("favorites", "Favorites", " filter-chip-fav", getUiIcon("star")),
    ...categories.map((cat) => chip(cat.key, cat.label))
  ].join("");
}

function renderExercises(filter = currentLibraryFilter) {
  if (!exerciseList) return;
  currentLibraryFilter = filter;

  const search = librarySearch.trim().toLowerCase();
  const visibleExercises = exercises.filter((exercise) => {
    let matchesFilter;
    if (filter === "all") matchesFilter = true;
    else if (filter === "favorites") matchesFilter = Boolean(exercise.favorite);
    else matchesFilter = (exercise.tags || []).includes(filter);
    const matchesSearch = !search || exercise.name.toLowerCase().includes(search);
    return matchesFilter && matchesSearch;
  });

  if (libraryCount) {
    const label = visibleExercises.length === 1 ? "exercise" : "exercises";
    libraryCount.textContent = `${visibleExercises.length} ${label}`;
  }

  if (visibleExercises.length === 0) {
    let message;
    if (search) message = `No exercises match "${escapeHtml(librarySearch.trim())}". Try a different search or add your own.`;
    else if (filter === "favorites") message = `No favorites yet. Tap the star on any exercise to save it here.`;
    else message = `No exercises here yet. Add one to get started.`;
    exerciseList.innerHTML = `<p class="library-empty">${message}</p>`;
    renderLibrarySheet();
    return;
  }

  exerciseList.innerHTML = visibleExercises.map(renderExerciseCard).join("");

  renderLibrarySheet();
}

// The image used for an exercise's card thumbnail / how-to: the user's own
// uploaded photo wins, then the bundled Free Exercise DB photo, else nothing.
function getExerciseStartImage(exercise) {
  return exercise.customPhotos?.start || exercise.photos?.start || null;
}

// The card art: a real start-position photo when the exercise has one,
// otherwise the shared line glyph. The photo opens the "How to do it" sheet;
// the star in the corner toggles the exercise as a favorite.
function renderExerciseArt(exercise) {
  const start = getExerciseStartImage(exercise);
  const visual = start
    ? `<span class="exercise-photo" style="background-image:url('${escapeHtml(start)}')"></span>`
    : `<span class="exercise-glyph">${getExerciseIcon(exercise.icon)}</span>`;
  const isFav = Boolean(exercise.favorite);
  return `
    <div class="exercise-art${start ? " has-photo" : ""}">
      ${visual}
      <button type="button" class="exercise-art-howto-btn" data-action="library-how-to" data-id="${escapeHtml(exercise.id)}" aria-label="How to do ${escapeHtml(exercise.name)}">
        <span class="exercise-art-howto">${getUiIcon("help-circle")}How to</span>
      </button>
      <button type="button" class="star-toggle${isFav ? " is-fav" : ""}" data-action="toggle-fav" data-id="${escapeHtml(exercise.id)}" aria-pressed="${isFav ? "true" : "false"}" aria-label="${isFav ? "Remove" : "Add"} ${escapeHtml(exercise.name)} ${isFav ? "from" : "to"} favorites">${getUiIcon("star")}</button>
    </div>
  `;
}

function renderExerciseCard(exercise) {
  // Only show category tags as chips; internal flags (custom/sport/timed) and
  // any stale tags are hidden so the row mirrors the editable categories.
  const keys = categoryKeySet();
  const tags = (exercise.tags || []).filter((tag) => keys.has(tag));
  return `
    <article class="exercise-card">
      ${renderExerciseArt(exercise)}
      <div class="exercise-info">
        <button type="button" class="exercise-name-btn" data-action="library-how-to" data-id="${escapeHtml(exercise.id)}">${escapeHtml(exercise.name)}</button>
        <p class="exercise-meta">${escapeHtml(exercise.area || "")}</p>
        <div class="tag-row">
          ${tags.map((tag) => `<span class="exercise-tag">${escapeHtml(formatTag(tag))}</span>`).join("")}
        </div>
        <div class="exercise-actions">
          <button type="button" class="exercise-action" data-action="edit-exercise" data-id="${escapeHtml(exercise.id)}" aria-label="Edit ${escapeHtml(exercise.name)}">${getUiIcon("pencil")}<span class="btn-label">Edit</span></button>
          <button type="button" class="exercise-action danger" data-action="remove-exercise" data-id="${escapeHtml(exercise.id)}" aria-label="Remove ${escapeHtml(exercise.name)}">${getUiIcon("trash-2")}<span class="btn-label">Remove</span></button>
        </div>
      </div>
    </article>
  `;
}

// Render (or clear) the Library's "How to do it" sheet into its root container.
function renderLibrarySheet() {
  const root = document.querySelector("#library-sheet-root");
  if (!root) return;
  const exercise = libraryReferenceId ? getExerciseById(libraryReferenceId) : null;
  if (!exercise) {
    root.innerHTML = "";
    return;
  }
  root.innerHTML = buildReferenceSheetMarkup(
    { exerciseId: exercise.id, name: exercise.name, type: exercise.type, area: exercise.area },
    "close-library-how-to"
  );
}

function openLibraryReference(id) {
  libraryReferenceId = id;
  renderLibrarySheet();
}

function closeLibraryReference() {
  libraryReferenceId = null;
  renderLibrarySheet();
}

// The same "How to do it" sheet, opened by tapping an exercise on the Today
// preview list. Rendered into a top-level root (not the Library screen's, which
// is hidden while Today is active) so it overlays from any screen.
let todayReferenceId = null;

function renderTodayHowToSheet() {
  const root = document.querySelector("#today-howto-root");
  if (!root) return;
  const exercise = todayReferenceId ? getExerciseById(todayReferenceId) : null;
  if (!exercise) {
    root.innerHTML = "";
    return;
  }
  root.innerHTML = buildReferenceSheetMarkup(
    { exerciseId: exercise.id, name: exercise.name, type: exercise.type, area: exercise.area },
    "close-today-how-to"
  );
}

function openTodayReference(id) {
  todayReferenceId = id;
  renderTodayHowToSheet();
}

function closeTodayReference() {
  todayReferenceId = null;
  renderTodayHowToSheet();
}

// ===== Favorites + custom photos =====

function toggleFavoriteExercise(id) {
  persistLibrary(exercises.map((ex) => ex.id === id ? { ...ex, favorite: !ex.favorite } : ex));
}

// Shrink a picked image to a small JPEG data URL before we store it, so custom
// photos stay tiny enough to live in the synced data (localStorage / cloud).
function downscaleImage(file, maxSize = 700, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Could not read that image."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

// One slot (Start / Finish) inside the edit card's photo editor.
function renderPhotoUploadSlot(exId, slot, label) {
  const lib = getExerciseById(exId);
  const current = lib?.customPhotos?.[slot] || lib?.photos?.[slot] || null;
  const isCustom = Boolean(lib?.customPhotos?.[slot]);
  return `
    <label class="lw-photo-slot">
      <span class="lw-photo-slot-preview${current ? " has-img" : ""}"${current ? ` style="background-image:url('${escapeHtml(current)}')"` : ""}>${current ? "" : getUiIcon("image")}</span>
      <span class="lw-photo-slot-label">${label}${isCustom ? " · yours" : ""}</span>
      <input type="file" accept="image/*" data-photo-slot="${slot}" data-id="${escapeHtml(exId)}" />
    </label>
  `;
}

// ===== Add-exercise modal =====

let addModalOpen = false;
let addModalType = "strength";

function openAddExerciseModal() {
  addModalOpen = true;
  addModalType = "strength";
  renderAddExerciseModal();
}

function closeAddExerciseModal() {
  addModalOpen = false;
  renderAddExerciseModal();
}

function renderAddExerciseModal() {
  const root = document.querySelector("#library-add-modal-root");
  if (!root) return;
  if (!addModalOpen) {
    root.innerHTML = "";
    return;
  }
  root.innerHTML = `
    <div class="lw-sheet-scrim" role="presentation" data-add-scrim>
      <section class="lw-sheet add-sheet" role="dialog" aria-modal="true" aria-label="Add an exercise">
        <div class="lw-sheet-head">
          <div>
            <h3>Add an exercise</h3>
            <p>Create your own. You can add photos afterwards from its “How to do it” sheet.</p>
          </div>
          <button class="lw-sheet-close" type="button" data-action="close-add" aria-label="Close">&times;</button>
        </div>
        <label class="add-field">
          <span>Name</span>
          <input type="text" id="add-ex-name" maxlength="40" autocomplete="off" placeholder="e.g. Battle Ropes" />
        </label>
        <div class="add-field">
          <span>Type</span>
          <div class="type-toggle" role="group" aria-label="Exercise type" data-add-type>
            ${["strength", "cardio", "timed", "sport"].map((t) => `<button type="button" class="type-option${addModalType === t ? " is-active" : ""}" data-type="${t}">${formatExerciseType(t)}</button>`).join("")}
          </div>
        </div>
        <button class="primary-button lw-sheet-done" type="button" data-action="submit-add">Add to library</button>
      </section>
    </div>
  `;
  root.querySelector("#add-ex-name")?.focus();
}

function submitAddExercise() {
  const name = document.querySelector("#add-ex-name")?.value || "";
  if (!name.trim()) {
    document.querySelector("#add-ex-name")?.focus();
    return;
  }
  addLibraryExercise(name, addModalType);
  closeAddExerciseModal();
}

// ===== Edit-categories modal =====
// While open, `categoriesDraft` holds a working copy of the categories so the
// list can be relabelled / added to / trimmed without touching live data until
// Save. Each row is { key, label }; a new row has key === null (its key is
// generated from the label on Save).

let categoriesModalOpen = false;
let categoriesDraft = null;

function openCategoriesModal() {
  categoriesDraft = categories.map((cat) => ({ key: cat.key, label: cat.label }));
  categoriesModalOpen = true;
  renderCategoriesModal();
}

function closeCategoriesModal() {
  categoriesModalOpen = false;
  categoriesDraft = null;
  renderCategoriesModal();
}

// Pull the current label text from the inputs back into the draft, so a
// re-render (add / remove row) doesn't lose anything the user just typed.
function syncCategoriesDraftFromDom() {
  const root = document.querySelector("#library-categories-modal-root");
  if (!root || !categoriesDraft) return;
  root.querySelectorAll(".cat-row-input").forEach((input) => {
    const i = Number(input.dataset.index);
    if (categoriesDraft[i]) categoriesDraft[i].label = input.value;
  });
}

function renderCategoriesModal() {
  const root = document.querySelector("#library-categories-modal-root");
  if (!root) return;
  if (!categoriesModalOpen) {
    root.innerHTML = "";
    return;
  }
  const rows = categoriesDraft.map((cat, i) => `
    <div class="cat-row">
      <input type="text" class="cat-row-input" data-index="${i}" maxlength="24" value="${escapeHtml(cat.label)}" aria-label="Category name" placeholder="Category name" />
      <button type="button" class="cat-row-remove btn-ico" data-action="remove-category" data-index="${i}" aria-label="Remove ${escapeHtml(cat.label || "category")}">${getUiIcon("trash-2")}</button>
    </div>
  `).join("");
  root.innerHTML = `
    <div class="lw-sheet-scrim" role="presentation" data-categories-scrim>
      <section class="lw-sheet cat-sheet" role="dialog" aria-modal="true" aria-label="Edit categories">
        <div class="lw-sheet-head">
          <div>
            <h3>Edit categories</h3>
            <p>Rename, add or remove the filters you organise exercises by. Renaming keeps every exercise tagged; removing a category clears it from all exercises.</p>
          </div>
          <button class="lw-sheet-close" type="button" data-action="close-categories" aria-label="Close edit categories">&times;</button>
        </div>
        <div class="cat-list">
          ${rows || `<p class="cat-empty">No categories yet. Add one below.</p>`}
        </div>
        <button class="quiet-button small-button btn-ico cat-add" type="button" data-action="add-category">${getUiIcon("plus")}<span class="btn-label">Add category</span></button>
        <button class="primary-button lw-sheet-done" type="button" data-action="save-categories">Save categories</button>
      </section>
    </div>
  `;
}

function addCategoryRow() {
  syncCategoriesDraftFromDom();
  categoriesDraft.push({ key: null, label: "" });
  renderCategoriesModal();
  // Focus the freshly added row's input.
  const inputs = document.querySelectorAll("#library-categories-modal-root .cat-row-input");
  inputs[inputs.length - 1]?.focus();
}

function removeCategoryRow(index) {
  syncCategoriesDraftFromDom();
  categoriesDraft.splice(index, 1);
  renderCategoriesModal();
}

function saveCategories() {
  syncCategoriesDraftFromDom();

  // Build the next categories list, skipping blank rows and assigning keys to
  // new ones. Relabelled rows keep their key so exercise tags stay attached.
  // Seed the taken-keys set with every surviving original key so a new key
  // can't collide with one further down the list.
  const takenKeys = new Set(categoriesDraft.filter((r) => r.key).map((r) => r.key));
  const next = [];
  for (const row of categoriesDraft) {
    const label = String(row.label).trim();
    if (!label) continue;
    if (row.key) {
      next.push({ key: row.key, label });
    } else {
      const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "tag";
      let key = base;
      let n = 2;
      while (takenKeys.has(key)) key = `${base}-${n++}`;
      takenKeys.add(key);
      next.push({ key, label });
    }
  }

  // Any original category key not carried into `next` was removed: strip it
  // from every exercise's tags so cards and filters stay consistent.
  const survivingKeys = new Set(next.map((c) => c.key));
  const removedKeys = categories.map((c) => c.key).filter((k) => !survivingKeys.has(k));
  let library = exercises;
  if (removedKeys.length) {
    library = exercises.map((ex) => {
      const tags = ex.tags || [];
      if (!tags.some((t) => removedKeys.includes(t))) return ex;
      return { ...ex, tags: tags.filter((t) => !removedKeys.includes(t)) };
    });
  }

  persistCategories(next, library);
  closeCategoriesModal();
}

// ===== Edit-exercise modal =====
// Editing an exercise opens a full-width modal (cleaner than the old cramped
// inline card). `editingExerciseId` doubles as the open flag; `editingDraftPhotos`
// stages photo swaps until Save.

// Category tags as tap-to-toggle chips. Selection lives in the `.is-on` class
// (toggled by the modal click handler) and is read back on Save.
function renderCategoryChips(exercise) {
  if (categories.length === 0) {
    return `<p class="cat-multiselect-empty">No categories yet — add some with “Edit categories”.</p>`;
  }
  const active = new Set(exercise.tags || []);
  return categories.map((cat) =>
    `<button type="button" class="cat-chip${active.has(cat.key) ? " is-on" : ""}" data-cat-key="${escapeHtml(cat.key)}" aria-pressed="${active.has(cat.key) ? "true" : "false"}">${escapeHtml(cat.label)}</button>`
  ).join("");
}

function openEditExerciseModal(id) {
  editingExerciseId = id;
  editingDraftPhotos = {};
  renderEditExerciseModal();
}

function closeEditExerciseModal() {
  editingExerciseId = null;
  editingDraftPhotos = null;
  renderEditExerciseModal();
}

function renderEditExerciseModal() {
  const root = document.querySelector("#library-edit-modal-root");
  if (!root) return;
  const exercise = editingExerciseId ? getExerciseById(editingExerciseId) : null;
  if (!exercise) {
    root.innerHTML = "";
    return;
  }
  const exerciseType = normalizeExerciseType(exercise.type);
  const hasCustom = Boolean(exercise.customPhotos);
  root.innerHTML = `
    <div class="lw-sheet-scrim" role="presentation" data-edit-scrim>
      <section class="lw-sheet edit-sheet" role="dialog" aria-modal="true" aria-label="Edit ${escapeHtml(exercise.name)}">
        <div class="lw-sheet-head">
          <div>
            <h3>Edit exercise</h3>
            <p>Update its name, type, categories and photos.</p>
          </div>
          <button class="lw-sheet-close" type="button" data-action="close-edit" aria-label="Close edit exercise">&times;</button>
        </div>
        <label class="add-field">
          <span>Name</span>
          <input type="text" class="exercise-edit-name" maxlength="40" autocomplete="off" value="${escapeHtml(exercise.name)}" aria-label="Exercise name" />
        </label>
        <div class="add-field">
          <span>Type</span>
          <div class="type-toggle" role="group" aria-label="Exercise type">
            ${renderTypeOption("strength", exerciseType)}
            ${renderTypeOption("cardio", exerciseType)}
            ${renderTypeOption("timed", exerciseType)}
            ${renderTypeOption("sport", exerciseType)}
          </div>
        </div>
        <div class="add-field">
          <span>Categories</span>
          <div class="cat-chip-row">${renderCategoryChips(exercise)}</div>
        </div>
        <div class="add-field edit-photos">
          <span>Photos</span>
          <div class="edit-photos-slots">
            ${renderPhotoUploadSlot(exercise.id, "start", "Start")}
            ${renderPhotoUploadSlot(exercise.id, "finish", "Finish")}
          </div>
          ${hasCustom ? `<button class="quiet-button small-button" type="button" data-action="clear-custom-photos-edit" data-id="${escapeHtml(exercise.id)}">Remove my photos</button>` : ""}
        </div>
        <div class="edit-sheet-actions">
          <button class="primary-button lw-sheet-done" type="button" data-action="save-exercise" data-id="${escapeHtml(exercise.id)}">Save changes</button>
          <button class="quiet-button" type="button" data-action="cancel-edit">Cancel</button>
        </div>
      </section>
    </div>
  `;
}

// ----- Edit-modal photo staging (no full re-render, so the unsaved name / type
// / category selections survive while photos are swapped) -----

// Make sure the "Remove my photos" button exists once a custom photo is staged.
function ensureRemovePhotosButton(modal) {
  const wrap = modal?.querySelector(".edit-photos");
  if (!wrap || wrap.querySelector('[data-action="clear-custom-photos-edit"]')) return;
  const btn = document.createElement("button");
  btn.className = "quiet-button small-button";
  btn.type = "button";
  btn.dataset.action = "clear-custom-photos-edit";
  btn.dataset.id = editingExerciseId || "";
  btn.textContent = "Remove my photos";
  wrap.appendChild(btn);
}

function applyStagedPhotoToModal(input, dataUrl) {
  const modal = input.closest(".edit-sheet");
  const slotEl = input.closest(".lw-photo-slot");
  const preview = slotEl?.querySelector(".lw-photo-slot-preview");
  if (preview) {
    preview.classList.add("has-img");
    preview.style.backgroundImage = `url('${dataUrl}')`;
    preview.innerHTML = "";
  }
  const label = slotEl?.querySelector(".lw-photo-slot-label");
  if (label && !/·\s*yours/.test(label.textContent)) label.textContent = `${label.textContent} · yours`;
  ensureRemovePhotosButton(modal);
}

// Stage removal of all custom photos and reflect the bundled fallback (or empty
// state) in the open modal's slots.
function stageRemoveCustomPhotos(modal, id) {
  const exercise = getExerciseById(id);
  editingDraftPhotos = { start: null, finish: null };
  modal?.querySelectorAll(".lw-photo-slot").forEach((slotEl) => {
    const input = slotEl.querySelector('input[type="file"][data-photo-slot]');
    const slot = input?.dataset.photoSlot;
    const fallback = exercise?.photos?.[slot] || null;
    const preview = slotEl.querySelector(".lw-photo-slot-preview");
    if (preview) {
      if (fallback) {
        preview.classList.add("has-img");
        preview.style.backgroundImage = `url('${fallback}')`;
        preview.innerHTML = "";
      } else {
        preview.classList.remove("has-img");
        preview.style.backgroundImage = "";
        preview.innerHTML = getUiIcon("image");
      }
    }
    const label = slotEl.querySelector(".lw-photo-slot-label");
    if (label) label.textContent = label.textContent.replace(/\s*·\s*yours/, "");
  });
  modal?.querySelector('[data-action="clear-custom-photos-edit"]')?.remove();
}

// ===== Library add / edit / remove =====

// Build a URL-safe-ish unique id from a name, e.g. "Bulgarian Split Squat".
function makeExerciseId(name) {
  const base = String(name).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30) || "exercise";
  return `${base}-${randomString(4)}`;
}

function normalizeExerciseType(type) {
  return ["strength", "cardio", "timed", "sport"].includes(type) ? type : "strength";
}

function getExerciseTypeMeta(type) {
  const normalized = normalizeExerciseType(type);
  if (normalized === "cardio") {
    return {
      type: "cardio",
      area: "Cardio",
      icon: "run",
      tags: ["custom", "cardio"]
    };
  }
  if (normalized === "timed") {
    return {
      type: "timed",
      area: "Core / holds",
      icon: "yoga",
      tags: ["custom", "bodyweight", "timed"]
    };
  }
  if (normalized === "sport") {
    return {
      type: "sport",
      area: "Sport",
      icon: "soccer",
      tags: ["custom", "sport"]
    };
  }
  return {
    type: "strength",
    area: "Strength",
    icon: "dumbbell",
    tags: ["custom"]
  };
}

function formatExerciseType(type) {
  if (type === "cardio") return "Cardio";
  if (type === "timed") return "Timed hold";
  if (type === "sport") return "Sport";
  return "Strength";
}

function renderTypeOption(type, activeType) {
  const active = normalizeExerciseType(activeType) === type ? " is-active" : "";
  return `<button type="button" class="type-option${active}" data-type="${type}">${formatExerciseType(type)}</button>`;
}

// Save the updated library everywhere: local backup, pending queue, and the
// cloud (if signed in). Mirrors how workouts are persisted.
function persistLibrary(library) {
  const data = getLocalData();
  data.library = library;
  data.updatedAt = new Date().toISOString();
  data.updatedBy = getDeviceId();
  saveLocalData(data);
  markPendingData(data);
  exercises = library;
  renderExercises();
  renderExercisePicker();
  syncOrWarn(data);
}

// Push a save to the cloud, clearing the pending queue on success. A failure
// because nobody is signed in (or the device is offline) is expected: the edit
// stays queued and syncs later, so we stay quiet. ANY other failure means the
// save the user just made did not reach the cloud - surface it instead of
// pretending it worked, and leave it queued so a later sync retries. This is the
// difference between "looked saved" and "actually saved" for things like custom
// exercise photos.
function syncOrWarn(data) {
  if (!navigator.onLine) return;
  uploadWorkoutData(data).then(clearPendingData).catch((error) => {
    const msg = String(error?.message || error || "");
    const expected = /sign in/i.test(msg);
    if (!expected) {
      console.error("Cloud save failed:", error);
      setSyncStatus("Saved on this device, but the last change hasn't reached the cloud yet - it will retry automatically.", "warn");
    }
    updateConnectionState();
  });
}

// ===== Filter categories (editable) =====

function getCategoryByKey(key) {
  return categories.find((cat) => cat.key === key) || null;
}

function categoryKeySet() {
  return new Set(categories.map((cat) => cat.key));
}

// Save the categories list everywhere (local + queue + cloud), mirroring
// persistLibrary. `library` lets a caller that is also rewriting exercise tags
// (e.g. after removing a category) persist both in one shot.
function persistCategories(nextCategories, library = exercises) {
  const data = getLocalData();
  data.categories = nextCategories;
  data.library = library;
  data.updatedAt = new Date().toISOString();
  data.updatedBy = getDeviceId();
  saveLocalData(data);
  markPendingData(data);
  categories = nextCategories;
  exercises = library;
  renderFilterStrip();
  renderExercises();
  renderExercisePicker();
  if (navigator.onLine) {
    uploadWorkoutData(data).then(clearPendingData).catch(() => {});
  }
}

function addLibraryExercise(name, type) {
  const cleanName = String(name).trim();
  if (!cleanName) return;
  const meta = getExerciseTypeMeta(type);
  const newExercise = {
    id: makeExerciseId(cleanName),
    name: cleanName,
    ...meta
  };
  persistLibrary([...exercises, newExercise]);
}

// Merge a staged photo edit into an exercise's customPhotos. Returns the new
// customPhotos object, or undefined when no custom photos remain.
function applyStagedPhotos(exercise, draft) {
  const next = { ...(exercise.customPhotos || {}) };
  if (draft) {
    for (const slot of ["start", "finish"]) {
      if (!(slot in draft)) continue;
      if (draft[slot]) next[slot] = draft[slot];
      else delete next[slot];
    }
  }
  return Object.keys(next).length ? next : undefined;
}

function saveLibraryExerciseEdit(id, name, type, selectedCategoryKeys = []) {
  const cleanName = String(name).trim();
  if (!cleanName) return;
  const nextType = normalizeExerciseType(type);
  const catKeys = categoryKeySet();
  const library = exercises.map((exercise) => {
    if (exercise.id !== id) return exercise;
    // Keep any non-category tags (custom / sport / timed) and replace the
    // category tags with whatever was ticked in the dropdown.
    const functionalTags = (exercise.tags || []).filter((t) => !catKeys.has(t));
    const nextTags = [...functionalTags, ...selectedCategoryKeys];
    const isCustom = functionalTags.includes("custom");
    // Type drives a custom exercise's area/icon, but no longer its tags.
    const visuals = isCustom
      ? (() => { const m = getExerciseTypeMeta(nextType); return { area: m.area, icon: m.icon }; })()
      : {};
    const next = { ...exercise, name: cleanName, type: nextType, tags: nextTags, ...visuals };
    const customPhotos = applyStagedPhotos(exercise, editingDraftPhotos);
    if (customPhotos) next.customPhotos = customPhotos;
    else delete next.customPhotos;
    return next;
  });
  editingExerciseId = null;
  editingDraftPhotos = null;
  renderEditExerciseModal();
  persistLibrary(library);
}

function removeLibraryExercise(id) {
  const exercise = getExerciseById(id);
  const name = exercise ? exercise.name : "this exercise";
  if (!confirm(`Remove "${name}" from your library? Past workouts that used it are not affected.`)) return;
  if (editingExerciseId === id) { editingExerciseId = null; renderEditExerciseModal(); }
  persistLibrary(exercises.filter((item) => item.id !== id));
}

// Click handler for the library list: how-to, favourite, edit (opens the modal)
// and remove. The actual editing happens in the edit modal, not inline.
function handleLibraryListClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === "library-how-to") {
    openLibraryReference(id);
  } else if (action === "toggle-fav") {
    toggleFavoriteExercise(id);
  } else if (action === "edit-exercise") {
    openEditExerciseModal(id);
  } else if (action === "remove-exercise") {
    removeLibraryExercise(id);
  }
}

// Click handler for the edit-exercise modal: type / category toggles, photo
// controls, save / cancel / close / scrim.
function handleEditModalClick(event) {
  if (event.target.hasAttribute("data-edit-scrim")) { closeEditExerciseModal(); return; }

  const typeOption = event.target.closest(".type-option");
  if (typeOption) {
    typeOption.parentElement.querySelectorAll(".type-option").forEach((btn) => btn.classList.toggle("is-active", btn === typeOption));
    return;
  }
  const chip = event.target.closest(".cat-chip");
  if (chip) {
    const on = chip.classList.toggle("is-on");
    chip.setAttribute("aria-pressed", on ? "true" : "false");
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  const modal = button.closest(".edit-sheet");

  if (action === "close-edit" || action === "cancel-edit") {
    closeEditExerciseModal();
  } else if (action === "clear-custom-photos-edit") {
    stageRemoveCustomPhotos(modal, id);
  } else if (action === "save-exercise") {
    const name = modal.querySelector(".exercise-edit-name")?.value || "";
    const activeType = modal.querySelector(".type-option.is-active")?.dataset.type || "strength";
    const selected = Array.from(modal.querySelectorAll(".cat-chip.is-on")).map((c) => c.dataset.catKey);
    saveLibraryExerciseEdit(id, name, activeType, selected);
  }
}

function renderExercisePicker() {
  const options = exercises.map((exercise) => `<option value="${escapeHtml(exercise.id)}">${escapeHtml(exercise.name)}</option>`).join("");

  if (exercisePicker) {
    exercisePicker.innerHTML = `
      <option value="">Choose from the starter library</option>
      ${options}
    `;
  }

  if (todayExtraPicker) {
    todayExtraPicker.innerHTML = `
      <option value="">Add extra exercise</option>
      ${options}
    `;
  }
}

function setWorkoutStatus(message, tone = "") {
  if (!workoutSaveStatus) return;
  workoutSaveStatus.textContent = message;
  workoutSaveStatus.className = tone ? `sync-status ${tone}` : "sync-status";
}

function makeWorkoutExercise(exercise) {
  const defaults = defaultRoutineExercise(exercise.id, { preferHistory: true });
  if (exercise.type === "cardio" || exercise.type === "timed" || exercise.type === "sport") {
    return {
      id: `workout-exercise-${Date.now()}-${randomString(5)}`,
      exerciseId: exercise.id,
      name: exercise.name,
      type: "cardio",
      durationMinutes: defaults.targetDuration || "",
      difficulty: 5
    };
  }

  return {
    id: `workout-exercise-${Date.now()}-${randomString(5)}`,
    exerciseId: exercise.id,
    name: exercise.name,
    type: "strength",
    sets: [
      {
        id: `set-${Date.now()}-${randomString(5)}`,
        reps: defaults.targetReps || "",
        weight: defaults.targetWeight || "",
        done: false
      }
    ],
    difficulty: 5
  };
}

function addExerciseToWorkout() {
  const exerciseId = exercisePicker?.value;
  const exercise = exercises.find((item) => item.id === exerciseId);
  if (!exercise) {
    setWorkoutStatus("Choose an exercise first.", "warn");
    exercisePicker?.focus();
    return;
  }

  activeWorkout.exercises.push(makeWorkoutExercise(exercise));
  if (exercisePicker) exercisePicker.value = "";
  setWorkoutStatus(`${exercise.name} added.`, "good");
  renderActiveWorkout();
}

function getWorkoutProgress() {
  const total = activeWorkout.exercises.reduce((count, exercise) => {
    if (exercise.type === "cardio") return count + 1;
    return count + exercise.sets.length;
  }, 0);

  const done = activeWorkout.exercises.reduce((count, exercise) => {
    if (exercise.type === "cardio") return count + (Number(exercise.durationMinutes) > 0 ? 1 : 0);
    return count + exercise.sets.filter((set) => set.done).length;
  }, 0);

  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

function updateWorkoutProgress() {
  const progress = getWorkoutProgress();
  if (workoutProgressNumber) {
    workoutProgressNumber.textContent = `${progress.percent}%`;
  }
  if (workoutProgressLabel) {
    workoutProgressLabel.textContent = progress.total
      ? `${progress.done} of ${progress.total} logged`
      : "nothing logged yet";
  }
}

function renderActiveWorkout() {
  if (!activeWorkoutList) return;

  updateWorkoutProgress();

  if (activeWorkout.exercises.length === 0) {
    activeWorkoutList.innerHTML = `
      <div class="empty-workout">
        <p class="eyebrow">Ready</p>
        <h3>Start with one exercise.</h3>
        <p>Pick from the library above, then log sets or cardio time as you go.</p>
      </div>
    `;
    return;
  }

  activeWorkoutList.innerHTML = activeWorkout.exercises.map((exercise) => {
    const source = exercises.find((item) => item.id === exercise.exerciseId) || exercises[0];
    const isCardioDone = exercise.type === "cardio" && Number(exercise.durationMinutes) > 0;
    const doneSets = exercise.type === "strength" ? exercise.sets.filter((set) => set.done).length : 0;
    const totalSets = exercise.type === "strength" ? exercise.sets.length : 1;
    const statusText = exercise.type === "cardio"
      ? (isCardioDone ? "done" : "duration needed")
      : `${doneSets} of ${totalSets} sets done`;

    return `
      <article class="workout-card" data-workout-exercise-id="${escapeHtml(exercise.id)}">
        <div class="workout-card-top">
          <div class="mini-exercise-art" aria-hidden="true">
            ${getExerciseIcon(source.icon)}
          </div>
          <div>
            <h3>${escapeHtml(exercise.name)}</h3>
            <p>${escapeHtml(source.area)} · ${escapeHtml(exercise.type === "cardio" ? "duration" : "sets, reps, weight")}</p>
          </div>
          <span class="workout-card-status ${statusText === "done" || doneSets === totalSets ? "good" : ""}">${escapeHtml(statusText)}</span>
        </div>

        ${exercise.type === "cardio" ? renderCardioFields(exercise) : renderStrengthFields(exercise)}

        <div class="workout-card-actions">
          ${exercise.type === "strength" ? `<button class="quiet-button small-button btn-ico" type="button" data-action="add-set">${getUiIcon("plus")}<span class="btn-label">Add set</span></button>` : ""}
          <button class="quiet-button small-button btn-ico" type="button" data-action="remove-exercise" aria-label="Remove exercise">${getUiIcon("trash-2")}<span class="btn-label">Remove</span></button>
        </div>
      </article>
    `;
  }).join("");
}

function renderCardioFields(exercise) {
  return `
    <div class="cardio-row">
      <label for="${escapeHtml(exercise.id)}-duration">Minutes</label>
      <input id="${escapeHtml(exercise.id)}-duration" inputmode="decimal" type="number" min="0" step="1" value="${escapeHtml(exercise.durationMinutes)}" data-field="durationMinutes">
    </div>
    <div class="difficulty-row">
      <label for="${escapeHtml(exercise.id)}-difficulty">Difficulty: <span class="difficulty-value">${escapeHtml(exercise.difficulty)}</span>/10</label>
      <input id="${escapeHtml(exercise.id)}-difficulty" type="range" min="1" max="10" value="${escapeHtml(exercise.difficulty)}" data-field="difficulty">
    </div>
  `;
}

function renderStrengthFields(exercise) {
  return `
    <div class="set-table" role="group" aria-label="${escapeHtml(exercise.name)} sets">
      ${exercise.sets.map((set, index) => `
        <div class="set-row" data-set-id="${escapeHtml(set.id)}">
          <span class="set-number">Set ${index + 1}</span>
          <label>
            <span>Reps</span>
            <input inputmode="numeric" type="number" min="0" step="1" value="${escapeHtml(set.reps)}" data-field="reps">
          </label>
          <label>
            <span>Weight</span>
            <input inputmode="decimal" type="number" min="0" step="0.5" value="${escapeHtml(set.weight)}" data-field="weight">
          </label>
          <label class="done-toggle">
            <input type="checkbox" data-field="done" ${set.done ? "checked" : ""}>
            <span>Done</span>
          </label>
        </div>
      `).join("")}
    </div>
    <div class="difficulty-row">
      <label for="${escapeHtml(exercise.id)}-difficulty">Difficulty: <span class="difficulty-value">${escapeHtml(exercise.difficulty)}</span>/10</label>
      <input id="${escapeHtml(exercise.id)}-difficulty" type="range" min="1" max="10" value="${escapeHtml(exercise.difficulty)}" data-field="difficulty">
    </div>
  `;
}

function findActiveExercise(id) {
  return activeWorkout.exercises.find((exercise) => exercise.id === id);
}

function handleWorkoutInput(event) {
  const card = event.target.closest(".workout-card");
  if (!card) return;

  const exercise = findActiveExercise(card.dataset.workoutExerciseId);
  if (!exercise) return;

  const field = event.target.dataset.field;
  if (!field) return;

  if (field === "difficulty") {
    exercise.difficulty = Number(event.target.value);
    const valueDisplay = card.querySelector(".difficulty-value");
    if (valueDisplay) {
      valueDisplay.textContent = exercise.difficulty;
    }
    return;
  }

  if (exercise.type === "cardio" && field === "durationMinutes") {
    exercise.durationMinutes = event.target.value;
    updateWorkoutProgress();
    return;
  }

  const row = event.target.closest(".set-row");
  const set = exercise.sets?.find((item) => item.id === row?.dataset.setId);
  if (!set) return;

  if (field === "done") {
    set.done = event.target.checked;
    renderActiveWorkout();
    return;
  }

  set[field] = event.target.value;
}

function handleWorkoutClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const card = button.closest(".workout-card");
  const exercise = findActiveExercise(card?.dataset.workoutExerciseId);
  if (!exercise) return;

  if (button.dataset.action === "add-set") {
    exercise.sets.push({
      id: `set-${Date.now()}-${randomString(5)}`,
      reps: "",
      weight: "",
      done: false
    });
    renderActiveWorkout();
    return;
  }

  if (button.dataset.action === "remove-exercise") {
    activeWorkout.exercises = activeWorkout.exercises.filter((item) => item.id !== exercise.id);
    setWorkoutStatus(`${exercise.name} removed.`, "warn");
    renderActiveWorkout();
  }
}

function makeSavedWorkout() {
  const savedAt = new Date().toISOString();
  const entries = activeWorkout.exercises.map((exercise) => {
    if (exercise.type === "cardio") {
      return {
        id: exercise.id,
        type: "cardio",
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.name,
        durationMinutes: Number(exercise.durationMinutes) || 0,
        done: Number(exercise.durationMinutes) > 0,
        difficulty: Number(exercise.difficulty) || 5
      };
    }

    return {
      id: exercise.id,
      type: "strength",
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      sets: exercise.sets.map((set, index) => ({
        id: set.id,
        setNumber: index + 1,
        reps: Number(set.reps) || 0,
        weight: Number(set.weight) || 0,
        done: Boolean(set.done)
      })),
      difficulty: Number(exercise.difficulty) || 5
    };
  });

  return {
    id: `workout-${Date.now()}-${randomString(6)}`,
    name: workoutNameInput?.value.trim() || "Workout",
    date: savedAt.slice(0, 10),
    startedAt: activeWorkout.startedAt,
    savedAt,
    createdBy: getDeviceId(),
    entries
  };
}

function workoutHasLoggedWork() {
  if (!activeWorkout.exercises || activeWorkout.exercises.length === 0) return false;
  return activeWorkout.exercises.some((exercise) => {
    if (exercise.type === "cardio") return Number(exercise.durationMinutes) > 0;
    return exercise.sets && exercise.sets.some((set) => set.done || Number(set.reps) > 0 || Number(set.weight) > 0);
  });
}

function resetActiveWorkout() {
  activeWorkout.startedAt = new Date().toISOString();
  activeWorkout.exercises = [];
  if (workoutNameInput) workoutNameInput.value = "";
  renderActiveWorkout();
}

async function saveWorkout() {
  if (activeWorkout.exercises.length === 0) {
    setWorkoutStatus("Add at least one exercise first.", "warn");
    exercisePicker?.focus();
    return;
  }

  if (!workoutHasLoggedWork()) {
    setWorkoutStatus("Log at least one set or cardio duration before saving.", "warn");
    return;
  }

  const data = getLocalData();
  const savedAt = new Date().toISOString();
  data.updatedAt = savedAt;
  data.updatedBy = getDeviceId();
  data.workouts = Array.isArray(data.workouts) ? data.workouts : [];
  const savedWorkout = makeSavedWorkout();
  data.workouts.push(savedWorkout);
  // Count this ad-hoc session toward Progress (streak, weekly ring, calendar),
  // exactly like a Today-flow save does.
  data.completedWorkouts = Array.isArray(data.completedWorkouts) ? data.completedWorkouts : [];
  if (savedWorkout.date && !data.completedWorkouts.includes(savedWorkout.date)) {
    data.completedWorkouts.push(savedWorkout.date);
  }

  saveLocalData(data);
  markPendingData(data);
  setWorkoutStatus("Saved on this device. Syncing...", "warn");

  if (!navigator.onLine) {
    resetActiveWorkout();
    setWorkoutStatus("Workout saved on this device. It will sync when internet is back.", "warn");
    return;
  }

  try {
    await uploadWorkoutData(data);
    clearPendingData();
    resetActiveWorkout();
    setWorkoutStatus("Workout saved and synced, with a local backup kept on this device.", "good");
  } catch (error) {
    resetActiveWorkout();
    setWorkoutStatus(`${error.message} Workout is saved on this device for now.`, "warn");
  }
}

function formatTag(tag) {
  // A tag that matches an editable category shows that category's label.
  const category = getCategoryByKey(tag);
  if (category) return category.label;
  if (tag === "timed") return "timed hold";
  return tag;
}

function getStoredAccessToken() {
  const token = localStorage.getItem(STORAGE.accessToken);
  const expiresAt = Number(localStorage.getItem(STORAGE.accessTokenExpiresAt) || 0);
  if (!token || Date.now() > expiresAt - 60000) return null;
  return token;
}

function storeTokenInfo(tokenInfo) {
  if (tokenInfo.access_token) {
    localStorage.setItem(STORAGE.accessToken, tokenInfo.access_token);
    const expiresIn = Number(tokenInfo.expires_in || 14400);
    localStorage.setItem(STORAGE.accessTokenExpiresAt, String(Date.now() + expiresIn * 1000));
  }

  if (tokenInfo.refresh_token) {
    localStorage.setItem(STORAGE.refreshToken, tokenInfo.refresh_token);
  }
}

async function getAccessToken() {
  const currentToken = getStoredAccessToken();
  if (currentToken) return currentToken;

  const refreshToken = localStorage.getItem(STORAGE.refreshToken);
  const appKey = localStorage.getItem(STORAGE.appKey);
  if (!refreshToken || !appKey) return null;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: appKey
  });

  const response = await fetch(DROPBOX_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error("Dropbox connection expired. Tap Forget, then Connect again.");
  }

  const tokenInfo = await response.json();
  storeTokenInfo(tokenInfo);
  return tokenInfo.access_token;
}

async function startDropboxConnect() {
  let appKey = appKeyInput?.value.trim() || localStorage.getItem(STORAGE.appKey) || "";
  if (!appKey) {
    appKey = prompt("Paste your Dropbox app key to connect this device:");
  }

  appKey = appKey?.trim();
  if (!appKey) {
    setSyncStatus("Dropbox connection needs an app key.", "warn");
    return;
  }

  localStorage.setItem(STORAGE.appKey, appKey);
  const verifier = randomString();
  const challenge = base64UrlEncode(await sha256(verifier));
  const state = randomString(24);

  sessionStorage.setItem(STORAGE.verifier, verifier);
  sessionStorage.setItem(STORAGE.state, state);

  const params = new URLSearchParams({
    client_id: appKey,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    code_challenge: challenge,
    code_challenge_method: "S256",
    token_access_type: "offline",
    state
  });

  window.location.href = `${DROPBOX_AUTHORIZE_URL}?${params.toString()}`;
}

async function finishDropboxConnect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error_description") || params.get("error");

  if (error) {
    setSyncStatus(`Dropbox connection did not finish: ${error}`, "bad");
    return;
  }

  if (!code) {
    updateConnectionState();
    return;
  }

  const expectedState = sessionStorage.getItem(STORAGE.state);
  const verifier = sessionStorage.getItem(STORAGE.verifier);
  const appKey = localStorage.getItem(STORAGE.appKey);

  if (!expectedState || !verifier || state !== expectedState || !appKey) {
    setSyncStatus("Dropbox sent us back, but the saved connection details were missing. Try Connect again.", "bad");
    return;
  }

  setSyncStatus("Finishing Dropbox connection...");
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: appKey,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier
  });

  const response = await fetch(DROPBOX_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Dropbox connection failed: ${message}`);
  }

  const tokenInfo = await response.json();
  storeTokenInfo(tokenInfo);
  sessionStorage.removeItem(STORAGE.verifier);
  sessionStorage.removeItem(STORAGE.state);
  window.history.replaceState({}, document.title, getRedirectUri());
  setSyncStatus("Connected to Dropbox. Loading workout data...");
  updateConnectionState();
  await loadWorkoutData();
}

async function uploadWorkoutData(data) {
  // Saves now go to the Firebase cloud database for the signed-in user.
  await cloudSave(data);
  // Best-effort: also mirror the full data blob into the Dropbox folder as
  // data/workout-data.json so on-disk tools (e.g. the weekly AI coach review)
  // always have fresh data without a manual export. Never blocks or fails the
  // main save; silently no-ops when Dropbox isn't connected.
  pushDataFileToDropbox(data).catch((e) => console.error("Dropbox mirror skipped:", e));
}

// Mirror the live data file into the user's Dropbox at DATA_FILE_PATH. Only runs
// when a Dropbox refresh token is present (getAccessToken returns null otherwise),
// so it's a no-op for users who never connected Dropbox. Uses overwrite mode and
// mute:true so it doesn't spam Dropbox notifications on every save.
async function pushDataFileToDropbox(data) {
  if (!localStorage.getItem(STORAGE.refreshToken)) return;
  const token = await getAccessToken();
  if (!token) return;
  const body = JSON.stringify(data, null, 2);
  const response = await fetch(DROPBOX_UPLOAD_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: DATA_FILE_PATH,
        mode: "overwrite",
        mute: true
      }),
      "Content-Type": "application/octet-stream"
    },
    body
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Dropbox mirror failed: ${message}`);
  }
}

async function downloadWorkoutData() {
  const token = await getAccessToken();
  if (!token) throw new Error("Connect Dropbox before loading.");

  const response = await fetch(DROPBOX_DOWNLOAD_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({ path: DATA_FILE_PATH })
    }
  });

  if (response.status === 409) {
    return makeEmptyData();
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Dropbox load failed: ${message}`);
  }

  return response.json();
}

async function loadWorkoutData() {
  if (!navigator.onLine) {
    setSyncStatus("Offline. Connect to the internet before loading Dropbox data.", "warn");
    return;
  }

  if (hasPendingData()) {
    await syncPendingData();
    return;
  }

  const data = await downloadWorkoutData();

  // Apply migration to ensure new structure exists
  if (!data.activePlan || typeof data.activePlan !== "object") {
    data.activePlan = getStarterActivePlan();
  } else {
    data.activePlan = { ...getStarterActivePlan(), ...data.activePlan };
  }
  if (!data.routines || !Array.isArray(data.routines) || data.routines.length === 0) {
    data.routines = getStarterRoutines();
  }
  if (!data.weeklyPlan || typeof data.weeklyPlan !== 'object') {
    data.weeklyPlan = getStarterWeeklyPlan();
  }
  // Older saved data predates the editable library: seed it once with the
  // 12 starters. (An empty array is left alone - that means Daniel cleared it.)
  if (!Array.isArray(data.library)) {
    data.library = getStarterExercises();
  }
  if (!Array.isArray(data.categories)) {
    data.categories = getStarterCategories();
  }
  if (!Array.isArray(data.completedWorkouts)) {
    data.completedWorkouts = [];
  }
  if (!Array.isArray(data.missedWorkouts)) {
    data.missedWorkouts = [];
  }

  saveLocalData(data);
  clearPendingData();
  renderTodayRoutine();
  renderActiveWorkout();
  updateConnectionState();
}

async function syncPendingData() {
  const pendingData = readJson(STORAGE.pendingData);
  if (!pendingData) {
    setSyncStatus("Nothing pending. This device is caught up.", "good");
    return;
  }

  if (!navigator.onLine) {
    setSyncStatus("Still offline. Pending data is safe on this device.", "warn");
    return;
  }

  await uploadWorkoutData(pendingData);
  clearPendingData();
  setSyncStatus("Pending changes synced.", "good");
  renderTodayRoutine();
  updateConnectionState();
}

async function handleSyncPillClick() {
  toggleSyncPanel();
  refreshSyncPanelText();
}

async function connectDropboxFromPanel() {
  if (!navigator.onLine) {
    setSyncStatus("You are offline. Connect to the internet before connecting Dropbox.", "warn");
    updateConnectionState();
    return;
  }
  try {
    setSyncStatus("Opening Dropbox connection...");
    await startDropboxConnect();
  } catch (error) {
    updateConnectionState();
    setSyncStatus(`${error.message} Your local data is still safe on this device.`, "bad");
  }
}

async function retrySyncFromPanel() {
  try {
    setConnectionUi("Syncing...", "warn");
    setSyncStatus("Retrying Dropbox sync...");
    await syncPendingData();
  } catch (error) {
    updateConnectionState();
    setSyncStatus(`${error.message} Your local data is still safe on this device.`, "bad");
  }
}

async function loadLatestFromPanel() {
  if (!navigator.onLine) {
    setSyncStatus("You are offline. Connect to the internet before loading Dropbox data.", "warn");
    updateConnectionState();
    return;
  }

  if (hasPendingData()) {
    setSyncStatus("Sync the pending changes first, then load latest.", "warn");
    updateConnectionState();
    return;
  }

  try {
    setConnectionUi("Loading...", "");
    setSyncStatus("Loading the latest Dropbox data...");
    await loadWorkoutData();
    setSyncStatus("Latest Dropbox data loaded.", "good");
  } catch (error) {
    updateConnectionState();
    setSyncStatus(`${error.message} Your local data is still safe on this device.`, "bad");
  }
}

function resetDropboxFromPanel() {
  forgetDropbox();
  toggleSyncPanel(true);
}

async function refreshAppUpdate() {
  setSyncStatus("Refreshing the saved app shell...");

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith("training-book")).map((key) => caches.delete(key)));
    }
  } catch (error) {
    setSyncStatus(`Could not clear the saved app shell: ${error.message}. Reloading anyway.`, "warn");
  }

  window.location.reload();
}

function forgetDropbox() {
  [
    STORAGE.appKey,
    STORAGE.accessToken,
    STORAGE.accessTokenExpiresAt,
    STORAGE.refreshToken
  ].forEach((key) => localStorage.removeItem(key));

  sessionStorage.removeItem(STORAGE.verifier);
  sessionStorage.removeItem(STORAGE.state);
  if (appKeyInput) appKeyInput.value = "";
  updateConnectionState();
  setSyncStatus("Dropbox connection forgotten on this device. Local backup remains.", "warn");
}

function updateConnectionState() {
  // Sync status is now driven by the Firebase sign-in state.
  updateCloudUi();
}

function makeSlug(value) {
  return String(value || "routine")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "routine";
}

function findExerciseIdByName(name) {
  const normalized = String(name || "").trim().toLowerCase();
  if (["bike", "peloton", "peloton ride", "peloton bike ride", "bike ride"].includes(normalized)) {
    const pelotonBike = exercises.find((exercise) => exercise.id === "peloton-bike");
    if (pelotonBike) return pelotonBike.id;
  }
  return exercises.find((exercise) => exercise.name.toLowerCase() === normalized)?.id || makeSlug(name);
}

function formatEntryDetails(entry) {
  if (entry.skipped) return "Skipped";
  if (entry.type === "cardio") {
    const planned = entry.planned?.durationMinutes ? `planned ${entry.planned.durationMinutes} min, ` : "";
    const subtype = entry.subtype || entry.planned?.subtype;
    return `${subtype ? `${subtype}: ` : ""}${planned}actual ${entry.durationMinutes || 0} min${formatCardioStats(entry.stats)}${entry.notes ? ` · ${entry.notes}` : ""}`;
  }

  if (entry.type === "sport") {
    const planned = entry.planned?.durationMinutes ? `planned ${entry.planned.durationMinutes} min, ` : "";
    const note = (entry.notes || "").trim();
    return `${planned}actual ${entry.durationMinutes || 0} min${note ? ` · ${note}` : ""}`;
  }

  if (entry.type === "timed") {
    const planned = entry.planned?.sets ? `planned ${entry.planned.sets} × ${entry.planned.seconds || 0} sec, ` : "";
    // New shape: each hold's actual seconds (e.g. "60s · 60s · 45s").
    if (Array.isArray(entry.holds) && entry.holds.length) {
      return `${planned}actual ${entry.holds.map((hold) => `${Number(hold.seconds) || 0}s`).join(" · ")}`;
    }
    const secs = entry.actualSummary?.seconds || entry.planned?.seconds || 0;
    return `${planned}actual ${entry.actualSummary?.sets || 0} × ${secs} sec`;
  }

  const entryWeightUnit = weightUnitLabel(entry);
  const summary = entry.actualSummary
    ? `${entry.actualSummary.sets}x${entry.actualSummary.reps}${Number(entry.actualSummary.weight) > 0 ? ` @ ${entry.actualSummary.weight} ${entryWeightUnit}` : ""}`
    : entry.sets?.map((set) => `${set.reps}@${set.weight} ${entryWeightUnit}`).join(", ");
  const planned = entry.planned?.sets ? `planned ${entry.planned.sets}x${entry.planned.reps || 0}, ` : "";
  return `${planned}actual ${summary || "no sets"}`;
}

function formatRoutineExercise(exercise) {
  const exerciseInfo = getExerciseById(exercise.exerciseId);
  const name = exerciseInfo?.name || exercise.exerciseId;
  const rest = Number(exercise.targetRest) > 0
    ? `, rest ${formatRest(exercise.targetRest)}${exercise.restTimer ? " timer" : ""}`
    : "";
  if (exercise.targetDuration || exerciseInfo?.type === "cardio" || exerciseInfo?.type === "sport") {
    const subtype = exercise.targetSubtype ? `${exercise.targetSubtype}, ` : "";
    return `- ${name}: ${subtype}${exercise.targetDuration || 20} min`;
  }
  if (exerciseInfo?.type === "timed") {
    return `- ${name}: ${exercise.targetSets || 1}x${exercise.targetReps || 0} sec${rest}`;
  }
  const weight = Number(exercise.targetWeight) > 0 ? ` @ ${exercise.targetWeight} ${exerciseInfo?.dualStack ? "lb per side" : "lb"}` : "";
  return `- ${name}: ${exercise.targetSets || 1}x${exercise.targetReps || 0}${weight}${rest}`;
}

function formatRoutineExerciseDisplay(exercise) {
  return escapeHtml(formatRoutineExercise(exercise).replace(/^-\s*/, ""));
}

function formatDayName(day) {
  return String(day || "").charAt(0).toUpperCase() + String(day || "").slice(1);
}

function getRoutineNameById(routineId, routines) {
  if (!routineId) return "Rest";
  return routines.find((routine) => routine.id === routineId)?.name || "(removed routine)";
}

function renderPlan() {
  if (!planContent) return;

  // A rebuild discards the schedule cards, so any in-progress swap is void.
  pendingSwapDay = null;
  draggingSwapDay = null;

  const data = getLocalData();
  const activePlan = { ...getStarterActivePlan(), ...(data.activePlan || {}) };
  const routines = Array.isArray(data.routines) ? data.routines : [];
  const weeklyPlan = data.weeklyPlan || getStarterWeeklyPlan();
  const importText = planContent.querySelector("#plan-import-text")?.value || "";
  const importMessageHtml = planImportMessage
    ? `<p class="plan-import-message">${escapeHtml(planImportMessage)}</p>`
    : "";
  const importPreviewHtml = planImportSummary
    ? `<pre class="plan-import-preview">${escapeHtml(planImportSummary)}</pre>`
    : `<p class="plan-muted">Preview the pasted plan before saving. Nothing changes until you press Save imported plan.</p>`;

  planContent.innerHTML = `
    ${renderPlanSchedule(weeklyPlan, routines)}
    ${renderPlanRoutines(routines)}
    ${renderMilestoneGoalsCard(activePlan)}
    ${renderPlanImportPanel(importMessageHtml, importPreviewHtml, importText)}
    ${renderPlanPickerSheet(routines)}
  `;

  if (planPicker.routineId) {
    // Hydrate the search-box magnifying glass (a data-icon placeholder) and put
    // the cursor in the field so you can type straight away.
    renderUiIcons(planContent);
    setTimeout(() => planContent.querySelector("#plan-picker-search")?.focus(), 0);
  }
}

// ===== Plan: section renderers =====

function formatLocation(loc) {
  if (loc === "home") return "Home";
  if (loc === "gym") return "Gym";
  return "Home or gym";
}

// One planned routine exercise as a name + a short target string. Handles the
// three target shapes: duration (cardio), timed holds (sets x seconds), and
// normal strength sets (sets x reps, optional weight).
function describeRoutineExercise(ex) {
  const lib = getExerciseById(ex.exerciseId);
  const name = lib?.name || ex.exerciseId;
  if (ex.targetDuration || lib?.type === "cardio" || lib?.type === "sport") return { name, detail: `${ex.targetDuration || 20} min` };
  if ((lib?.type) === "timed") return { name, detail: `${ex.targetSets || 1} × ${ex.targetReps || 0} sec` };
  const weight = Number(ex.targetWeight) > 0 ? ` @ ${ex.targetWeight} ${lib?.dualStack ? "lb per side" : "lb"}` : "";
  return { name, detail: `${ex.targetSets || 1} × ${ex.targetReps || 0}${weight}` };
}

// Monday-first day order for the schedule (the underlying weeklyPlan keys are
// the same day names; only the display order changes).
const PLAN_WEEK_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function renderPlanSchedule(weeklyPlan, routines) {
  const planned = PLAN_WEEK_ORDER.filter((day) => weeklyPlan[day]).length;
  return `
    <section class="plan-section">
      <div class="plan-section-head">
        <div>
          <p class="card-kicker">Weekly schedule</p>
          <p class="plan-muted">Use a day's menu to set its routine, or leave it as a rest day. To trade two days, drag one onto another — or tap ${getUiIcon("arrow-left-right")} on one day, then on another. Saves instantly.</p>
        </div>
        <div class="plan-head-actions">
          <span class="plan-pill">${planned} training ${planned === 1 ? "day" : "days"}</span>
          <button class="quiet-button small-button btn-ico danger-text" type="button" data-action="clear-weekly-plan"${planned ? "" : " disabled"}>${getUiIcon("trash-2")}Clear schedule</button>
        </div>
      </div>
      <div class="schedule-grid">
        ${PLAN_WEEK_ORDER.map((day) => `
          <div class="schedule-day${weeklyPlan[day] ? " is-training" : ""}" data-day="${day}" draggable="true">
            <div class="schedule-day-top">
              <span class="schedule-day-name" title="${formatDayName(day)}">${formatDayName(day).slice(0, 3)}</span>
              <button class="schedule-swap btn-ico" type="button" data-action="swap-day" data-day="${day}" aria-label="Swap ${formatDayName(day)} with another day" title="Swap day">${getUiIcon("arrow-left-right")}</button>
            </div>
            <select class="schedule-select" data-action="assign-day" data-day="${day}" aria-label="${formatDayName(day)} routine">
              <option value=""${!weeklyPlan[day] ? " selected" : ""}>Rest day</option>
              ${routines.map((routine) => `<option value="${escapeHtml(routine.id)}"${weeklyPlan[day] === routine.id ? " selected" : ""}>${escapeHtml(routine.name)}</option>`).join("")}
            </select>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderPlanRoutines(routines) {
  return `
    <section class="plan-section">
      <div class="plan-section-head">
        <div>
          <p class="card-kicker">Routines</p>
          <p class="plan-muted">Build and tweak your workouts. Edit any routine to add, reorder, or adjust exercises.</p>
        </div>
        <div class="plan-head-actions">
          <button class="quiet-button small-button btn-ico danger-text" type="button" data-action="clear-routines"${routines.length ? "" : " disabled"}>${getUiIcon("trash-2")}Clear routines</button>
          <button class="primary-button small-button btn-ico" type="button" data-action="add-routine">${getUiIcon("plus")}Add routine</button>
        </div>
      </div>
      <div class="plan-routines">
        ${routines.length
          ? routines.map((routine) => routine.id === editingRoutineId
              ? renderRoutineEditCard(routine)
              : renderRoutineViewCard(routine)).join("")
          : `<p class="empty-state">No routines yet. Tap “Add routine” to build one, or open “Import or replace plan” below to paste a full plan block.</p>`}
      </div>
    </section>
  `;
}

function renderRoutineViewCard(routine) {
  const exs = Array.isArray(routine.exercises) ? routine.exercises : [];
  return `
    <article class="routine-card">
      <div class="routine-card-head">
        <div>
          <h3>${escapeHtml(routine.name)}</h3>
          <p class="routine-loc">${escapeHtml(formatLocation(routine.location))}${routine.notes ? ` · ${escapeHtml(routine.notes)}` : ""}</p>
        </div>
        <button class="quiet-button small-button btn-ico" type="button" data-action="edit-routine" data-id="${escapeHtml(routine.id)}">${getUiIcon("pencil")}Edit</button>
      </div>
      ${exs.length
        ? `<ul class="routine-ex-list">
            ${exs.map((ex) => {
              const d = describeRoutineExercise(ex);
              return `<li><span class="routine-ex-name">${escapeHtml(d.name)}</span><span class="routine-ex-detail">${escapeHtml(d.detail)}</span></li>`;
            }).join("")}
          </ul>`
        : `<p class="plan-muted routine-empty">No exercises yet — tap Edit to add some.</p>`}
    </article>
  `;
}

function renderRoutineEditCard(routine) {
  const exs = Array.isArray(routine.exercises) ? routine.exercises : [];
  return `
    <article class="routine-card is-editing" data-routine="${escapeHtml(routine.id)}">
      <div class="routine-edit-top">
        <input class="routine-name-input" type="text" maxlength="40" value="${escapeHtml(routine.name)}" data-action="routine-field" data-id="${escapeHtml(routine.id)}" data-field="name" aria-label="Routine name" />
        <select class="routine-loc-select" data-action="routine-field" data-id="${escapeHtml(routine.id)}" data-field="location" aria-label="Where this routine is done">
          ${["mixed", "home", "gym"].map((loc) => `<option value="${loc}"${(routine.location || "mixed") === loc ? " selected" : ""}>${formatLocation(loc)}</option>`).join("")}
        </select>
      </div>

      <div class="routine-ex-edit-list">
        ${exs.length
          ? exs.map((ex, index) => renderRoutineExerciseEditRow(routine.id, ex, index, exs.length)).join("")
          : `<p class="plan-muted routine-empty">No exercises yet. Add one below.</p>`}
      </div>

      <div class="routine-add-ex">
        <button class="quiet-button btn-ico routine-add-button" type="button" data-action="open-plan-picker" data-id="${escapeHtml(routine.id)}">${getUiIcon("plus")}Add an exercise</button>
      </div>

      <div class="routine-edit-actions">
        <button class="primary-button small-button" type="button" data-action="done-routine" data-id="${escapeHtml(routine.id)}">Done</button>
        <button class="quiet-button small-button" type="button" data-action="cancel-routine" data-id="${escapeHtml(routine.id)}">Cancel</button>
        <button class="quiet-button small-button btn-ico danger-text" type="button" data-action="delete-routine" data-id="${escapeHtml(routine.id)}">${getUiIcon("trash-2")}Delete</button>
      </div>
    </article>
  `;
}

function renderRoutineExerciseEditRow(routineId, ex, index, count) {
  const lib = getExerciseById(ex.exerciseId);
  const name = lib?.name || ex.exerciseId;
  const type = lib?.type || (ex.targetDuration ? "cardio" : "strength");
  const numInput = (field, value, label, min = 0) =>
    `<label class="routine-num"><span>${label}</span><input type="number" inputmode="numeric" min="${min}" value="${value}" data-action="routine-ex-field" data-id="${escapeHtml(routineId)}" data-index="${index}" data-field="${field}" aria-label="${escapeHtml(name)} ${label}" /></label>`;

  const restInput = numInput("targetRest", Number(ex.targetRest) || 0, "rest s", 0);
  // A countdown for the rest while working out. Only offered where rest applies
  // (strength sets and timed holds); it does nothing without a rest target.
  const restTimerToggle = `<label class="routine-toggle" title="Run a countdown for this rest while working out"><input type="checkbox" data-action="routine-ex-toggle" data-id="${escapeHtml(routineId)}" data-index="${index}" data-field="restTimer"${ex.restTimer ? " checked" : ""} aria-label="${escapeHtml(name)} rest timer" /><span>timer</span></label>`;
  let fields;
  if (ex.targetDuration || type === "cardio" || type === "sport") {
    fields = numInput("targetDuration", ex.targetDuration || 20, "min", 1);
  } else if (type === "timed") {
    fields = numInput("targetSets", ex.targetSets || 3, "sets", 1) + numInput("targetReps", ex.targetReps || 30, "sec", 1) + restInput + restTimerToggle;
  } else {
    fields = numInput("targetSets", ex.targetSets || 3, "sets", 1)
      + numInput("targetReps", ex.targetReps || 8, "reps", 0)
      + numInput("targetWeight", Number(ex.targetWeight) || 0, lib?.dualStack ? "lb/side" : "lb", 0)
      + restInput + restTimerToggle;
  }

  // Free-text coaching note for this move, shown as a callout while working out.
  const noteInput = `<label class="routine-note"><span>Coach note</span><input type="text" maxlength="240" value="${escapeHtml(ex.coachNote || "")}" data-action="routine-ex-text" data-id="${escapeHtml(routineId)}" data-index="${index}" data-field="coachNote" placeholder="optional — e.g. ease off the last set, you burned out here last week" aria-label="${escapeHtml(name)} coach note" /></label>`;

  return `
    <div class="routine-ex-row">
      <div class="routine-ex-move">
        <button class="rx-move btn-ico" type="button" data-action="move-ex" data-id="${escapeHtml(routineId)}" data-index="${index}" data-dir="-1"${index === 0 ? " disabled" : ""} aria-label="Move ${escapeHtml(name)} up">${getUiIcon("chevron-up")}</button>
        <button class="rx-move btn-ico" type="button" data-action="move-ex" data-id="${escapeHtml(routineId)}" data-index="${index}" data-dir="1"${index === count - 1 ? " disabled" : ""} aria-label="Move ${escapeHtml(name)} down">${getUiIcon("chevron-down")}</button>
      </div>
      <div class="routine-ex-main">
        <span class="routine-ex-name">${escapeHtml(name)}</span>
        <div class="routine-ex-fields">${fields}</div>
        ${noteInput}
      </div>
      <button class="rx-remove btn-ico" type="button" data-action="remove-ex" data-id="${escapeHtml(routineId)}" data-index="${index}" aria-label="Remove ${escapeHtml(name)}">${getUiIcon("x")}</button>
    </div>
  `;
}

// ===== Plan: searchable add-exercise picker =====
// Replaces the old unsorted, photo-less <select>. A full-page sheet (consistent
// with the live-workout add) with a search box and compact photo rows, sorted
// alphabetically. Stays open after each pick so several moves can be added in a
// row; the count badge updates live so you can see what's already in the routine.

function openPlanPicker(routineId) {
  planPicker = { routineId, query: "" };
  renderPlan();
}

function closePlanPicker() {
  if (!planPicker.routineId) return;
  planPicker = { routineId: null, query: "" };
  // Full re-render so the routine card behind the sheet shows the new exercises.
  renderPlan();
  renderTodayRoutine();
}

// Add the picked exercise without a full re-render, then refresh only the results
// list — this keeps the search field focused (and the mobile keyboard up) and
// updates the "in routine" count badges live, the same trick the live-add uses.
function addExerciseFromPicker(exerciseId) {
  const routineId = planPicker.routineId;
  if (!routineId || !exerciseId) return;
  mutatePlanData((data) => {
    const routine = findRoutineInData(data, routineId);
    if (!routine) return;
    routine.exercises = Array.isArray(routine.exercises) ? routine.exercises : [];
    routine.exercises.push(defaultRoutineExercise(exerciseId));
  }, { rerender: false });
  const resultsEl = planContent?.querySelector(".plan-picker-results");
  if (resultsEl) resultsEl.innerHTML = renderPlanPickerResults();
}

// Just the result rows, split out so a search keystroke or a pick can refresh
// the list alone (preserving the focused input), as the live-add sheet does.
function renderPlanPickerResults() {
  const routine = findRoutineInData(getLocalData(), planPicker.routineId);
  // How many of each exercise the routine already holds, for the count badge.
  const counts = {};
  (routine?.exercises || []).forEach((ex) => {
    counts[ex.exerciseId] = (counts[ex.exerciseId] || 0) + 1;
  });

  const query = (planPicker.query || "").trim().toLowerCase();
  const matches = exercises
    .filter((exercise) => {
      if (!query) return true;
      return `${exercise.name} ${exercise.area || ""} ${(exercise.tags || []).join(" ")}`.toLowerCase().includes(query);
    })
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  // A compact row per exercise: small photo/glyph thumbnail + name + type.
  // Deliberately NOT renderExerciseArt — that nests the How-to and favourite
  // <button>s inside this result <button>, which is invalid HTML and steals taps.
  return matches.map((exercise) => {
    const photo = getExerciseStartImage(exercise);
    const thumb = photo
      ? `<span class="live-add-result-icon" style="background-image:url('${escapeHtml(photo)}')"></span>`
      : `<span class="live-add-result-icon">${getExerciseIcon(exercise.icon)}</span>`;
    const sub = `${formatExerciseType(exercise.type || "strength")}${exercise.area ? ` · ${exercise.area}` : ""}`;
    const count = counts[exercise.id] || 0;
    const badge = count ? `<span class="plan-picker-count" aria-label="${count} in this routine">${count}×</span>` : "";
    return `
      <button class="live-add-result plan-picker-result" type="button" data-action="pick-plan-exercise" data-id="${escapeHtml(exercise.id)}">
        ${thumb}
        <span class="live-add-result-text"><strong>${escapeHtml(exercise.name)}</strong><small>${escapeHtml(sub)}</small></span>
        ${badge}
      </button>
    `;
  }).join("") || `<p class="empty-state">No matching exercises.</p>`;
}

function renderPlanPickerSheet(routines) {
  if (!planPicker.routineId) return "";
  const routine = (routines || []).find((r) => r.id === planPicker.routineId);
  if (!routine) return "";
  return `
    <div class="lw-sheet-scrim plan-picker-scrim" role="presentation">
      <section class="lw-sheet live-add-sheet" role="dialog" aria-modal="true" aria-label="Add exercise to ${escapeHtml(routine.name)}">
        <div class="lw-sheet-head">
          <div>
            <h3>Add an exercise</h3>
            <p>Adding to ${escapeHtml(routine.name)} — pick as many as you like.</p>
          </div>
          <button class="lw-sheet-close" type="button" data-action="close-plan-picker" aria-label="Done adding exercises">&times;</button>
        </div>
        <div class="library-search live-add-search">
          <span class="library-search-icon" data-icon="search" aria-hidden="true"></span>
          <input type="search" id="plan-picker-search" value="${escapeHtml(planPicker.query)}" data-action="plan-picker-search" placeholder="Search exercises" autocomplete="off" aria-label="Search exercises" />
        </div>
        <div class="live-add-results plan-picker-results">
          ${renderPlanPickerResults()}
        </div>
      </section>
    </div>
  `;
}

// Plan Details (name/main goal/notes/review rhythm) is mostly context for the
// AI coach, not something worth reading every visit, so it lives in a modal
// behind the small icon button on the Plan heading rather than inline.
let planDetailsModalOpen = false;

function openPlanDetailsModal() {
  planDetailsModalOpen = true;
  renderPlanDetailsModal();
}

function closePlanDetailsModal() {
  planDetailsModalOpen = false;
  renderPlanDetailsModal();
}

function renderPlanDetailsModal() {
  const root = document.querySelector("#plan-details-modal-root");
  if (!root) return;
  if (!planDetailsModalOpen) {
    root.innerHTML = "";
    return;
  }
  const data = getLocalData();
  const activePlan = { ...getStarterActivePlan(), ...(data.activePlan || {}) };
  root.innerHTML = `
    <div class="lw-sheet-scrim" role="presentation" data-plan-details-scrim>
      <section class="lw-sheet plan-details-sheet" role="dialog" aria-modal="true" aria-label="Plan details">
        <div class="lw-sheet-head">
          <div>
            <h3>Plan details</h3>
            <p>The big picture — handy for you and for your AI coach.</p>
          </div>
          <button class="lw-sheet-close" type="button" data-action="close-plan-details" aria-label="Close plan details">&times;</button>
        </div>
        <div class="plan-form">
          <label>
            <span>Plan name</span>
            <input id="plan-name-input" value="${escapeHtml(activePlan.name)}" autocomplete="off" placeholder="Current Training Plan">
          </label>
          <label>
            <span>Main goal</span>
            <input id="plan-goal-input" value="${escapeHtml(activePlan.mainGoal)}" autocomplete="off" placeholder="Example: build strength while staying consistent">
          </label>
          <label>
            <span>Review rhythm</span>
            <input id="plan-review-input" value="${escapeHtml(activePlan.reviewCadence)}" autocomplete="off" placeholder="Weekly AI review">
          </label>
          <label>
            <span>Next review date</span>
            <input id="plan-next-review-input" type="date" value="${escapeHtml(activePlan.nextReviewDate)}">
          </label>
          <label>
            <span>Plan notes</span>
            <textarea id="plan-notes-input" placeholder="Constraints, preferences, injuries, focus notes, or anything the AI coach should remember.">${escapeHtml(activePlan.notes)}</textarea>
          </label>
        </div>
        <div class="plan-save-row plan-details-save-row">
          <span class="plan-save-status" id="plan-save-status" aria-live="polite"></span>
          <button class="primary-button small-button" type="button" data-action="save-plan-notes">Save details</button>
        </div>
      </section>
    </div>
  `;
  renderUiIcons(root);
}

// ===== Milestone goals (Plan tab) =====
// Same activePlan.focusGoals list the Progress "Focus goal" card reads —
// editable here directly, or by the coach through the confirmed apply flow.
function renderMilestoneGoalsCard(activePlan) {
  const goals = Array.isArray(activePlan.focusGoals) ? activePlan.focusGoals : [];
  return `
    <section class="plan-section">
      <div class="plan-section-head">
        <div>
          <p class="card-kicker">Milestone goals</p>
          <p class="plan-muted">Personal lift targets — set one yourself, or let your coach propose one during a review. Up to 3.</p>
        </div>
        <div class="plan-head-actions">
          <button class="primary-button small-button btn-ico" type="button" data-action="add-goal"${goals.length >= 3 ? " disabled" : ""}>${getUiIcon("plus")}Add goal</button>
        </div>
      </div>
      ${goals.length
        ? `<div class="goal-list">${goals.map((goal) => renderMilestoneGoalRow(goal)).join("")}</div>`
        : `<p class="empty-state">No milestone goals yet. Tap "Add goal" to set a personal target, like a Bench Press weight to work toward.</p>`}
    </section>
  `;
}

function renderMilestoneGoalRow(goal) {
  const name = goal.exerciseName || getExerciseById(goal.exerciseId)?.name || "Exercise";
  const targetParts = [];
  if (Number(goal.targetWeight) > 0) targetParts.push(`${goal.targetWeight} ${getExerciseById(goal.exerciseId)?.dualStack ? "lb per side" : "lb"}`);
  if (Number(goal.targetReps) > 0) targetParts.push(`${goal.targetReps} reps`);
  if (Number(goal.targetSets) > 0) targetParts.push(`${goal.targetSets} sets`);
  const targetText = targetParts.length ? targetParts.join(" × ") : "Target not set yet";
  return `
    <article class="goal-item goal-item-plan">
      <div class="goal-item-head">
        <p class="goal-name">${escapeHtml(name)}</p>
        <span class="goal-target-tag">${escapeHtml(targetText)}</span>
      </div>
      ${goal.note ? `<p class="plan-muted goal-note">${escapeHtml(goal.note)}</p>` : ""}
      <div class="goal-item-actions">
        <button class="quiet-button small-button btn-ico" type="button" data-action="edit-goal" data-id="${escapeHtml(goal.id)}">${getUiIcon("pencil")}Edit</button>
      </div>
    </article>
  `;
}

// ===== Milestone goal editor (shared modal: Plan "Add goal"/"Edit" + the
// Progress focus-goal card's edit icon) =====

function closeGoalEditor() {
  goalEditor = { step: "closed", goalId: null, exerciseId: null, exerciseName: "", targetWeight: "", targetReps: "", targetSets: "", note: "", query: "" };
  renderGoalEditorModal();
}

// New goal: start on the exercise-choice sheet.
function openGoalPicker() {
  goalEditor = { step: "pick", goalId: null, exerciseId: null, exerciseName: "", targetWeight: "", targetReps: "", targetSets: "", note: "", query: "" };
  renderGoalEditorModal();
}

// Existing goal: go straight to the target-fields form, prefilled.
function openGoalEditor(goalId) {
  const goals = getLocalData().activePlan?.focusGoals || [];
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) return;
  goalEditor = {
    step: "edit",
    goalId: goal.id,
    exerciseId: goal.exerciseId,
    exerciseName: goal.exerciseName || getExerciseById(goal.exerciseId)?.name || "Exercise",
    targetWeight: goal.targetWeight != null ? String(goal.targetWeight) : "",
    targetReps: goal.targetReps != null ? String(goal.targetReps) : "",
    targetSets: goal.targetSets != null ? String(goal.targetSets) : "",
    note: goal.note || "",
    query: ""
  };
  renderGoalEditorModal();
}

// Picking an exercise moves straight into the (blank) target form for it.
function pickGoalExercise(exerciseId) {
  const lib = getExerciseById(exerciseId);
  if (!lib) return;
  goalEditor = { step: "edit", goalId: null, exerciseId, exerciseName: lib.name, targetWeight: "", targetReps: "", targetSets: "", note: "", query: "" };
  renderGoalEditorModal();
}

// Only strength lifts have the weight/rep evidence (getStrengthSeries) a goal
// needs to mean anything - cardio/timed/sport moves are excluded from the
// picker rather than offered and silently never showing progress.
function renderGoalPickerResults() {
  const query = (goalEditor.query || "").trim().toLowerCase();
  const matches = exercises
    .filter((exercise) => (exercise.type || "strength") === "strength")
    .filter((exercise) => !query || `${exercise.name} ${exercise.area || ""} ${(exercise.tags || []).join(" ")}`.toLowerCase().includes(query))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return matches.map((exercise) => {
    const photo = getExerciseStartImage(exercise);
    const thumb = photo
      ? `<span class="live-add-result-icon" style="background-image:url('${escapeHtml(photo)}')"></span>`
      : `<span class="live-add-result-icon">${getExerciseIcon(exercise.icon)}</span>`;
    const sub = `${formatExerciseType(exercise.type || "strength")}${exercise.area ? ` · ${exercise.area}` : ""}`;
    return `
      <button class="live-add-result" type="button" data-action="pick-goal-exercise" data-id="${escapeHtml(exercise.id)}">
        ${thumb}
        <span class="live-add-result-text"><strong>${escapeHtml(exercise.name)}</strong><small>${escapeHtml(sub)}</small></span>
      </button>
    `;
  }).join("") || `<p class="empty-state">No matching exercises.</p>`;
}

function renderGoalEditorModal() {
  const root = document.querySelector("#goal-editor-modal-root");
  if (!root) return;
  if (goalEditor.step === "closed") {
    root.innerHTML = "";
    return;
  }

  if (goalEditor.step === "pick") {
    root.innerHTML = `
      <div class="lw-sheet-scrim" role="presentation" data-goal-editor-scrim>
        <section class="lw-sheet live-add-sheet" role="dialog" aria-modal="true" aria-label="Choose an exercise for your goal">
          <div class="lw-sheet-head">
            <div>
              <h3>Add a milestone goal</h3>
              <p>Pick the exercise you want to set a target for.</p>
            </div>
            <button class="lw-sheet-close" type="button" data-action="close-goal-editor" aria-label="Cancel">&times;</button>
          </div>
          <div class="library-search live-add-search">
            <span class="library-search-icon" data-icon="search" aria-hidden="true"></span>
            <input type="search" id="goal-picker-search" value="${escapeHtml(goalEditor.query)}" data-action="goal-picker-search" placeholder="Search exercises" autocomplete="off" aria-label="Search exercises" />
          </div>
          <div class="live-add-results goal-picker-results">
            ${renderGoalPickerResults()}
          </div>
        </section>
      </div>
    `;
    renderUiIcons(root);
    return;
  }

  // step === "edit"
  const isNew = !goalEditor.goalId;
  root.innerHTML = `
    <div class="lw-sheet-scrim" role="presentation" data-goal-editor-scrim>
      <section class="lw-sheet goal-editor-sheet" role="dialog" aria-modal="true" aria-label="${isNew ? "Set" : "Edit"} milestone goal">
        <div class="lw-sheet-head">
          <div>
            <h3>${isNew ? "Set" : "Edit"} milestone goal</h3>
            <p>${escapeHtml(goalEditor.exerciseName)}</p>
          </div>
          <button class="lw-sheet-close" type="button" data-action="close-goal-editor" aria-label="Cancel">&times;</button>
        </div>
        <div class="plan-form goal-editor-form">
          <div class="goal-editor-targets">
            <label><span>Weight (${getExerciseById(goalEditor.exerciseId)?.dualStack ? "lb per side" : "lb"})</span><input type="number" inputmode="decimal" min="0" id="goal-target-weight" value="${escapeHtml(goalEditor.targetWeight)}" placeholder="e.g. 185"></label>
            <label><span>Reps</span><input type="number" inputmode="numeric" min="0" id="goal-target-reps" value="${escapeHtml(goalEditor.targetReps)}" placeholder="e.g. 5"></label>
            <label><span>Sets</span><input type="number" inputmode="numeric" min="0" id="goal-target-sets" value="${escapeHtml(goalEditor.targetSets)}" placeholder="e.g. 3"></label>
          </div>
          <label>
            <span>Note (optional)</span>
            <input type="text" id="goal-note" maxlength="140" value="${escapeHtml(goalEditor.note)}" placeholder="e.g. touch-and-go, no bounce">
          </label>
        </div>
        <div class="plan-save-row goal-editor-actions">
          ${isNew ? "<span></span>" : `<button class="quiet-button small-button btn-ico danger-text" type="button" data-action="delete-goal" data-id="${escapeHtml(goalEditor.goalId)}">${getUiIcon("trash-2")}Remove goal</button>`}
          <button class="primary-button small-button" type="button" data-action="save-goal">Save goal</button>
        </div>
      </section>
    </div>
  `;
}

// Full-form semantics: whatever is in the fields becomes the goal's state, so
// clearing a field and saving removes that part of the target (unlike the
// coach-apply "goal" change, which only patches the fields it names).
function saveGoalFromEditor() {
  const exerciseId = goalEditor.exerciseId;
  if (!exerciseId) return;
  const weight = document.querySelector("#goal-target-weight")?.value.trim() || "";
  const reps = document.querySelector("#goal-target-reps")?.value.trim() || "";
  const sets = document.querySelector("#goal-target-sets")?.value.trim() || "";
  const note = document.querySelector("#goal-note")?.value.trim() || "";

  const data = getLocalData();
  data.activePlan = data.activePlan && typeof data.activePlan === "object" ? data.activePlan : getStarterActivePlan();
  data.activePlan.focusGoals = Array.isArray(data.activePlan.focusGoals) ? data.activePlan.focusGoals : [];
  const goals = data.activePlan.focusGoals;
  const now = new Date().toISOString();
  const index = goals.findIndex((g) => g.exerciseId === exerciseId);
  const base = index >= 0 ? goals[index] : { id: `goal-${exerciseId}`, exerciseId, createdAt: now };
  const updated = { id: base.id, exerciseId, createdAt: base.createdAt, exerciseName: getExerciseById(exerciseId)?.name || goalEditor.exerciseName, updatedAt: now };
  if (weight) updated.targetWeight = Number(weight);
  if (reps) updated.targetReps = Number(reps);
  if (sets) updated.targetSets = Number(sets);
  if (note) updated.note = note;

  if (index >= 0) goals[index] = updated;
  else goals.push(updated);
  if (goals.length > 3) goals.splice(0, goals.length - 3);

  commitProgressData(data);
  closeGoalEditor();
  renderPlan();
  renderProgress(false);
}

async function deleteGoal(goalId) {
  const goals = getLocalData().activePlan?.focusGoals || [];
  const goal = goals.find((g) => g.id === goalId);
  const ok = await showConfirmModal({
    title: `Remove ${goal?.exerciseName || "this"} goal?`,
    message: "This only removes the goal — your logged workouts and history are not affected.",
    confirmLabel: "Remove goal"
  });
  if (!ok) return;
  const data = getLocalData();
  data.activePlan = data.activePlan && typeof data.activePlan === "object" ? data.activePlan : getStarterActivePlan();
  data.activePlan.focusGoals = (Array.isArray(data.activePlan.focusGoals) ? data.activePlan.focusGoals : []).filter((g) => g.id !== goalId);
  commitProgressData(data);
  closeGoalEditor();
  renderPlan();
  renderProgress(false);
}

// The raw paste-in importer is an advanced/occasional tool: keep it collapsed
// behind a details panel so the everyday Plan page leads with the actual
// schedule, routines, and details. It auto-expands while an import is in
// progress (text typed, a preview, or a status message) so re-renders don't
// snap it shut mid-edit.
function renderPlanImportPanel(importMessageHtml, importPreviewHtml, importText) {
  const importActive = Boolean(importText || planImportSummary || planImportMessage);
  return `
    <section class="plan-section plan-import" id="plan-importer">
      <details class="plan-advanced"${importActive ? " open" : ""}>
        <summary class="plan-advanced-summary">
          <span>
            <span class="card-kicker">Import or replace plan</span>
            <span class="plan-muted">Advanced — paste a full plan block from a manual AI chat.</span>
          </span>
          <span class="plan-advanced-chevron" aria-hidden="true">${getUiIcon("chevron-down")}</span>
        </summary>
        <div class="ai-step plan-advanced-body">
          <div class="ai-step-text">
            <span class="ai-step-num">1</span>
            <div>
              <h3 class="ai-step-title">Paste the returned plan</h3>
              <p class="plan-muted">Paste the final block your outside AI gives you, then preview what Training Book reads before saving.</p>
            </div>
          </div>
          <textarea id="plan-import-text" class="plan-import-text" spellcheck="false" placeholder="Paste your coach's plan here…">${escapeHtml(importText)}</textarea>
          <p class="plan-muted ai-format-hint">Optional extras you can include: a starting weight with <code>@</code> (<code>Bench Press: 3x8 @ 135</code>), <code>timer</code> after a rest (<code>rest 90s timer</code>), or a <code>note:</code> line under a move for in-workout coaching.</p>
          <div class="plan-import-actions">
            <button class="quiet-button small-button" type="button" data-action="import-example">Use example</button>
            <button class="primary-button" type="button" data-action="import-preview">Preview changes</button>
            <button class="quiet-button" type="button" data-action="import-save" ${planImportPreview ? "" : "disabled"}>Save imported plan</button>
          </div>
          ${importMessageHtml}
          ${importPreviewHtml}
        </div>
      </details>
    </section>
  `;
}

function saveActivePlanFromScreen() {
  const data = getLocalData();
  data.activePlan = {
    ...getStarterActivePlan(),
    ...data.activePlan,
    name: document.querySelector("#plan-name-input")?.value.trim() || "Current Training Plan",
    mainGoal: document.querySelector("#plan-goal-input")?.value.trim() || "",
    reviewCadence: document.querySelector("#plan-review-input")?.value.trim() || "",
    nextReviewDate: document.querySelector("#plan-next-review-input")?.value.trim() || "",
    notes: document.querySelector("#plan-notes-input")?.value.trim() || ""
  };
  commitProgressData(data);
  renderReviewReminder();

  // Confirm the save in place rather than re-rendering (which looked like nothing happened).
  // Lives in the Plan details modal now, not planContent.
  const status = document.querySelector("#plan-save-status");
  if (status) {
    status.textContent = "Saved";
    status.classList.add("is-shown");
    clearTimeout(saveActivePlanFromScreen._timer);
    saveActivePlanFromScreen._timer = setTimeout(() => {
      status.textContent = "";
      status.classList.remove("is-shown");
    }, 2500);
  }
}

// ===== Plan: manual editing engine =====
// All edits flow through mutatePlanData: load the saved data, let `fn` change
// it, persist through the same local + cloud path everything else uses, then
// (by default) re-render the Plan and Today screens so both stay in sync.
function mutatePlanData(fn, { rerender = true } = {}) {
  const data = getLocalData();
  data.routines = Array.isArray(data.routines) ? data.routines : [];
  data.weeklyPlan = data.weeklyPlan || getStarterWeeklyPlan();
  fn(data);
  commitProgressData(data);
  if (rerender) {
    renderPlan();
    renderTodayRoutine();
    renderReviewReminder();
  }
}

function findRoutineInData(data, id) {
  return (data.routines || []).find((routine) => routine.id === id) || null;
}

function makeRoutineId(name) {
  const base = String(name || "routine").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "routine";
  return `${base}-${randomString(4)}`;
}

// Sensible starting targets for a freshly-added routine exercise, based on type.
function defaultRoutineExercise(exerciseId, { preferHistory = false } = {}) {
  if (preferHistory) {
    const fromHistory = defaultRoutineExerciseFromHistory(exerciseId);
    if (fromHistory) return fromHistory;
  }
  const type = getExerciseById(exerciseId)?.type || "strength";
  if (type === "cardio" || type === "sport") {
    const targetSubtype = defaultExerciseSubtype(exerciseId);
    const targetDuration = String(exerciseId).toLowerCase() === "soccer" ? SOCCER_DURATION_MINUTES : 20;
    return { exerciseId, targetDuration, ...(targetSubtype ? { targetSubtype } : {}) };
  }
  if (type === "timed") return { exerciseId, targetSets: 3, targetReps: 30, targetRest: 0 };
  return { exerciseId, targetSets: 3, targetReps: 8, targetRest: 0 };
}

function assignWeeklyDay(day, routineId) {
  mutatePlanData((data) => {
    data.weeklyPlan[day] = routineId || null;
  });
}

// ===== Plan: swap two days (drag-and-drop on desktop, tap-to-swap on touch) =====
// Both paths land here. Swapping trades the two days' routines (so a rest day and
// a training day exchange places) rather than shifting the whole week.
function swapWeeklyDays(dayA, dayB) {
  if (!dayA || !dayB || dayA === dayB) return;
  mutatePlanData((data) => {
    const a = data.weeklyPlan[dayA] || null;
    const b = data.weeklyPlan[dayB] || null;
    data.weeklyPlan[dayA] = b;
    data.weeklyPlan[dayB] = a;
  });
}

// Tap-to-swap: first tap on a day's swap handle arms it (highlight); the next tap
// on a different day's handle performs the swap; tapping the armed day again cancels.
// Arming toggles the highlight directly so the rest of the page isn't re-rendered.
let pendingSwapDay = null;

function handleSwapDayTap(day) {
  if (!day) return;
  if (pendingSwapDay === null) {
    pendingSwapDay = day;
    markPendingSwapDay(day);
    return;
  }
  if (pendingSwapDay === day) {
    pendingSwapDay = null;
    markPendingSwapDay(null);
    return;
  }
  const from = pendingSwapDay;
  pendingSwapDay = null;
  swapWeeklyDays(from, day); // re-renders, which clears the highlight
}

function markPendingSwapDay(day) {
  planContent?.querySelectorAll(".schedule-day").forEach((el) => {
    el.classList.toggle("is-swapping", Boolean(day) && el.dataset.day === day);
  });
}

// HTML5 drag-and-drop (desktop / mouse). Touch screens don't fire these, so the
// tap-to-swap handle above is the path there.
let draggingSwapDay = null;

function clearSwapDropTargets() {
  planContent?.querySelectorAll(".schedule-day.is-drop-target")
    .forEach((el) => el.classList.remove("is-drop-target"));
}

function handlePlanDragStart(event) {
  const card = event.target.closest(".schedule-day");
  if (!card || !card.dataset.day) return;
  // Let the menu work normally — only the card itself is a drag source.
  if (event.target.closest("select")) { event.preventDefault(); return; }
  draggingSwapDay = card.dataset.day;
  card.classList.add("is-dragging");
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    try { event.dataTransfer.setData("text/plain", card.dataset.day); } catch (_) {}
  }
}

function handlePlanDragOver(event) {
  if (draggingSwapDay === null) return;
  const card = event.target.closest(".schedule-day");
  if (!card || !card.dataset.day) return;
  event.preventDefault(); // mark this card as a valid drop target
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  if (card.dataset.day !== draggingSwapDay && !card.classList.contains("is-drop-target")) {
    clearSwapDropTargets();
    card.classList.add("is-drop-target");
  }
}

function handlePlanDrop(event) {
  if (draggingSwapDay === null) return;
  const card = event.target.closest(".schedule-day");
  if (!card || !card.dataset.day) return;
  event.preventDefault();
  const from = draggingSwapDay;
  const to = card.dataset.day;
  draggingSwapDay = null;
  if (from !== to) swapWeeklyDays(from, to); // re-renders (clears drag classes)
  else { card.classList.remove("is-dragging"); clearSwapDropTargets(); }
}

function handlePlanDragEnd() {
  draggingSwapDay = null;
  planContent?.querySelectorAll(".schedule-day.is-dragging")
    .forEach((el) => el.classList.remove("is-dragging"));
  clearSwapDropTargets();
}

async function clearWeeklyPlan() {
  const ok = await showConfirmModal({
    title: "Clear the weekly schedule?",
    message: "Every day will become a rest day. Your routines and past workouts will stay saved.",
    confirmLabel: "Clear schedule"
  });
  if (!ok) return;
  mutatePlanData((data) => {
    DOW_NAMES.forEach((day) => { data.weeklyPlan[day] = null; });
  });
}

async function clearRoutines() {
  const ok = await showConfirmModal({
    title: "Clear all routines?",
    message: "This removes every routine and turns the weekly schedule into rest days. Past workouts and your exercise library are not affected.",
    confirmLabel: "Clear routines"
  });
  if (!ok) return;
  mutatePlanData((data) => {
    data.routines = [];
    DOW_NAMES.forEach((day) => { data.weeklyPlan[day] = null; });
  }, { rerender: false });
  editingRoutineId = null;
  routineEditSnapshot = null;
  routineEditIsNew = false;
  renderPlan();
  renderTodayRoutine();
  renderReviewReminder();
}

function addRoutine() {
  const id = makeRoutineId("new-routine");
  mutatePlanData((data) => {
    data.routines.push({ id, name: "New Routine", location: "mixed", exercises: [], notes: "" });
  }, { rerender: false });
  routineEditSnapshot = null;
  routineEditIsNew = true;
  editingRoutineId = id;
  renderPlan();
  renderTodayRoutine();
}

// Open a routine's edit form, snapshotting it first so Cancel can revert.
function startRoutineEdit(id) {
  const routine = findRoutineInData(getLocalData(), id);
  routineEditSnapshot = routine ? JSON.parse(JSON.stringify(routine)) : null;
  routineEditIsNew = false;
  editingRoutineId = id;
  renderPlan();
}

function finishRoutineEdit() {
  editingRoutineId = null;
  routineEditSnapshot = null;
  routineEditIsNew = false;
  planPicker = { routineId: null, query: "" };
  renderPlan();
}

// Cancel: drop a brand-new routine entirely, or restore an existing one to the
// snapshot taken when editing began.
function cancelRoutineEdit(id) {
  if (routineEditIsNew) {
    mutatePlanData((data) => {
      data.routines = data.routines.filter((routine) => routine.id !== id);
      DOW_NAMES.forEach((day) => { if (data.weeklyPlan[day] === id) data.weeklyPlan[day] = null; });
    }, { rerender: false });
  } else if (routineEditSnapshot) {
    const snapshot = JSON.parse(JSON.stringify(routineEditSnapshot));
    mutatePlanData((data) => {
      const index = data.routines.findIndex((routine) => routine.id === id);
      if (index >= 0) data.routines[index] = snapshot;
    }, { rerender: false });
  }
  planPicker = { routineId: null, query: "" };
  finishRoutineEdit();
  renderTodayRoutine();
}

async function deleteRoutine(id) {
  const routine = findRoutineInData(getLocalData(), id);
  const ok = await showConfirmModal({
    title: `Delete ${routine?.name || "this routine"}?`,
    message: "Any day using this routine becomes a rest day. Past workouts are not affected.",
    confirmLabel: "Delete routine"
  });
  if (!ok) return;
  mutatePlanData((data) => {
    data.routines = data.routines.filter((item) => item.id !== id);
    DOW_NAMES.forEach((day) => { if (data.weeklyPlan[day] === id) data.weeklyPlan[day] = null; });
  }, { rerender: false });
  if (editingRoutineId === id) editingRoutineId = null;
  renderPlan();
  renderTodayRoutine();
}

// Text/select field edits save silently (no re-render) so typing keeps focus.
function updateRoutineField(id, field, value) {
  mutatePlanData((data) => {
    const routine = findRoutineInData(data, id);
    if (routine) routine[field] = value;
  }, { rerender: false });
}

async function removeRoutineExercise(routineId, index) {
  const routine = findRoutineInData(getLocalData(), routineId);
  const ex = routine?.exercises?.[index];
  const name = ex ? (getExerciseById(ex.exerciseId)?.name || ex.exerciseId) : "this exercise";
  const ok = await showConfirmModal({
    title: `Remove ${name}?`,
    message: "This removes the exercise from this routine only. Your exercise library and past workouts are not affected.",
    confirmLabel: "Remove exercise"
  });
  if (!ok) return;
  mutatePlanData((data) => {
    const target = findRoutineInData(data, routineId);
    if (target && Array.isArray(target.exercises)) target.exercises.splice(index, 1);
  });
}

function moveRoutineExercise(routineId, index, dir) {
  mutatePlanData((data) => {
    const routine = findRoutineInData(data, routineId);
    if (!routine || !Array.isArray(routine.exercises)) return;
    const target = index + dir;
    if (target < 0 || target >= routine.exercises.length) return;
    const [item] = routine.exercises.splice(index, 1);
    routine.exercises.splice(target, 0, item);
  });
}

function updateRoutineExerciseField(routineId, index, field, rawValue) {
  mutatePlanData((data) => {
    const routine = findRoutineInData(data, routineId);
    const ex = routine?.exercises?.[index];
    if (!ex) return;
    let value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0) value = 0;
    if (field === "targetSets") value = Math.max(1, Math.round(value));
    else if (field === "targetReps") value = Math.max(0, Math.round(value));
    else if (field === "targetDuration") value = Math.max(1, Math.round(value));
    else if (field === "targetRest") value = Math.max(0, Math.round(value));
    ex[field] = value;
  }, { rerender: false });
}

// Set a coach note / rest-timer flag on a planned exercise. Kept separate from
// the numeric field path above so text and booleans aren't coerced to numbers.
function setRoutineExerciseExtra(routineId, index, field, value) {
  mutatePlanData((data) => {
    const routine = findRoutineInData(data, routineId);
    const ex = routine?.exercises?.[index];
    if (!ex) return;
    if (field === "restTimer") {
      if (value) ex.restTimer = true; else delete ex.restTimer;
    } else if (field === "coachNote") {
      const text = String(value || "").trim();
      if (text) ex.coachNote = text; else delete ex.coachNote;
    }
  }, { rerender: false });
}

// One delegated click handler for the whole Plan screen.
function handlePlanClick(event) {
  // Tapping the dimmed backdrop (but not the sheet itself) closes the picker.
  if (event.target.classList.contains("plan-picker-scrim")) { closePlanPicker(); return; }

  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;

  switch (action) {
    case "open-plan-picker": openPlanPicker(id); break;
    case "close-plan-picker": closePlanPicker(); break;
    case "pick-plan-exercise": addExerciseFromPicker(id); break;
    case "save-plan-notes": saveActivePlanFromScreen(); break;
    case "swap-day": handleSwapDayTap(button.dataset.day); break;
    case "clear-weekly-plan": clearWeeklyPlan(); break;
    case "clear-routines": clearRoutines(); break;
    case "add-routine": addRoutine(); break;
    case "edit-routine": startRoutineEdit(id); break;
    case "done-routine": finishRoutineEdit(); break;
    case "cancel-routine": cancelRoutineEdit(id); break;
    case "delete-routine": deleteRoutine(id); break;
    case "add-goal": openGoalPicker(); break;
    case "edit-goal": openGoalEditor(id); break;
    case "remove-ex": removeRoutineExercise(id, Number(button.dataset.index)); break;
    case "move-ex": moveRoutineExercise(id, Number(button.dataset.index), Number(button.dataset.dir)); break;
    case "copy-packet": copyReviewPacket(); break;
    case "save-packet": saveReviewPacket(); break;
    case "import-example": fillPlanImportExample(); break;
    case "import-preview": previewPlanImportFromScreen(); break;
    case "import-save": savePlanImportFromScreen(); break;
    default: break;
  }
}

// Delegated change handler: weekly-day selects, routine name/location fields,
// and the numeric target inputs.
function handlePlanChange(event) {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const action = control.dataset.action;

  if (action === "assign-day") {
    assignWeeklyDay(control.dataset.day, control.value);
  } else if (action === "routine-field") {
    updateRoutineField(control.dataset.id, control.dataset.field, control.value);
  } else if (action === "routine-ex-field") {
    updateRoutineExerciseField(control.dataset.id, Number(control.dataset.index), control.dataset.field, control.value);
  } else if (action === "routine-ex-toggle") {
    setRoutineExerciseExtra(control.dataset.id, Number(control.dataset.index), control.dataset.field, control.checked);
  }
}

// Delegated input handler: clearing a previewed import the moment the pasted
// text changes (so a stale preview can't be saved by accident).
function handlePlanInput(event) {
  // Add-exercise picker search: filter the list as you type. Refresh only the
  // results so the search field keeps focus and the mobile keyboard stays up.
  if (event.target.id === "plan-picker-search") {
    planPicker.query = event.target.value;
    const resultsEl = planContent?.querySelector(".plan-picker-results");
    if (resultsEl) resultsEl.innerHTML = renderPlanPickerResults();
    return;
  }
  // Coach note typed on an exercise row: save as typed, no re-render (keeps focus).
  const noteField = event.target.closest('[data-action="routine-ex-text"]');
  if (noteField) {
    setRoutineExerciseExtra(noteField.dataset.id, Number(noteField.dataset.index), noteField.dataset.field, noteField.value);
    return;
  }
  if (event.target.id !== "plan-import-text") return;
  planImportPreview = null;
  planImportSummary = "";
  planImportMessage = "Text changed. Preview again before saving.";
  const saveButton = planContent?.querySelector('[data-action="import-save"]');
  if (saveButton) saveButton.disabled = true;
}

function formatWorkoutForExport(workout) {
  const lines = [];
  const flow = workout.flowMode ? ` (${workout.flowMode === "round" ? "round-by-round" : "straight sets"})` : "";
  lines.push(`Date: ${workout.date} - ${workout.name || workout.routineName || "Workout"}${flow}`);
  if (workout.custom) {
    const replaced = workout.replacedRoutine?.name ? `replaced planned ${workout.replacedRoutine.name}` : "custom workout";
    const note = workout.substitutionNote ? ` | note: ${workout.substitutionNote}` : "";
    lines.push(`  Context: ${replaced}${note}`);
  }

  workout.entries?.forEach((entry) => {
    // Sets (strength) or holds (timed) carry the per-unit notes and efforts.
    const units = Array.isArray(entry.sets) ? entry.sets : (Array.isArray(entry.holds) ? entry.holds : []);
    const setNotes = units.map((u) => u.notes).filter(Boolean).join("; ");
    const notes = [entry.notes, setNotes].filter(Boolean).join(" | Notes: ");
    // Prefer the per-set/hold efforts when any were rated, so the coach sees how
    // each set felt; otherwise fall back to the overall difficulty.
    const perUnitEfforts = units.map((u) => Number(u.difficulty)).filter((v) => Number.isFinite(v) && v > 0);
    const effort = perUnitEfforts.length
      ? `Effort per set: ${perUnitEfforts.join(" · ")}/10`
      : `Difficulty: ${entry.difficulty || "not logged"}/10`;
    lines.push(`  ${entry.exerciseName}: ${formatEntryDetails(entry)} | ${effort}${notes ? ` | Notes: ${notes}` : ""}`);
  });

  return lines.join("\n");
}

function formatWorkoutDate(value) {
  if (!value) return "Unknown date";
  const parsedDate = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(parsedDate);
}

// ===== Progress tab (Step 9): streak, weekly target, calendar =====
// All date math here is done in UTC so it lines up with the stored date keys
// (completedWorkouts holds "YYYY-MM-DD" strings made the same UTC way).

const DOW_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// Which month the calendar is showing (first-of-month, UTC). Null until first render.
let progressMonthDate = null;

// Body-weight card UI state: which inline box (if any) is open.
// null = closed, "log" = the log-weight box, "target" = the set-target box.
let weightBoxOpen = null;

// Body-weight chart time window: "30" / "90" days, or "all".
let weightRange = "90";

// Strength-progress card: which logged exercise is being charted (null = auto).
let strengthExerciseId = null;

function dateKeyUTC(date) {
  return date.toISOString().slice(0, 10);
}

function addDaysUTC(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function mondayOfWeek(date) {
  // Monday-based week start (the plan runs Mon-Fri with weekend rest).
  const back = (date.getUTCDay() + 6) % 7;
  return addDaysUTC(date, -back);
}

function getWeeklyTarget() {
  const data = getLocalData();
  const weeklyPlan = data.weeklyPlan || getStarterWeeklyPlan();
  return DOW_NAMES.reduce((count, day) => count + (weeklyPlan[day] ? 1 : 0), 0);
}

// The set of days Daniel actually trained. Built from BOTH the explicit
// completed list AND the dates of every saved workout, so an ad-hoc Log-tab
// session (which only writes to `workouts`) and any older save still counts
// toward the streak, weekly ring, consistency strip and calendar. Without this,
// a real logged workout could sit in History yet show as "0 this week".
function getCompletedDaySet(data) {
  const set = new Set(Array.isArray(data.completedWorkouts) ? data.completedWorkouts : []);
  if (Array.isArray(data.workouts)) {
    data.workouts.forEach((w) => { if (w && w.date) set.add(w.date); });
  }
  return set;
}

function countCompletedInWeek(mondayDate, completedSet) {
  let count = 0;
  for (let i = 0; i < 7; i++) {
    if (completedSet.has(dateKeyUTC(addDaysUTC(mondayDate, i)))) count++;
  }
  return count;
}

// F3: this week's per-muscle-group score, Sum(involvement x intensity) across
// every completed set/hold/session. Intensity is the logged 1-10 effort
// (unrated work uses a neutral default so it still counts); a strength/timed
// entry's "volume" is its number of completed sets/holds, while cardio/sport
// (no discrete sets) counts once per logged session. Raw sums are then
// normalized against the week's own highest-scoring group (0-1, brightest
// muscle = 1) - that single normalized number drives both the heat-map
// opacity and the value sent to the coach, so they can never disagree.
const MUSCLE_SCORE_DEFAULT_EFFORT = 6;

function computeWeeklyMuscleScores(data, mondayDate) {
  const startKey = dateKeyUTC(mondayDate);
  const endKey = dateKeyUTC(addDaysUTC(mondayDate, 6));
  const raw = {};
  MUSCLE_FIGURE_GROUP_ORDER.forEach((g) => { raw[g] = 0; });

  (data.workouts || []).forEach((w) => {
    if (!w.date || w.date < startKey || w.date > endKey) return;
    (w.entries || []).forEach((entry) => {
      if (entry.skipped) return;
      let units = 0;
      if (entry.type === "strength") units = Array.isArray(entry.sets) ? entry.sets.length : 0;
      else if (entry.type === "timed") units = Array.isArray(entry.holds) ? entry.holds.length : 0;
      else if (entry.type === "cardio" || entry.type === "sport") units = Number(entry.durationMinutes) > 0 ? 1 : 0;
      if (units <= 0) return;

      const effort = Number.isFinite(entry.difficulty) && entry.difficulty > 0 ? entry.difficulty : MUSCLE_SCORE_DEFAULT_EFFORT;
      const contribution = (effort / 10) * units;
      const weights = getExerciseMuscleWeights(getExerciseById(entry.exerciseId));
      Object.entries(weights).forEach(([group, weight]) => {
        raw[group] = (raw[group] || 0) + contribution * weight;
      });
    });
  });

  const maxRaw = Math.max(0, ...Object.values(raw));
  const normalized = {};
  MUSCLE_FIGURE_GROUP_ORDER.forEach((g) => {
    normalized[g] = maxRaw > 0 ? Math.round((raw[g] / maxRaw) * 100) / 100 : 0;
  });

  return { raw, normalized, maxRaw, hasData: maxRaw > 0 };
}

function computeWeekStreak(target, completedSet) {
  // Consecutive weeks that hit the weekly target. The current week is still in
  // progress, so it only adds to the streak once hit - never breaks it early.
  if (target <= 0) return 0;
  const weekHit = (monday) => countCompletedInWeek(monday, completedSet) >= target;

  let streak = 0;
  let cursor = mondayOfWeek(new Date());

  if (weekHit(cursor)) streak++;
  cursor = addDaysUTC(cursor, -7);

  let guard = 0;
  while (weekHit(cursor) && guard < 260) {
    streak++;
    cursor = addDaysUTC(cursor, -7);
    guard++;
  }
  return streak;
}

// The earliest real signal we have that Daniel was using the app: first
// completed workout, first logged workout, or first body-weight entry. Used so
// the calendar doesn't paint planned days red ("missed") before he ever
// started - those read as neutral rest instead.
function getFirstActivityKey(data) {
  const activityKeys = [
    ...(Array.isArray(data.completedWorkouts) ? data.completedWorkouts : []),
    ...((Array.isArray(data.workouts) ? data.workouts : []).map((w) => w && w.date).filter(Boolean)),
    ...((Array.isArray(data.bodyWeights) ? data.bodyWeights : []).map((b) => b && b.date).filter(Boolean))
  ].filter(Boolean).sort();
  return activityKeys.length ? activityKeys[0] : getTodayDateString();
}

function renderProgressCalendar(completedSet) {
  const data = getLocalData();
  const weeklyPlan = data.weeklyPlan || getStarterWeeklyPlan();
  const routines = Array.isArray(data.routines) ? data.routines : [];
  const todayKey = getTodayDateString();
  const firstActivityKey = getFirstActivityKey(data);

  const year = progressMonthDate.getUTCFullYear();
  const month = progressMonthDate.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1));
  const leadBlanks = (first.getUTCDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const monthLabel = first.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });

  const weekdayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    .map((d) => `<span class="cal-weekday">${d}</span>`).join("");

  let cells = "";
  for (let i = 0; i < leadBlanks; i++) {
    cells += `<span class="cal-cell is-blank" aria-hidden="true"></span>`;
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(Date.UTC(year, month, day));
    const key = dateKeyUTC(cellDate);
    const isPlanned = Boolean(weeklyPlan[DOW_NAMES[cellDate.getUTCDay()]]);
    const isDone = completedSet.has(key);
    const isToday = key === todayKey;
    const isPast = key < todayKey;

    const afterStart = key >= firstActivityKey;
    let state = "is-rest";
    let label = "Rest day";
    if (isDone) { state = "is-done"; label = "Workout done"; }
    else if (isPlanned && isPast && afterStart) { state = "is-missed"; label = "Planned - missed"; }
    else if (isPlanned && isPast) { state = "is-rest"; label = "Before you started"; }
    else if (isPlanned) { state = "is-planned"; label = "Planned"; }

    const todayClass = isToday ? " is-today" : "";
    // Routine name in the tooltip gives a quick hover preview on desktop; the
    // tappable cell opens the same info as a detail panel (below) on mobile.
    const routineName = isPlanned ? getRoutineNameById(weeklyPlan[DOW_NAMES[cellDate.getUTCDay()]], routines) : "";
    const title = `${key}: ${label}${routineName && routineName !== "Rest" ? ` · ${routineName}` : ""}`;
    cells += `<button type="button" class="cal-cell ${state}${todayClass}" data-cal-day="${key}" title="${escapeHtml(title)}">${day}</button>`;
  }

  return `
    <div class="cal-card">
      <div class="cal-nav">
        <button class="quiet-button cal-arrow btn-ico" type="button" data-cal-step="-1" aria-label="Previous month">${getUiIcon("chevron-left")}</button>
        <strong class="cal-month">${escapeHtml(monthLabel)}</strong>
        <button class="quiet-button cal-arrow btn-ico" type="button" data-cal-step="1" aria-label="Next month">${getUiIcon("chevron-right")}</button>
      </div>
      <div class="cal-grid cal-weekdays">${weekdayHeaders}</div>
      <div class="cal-grid">${cells}</div>
      <div class="cal-day-detail" hidden></div>
      <div class="cal-legend">
        <span><i class="dot is-done"></i>Done</span>
        <span><i class="dot is-planned"></i>Planned</span>
        <span><i class="dot is-missed"></i>Missed</span>
        <span><i class="dot is-rest"></i>Rest</span>
      </div>
    </div>
  `;
}

// The little panel that appears under the grid when a day is tapped: the date,
// a status badge, and (if a routine is scheduled) its exercise list. Mirrors
// the calendar's own colour logic so "Missed" only shows for planned days that
// fall after Daniel started using the app.
function renderCalendarDayDetailInner(key) {
  const data = getLocalData();
  const weeklyPlan = data.weeklyPlan || getStarterWeeklyPlan();
  const completedSet = getCompletedDaySet(data);
  const todayKey = getTodayDateString();
  const firstActivityKey = getFirstActivityKey(data);

  const date = new Date(`${key}T00:00:00Z`);
  const routineId = weeklyPlan[DOW_NAMES[date.getUTCDay()]];
  const routine = routineId ? getRoutineById(routineId) : null;
  const dateLabel = date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });

  const isDone = completedSet.has(key);
  const isPast = key < todayKey;
  const afterStart = key >= firstActivityKey;

  let statusClass = "is-rest";
  let statusText = "Rest day";
  if (isDone) { statusClass = "is-done"; statusText = "Completed"; }
  else if (routine && isPast && afterStart) { statusClass = "is-missed"; statusText = "Missed"; }
  else if (routine && isPast) { statusClass = "is-rest"; statusText = "Before you started"; }
  else if (routine && key === todayKey) { statusClass = "is-planned"; statusText = "Planned today"; }
  else if (routine) { statusClass = "is-planned"; statusText = "Planned"; }

  const head = `
    <div class="cal-day-detail-head">
      <span class="cal-day-detail-date">${escapeHtml(dateLabel)}</span>
      <span class="cal-day-detail-status ${statusClass}">${escapeHtml(statusText)}</span>
    </div>`;

  if (!routine) {
    return `${head}<p class="cal-day-detail-empty">No workout scheduled — rest day.</p>`;
  }

  const exercises = Array.isArray(routine.exercises) ? routine.exercises : [];
  const list = exercises.length
    ? `<ul class="cal-day-detail-list">${exercises.map((ex) => {
        const { name, detail } = describeRoutineExercise(ex);
        return `<li><span>${escapeHtml(name)}</span><span>${escapeHtml(detail)}</span></li>`;
      }).join("")}</ul>`
    : `<p class="cal-day-detail-empty">No exercises in this routine yet.</p>`;
  return `${head}<p class="cal-day-detail-routine">${escapeHtml(routine.name)}</p>${list}`;
}

// Fill (and reveal) the detail panel inside a given .cal-card, and mark the
// tapped cell selected. Shared by the Progress tab and the calendar modal.
function fillCalendarDayDetail(card, key) {
  const panel = card.querySelector(".cal-day-detail");
  if (!panel) return;
  panel.innerHTML = renderCalendarDayDetailInner(key);
  panel.hidden = false;
  card.querySelectorAll(".cal-cell.is-selected").forEach((cell) => cell.classList.remove("is-selected"));
  const cell = card.querySelector(`.cal-cell[data-cal-day="${key}"]`);
  if (cell) cell.classList.add("is-selected");
  // In the modal the calendar can fill the whole bottom-sheet, so this panel
  // lands below the fold - pull it into view so the tap visibly does something.
  panel.scrollIntoView({ block: "nearest" });
}

// Delegated click handler for day cells inside any .cal-card (Progress tab and
// the modal both use it). Month-nav arrows are handled separately.
function handleCalendarDayClick(event) {
  const cell = event.target.closest("[data-cal-day]");
  if (!cell) return;
  const card = cell.closest(".cal-card");
  if (card) fillCalendarDayDetail(card, cell.dataset.calDay);
}

// ===== Schedule calendar modal (calendar button on the Workout day switcher) =====
// Reuses renderProgressCalendar + the shared progressMonthDate, so the month
// you leave it on carries over to the Progress tab and vice-versa.
let calendarModalOpen = false;

function renderCalendarModal() {
  if (!calendarModalRoot) return;
  if (!calendarModalOpen) {
    calendarModalRoot.innerHTML = "";
    return;
  }
  const completedSet = getCompletedDaySet(getLocalData());
  calendarModalRoot.innerHTML = `
    <div class="lw-sheet-scrim" role="presentation" data-calendar-scrim>
      <section class="lw-sheet calendar-sheet" role="dialog" aria-modal="true" aria-label="Schedule calendar">
        <div class="lw-sheet-head">
          <div>
            <h3>Schedule</h3>
            <p>Tap any day to see what's planned.</p>
          </div>
          <button class="lw-sheet-close" type="button" data-action="close-calendar" aria-label="Close calendar">&times;</button>
        </div>
        ${renderProgressCalendar(completedSet)}
      </section>
    </div>
  `;
  renderUiIcons(calendarModalRoot);
}

function openCalendarModal() {
  // The modal can be opened before the Progress tab has ever rendered, so make
  // sure the shared month state is initialised to the current month.
  if (!progressMonthDate) {
    const now = new Date();
    progressMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  calendarModalOpen = true;
  renderCalendarModal();
}

function closeCalendarModal() {
  calendarModalOpen = false;
  renderCalendarModal();
}

// ===== Progress dashboard helpers (Step 10 overhaul) =====
// Everything below reads from the same synced data the rest of the app uses
// (completedWorkouts + the saved `workouts` log) and draws charts as plain
// inline SVG, so there is no chart library and it all works offline.

// A small, responsive line chart. `points` is [{x, y}] (x can be a day number
// or any increasing value); needs >= 2 points to draw. Optional dashed target.
function buildLineChart(points, opts = {}) {
  const W = 640, H = 220;
  const padX = 16, padTop = 18, padBottom = 18;
  const pts = (points || []).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (pts.length < 2) return "";

  const ys = pts.map((p) => p.y);
  const target = Number.isFinite(opts.target) ? opts.target : null;
  let minY = Math.min(...ys, target === null ? Infinity : target);
  let maxY = Math.max(...ys, target === null ? -Infinity : target);
  if (minY === maxY) { minY -= 1; maxY += 1; }     // flat line: give it breathing room
  const room = (maxY - minY) * 0.14;
  minY -= room; maxY += room;

  const xs = pts.map((p) => p.x);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const spanX = (maxX - minX) || 1;
  const mapX = (x) => padX + ((x - minX) / spanX) * (W - padX * 2);
  const mapY = (y) => padTop + (1 - (y - minY) / (maxY - minY)) * (H - padTop - padBottom);

  const coords = pts.map((p) => [mapX(p.x), mapY(p.y)]);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const baseY = (H - padBottom).toFixed(1);
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)} ${baseY} L${coords[0][0].toFixed(1)} ${baseY} Z`;
  const dots = coords.map(([x, y], i) => {
    const last = i === coords.length - 1;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${last ? 5.5 : 3.4}" class="chart-dot${last ? " is-last" : ""}"/>`;
  }).join("");

  let targetLine = "";
  if (target !== null) {
    const ty = mapY(target).toFixed(1);
    targetLine = `<line x1="${padX}" y1="${ty}" x2="${W - padX}" y2="${ty}" class="chart-target"/>`;
  }

  const gradId = `cg-${Math.random().toString(36).slice(2, 8)}`;
  return `
    <svg class="line-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(opts.ariaLabel || "Trend chart")}">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" class="chart-grad-top"/>
          <stop offset="100%" class="chart-grad-bottom"/>
        </linearGradient>
      </defs>
      <path d="${area}" fill="url(#${gradId})" stroke="none"/>
      ${targetLine}
      <path d="${line}" class="chart-line" fill="none" vector-effect="non-scaling-stroke"/>
      ${dots}
    </svg>`;
}

// A progress ring (donut) for the "this week" headline tile.
function buildProgressRing(value, max) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const dash = (pct * circ).toFixed(1);
  const gap = (circ - pct * circ).toFixed(1);
  return `
    <svg class="ring" viewBox="0 0 64 64" aria-hidden="true">
      <circle class="ring-bg" cx="32" cy="32" r="${r}"/>
      <circle class="ring-fg" cx="32" cy="32" r="${r}" stroke-dasharray="${dash} ${gap}" stroke-linecap="round" transform="rotate(-90 32 32)"/>
    </svg>`;
}

// Whole-day integer index (UTC) so chart x-spacing reflects real calendar gaps.
function dayNumberFromKey(dateKey) {
  const parts = String(dateKey).split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return NaN;
  return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
}

// Body-weight entries inside the chosen window (oldest -> newest).
function getWeightSeries(range) {
  const all = getBodyWeights();
  if (range === "all" || all.length === 0) return all;
  const days = range === "30" ? 30 : 90;
  const cutoffKey = dateKeyUTC(addDaysUTC(new Date(), -days));
  return all.filter((w) => String(w.date) >= cutoffKey);
}

// The strength exercises that actually have logged sets, for the picker.
function getLoggedStrengthExercises() {
  const data = getLocalData();
  const map = new Map();
  (data.workouts || []).forEach((w) => {
    (w.entries || []).forEach((e) => {
      if (e.type !== "strength") return;
      const done = Array.isArray(e.sets) ? e.sets.filter((s) => s.done) : [];
      const hasData = done.length > 0 || (e.actualSummary && Number(e.actualSummary.sets) > 0);
      if (!hasData) return;
      const cur = map.get(e.exerciseId) || { id: e.exerciseId, name: e.exerciseName || "Exercise", sessions: 0 };
      cur.sessions += 1;
      cur.name = e.exerciseName || cur.name;
      map.set(e.exerciseId, cur);
    });
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// Per-session best set for one exercise. `weighted` decides whether we chart the
// heaviest weight (loaded lifts) or the most reps (bodyweight moves).
function getStrengthSeries(exerciseId) {
  const data = getLocalData();
  const rows = [];
  (data.workouts || []).forEach((w) => {
    (w.entries || []).forEach((e) => {
      if (e.type !== "strength" || e.exerciseId !== exerciseId) return;
      const done = Array.isArray(e.sets) ? e.sets.filter((s) => s.done) : [];
      let maxW = 0, repsAtMaxW = 0, maxR = 0;
      done.forEach((s) => {
        const wt = Number(s.weight) || 0, r = Number(s.reps) || 0;
        if (wt > maxW || (wt === maxW && r > repsAtMaxW)) { maxW = wt; repsAtMaxW = r; }
        if (r > maxR) maxR = r;
      });
      if (!done.length && e.actualSummary) {
        maxW = Number(e.actualSummary.weight) || 0;
        repsAtMaxW = Number(e.actualSummary.reps) || 0;
        maxR = Number(e.actualSummary.reps) || 0;
      }
      rows.push({ date: w.date, x: dayNumberFromKey(w.date), maxW, repsAtMaxW, maxR });
    });
  });
  rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const weighted = rows.some((r) => r.maxW > 0);
  const sessions = rows
    .map((r) => ({ date: r.date, x: r.x, y: weighted ? r.maxW : r.maxR, reps: r.repsAtMaxW }))
    .filter((r) => r.y > 0);
  return { weighted, sessions };
}

// Best-ever set per strength exercise: the "trophy case".
function getPersonalRecords() {
  const data = getLocalData();
  const map = new Map();
  (data.workouts || []).forEach((w) => {
    (w.entries || []).forEach((e) => {
      if (e.type !== "strength") return;
      const done = Array.isArray(e.sets) ? e.sets.filter((s) => s.done) : [];
      let maxW = 0, repsAtMaxW = 0, maxR = 0;
      done.forEach((s) => {
        const wt = Number(s.weight) || 0, r = Number(s.reps) || 0;
        if (wt > maxW || (wt === maxW && r > repsAtMaxW)) { maxW = wt; repsAtMaxW = r; }
        if (r > maxR) maxR = r;
      });
      if (!done.length && e.actualSummary) {
        maxW = Number(e.actualSummary.weight) || 0;
        repsAtMaxW = Number(e.actualSummary.reps) || 0;
        maxR = Number(e.actualSummary.reps) || 0;
      }
      const cur = map.get(e.exerciseId);
      const weighted = maxW > 0 || (cur && cur.weighted);
      if (weighted) {
        if (!cur || !cur.weighted || maxW > cur.value) {
          map.set(e.exerciseId, { id: e.exerciseId, name: e.exerciseName || "Exercise", weighted: true, value: maxW, reps: repsAtMaxW, date: w.date });
        }
      } else if (!cur || maxR > cur.value) {
        map.set(e.exerciseId, { id: e.exerciseId, name: e.exerciseName || "Exercise", weighted: false, value: maxR, reps: 0, date: w.date });
      }
    });
  });
  return Array.from(map.values()).filter((r) => r.value > 0)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

// Totals for one Monday-anchored week: volume lifted, sets, active minutes, effort.
function getWeekStats(mondayDate) {
  const data = getLocalData();
  const start = dateKeyUTC(mondayDate);
  const end = dateKeyUTC(addDaysUTC(mondayDate, 6));
  let volume = 0, sets = 0, minutes = 0, diffSum = 0, diffCount = 0;
  (data.workouts || []).forEach((w) => {
    if (String(w.date) < start || String(w.date) > end) return;
    (w.entries || []).forEach((e) => {
      if (Number.isFinite(e.difficulty) && e.difficulty > 0) { diffSum += e.difficulty; diffCount++; }
      if (e.type === "strength") {
        const done = Array.isArray(e.sets) ? e.sets.filter((s) => s.done) : [];
        if (done.length) {
          done.forEach((s) => { sets++; volume += (Number(s.weight) || 0) * (Number(s.reps) || 0); });
        } else if (e.actualSummary) {
          const ss = Number(e.actualSummary.sets) || 0;
          sets += ss;
          volume += (Number(e.actualSummary.weight) || 0) * (Number(e.actualSummary.reps) || 0) * ss;
        }
      } else if (e.type === "cardio" || e.type === "sport") {
        minutes += Number(e.durationMinutes) || 0;
      } else if (e.type === "timed") {
        // Prefer the exact per-hold seconds (e.g. 60+60+45); fall back to the
        // older sets×seconds summary for workouts saved before per-hold logging.
        if (Array.isArray(e.holds) && e.holds.length) {
          minutes += e.holds.reduce((sum, h) => sum + (Number(h.seconds) || 0), 0) / 60;
        } else if (e.actualSummary) {
          minutes += ((Number(e.actualSummary.sets) || 0) * (Number(e.actualSummary.seconds) || 0)) / 60;
        }
      }
    });
  });
  return {
    volume: Math.round(volume),
    sets,
    minutes: Math.round(minutes),
    avgDifficulty: diffCount ? Math.round((diffSum / diffCount) * 10) / 10 : null
  };
}

// The last N Monday-weeks with their completed-workout counts (oldest -> newest).
function getRecentWeeks(weeks, completedSet) {
  const out = [];
  let monday = mondayOfWeek(new Date());
  for (let i = 0; i < weeks; i++) {
    out.unshift({ monday: new Date(monday), count: countCompletedInWeek(monday, completedSet) });
    monday = addDaysUTC(monday, -7);
  }
  return out;
}

// ===== Cardio reporting (Slice 2 of the Cardio + Progress upgrade) =====

// Sum the cardio (not sport) work inside one Monday-anchored week: session
// count, minutes, and the optional distance / elevation / calories stats.
function getCardioWeekStats(mondayDate) {
  const data = getLocalData();
  const start = dateKeyUTC(mondayDate);
  const end = dateKeyUTC(addDaysUTC(mondayDate, 6));
  let sessions = 0, minutes = 0, miles = 0, elevation = 0, calories = 0, caloriesEstimated = false;
  (data.workouts || []).forEach((w) => {
    if (String(w.date) < start || String(w.date) > end) return;
    (w.entries || []).forEach((e) => {
      if (e.type !== "cardio") return;
      sessions++;
      minutes += Number(e.durationMinutes) || 0;
      const s = e.stats || {};
      miles += Number(s.distance) || 0;
      elevation += Number(s.elevation) || 0;
      calories += Number(s.calories) || 0;
      if (s.caloriesEstimated && Number(s.calories) > 0) caloriesEstimated = true;
    });
  });
  return {
    sessions,
    minutes: Math.round(minutes),
    miles: Math.round(miles * 10) / 10,
    elevation: Math.round(elevation),
    calories: Math.round(calories),
    caloriesEstimated
  };
}

// The last N Monday-weeks of cardio totals (oldest -> newest), for the trend.
function getRecentCardioWeeks(weeks) {
  const out = [];
  let monday = mondayOfWeek(new Date());
  for (let i = 0; i < weeks; i++) {
    out.unshift(Object.assign({ monday: new Date(monday) }, getCardioWeekStats(monday)));
    monday = addDaysUTC(monday, -7);
  }
  return out;
}

// Per-activity cardio totals since a date key, most minutes first, so the card
// can show a bike-vs-run/tread breakdown.
function getCardioBreakdown(sinceKey) {
  const data = getLocalData();
  const map = new Map();
  (data.workouts || []).forEach((w) => {
    if (String(w.date) < sinceKey) return;
    (w.entries || []).forEach((e) => {
      if (e.type !== "cardio") return;
      const key = e.exerciseId || e.exerciseName || "cardio";
      const cur = map.get(key) || { name: e.exerciseName || "Cardio", sessions: 0, minutes: 0, miles: 0 };
      cur.sessions += 1;
      cur.minutes += Number(e.durationMinutes) || 0;
      cur.miles += Number(e.stats?.distance) || 0;
      cur.name = e.exerciseName || cur.name;
      map.set(key, cur);
    });
  });
  return Array.from(map.values())
    .map((r) => ({ name: r.name, sessions: r.sessions, minutes: Math.round(r.minutes), miles: Math.round(r.miles * 10) / 10 }))
    .sort((a, b) => b.minutes - a.minutes);
}

// Any cardio ever logged? Decides data vs empty state on the cardio card.
function hasAnyCardioLogged() {
  return (getLocalData().workouts || []).some((w) =>
    (w.entries || []).some((e) => e.type === "cardio"));
}

function renderProgressHero(data, streak, completedSet) {
  const totalWorkouts = Array.isArray(data.workouts) ? data.workouts.length : 0;
  const monthStart = (() => {
    const n = new Date();
    return dateKeyUTC(new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1)));
  })();
  const thisMonth = Array.from(completedSet).filter((k) => String(k) >= monthStart).length;
  const streakNote = streak === 0 ? "Hit your target to start one" : `${streak === 1 ? "week" : "weeks"} in a row`;

  return `
    <div class="prog-hero prog-hero-secondary">
      <div class="hero-tile">
        <p class="card-kicker">Streak</p>
        <p class="hero-num">${streak}<span class="hero-unit"> ${streak === 1 ? "wk" : "wks"}</span></p>
        <p class="hero-note">${escapeHtml(streakNote)}</p>
      </div>
      <div class="hero-tile">
        <p class="card-kicker">All time</p>
        <p class="hero-num">${totalWorkouts}</p>
        <p class="hero-note">${thisMonth} this month</p>
      </div>
    </div>`;
}

// F3: the "This Week" tile grew into its own full-width card - the same
// weekly-target ring as before, plus a front+back muscle heat map for
// everything logged this week. Opacity/legend numbers are normalized 0-1
// relative to the week's hardest-hit group (see computeWeeklyMuscleScores);
// that same normalized number is what the coach packet reads too, so the
// visual and the number the coach reasons from always agree.
function renderWeeklyMuscleHeatMapCard(doneThisWeek, target) {
  const data = getLocalData();
  const weekNote = target <= 0
    ? "No days planned"
    : (doneThisWeek >= target ? "Target hit — nice work!" : `${target - doneThisWeek} more to go`);
  const hit = target > 0 && doneThisWeek >= target;

  const ringBlock = `
    <div class="hero-ring-row">
      <div class="ring-wrap ring-wrap-lg">
        ${buildProgressRing(doneThisWeek, target)}
        <span class="ring-label">${doneThisWeek}<i>/${target}</i></span>
      </div>
      <p class="hero-note">${escapeHtml(weekNote)}</p>
    </div>`;

  const { normalized, hasData } = computeWeeklyMuscleScores(data, mondayOfWeek(new Date()));

  // The figure always renders, full card height on the right - highlighted
  // when there's data this week, a bare outline (buildMuscleFigure({})) when
  // there isn't, so the two-column layout stays consistent either way.
  const figure = buildMuscleFigure(hasData ? normalized : {}, { className: "muscle-figure-heatmap", ariaLabel: hasData ? "This week's worked muscles" : "No muscles worked yet this week" });

  let leftExtra;
  if (!hasData) {
    leftExtra = `<p class="prog-empty">Log a workout this week and a muscle heat map will build here automatically.</p>`;
  } else {
    const legendRows = MUSCLE_FIGURE_GROUP_ORDER
      .map((g) => ({ g, v: normalized[g] || 0 }))
      .filter((r) => r.v > 0)
      .sort((a, b) => b.v - a.v)
      .map((r) => `
        <div class="muscle-legend-row">
          <span class="muscle-legend-name">${escapeHtml(MUSCLE_FIGURE_GROUP_LABELS[r.g])}</span>
          <span class="muscle-legend-meta">${Math.round(r.v * 100)}%</span>
        </div>`)
      .join("");
    leftExtra = `
      <div class="muscle-legend">
        <p class="muscle-legend-head">Worked this week &middot; relative to your hardest-hit group</p>
        ${legendRows}
      </div>`;
  }

  const body = `
    <div class="muscle-heatmap-columns">
      <div class="muscle-heatmap-left">
        ${ringBlock}
        ${leftExtra}
      </div>
      <div class="muscle-heatmap-right">${figure}</div>
    </div>`;

  return `
    <section class="prog-card muscle-heatmap-card${hit ? " is-hit" : ""}">
      <p class="card-kicker">This week</p>
      ${body}
    </section>`;
}

function renderStrengthProgressCard() {
  const list = getLoggedStrengthExercises();
  if (!list.length) {
    return `
      <section class="prog-card">
        <div class="prog-card-head"><p class="card-kicker">Strength progress</p></div>
        <p class="prog-empty">Log a few strength workouts and your lifts will chart here automatically.</p>
      </section>`;
  }
  if (!strengthExerciseId || !list.some((x) => x.id === strengthExerciseId)) {
    strengthExerciseId = list.slice().sort((a, b) => b.sessions - a.sessions)[0].id;
  }
  const { weighted, sessions } = getStrengthSeries(strengthExerciseId);
  const unit = weighted ? (getExerciseById(strengthExerciseId)?.dualStack ? "lb/side" : "lb") : "reps";
  const options = list.map((x) =>
    `<option value="${escapeHtml(x.id)}"${x.id === strengthExerciseId ? " selected" : ""}>${escapeHtml(x.name)}</option>`
  ).join("");

  let body;
  if (sessions.length >= 2) {
    const first = sessions[0], last = sessions[sessions.length - 1];
    const change = Math.round((last.y - first.y) * 10) / 10;
    const dir = change > 0 ? "up" : (change < 0 ? "down" : "flat");
    const changeText = change === 0
      ? "Holding steady"
      : `${change > 0 ? "+" : ""}${change} ${unit} since you started`;
    body = `
      ${buildLineChart(sessions.map((s) => ({ x: s.x, y: s.y })), { ariaLabel: "Strength trend" })}
      <div class="prog-chart-foot">
        <div class="prog-chart-now">
          <p class="mini-num">${last.y}<span class="mini-unit"> ${unit}</span></p>
          <p class="mini-note">best recent set</p>
        </div>
        <span class="prog-change is-${dir}">${getUiIcon("trending-up")}${escapeHtml(changeText)}</span>
      </div>`;
  } else if (sessions.length === 1) {
    body = `
      <p class="mini-num lonely">${sessions[0].y}<span class="mini-unit"> ${unit}</span></p>
      <p class="prog-empty">One session logged — the trend line appears after your next one.</p>`;
  } else {
    body = `<p class="prog-empty">No completed sets for this exercise yet.</p>`;
  }

  return `
    <section class="prog-card">
      <div class="prog-card-head">
        <p class="card-kicker">Strength progress</p>
        <select class="prog-select" id="strength-exercise-select" aria-label="Choose an exercise to chart">${options}</select>
      </div>
      ${body}
    </section>`;
}

// F2 slice: a small plan-aware focus goal (Bench Press first, Milestone Goals
// on Plan can hold up to 3). Edited either by you (Plan tab / the edit icon
// here) or by the coach through the confirmed apply flow — both write the
// same activePlan.focusGoals list, so this card just reflects whatever is
// there and stays hidden until at least one goal exists.
function renderFocusGoalCard() {
  const data = getLocalData();
  const goals = Array.isArray(data.activePlan?.focusGoals) ? data.activePlan.focusGoals : [];
  if (!goals.length) return "";
  return `
    <section class="prog-card">
      <div class="prog-card-head">
        <p class="card-kicker">Focus goal</p>
        <span class="prog-sub">tap to edit</span>
      </div>
      <div class="goal-list">${goals.map((goal) => renderFocusGoalItem(goal)).join("")}</div>
    </section>`;
}

function renderFocusGoalItem(goal) {
  const exerciseId = goal.exerciseId;
  const name = goal.exerciseName || getExerciseById(exerciseId)?.name || "Exercise";
  const weightUnit = getExerciseById(exerciseId)?.dualStack ? "lb per side" : "lb";
  const targetParts = [];
  if (Number(goal.targetWeight) > 0) targetParts.push(`${goal.targetWeight} ${weightUnit}`);
  if (Number(goal.targetReps) > 0) targetParts.push(`${goal.targetReps} reps`);
  if (Number(goal.targetSets) > 0) targetParts.push(`${goal.targetSets} sets`);
  const targetText = targetParts.length ? targetParts.join(" × ") : "Target not set yet";

  const { sessions } = exerciseId ? getStrengthSeries(exerciseId) : { sessions: [] };
  const best = sessions.reduce((top, s) => (!top || s.y > top.y) ? s : top, null);
  const recent = sessions.slice(-3).reverse();

  let progressNote = "";
  let progressHit = false;
  if (best && Number(goal.targetWeight) > 0) {
    const diff = Math.round((goal.targetWeight - best.y) * 10) / 10;
    progressHit = diff <= 0;
    progressNote = progressHit ? "Target hit — nice work!" : `${diff} ${weightUnit} to go`;
  }

  const recentList = recent.length
    ? `<ul class="goal-recent">${recent.map((s) => `<li><span>${escapeHtml(formatWorkoutDate(s.date))}</span><span>${s.y} ${weightUnit}${s.reps ? ` × ${s.reps}` : ""}</span></li>`).join("")}</ul>`
    : `<p class="prog-empty">No logged sets for this exercise yet.</p>`;

  return `
    <article class="goal-item">
      <div class="goal-item-head">
        <p class="goal-name">${escapeHtml(name)}</p>
        <span class="goal-item-head-right">
          <span class="goal-target-tag">${escapeHtml(targetText)}</span>
          <button class="goal-edit-btn btn-ico" type="button" data-action="edit-goal" data-id="${escapeHtml(goal.id)}" aria-label="Edit ${escapeHtml(name)} goal">${getUiIcon("pencil")}</button>
        </span>
      </div>
      <div class="prog-chart-foot">
        <div class="goal-stat">
          <p class="mini-num">${best ? best.y : "—"}${best ? `<span class="mini-unit"> ${weightUnit}</span>` : ""}</p>
          <p class="mini-note">${best ? `best set${best.reps ? ` · ×${best.reps}` : ""}` : "no sets logged yet"}</p>
        </div>
        ${progressNote ? `<p class="goal-progress-note${progressHit ? " is-hit" : ""}">${escapeHtml(progressNote)}</p>` : ""}
      </div>
      ${recentList}
    </article>`;
}

function renderPersonalRecords() {
  const prs = getPersonalRecords();
  if (!prs.length) return "";
  const items = prs.map((r) => `
    <div class="pr-item">
      <span class="pr-medal">${getUiIcon("star")}</span>
      <div class="pr-body">
        <p class="pr-name">${escapeHtml(r.name)}</p>
        <p class="pr-value">${r.weighted
          ? `${r.value}<span class="pr-unit"> ${getExerciseById(r.id)?.dualStack ? "lb/side" : "lb"}</span>${r.reps ? ` <span class="pr-x">× ${r.reps}</span>` : ""}`
          : `${r.value}<span class="pr-unit"> reps</span>`}</p>
        <p class="pr-date">${escapeHtml(formatWorkoutDate(r.date))}</p>
      </div>
    </div>`).join("");
  return `
    <section class="prog-card">
      <div class="prog-card-head">
        <p class="card-kicker">Personal records</p>
        <span class="prog-sub">your best set per move</span>
      </div>
      <div class="pr-grid">${items}</div>
    </section>`;
}

function renderConsistencyStrip(target, completedSet) {
  const weeks = getRecentWeeks(12, completedSet);
  const anyDone = weeks.some((w) => w.count > 0);
  if (!anyDone) return "";
  const bars = weeks.map((w) => {
    const ratio = target > 0 ? Math.min(1, w.count / target) : (w.count > 0 ? 1 : 0);
    const state = (target > 0 && w.count >= target) ? "is-hit" : (w.count > 0 ? "is-partial" : "is-empty");
    const h = Math.max(7, Math.round(ratio * 100));
    const label = w.monday.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
    const title = `Week of ${label}: ${w.count}${target > 0 ? ` / ${target}` : ""} done`;
    return `<span class="cbar ${state}" title="${escapeHtml(title)}"><i style="height:${h}%"></i></span>`;
  }).join("");
  return `
    <section class="prog-card consistency-card">
      <div class="prog-card-head">
        <p class="card-kicker">Last 12 weeks</p>
        <span class="prog-sub">workouts vs target</span>
      </div>
      <div class="cbar-row">${bars}</div>
    </section>`;
}

function renderEffortCard() {
  const stats = getWeekStats(mondayOfWeek(new Date()));
  if (!stats.volume && !stats.sets && !stats.minutes && stats.avgDifficulty === null) return "";
  const vol = stats.volume >= 1000
    ? `${(stats.volume / 1000).toFixed(stats.volume >= 10000 ? 0 : 1)}k`
    : String(stats.volume);
  return `
    <section class="prog-card">
      <div class="prog-card-head"><p class="card-kicker">This week's effort</p></div>
      <div class="effort-grid">
        <div class="effort-cell">
          <p class="effort-num">${vol}<span class="effort-unit"> lb</span></p>
          <p class="effort-label">Volume lifted</p>
        </div>
        <div class="effort-cell">
          <p class="effort-num">${stats.sets}</p>
          <p class="effort-label">Sets done</p>
        </div>
        <div class="effort-cell">
          <p class="effort-num">${stats.minutes}<span class="effort-unit"> min</span></p>
          <p class="effort-label">Cardio &amp; holds</p>
        </div>
        <div class="effort-cell">
          <p class="effort-num">${stats.avgDifficulty === null ? "–" : stats.avgDifficulty}<span class="effort-unit">${stats.avgDifficulty === null ? "" : " /10"}</span></p>
          <p class="effort-label">Avg effort</p>
        </div>
      </div>
    </section>`;
}

// Cardio dashboard card: this week's totals, a weekly-minutes trend, and a
// bike-vs-run/tread breakdown. Reuses the shared inline-SVG chart + effort-grid
// styling — no chart library.
function renderCardioProgressCard() {
  const head = `
    <div class="prog-card-head">
      <p class="card-kicker">Cardio</p>
      <span class="prog-sub">this week</span>
    </div>`;

  if (!hasAnyCardioLogged()) {
    return `
      <section class="prog-card">
        ${head}
        <p class="prog-empty">Log a bike, run, or tread session and your weekly cardio totals and breakdown will chart here automatically.</p>
      </section>`;
  }

  const week = getCardioWeekStats(mondayOfWeek(new Date()));
  const weeks = getRecentCardioWeeks(12);
  const showElevation = week.elevation > 0 || weeks.some((w) => w.elevation > 0);

  // Distance / calories are always shown; the 4th tile is elevation when any is
  // logged (tread work), otherwise the session count, so the grid stays 2x2.
  const tiles = [
    { num: week.minutes, unit: " min", label: "Time" },
    { num: week.miles, unit: " mi", label: "Distance" },
    { num: week.caloriesEstimated && week.calories > 0 ? `~${week.calories}` : week.calories, unit: " kcal", label: "Calories" },
    showElevation
      ? { num: week.elevation, unit: " ft", label: "Elevation" }
      : { num: week.sessions, unit: "", label: week.sessions === 1 ? "Session" : "Sessions" }
  ];
  const tileHtml = tiles.map((t) => `
    <div class="effort-cell">
      <p class="effort-num">${t.num || 0}<span class="effort-unit">${t.unit}</span></p>
      <p class="effort-label">${escapeHtml(t.label)}</p>
    </div>`).join("");

  // Weekly-minutes trend, drawn only once two weeks actually have cardio so a
  // single session doesn't spike a line out of nothing.
  let trend = "";
  if (weeks.filter((w) => w.minutes > 0).length >= 2) {
    const points = weeks.map((w, i) => ({ x: i, y: w.minutes }));
    const change = week.minutes - weeks[weeks.length - 2].minutes;
    const dir = change > 0 ? "up" : (change < 0 ? "down" : "flat");
    const changeText = change === 0
      ? "Same as last week"
      : `${change > 0 ? "+" : ""}${change} min vs last week`;
    trend = `
      <div class="cardio-trend">
        ${buildLineChart(points, { ariaLabel: "Weekly cardio minutes" })}
        <div class="prog-chart-foot">
          <div class="prog-chart-now">
            <p class="mini-num">${week.minutes}<span class="mini-unit"> min</span></p>
            <p class="mini-note">this week</p>
          </div>
          <span class="prog-change is-${dir}">${getUiIcon("trending-up")}${escapeHtml(changeText)}</span>
        </div>
      </div>`;
  }

  // Bike-vs-run/tread breakdown over the same 12-week window as the trend.
  const breakdown = getCardioBreakdown(dateKeyUTC(weeks[0].monday));
  let split = "";
  if (breakdown.length) {
    const rows = breakdown.map((r) => `
      <div class="cardio-split-row">
        <span class="cardio-split-name">${escapeHtml(r.name)}</span>
        <span class="cardio-split-meta">${r.sessions}&times; · ${r.minutes} min${r.miles > 0 ? ` · ${r.miles} mi` : ""}</span>
      </div>`).join("");
    split = `
      <div class="cardio-split">
        <p class="cardio-split-head">By activity · last 12 weeks</p>
        ${rows}
      </div>`;
  }

  return `
    <section class="prog-card">
      ${head}
      <div class="effort-grid">${tileHtml}</div>
      ${trend}
      ${split}
    </section>`;
}

function formatCoachReviewTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function getCoachButtonState() {
  if (!navigator.onLine) return { disabled: true, label: "Offline", message: "Connect to the internet to ask the coach." };
  if (!firebaseLoaded || !authChecked) return { disabled: true, label: "Loading", message: "Loading your account." };
  if (!cloudUser) return { disabled: true, label: "Sign in", message: "Sign in with Google so the coach can read only your own Training Book data." };
  if (!_coachReviewCallable) return { disabled: true, label: "Not ready", message: "The coach helper has not loaded yet." };
  return { disabled: false, label: "", message: "" };
}

function getCoachReviewLabel(type) {
  if (type === "deep") return "Deep Review";
  if (type === "quick") return "Quick Check-In";
  if (type === "plan") return "Plan Draft";
  return "Coach Review";
}

function getCoachDisplayState() {
  const data = getLocalData();
  const coach = getCoachMeta(data);
  return {
    data,
    coach,
    reviewDate: getActiveReviewDate(data),
    checkin: coachReviewState.checkin || coach.lastCheckin || "",
    generatedAt: coachReviewState.generatedAt || coach.lastReviewAt || "",
    reviewType: coachReviewState.reviewType || coach.lastReviewType || "",
    packetMeta: coachReviewState.packetMeta || coach.lastCheckinMeta || null,
    changes: normalizeCoachChanges(coachReviewState.changes?.length ? coachReviewState.changes : coach.lastChanges),
    history: coach.history
  };
}

function getCoachReviewById(id) {
  const history = getCoachMeta(getLocalData()).history;
  return history.find((item) => item.id === id) || null;
}

function getActiveCoachReview(display = getCoachDisplayState()) {
  if (coachModalReviewId) return getCoachReviewById(coachModalReviewId);
  if (!display.checkin) return null;
  return {
    id: "latest",
    generatedAt: display.generatedAt,
    type: display.reviewType === "deep" ? "deep" : "quick",
    checkin: display.checkin,
    changes: normalizeCoachChanges(display.changes),
    appliedChangeIds: [],
    packetMeta: display.packetMeta || null
  };
}

function renderCoachStatusLine({ coach, reviewDate }) {
  const today = getTodayDateString();
  if (!reviewDate) return "No review date is set on your plan yet.";
  if (isReviewCycleHandled(coach, reviewDate)) return `Review handled for ${formatWorkoutDate(reviewDate)}.`;
  if (coach.reminderSnoozedUntil && today <= coach.reminderSnoozedUntil) return `Reminder snoozed until ${formatWorkoutDate(coach.reminderSnoozedUntil)}.`;
  if (today > reviewDate) return `Review was due ${formatWorkoutDate(reviewDate)}.`;
  if (today === reviewDate) return "Review is due today.";
  return `Next review window opens ${formatWorkoutDate(reviewDate)}.`;
}

function renderCoachOption({ mode, title, kicker, body, primary, meta, disabled, busy }) {
  return `
    <article class="coach-option ${mode === "manual" ? "is-manual" : ""}">
      <div class="coach-option-top">
        <span class="coach-option-icon">${getUiIcon(mode === "manual" ? "clipboard-list" : "sparkles")}</span>
        <div>
          <p class="card-kicker">${escapeHtml(kicker)}</p>
          <h3>${escapeHtml(title)}</h3>
        </div>
      </div>
      <p>${escapeHtml(body)}</p>
      <p class="coach-option-meta">${escapeHtml(meta)}</p>
      <div class="coach-option-actions">
        ${mode === "manual"
          ? `<button class="primary-button small-button btn-ico" type="button" data-coach-copy>${getUiIcon("clipboard-list")}Copy prompt</button>
             <button class="quiet-button small-button btn-ico" type="button" data-coach-save>${getUiIcon("download")}Save file</button>`
          : `<button class="${mode === "quick" ? "primary-button" : "quiet-button"} small-button btn-ico" type="button" data-coach-run="${mode}" ${disabled || busy ? "disabled" : ""}>${getUiIcon("sparkles")}${busy ? "Reviewing..." : escapeHtml(primary)}</button>`}
      </div>
    </article>
  `;
}

function renderCoachLoading(action) {
  const title = "Coach is thinking";
  const detail = action === "deep"
    ? "Reading the broader window and shaping a focused review."
    : "Reading recent training and shaping a focused review.";
  return `
    <div class="coach-loading" role="status" aria-live="polite">
      <span class="coach-thinking-glyph" aria-hidden="true">${getUiIcon("sparkles")}</span>
      <div>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(detail)}</p>
      </div>
    </div>
  `;
}

function renderCoachResult(display) {
  const busy = coachReviewState.status === "loading";
  const changes = normalizeCoachChanges(display.changes);
  const canReviewChanges = display.checkin && !busy && changes.length > 0;
  if (!display.checkin && !busy) {
    return `
      <section class="coach-result">
        <p class="card-kicker">Latest response</p>
        <p class="coach-empty">Run a Quick Check-In or Deep Review after you have logged a few workouts. Manual Chat Prompt is always available when you want a conversation outside the app.</p>
      </section>
    `;
  }
  const generated = formatCoachReviewTime(display.generatedAt);
  const label = getCoachReviewLabel(display.reviewType);
  return `
    <section class="coach-result">
      <div class="coach-result-head">
        <div>
          <p class="card-kicker">Latest response</p>
          <h3>${escapeHtml(label)}</h3>
          <p class="coach-option-meta">${generated ? `Generated ${escapeHtml(generated)}` : "Not generated yet"}</p>
        </div>
        ${canReviewChanges ? `<button class="quiet-button small-button btn-ico" type="button" data-coach-review-changes="latest">${getUiIcon("clipboard-list")}Review changes</button>` : ""}
      </div>
      ${display.checkin ? `<div class="coach-output">${escapeHtml(display.checkin)}</div>` : ""}
    </section>
  `;
}

function renderCoachHistory(history) {
  const entries = (Array.isArray(history) ? history : []).slice(0, 20);
  return `
    <section class="coach-history">
      <div class="coach-history-head">
        <p class="card-kicker">Past reviews</p>
        <span>${entries.length ? `${entries.length} saved` : "None yet"}</span>
      </div>
      ${entries.length ? `<div class="coach-history-list">
        ${entries.map((entry) => {
          const applied = Array.isArray(entry.appliedChangeIds) && entry.appliedChangeIds.length > 0;
          const changes = normalizeCoachChanges(entry.changes);
          const status = applied ? `${entry.appliedChangeIds.length} applied` : changes.length ? `${changes.length} proposed` : "No changes";
          return `
            <button class="coach-history-row" type="button" data-coach-open-review="${escapeHtml(entry.id)}">
              <span>
                <strong>${escapeHtml(formatCoachReviewTime(entry.generatedAt) || "Saved review")}</strong>
                <small>${escapeHtml(getCoachReviewLabel(entry.type))}</small>
              </span>
              <em>${escapeHtml(status)}</em>
            </button>
          `;
        }).join("")}
      </div>` : `<p class="coach-empty">Reviews you run here will stay available, newest first.</p>`}
    </section>
  `;
}

function renderCoachReviewModal(display) {
  if (coachReviewState.status === "loading" && coachModalMode === "loading") {
    return `
      <div class="lw-sheet-scrim coach-modal-scrim" role="presentation" data-coach-close-review>
        <section class="lw-sheet coach-review-sheet" role="dialog" aria-modal="true" aria-label="Coach review loading">
          <div class="lw-sheet-head">
            <div>
              <h3>${escapeHtml(getCoachReviewLabel(coachReviewState.reviewType || coachReviewState.action))}</h3>
              <p>Training Book is waiting on the coach.</p>
            </div>
            <button class="lw-sheet-close" type="button" data-coach-close-review aria-label="Close">&times;</button>
          </div>
          ${renderCoachLoading(coachReviewState.action)}
        </section>
      </div>
    `;
  }
  if (coachModalMode !== "result") return "";
  const review = getActiveCoachReview(display);
  if (!review) return "";
  const changes = normalizeCoachChanges(review.changes);
  return `
    <div class="lw-sheet-scrim coach-modal-scrim" role="presentation" data-coach-close-review>
      <section class="lw-sheet coach-review-sheet" role="dialog" aria-modal="true" aria-label="Coach review result">
        <div class="lw-sheet-head">
          <div>
            <h3>${escapeHtml(getCoachReviewLabel(review.type))}</h3>
            <p>${escapeHtml(formatCoachReviewTime(review.generatedAt) || "Saved review")}</p>
          </div>
          <button class="lw-sheet-close" type="button" data-coach-close-review aria-label="Close">&times;</button>
        </div>
        <div class="coach-output coach-modal-output">${escapeHtml(review.checkin)}</div>
        <div class="coach-modal-actions">
          ${changes.length ? `<button class="primary-button small-button btn-ico" type="button" data-coach-review-changes="${escapeHtml(review.id)}">${getUiIcon("clipboard-list")}Review changes</button>` : ""}
          <button class="quiet-button small-button" type="button" data-coach-close-review>Done</button>
        </div>
      </section>
    </div>
  `;
}

// Turn a raw change type ("swap", "weight", …) into a short human label for the
// review cards. Falls back to empty so the meta line just hides an odd type.
function formatCoachChangeType(type) {
  const labels = {
    add: "Add exercise",
    remove: "Remove exercise",
    swap: "Swap exercise",
    weight: "Weight change",
    target: "Target update",
    note: "Coaching note",
    goal: "Focus goal"
  };
  return labels[String(type || "").toLowerCase()] || "";
}

// The coach-apply wizard is a single modal with three faces: pick the changes,
// confirm them, then a short applied confirmation. It never leaves the Coach
// screen or drops you into the raw Plan importer.
function renderCoachChangeModal() {
  if (!coachChangeReview) return "";
  if (coachChangeStep === "done") return renderCoachApplyDoneModal();
  if (coachChangeStep === "confirm") return renderCoachApplyConfirmModal();
  return renderCoachApplySelectModal();
}

function renderCoachApplySelectModal() {
  const changes = normalizeCoachChanges(coachChangeReview.changes);
  // On first open nothing is remembered, so everything starts checked. Coming
  // back from the confirm step, keep whatever the user had selected.
  const remembered = coachChangeSelection.length ? new Set(coachChangeSelection.map((change) => change.id)) : null;
  return `
    <div class="lw-sheet-scrim coach-modal-scrim" role="presentation" data-coach-close-changes>
      <section class="lw-sheet coach-review-sheet coach-change-sheet" role="dialog" aria-modal="true" aria-label="Choose coach changes">
        <div class="lw-sheet-head">
          <div>
            <p class="card-kicker">Step 1 of 2 · Coach changes</p>
            <h3>Choose plan changes</h3>
            <p>Check the suggestions you want. Nothing is saved until you confirm on the next step.</p>
          </div>
          <button class="lw-sheet-close" type="button" data-coach-close-changes aria-label="Close">&times;</button>
        </div>
        <div class="coach-change-list">
          ${changes.map((change) => `
            <label class="coach-change-item">
              <input type="checkbox" data-coach-change-id="${escapeHtml(change.id)}"${!remembered || remembered.has(change.id) ? " checked" : ""}>
              <span>
                <strong>${escapeHtml(change.summary)}</strong>
                ${change.detail ? `<small>${escapeHtml(change.detail)}</small>` : ""}
                <em>${escapeHtml([formatCoachChangeType(change.type), change.routines.join(", ")].filter(Boolean).join(" · "))}</em>
              </span>
            </label>
          `).join("")}
        </div>
        <div class="coach-modal-actions">
          <button class="quiet-button small-button" type="button" data-coach-close-changes>Cancel</button>
          <button class="primary-button small-button" type="button" data-coach-confirm-changes>Review selected</button>
        </div>
      </section>
    </div>
  `;
}

function renderCoachApplyConfirmModal() {
  const changes = Array.isArray(coachChangeSelection) ? coachChangeSelection : [];
  const count = changes.length;
  return `
    <div class="lw-sheet-scrim coach-modal-scrim" role="presentation" data-coach-close-changes>
      <section class="lw-sheet coach-review-sheet coach-change-sheet" role="dialog" aria-modal="true" aria-label="Confirm coach changes">
        <div class="lw-sheet-head">
          <div>
            <p class="card-kicker">Step 2 of 2 · Coach changes</p>
            <h3>Apply ${count} ${count === 1 ? "change" : "changes"} to your plan?</h3>
            <p>These are saved straight to your active plan and today's workout. Routines you didn't touch stay exactly as they are.</p>
          </div>
          <button class="lw-sheet-close" type="button" data-coach-close-changes aria-label="Close">&times;</button>
        </div>
        <div class="coach-plan-highlight-list coach-apply-review">
          ${changes.map((change) => `
            <article class="coach-plan-highlight">
              <mark>${escapeHtml(change.summary)}</mark>
              ${change.detail ? `<p>${escapeHtml(change.detail)}</p>` : ""}
              <small>${escapeHtml([formatCoachChangeType(change.type), change.routines.join(", ")].filter(Boolean).join(" · "))}</small>
            </article>
          `).join("")}
        </div>
        <div class="coach-modal-actions">
          <button class="quiet-button small-button" type="button" data-coach-back-changes>Back</button>
          <button class="primary-button small-button btn-ico" type="button" data-coach-apply-changes>${getUiIcon("check")}Apply to plan</button>
        </div>
      </section>
    </div>
  `;
}

function renderCoachApplyDoneModal() {
  const count = coachChangeAppliedCount;
  return `
    <div class="lw-sheet-scrim coach-modal-scrim" role="presentation" data-coach-close-changes>
      <section class="lw-sheet coach-review-sheet coach-change-sheet coach-apply-done" role="dialog" aria-modal="true" aria-label="Coach changes applied">
        <div class="coach-apply-done-body">
          <span class="coach-apply-done-icon" aria-hidden="true">${getUiIcon("check")}</span>
          <h3>${count} ${count === 1 ? "change" : "changes"} applied</h3>
          <p>Your active plan and today's workout are updated. Open the Plan tab any time to see or fine-tune the full plan.</p>
        </div>
        <div class="coach-modal-actions">
          <button class="quiet-button small-button" type="button" data-coach-view-plan>View plan</button>
          <button class="primary-button small-button" type="button" data-coach-close-changes>Done</button>
        </div>
      </section>
    </div>
  `;
}

function renderCoach() {
  if (!coachContent) return;
  const button = getCoachButtonState();
  const busy = coachReviewState.status === "loading";
  const display = getCoachDisplayState();
  const status = coachReviewState.message || button.message || renderCoachStatusLine(display);
  coachContent.innerHTML = `
    <section class="coach-status-card ${coachReviewState.status === "error" ? "is-error" : ""}">
      <div>
        <p class="card-kicker">Review status</p>
        <h3>${escapeHtml(status)}</h3>
        <p>Quick is for regular plan adjustments. Deep is for periodic pattern-finding. Manual gives you a no-token prompt for a real chat.</p>
      </div>
      <button class="quiet-button small-button" type="button" data-coach-snooze>Snooze reminder 1 week</button>
    </section>
    <div class="coach-options">
      ${renderCoachOption({
        mode: "quick",
        title: "Quick Check-In",
        kicker: "Default",
        body: "Fast in-app coaching for weekly adjustments without overloading the prompt.",
        primary: "Run Quick",
        meta: "Uses current plan, exercise library, and about 14 days of workouts, notes, skips, effort, and body-weight trend.",
        disabled: button.disabled,
        busy
      })}
      ${renderCoachOption({
        mode: "deep",
        title: "Deep Review",
        kicker: "Periodic",
        body: "A broader read when you want patterns, stalled lifts, repeated skips, and older notes considered.",
        primary: "Run Deep",
        meta: "Uses current plan, exercise library, about 90 days of history, and longer-term summaries.",
        disabled: button.disabled,
        busy
      })}
      ${renderCoachOption({
        mode: "manual",
        title: "Manual Chat Prompt",
        kicker: "No API tokens",
        body: "Copies a full prompt for ChatGPT, Claude, or Codex so the coach can ask follow-up questions before writing a final plan.",
        primary: "",
        meta: "Includes app rules, exercise library, workout history, and exact Training Book import format.",
        disabled: false,
        busy: false
      })}
    </div>
    ${renderCoachHistory(display.history)}
    ${busy ? renderCoachLoading(coachReviewState.action) : ""}
    ${renderCoachResult(display)}
    ${renderCoachReviewModal(display)}
    ${renderCoachChangeModal()}
  `;
}

function saveCoachReviewToData({ type, checkin, generatedAt, packetMeta, changes }) {
  const data = getLocalData();
  const reviewDate = getActiveReviewDate(data);
  const normalizedChanges = normalizeCoachChanges(changes);
  const coach = getCoachMeta(data);
  const entry = {
    id: `coach-${generatedAt}-${type}`,
    generatedAt,
    type,
    checkin,
    changes: normalizedChanges,
    appliedChangeIds: [],
    packetMeta: packetMeta || null
  };
  const history = unionBy([entry], coach.history, (item) => item?.id || JSON.stringify(item)).slice(0, 20);
  data.coach = {
    ...coach,
    lastReviewAt: generatedAt,
    lastReviewType: type,
    lastReviewDueDate: reviewDate,
    lastCheckin: checkin,
    lastCheckinMeta: packetMeta || null,
    lastChanges: normalizedChanges,
    history,
    reminderSnoozedUntil: ""
  };
  commitProgressData(data);
  return entry;
}

function markCoachChangesApplied(reviewId, appliedChangeIds) {
  const ids = Array.isArray(appliedChangeIds) ? appliedChangeIds.map(String) : [];
  if (!ids.length) return;
  const data = getLocalData();
  const coach = getCoachMeta(data);
  const matchesReview = (entry) => entry.id === reviewId || (reviewId === "latest" && entry.generatedAt === coach.lastReviewAt);
  const history = coach.history.map((entry) => matchesReview(entry)
    ? { ...entry, appliedChangeIds: Array.from(new Set([...(entry.appliedChangeIds || []), ...ids])) }
    : entry);
  data.coach = {
    ...coach,
    history
  };
  commitProgressData(data);
}

function openCoachChanges(reviewId) {
  const display = getCoachDisplayState();
  const review = reviewId && reviewId !== "latest" ? getCoachReviewById(reviewId) : getActiveCoachReview(display);
  if (!review || !normalizeCoachChanges(review.changes).length) return;
  coachChangeReview = review;
  coachChangeStep = "select";
  coachChangeSelection = [];
  coachChangeAppliedCount = 0;
  // The wizard is the only modal that should show; dismiss the notes modal so we
  // don't stack sheets (and don't pop it back up when the wizard closes). The
  // notes stay visible inline on the Coach screen behind it.
  coachModalMode = "";
  coachModalReviewId = "";
  renderCoach();
}

function closeCoachChanges() {
  coachChangeReview = null;
  coachChangeStep = "select";
  coachChangeSelection = [];
  coachChangeAppliedCount = 0;
  renderCoach();
}

function backToCoachChangeSelect() {
  coachChangeStep = "select";
  renderCoach();
}

function openCoachReviewModal(reviewId = "") {
  coachModalReviewId = reviewId === "latest" ? "" : reviewId;
  coachModalMode = "result";
  renderCoach();
}

function closeCoachReviewModal() {
  coachModalReviewId = "";
  coachModalMode = "";
  renderCoach();
}

function applyCoachChangesToData(data, changes) {
  const next = structuredClone(data);
  next.routines = Array.isArray(next.routines) ? next.routines : [];
  next.activePlan = next.activePlan && typeof next.activePlan === "object" ? next.activePlan : getStarterActivePlan();
  next.activePlan.focusGoals = Array.isArray(next.activePlan.focusGoals) ? next.activePlan.focusGoals : [];
  const routineMatches = (routine, change) => {
    const names = Array.isArray(change.routines) ? change.routines.map((name) => name.toLowerCase()) : [];
    return !names.length || names.includes(String(routine.name || "").toLowerCase());
  };
  const findExerciseId = (name) => findExerciseIdByName(name) || makeSlug(name);
  const applyTargets = (exercise, change) => {
    if (Number(change.targetWeight) > 0) exercise.targetWeight = Number(change.targetWeight);
    if (Number(change.targetReps) > 0) exercise.targetReps = Number(change.targetReps);
    if (Number(change.targetSets) > 0) exercise.targetSets = Number(change.targetSets);
    if (Number(change.targetDuration) > 0) exercise.targetDuration = Number(change.targetDuration);
    if (change.note) exercise.coachNote = change.note;
  };
  // Focus goals live on the plan, not a routine: add-or-revise by exerciseId
  // (F2 slice supports Bench Press; the array stays ready for the later 1-3
  // goal cap without another migration).
  const applyGoalChange = (change) => {
    const exerciseId = findExerciseId(change.exercise);
    if (!exerciseId) return;
    const goals = next.activePlan.focusGoals;
    const now = new Date().toISOString();
    const index = goals.findIndex((goal) => goal.exerciseId === exerciseId);
    const base = index >= 0 ? goals[index] : { id: `goal-${exerciseId}`, exerciseId, createdAt: now };
    const updated = { ...base, exerciseName: getExerciseById(exerciseId)?.name || change.exercise, updatedAt: now };
    if (Number(change.targetWeight) > 0) updated.targetWeight = Number(change.targetWeight);
    if (Number(change.targetReps) > 0) updated.targetReps = Number(change.targetReps);
    if (Number(change.targetSets) > 0) updated.targetSets = Number(change.targetSets);
    if (change.note) updated.note = change.note;
    if (index >= 0) goals[index] = updated;
    else goals.push(updated);
    if (goals.length > 3) goals.splice(0, goals.length - 3);
  };

  normalizeCoachChanges(changes).forEach((change) => {
    if (change.type === "goal") { applyGoalChange(change); return; }
    next.routines.forEach((routine) => {
      if (!routineMatches(routine, change)) return;
      routine.exercises = Array.isArray(routine.exercises) ? routine.exercises : [];
      const matchIndex = routine.exercises.findIndex((exercise) => {
        const lib = getExerciseById(exercise.exerciseId);
        return String(lib?.name || exercise.exerciseId || "").toLowerCase() === String(change.exercise || "").toLowerCase();
      });

      if (change.type === "remove") {
        if (matchIndex >= 0) routine.exercises.splice(matchIndex, 1);
        return;
      }

      if (change.type === "swap") {
        if (matchIndex >= 0 && change.swapTo) {
          const current = routine.exercises[matchIndex] || {};
          routine.exercises[matchIndex] = { ...current, exerciseId: findExerciseId(change.swapTo) };
        }
        return;
      }

      if (change.type === "add") {
        const exerciseId = findExerciseId(change.exercise || change.swapTo);
        const added = defaultRoutineExercise(exerciseId);
        applyTargets(added, change);
        routine.exercises.push(added);
        return;
      }

      if (matchIndex >= 0) applyTargets(routine.exercises[matchIndex], change);
    });
  });

  normalizeSoccerDurationInData(next);
  return next;
}

// Step 1 -> 2: capture which suggestions are checked and move to the confirm
// face. Nothing is written to the plan yet.
function confirmCoachChanges() {
  if (!coachChangeReview) return;
  const checked = Array.from(coachContent.querySelectorAll("[data-coach-change-id]:checked")).map((box) => box.dataset.coachChangeId);
  const accepted = normalizeCoachChanges(coachChangeReview.changes).filter((change) => checked.includes(change.id));
  if (!accepted.length) {
    closeCoachChanges();
    return;
  }
  coachChangeSelection = accepted;
  coachChangeStep = "confirm";
  renderCoach();
}

// Step 2 -> done: apply the selected coach changes straight to the active plan,
// mark them applied in history, refresh the plan-driven screens, and show the
// applied confirmation. No importer round-trip.
function applyCoachChanges() {
  if (!coachChangeReview || !coachChangeSelection.length) return;
  const nextData = applyCoachChangesToData(getLocalData(), coachChangeSelection);
  commitProgressData(nextData);
  markCoachChangesApplied(coachChangeReview.id, coachChangeSelection.map((change) => change.id));
  coachChangeAppliedCount = coachChangeSelection.length;
  coachChangeSelection = [];
  coachChangeStep = "done";
  renderPlan();
  renderTodayRoutine();
  renderReviewReminder();
  renderCoach();
}

async function requestCoachReview(mode = "quick") {
  if (!_coachReviewCallable) {
    coachReviewState.status = "error";
    coachReviewState.message = "The coach helper is not ready yet. Refresh the app and try again.";
    renderCoach();
    return;
  }

  const reviewMode = mode === "deep" ? "deep" : mode === "plan" ? "plan" : "quick";
  if (reviewMode === "plan") return;
  const display = getCoachDisplayState();
  coachReviewState.status = "loading";
  coachReviewState.action = reviewMode;
  coachReviewState.reviewType = reviewMode;
  coachReviewState.changes = [];
  coachReviewState.message = `${getCoachReviewLabel(reviewMode)} is running.`;
  coachModalMode = "loading";
  coachModalReviewId = "";
  renderCoach();

  try {
    const result = await _coachReviewCallable({
      mode: reviewMode,
      reviewType: display.reviewType || "quick",
      checkin: reviewMode === "plan" ? display.checkin : ""
    });
    const payload = result?.data || {};
    const generatedAt = payload.generatedAt || new Date().toISOString();
    coachReviewState.status = "ready";
    coachReviewState.action = "";
    coachReviewState.generatedAt = generatedAt;
    coachReviewState.packetMeta = payload.packetMeta || null;

    if (!payload.checkin) throw new Error("The coach did not return a check-in.");
    coachReviewState.reviewType = reviewMode;
    coachReviewState.checkin = payload.checkin;
    coachReviewState.changes = normalizeCoachChanges(payload.changes);
    coachReviewState.message = `${getCoachReviewLabel(reviewMode)} ready.`;
    const entry = saveCoachReviewToData({
      type: reviewMode,
      checkin: payload.checkin,
      generatedAt,
      packetMeta: payload.packetMeta || null,
      changes: payload.changes
    });
    coachModalMode = "result";
    coachModalReviewId = entry.id;
    renderReviewReminder();
  } catch (error) {
    coachReviewState.status = "error";
    coachReviewState.action = "";
    coachReviewState.message = error?.message || "The coach helper could not finish. Try again in a minute.";
    coachModalMode = "";
    coachModalReviewId = "";
  }

  renderCoach();
}

async function confirmCoachReviewCost(mode) {
  if (coachSessionCostConfirmed) return true;
  const root = getConfirmModalRoot();
  if (confirmModalResolve) closeConfirmModal(false);
  root.innerHTML = `
    <div class="confirm-scrim" role="presentation" data-action="confirm-cancel">
      <section class="confirm-modal coach-cost-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <p class="card-kicker">Paid review</p>
        <h2 id="confirm-title">${escapeHtml(getCoachReviewLabel(mode))}</h2>
        <p>This sends your recent training to the coach and uses a small amount of paid credit, usually just a few cents.</p>
        <label class="coach-cost-check"><input type="checkbox" id="coach-cost-session"> Don't ask again this session</label>
        <div class="confirm-actions">
          <button class="quiet-button small-button" type="button" data-action="confirm-cancel">Cancel</button>
          <button class="primary-button small-button" type="button" data-action="confirm-ok">Run review</button>
        </div>
      </section>
    </div>
  `;
  let rememberForSession = false;
  root.querySelector("#coach-cost-session")?.addEventListener("change", (event) => {
    rememberForSession = Boolean(event.target.checked);
  });
  return new Promise((resolve) => {
    confirmModalResolve = (result) => {
      if (result && rememberForSession) coachSessionCostConfirmed = true;
      resolve(result);
    };
    root.querySelector("[data-action='confirm-ok']")?.focus();
  });
}

function handleCoachClick(event) {
  const runButton = event.target.closest("[data-coach-run]");
  if (runButton) {
    const mode = runButton.dataset.coachRun;
    confirmCoachReviewCost(mode).then((ok) => {
      if (ok) requestCoachReview(mode);
    });
    return;
  }
  const openReview = event.target.closest("[data-coach-open-review]");
  if (openReview) {
    openCoachReviewModal(openReview.dataset.coachOpenReview);
    return;
  }
  const reviewChanges = event.target.closest("[data-coach-review-changes]");
  if (reviewChanges) {
    openCoachChanges(reviewChanges.dataset.coachReviewChanges);
    return;
  }
  if (event.target.closest("[data-coach-confirm-changes]")) {
    confirmCoachChanges();
    return;
  }
  if (event.target.closest("[data-coach-back-changes]")) {
    backToCoachChangeSelect();
    return;
  }
  if (event.target.closest("[data-coach-apply-changes]")) {
    applyCoachChanges();
    return;
  }
  if (event.target.closest("[data-coach-view-plan]")) {
    closeCoachChanges();
    showScreen("plan", true);
    return;
  }
  if (event.target.closest("[data-coach-close-review]")) {
    if (!event.target.closest(".coach-review-sheet") || event.target.closest("button")) closeCoachReviewModal();
    return;
  }
  if (event.target.hasAttribute("data-coach-close-changes") || event.target.closest("button[data-coach-close-changes]")) {
    closeCoachChanges();
    return;
  }
  if (event.target.closest("[data-coach-copy]")) {
    copyReviewPacket();
    return;
  }
  if (event.target.closest("[data-coach-save]")) {
    saveReviewPacket();
    return;
  }
  if (event.target.closest("[data-coach-snooze]")) {
    snoozeCoachReminder(7);
  }
}

function renderProgress(resetMonth = true) {
  if (!progressContent) return;

  const data = getLocalData();
  const completedSet = getCompletedDaySet(data);
  const target = getWeeklyTarget();

  if (resetMonth || !progressMonthDate) {
    const now = new Date();
    progressMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    weightBoxOpen = null;
  }

  const doneThisWeek = countCompletedInWeek(mondayOfWeek(new Date()), completedSet);
  const streak = computeWeekStreak(target, completedSet);

  progressContent.innerHTML = `
    ${renderWeeklyMuscleHeatMapCard(doneThisWeek, target)}
    ${renderProgressHero(data, streak, completedSet)}
    ${renderFocusGoalCard()}
    ${renderBodyWeightCard(data)}
    ${renderStrengthProgressCard()}
    ${renderCardioProgressCard()}
    ${renderPersonalRecords()}
    ${renderEffortCard()}
    ${renderConsistencyStrip(target, completedSet)}
    ${renderProgressCalendar(completedSet)}
  `;

  progressContent.querySelectorAll("[data-cal-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(button.dataset.calStep) || 0;
      progressMonthDate = new Date(Date.UTC(
        progressMonthDate.getUTCFullYear(),
        progressMonthDate.getUTCMonth() + step,
        1
      ));
      renderProgress(false);
    });
  });

  const strengthSelect = progressContent.querySelector("#strength-exercise-select");
  if (strengthSelect) {
    strengthSelect.addEventListener("change", () => {
      strengthExerciseId = strengthSelect.value;
      renderProgress(false);
    });
  }

  progressContent.querySelectorAll('[data-action="edit-goal"]').forEach((button) => {
    button.addEventListener("click", () => openGoalEditor(button.dataset.id));
  });

  wireBodyWeightCard();
}

// ===== Body weight (Step 9): log your weight over time + an optional target =====

function getBodyWeights() {
  const data = getLocalData();
  const list = Array.isArray(data.bodyWeights) ? data.bodyWeights.slice() : [];
  // Keep them oldest-to-newest by date so "latest" and "previous" are reliable.
  return list.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function saveBodyWeight(weight) {
  const value = Number(weight);
  if (!Number.isFinite(value) || value <= 0) return;
  const data = getLocalData();
  const today = getTodayDateString();
  const list = Array.isArray(data.bodyWeights) ? data.bodyWeights.slice() : [];
  // One entry per day: replace today's if it already exists.
  const existing = list.findIndex((w) => w.date === today);
  const rounded = Math.round(value * 10) / 10;
  if (existing >= 0) {
    list[existing] = { date: today, weight: rounded };
  } else {
    list.push({ date: today, weight: rounded });
  }
  data.bodyWeights = list;
  commitProgressData(data);
}

function saveWeightTarget(target) {
  const data = getLocalData();
  if (target === null) {
    data.weightTarget = null;
  } else {
    const value = Number(target);
    if (!Number.isFinite(value) || value <= 0) return;
    data.weightTarget = Math.round(value * 10) / 10;
  }
  commitProgressData(data);
}

// Save through the same local + cloud path the rest of the app uses.
function commitProgressData(data) {
  // Keep the derived completed-days list in step with the actual workouts, so
  // deleting or re-dating a workout can't leave a phantom "done" day behind.
  reconcileCompletedWorkouts(data);
  normalizeSoccerDurationInData(data);
  data.updatedAt = new Date().toISOString();
  data.updatedBy = getDeviceId();
  saveLocalData(data);
  markPendingData(data);
  if (navigator.onLine) {
    uploadWorkoutData(data).then(clearPendingData).catch(() => {
      // Not signed in or offline: the change is queued and syncs later.
    });
  }
}

function formatWeightDateLabel(dateKey) {
  if (dateKey === getTodayDateString()) return "Logged today";
  const parts = String(dateKey).split("-");
  if (parts.length !== 3) return "Last logged";
  const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  return "Last logged " + d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

function renderBodyWeightCard(data) {
  const weights = getBodyWeights();
  const latest = weights[weights.length - 1] || null;
  const previous = weights[weights.length - 2] || null;
  const target = (typeof data.weightTarget === "number") ? data.weightTarget : null;

  // Header changes its button label depending on whether the log box is open.
  const head = `
    <div class="weight-head">
      <p class="card-kicker">Body weight</p>
      <button class="quiet-button weight-mini" type="button" data-weight-open="log">${weightBoxOpen === "log" ? "Close" : (latest ? "Log weight" : "Log first")}</button>
    </div>`;

  // The big number (or a gentle empty state).
  let body;
  if (latest) {
    let trend = previous
      ? (() => {
          const diff = Math.round((latest.weight - previous.weight) * 10) / 10;
          if (diff === 0) return "No change since last time";
          const arrow = diff < 0 ? "▼" : "▲";
          return `${arrow} ${Math.abs(diff)} lb since last time`;
        })()
      : "First weigh-in";
    body = `
      <p class="stat-number">${latest.weight}<span class="stat-of"> lb</span></p>
      <p class="stat-note">${escapeHtml(formatWeightDateLabel(latest.date))} · ${escapeHtml(trend)}</p>`;
  } else {
    body = `<p class="stat-note weight-empty">No weight logged yet. Tap “Log first” to start.</p>`;
  }

  // The trend chart: a real line over time with the target drawn in, plus a
  // 30 / 90 / all-day range toggle. Needs at least two weigh-ins to draw.
  let chart = "";
  if (weights.length >= 2) {
    const series = getWeightSeries(weightRange);
    const points = series.map((w) => ({ x: dayNumberFromKey(w.date), y: w.weight }));
    const svg = buildLineChart(points, { target, ariaLabel: "Body-weight trend" });
    chart = `
      <div class="weight-chart">
        ${svg || `<p class="prog-empty weight-chart-empty">No entries in this range — try “All”.</p>`}
      </div>
      <div class="range-toggle" role="group" aria-label="Chart range">
        <button class="range-btn${weightRange === "30" ? " is-active" : ""}" type="button" data-weight-range="30">30d</button>
        <button class="range-btn${weightRange === "90" ? " is-active" : ""}" type="button" data-weight-range="90">90d</button>
        <button class="range-btn${weightRange === "all" ? " is-active" : ""}" type="button" data-weight-range="all">All</button>
      </div>`;
  }

  // The inline log box.
  let logBox = "";
  if (weightBoxOpen === "log") {
    const prefill = latest ? escapeHtml(latest.weight) : "";
    logBox = `
      <div class="weight-form">
        <input class="weight-input" id="weight-log-input" type="number" inputmode="decimal" min="0" step="0.1" value="${prefill}" placeholder="e.g. 180" aria-label="Today's weight in pounds">
        <span class="weight-unit">lb</span>
        <button class="primary-button weight-mini" type="button" data-weight-save>Save</button>
      </div>`;
  }

  // The target line, and its inline box when open.
  let targetArea;
  if (weightBoxOpen === "target") {
    const prefill = target !== null ? escapeHtml(target) : "";
    targetArea = `
      <div class="weight-form">
        <input class="weight-input" id="weight-target-input" type="number" inputmode="decimal" min="0" step="0.1" value="${prefill}" placeholder="e.g. 175" aria-label="Target weight in pounds">
        <span class="weight-unit">lb</span>
        <button class="primary-button weight-mini" type="button" data-target-save>Save</button>
        ${target !== null ? `<button class="quiet-button weight-mini" type="button" data-target-clear>Remove</button>` : ""}
      </div>`;
  } else if (target !== null && latest) {
    const diff = Math.round((latest.weight - target) * 10) / 10;
    let note;
    if (diff === 0) note = "Target reached!";
    else if (diff > 0) note = `${Math.abs(diff)} lb above target`;
    else note = `${Math.abs(diff)} lb below target`;
    targetArea = `
      <p class="weight-target">Target ${target} lb · <strong>${escapeHtml(note)}</strong>
        <button class="weight-link" type="button" data-weight-open="target">Edit</button></p>`;
  } else if (target !== null) {
    targetArea = `
      <p class="weight-target">Target ${target} lb
        <button class="weight-link" type="button" data-weight-open="target">Edit</button></p>`;
  } else {
    targetArea = `
      <p class="weight-target"><button class="weight-link" type="button" data-weight-open="target">Set a target</button></p>`;
  }

  return `
    <div class="weight-card">
      ${head}
      ${body}
      ${chart}
      ${logBox}
      ${targetArea}
    </div>`;
}

function wireBodyWeightCard() {
  if (!progressContent) return;

  progressContent.querySelectorAll("[data-weight-range]").forEach((button) => {
    button.addEventListener("click", () => {
      weightRange = button.dataset.weightRange;
      renderProgress(false);
    });
  });

  progressContent.querySelectorAll("[data-weight-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const which = button.dataset.weightOpen;
      weightBoxOpen = (weightBoxOpen === which) ? null : which;
      renderProgress(false);
      const focusId = which === "target" ? "weight-target-input" : "weight-log-input";
      const input = document.getElementById(focusId);
      if (input && weightBoxOpen === which) input.focus();
    });
  });

  const saveBtn = progressContent.querySelector("[data-weight-save]");
  if (saveBtn) {
    const input = progressContent.querySelector("#weight-log-input");
    const commit = () => {
      const value = Number(input && input.value);
      if (!Number.isFinite(value) || value <= 0) return;
      saveBodyWeight(value);
      weightBoxOpen = null;
      renderProgress(false);
    };
    saveBtn.addEventListener("click", commit);
    if (input) input.addEventListener("keydown", (e) => { if (e.key === "Enter") commit(); });
  }

  const targetSaveBtn = progressContent.querySelector("[data-target-save]");
  if (targetSaveBtn) {
    const input = progressContent.querySelector("#weight-target-input");
    const commit = () => {
      const value = Number(input && input.value);
      if (!Number.isFinite(value) || value <= 0) return;
      saveWeightTarget(value);
      weightBoxOpen = null;
      renderProgress(false);
    };
    targetSaveBtn.addEventListener("click", commit);
    if (input) input.addEventListener("keydown", (e) => { if (e.key === "Enter") commit(); });
  }

  const targetClearBtn = progressContent.querySelector("[data-target-clear]");
  if (targetClearBtn) {
    targetClearBtn.addEventListener("click", () => {
      saveWeightTarget(null);
      weightBoxOpen = null;
      renderProgress(false);
    });
  }
}

function renderHistoryEntry(entry) {
  const difficulty = entry.difficulty ? `Difficulty ${entry.difficulty}/10` : "Difficulty not logged";
  return `
    <li>
      <span>${escapeHtml(entry.exerciseName || "Exercise")}</span>
      <span>${escapeHtml(formatEntryDetails(entry))}</span>
      <strong>${escapeHtml(difficulty)}</strong>
    </li>
  `;
}

function renderHistory() {
  if (!historyContent) return;

  const data = getLocalData();
  // Order by the logged DATE (newest first), not insertion order - after cloud
  // merges the stored array order isn't chronological. "YYYY-MM-DD" sorts as a
  // plain string. Same-day workouts fall back to most-recently-saved first.
  const workouts = (Array.isArray(data.workouts) ? data.workouts.slice() : []).sort((a, b) => {
    const ad = String(a?.date || ""), bd = String(b?.date || "");
    if (ad !== bd) return bd.localeCompare(ad);
    return String(b?.savedAt || b?.startedAt || b?.id || "").localeCompare(String(a?.savedAt || a?.startedAt || a?.id || ""));
  });

  if (workouts.length === 0) {
    historyContent.innerHTML = `<p class="empty-state">Past workouts will show here as you log.</p>`;
    return;
  }

  historyContent.innerHTML = `
    <div class="history-tools">
      <button class="quiet-button small-button btn-ico danger-text" type="button" data-action="clear-history">${getUiIcon("trash-2")}Clear history</button>
    </div>
    <div class="history-list">
      ${workouts.map((workout) => {
        const entries = Array.isArray(workout.entries) ? workout.entries : [];
        const countLabel = entries.length === 1 ? "1 exercise" : `${entries.length} exercises`;
        return `
          <article class="history-card" data-workout-id="${escapeHtml(workout.id)}">
            <button class="history-card-button" type="button">
              <div class="history-card-head">
                <div>
                  <p class="eyebrow">${escapeHtml(formatWorkoutDate(workout.date))}</p>
                  <h3>${escapeHtml(workout.name || workout.routineName || "Workout")}</h3>
                </div>
                <span>${escapeHtml(countLabel)}</span>
              </div>
              <ul class="history-entry-list">
                ${entries.map(renderHistoryEntry).join("")}
              </ul>
            </button>
            <button class="history-delete btn-ico" type="button" data-action="delete-history-workout" data-id="${escapeHtml(workout.id)}" aria-label="Delete ${escapeHtml(workout.name || workout.routineName || "workout")}">${getUiIcon("trash-2")}</button>
          </article>
        `;
      }).join("")}
    </div>
  `;

  renderUiIcons();
}

// The workout currently open in the full-screen History editor. We edit a
// working COPY here and only write it back to saved data on "Save changes", so
// nothing touches Daniel's real history until he commits — and "Back" can warn
// about unsaved edits. null when the editor is closed.
let historyEdit = null;

function openHistoryDetail(workoutId) {
  const data = getLocalData();
  const workout = data.workouts?.find((w) => w.id === workoutId);
  if (!workout) return;

  const working = JSON.parse(JSON.stringify(workout));
  hydrateHistoryEntries(working);
  historyEdit = {
    workoutId,
    workout: working,
    // Open on a clean read-only summary; the user taps "Edit workout" to turn on
    // the input fields. This gives History an obvious Edit affordance instead of
    // always-on nested inputs.
    mode: "view",
    dirty: false,
    effortOpenKey: null,
    // Which set row has its optional effort + note panel expanded (one at a time),
    // so a set stays a single scannable line until you ask for the extras.
    setMoreKey: null,
    addOpen: false,
    addQuery: ""
  };

  const detailPanel = document.querySelector("#history-detail-panel");
  if (!detailPanel) return;
  detailPanel.hidden = false;
  document.body.classList.add("history-detail-open");
  renderHistoryDetail();
  window.scrollTo(0, 0);
}

// Older saved entries (from before per-set logging) may carry only the coarse
// actualSummary and no per-set sets[]/holds[]. Synthesise rows from the summary
// so they show in the per-set editor and their numbers are never lost on save.
// Never touches entries that already have a real per-set log.
function hydrateHistoryEntries(workout) {
  (workout.entries || []).forEach((entry) => {
    if (entry.skipped) return;
    // Carry an old exercise-level effort onto the synthesised rows so re-saving
    // (which rolls effort up from the per-set log) never drops it.
    const effort = Number(entry.difficulty) > 0 ? Number(entry.difficulty) : null;
    if (entry.type === "strength" && (!Array.isArray(entry.sets) || entry.sets.length === 0)) {
      const n = Number(entry.actualSummary?.sets) || 0;
      const reps = Number(entry.actualSummary?.reps) || 0;
      const weight = Number(entry.actualSummary?.weight) || 0;
      entry.sets = Array.from({ length: n }, () => ({ reps, weight, done: true, ...(effort ? { difficulty: effort } : {}) }));
    } else if (entry.type === "timed" && (!Array.isArray(entry.holds) || entry.holds.length === 0)) {
      const n = Number(entry.actualSummary?.sets) || 0;
      const seconds = Number(entry.actualSummary?.seconds) || 0;
      entry.holds = Array.from({ length: n }, () => ({ seconds, done: true, ...(effort ? { difficulty: effort } : {}) }));
    }
  });
}

async function closeHistoryDetail(force) {
  if (!force && historyEdit?.dirty) {
    const ok = await showConfirmModal({
      title: "Discard changes?",
      message: "You have unsaved edits to this workout. Close without saving them?",
      confirmLabel: "Discard changes"
    });
    if (!ok) return;
  }
  const detailPanel = document.querySelector("#history-detail-panel");
  if (detailPanel) detailPanel.hidden = true;
  document.body.classList.remove("history-detail-open");
  historyEdit = null;
}

async function deleteHistoryWorkout(workoutId) {
  const data = getLocalData();
  const workout = data.workouts?.find((item) => item.id === workoutId);
  if (!workout) return;
  const ok = await showConfirmModal({
    title: `Delete ${workout.name || workout.routineName || "workout"}?`,
    message: "This removes the saved workout from History. Your routines and library stay unchanged.",
    confirmLabel: "Delete workout"
  });
  if (!ok) return;
  data.workouts = (data.workouts || []).filter((item) => item.id !== workoutId);
  commitProgressData(data);
  closeHistoryDetail(true);
  renderHistory();
}

async function clearWorkoutHistory() {
  const data = getLocalData();
  const count = Array.isArray(data.workouts) ? data.workouts.length : 0;
  if (!count) return;
  const ok = await showConfirmModal({
    title: "Clear all history?",
    message: `This deletes ${count} saved workout${count === 1 ? "" : "s"} from History. Routines, plans, and library exercises are not affected.`,
    confirmLabel: "Clear history"
  });
  if (!ok) return;
  data.workouts = [];
  data.completedWorkouts = [];
  commitProgressData(data);
  closeHistoryDetail(true);
  renderHistory();
}

function handleHistoryClick(event) {
  const actionButton = event.target.closest("[data-action]");
  if (actionButton?.dataset.action === "clear-history") {
    clearWorkoutHistory();
    return;
  }
  if (actionButton?.dataset.action === "delete-history-workout") {
    deleteHistoryWorkout(actionButton.dataset.id);
    return;
  }
  const button = event.target.closest(".history-card-button");
  if (!button) return;
  const card = button.closest(".history-card");
  const workoutId = card?.dataset.workoutId;
  if (workoutId) openHistoryDetail(workoutId);
}

function renderHistoryDetail() {
  if (!historyEdit) return;
  const workout = historyEdit.workout;
  const detailBody = document.querySelector("#history-detail-body");
  const detailFoot = document.querySelector("#history-detail-foot");
  const detailTitle = document.querySelector("#history-detail-title");
  const entries = Array.isArray(workout.entries) ? workout.entries : [];
  const editing = historyEdit.mode === "edit";
  const name = workout.name || workout.routineName || "Workout";

  if (detailTitle) {
    detailTitle.textContent = editing ? `Editing · ${name}` : `${name} · ${formatWorkoutDate(workout.date)}`;
  }

  // The add-exercise page takes over the body entirely (edit mode only).
  if (historyEdit.addOpen) {
    if (detailBody) detailBody.innerHTML = renderHistoryAddView();
    if (detailFoot) detailFoot.innerHTML = "";
    renderUiIcons();
    return;
  }

  if (detailBody) {
    detailBody.innerHTML = editing
      ? renderHistoryEditBody(workout, entries)
      : renderHistoryViewBody(workout, entries);
  }

  if (detailFoot) {
    detailFoot.innerHTML = editing
      ? `<button class="primary-button" type="button" data-haction="save">Save changes</button>`
      : `<div class="hist-view-actions">
          <button class="primary-button btn-ico" type="button" data-haction="edit">${getUiIcon("pencil")}Edit workout</button>
          <button class="quiet-button btn-ico danger-text" type="button" data-haction="delete-workout">${getUiIcon("trash-2")}Delete</button>
        </div>`;
  }

  renderUiIcons();
}

// Editable body: the workout date plus one input-driven card per exercise.
function renderHistoryEditBody(workout, entries) {
  return `
    <div class="detail-section">
      <div class="detail-field">
        <label for="detail-workout-date">Date</label>
        <input id="detail-workout-date" type="date" value="${escapeHtml(workout.date)}" data-hfield="date">
      </div>
    </div>

    <div class="detail-section">
      <h4 class="section-label">Exercises</h4>
      <div id="detail-exercises-list">
        ${entries.length
          ? entries.map((entry, index) => renderDetailExercise(entry, index)).join("")
          : `<p class="empty-state">No exercises in this workout. Add one below.</p>`}
      </div>
      <button class="quiet-button btn-ico add-exercise-button" type="button" data-haction="add-exercise">${getUiIcon("plus")}Add exercise</button>
    </div>
  `;
}

// Read-only summary: a clean, scannable recap so review needs no input fields.
function renderHistoryViewBody(workout, entries) {
  const count = entries.length;
  const sessionNote = (workout.substitutionNote || "").trim();
  return `
    <div class="detail-section">
      <p class="hist-view-meta">${escapeHtml(formatWorkoutDate(workout.date))} · ${count} exercise${count === 1 ? "" : "s"}</p>
      ${sessionNote ? `<p class="hist-view-session-note">${getUiIcon("notebook-pen")}${escapeHtml(sessionNote)}</p>` : ""}
    </div>
    <div class="detail-section">
      ${count
        ? entries.map((entry, index) => renderDetailExerciseView(entry, index)).join("")
        : `<p class="empty-state">No exercises logged in this workout.</p>`}
    </div>
  `;
}

// A single exercise in the read-only view: name, planned target, and a flat
// one-line-per-set recap. Effort and notes show only when they were logged.
function renderDetailExerciseView(entry, index) {
  const head = `<div class="detail-exercise-head"><h5>${escapeHtml(entry.exerciseName || "Exercise")}</h5></div>`;

  if (entry.skipped) {
    return `<div class="detail-exercise detail-exercise-view">${head}<p class="empty-state">Skipped in this workout.</p></div>`;
  }

  const effortBadge = (val) => Number(val) > 0 ? `<span class="hist-view-effort">${Number(val)}/10</span>` : "";
  const noteLine = (note) => (note || "").trim() ? `<p class="hist-view-note">${escapeHtml(note.trim())}</p>` : "";

  if (entry.type === "cardio" || entry.type === "sport") {
    const parts = [`${Number(entry.durationMinutes) || 0} min`];
    if (entry.type === "cardio") {
      const subtype = entry.subtype || entry.planned?.subtype;
      if (subtype) parts.unshift(escapeHtml(subtype));
      const stats = formatCardioStats(entry.stats).replace(/^ · /, "");
      if (stats) parts.push(escapeHtml(stats));
    }
    return `
      <div class="detail-exercise detail-exercise-view">
        ${head}
        <div class="hist-view-set"><span class="hist-view-val">${parts.join(" · ")}</span>${effortBadge(entry.difficulty)}</div>
        ${noteLine(entry.notes)}
      </div>`;
  }

  const isTimed = entry.type === "timed";
  const units = isTimed
    ? (Array.isArray(entry.holds) ? entry.holds : [])
    : (Array.isArray(entry.sets) ? entry.sets : []);
  const showWeight = entry.metricProfile !== "strength-bodyweight";
  const entryWeightUnit = weightUnitLabel(entry);
  const planned = isTimed
    ? (entry.planned?.sets ? `${entry.planned.sets} × ${entry.planned.seconds || 0} sec` : "")
    : (entry.planned?.sets ? `${entry.planned.sets}×${entry.planned.reps || 0}${Number(entry.planned.weight) > 0 ? ` @ ${entry.planned.weight} ${entryWeightUnit}` : ""}` : "");

  const rows = units.map((unit, i) => {
    const label = isTimed ? `Hold ${i + 1}` : `Set ${i + 1}`;
    const val = isTimed
      ? `${Number(unit.seconds) || 0}s`
      : (showWeight
          ? `${Number(unit.reps) || 0} × ${Number(unit.weight) || 0} ${entryWeightUnit}`
          : `${Number(unit.reps) || 0} reps`);
    return `
      <div class="hist-view-set">
        <span class="hist-set-num">${label}</span>
        <span class="hist-view-val">${val}</span>
        ${effortBadge(unit.difficulty)}
        ${(unit.notes || "").trim() ? `<span class="hist-view-setnote">${escapeHtml(unit.notes.trim())}</span>` : ""}
      </div>`;
  }).join("");

  return `
    <div class="detail-exercise detail-exercise-view">
      ${head}
      ${planned ? `<p class="hist-planned-line">Planned ${escapeHtml(planned)}</p>` : ""}
      <div class="hist-view-sets">${rows || `<p class="empty-state">No ${isTimed ? "holds" : "sets"} logged.</p>`}</div>
      ${noteLine(entry.notes)}
    </div>`;
}

// A full in-editor "page" for adding an exercise (NOT a floating popup). The
// search box is an ordinary in-flow input in the editor body. The previous
// floating-sheet version froze the keyboard on iPhone (iOS won't reliably focus
// an <input> inside a position:fixed overlay here), but in-flow inputs — like
// the reps/weight/notes fields — focus fine.
function renderHistoryAddView() {
  // Plain text input in a .detail-field, identical in shape to the editor's
  // reps/weight/notes fields (which focus fine on iPhone). The previous
  // type="search" box wrapped in .library-search would not open the keyboard
  // on the installed iOS app.
  return `
    <div class="detail-section hist-add-view">
      <button class="quiet-button small-button btn-ico hist-add-back" type="button" data-haction="close-add">${getUiIcon("arrow-left")}Back to workout</button>
      <div class="detail-field">
        <label for="history-add-search">Add an exercise</label>
        <input type="text" id="history-add-search" value="${escapeHtml(historyEdit.addQuery)}" placeholder="Search exercises by name" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" inputmode="search" aria-label="Search exercises" data-hfield="add-search">
      </div>
      <div class="hist-add-results" id="history-add-results">
        ${renderHistoryAddResults()}
      </div>
    </div>
  `;
}

// A clean, compact result list: one row per exercise (small icon + name + type).
// Deliberately NOT renderExerciseArt — that nests <button>s (How-to, favourite)
// inside the result <button>, which is invalid HTML; the browser reshuffles it
// and a stray "How to" button ends up floating over the search box, swallowing
// taps (which is why the keyboard never opened).
function renderHistoryAddResults() {
  const query = (historyEdit?.addQuery || "").trim().toLowerCase();
  const matches = exercises
    .filter((exercise) => {
      if (!query) return true;
      return `${exercise.name} ${exercise.area || ""} ${(exercise.tags || []).join(" ")}`.toLowerCase().includes(query);
    })
    .slice(0, 30);
  if (!matches.length) return `<p class="empty-state">No matching exercises.</p>`;
  return matches.map((exercise) => {
    const photo = getExerciseStartImage(exercise);
    const icon = photo
      ? `<span class="hist-add-result-icon" style="background-image:url('${escapeHtml(photo)}')"></span>`
      : `<span class="hist-add-result-icon">${getExerciseIcon(exercise.icon)}</span>`;
    const sub = `${formatExerciseType(exercise.type || "strength")}${exercise.area ? ` · ${exercise.area}` : ""}`;
    return `
      <button class="hist-add-result" type="button" data-haction="pick-exercise" data-id="${escapeHtml(exercise.id)}">
        ${icon}
        <span class="hist-add-result-text"><strong>${escapeHtml(exercise.name)}</strong><small>${escapeHtml(sub)}</small></span>
      </button>
    `;
  }).join("");
}

// A per-set / per-hold (or, with setIndex -1, per-exercise) effort control that
// reuses the live-workout 1-10 chip styling. Collapsed to a small red toggle;
// tapping opens the chips; tapping the active chip again clears it. No rating =
// "not logged" (we never fabricate a number).
function renderHistoryEffort(entryIndex, setIndex, value) {
  const num = Number(value);
  const val = Number.isFinite(num) && num > 0 ? num : null;
  const open = historyEdit?.effortOpenKey === `${entryIndex}:${setIndex}`;
  const chips = open
    ? `<div class="lw-effort-row" role="group" aria-label="Effort, 1 easy to 10 all-out">
        ${Array.from({ length: 10 }, (_, k) => {
          const v = k + 1;
          return `<button type="button" class="lw-effort-chip${v === val ? " is-active" : ""}" data-haction="set-effort" data-entry-index="${entryIndex}" data-set-index="${setIndex}" data-value="${v}" aria-pressed="${v === val}" aria-label="Effort ${v} of 10">${v}</button>`;
        }).join("")}
      </div>`
    : "";
  return `
    <div class="lw-effort hist-effort${val ? " has-val" : ""}">
      <button type="button" class="lw-effort-toggle${val ? " has-val" : ""}" data-haction="toggle-effort" data-entry-index="${entryIndex}" data-set-index="${setIndex}" aria-expanded="${open}">
        <span class="lw-effort-dot" aria-hidden="true"></span>${val ? `Effort ${val}/10` : "Rate effort (optional)"}
      </button>
      ${chips}
    </div>`;
}

// The compact per-set "…" button. Effort + note are the optional extras, so they
// stay tucked away to keep each set a single scannable line; the button lights up
// (is-active) when a set already carries an effort rating or a note, so nothing
// logged is ever hidden without a hint. `unit` is the set or hold object.
function renderSetMoreToggle(entryIndex, setIndex, unit) {
  const open = historyEdit?.setMoreKey === `${entryIndex}:${setIndex}`;
  const hasExtra = Number(unit?.difficulty) > 0 || Boolean((unit?.notes || "").trim());
  return `<button type="button" class="hist-set-more btn-ico${hasExtra ? " is-active" : ""}${open ? " is-open" : ""}" data-haction="toggle-more" data-entry-index="${entryIndex}" data-set-index="${setIndex}" aria-expanded="${open}" aria-label="Effort and note for set ${setIndex + 1}">${getUiIcon("more-horizontal")}</button>`;
}

// The expandable panel under a set row holding the optional effort rating and a
// note field. Only rendered when that row's "…" toggle is open, so collapsed
// rows are a single clean line.
function renderSetExtra(entryIndex, setIndex, unit, notePlaceholder) {
  if (historyEdit?.setMoreKey !== `${entryIndex}:${setIndex}`) return "";
  return `
    <div class="hist-set-extra">
      ${renderHistoryEffort(entryIndex, setIndex, unit?.difficulty)}
      <input type="text" class="hist-set-note" data-hfield="setnote" value="${escapeHtml(unit?.notes || "")}" placeholder="${escapeHtml(notePlaceholder)}">
    </div>`;
}

async function removeHistoryEntry(entryIndex) {
  if (!historyEdit) return;
  const entry = historyEdit.workout.entries?.[entryIndex];
  if (!entry) return;
  const ok = await showConfirmModal({
    title: `Remove ${entry.exerciseName || "exercise"}?`,
    message: "This removes the exercise from this workout when you save your changes.",
    confirmLabel: "Remove exercise"
  });
  if (!ok) return;
  historyEdit.workout.entries.splice(entryIndex, 1);
  historyEdit.dirty = true;
  renderHistoryDetail();
}

// Append a new exercise to the workout being edited, in the exact saved shape
// for its type. Strength/held moves start with one editable row; cardio/sport
// start blank. Nothing is written until "Save changes".
function appendHistoryEntry(exerciseId) {
  if (!historyEdit) return;
  const lib = getExerciseById(exerciseId);
  if (!lib) return;
  const type = lib.type || "strength";
  const flowMode = historyEdit.workout.flowMode || "linear";
  const base = {
    id: `added-${Date.now()}-${randomString(4)}`,
    type,
    exerciseId,
    exerciseName: lib.name,
    flowMode
  };
  if (type === "cardio") {
    const subtype = defaultExerciseSubtype(exerciseId) || "";
    Object.assign(base, { planned: { durationMinutes: 0, subtype }, subtype, durationMinutes: 0, done: true, stats: {}, notes: "" });
  } else if (type === "sport") {
    Object.assign(base, { planned: { durationMinutes: 0 }, durationMinutes: 0, done: true, notes: "" });
  } else if (type === "timed") {
    Object.assign(base, { planned: { sets: 0, seconds: 0 }, actualSummary: { sets: 0, seconds: 0 }, holds: [{ seconds: 30, done: true }], notes: "" });
  } else {
    Object.assign(base, { planned: { sets: 0, reps: 0, weight: 0 }, actualSummary: { sets: 0, reps: 0, weight: 0 }, sets: [{ reps: 0, weight: 0, done: true }], notes: "", metricProfile: getMetricProfile(lib, {}) });
  }
  historyEdit.workout.entries = Array.isArray(historyEdit.workout.entries) ? historyEdit.workout.entries : [];
  historyEdit.workout.entries.push(base);
  historyEdit.addOpen = false;
  historyEdit.addQuery = "";
  historyEdit.dirty = true;
  renderHistoryDetail();
}

function setHistoryStat(entry, key, value) {
  entry.stats = entry.stats || {};
  entry.stats[key] = Number(value) || 0;
}

// All button taps inside the History editor (delegated from the panel).
function handleHistoryDetailClick(event) {
  if (!historyEdit) return;

  const btn = event.target.closest("[data-haction]");
  if (!btn) return;
  const action = btn.dataset.haction;
  const entryIndex = btn.dataset.entryIndex != null ? Number(btn.dataset.entryIndex) : null;

  if (action === "save") { saveWorkoutChanges(); return; }

  if (action === "edit") {
    historyEdit.mode = "edit";
    historyEdit.setMoreKey = null;
    renderHistoryDetail();
    window.scrollTo(0, 0);
    return;
  }

  if (action === "delete-workout") { deleteHistoryWorkout(historyEdit.workoutId); return; }

  if (action === "toggle-more") {
    const key = `${btn.dataset.entryIndex}:${btn.dataset.setIndex}`;
    historyEdit.setMoreKey = historyEdit.setMoreKey === key ? null : key;
    historyEdit.effortOpenKey = null;
    renderHistoryDetail();
    return;
  }

  if (action === "add-exercise") {
    historyEdit.addOpen = true;
    historyEdit.addQuery = "";
    renderHistoryDetail();
    window.scrollTo(0, 0);
    return;
  }

  if (action === "close-add") {
    historyEdit.addOpen = false;
    renderHistoryDetail();
    window.scrollTo(0, 0);
    return;
  }

  if (action === "pick-exercise") { appendHistoryEntry(btn.dataset.id); return; }

  if (action === "remove-entry") { removeHistoryEntry(entryIndex); return; }

  if (action === "add-set") {
    const entry = historyEdit.workout.entries?.[entryIndex];
    if (!entry) return;
    if (entry.type === "timed") {
      entry.holds = Array.isArray(entry.holds) ? entry.holds : [];
      const last = entry.holds[entry.holds.length - 1];
      entry.holds.push({ seconds: last ? Number(last.seconds) || 0 : 30, done: true });
    } else {
      entry.sets = Array.isArray(entry.sets) ? entry.sets : [];
      const last = entry.sets[entry.sets.length - 1];
      entry.sets.push({ reps: last ? Number(last.reps) || 0 : 0, weight: last ? Number(last.weight) || 0 : 0, done: true });
    }
    historyEdit.dirty = true;
    renderHistoryDetail();
    return;
  }

  if (action === "remove-set") {
    const entry = historyEdit.workout.entries?.[entryIndex];
    const si = Number(btn.dataset.setIndex);
    const arr = entry?.type === "timed" ? entry.holds : entry?.sets;
    if (Array.isArray(arr) && arr.length) {
      arr.splice(si, 1);
      historyEdit.dirty = true;
      renderHistoryDetail();
    }
    return;
  }

  if (action === "toggle-effort") {
    const key = `${btn.dataset.entryIndex}:${btn.dataset.setIndex}`;
    historyEdit.effortOpenKey = historyEdit.effortOpenKey === key ? null : key;
    renderHistoryDetail();
    return;
  }

  if (action === "set-effort") {
    const ei = Number(btn.dataset.entryIndex);
    const si = Number(btn.dataset.setIndex);
    const v = Number(btn.dataset.value);
    const entry = historyEdit.workout.entries?.[ei];
    if (!entry || !(v >= 1 && v <= 10)) return;
    const unit = si === -1 ? entry : (entry.type === "timed" ? entry.holds?.[si] : entry.sets?.[si]);
    if (!unit) return;
    unit.difficulty = unit.difficulty === v ? null : v;
    historyEdit.effortOpenKey = null;
    historyEdit.dirty = true;
    renderHistoryDetail();
    return;
  }
}

// Typed/selected values inside the History editor. Updates the working copy in
// place WITHOUT re-rendering, so the focused field keeps focus while typing.
function handleHistoryDetailInput(event) {
  if (!historyEdit) return;
  const field = event.target.closest("[data-hfield]");
  if (!field) return;
  const key = field.dataset.hfield;

  if (key === "add-search") {
    historyEdit.addQuery = field.value;
    const results = document.querySelector("#history-add-results");
    if (results) { results.innerHTML = renderHistoryAddResults(); renderUiIcons(results); }
    return;
  }

  if (key === "date") {
    historyEdit.workout.date = field.value;
    historyEdit.dirty = true;
    return;
  }

  const exEl = field.closest(".detail-exercise");
  if (!exEl) return;
  const entry = historyEdit.workout.entries?.[Number(exEl.dataset.entryIndex)];
  if (!entry) return;

  const rowEl = field.closest(".hist-set-row");
  if (rowEl) {
    const si = Number(rowEl.dataset.setIndex);
    if (entry.type === "timed") {
      const hold = entry.holds?.[si];
      if (hold && key === "seconds") hold.seconds = Number(field.value) || 0;
      else if (hold && key === "setnote") hold.notes = field.value;
    } else {
      const set = entry.sets?.[si];
      if (set) {
        if (key === "reps") set.reps = Number(field.value) || 0;
        else if (key === "weight") set.weight = Number(field.value) || 0;
        else if (key === "setnote") set.notes = field.value;
      }
    }
    historyEdit.dirty = true;
    return;
  }

  switch (key) {
    case "durationMinutes": entry.durationMinutes = Number(field.value) || 0; break;
    case "subtype":
      entry.subtype = field.value;
      entry.planned = { ...(entry.planned || {}), subtype: field.value };
      break;
    case "notes": entry.notes = field.value; break;
    case "statOutput": setHistoryStat(entry, "output", field.value); break;
    case "statAvgPower": setHistoryStat(entry, "avgPower", field.value); break;
    case "statDistance": setHistoryStat(entry, "distance", field.value); break;
    case "statElevation": setHistoryStat(entry, "elevation", field.value); break;
    case "statCalories": setHistoryStat(entry, "calories", field.value); break;
    default: return;
  }
  historyEdit.dirty = true;
}

function renderDetailExercise(entry, index) {
  const head = `<div class="detail-exercise-head"><h5>${escapeHtml(entry.exerciseName || "Exercise")}</h5><button class="quiet-button small-button btn-ico danger-text" type="button" data-haction="remove-entry" data-entry-index="${index}">${getUiIcon("trash-2")}Remove</button></div>`;

  if (entry.skipped) {
    return `
      <div class="detail-exercise" data-entry-index="${index}">
        ${head}
        <p class="empty-state">Skipped in this workout.</p>
      </div>
    `;
  }

  if (entry.type === "cardio") {
    const subtypeOptions = getExerciseSubtypeOptions(entry.exerciseId);
    const stats = entry.stats || {};
    const planned = entry.planned?.durationMinutes ? `Planned ${entry.planned.durationMinutes} min` : "";
    const sessionField = subtypeOptions.length ? `
      <div class="detail-field cardio-field cardio-field-wide">
        <label>Session type</label>
        <select data-hfield="subtype">
          ${subtypeOptions.map((item) => `<option value="${escapeHtml(item)}"${item === (entry.subtype || entry.planned?.subtype) ? " selected" : ""}>${escapeHtml(item)}</option>`).join("")}
        </select>
      </div>` : "";
    const statFields = getCardioMetrics(entry.exerciseId).map((m) => {
      const meta = CARDIO_METRIC_META[m];
      return `
        <div class="detail-field cardio-field">
          <label>${escapeHtml(meta.label)}</label>
          <span class="field-with-unit"><input type="number" min="0" step="${meta.step}" value="${escapeHtml(stats[m] || "")}" data-hfield="${cardioStatField(m)}" placeholder="0"><span class="field-unit">${escapeHtml(meta.unit)}</span></span>
        </div>`;
    }).join("");
    return `
      <div class="detail-exercise" data-entry-index="${index}">
        ${head}
        ${planned ? `<p class="hist-planned-line">${escapeHtml(planned)}</p>` : ""}
        <div class="cardio-fields">
          ${sessionField}
          <div class="detail-field cardio-field">
            <label>Time</label>
            <span class="field-with-unit"><input type="number" min="0" step="1" value="${escapeHtml(entry.durationMinutes || "")}" data-hfield="durationMinutes" placeholder="0"><span class="field-unit">min</span></span>
          </div>
          ${statFields}
        </div>
        <label class="detail-sport-notes">
          <span>Notes</span>
          <textarea rows="2" data-hfield="notes" placeholder="Optional notes">${escapeHtml(entry.notes || "")}</textarea>
        </label>
        <div class="hist-effort-wrap">${renderHistoryEffort(index, -1, entry.difficulty)}</div>
      </div>
    `;
  }

  if (entry.type === "sport") {
    return `
      <div class="detail-exercise" data-entry-index="${index}">
        ${head}
        <div class="compare-row">
          <div class="compare-col">
            <p class="compare-label">Planned</p>
            <p>${escapeHtml(entry.planned?.durationMinutes ? `${entry.planned.durationMinutes} min` : "—")}</p>
          </div>
          <div class="compare-col">
            <p class="compare-label">Actual</p>
            <label class="hist-inline-field">
              <input type="number" min="0" step="1" value="${escapeHtml(entry.durationMinutes || 0)}" data-hfield="durationMinutes" placeholder="0">
              <span>min</span>
            </label>
          </div>
        </div>
        <label class="detail-sport-notes">
          <span>Notes</span>
          <textarea rows="2" data-hfield="notes" placeholder="Optional notes">${escapeHtml(entry.notes || "")}</textarea>
        </label>
        <div class="hist-effort-wrap">${renderHistoryEffort(index, -1, entry.difficulty)}</div>
      </div>
    `;
  }

  if (entry.type === "timed") {
    const holds = Array.isArray(entry.holds) ? entry.holds : [];
    const planned = entry.planned?.sets ? `${entry.planned.sets} × ${entry.planned.seconds || 0} sec` : "—";
    const rows = holds.map((hold, si) => `
      <div class="hist-set-row" data-set-index="${si}">
        <span class="hist-set-num">Hold ${si + 1}</span>
        <label class="hist-set-field"><span>sec</span><input type="number" min="0" step="1" value="${escapeHtml(hold.seconds ?? 0)}" data-hfield="seconds"></label>
        ${renderSetMoreToggle(index, si, hold)}
        <button class="hist-set-remove btn-ico" type="button" data-haction="remove-set" data-entry-index="${index}" data-set-index="${si}" aria-label="Remove hold ${si + 1}">${getUiIcon("x")}</button>
        ${renderSetExtra(index, si, hold, "Hold note (optional)")}
      </div>
    `).join("");
    return `
      <div class="detail-exercise" data-entry-index="${index}">
        ${head}
        <p class="hist-planned-line">Planned ${escapeHtml(planned)}</p>
        <div class="hist-set-list">${rows || `<p class="empty-state">No holds logged.</p>`}</div>
        <button class="quiet-button small-button btn-ico" type="button" data-haction="add-set" data-entry-index="${index}">${getUiIcon("plus")}Add hold</button>
        <label class="detail-sport-notes">
          <span>Notes</span>
          <textarea rows="2" data-hfield="notes" placeholder="Optional notes">${escapeHtml(entry.notes || "")}</textarea>
        </label>
      </div>
    `;
  }

  // Strength exercise — one editable row per set, each with optional effort.
  const showWeight = entry.metricProfile !== "strength-bodyweight";
  const sets = Array.isArray(entry.sets) ? entry.sets : [];
  const entryWeightUnit = weightUnitLabel(entry);
  const entryIsDualStack = isDualStackLift(entry);
  const planned = entry.planned?.sets ? `${entry.planned.sets}×${entry.planned.reps || 0}${Number(entry.planned.weight) > 0 ? ` @ ${entry.planned.weight} ${entryWeightUnit}` : ""}` : "—";
  const rows = sets.map((set, si) => `
    <div class="hist-set-row" data-set-index="${si}">
      <span class="hist-set-num">Set ${si + 1}</span>
      <label class="hist-set-field"><span>reps</span><input type="number" min="0" step="1" value="${escapeHtml(set.reps ?? 0)}" data-hfield="reps"></label>
      ${showWeight ? `<label class="hist-set-field"><span>${entryIsDualStack ? "lb/side" : "lb"}</span><input type="number" min="0" step="0.5" value="${escapeHtml(set.weight ?? 0)}" data-hfield="weight"></label>` : ""}
      ${renderSetMoreToggle(index, si, set)}
      <button class="hist-set-remove btn-ico" type="button" data-haction="remove-set" data-entry-index="${index}" data-set-index="${si}" aria-label="Remove set ${si + 1}">${getUiIcon("x")}</button>
      ${renderSetExtra(index, si, set, "Set note (optional)")}
    </div>
  `).join("");
  return `
    <div class="detail-exercise" data-entry-index="${index}">
      ${head}
      <p class="hist-planned-line">Planned ${escapeHtml(planned)}</p>
      <div class="hist-set-list">${rows || `<p class="empty-state">No sets logged.</p>`}</div>
      <button class="quiet-button small-button btn-ico" type="button" data-haction="add-set" data-entry-index="${index}">${getUiIcon("plus")}Add set</button>
      <label class="detail-sport-notes">
        <span>Notes</span>
        <textarea rows="2" data-hfield="notes" placeholder="Optional notes">${escapeHtml(entry.notes || "")}</textarea>
      </label>
    </div>
  `;
}

// Turn a working-copy entry back into the exact saved shape the rest of the app
// reads (a per-set log + a one-line actualSummary + a rolled-up effort), exactly
// mirroring how a live workout is saved. This keeps History edits in sync with
// Progress, PRs, and the AI export. Empty stats/notes/effort are dropped (so
// "not rated" stays not rated — we never write a fake difficulty).
function normalizeHistoryEntry(entry) {
  if (entry.skipped) {
    return { id: entry.id, type: entry.type, exerciseId: entry.exerciseId, exerciseName: entry.exerciseName, planned: entry.planned || {}, skipped: true, flowMode: entry.flowMode };
  }

  if (entry.type === "cardio") {
    const out = {
      id: entry.id, type: "cardio", exerciseId: entry.exerciseId, exerciseName: entry.exerciseName,
      planned: entry.planned || {}, subtype: entry.subtype || entry.planned?.subtype || "",
      durationMinutes: Number(entry.durationMinutes) || 0, done: true, flowMode: entry.flowMode
    };
    const stats = {};
    // Only keep the metrics this exercise actually shows, so e.g. a tread never
    // keeps a watts value (average power is bike-only).
    getCardioMetrics(entry.exerciseId).forEach((k) => {
      const v = Number(entry.stats?.[k]);
      if (v > 0) stats[k] = v;
    });
    if (Object.keys(stats).length) out.stats = stats;
    const note = (entry.notes || "").trim();
    if (note) out.notes = note;
    if (Number(entry.difficulty) > 0) out.difficulty = Number(entry.difficulty);
    return out;
  }

  if (entry.type === "sport") {
    const out = {
      id: entry.id, type: "sport", exerciseId: entry.exerciseId, exerciseName: entry.exerciseName,
      planned: entry.planned || {}, durationMinutes: Number(entry.durationMinutes) || 0, done: true, flowMode: entry.flowMode
    };
    const note = (entry.notes || "").trim();
    if (note) out.notes = note;
    if (Number(entry.difficulty) > 0) out.difficulty = Number(entry.difficulty);
    return out;
  }

  if (entry.type === "timed") {
    const holds = (Array.isArray(entry.holds) ? entry.holds : []).map((hold, i) => {
      const row = { id: `hold-${i + 1}`, holdNumber: i + 1, seconds: Number(hold.seconds) || 0, done: true };
      const note = (hold.notes || "").trim();
      if (note) row.notes = note;
      if (Number(hold.difficulty) > 0) row.difficulty = Number(hold.difficulty);
      return row;
    });
    const out = {
      id: entry.id, type: "timed", exerciseId: entry.exerciseId, exerciseName: entry.exerciseName,
      planned: entry.planned || {}, actualSummary: { sets: holds.length, seconds: Number(holds[0]?.seconds) || 0 },
      holds, flowMode: entry.flowMode
    };
    const note = (entry.notes || "").trim();
    if (note) out.notes = note;
    const rolled = rollupDifficulty(holds);
    if (rolled) out.difficulty = rolled;
    return out;
  }

  // Strength
  const useWeight = entry.metricProfile !== "strength-bodyweight";
  const sets = (Array.isArray(entry.sets) ? entry.sets : []).map((set, i) => {
    const row = { id: `set-${i + 1}`, setNumber: i + 1, reps: Number(set.reps) || 0, weight: useWeight ? (Number(set.weight) || 0) : 0, done: true };
    const note = (set.notes || "").trim();
    if (note) row.notes = note;
    if (Number(set.difficulty) > 0) row.difficulty = Number(set.difficulty);
    return row;
  });
  const topWeight = sets.reduce((max, set) => Math.max(max, Number(set.weight) || 0), 0);
  const repsAtTop = sets.find((set) => (Number(set.weight) || 0) === topWeight)?.reps || sets[0]?.reps || 0;
  const out = {
    id: entry.id, type: "strength", exerciseId: entry.exerciseId, exerciseName: entry.exerciseName,
    planned: entry.planned || {},
    actualSummary: { sets: sets.length, reps: Number(repsAtTop) || 0, weight: useWeight ? (Number(topWeight) || 0) : 0 },
    sets, flowMode: entry.flowMode
  };
  if (entry.metricProfile) out.metricProfile = entry.metricProfile;
  const note = (entry.notes || "").trim();
  if (note) out.notes = note;
  const rolled = rollupDifficulty(sets);
  if (rolled) out.difficulty = rolled;
  return out;
}

function saveWorkoutChanges() {
  if (!historyEdit) return;
  const data = getLocalData();
  const idx = data.workouts?.findIndex((w) => w.id === historyEdit.workoutId);
  if (idx === undefined || idx < 0) { closeHistoryDetail(true); return; }

  const wc = historyEdit.workout;
  const cleanedEntries = (Array.isArray(wc.entries) ? wc.entries : []).map(normalizeHistoryEntry);
  // Preserve every original field (id, name, startedAt, savedAt, …); only the
  // edited date and the normalised entries change.
  data.workouts[idx] = { ...data.workouts[idx], ...wc, entries: cleanedEntries };

  commitProgressData(data);
  closeHistoryDetail(true);
  renderHistory();
}

const historyDetailCloseButton = document.querySelector("#history-detail-close");
// Back steps up one level through the editor's hierarchy:
// add-exercise page → edit mode → read-only view → History list.
historyDetailCloseButton?.addEventListener("click", async () => {
  if (!historyEdit) { closeHistoryDetail(); return; }

  if (historyEdit.addOpen) {
    historyEdit.addOpen = false;
    historyEdit.addQuery = "";
    renderHistoryDetail();
    window.scrollTo(0, 0);
    return;
  }

  // Leaving edit mode drops back to the read-only view (not all the way out),
  // discarding uncommitted edits after a confirm so a stray change can't stick.
  if (historyEdit.mode === "edit") {
    if (historyEdit.dirty) {
      const ok = await showConfirmModal({
        title: "Discard changes?",
        message: "You have unsaved edits to this workout. Go back without saving them?",
        confirmLabel: "Discard changes"
      });
      if (!ok) return;
    }
    reloadHistoryWorkingCopy();
    historyEdit.mode = "view";
    historyEdit.setMoreKey = null;
    historyEdit.effortOpenKey = null;
    renderHistoryDetail();
    window.scrollTo(0, 0);
    return;
  }

  closeHistoryDetail();
});

// Reset the working copy to the last-saved state (used when discarding edits and
// dropping back to the read-only view). Reads from the committed data by id so it
// always reflects exactly what's stored, then re-hydrates old-shape entries.
function reloadHistoryWorkingCopy() {
  if (!historyEdit) return;
  const data = getLocalData();
  const saved = data.workouts?.find((w) => w.id === historyEdit.workoutId);
  if (!saved) { closeHistoryDetail(true); return; }
  const working = JSON.parse(JSON.stringify(saved));
  hydrateHistoryEntries(working);
  historyEdit.workout = working;
  historyEdit.dirty = false;
}

// One delegated listener pair for the whole History editor (it re-renders often,
// so per-element listeners would leak; delegation survives re-renders).
const historyDetailPanel = document.querySelector("#history-detail-panel");
historyDetailPanel?.addEventListener("click", handleHistoryDetailClick);
historyDetailPanel?.addEventListener("input", handleHistoryDetailInput);
historyDetailPanel?.addEventListener("change", handleHistoryDetailInput);

function generateReviewPacket() {
  const data = getLocalData();
  const packet = [];
  const activePlan = { ...getStarterActivePlan(), ...(data.activePlan || {}) };
  const weeklyPlan = data.weeklyPlan || getStarterWeeklyPlan();
  const routines = Array.isArray(data.routines) ? data.routines : [];
  const library = Array.isArray(data.library) ? data.library : exercises;
  const bodyWeights = Array.isArray(data.bodyWeights) ? data.bodyWeights.slice() : [];
  const weightTarget = typeof data.weightTarget === "number" ? data.weightTarget : null;

  packet.push("=== TRAINING BOOK — AI COACH HANDOFF ===");
  packet.push(`Exported: ${new Date().toISOString()}`);
  packet.push("");

  packet.push("YOU ARE MY PERSONAL STRENGTH & CONDITIONING COACH.");
  packet.push("Everything below is my real training context: my goals, my current plan, my");
  packet.push("complete workout history (including how hard each set felt), my body weight, and");
  packet.push("my exercise library. Please read all of it before you respond.");
  packet.push("");

  packet.push("HOW TO COACH ME (read this carefully):");
  packet.push("- Do NOT open by dumping a new plan. Start like a real coach: a short read on how");
  packet.push("  last week actually went, based on the data below.");
  packet.push("- Then ask me questions before deciding anything — e.g. how my body feels, any pain");
  packet.push("  or niggles, what I want to focus on this week, how many days and how much time I");
  packet.push("  have, equipment access, and anything the numbers can't tell you.");
  packet.push("- Give me options with a clear recommendation and the reasoning behind it. This is a");
  packet.push("  back-and-forth conversation — react to my answers, push back when useful, and help");
  packet.push("  me decide. Don't rush to a final plan.");
  packet.push("- Use plain language and avoid emojis. Keep the tone practical, specific, and easy");
  packet.push("  to read on a phone.");
  packet.push("- Use my effort ratings, notes, skipped exercises, rest, and trends to progress me");
  packet.push("  sensibly: add reps/weight where sets felt easy, hold or back off where something");
  packet.push("  was painful, repeatedly skipped, or consistently maxed out.");
  packet.push("");

  packet.push("THE FINAL DELIVERABLE (important):");
  packet.push("- After we've talked it through and I've confirmed I'm happy, your LAST message must");
  packet.push("  be ONLY my next-week plan in the exact paste-ready format shown at the very bottom");
  packet.push("  of this document — nothing else in that message, no commentary around it.");
  packet.push("- I paste that block straight into Training Book's \"Paste an updated plan\" importer,");
  packet.push("  so it must match the format exactly (including any rest targets).");
  packet.push("- Include short exercise-specific coach notes when they will help me during the");
  packet.push("  workout. Training Book shows these as live \"Coach\" callouts on that exercise.");
  packet.push("- Do not say you saved or changed my plan. You are drafting; I preview and save");
  packet.push("  changes manually inside Training Book.");
  packet.push("- Do NOT give me that plan block until we've discussed and I ask for it. Until then,");
  packet.push("  just coach me.");
  packet.push("");

  packet.push("HOW TRAINING BOOK WORKS (so the plan you give me imports cleanly):");
  packet.push("- My workout follows the weekly plan and its routines, but I can add ad-hoc exercises mid-session.");
  packet.push("- Strength targets are sets x reps, optionally a starting weight (3x8 @ 95 lb) and a rest target (rest 90s). I log actual sets, reps, weight, per-set notes, and an optional per-set effort 1-10.");
  packet.push("- Cardio/Peloton targets are a subtype plus minutes (Peloton Tread: Incline Walk, 30 min; Peloton Bike: Just Ride, 20 min). I log output, average power, distance, notes, and effort.");
  packet.push("- For bike work, default to Peloton Bike instead of Stationary Bike unless I explicitly say it is a non-Peloton stationary bike.");
  packet.push("- Russian Twist should usually include a light starting weight when programming it for me, and one rep means right side plus left side. Dead Bug reps also count right plus left as one full rep.");
  packet.push("- Cable Crossover, Incline Cable Fly, Lat Pulldown, and Seated Cable Row are on a dual-independent-stack cable machine (Ares 2.0): the weight for these is per side, not a combined total, and every place it's shown says \"lb per side\" or \"lb/side\". When suggesting a weight for these four exercises, give the per-side number, matching what's already logged.");
  packet.push("- Held moves (e.g. plank) are timed: targets are sets x seconds (3x45 sec), optionally a rest target. I log EACH hold's actual seconds separately (e.g. 60s · 60s · 45s) plus optional per-hold effort.");
  packet.push("- Effort is rated 1-10 (1 = easy, 10 = all-out), logged per set/hold, and is optional — \"not logged\" means I didn't rate it, not that it was easy.");
  packet.push("- Rest targets (rest 90s) show during the live workout. Add \"timer\" after a rest target only when Training Book should run a countdown.");
  packet.push("- Exercise coach notes are imported with a `note:` line under an exercise. These");
  packet.push("  are not general plan notes; they appear during the live workout for that move.");
  packet.push("- Skipped exercises are marked skipped in History; coach around repeated skips.");
  packet.push("");

  packet.push("ACTIVE PLAN:");
  packet.push(`name: ${activePlan.name || "Current Training Plan"}`);
  packet.push(`main goal: ${activePlan.mainGoal || "(not set)"}`);
  packet.push(`review cadence: ${activePlan.reviewCadence || "(not set)"}`);
  packet.push(`next review date: ${activePlan.nextReviewDate || "(not set)"}`);
  packet.push(`notes: ${activePlan.notes || "(none)"}`);
  packet.push("");

  const focusGoals = Array.isArray(activePlan.focusGoals) ? activePlan.focusGoals : [];
  if (focusGoals.length) {
    packet.push("FOCUS GOALS (context only — this manual chat format has no way to save changes to these):");
    focusGoals.forEach((goal) => {
      const name = goal.exerciseName || getExerciseById(goal.exerciseId)?.name || goal.exerciseId || "Exercise";
      const goalWeightUnit = getExerciseById(goal.exerciseId)?.dualStack ? "lb per side" : "lb";
      const targetParts = [];
      if (Number(goal.targetWeight) > 0) targetParts.push(`${goal.targetWeight} ${goalWeightUnit}`);
      if (Number(goal.targetReps) > 0) targetParts.push(`${goal.targetReps} reps`);
      if (Number(goal.targetSets) > 0) targetParts.push(`${goal.targetSets} sets`);
      const { sessions } = goal.exerciseId ? getStrengthSeries(goal.exerciseId) : { sessions: [] };
      const best = sessions.reduce((top, s) => (!top || s.y > top.y) ? s : top, null);
      packet.push(`- ${name}: target ${targetParts.length ? targetParts.join(" x ") : "(not set)"}, best so far ${best ? `${best.y} ${goalWeightUnit} x ${best.reps} (${best.date})` : "(no logged sets yet)"}`);
    });
    packet.push("");
  }

  packet.push("EXERCISE LIBRARY:");
  library.forEach((exercise) => {
    packet.push(`- ${exercise.name} (${exercise.type || "strength"}${exercise.area ? `, ${exercise.area}` : ""})`);
  });
  packet.push("");

  packet.push("CURRENT WEEKLY PLAN:");
  Object.entries(weeklyPlan).forEach(([day, routineId]) => {
    const routine = routines.find((r) => r.id === routineId);
    packet.push(`${day}: ${routine?.name || "rest"}`);
  });
  packet.push("");

  packet.push("CURRENT ROUTINES:");
  routines.forEach((routine) => {
    packet.push(`ROUTINE: ${routine.name}`);
    routine.exercises?.forEach((exercise) => {
      packet.push(formatRoutineExercise(exercise));
      if (exercise.coachNote) packet.push(`  note: ${exercise.coachNote}`);
    });
    if (routine.notes) packet.push(`Notes: ${routine.notes}`);
    packet.push("");
  });

  packet.push("WORKOUT HISTORY (all workouts):");
  if (data.workouts && data.workouts.length > 0) {
    data.workouts.slice().reverse().forEach((workout) => {
      packet.push(formatWorkoutForExport(workout));
      packet.push("");
    });
  } else {
    packet.push("(no workouts logged yet)");
    packet.push("");
  }

  packet.push("BODY WEIGHT:");
  if (bodyWeights.length > 0) {
    if (weightTarget !== null) packet.push(`target: ${weightTarget} lb`);
    bodyWeights
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .forEach((entry) => {
        packet.push(`${entry.date}: ${entry.weight} lb`);
      });
  } else {
    packet.push("(no body weight entries logged yet)");
  }
  packet.push("");

  packet.push("=== FINAL DELIVERABLE: RETURN FORMAT FOR TRAINING BOOK IMPORT ===");
  packet.push("Only once we've talked through the week and I ask you for the plan, send a final");
  packet.push("message containing ONLY plain text in exactly this format (no intro, no commentary");
  packet.push("before or after — just this block so I can paste it straight into the app):");
  packet.push("");
  packet.push("ACTIVE PLAN:");
  packet.push("name: Plan Name");
  packet.push("main goal: One sentence goal");
  packet.push("review cadence: Weekly AI review");
  packet.push("next review date: YYYY-MM-DD or leave blank");
  packet.push("notes: Short notes for the plan");
  packet.push("");
  packet.push("WEEKLY PLAN:");
  packet.push("monday: Routine Name or rest");
  packet.push("tuesday: Routine Name or rest");
  packet.push("wednesday: Routine Name or rest");
  packet.push("thursday: Routine Name or rest");
  packet.push("friday: Routine Name or rest");
  packet.push("saturday: Routine Name or rest");
  packet.push("sunday: Routine Name or rest");
  packet.push("");
  packet.push("ROUTINE: Routine Name");
  packet.push("- Exercise Name: 3x8");
  packet.push("- Bench Press: 3x8 @ 95 lb, rest 90s");
  packet.push("  note: One short live cue or adjustment for this exercise, if useful.");
  packet.push("- Plank: 3x45 sec, rest 45s");
  packet.push("- Peloton Tread: Incline Walk, 30 min");
  packet.push("- Peloton Bike: Just Ride, 20 min");
  packet.push("");
  packet.push("Rules for the final block:");
  packet.push("- Use exercise names from my library above when possible.");
  packet.push("- Keep each routine exercise on one dash line.");
  packet.push("- Add a rest target with \"rest 90s\" (seconds) on strength/timed lines where rest matters; leave it off where it doesn't.");
  packet.push("- Add a `note:` line under exercises where I need a live cue, adjustment, caution,");
  packet.push("  or reminder during the workout. Keep each note short and specific.");
  packet.push("- Do not include any text outside this format in that final message.");

  return packet.join("\n");
}

function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return Promise.resolve();
}

function getReviewPacketFileName() {
  return `training-book-review-${new Date().toISOString().slice(0, 10)}.md`;
}

function downloadTextFile(text, fileName) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function saveTextFile(text, fileName) {
  if (window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [{
        description: "Markdown file",
        accept: { "text/markdown": [".md"] }
      }]
    });
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
    return "picked";
  }

  downloadTextFile(text, fileName);
  return "downloaded";
}

async function copyReviewPacket() {
  const packet = generateReviewPacket();
  await copyTextToClipboard(packet);
  alert("Coach prompt copied. Paste it into an AI chat (ChatGPT, Claude, etc.) to start your weekly review.");
}

async function saveReviewPacket() {
  const packet = generateReviewPacket();
  const fileName = getReviewPacketFileName();
  try {
    const saveMode = await saveTextFile(packet, fileName);
    if (saveMode === "picked") {
      alert(`Coach prompt saved as ${fileName}.`);
    } else {
      alert(`Coach prompt downloaded as ${fileName}. Firefox and some mobile browsers do not support a Save As picker from web apps, so they use Downloads.`);
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      alert("File save was cancelled.");
      return;
    }
    alert(`The file save did not finish: ${error.message}`);
  }
}

function getPlanImportExample() {
  return `ACTIVE PLAN:
name: 4-Week Strength & Consistency Plan
main goal: Build a steady 3-day strength routine while keeping workouts short enough to complete.
review cadence: Weekly AI review
next review date: 2026-06-16
notes: Focus on good form, repeatable effort, and slowly adding reps or weight when sets feel comfortable.

WEEKLY PLAN:
monday: Full Body A
tuesday: rest
wednesday: Full Body B
thursday: rest
friday: Full Body A
saturday: Optional Walk
sunday: rest

ROUTINE: Full Body A
- Goblet Squat: 3x8 @ 35, rest 90s timer
  note: Chest tall and drive through your heels — ease off the last set, you burned out here last week.
- Push-up: 3x8, rest 60s
- Dumbbell Row: 3x10 @ 30, rest 75s
- Plank: 3x30, rest 45s

ROUTINE: Full Body B
- Deadlift: 3x8 @ 95, rest 120s
- Shoulder Press: 3x8 @ 20, rest 90s
- Squat: 3x8 @ 45, rest 90s
- Plank: 2x30, rest 45s

ROUTINE: Optional Walk
- Peloton Tread: Incline Walk, 30 min
- Peloton Bike: Just Ride, 20 min`;
}

function fillPlanImportExample() {
  const textarea = planContent?.querySelector("#plan-import-text");
  if (!textarea) return;
  textarea.value = getPlanImportExample();
  planImportPreview = null;
  planImportSummary = "";
  planImportMessage = "Example loaded. Press Preview changes to see what would be saved.";
  renderPlan();
}

function parseRoutineExerciseLine(line) {
  const cleaned = line.replace(/^[-*•]\s*/, "").trim();
  const separatorIndex = cleaned.indexOf(":");
  if (separatorIndex < 1) return null;

  const exerciseName = cleaned.slice(0, separatorIndex).trim();
  let rawTarget = cleaned.slice(separatorIndex + 1).trim();

  // Optional inline coach note at the tail, e.g. "3x8 @ 135 | note: chest tall"
  // or "...(note: ease off here)". Pulled out first so its words can't be
  // misread as reps/rest/timer below. A note may also arrive on its own line
  // (see parseAiPlanText), so this is just the convenient one-line form.
  let coachNote = "";
  const noteMatch = rawTarget.match(/[|(\-–—]?\s*(?:coach\s*note|coach|note)\s*[:=]\s*(.+)$/i);
  if (noteMatch) {
    coachNote = noteMatch[1].replace(/[)\s]+$/, "").trim();
    rawTarget = rawTarget.slice(0, noteMatch.index).replace(/[|(\-–—,;\s]+$/, "").trim();
  }

  // Optional rest target, e.g. "3x8 @ 135, rest 90s" or "90s rest". Pulled out
  // (and stripped) first so its number can't be misread as reps/minutes below.
  const restSeconds = parseRestSeconds(rawTarget);
  // "rest 90s timer" / "90s rest (timer)" turns the rest into a live countdown.
  const restTimer = /\btimer\b/i.test(rawTarget);
  rawTarget = rawTarget
    .replace(/,?\s*rest\s*:?\s*\d+\s*(?:s|sec|secs|seconds?)?\b/i, "")
    .replace(/,?\s*\d+\s*(?:s|sec|secs|seconds?)\s+rest\b/i, "")
    .replace(/[(]?\s*timer\s*[)]?/ig, "")
    .replace(/[,;|]\s*$/, "")
    .trim();
  const target = rawTarget.toLowerCase();
  const exerciseId = findExerciseIdByName(exerciseName);
  const withRest = (parsed) => {
    if (restSeconds > 0) parsed.targetRest = restSeconds;
    if (restSeconds > 0 && restTimer) parsed.restTimer = true;
    if (coachNote) parsed.coachNote = coachNote;
    return parsed;
  };

  const durationMatch = target.match(/(\d+)\s*(min|minute|minutes)/);
  if (durationMatch) {
    const parsed = {
      exerciseId,
      targetDuration: Number(durationMatch[1])
    };
    const subtypeText = rawTarget.slice(0, rawTarget.toLowerCase().indexOf(durationMatch[0])).replace(/[,|-]+$/g, "").trim();
    if (subtypeText && !/^\d/.test(subtypeText)) parsed.targetSubtype = subtypeText;
    return withRest(parsed);
  }

  const strengthMatch = target.match(/(\d+)\s*(x|sets?\s*(of)?|by)\s*(\d+)/);
  if (strengthMatch) {
    const parsed = {
      exerciseId,
      targetSets: Number(strengthMatch[1]),
      targetReps: Number(strengthMatch[4])
    };
    // Optional starting weight: "3x8 @ 135", "3x8 at 135", or "3x8 135 lb".
    const weightMatch = target.match(/(?:@|at)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)\b/);
    const weight = weightMatch ? Number(weightMatch[1] || weightMatch[2]) : 0;
    if (weight > 0) parsed.targetWeight = weight;
    return withRest(parsed);
  }

  return null;
}

// Read a rest target in seconds from a target string. Accepts "rest 90s",
// "rest: 90", "rest 90 sec", or "90s rest". Returns 0 when none is present.
function parseRestSeconds(target) {
  const m = target.match(/rest\s*:?\s*(\d+)\s*(?:s|sec|secs|seconds?)?\b/i)
    || target.match(/(\d+)\s*(?:s|sec|secs|seconds?)\s+rest\b/i);
  return m ? Math.max(0, Math.round(Number(m[1]))) : 0;
}

function normalizeImportHeading(line) {
  return line
    .replace(/^#+\s*/, "")
    .replace(/^[*-]\s*/, "")
    .replace(/\*\*/g, "")
    .trim()
    .toUpperCase();
}

function readKeyValueLine(line) {
  const cleaned = line.replace(/^[*-]\s*/, "").trim();
  const separatorIndex = cleaned.indexOf(":");
  if (separatorIndex < 1) return null;
  return {
    key: cleaned.slice(0, separatorIndex).trim().toLowerCase(),
    value: cleaned.slice(separatorIndex + 1).trim()
  };
}

function parseAiPlanText(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const activePlan = {};
  const routines = [];
  const weeklyPlanNames = {};
  let mode = "";
  let currentRoutine = null;

  lines.forEach((line) => {
    const upper = normalizeImportHeading(line);
    if (upper === "ACTIVE PLAN:" || upper === "ACTIVE PLAN" || upper === "PLAN:" || upper === "PLAN") {
      mode = "active-plan";
      currentRoutine = null;
      return;
    }

    if (upper === "WEEKLY PLAN:" || upper === "WEEKLY PLAN") {
      mode = "weekly";
      currentRoutine = null;
      return;
    }

    if (upper.startsWith("ROUTINE:")) {
      mode = "routine";
      currentRoutine = {
        name: line.slice(line.indexOf(":") + 1).replace(/\*\*/g, "").trim(),
        location: "mixed",
        exercises: [],
        notes: "Updated by AI coach"
      };
      if (currentRoutine.name) routines.push(currentRoutine);
      return;
    }

    if (mode === "active-plan") {
      const parsedLine = readKeyValueLine(line);
      if (!parsedLine) return;
      const { key, value } = parsedLine;
      if (key === "name" || key === "plan name") activePlan.name = value;
      if (key === "main goal" || key === "goal") activePlan.mainGoal = value;
      if (key === "review cadence" || key === "review rhythm") activePlan.reviewCadence = value;
      if (key === "next review date") activePlan.nextReviewDate = value;
      if (key === "notes" || key === "plan notes") activePlan.notes = value;
      return;
    }

    if (mode === "weekly") {
      const cleaned = line.replace(/^[*-]\s*/, "").trim();
      const match = cleaned.match(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*:\s*(.+)$/i);
      if (match) {
        weeklyPlanNames[match[1].toLowerCase()] = match[2].trim();
      }
      return;
    }

    if (mode === "routine" && currentRoutine) {
      // A standalone note line (e.g. "note: ease off the last set you burned
      // out on") attaches to the most recently listed exercise, so the coach
      // can write longer guidance on its own line under each move.
      const noteLine = line.replace(/^[-*•]\s*/, "").match(/^(?:coach\s*note|coach|note)\s*[:=]\s*(.+)$/i);
      if (noteLine) {
        const last = currentRoutine.exercises[currentRoutine.exercises.length - 1];
        if (last) {
          const text = noteLine[1].trim();
          last.coachNote = last.coachNote ? `${last.coachNote} ${text}` : text;
        }
        return;
      }
      if (/^[-*]\s*/.test(line)) {
        const parsedExercise = parseRoutineExerciseLine(line);
        if (parsedExercise) currentRoutine.exercises.push(parsedExercise);
      }
    }
  });

  return {
    activePlan,
    routines: routines.filter((routine) => routine.name && routine.exercises.length > 0),
    weeklyPlanNames
  };
}

function makeUniqueRoutineId(name, routines) {
  const base = makeSlug(name);
  let id = base;
  let index = 2;
  while (routines.some((routine) => routine.id === id)) {
    id = `${base}-${index}`;
    index += 1;
  }
  return id;
}

function buildImportedPlanData(currentData, parsed) {
  const data = structuredClone(currentData);
  data.activePlan = { ...getStarterActivePlan(), ...(data.activePlan || {}), ...(parsed.activePlan || {}) };
  data.routines = Array.isArray(data.routines) ? data.routines : [];

  parsed.routines.forEach((routine) => {
    const existingIndex = data.routines.findIndex((item) => item.name.toLowerCase() === routine.name.toLowerCase());
    const existing = existingIndex >= 0 ? data.routines[existingIndex] : null;
    const nextRoutine = {
      id: existing?.id || makeUniqueRoutineId(routine.name, data.routines),
      name: routine.name,
      location: existing?.location || routine.location,
      exercises: routine.exercises,
      notes: routine.notes
    };

    if (existingIndex >= 0) {
      data.routines[existingIndex] = nextRoutine;
    } else {
      data.routines.push(nextRoutine);
    }
  });

  if (Object.keys(parsed.weeklyPlanNames).length > 0) {
    const nextWeeklyPlan = { ...(data.weeklyPlan || getStarterWeeklyPlan()) };
    Object.entries(parsed.weeklyPlanNames).forEach(([day, routineName]) => {
      if (!routineName || routineName.toLowerCase() === "rest" || routineName.toLowerCase() === "off") {
        nextWeeklyPlan[day] = null;
        return;
      }

      const routine = data.routines.find((item) => item.name.toLowerCase() === routineName.toLowerCase());
      if (routine) {
        nextWeeklyPlan[day] = routine.id;
      }
    });
    data.weeklyPlan = nextWeeklyPlan;
  }

  normalizeSoccerDurationInData(data);
  return data;
}

function summarizePlanImport(parsed, nextData) {
  const lines = [];
  const activePlanKeys = Object.keys(parsed.activePlan || {}).filter((key) => parsed.activePlan[key]);
  if (activePlanKeys.length > 0) {
    lines.push(`Active plan: ${nextData.activePlan.name || "Current Training Plan"}`);
    if (nextData.activePlan.mainGoal) lines.push(`Goal: ${nextData.activePlan.mainGoal}`);
  } else {
    lines.push("Active plan notes: no changes");
  }

  if (Object.keys(parsed.weeklyPlanNames).length > 0) {
    lines.push("");
    lines.push("Weekly schedule:");
    DOW_NAMES.forEach((day) => {
      lines.push(`${formatDayName(day)}: ${getRoutineNameById(nextData.weeklyPlan?.[day], nextData.routines || [])}`);
    });
  }

  if (parsed.routines.length > 0) {
    lines.push("");
    lines.push("Routines to add/update:");
    parsed.routines.forEach((routine) => {
      lines.push(`- ${routine.name} (${routine.exercises.length} exercises)`);
    });
  }

  lines.push("");
  lines.push("Load this updated plan into Training Book?");
  return lines.join("\n");
}

function getPlanImportText() {
  return planContent?.querySelector("#plan-import-text")?.value.trim() || "";
}

function previewPlanImportFromScreen() {
  const text = getPlanImportText();
  if (!text) {
    planImportPreview = null;
    planImportSummary = "";
    planImportMessage = "Paste a plan first, or press Use example.";
    renderPlan();
    return;
  }

  try {
    const parsed = parseAiPlanText(text);
    const hasActivePlan = Object.values(parsed.activePlan || {}).some(Boolean);
    if (!hasActivePlan && parsed.routines.length === 0 && Object.keys(parsed.weeklyPlanNames).length === 0) {
      throw new Error("I could not find plan notes, routine names, or weekly schedule lines.");
    }

    const data = getLocalData();
    const nextData = buildImportedPlanData(data, parsed);
    planImportPreview = { parsed, nextData };
    planImportSummary = summarizePlanImport(parsed, nextData).replace(/\nLoad this updated plan into Training Book\?$/, "");
    planImportMessage = "Preview ready. If this looks right, save the imported plan.";
  } catch (error) {
    planImportPreview = null;
    planImportSummary = "";
    planImportMessage = `Could not read that plan yet: ${error.message}`;
  }

  renderPlan();
}

function savePlanImportFromScreen() {
  if (!planImportPreview) {
    previewPlanImportFromScreen();
    return;
  }

  const nextData = planImportPreview.nextData;
  nextData.updatedAt = new Date().toISOString();
  nextData.updatedBy = getDeviceId();
  commitProgressData(nextData);
  renderTodayRoutine();

  planImportPreview = null;
  planImportSummary = "";
  planImportMessage = "Imported plan saved. Today has been refreshed from the latest weekly plan.";
  renderPlan();
}

function importUpdatedPlan() {
  const text = prompt("Paste the AI's updated plan here:");
  if (!text) return;

  try {
    const parsed = parseAiPlanText(text);
    const hasActivePlan = Object.values(parsed.activePlan || {}).some(Boolean);
    if (!hasActivePlan && parsed.routines.length === 0 && Object.keys(parsed.weeklyPlanNames).length === 0) {
      throw new Error("No active plan, routines, or weekly plan lines found. Use the export packet's return format.");
    }

    const data = getLocalData();
    const nextData = buildImportedPlanData(data, parsed);
    if (!confirm(summarizePlanImport(parsed, nextData))) return;

    nextData.updatedAt = new Date().toISOString();
    nextData.updatedBy = getDeviceId();
    commitProgressData(nextData);
    renderTodayRoutine();
    renderPlan();

    alert("Plan imported. Today has been refreshed with the latest weekly plan.");
  } catch (error) {
    alert(`Could not import that plan: ${error.message}`);
  }
}

// Swap any data-icon placeholders (e.g. the nav bar) for their Lucide SVGs.
renderUiIcons();

tabs.forEach((tab) => {
  tab.addEventListener("click", async () => {
    if (activeWorkout.started && tab.dataset.target !== "today") {
      const ok = await showConfirmModal({
        title: "Leave workout screen?",
        message: "Your progress is saved as a draft. Leaving the focused view can break your rhythm, so Training Book asks first.",
        confirmLabel: "Leave screen",
        danger: false
      });
      if (!ok) return;
      persistActiveWorkoutDraft();
    }
    showScreen(tab.dataset.target, true);
  });
});

// Filter chips are rebuilt whenever categories change, so use delegation.
filterStrip?.addEventListener("click", (event) => {
  const chip = event.target.closest(".filter-chip");
  if (!chip) return;
  const filter = chip.dataset.filter || "all";
  filterStrip.querySelectorAll(".filter-chip").forEach((item) => item.classList.toggle("is-active", item === chip));
  renderExercises(filter);
});

// Library: the "Edit categories" button opens the category manager modal.
document.querySelector("#open-edit-categories")?.addEventListener("click", openCategoriesModal);

// Library: how-to / favourite / edit / remove actions on the exercise list.
exerciseList?.addEventListener("click", handleLibraryListClick);

// Library: the edit-exercise modal — controls + staged photo uploads.
const libraryEditModalRoot = document.querySelector("#library-edit-modal-root");
libraryEditModalRoot?.addEventListener("click", handleEditModalClick);
libraryEditModalRoot?.addEventListener("change", (event) => {
  const fileInput = event.target.closest('input[type="file"][data-photo-slot]');
  if (!fileInput || !fileInput.files || !fileInput.files[0]) return;
  const slot = fileInput.dataset.photoSlot;
  downscaleImage(fileInput.files[0])
    .then((dataUrl) => {
      if (!editingDraftPhotos) editingDraftPhotos = {};
      editingDraftPhotos[slot] = dataUrl;
      applyStagedPhotoToModal(fileInput, dataUrl);
    })
    .catch((error) => alert(error.message || "That image could not be used."));
});
libraryEditModalRoot?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.classList.contains("exercise-edit-name")) {
    event.preventDefault();
    const modal = event.target.closest(".edit-sheet");
    modal?.querySelector('[data-action="save-exercise"]')?.click();
  }
});

// Library: live search box filters the cards as you type.
const librarySearchInput = document.querySelector("#library-search");
librarySearchInput?.addEventListener("input", () => {
  librarySearch = librarySearchInput.value || "";
  renderExercises();
});

// Library: the "How to do it" sheet is read-only now — just close on X / Done /
// scrim. (Photo editing moved to the exercise edit card.)
const librarySheetRoot = document.querySelector("#library-sheet-root");
librarySheetRoot?.addEventListener("click", (event) => {
  const onCloseButton = event.target.closest('[data-action="close-library-how-to"]');
  const onScrim = event.target.classList.contains("lw-sheet-scrim");
  if (onCloseButton || onScrim) closeLibraryReference();
});

// The Today preview's "How to do it" sheet: close on its close button or scrim.
const todayHowToRoot = document.querySelector("#today-howto-root");
todayHowToRoot?.addEventListener("click", (event) => {
  const onCloseButton = event.target.closest('[data-action="close-today-how-to"]');
  const onScrim = event.target.classList.contains("lw-sheet-scrim");
  if (onCloseButton || onScrim) closeTodayReference();
});

// "Report an issue" lives on the shared how-to sheet, which renders in three
// different roots (live workout, Library, Today), so route it once at the top.
document.addEventListener("click", (event) => {
  const btn = event.target.closest('[data-action="report-exercise-issue"]');
  if (!btn) return;
  reportExerciseIssue(btn.dataset.id, btn.dataset.name);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (editingExerciseId) closeEditExerciseModal();
  else if (categoriesModalOpen) closeCategoriesModal();
  else if (addModalOpen) closeAddExerciseModal();
  else if (planPicker.routineId) closePlanPicker();
  else if (libraryReferenceId) closeLibraryReference();
  else if (todayReferenceId) closeTodayReference();
});

// Library: the "Add an exercise" button opens a small modal (name + type).
document.querySelector("#open-add-exercise")?.addEventListener("click", openAddExerciseModal);

const libraryAddModalRoot = document.querySelector("#library-add-modal-root");
libraryAddModalRoot?.addEventListener("click", (event) => {
  const typeOption = event.target.closest("[data-add-type] .type-option");
  if (typeOption) {
    addModalType = typeOption.dataset.type || "strength";
    libraryAddModalRoot.querySelectorAll("[data-add-type] .type-option").forEach((btn) => btn.classList.toggle("is-active", btn === typeOption));
    return;
  }
  const button = event.target.closest("[data-action]");
  if (button?.dataset.action === "submit-add") submitAddExercise();
  else if (button?.dataset.action === "close-add" || event.target.hasAttribute("data-add-scrim")) closeAddExerciseModal();
});
libraryAddModalRoot?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.id === "add-ex-name") {
    event.preventDefault();
    submitAddExercise();
  }
});

// Library: the "Edit categories" modal — add / remove / relabel + save / close.
const libraryCategoriesModalRoot = document.querySelector("#library-categories-modal-root");
libraryCategoriesModalRoot?.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-categories-scrim")) { closeCategoriesModal(); return; }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "add-category") addCategoryRow();
  else if (action === "remove-category") removeCategoryRow(Number(button.dataset.index));
  else if (action === "save-categories") saveCategories();
  else if (action === "close-categories") closeCategoriesModal();
});
libraryCategoriesModalRoot?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.classList.contains("cat-row-input")) {
    event.preventDefault();
    saveCategories();
  }
});

const settingsButton = document.querySelector("#settings-button");
settingsButton?.addEventListener("click", openSettingsModal);

const settingsModalRoot = document.querySelector("#settings-modal-root");
settingsModalRoot?.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-settings-scrim")) { closeSettingsModal(); return; }
  const button = event.target.closest("[data-action]");
  if (button?.dataset.action === "close-settings") { closeSettingsModal(); return; }
  if (button) handleSettingsDataAction(event);
});
settingsModalRoot?.addEventListener("change", handleRestoreFileChosen);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settingsModalOpen) closeSettingsModal();
});

// Plan details modal: small icon button on the Plan heading opens it.
const planDetailsButton = document.querySelector("#plan-details-button");
planDetailsButton?.addEventListener("click", openPlanDetailsModal);

const planDetailsModalRoot = document.querySelector("#plan-details-modal-root");
planDetailsModalRoot?.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-plan-details-scrim")) { closePlanDetailsModal(); return; }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (button.dataset.action === "close-plan-details") { closePlanDetailsModal(); return; }
  if (button.dataset.action === "save-plan-notes") saveActivePlanFromScreen();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && planDetailsModalOpen) closePlanDetailsModal();
});

// Milestone goal editor: shared by the Plan tab's "Add goal"/"Edit" buttons
// and the edit icon on the Progress focus-goal card (handlePlanClick and the
// Progress wiring in renderProgress() both just call openGoalPicker/openGoalEditor).
const goalEditorModalRoot = document.querySelector("#goal-editor-modal-root");
goalEditorModalRoot?.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-goal-editor-scrim")) { closeGoalEditor(); return; }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  switch (button.dataset.action) {
    case "close-goal-editor": closeGoalEditor(); break;
    case "pick-goal-exercise": pickGoalExercise(button.dataset.id); break;
    case "save-goal": saveGoalFromEditor(); break;
    case "delete-goal": deleteGoal(button.dataset.id); break;
    default: break;
  }
});
goalEditorModalRoot?.addEventListener("input", (event) => {
  if (event.target.id !== "goal-picker-search") return;
  goalEditor.query = event.target.value;
  const resultsEl = goalEditorModalRoot.querySelector(".goal-picker-results");
  if (resultsEl) resultsEl.innerHTML = renderGoalPickerResults();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && goalEditor.step !== "closed") closeGoalEditor();
});

// App / product notes: the header button opens the sheet; the live-workout
// topbar button (handled in handleTodayWorkoutClick) opens it tagged "workout".
const notesButton = document.querySelector("#notes-button");
notesButton?.addEventListener("click", () => openNotesModal({ source: "manual" }));

const notesModalRoot = document.querySelector("#notes-modal-root");
notesModalRoot?.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-notes-scrim")) { closeNotesModal(); return; }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  handleNotesAction(button.dataset.action, button.dataset.noteId);
});
// Ctrl/Cmd+Enter in the compose box is a quick "add note" so capture stays fast.
notesModalRoot?.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && event.target.id === "note-input") {
    event.preventDefault();
    addNoteFromInput();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && notesModalOpen) closeNotesModal();
});

// Schedule calendar modal: open from the Workout day switcher, navigate months,
// tap a day for its detail, and close via scrim / X / Escape.
openCalendarButton?.addEventListener("click", openCalendarModal);

calendarModalRoot?.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-calendar-scrim")) { closeCalendarModal(); return; }
  if (event.target.closest('[data-action="close-calendar"]')) { closeCalendarModal(); return; }
  const step = event.target.closest("[data-cal-step]");
  if (step) {
    const delta = Number(step.dataset.calStep) || 0;
    progressMonthDate = new Date(Date.UTC(
      progressMonthDate.getUTCFullYear(),
      progressMonthDate.getUTCMonth() + delta,
      1
    ));
    renderCalendarModal();
    return;
  }
  handleCalendarDayClick(event);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && calendarModalOpen) closeCalendarModal();
});

// Tapping a day on the Progress-tab calendar opens its detail panel too. The
// month-nav arrows there are wired per-render inside renderProgress.
progressContent?.addEventListener("click", handleCalendarDayClick);

addExerciseButton?.addEventListener("click", addExerciseToWorkout);

exercisePicker?.addEventListener("change", () => {
  if (exercisePicker.value) addExerciseToWorkout();
});

activeWorkoutList?.addEventListener("input", handleWorkoutInput);
activeWorkoutList?.addEventListener("change", handleWorkoutInput);
activeWorkoutList?.addEventListener("click", handleWorkoutClick);
historyContent?.addEventListener("click", handleHistoryClick);

saveWorkoutButton?.addEventListener("click", () => {
  saveWorkout().catch((error) => {
    setWorkoutStatus(error.message, "bad");
  });
});

todayRoutineList?.addEventListener("click", handleTodayWorkoutClick);
todayRoutineList?.addEventListener("change", handleTodayWorkoutChange);
todayRoutineList?.addEventListener("input", handleTodayWorkoutChange);
// Keyboard activation for the tappable preview rows (role="button").
todayRoutineList?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest('[data-action="preview-how-to"]');
  if (!card) return;
  event.preventDefault();
  openTodayReference(card.dataset.id);
});

reviewReminderGo?.addEventListener("click", () => showScreen("coach", true));
reviewReminderDismiss?.addEventListener("click", () => {
  snoozeCoachReminder(7);
});

startTodayButton?.addEventListener("click", openWorkoutFlowChoice);
startCustomButton?.addEventListener("click", startCustomWorkout);
todayBackButton?.addEventListener("click", exitTodayWorkout);

// Change-day control: preview/start any day's planned workout. Only active in
// the preview/rest states (the switcher is hidden during a live workout).
dayPrevButton?.addEventListener("click", () => {
  if (activeWorkout.started) return;
  shiftViewedDay(-1);
  renderTodayRoutine();
});
dayNextButton?.addEventListener("click", () => {
  if (activeWorkout.started) return;
  shiftViewedDay(1);
  renderTodayRoutine();
});
dayTodayResetButton?.addEventListener("click", () => {
  if (activeWorkout.started) return;
  resetViewedDayToToday();
  renderTodayRoutine();
});

// The focused workout (Slice 2) draws Next / Back / Save inside the routine
// list and is wired through handleTodayWorkoutClick above. The old add-extra
// picker and footer Save bar are no longer used.

const importPlanButton = document.querySelector("#import-plan");

importPlanButton?.addEventListener("click", importUpdatedPlan);

// Plan screen: one set of delegated listeners (attached once) handles every
// control the section renderers draw, since renderPlan() replaces the markup.
planContent?.addEventListener("click", handlePlanClick);
planContent?.addEventListener("change", handlePlanChange);
planContent?.addEventListener("input", handlePlanInput);
// Weekly-schedule drag-and-drop (desktop). Touch screens use the tap-to-swap handle.
planContent?.addEventListener("dragstart", handlePlanDragStart);
planContent?.addEventListener("dragover", handlePlanDragOver);
planContent?.addEventListener("drop", handlePlanDrop);
planContent?.addEventListener("dragend", handlePlanDragEnd);
coachContent?.addEventListener("click", handleCoachClick);

syncPill?.addEventListener("click", () => {
  handleSyncPillClick().catch((error) => {
    updateConnectionState();
    setSyncStatus(`${error.message} Your local data is still safe on this device.`, "bad");
  });
});

connectDropboxButton?.addEventListener("click", connectDropboxFromPanel);
retrySyncButton?.addEventListener("click", retrySyncFromPanel);
loadLatestButton?.addEventListener("click", loadLatestFromPanel);
resetDropboxButton?.addEventListener("click", resetDropboxFromPanel);
refreshAppButton?.addEventListener("click", refreshAppUpdate);
document.addEventListener("click", closeSyncPanelFromOutside);

window.addEventListener("online", () => {
  updateConnectionState();
  syncPendingData().catch(() => {
    // Sync failed but will retry when user saves next workout
  });
});

window.addEventListener("offline", updateConnectionState);

window.addEventListener("beforeunload", (event) => {
  if (!activeWorkout.started) return;
  persistActiveWorkoutDraft();
  event.preventDefault();
  event.returnValue = "";
});

refreshLibrary();
repairSoccerDurationInvariant();
renderFilterStrip();
renderExercises();
renderExercisePicker();
renderActiveWorkout();
renderTodayRoutine();
renderPlan();
showScreen(localStorage.getItem(STORAGE.activeTab) || "today");
offerResumeWorkoutDraft();

// ===== Firebase cloud sync setup =====
// Daniel's Training Book Firebase project. The apiKey here is a public
// identifier (not a secret password); data is protected by security rules
// that only let a signed-in user read and write their own document.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDY1q5RtpXcMXUvA-WKlRSs1ijgVPhat_M",
  authDomain: "training-book-6c456.firebaseapp.com",
  projectId: "training-book-6c456",
  storageBucket: "training-book-6c456.firebasestorage.app",
  messagingSenderId: "824749397256",
  appId: "1:824749397256:web:db7d9cae4fedd63ae4c8bd"
};

async function initCloud() {
  let appMod, authMod, fsMod, fnMod;
  try {
    [appMod, authMod, fsMod, fnMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/12.14.0/firebase-functions.js")
    ]);
  } catch (error) {
    // Offline or the Firebase code could not load: the app still works
    // fully on this device using the local backup. Sync resumes next launch.
    console.error("Cloud sync could not load right now:", error);
    // No cloud to reconcile against, so it is safe to seed locally now.
    reseedLibraryOnce();
    mergeLibraryV3Once();
    refreshLibraryFieldsOnce();
    seedSoccerOnce();
    seedPelotonOnce();
    seedPickleballOnce();
    restoreSportTypesOnce();
    repairCatalogDataOnce();
    repairPelotonBikeHistoryOnce();
    repairSoccerDurationInvariant({ rerender: true });
    updateCloudUi();
    return;
  }

  const fbApp = appMod.initializeApp(FIREBASE_CONFIG);
  firebaseLoaded = true;
  const fbAuth = authMod.getAuth(fbApp);
  const fbDb = fsMod.getFirestore(fbApp);
  const fbFunctions = fnMod.getFunctions(fbApp, "us-central1");
  const provider = new authMod.GoogleAuthProvider();
  // Always show Google's account chooser instead of silently re-using the last
  // account. Without this, "Switch account" could just sign the same person back
  // in. With it, Daniel can pick which profile (his or his wife's) to load.
  provider.setCustomParameters({ prompt: "select_account" });
  _setDoc = fsMod.setDoc;
  _coachReviewCallable = fnMod.httpsCallable(fbFunctions, "coachReview");
  // Capture the Firestore helpers the version-history backup layer needs.
  _fb = {
    db: fbDb,
    collection: fsMod.collection,
    doc: fsMod.doc,
    setDoc: fsMod.setDoc,
    getDoc: fsMod.getDoc,
    getDocs: fsMod.getDocs,
    query: fsMod.query,
    orderBy: fsMod.orderBy,
    deleteDoc: fsMod.deleteDoc
  };

  // Decide what to do when the cloud sends us the latest saved data. We MERGE
  // rather than overwrite: history lists are unioned and a freshly-seeded
  // starter plan never replaces a customised one, so an empty/default copy from
  // one device can no longer wipe real data off the others (the bug that lost
  // Daniel's history on 2026-06-18). If our merge recovers something the cloud
  // was missing, we push the repaired copy back so all devices converge on it.
  function reconcile(remote) {
    const local = readJson(STORAGE.localData);

    if (!remote) {
      // Nothing in the cloud yet: seed it from this device, but never write a
      // blank/starter doc as the canonical copy.
      if (local && normalizeSoccerDurationInData(local)) {
        applyRecoveredData(local);
      }
      if (local && hasRealHistory(local)) {
        cloudSave(local).catch((e) => console.error("Initial cloud push failed:", e));
      }
      return;
    }

    if (!local) {
      // First run on this device: take the cloud copy as-is.
      const firstRun = structuredClone(remote);
      const soccerFixed = normalizeSoccerDurationInData(firstRun);
      applyRecoveredData(firstRun);
      if (soccerFixed) {
        cloudSave(firstRun).catch((e) => console.error("Soccer duration cloud repair failed:", e));
      }
      return;
    }

    const merged = mergeWorkoutData(local, remote);
    const soccerFixed = normalizeSoccerDurationInData(merged);

    // Keep a one-tap undo point whenever an incoming sync changes this device.
    if (dataChanged(local, merged)) pushLocalSnapshot("before sync", local);

    applyRecoveredData(merged);

    // Heal the cloud if our merge holds data the remote copy was missing.
    if (soccerFixed || dataChanged(merged, remote)) {
      cloudSave(merged).catch((e) => console.error("Cloud heal push failed:", e));
    }
  }

  authMod.onAuthStateChanged(fbAuth, (user) => {
    if (_cloudUnsub) { _cloudUnsub(); _cloudUnsub = null; }

    if (user) {
      // Profile-switch guard. The working copy in localStorage belongs to one
      // account at a time. If the person signing in is DIFFERENT from the one
      // who owns the device's current local copy, wipe that copy first so it
      // cannot bleed into - or, via reconcile()'s merge, overwrite and then get
      // pushed onto - the new account's cloud document. With local cleared,
      // reconcile() takes the first-run path and loads the new account's own
      // cloud data cleanly. The previous account's data stays safe in its own
      // users/{uid} document and version history. Same person re-signing in
      // (uid unchanged) keeps their local copy, including any unsynced edits.
      const prevOwner = localStorage.getItem(STORAGE.localDataOwner);
      if (prevOwner && prevOwner !== user.uid) {
        clearDeviceLocalData();
      }
      localStorage.setItem(STORAGE.localDataOwner, user.uid);

      cloudUser = { uid: user.uid, email: user.email, name: user.displayName || "" };
      _fbDoc = fsMod.doc(fbDb, "users", user.uid);
      // Listen for changes so the other device updates automatically.
      _cloudUnsub = fsMod.onSnapshot(_fbDoc, (snap) => {
        if (snap.metadata.hasPendingWrites) return; // ignore our own just-made save
        reconcile(snap.exists() ? snap.data() : null);
        // Replace the library with the photo/glyph set, then seed soccer - both
        // on top of the freshest synced data (each runs once). Doing it here, not
        // at startup, avoids a stale device overwriting newer cloud data.
        reseedLibraryOnce();
        mergeLibraryV3Once();
        refreshLibraryFieldsOnce();
        seedSoccerOnce();
        seedPelotonOnce();
        seedPickleballOnce();
        restoreSportTypesOnce();
        repairCatalogDataOnce();
        repairPelotonBikeHistoryOnce();
        repairSoccerDurationInvariant({ rerender: true });
      }, (error) => console.error("Cloud listener error:", error));
    } else {
      cloudUser = null;
      _fbDoc = null;
      // Signed out: the local cache belongs to whoever just left, so drop it.
      // No plan/history/progress should linger on the device while nobody is
      // signed in - that lingering cache is what let one account's data bleed
      // into another. The signed-out gate (updateCloudUi) covers the app until
      // someone signs in, at which point reconcile() loads their account fresh.
      // Library seeding intentionally does NOT run here anymore; it runs after
      // sign-in (in the snapshot handler), on top of that account's own data.
      clearDeviceLocalData();
    }
    authChecked = true;
    updateCloudUi();
  });

  // Finish a Google sign-in that returned via redirect.
  authMod.getRedirectResult(fbAuth).catch((error) => {
    console.error("Google sign-in error:", error);
    if (syncStatus) {
      syncStatus.textContent = `Sign-in did not finish: ${error.message}`;
      syncStatus.className = "sync-status bad";
    }
  });

  function showSignInError(error) {
    console.error("Sign-in failed:", error);
    if (syncStatus) {
      syncStatus.textContent = `Could not sign in: ${error.message}`;
      syncStatus.className = "sync-status bad";
    }
  }

  // Popup sign-in is the most reliable on desktop and avoids the redirect
  // session being dropped. If a popup is blocked (some phone setups), fall back
  // to the redirect style instead. Shared by both the Sign in and Switch account
  // buttons so the account-chooser behaviour is identical.
  function startSignIn() {
    authMod.signInWithPopup(fbAuth, provider).catch((error) => {
      const code = error?.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return; // user backed out; nothing to report
      }
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        authMod.signInWithRedirect(fbAuth, provider).catch(showSignInError);
        return;
      }
      showSignInError(error);
    });
  }

  cloudSignInButton?.addEventListener("click", startSignIn);
  document.querySelector("#gate-signin")?.addEventListener("click", startSignIn);

  // Sign out cleanly. Because signing out drops this device's local cache (so no
  // data lingers for the next person), push any unsynced edits up FIRST while we
  // still can - after sign-out we can no longer write to this account's document.
  async function signOutCurrentUser() {
    try {
      if (hasPendingData() && navigator.onLine) {
        const pending = readJson(STORAGE.pendingData);
        if (pending) { await uploadWorkoutData(pending); clearPendingData(); }
      }
    } catch (e) {
      console.error("Pre-sign-out sync skipped:", e);
    }
    await authMod.signOut(fbAuth);
  }

  cloudSignOutButton?.addEventListener("click", () => {
    signOutCurrentUser().catch((error) => console.error("Sign-out failed:", error));
  });

  // Switch account: sign out of the current profile, then immediately open the
  // Google account chooser to sign in as someone else (e.g. Daniel -> his wife).
  // When the new account differs from the one that owns this device's local copy,
  // onAuthStateChanged wipes that copy first (see clearDeviceLocalData), so each
  // profile loads cleanly from its own cloud document - no merging between people.
  // The previous profile's data stays safe in its own account; switching back
  // reloads it from the cloud. signOutCurrentUser() flushes any unsynced edits
  // up first. Confirm anyway, since it changes whose data is on screen.
  cloudSwitchButton?.addEventListener("click", async () => {
    const current = cloudUser ? (cloudUser.name || cloudUser.email || "this account") : "this account";
    const ok = await showConfirmModal({
      title: "Switch account?",
      message: `This signs out of ${current} and loads a different person's plan on this device. ${current}'s data stays safe in their own account and reloads when you switch back.`,
      confirmLabel: "Switch account",
      danger: false
    });
    if (!ok) return;
    try {
      await signOutCurrentUser();
    } catch (error) {
      console.error("Sign-out before switch failed:", error);
    }
    startSignIn();
  });

  updateCloudUi();
}

initCloud();
updateCloudUi();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // The shell still works if a browser skips service workers.
    });
  });
}
