const DROPBOX_AUTHORIZE_URL = "https://www.dropbox.com/oauth2/authorize";
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload";
const DROPBOX_DOWNLOAD_URL = "https://content.dropboxapi.com/2/files/download";
const DATA_FILE_PATH = "/04_Technical/06_Side_Projects/Workout and Nutrition App/data/workout-data.json";
const APP_VERSION = "2026.06.22-set-pages";

const STORAGE = {
  appKey: "trainingBookDropboxAppKey",
  verifier: "trainingBookDropboxVerifier",
  state: "trainingBookDropboxState",
  accessToken: "trainingBookDropboxAccessToken",
  accessTokenExpiresAt: "trainingBookDropboxAccessTokenExpiresAt",
  refreshToken: "trainingBookDropboxRefreshToken",
  localData: "trainingBookWorkoutData",
  pendingData: "trainingBookPendingWorkoutData",
  deviceId: "trainingBookDeviceId",
  activeTab: "trainingBookActiveTab",
  reviewReminderDismissed: "trainingBookReviewReminderDismissed",
  soccerSeeded: "trainingBookSoccerSeeded"
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
const todayBackButton = document.querySelector("#today-back-button");
const todayPreviewSub = document.querySelector("#today-preview-sub");
const todayDaySwitch = document.querySelector("#today-day-switch");
const todayDayName = document.querySelector("#today-day-name");
const dayPrevButton = document.querySelector("#day-prev");
const dayNextButton = document.querySelector("#day-next");
const dayTodayResetButton = document.querySelector("#day-today-reset");
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
const exerciseList = document.querySelector("#exercise-list");
const libraryCount = document.querySelector("#library-count");
const filterChips = Array.from(document.querySelectorAll(".filter-chip"));
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

// ===== Firebase cloud sync state (replaces the old Dropbox sync) =====
// These hold the signed-in user and the live database connection. They are
// filled in once Firebase loads (see initCloud at the bottom of this file).
let cloudUser = null;     // { uid, email } when signed in, else null
let _fbDoc = null;        // reference to this user's data document
let _setDoc = null;       // Firebase's save function, captured after it loads
let _cloudUnsub = null;   // function to stop listening for remote changes

// Save the whole data blob to the cloud database for the signed-in user.
async function cloudSave(data) {
  if (!_fbDoc || !_setDoc) throw new Error("Sign in to sync across your devices.");
  await _setDoc(_fbDoc, data);
}

// Update the header pill and the sync panel to reflect signed-in / signed-out.
function updateCloudUi() {
  const signedIn = Boolean(cloudUser);
  if (cloudSignInButton) cloudSignInButton.hidden = signedIn;
  if (cloudSignOutButton) cloudSignOutButton.hidden = !signedIn;
  if (syncPillLabel) syncPillLabel.textContent = signedIn ? "Synced" : "Sign in";
  if (syncPill) syncPill.className = signedIn ? "sync-pill good" : "sync-pill";
  if (syncStatus) {
    syncStatus.textContent = signedIn
      ? `Signed in as ${cloudUser.email}. Your workouts sync automatically across your devices.`
      : "Sign in with Google to sync your workouts across your phone and desktop.";
    syncStatus.className = signedIn ? "sync-status good" : "sync-status";
  }
}

if (appVersionLabel) {
  appVersionLabel.textContent = `Build ${APP_VERSION}`;
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

function getStarterExercises() {
  return [
  {
    id: "push-up",
    name: "Push-up",
    type: "strength",
    area: "Chest + triceps",
    icon: "pushup",
    tags: ["home", "gym", "bodyweight"]
  },
  {
    id: "dumbbell-bench-press",
    name: "Dumbbell Bench Press",
    type: "strength",
    area: "Chest",
    icon: "bench",
    tags: ["home", "gym", "dumbbells"]
  },
  {
    id: "squat",
    name: "Squat",
    type: "strength",
    area: "Legs",
    icon: "squat",
    tags: ["home", "gym", "bodyweight"]
  },
  {
    id: "goblet-squat",
    name: "Goblet Squat",
    type: "strength",
    area: "Legs",
    icon: "goblet",
    tags: ["home", "gym", "dumbbells"]
  },
  {
    id: "deadlift",
    name: "Deadlift",
    type: "strength",
    area: "Back + legs",
    icon: "deadlift",
    tags: ["gym", "barbell"]
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    type: "strength",
    area: "Back",
    icon: "pulldown",
    tags: ["gym", "machine"]
  },
  {
    id: "dumbbell-row",
    name: "Dumbbell Row",
    type: "strength",
    area: "Back",
    icon: "row",
    tags: ["home", "gym", "dumbbells"]
  },
  {
    id: "shoulder-press",
    name: "Shoulder Press",
    type: "strength",
    area: "Shoulders",
    icon: "press",
    tags: ["home", "gym", "dumbbells"]
  },
  {
    id: "plank",
    name: "Plank",
    type: "strength",
    area: "Core",
    icon: "plank",
    tags: ["home", "gym", "bodyweight"]
  },
  {
    id: "biceps-curl",
    name: "Biceps Curl",
    type: "strength",
    area: "Arms",
    icon: "curl",
    tags: ["home", "gym", "dumbbells"]
  },
  {
    id: "triceps-pressdown",
    name: "Triceps Pressdown",
    type: "strength",
    area: "Arms",
    icon: "pressdown",
    tags: ["gym", "machine"]
  },
  {
    id: "treadmill-walk",
    name: "Treadmill Walk",
    type: "cardio",
    area: "Cardio",
    icon: "treadmill",
    tags: ["gym", "cardio"]
  },
  getSoccerStarterExercise()
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

// One-time, additive seeding so Daniel can try the new soccer flow without
// hand-editing his data. It (1) adds the Soccer exercise to the library if it
// is missing and (2) drops a 60-minute Soccer move onto Thursday's routine so
// there is a real day to test. Guarded by a localStorage flag, so it never
// re-imposes itself if Daniel later removes soccer or reschedules via his AI
// coach. Never overwrites existing exercises or routines.
function seedSoccerOnce() {
  if (localStorage.getItem(STORAGE.soccerSeeded)) return;

  const data = getLocalData();
  let changed = false;

  // 1. Ensure the Soccer exercise exists in the library.
  if (Array.isArray(data.library) && !data.library.some((ex) => ex.id === "soccer")) {
    data.library = [...data.library, getSoccerStarterExercise()];
    changed = true;
  }

  // 2. Put Soccer on Thursday for an easy first test (additive).
  const routines = Array.isArray(data.routines) ? data.routines : [];
  const thursdayId = data.weeklyPlan?.thursday;
  const thursdayRoutine = routines.find((r) => r.id === thursdayId);
  if (thursdayRoutine) {
    const list = Array.isArray(thursdayRoutine.exercises) ? thursdayRoutine.exercises : [];
    if (!list.some((ex) => ex.exerciseId === "soccer")) {
      thursdayRoutine.exercises = [...list, { exerciseId: "soccer", targetDuration: 60 }];
      changed = true;
    }
  } else {
    // No routine on Thursday: make a dedicated Soccer day.
    routines.push({
      id: "soccer-day",
      name: "Soccer",
      location: "home",
      exercises: [{ exerciseId: "soccer", targetDuration: 60 }],
      notes: "Weekly soccer match"
    });
    data.routines = routines;
    data.weeklyPlan = { ...(data.weeklyPlan || {}), thursday: "soccer-day" };
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

// Reload the live exercise list from saved data (after an edit or a cloud sync).
function refreshLibrary() {
  const data = getLocalData();
  exercises = Array.isArray(data.library) ? data.library : getStarterExercises();
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
  // Slice 2b (built-in timer for held moves like a plank). Lives outside the
  // exercise list because it's about the live countdown, not saved data.
  timer: {
    total: 45000,      // chosen hold length in milliseconds
    remaining: 45000,  // milliseconds left on the current countdown
    running: false,    // true while counting down
    raf: null,         // requestAnimationFrame handle
    lastTs: 0,         // last animation timestamp, for accurate elapsed time
    finished: false    // true for a moment after hitting zero (drives the flash)
  }
};

// Held / "timed" moves are done for a number of seconds, not weight x reps
// (e.g. a plank held 3 x 45 sec). We detect them by id so existing plans work
// straight away; a future tweak can let custom exercises be tagged this way.
const TIMED_HOLD_IDS = ["plank", "side-plank", "wall-sit", "hollow-hold", "dead-hang", "l-sit"];

const EXERCISE_REFERENCES = {
  "push-up": {
    muscles: "Chest, shoulders, triceps, core",
    equipment: "Bodyweight",
    steps: [
      "Set your hands just wider than your shoulders and make a straight line from head to heels.",
      "Lower under control until your chest is close to the floor.",
      "Press the floor away and keep your hips from sagging."
    ],
    cues: ["Brace your ribs down.", "Keep elbows angled back, not straight out.", "Stop if shoulder pain shows up."]
  },
  "dumbbell-bench-press": {
    muscles: "Chest, shoulders, triceps",
    equipment: "Bench and dumbbells",
    steps: [
      "Lie back with feet planted and dumbbells over your chest.",
      "Lower the weights until your upper arms are just below the bench line.",
      "Press up smoothly without letting the dumbbells crash together."
    ],
    cues: ["Shoulder blades stay tucked.", "Wrists stay stacked over elbows.", "Use a weight you can control."]
  },
  squat: {
    muscles: "Quads, glutes, hamstrings, core",
    equipment: "Bodyweight or loaded variation",
    steps: [
      "Stand with feet about shoulder width and brace your torso.",
      "Sit down and back while your knees track in line with your toes.",
      "Drive through the floor to stand tall."
    ],
    cues: ["Keep your whole foot planted.", "Chest stays proud.", "Use a comfortable depth."]
  },
  "goblet-squat": {
    muscles: "Quads, glutes, core",
    equipment: "Dumbbell or kettlebell",
    steps: [
      "Hold the weight close to your chest with elbows pointed down.",
      "Squat between your hips while keeping the weight close.",
      "Stand by pushing through your midfoot and heels."
    ],
    cues: ["Do not let the weight pull you forward.", "Knees follow toes.", "Pause briefly if balance feels shaky."]
  },
  deadlift: {
    muscles: "Hamstrings, glutes, back, core",
    equipment: "Barbell or dumbbells",
    steps: [
      "Stand close to the weight and hinge your hips back.",
      "Grip the weight, brace, and keep your back neutral.",
      "Stand by driving your hips forward, then lower with control."
    ],
    cues: ["The weight stays close.", "Hips and chest rise together.", "Skip heavy pulls if your back feels off."]
  },
  "lat-pulldown": {
    muscles: "Lats, upper back, biceps",
    equipment: "Cable pulldown machine",
    steps: [
      "Sit tall and grip the bar wider than your shoulders.",
      "Pull elbows down toward your ribs until the bar reaches upper chest level.",
      "Return slowly until your arms are long again."
    ],
    cues: ["Lead with elbows, not hands.", "Do not lean way back.", "Keep shoulders away from ears."]
  },
  "dumbbell-row": {
    muscles: "Lats, upper back, biceps",
    equipment: "Dumbbell",
    steps: [
      "Support yourself with one hand or hinge with a steady torso.",
      "Pull the dumbbell toward your hip.",
      "Lower until your arm is long without twisting your body."
    ],
    cues: ["Keep your torso quiet.", "Think elbow to back pocket.", "Avoid shrugging at the top."]
  },
  "shoulder-press": {
    muscles: "Shoulders, triceps, upper chest",
    equipment: "Dumbbells or barbell",
    steps: [
      "Start with the weight at shoulder height and ribs braced.",
      "Press overhead until arms are long without arching hard.",
      "Lower back to shoulder height with control."
    ],
    cues: ["Squeeze glutes lightly.", "Keep wrists stacked.", "Use a pain-free path."]
  },
  plank: {
    muscles: "Core, shoulders, glutes",
    equipment: "Bodyweight",
    steps: [
      "Set elbows under shoulders and step feet back.",
      "Make a straight line from head to heels.",
      "Brace your belly and breathe while holding the position."
    ],
    cues: ["Squeeze glutes.", "Do not let hips sag.", "End the hold when position breaks."]
  },
  "biceps-curl": {
    muscles: "Biceps, forearms",
    equipment: "Dumbbells",
    steps: [
      "Stand tall with arms by your sides and palms forward.",
      "Curl the weights up without swinging your torso.",
      "Lower slowly until your elbows are straight again."
    ],
    cues: ["Elbows stay close to your sides.", "Control the lowering.", "Do not chase weight with momentum."]
  },
  "triceps-pressdown": {
    muscles: "Triceps",
    equipment: "Cable machine",
    steps: [
      "Stand tall at the cable with elbows pinned near your sides.",
      "Press the handle down until your arms are straight.",
      "Return slowly without letting elbows drift forward."
    ],
    cues: ["Only your forearms move.", "Keep shoulders relaxed.", "Finish with a firm squeeze."]
  },
  "treadmill-walk": {
    muscles: "Heart, legs, calves",
    equipment: "Treadmill",
    steps: [
      "Start at an easy pace and settle into a steady rhythm.",
      "Use incline or speed only if your breathing stays controlled.",
      "Cool down for a minute or two before stepping off."
    ],
    cues: ["Tall posture.", "Relax your grip.", "Stop if dizzy or sharp pain appears."]
  }
};

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
  const done = activeWorkout.exercises.filter((ex) => ex.checked).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return { total, done, percent };
}

function getExerciseById(exerciseId) {
  return exercises.find((exercise) => exercise.id === exerciseId) || null;
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
    icon: "pushup"
  };
  // Soccer and other "sport" moves log like cardio (a duration) but with free
  // notes instead of Peloton power numbers.
  const isSport = exerciseInfo.type === "sport";
  const isTimed = !isSport && isTimedHoldExercise(exerciseInfo, plannedEx);
  const isCardio = !isTimed && !isSport && (Boolean(plannedEx.targetDuration) || exerciseInfo.type === "cardio");
  const durationLike = isCardio || isSport;
  const targetSets = Number(plannedEx.targetSets) || (durationLike ? 0 : 3);
  const targetReps = Number(plannedEx.targetReps) || 0;
  const targetDuration = Number(plannedEx.targetDuration) || 0;

  // For a held move, the planned target reads like "3 x 45 sec": targetSets
  // holds, each held for some seconds. The seconds come through as the reps
  // number (e.g. "Plank: 3x45") or a duration; default to 45 if not given.
  const holdSeconds = isTimed ? (targetDuration || targetReps || 45) : 0;
  const holdCount = isTimed ? (targetSets || 1) : 0;
  const holds = Array.from({ length: holdCount }).map(() => ({ done: false }));

  // One row per planned set, each holding the weight/reps actually done and a
  // done flag you tap to check off. Pre-filled with the planned reps.
  const setCount = targetSets || (durationLike || isTimed ? 0 : 1);
  const sets = Array.from({ length: (isTimed || isSport) ? 0 : setCount }).map(() => ({
    weight: 0,
    reps: targetReps,
    done: false
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
    targetWeight: 0,
    sets,
    holds,
    holdSeconds,
    actualDuration: targetDuration || 30,
    cardioDone: false,
    // Optional Peloton/cardio summary numbers, typed by hand off the
    // machine's summary screen. Blank by default; never required.
    cardioOutput: "",
    cardioAvgPower: "",
    cardioDistance: "",
    // Sport moves (e.g. soccer): a "done" flag and a free-text note, alongside
    // the shared actualDuration minutes above.
    sportDone: false,
    sportNotes: "",
    difficulty: 5,
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

function renderReviewReminder() {
  if (!reviewReminder) return;

  const data = getLocalData();
  const activePlan = { ...getStarterActivePlan(), ...(data.activePlan || {}) };
  const reviewDate = (activePlan.nextReviewDate || "").trim();
  const today = getTodayDateString();

  // Only show when a valid review date is set and today is on or past it.
  const isDue = /^\d{4}-\d{2}-\d{2}$/.test(reviewDate) && today >= reviewDate;
  const dismissedToday = localStorage.getItem(STORAGE.reviewReminderDismissed) === today;

  if (!isDue || dismissedToday) {
    reviewReminder.hidden = true;
    return;
  }

  if (reviewReminderSub) {
    const overdue = today > reviewDate;
    reviewReminderSub.textContent = overdue
      ? `Your review was due ${formatWorkoutDate(reviewDate)}. Export a packet for your coach and load the updated plan.`
      : "Export a packet for your coach and load the updated plan.";
  }
  reviewReminder.hidden = false;
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
    return `${mins} min`;
  }
  if (exercise.targetReps) {
    return `${exercise.targetSets} × ${exercise.targetReps}`;
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

  todayRoutineList.innerHTML = items.map((ex, index) => `
    <article class="today-preview-card">
      <span class="pv-num">${index + 1}</span>
      <div class="pv-info">
        <h3 class="pv-name">${escapeHtml(ex.name)}</h3>
        <p class="pv-meta">${escapeHtml(formatPreviewMeta(ex))}</p>
      </div>
      ${ex.type === "sport" ? `<span class="pv-tag">SPORT</span>` : ((ex.type === "cardio" || ex.type === "timed") ? `<span class="pv-tag">TIMED</span>` : "")}
    </article>
  `).join("");
}

function startTodayWorkout() {
  const routine = getTodayPlannedRoutine();
  if (!routine) return;
  activeWorkout.started = true;
  activeWorkout.startedAt = new Date().toISOString();
  activeWorkout.currentIndex = 0;
  activeWorkout.currentSet = 0;
  activeWorkout.phase = "exercise";
  activeWorkout.editTargetsOpen = false;
  activeWorkout.referenceOpen = false;
  activeWorkout.exercises = routine.exercises.map((plannedEx) => makeTodayExercise(plannedEx));
  renderTodayRoutine();
}

function exitTodayWorkout() {
  stopTimer();
  activeWorkout.started = false;
  activeWorkout.exercises = [];
  activeWorkout.currentIndex = 0;
  activeWorkout.currentSet = 0;
  activeWorkout.phase = "exercise";
  activeWorkout.editTargetsOpen = false;
  activeWorkout.referenceOpen = false;
  renderTodayRoutine();
}

function renderTodayRoutine() {
  renderReviewReminder();

  if (!todayRoutineList) return;

  const routine = getTodayPlannedRoutine();

  if (!routine) {
    activeWorkout.exercises = [];
    activeWorkout.started = false;
    todayRoutineList.innerHTML = `
      <div class="empty-routine">
        <p class="eyebrow">No workout today</p>
        <p>You have a rest day scheduled. Tap the Log tab if you want to log an extra workout.</p>
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

  if (!activeWorkout.started) {
    renderTodayPreview(routine);
    setTodayMode("preview");
    updateTodayProgress();
    return;
  }

  setTodayMode("active");
  renderTodayWorkout();
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
  if (ex.type === "cardio") {
    return ex.cardioDone ? `${Number(ex.actualDuration) || 0} min${formatCardioStats(collectCardioStats(ex))}` : "Not logged";
  }
  if (ex.type === "sport") {
    if (!ex.sportDone) return "Not logged";
    const note = (ex.sportNotes || "").trim();
    return `${Number(ex.actualDuration) || 0} min${note ? " · note" : ""}`;
  }
  if (ex.type === "timed") {
    const doneHolds = (ex.holds || []).filter((hold) => hold.done).length;
    return doneHolds ? `${doneHolds} × ${ex.holdSeconds || 0} sec` : "Not logged";
  }
  const doneSets = (ex.sets || []).filter((set) => set.done);
  if (doneSets.length === 0) return "Not logged";
  const topWeight = Math.max(...doneSets.map((set) => Number(set.weight) || 0));
  const repsAtTop = doneSets.find((set) => (Number(set.weight) || 0) === topWeight)?.reps || 0;
  const weightPart = topWeight > 0 ? ` · ${topWeight} lb × ${repsAtTop}` : "";
  return `${doneSets.length} set${doneSets.length === 1 ? "" : "s"}${weightPart}`;
}

// Plain target line for the focused screen, e.g. "3 × 8" or "10 min".
function formatFocusTarget(ex) {
  if (ex.type === "timed") return `${(ex.holds || []).length} × ${ex.holdSeconds || 0} sec`;
  if (ex.type === "cardio" || ex.type === "sport") return `${ex.targetDuration || ex.actualDuration || 0} min`;
  if (ex.targetReps) return `${ex.targetSets || (ex.sets || []).length} × ${ex.targetReps}`;
  return `${ex.targetSets || (ex.sets || []).length} sets`;
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
      ${renderTargetStepper("Weight", "targetWeight", ex.targetWeight || 0, 5, 0, 1000, "lb")}
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

function getExerciseReference(ex) {
  return EXERCISE_REFERENCES[ex.exerciseId] || {
    muscles: ex.area || "Main working area",
    equipment: ex.type === "cardio" ? "Cardio equipment" : "As planned",
    steps: [
      "Set up in a comfortable, controlled position.",
      "Move slowly enough that you can keep good form.",
      "Stop the set if you feel sharp pain or lose control."
    ],
    cues: ["Smooth reps.", "Steady breathing.", "Good form first."]
  };
}

function renderReferenceSheet(ex) {
  if (!activeWorkout.referenceOpen) return "";
  const ref = getExerciseReference(ex);

  return `
    <div class="lw-sheet-scrim" role="presentation">
      <section class="lw-sheet lw-reference-sheet" role="dialog" aria-modal="true" aria-label="How to do ${escapeHtml(ex.name)}">
        <div class="lw-sheet-head">
          <div>
            <h3>${escapeHtml(ex.name)}</h3>
            <p>${escapeHtml(ref.muscles)}</p>
          </div>
          <button class="lw-sheet-close" type="button" data-action="close-reference" aria-label="Close how to do it">&times;</button>
        </div>
        <div class="lw-ref-meta">
          <span>${escapeHtml(ref.equipment)}</span>
          <span>${escapeHtml(ex.type === "timed" ? "Timed hold" : ex.type)}</span>
        </div>
        <ol class="lw-ref-steps">
          ${ref.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ol>
        <div class="lw-ref-cues">
          ${ref.cues.map((cue) => `<span>${escapeHtml(cue)}</span>`).join("")}
        </div>
        <button class="primary-button lw-sheet-done" type="button" data-action="close-reference">Done</button>
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
      done: false
    });
  }
  while (sets.length > safeCount) sets.pop();
  ex.sets = sets;
  ex.targetSets = safeCount;
}

function resizeTodayHolds(ex, count) {
  const holds = Array.isArray(ex.holds) ? ex.holds : [];
  const safeCount = clampNumber(count, 1, 10);
  while (holds.length < safeCount) holds.push({ done: false });
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

function renderFocusedExercise() {
  const exercises = activeWorkout.exercises;
  const i = activeWorkout.currentIndex;
  const ex = exercises[i];
  const total = exercises.length;
  const routineName = todayRoutineName?.textContent || "Workout";
  const isLast = i >= total - 1;

  // Strength exercises page one set at a time; keep the set index in range
  // (0..sets.length, where sets.length is the wrap "add another set?" page).
  if (ex.type === "strength") {
    activeWorkout.currentSet = clampNumber(activeWorkout.currentSet, 0, (ex.sets || []).length);
  }
  const nextLabel = isLast
    ? "Finish workout &rarr;"
    : `Next: ${escapeHtml(exercises[i + 1].name)} &rarr;`;

  let body;
  if (ex.type === "timed") {
    // Held move (e.g. plank): a real countdown timer with presets and one
    // tappable pill per hold. Point the timer at this exercise on first view.
    if (activeWorkout.timer.exerciseId !== ex.id) initTimerForExercise(ex);
    const t = activeWorkout.timer;
    const running = t.running;
    const lock = running ? " disabled" : "";
    const presets = [30, 45, 60, 90];
    const toggleLabel = running
      ? "Pause"
      : (t.remaining < t.total && t.remaining > 0 ? "Resume" : "Start");
    body = `
      <div class="lw-timer${running ? " is-running" : ""}${t.finished ? " is-finished" : ""}">
        <div class="lw-timer-num${t.finished ? " flash" : ""}" id="lw-timer-num" aria-live="off">${formatTimer(t.remaining)}</div>
        <div class="lw-presets">
          ${presets.map((sec) => `<button class="lw-preset${ex.holdSeconds === sec ? " on" : ""}" type="button" data-action="timer-preset" data-seconds="${sec}"${lock}>${sec}s</button>`).join("")}
        </div>
        <div class="lw-timer-controls">
          <button class="lw-tbtn primary" type="button" data-action="timer-toggle">${toggleLabel}</button>
          <button class="lw-tbtn" type="button" data-action="timer-reset"${lock}>Reset</button>
        </div>
        <div class="lw-pills">
          ${(ex.holds || []).map((hold, hi) => `<button class="lw-pill${hold.done ? " is-done" : ""}" type="button" data-action="toggle-hold" data-hold-index="${hi}"${lock} aria-label="Mark hold ${hi + 1} done">${hi + 1}</button>`).join("")}
        </div>
        <p class="lw-note">${t.finished ? "Time&rsquo;s up! Tap the hold below to log it, then start the next one." : "Tap a number to mark each hold done."}</p>
      </div>
    `;
  } else if (ex.type === "cardio") {
    body = `
      <div class="lw-cardio">
        <label class="lw-field lw-field-lg">
          <input type="number" inputmode="numeric" min="0" step="1" value="${escapeHtml(ex.actualDuration)}" data-action="cardio-minutes" aria-label="Minutes for ${escapeHtml(ex.name)}">
          <span>min</span>
        </label>
        <button class="lw-bigcheck${ex.cardioDone ? " is-done" : ""}" type="button" data-action="toggle-cardio">${ex.cardioDone ? "Done &#10003;" : "Mark done"}</button>
      </div>
      <details class="lw-cardio-stats"${(ex.cardioOutput || ex.cardioAvgPower || ex.cardioDistance) ? " open" : ""}>
        <summary>Peloton stats (optional)</summary>
        <div class="lw-cardio-stat-grid">
          <label class="lw-field">
            <input type="number" inputmode="decimal" min="0" step="1" value="${escapeHtml(ex.cardioOutput)}" data-action="cardio-stat" data-field="cardioOutput" aria-label="Total output in kilojoules" placeholder="0">
            <span>kJ</span>
          </label>
          <label class="lw-field">
            <input type="number" inputmode="decimal" min="0" step="1" value="${escapeHtml(ex.cardioAvgPower)}" data-action="cardio-stat" data-field="cardioAvgPower" aria-label="Average power in watts" placeholder="0">
            <span>watts</span>
          </label>
          <label class="lw-field">
            <input type="number" inputmode="decimal" min="0" step="0.1" value="${escapeHtml(ex.cardioDistance)}" data-action="cardio-stat" data-field="cardioDistance" aria-label="Distance in miles" placeholder="0">
            <span>mi</span>
          </label>
        </div>
        <p class="lw-cardio-stat-hint">Total output, average power, and distance from your Peloton summary. Leave any blank.</p>
      </details>
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
      body = `
        <div class="lw-setpage" data-set-index="${s}">
          <p class="lw-setpage-num">Set ${s + 1} of ${n}</p>
          <div class="lw-bigstep">
            <span class="lw-bigstep-label">Weight</span>
            <div class="lw-bigstep-row">
              <button class="lw-wbtn lw-wbtn-lg" type="button" data-action="set-weight-step" data-set-index="${s}" data-delta="-5" aria-label="Lower weight 5 pounds">&minus;</button>
              <span class="lw-bigstep-val"><strong>${escapeHtml(set.weight)}</strong> lb</span>
              <button class="lw-wbtn lw-wbtn-lg" type="button" data-action="set-weight-step" data-set-index="${s}" data-delta="5" aria-label="Raise weight 5 pounds">+</button>
            </div>
          </div>
          <div class="lw-bigstep">
            <span class="lw-bigstep-label">Reps</span>
            <div class="lw-bigstep-row">
              <button class="lw-wbtn lw-wbtn-lg" type="button" data-action="set-reps-step" data-set-index="${s}" data-delta="-1" aria-label="Lower reps">&minus;</button>
              <span class="lw-bigstep-val"><strong>${escapeHtml(set.reps)}</strong></span>
              <button class="lw-wbtn lw-wbtn-lg" type="button" data-action="set-reps-step" data-set-index="${s}" data-delta="1" aria-label="Raise reps">+</button>
            </div>
          </div>
          <div class="lw-setpage-actions">
            <button class="lw-skip" type="button" data-action="skip-set">Skip set</button>
            <button class="primary-button lw-complete" type="button" data-action="complete-set">Complete set &#10003;</button>
          </div>
        </div>
      `;
    }
  }

  todayRoutineList.innerHTML = `
    <div class="live-workout">
      <div class="lw-topbar">
        <button class="quiet-button small-button btn-ico lw-back" type="button" data-action="lw-back" aria-label="${i > 0 ? "Previous exercise" : "Back to plan"}">${getUiIcon("arrow-left")}</button>
        <span class="lw-count">${i + 1} of ${total}</span>
        <button class="lw-exit" type="button" data-action="lw-exit">Exit</button>
      </div>
      <div class="lw-dots">${renderProgressDots(i, total, false)}</div>
      <div class="lw-hero">
        <div class="lw-hero-icon" aria-hidden="true">${getExerciseIcon(ex.icon)}</div>
        <div class="lw-hero-text">
          <h3 class="lw-name">${escapeHtml(ex.name)}</h3>
          <p class="lw-area">${escapeHtml(ex.area || "")}</p>
        </div>
      </div>
      <div class="lw-target">
        <span>Target: <strong>${escapeHtml(formatFocusTarget(ex))}</strong></span>
        <button class="lw-edit-targets" type="button" data-action="open-targets"${activeWorkout.timer.running ? " disabled" : ""}>Edit targets</button>
      </div>
      <button class="lw-reference-button" type="button" data-action="open-reference">How to do it</button>
      ${body}
      ${ex.type === "strength" ? "" : `
      <div class="lw-next-row">
        <button class="primary-button lw-next" type="button" data-action="lw-next">${nextLabel}</button>
      </div>`}
      ${renderEditTargetsSheet(ex)}
      ${renderReferenceSheet(ex)}
    </div>
  `;
}

function renderFinishScreen() {
  const exercises = activeWorkout.exercises;
  const total = exercises.length;
  const routineName = todayRoutineName?.textContent || "Workout";
  const loggedCount = exercises.filter(isExerciseLogged).length;

  todayRoutineList.innerHTML = `
    <div class="live-workout lw-finish-screen">
      <div class="lw-dots">${renderProgressDots(total, total, true)}</div>
      <div class="lw-finish">
        <div class="lw-ring" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>
        </div>
        <h3 class="lw-finish-title">Workout complete</h3>
        <p class="lw-finish-sub">${escapeHtml(routineName)} · ${loggedCount} of ${total} logged</p>
        <div class="lw-recap">
          ${exercises.map((ex) => `
            <div class="lw-recap-row">
              <span>${escapeHtml(ex.name)}</span>
              <b>${escapeHtml(formatExerciseRecap(ex))}</b>
            </div>
          `).join("")}
        </div>
        <button class="primary-button lw-save" type="button" data-action="finish-save">Save workout</button>
        <button class="quiet-button lw-finish-back" type="button" data-action="finish-back">Back to plan</button>
      </div>
    </div>
  `;
}

function renderTodayWorkout() {
  if (!todayRoutineList) return;

  if (!activeWorkout.exercises.length) {
    exitTodayWorkout();
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
  if (!exercise) return;

  if (action === "set-field") {
    const si = Number(input.dataset.setIndex);
    const field = input.dataset.field;
    const set = exercise.sets?.[si];
    if (set && (field === "weight" || field === "reps")) {
      set[field] = clampNumber(input.value, 0, 9999);
    }
    return;
  }

  if (action === "cardio-minutes") {
    exercise.actualDuration = clampNumber(input.value, 0, 1000);
    return;
  }

  if (action === "sport-notes") {
    // Keep notes as typed (free text); never required.
    exercise.sportNotes = input.value;
    return;
  }

  if (action === "cardio-stat") {
    const field = input.dataset.field;
    if (field === "cardioOutput" || field === "cardioAvgPower" || field === "cardioDistance") {
      // Keep as a string so an empty box stays empty rather than becoming 0.
      exercise[field] = input.value;
    }
  }
}

// Pull the filled-in Peloton numbers off a live cardio exercise into a small
// object (only the ones actually entered). Returns null if none were filled.
function collectCardioStats(ex) {
  const stats = {};
  const output = Number(ex.cardioOutput);
  const avgPower = Number(ex.cardioAvgPower);
  const distance = Number(ex.cardioDistance);
  if (output > 0) stats.output = output;
  if (avgPower > 0) stats.avgPower = avgPower;
  if (distance > 0) stats.distance = distance;
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

// Point the live timer at a held exercise: set the countdown to its chosen
// hold length and clear any previous run.
function initTimerForExercise(ex) {
  const t = activeWorkout.timer;
  cancelAnimationFrame(t.raf);
  const ms = Math.max(1, Number(ex.holdSeconds) || 45) * 1000;
  t.total = ms;
  t.remaining = ms;
  t.running = false;
  t.finished = false;
  t.lastTs = 0;
  t.exerciseId = ex.id;
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

function handleTodayWorkoutClick(event) {
  const button = event.target.closest("button");
  if (!button) return;
  const action = button.dataset.action;
  const exercise = getActiveExercise();

  if (action === "lw-back") {
    stopTimer();
    activeWorkout.editTargetsOpen = false;
    activeWorkout.referenceOpen = false;
    // Within a strength exercise, step back one set page first.
    if (exercise && exercise.type === "strength" && activeWorkout.currentSet > 0) {
      activeWorkout.currentSet -= 1;
      renderTodayWorkout();
      return;
    }
    if (activeWorkout.currentIndex > 0) {
      activeWorkout.currentIndex -= 1;
      // Land on the previous exercise's last set, if it's a strength move.
      const prev = activeWorkout.exercises[activeWorkout.currentIndex];
      activeWorkout.currentSet = (prev && prev.type === "strength")
        ? Math.max(0, (prev.sets || []).length - 1)
        : 0;
      renderTodayWorkout();
    } else {
      exitTodayWorkout();
    }
    return;
  }

  if (action === "lw-exit") {
    if (!window.confirm("Exit this workout? Anything you haven't saved will be cleared.")) return;
    exitTodayWorkout();
    return;
  }

  if (action === "lw-next") {
    stopTimer();
    activeWorkout.editTargetsOpen = false;
    activeWorkout.referenceOpen = false;
    if (activeWorkout.currentIndex < activeWorkout.exercises.length - 1) {
      activeWorkout.currentIndex += 1;
      activeWorkout.currentSet = 0;
    } else {
      activeWorkout.phase = "finish";
    }
    renderTodayWorkout();
    return;
  }

  if (action === "timer-toggle" && exercise) {
    const t = activeWorkout.timer;
    if (t.exerciseId !== exercise.id) initTimerForExercise(exercise);
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
    return;
  }

  if (action === "timer-reset" && exercise) {
    const t = activeWorkout.timer;
    if (t.running) return;
    t.remaining = t.total;
    t.finished = false;
    t.lastTs = 0;
    renderTodayWorkout();
    return;
  }

  if (action === "timer-preset" && exercise) {
    if (activeWorkout.timer.running) return; // locked while running
    exercise.holdSeconds = Number(button.dataset.seconds) || 45;
    initTimerForExercise(exercise);
    renderTodayWorkout();
    return;
  }

  if (action === "toggle-hold" && exercise) {
    if (activeWorkout.timer.running) return; // locked while running
    const hi = Number(button.dataset.holdIndex);
    const hold = exercise.holds?.[hi];
    if (hold) hold.done = !hold.done;
    renderTodayWorkout();
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
    return;
  }

  if (action === "set-weight-step" && exercise) {
    const si = Number(button.dataset.setIndex);
    const set = exercise.sets?.[si];
    if (set) {
      const delta = Number(button.dataset.delta) || 0;
      set.weight = clampNumber((Number(set.weight) || 0) + delta, 0, 9999);
      renderTodayWorkout();
    }
    return;
  }

  if (action === "set-reps-step" && exercise) {
    const si = Number(button.dataset.setIndex);
    const set = exercise.sets?.[si];
    if (set) {
      const delta = Number(button.dataset.delta) || 0;
      set.reps = clampNumber((Number(set.reps) || 0) + delta, 0, 9999);
      renderTodayWorkout();
    }
    return;
  }

  // Complete / Skip drive the one-set-per-page flow: mark the set, then advance
  // to the next set (or the wrap page once past the last set).
  if ((action === "complete-set" || action === "skip-set") && exercise) {
    const s = activeWorkout.currentSet;
    const set = exercise.sets?.[s];
    if (set) set.done = action === "complete-set";
    activeWorkout.currentSet = s + 1;
    renderTodayWorkout();
    return;
  }

  if (action === "add-set-page" && exercise) {
    const last = exercise.sets?.[exercise.sets.length - 1];
    exercise.sets.push({
      weight: last ? last.weight : 0,
      reps: last ? last.reps : (exercise.targetReps || 0),
      done: false
    });
    activeWorkout.currentSet = exercise.sets.length - 1;
    renderTodayWorkout();
    return;
  }

  if (action === "toggle-set" && exercise) {
    const si = Number(button.dataset.setIndex);
    const set = exercise.sets?.[si];
    if (set) set.done = !set.done;
    renderTodayWorkout();
    return;
  }

  if (action === "add-set" && exercise) {
    const last = exercise.sets?.[exercise.sets.length - 1];
    exercise.sets.push({
      weight: last ? last.weight : 0,
      reps: last ? last.reps : (exercise.targetReps || 0),
      done: false
    });
    renderTodayWorkout();
    return;
  }

  if (action === "remove-set" && exercise) {
    if ((exercise.sets || []).length > 1) exercise.sets.pop();
    renderTodayWorkout();
    return;
  }

  if (action === "toggle-cardio" && exercise) {
    exercise.cardioDone = !exercise.cardioDone;
    renderTodayWorkout();
    return;
  }

  if (action === "toggle-sport" && exercise) {
    exercise.sportDone = !exercise.sportDone;
    renderTodayWorkout();
    return;
  }

  if (action === "finish-back") {
    exitTodayWorkout();
    return;
  }

  if (action === "finish-save") {
    saveTodayWorkout().catch((error) => {
      console.error("Error saving today's workout:", error);
      alert(`Error: ${error.message}`);
    });
  }
}

async function saveTodayWorkout() {
  const routine = getTodayPlannedRoutine();
  if (!routine) {
    alert("No workout planned for today.");
    return;
  }

  const loggedExercises = activeWorkout.exercises.filter(isExerciseLogged);
  if (loggedExercises.length === 0) {
    alert("Check off at least one set before saving.");
    return;
  }

  const data = getLocalData();
  const savedAt = new Date().toISOString();
  data.updatedAt = savedAt;
  data.updatedBy = getDeviceId();
  data.workouts = Array.isArray(data.workouts) ? data.workouts : [];

  const loggedEntries = loggedExercises
    .map((ex) => {
      if (ex.type === "cardio") {
        const stats = collectCardioStats(ex);
        const entry = {
          id: ex.id,
          type: "cardio",
          exerciseId: ex.exerciseId,
          exerciseName: ex.name,
          planned: {
            durationMinutes: ex.targetDuration || 0
          },
          durationMinutes: Number(ex.actualDuration) || 0,
          done: true,
          difficulty: Number(ex.difficulty) || 5
        };
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
          difficulty: Number(ex.difficulty) || 5
        };
        if (note) entry.notes = note;
        return entry;
      }

      // Held move: record how many holds were completed and the seconds each
      // (e.g. "3 x 45 sec"). Kept separate from steady cardio minutes.
      if (ex.type === "timed") {
        const doneHolds = (ex.holds || []).filter((hold) => hold.done).length;
        return {
          id: ex.id,
          type: "timed",
          exerciseId: ex.exerciseId,
          exerciseName: ex.name,
          planned: {
            sets: ex.targetSets || (ex.holds || []).length,
            seconds: ex.holdSeconds || 0
          },
          actualSummary: {
            sets: doneHolds,
            seconds: Number(ex.holdSeconds) || 0
          },
          difficulty: Number(ex.difficulty) || 5
        };
      }

      // Save the sets that were actually checked off, each with its own
      // weight and reps. The summary keeps History's one-line view working.
      const doneSets = (ex.sets || []).filter((set) => set.done);
      const topWeight = doneSets.reduce((max, set) => Math.max(max, Number(set.weight) || 0), 0);
      const repsAtTop = doneSets.find((set) => (Number(set.weight) || 0) === topWeight)?.reps || 0;

      return {
        id: ex.id,
        type: "strength",
        exerciseId: ex.exerciseId,
        exerciseName: ex.name,
        planned: {
          sets: ex.targetSets || 0,
          reps: ex.targetReps || 0
        },
        actualSummary: {
          sets: doneSets.length,
          reps: Number(repsAtTop) || 0,
          weight: Number(topWeight) || 0
        },
        sets: doneSets.map((set, i) => ({
          id: `set-${i + 1}`,
          setNumber: i + 1,
          reps: Number(set.reps) || 0,
          weight: Number(set.weight) || 0,
          done: true
        })),
        difficulty: Number(ex.difficulty) || 5
      };
    });

  const savedWorkout = {
    id: `workout-${Date.now()}-${randomString(6)}`,
    name: routine.name,
    date: getTodayDateString(),
    startedAt: activeWorkout.startedAt,
    savedAt,
    createdBy: getDeviceId(),
    fromRoutine: routine.id,
    routineName: routine.name,
    entries: loggedEntries
  };

  data.workouts.push(savedWorkout);
  markTodayAsCompleted();
  saveLocalData(data);
  markPendingData(data);

  if (!navigator.onLine) {
    alert("Workout saved on this device. It will sync when internet is back.");
    activeWorkout.exercises = [];
    activeWorkout.started = false;
    activeWorkout.currentIndex = 0;
    activeWorkout.phase = "exercise";
    activeWorkout.editTargetsOpen = false;
    activeWorkout.referenceOpen = false;
    resetViewedDayToToday();
    renderTodayRoutine();
    renderHistory();
    return;
  }

  try {
    await uploadWorkoutData(data);
    clearPendingData();
    alert("Workout saved and synced!");
    activeWorkout.exercises = [];
    activeWorkout.started = false;
    activeWorkout.currentIndex = 0;
    activeWorkout.phase = "exercise";
    activeWorkout.editTargetsOpen = false;
    activeWorkout.referenceOpen = false;
    resetViewedDayToToday();
    renderTodayRoutine();
    renderHistory();
  } catch (error) {
    alert(`${error.message} Workout is saved on this device for now.`);
    renderHistory();
  }
}

const savedAppKey = localStorage.getItem(STORAGE.appKey);
if (savedAppKey && appKeyInput) {
  appKeyInput.value = savedAppKey;
}

function showScreen(name, remember = false) {
  const validName = screens.some((screen) => screen.dataset.screen === name) ? name : "today";
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
    completedWorkouts: [],
    missedWorkouts: [],
    testEntries: [],
    workouts: [],
    bodyWeights: [],
    weightTarget: null
  };
}

function getStarterActivePlan() {
  return {
    name: "Current Training Plan",
    mainGoal: "",
    notes: "",
    reviewCadence: "Weekly AI review",
    nextReviewDate: ""
  };
}

function getStarterRoutines() {
  return [
    {
      id: "gym-bench",
      name: "Gym Bench",
      location: "gym",
      exercises: [
        { exerciseId: "dumbbell-bench-press", targetSets: 3, targetReps: 8 },
        { exerciseId: "dumbbell-row", targetSets: 3, targetReps: 8 },
        { exerciseId: "biceps-curl", targetSets: 3, targetReps: 10 }
      ],
      notes: "Barbell or dumbbell bench as anchor"
    },
    {
      id: "home-strength",
      name: "Home Strength",
      location: "home",
      exercises: [
        { exerciseId: "shoulder-press", targetSets: 3, targetReps: 8 },
        { exerciseId: "goblet-squat", targetSets: 3, targetReps: 10 },
        { exerciseId: "biceps-curl", targetSets: 3, targetReps: 12 },
        { exerciseId: "triceps-pressdown", targetSets: 2, targetReps: 12 }
      ],
      notes: "Dumbbell-focused at home"
    },
    {
      id: "gym-back",
      name: "Gym Back",
      location: "gym",
      exercises: [
        { exerciseId: "lat-pulldown", targetSets: 3, targetReps: 8 },
        { exerciseId: "dumbbell-row", targetSets: 3, targetReps: 8 },
        { exerciseId: "deadlift", targetSets: 3, targetReps: 5 }
      ],
      notes: "Pull-focused using rack and machines"
    },
    {
      id: "peloton-cardio",
      name: "Peloton Cardio",
      location: "home",
      exercises: [
        { exerciseId: "treadmill-walk", targetDuration: 30 }
      ],
      notes: "Bike or treadmill, duration-based"
    },
    {
      id: "home-core",
      name: "Home Core",
      location: "home",
      exercises: [
        { exerciseId: "plank", targetSets: 3, targetReps: 45 },
        { exerciseId: "push-up", targetSets: 3, targetReps: 10 },
        { exerciseId: "squat", targetSets: 2, targetReps: 15 }
      ],
      notes: "Bodyweight core and mat work"
    }
  ];
}

function getStarterWeeklyPlan() {
  return {
    monday: "gym-bench",
    tuesday: "home-strength",
    wednesday: "peloton-cardio",
    thursday: "home-core",
    friday: "gym-back",
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

  // Migrate old data to include routines and weekly plan if missing
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

  return data;
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE.localData, JSON.stringify(data));
}

function markPendingData(data) {
  localStorage.setItem(STORAGE.pendingData, JSON.stringify(data));
  updateConnectionState();
}

function clearPendingData() {
  localStorage.removeItem(STORAGE.pendingData);
  updateConnectionState();
}

function hasPendingData() {
  return Boolean(localStorage.getItem(STORAGE.pendingData));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getExerciseIcon(name) {
  const icons = {
    pushup: '<line x1="24" y1="74" x2="92" y2="74"></line><circle cx="34" cy="45" r="9"></circle><line x1="43" y1="48" x2="68" y2="58"></line><line x1="68" y1="58" x2="90" y2="52"></line><line x1="56" y1="54" x2="47" y2="75"></line><line x1="74" y1="56" x2="76" y2="75"></line>',
    bench: '<line x1="20" y1="75" x2="94" y2="75"></line><line x1="30" y1="75" x2="26" y2="93"></line><line x1="82" y1="75" x2="88" y2="93"></line><circle cx="40" cy="49" r="8"></circle><line x1="48" y1="52" x2="72" y2="60"></line><line x1="31" y1="43" x2="84" y2="43"></line><line x1="31" y1="37" x2="31" y2="49"></line><line x1="84" y1="37" x2="84" y2="49"></line>',
    squat: '<circle cx="58" cy="27" r="8"></circle><line x1="58" y1="35" x2="48" y2="58"></line><line x1="48" y1="58" x2="66" y2="70"></line><line x1="66" y1="70" x2="82" y2="88"></line><line x1="49" y1="58" x2="35" y2="78"></line><line x1="35" y1="78" x2="25" y2="92"></line><line x1="40" y1="45" x2="74" y2="45"></line>',
    goblet: '<circle cx="58" cy="25" r="8"></circle><line x1="58" y1="33" x2="56" y2="54"></line><rect x="48" y="43" width="18" height="18" rx="4"></rect><line x1="49" y1="58" x2="37" y2="78"></line><line x1="37" y1="78" x2="27" y2="92"></line><line x1="62" y1="58" x2="76" y2="78"></line><line x1="76" y1="78" x2="88" y2="92"></line>',
    deadlift: '<line x1="20" y1="84" x2="94" y2="84"></line><circle cx="22" cy="84" r="8"></circle><circle cx="92" cy="84" r="8"></circle><circle cx="58" cy="31" r="8"></circle><line x1="58" y1="39" x2="50" y2="61"></line><line x1="50" y1="61" x2="42" y2="82"></line><line x1="50" y1="61" x2="68" y2="82"></line><line x1="47" y1="56" x2="37" y2="82"></line><line x1="55" y1="57" x2="69" y2="82"></line>',
    pulldown: '<line x1="28" y1="24" x2="86" y2="24"></line><line x1="58" y1="24" x2="58" y2="43"></line><circle cx="58" cy="52" r="8"></circle><line x1="58" y1="60" x2="58" y2="83"></line><line x1="31" y1="35" x2="49" y2="60"></line><line x1="85" y1="35" x2="67" y2="60"></line><line x1="48" y1="84" x2="38" y2="97"></line><line x1="66" y1="84" x2="76" y2="97"></line>',
    row: '<circle cx="38" cy="37" r="8"></circle><line x1="46" y1="42" x2="67" y2="56"></line><line x1="67" y1="56" x2="86" y2="48"></line><line x1="52" y1="50" x2="40" y2="77"></line><line x1="58" y1="52" x2="72" y2="82"></line><rect x="84" y="42" width="14" height="13" rx="3"></rect><line x1="25" y1="84" x2="92" y2="84"></line>',
    press: '<circle cx="58" cy="45" r="8"></circle><line x1="58" y1="53" x2="58" y2="78"></line><line x1="38" y1="31" x2="48" y2="52"></line><line x1="78" y1="31" x2="68" y2="52"></line><line x1="34" y1="29" x2="44" y2="24"></line><line x1="73" y1="24" x2="83" y2="29"></line><line x1="49" y1="78" x2="40" y2="95"></line><line x1="67" y1="78" x2="76" y2="95"></line>',
    plank: '<line x1="22" y1="76" x2="94" y2="76"></line><circle cx="35" cy="47" r="8"></circle><line x1="43" y1="50" x2="68" y2="55"></line><line x1="68" y1="55" x2="91" y2="64"></line><line x1="50" y1="51" x2="42" y2="76"></line><line x1="85" y1="62" x2="80" y2="76"></line>',
    curl: '<circle cx="58" cy="31" r="8"></circle><line x1="58" y1="39" x2="58" y2="66"></line><line x1="49" y1="45" x2="41" y2="66"></line><line x1="67" y1="45" x2="79" y2="60"></line><rect x="77" y="56" width="13" height="12" rx="3"></rect><line x1="51" y1="67" x2="43" y2="92"></line><line x1="65" y1="67" x2="75" y2="92"></line>',
    pressdown: '<line x1="58" y1="20" x2="58" y2="40"></line><line x1="43" y1="40" x2="73" y2="40"></line><circle cx="58" cy="52" r="8"></circle><line x1="58" y1="60" x2="58" y2="82"></line><line x1="43" y1="57" x2="49" y2="79"></line><line x1="73" y1="57" x2="67" y2="79"></line><line x1="48" y1="80" x2="39" y2="90"></line><line x1="68" y1="80" x2="77" y2="90"></line>',
    treadmill: '<rect x="22" y="70" width="70" height="16" rx="5"></rect><line x1="77" y1="70" x2="66" y2="44"></line><line x1="66" y1="44" x2="82" y2="44"></line><circle cx="49" cy="28" r="8"></circle><line x1="49" y1="36" x2="54" y2="57"></line><line x1="54" y1="57" x2="43" y2="70"></line><line x1="55" y1="57" x2="68" y2="70"></line>',
    soccer: '<circle cx="58" cy="58" r="30"></circle><polygon points="58,44 70,53 65,67 51,67 46,53"></polygon><line x1="58" y1="44" x2="58" y2="30"></line><line x1="70" y1="53" x2="83" y2="46"></line><line x1="65" y1="67" x2="74" y2="80"></line><line x1="51" y1="67" x2="42" y2="80"></line><line x1="46" y1="53" x2="33" y2="46"></line>'
  };

  return `<svg viewBox="0 0 116 116" role="img" aria-label="${escapeHtml(name)} line illustration">${icons[name] || icons.pushup}</svg>`;
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
  "trash-2": '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
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

// Library tab state: the filter currently selected, and the id of the
// exercise being edited inline (null when nothing is being edited).
let currentLibraryFilter = "all";
let editingExerciseId = null;

function renderExercises(filter = currentLibraryFilter) {
  if (!exerciseList) return;
  currentLibraryFilter = filter;

  const visibleExercises = filter === "all"
    ? exercises
    : exercises.filter((exercise) => (exercise.tags || []).includes(filter));

  if (libraryCount) {
    const label = visibleExercises.length === 1 ? "exercise" : "exercises";
    libraryCount.textContent = `${visibleExercises.length} ${label}`;
  }

  if (visibleExercises.length === 0) {
    exerciseList.innerHTML = `<p class="library-empty">No exercises here yet. Add one above to get started.</p>`;
    return;
  }

  exerciseList.innerHTML = visibleExercises.map((exercise) =>
    exercise.id === editingExerciseId
      ? renderExerciseEditCard(exercise)
      : renderExerciseCard(exercise)
  ).join("");
}

function renderExerciseCard(exercise) {
  const tags = exercise.tags || [];
  return `
    <article class="exercise-card">
      <div class="exercise-art">
        ${getExerciseIcon(exercise.icon)}
      </div>
      <div class="exercise-info">
        <h3>${escapeHtml(exercise.name)}</h3>
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

function renderExerciseEditCard(exercise) {
  const exerciseType = normalizeExerciseType(exercise.type);
  return `
    <article class="exercise-card is-editing">
      <div class="exercise-art">
        ${getExerciseIcon(exercise.icon)}
      </div>
      <div class="exercise-info">
        <input type="text" class="exercise-edit-name" value="${escapeHtml(exercise.name)}" maxlength="40" aria-label="Exercise name" />
        <div class="type-toggle" role="group" aria-label="Exercise type">
          ${renderTypeOption("strength", exerciseType)}
          ${renderTypeOption("cardio", exerciseType)}
          ${renderTypeOption("timed", exerciseType)}
        </div>
        <div class="exercise-actions">
          <button type="button" class="exercise-action primary" data-action="save-exercise" data-id="${escapeHtml(exercise.id)}" aria-label="Save changes">${getUiIcon("check")}<span class="btn-label">Save</span></button>
          <button type="button" class="exercise-action" data-action="cancel-exercise" aria-label="Cancel editing">${getUiIcon("x")}<span class="btn-label">Cancel</span></button>
        </div>
      </div>
    </article>
  `;
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
      icon: "treadmill",
      tags: ["custom", "cardio"]
    };
  }
  if (normalized === "timed") {
    return {
      type: "timed",
      area: "Core / holds",
      icon: "plank",
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
    icon: "pushup",
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
  if (navigator.onLine) {
    uploadWorkoutData(data).then(clearPendingData).catch(() => {
      // Not signed in or offline: the change is queued and syncs later.
    });
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

function saveLibraryExerciseEdit(id, name, type) {
  const cleanName = String(name).trim();
  if (!cleanName) return;
  const nextType = normalizeExerciseType(type);
  const library = exercises.map((exercise) => {
    if (exercise.id !== id) return exercise;
    const customExercise = (exercise.tags || []).includes("custom");
    const typeMeta = customExercise ? getExerciseTypeMeta(nextType) : { type: nextType };
    return {
      ...exercise,
      name: cleanName,
      ...typeMeta
    };
  });
  editingExerciseId = null;
  persistLibrary(library);
}

function removeLibraryExercise(id) {
  const exercise = getExerciseById(id);
  const name = exercise ? exercise.name : "this exercise";
  if (!confirm(`Remove "${name}" from your library? Past workouts that used it are not affected.`)) return;
  if (editingExerciseId === id) editingExerciseId = null;
  persistLibrary(exercises.filter((item) => item.id !== id));
}

// One click handler for the whole library list (Edit / Remove / Save / Cancel
// and the Strength/Cardio toggle inside an edit card).
function handleLibraryListClick(event) {
  const typeOption = event.target.closest(".type-option");
  if (typeOption) {
    const group = typeOption.parentElement;
    group.querySelectorAll(".type-option").forEach((btn) => btn.classList.toggle("is-active", btn === typeOption));
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === "edit-exercise") {
    editingExerciseId = id;
    renderExercises();
  } else if (action === "cancel-exercise") {
    editingExerciseId = null;
    renderExercises();
  } else if (action === "remove-exercise") {
    removeLibraryExercise(id);
  } else if (action === "save-exercise") {
    const card = button.closest(".exercise-card");
    const name = card.querySelector(".exercise-edit-name")?.value || "";
    const activeType = card.querySelector(".type-option.is-active")?.dataset.type || "strength";
    saveLibraryExerciseEdit(id, name, activeType);
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
  if (exercise.type === "cardio" || exercise.type === "timed" || exercise.type === "sport") {
    return {
      id: `workout-exercise-${Date.now()}-${randomString(5)}`,
      exerciseId: exercise.id,
      name: exercise.name,
      type: "cardio",
      durationMinutes: "",
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
        reps: "",
        weight: "",
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
  data.workouts.push(makeSavedWorkout());

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
  if (tag === "bodyweight") return "no equipment";
  if (tag === "machine") return "cable/machine";
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
  return exercises.find((exercise) => exercise.name.toLowerCase() === normalized)?.id || makeSlug(name);
}

function formatEntryDetails(entry) {
  if (entry.type === "cardio") {
    const planned = entry.planned?.durationMinutes ? `planned ${entry.planned.durationMinutes} min, ` : "";
    return `${planned}actual ${entry.durationMinutes || 0} min${formatCardioStats(entry.stats)}`;
  }

  if (entry.type === "sport") {
    const planned = entry.planned?.durationMinutes ? `planned ${entry.planned.durationMinutes} min, ` : "";
    const note = (entry.notes || "").trim();
    return `${planned}actual ${entry.durationMinutes || 0} min${note ? ` · ${note}` : ""}`;
  }

  if (entry.type === "timed") {
    const secs = entry.actualSummary?.seconds || entry.planned?.seconds || 0;
    const planned = entry.planned?.sets ? `planned ${entry.planned.sets} × ${entry.planned.seconds || 0} sec, ` : "";
    return `${planned}actual ${entry.actualSummary?.sets || 0} × ${secs} sec`;
  }

  const summary = entry.actualSummary
    ? `${entry.actualSummary.sets}x${entry.actualSummary.reps} @ ${entry.actualSummary.weight} lb`
    : entry.sets?.map((set) => `${set.reps}@${set.weight}lb`).join(", ");
  const planned = entry.planned?.sets ? `planned ${entry.planned.sets}x${entry.planned.reps || 0}, ` : "";
  return `${planned}actual ${summary || "no sets"}`;
}

function formatRoutineExercise(exercise) {
  const exerciseInfo = getExerciseById(exercise.exerciseId);
  const name = exerciseInfo?.name || exercise.exerciseId;
  if (exercise.targetDuration) return `- ${name}: ${exercise.targetDuration} min`;
  return `- ${name}: ${exercise.targetSets || 1}x${exercise.targetReps || 0}`;
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
    <div class="plan-grid">
      <section class="plan-card">
        <div class="plan-card-head">
          <p class="card-kicker">Loaded plan</p>
          <div class="plan-save-row">
            <span class="plan-save-status" id="plan-save-status" aria-live="polite"></span>
            <button class="primary-button small-button" type="button" data-plan-save>Save plan notes</button>
          </div>
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
      </section>

      <section class="plan-card">
        <p class="card-kicker">AI review loop</p>
        <h3>Coach packet</h3>
        <p class="plan-muted">Export the current app context, review it in an AI chat, then paste the updated plan below.</p>
        <div class="plan-actions">
          <button class="quiet-button" id="copy-review-packet" type="button">Copy coach packet</button>
          <button class="primary-button" id="save-review-packet" type="button">Save coach packet</button>
        </div>
      </section>
    </div>

    <section class="plan-card plan-import-card">
      <div class="plan-card-head">
        <div>
          <p class="card-kicker">Import updated plan</p>
          <p class="plan-muted">Paste the AI coach's plan here, preview what Training Book understands, then save it.</p>
        </div>
        <button class="quiet-button small-button" id="plan-import-example" type="button">Use example</button>
      </div>
      <textarea id="plan-import-text" class="plan-import-text" spellcheck="false" placeholder="Paste the AI coach's updated plan here.">${escapeHtml(importText)}</textarea>
      <div class="plan-import-actions">
        <button class="primary-button" id="plan-import-preview" type="button">Preview changes</button>
        <button class="quiet-button" id="plan-import-save" type="button" ${planImportPreview ? "" : "disabled"}>Save imported plan</button>
      </div>
      ${importMessageHtml}
      ${importPreviewHtml}
    </section>

    <section class="plan-card">
      <div class="plan-card-head">
        <p class="card-kicker">Weekly schedule</p>
        <span class="plan-muted">${Object.values(weeklyPlan).filter(Boolean).length} planned days</span>
      </div>
      <div class="plan-week">
        ${DOW_NAMES.map((day) => `
          <div class="plan-day">
            <span>${formatDayName(day)}</span>
            <strong>${escapeHtml(getRoutineNameById(weeklyPlan[day], routines))}</strong>
          </div>
        `).join("")}
      </div>
    </section>

    <section class="plan-card">
      <p class="card-kicker">Routines</p>
      <div class="plan-routines">
        ${routines.length ? routines.map((routine) => `
          <article class="plan-routine">
            <div>
              <h3>${escapeHtml(routine.name)}</h3>
              <p class="plan-muted">${escapeHtml(routine.location || "mixed")}${routine.notes ? ` - ${escapeHtml(routine.notes)}` : ""}</p>
            </div>
            <ul>
              ${(routine.exercises || []).map((exercise) => `<li>${formatRoutineExerciseDisplay(exercise)}</li>`).join("")}
            </ul>
          </article>
        `).join("") : `<p class="empty-state">No routines loaded yet. Import a plan or build routines with your AI coach.</p>`}
      </div>
    </section>
  `;

  wirePlanScreen();
}

function saveActivePlanFromScreen() {
  const data = getLocalData();
  data.activePlan = {
    ...getStarterActivePlan(),
    name: document.querySelector("#plan-name-input")?.value.trim() || "Current Training Plan",
    mainGoal: document.querySelector("#plan-goal-input")?.value.trim() || "",
    reviewCadence: document.querySelector("#plan-review-input")?.value.trim() || "",
    nextReviewDate: document.querySelector("#plan-next-review-input")?.value.trim() || "",
    notes: document.querySelector("#plan-notes-input")?.value.trim() || ""
  };
  commitProgressData(data);
  renderReviewReminder();

  // Confirm the save in place rather than re-rendering (which looked like nothing happened).
  const status = planContent?.querySelector("#plan-save-status");
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

function wirePlanScreen() {
  planContent?.querySelector("[data-plan-save]")?.addEventListener("click", saveActivePlanFromScreen);
  planContent?.querySelector("#copy-review-packet")?.addEventListener("click", copyReviewPacket);
  planContent?.querySelector("#save-review-packet")?.addEventListener("click", saveReviewPacket);
  planContent?.querySelector("#plan-import-example")?.addEventListener("click", fillPlanImportExample);
  planContent?.querySelector("#plan-import-preview")?.addEventListener("click", previewPlanImportFromScreen);
  planContent?.querySelector("#plan-import-save")?.addEventListener("click", savePlanImportFromScreen);
  planContent?.querySelector("#plan-import-text")?.addEventListener("input", () => {
    planImportPreview = null;
    planImportSummary = "";
    planImportMessage = "Text changed. Preview again before saving.";
    const saveButton = planContent.querySelector("#plan-import-save");
    if (saveButton) saveButton.disabled = true;
  });
}

function formatWorkoutForExport(workout) {
  const lines = [];
  lines.push(`Date: ${workout.date} - ${workout.name || workout.routineName || "Workout"}`);

  workout.entries?.forEach((entry) => {
    lines.push(`  ${entry.exerciseName}: ${formatEntryDetails(entry)} | Difficulty: ${entry.difficulty || "not logged"}/10`);
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

function countCompletedInWeek(mondayDate, completedSet) {
  let count = 0;
  for (let i = 0; i < 7; i++) {
    if (completedSet.has(dateKeyUTC(addDaysUTC(mondayDate, i)))) count++;
  }
  return count;
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

function renderProgressCalendar(completedSet) {
  const data = getLocalData();
  const weeklyPlan = data.weeklyPlan || getStarterWeeklyPlan();
  const todayKey = getTodayDateString();

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

    let state = "is-rest";
    let label = "Rest day";
    if (isDone) { state = "is-done"; label = "Workout done"; }
    else if (isPlanned && isPast) { state = "is-missed"; label = "Planned - missed"; }
    else if (isPlanned) { state = "is-planned"; label = "Planned"; }

    const todayClass = isToday ? " is-today" : "";
    cells += `<span class="cal-cell ${state}${todayClass}" title="${escapeHtml(`${key}: ${label}`)}">${day}</span>`;
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
      <div class="cal-legend">
        <span><i class="dot is-done"></i>Done</span>
        <span><i class="dot is-planned"></i>Planned</span>
        <span><i class="dot is-missed"></i>Missed</span>
        <span><i class="dot is-rest"></i>Rest</span>
      </div>
    </div>
  `;
}

function renderProgress(resetMonth = true) {
  if (!progressContent) return;

  const data = getLocalData();
  const completedSet = new Set(Array.isArray(data.completedWorkouts) ? data.completedWorkouts : []);
  const target = getWeeklyTarget();

  if (resetMonth || !progressMonthDate) {
    const now = new Date();
    progressMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    weightBoxOpen = null;
  }

  const doneThisWeek = countCompletedInWeek(mondayOfWeek(new Date()), completedSet);
  const streak = computeWeekStreak(target, completedSet);

  // This-week card text
  let weekNote;
  if (target <= 0) {
    weekNote = "No workout days planned";
  } else if (doneThisWeek >= target) {
    weekNote = "Target hit - nice work!";
  } else {
    const remaining = target - doneThisWeek;
    weekNote = `${remaining} more to hit your target`;
  }
  const weekHitClass = target > 0 && doneThisWeek >= target ? " is-hit" : "";

  // Streak card text
  const streakNote = streak === 0
    ? "Hit this week's target to start a streak"
    : `${streak === 1 ? "week" : "weeks"} hitting your target in a row`;

  progressContent.innerHTML = `
    <div class="progress-stats">
      <div class="stat-card${weekHitClass}">
        <p class="card-kicker">This week</p>
        <p class="stat-number">${doneThisWeek}<span class="stat-of"> / ${target}</span></p>
        <p class="stat-note">${escapeHtml(weekNote)}</p>
      </div>
      <div class="stat-card">
        <p class="card-kicker">Streak</p>
        <p class="stat-number">${streak}<span class="stat-of"> ${streak === 1 ? "wk" : "wks"}</span></p>
        <p class="stat-note">${escapeHtml(streakNote)}</p>
      </div>
    </div>
    ${renderBodyWeightCard(data)}
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
      ${logBox}
      ${targetArea}
    </div>`;
}

function wireBodyWeightCard() {
  if (!progressContent) return;

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
  const workouts = Array.isArray(data.workouts) ? data.workouts.slice().reverse() : [];

  if (workouts.length === 0) {
    historyContent.innerHTML = `<p class="empty-state">Past workouts will show here as you log.</p>`;
    return;
  }

  historyContent.innerHTML = `
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
          </article>
        `;
      }).join("")}
    </div>
  `;

  // Add click listeners to history cards
  document.querySelectorAll(".history-card-button").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".history-card");
      const workoutId = card?.dataset.workoutId;
      if (workoutId) {
        openHistoryDetail(workoutId);
      }
    });
  });
}

function openHistoryDetail(workoutId) {
  const data = getLocalData();
  const workout = data.workouts?.find((w) => w.id === workoutId);
  if (!workout) return;

  const detailPanel = document.querySelector("#history-detail-panel");
  if (detailPanel) {
    renderHistoryDetail(workout);
    detailPanel.hidden = false;
    historyContent.style.display = "none";
  }
}

function closeHistoryDetail() {
  const detailPanel = document.querySelector("#history-detail-panel");
  if (detailPanel) {
    detailPanel.hidden = true;
    historyContent.style.display = "block";
  }
}

function renderHistoryDetail(workout) {
  const detailBody = document.querySelector("#history-detail-body");
  const detailTitle = document.querySelector("#history-detail-title");
  const entries = Array.isArray(workout.entries) ? workout.entries : [];

  if (detailTitle) {
    detailTitle.textContent = `${workout.name || workout.routineName || "Workout"} • ${formatWorkoutDate(workout.date)}`;
  }

  if (!detailBody) return;

  detailBody.innerHTML = `
    <div class="detail-section">
      <div class="detail-field">
        <label for="detail-workout-date">Date</label>
        <input id="detail-workout-date" type="date" value="${escapeHtml(workout.date)}" data-field="date">
      </div>
    </div>

    <div class="detail-section">
      <h4 class="section-label">Exercises</h4>
      <div id="detail-exercises-list">
        ${entries.map((entry, index) => renderDetailExercise(entry, index)).join("")}
      </div>
    </div>

    <div class="detail-actions">
      <button class="primary-button" id="detail-save-button" type="button">Save changes</button>
    </div>
  `;

  // Store the workout ID for saving
  detailBody.dataset.workoutId = workout.id;

  // Add event listeners
  document.querySelectorAll("#detail-exercises-list input, #detail-exercises-list select").forEach((field) => {
    field.addEventListener("change", () => {
      // Just mark as dirty for now
    });
  });

  document.getElementById("detail-save-button")?.addEventListener("click", () => {
    saveWorkoutChanges(workout.id);
  });
}

function renderDetailExercise(entry, index) {
  if (entry.type === "cardio") {
    return `
      <div class="detail-exercise" data-entry-index="${index}">
        <h5>${escapeHtml(entry.exerciseName || "Exercise")}</h5>
        <div class="compare-row">
          <div class="compare-col">
            <p class="compare-label">Planned</p>
            <p>${escapeHtml(entry.planned?.durationMinutes ? `${entry.planned.durationMinutes} min` : "—")}</p>
          </div>
          <div class="compare-col">
            <p class="compare-label">Actual</p>
            <label>
              <input type="number" min="0" step="1" value="${escapeHtml(entry.durationMinutes || 0)}" data-field="durationMinutes" placeholder="0">
              <span>min</span>
            </label>
          </div>
        </div>
        <div class="cardio-stats-edit">
          <label>
            <input type="number" min="0" step="1" value="${escapeHtml(entry.stats?.output || "")}" data-field="cardioOutput" placeholder="0">
            <span>kJ</span>
          </label>
          <label>
            <input type="number" min="0" step="1" value="${escapeHtml(entry.stats?.avgPower || "")}" data-field="cardioAvgPower" placeholder="0">
            <span>watts</span>
          </label>
          <label>
            <input type="number" min="0" step="0.1" value="${escapeHtml(entry.stats?.distance || "")}" data-field="cardioDistance" placeholder="0">
            <span>mi</span>
          </label>
        </div>
        <div class="exercise-difficulty">
          <label>
            <span>Difficulty</span>
            <input type="range" min="1" max="10" value="${escapeHtml(entry.difficulty || 5)}" data-field="difficulty">
            <span class="difficulty-value">${escapeHtml(entry.difficulty || 5)}/10</span>
          </label>
        </div>
      </div>
    `;
  }

  if (entry.type === "sport") {
    return `
      <div class="detail-exercise" data-entry-index="${index}">
        <h5>${escapeHtml(entry.exerciseName || "Exercise")}</h5>
        <div class="compare-row">
          <div class="compare-col">
            <p class="compare-label">Planned</p>
            <p>${escapeHtml(entry.planned?.durationMinutes ? `${entry.planned.durationMinutes} min` : "—")}</p>
          </div>
          <div class="compare-col">
            <p class="compare-label">Actual</p>
            <label>
              <input type="number" min="0" step="1" value="${escapeHtml(entry.durationMinutes || 0)}" data-field="durationMinutes" placeholder="0">
              <span>min</span>
            </label>
          </div>
        </div>
        <label class="detail-sport-notes">
          <span>Notes</span>
          <textarea rows="2" data-field="sportNotes" placeholder="Optional notes">${escapeHtml(entry.notes || "")}</textarea>
        </label>
        <div class="exercise-difficulty">
          <label>
            <span>Difficulty</span>
            <input type="range" min="1" max="10" value="${escapeHtml(entry.difficulty || 5)}" data-field="difficulty">
            <span class="difficulty-value">${escapeHtml(entry.difficulty || 5)}/10</span>
          </label>
        </div>
      </div>
    `;
  }

  if (entry.type === "timed") {
    return `
      <div class="detail-exercise" data-entry-index="${index}">
        <h5>${escapeHtml(entry.exerciseName || "Exercise")}</h5>
        <div class="compare-row">
          <div class="compare-col">
            <p class="compare-label">Planned</p>
            <p>${escapeHtml(entry.planned?.sets ? `${entry.planned.sets} × ${entry.planned.seconds || 0} sec` : "—")}</p>
          </div>
          <div class="compare-col">
            <p class="compare-label">Actual</p>
            <div class="strength-inputs">
              <label>
                <span>Holds</span>
                <input type="number" min="0" step="1" value="${escapeHtml(entry.actualSummary?.sets || 0)}" data-field="timedSets" placeholder="0">
              </label>
              <label>
                <span>Seconds</span>
                <input type="number" min="0" step="1" value="${escapeHtml(entry.actualSummary?.seconds || 0)}" data-field="timedSeconds" placeholder="0">
              </label>
            </div>
          </div>
        </div>
        <div class="exercise-difficulty">
          <label>
            <span>Difficulty</span>
            <input type="range" min="1" max="10" value="${escapeHtml(entry.difficulty || 5)}" data-field="difficulty">
            <span class="difficulty-value">${escapeHtml(entry.difficulty || 5)}/10</span>
          </label>
        </div>
      </div>
    `;
  }

  // Strength exercise
  return `
    <div class="detail-exercise" data-entry-index="${index}">
      <h5>${escapeHtml(entry.exerciseName || "Exercise")}</h5>
      <div class="compare-row">
        <div class="compare-col">
          <p class="compare-label">Planned</p>
          <p>${escapeHtml(entry.planned?.sets ? `${entry.planned.sets}x${entry.planned.reps || 0}` : "—")}</p>
        </div>
        <div class="compare-col">
          <p class="compare-label">Actual</p>
          <div class="strength-inputs">
            <label>
              <span>Sets</span>
              <input type="number" min="0" step="1" value="${escapeHtml(entry.actualSummary?.sets || 0)}" data-field="actualSets" placeholder="0">
            </label>
            <label>
              <span>Reps</span>
              <input type="number" min="0" step="1" value="${escapeHtml(entry.actualSummary?.reps || 0)}" data-field="actualReps" placeholder="0">
            </label>
            <label>
              <span>Weight</span>
              <input type="number" min="0" step="0.5" value="${escapeHtml(entry.actualSummary?.weight || 0)}" data-field="actualWeight" placeholder="0">
              <span>lb</span>
            </label>
          </div>
        </div>
      </div>
      <div class="exercise-difficulty">
        <label>
          <span>Difficulty</span>
          <input type="range" min="1" max="10" value="${escapeHtml(entry.difficulty || 5)}" data-field="difficulty">
          <span class="difficulty-value">${escapeHtml(entry.difficulty || 5)}/10</span>
        </label>
      </div>
    </div>
  `;
}

function saveWorkoutChanges(workoutId) {
  const data = getLocalData();
  const workoutIndex = data.workouts?.findIndex((w) => w.id === workoutId);
  if (workoutIndex === undefined || workoutIndex < 0) return;

  const workout = data.workouts[workoutIndex];
  const detailBody = document.querySelector("#history-detail-body");

  // Update date
  const dateInput = detailBody?.querySelector('input[data-field="date"]');
  if (dateInput) {
    workout.date = dateInput.value;
  }

  // Update exercises
  detailBody?.querySelectorAll(".detail-exercise").forEach((exerciseEl, index) => {
    const entry = workout.entries?.[index];
    if (!entry) return;

    if (entry.type === "cardio") {
      const durationInput = exerciseEl.querySelector('input[data-field="durationMinutes"]');
      const difficultyInput = exerciseEl.querySelector('input[data-field="difficulty"]');
      if (durationInput) entry.durationMinutes = Number(durationInput.value) || 0;
      if (difficultyInput) entry.difficulty = Number(difficultyInput.value) || 5;
      // Optional Peloton numbers: keep only the ones above zero.
      const stats = {};
      const output = Number(exerciseEl.querySelector('input[data-field="cardioOutput"]')?.value);
      const avgPower = Number(exerciseEl.querySelector('input[data-field="cardioAvgPower"]')?.value);
      const distance = Number(exerciseEl.querySelector('input[data-field="cardioDistance"]')?.value);
      if (output > 0) stats.output = output;
      if (avgPower > 0) stats.avgPower = avgPower;
      if (distance > 0) stats.distance = distance;
      if (Object.keys(stats).length) entry.stats = stats;
      else delete entry.stats;
    } else if (entry.type === "sport") {
      const durationInput = exerciseEl.querySelector('input[data-field="durationMinutes"]');
      const notesInput = exerciseEl.querySelector('textarea[data-field="sportNotes"]');
      const difficultyInput = exerciseEl.querySelector('input[data-field="difficulty"]');
      if (durationInput) entry.durationMinutes = Number(durationInput.value) || 0;
      if (notesInput) {
        const note = notesInput.value.trim();
        if (note) entry.notes = note;
        else delete entry.notes;
      }
      if (difficultyInput) entry.difficulty = Number(difficultyInput.value) || 5;
    } else if (entry.type === "timed") {
      const holdsInput = exerciseEl.querySelector('input[data-field="timedSets"]');
      const secondsInput = exerciseEl.querySelector('input[data-field="timedSeconds"]');
      const difficultyInput = exerciseEl.querySelector('input[data-field="difficulty"]');
      if (holdsInput || secondsInput) {
        entry.actualSummary = {
          sets: Number(holdsInput?.value) || 0,
          seconds: Number(secondsInput?.value) || 0
        };
      }
      if (difficultyInput) entry.difficulty = Number(difficultyInput.value) || 5;
    } else {
      const setsInput = exerciseEl.querySelector('input[data-field="actualSets"]');
      const repsInput = exerciseEl.querySelector('input[data-field="actualReps"]');
      const weightInput = exerciseEl.querySelector('input[data-field="actualWeight"]');
      const difficultyInput = exerciseEl.querySelector('input[data-field="difficulty"]');

      if (setsInput || repsInput || weightInput) {
        entry.actualSummary = {
          sets: Number(setsInput?.value) || 0,
          reps: Number(repsInput?.value) || 0,
          weight: Number(weightInput?.value) || 0
        };
      }
      if (difficultyInput) entry.difficulty = Number(difficultyInput.value) || 5;
    }
  });

  data.updatedAt = new Date().toISOString();
  data.updatedBy = getDeviceId();
  saveLocalData(data);
  markPendingData(data);

  closeHistoryDetail();
  renderHistory();
}

const historyDetailCloseButton = document.querySelector("#history-detail-close");
historyDetailCloseButton?.addEventListener("click", closeHistoryDetail);

function generateReviewPacket() {
  const data = getLocalData();
  const packet = [];
  const activePlan = { ...getStarterActivePlan(), ...(data.activePlan || {}) };
  const weeklyPlan = data.weeklyPlan || getStarterWeeklyPlan();
  const routines = Array.isArray(data.routines) ? data.routines : [];
  const library = Array.isArray(data.library) ? data.library : exercises;
  const bodyWeights = Array.isArray(data.bodyWeights) ? data.bodyWeights.slice() : [];
  const weightTarget = typeof data.weightTarget === "number" ? data.weightTarget : null;

  packet.push("=== TRAINING BOOK REVIEW PACKET ===");
  packet.push(`Exported: ${new Date().toISOString()}`);
  packet.push("");

  packet.push("HOW TRAINING BOOK WORKS:");
  packet.push("- Today reads from the weekly plan and loaded routines.");
  packet.push("- Strength targets use sets x reps. Logged strength work includes actual sets, reps, weight, and difficulty.");
  packet.push("- Cardio/time targets use minutes. Logged cardio work includes actual minutes and difficulty.");
  packet.push("- Held moves (e.g. plank) are timed: targets read sets x seconds, and logged work records how many holds were completed and the seconds each.");
  packet.push("- Skipped exercises are omitted from saved workouts, so coach the work that was actually logged.");
  packet.push("- Return the updated plan using the structured format at the end of this packet.");
  packet.push("");

  packet.push("COACHING REQUEST:");
  packet.push("Review the workouts I actually completed, my difficulty ratings, my current loaded plan, and my exercise library. Suggest an updated active plan, weekly schedule, and routines. Keep daily logging quick and realistic.");
  packet.push("");

  packet.push("COACHING QUESTIONS:");
  packet.push("- What should change in the plan based on the recent logged workouts?");
  packet.push("- Are any days too heavy, too light, or missing recovery?");
  packet.push("- What should Daniel focus on this week?");
  packet.push("- Return an updated plan in the import format at the end.");
  packet.push("");

  packet.push("ACTIVE PLAN:");
  packet.push(`name: ${activePlan.name || "Current Training Plan"}`);
  packet.push(`main goal: ${activePlan.mainGoal || "(not set)"}`);
  packet.push(`review cadence: ${activePlan.reviewCadence || "(not set)"}`);
  packet.push(`next review date: ${activePlan.nextReviewDate || "(not set)"}`);
  packet.push(`notes: ${activePlan.notes || "(none)"}`);
  packet.push("");

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

  packet.push("RETURN FORMAT FOR TRAINING BOOK IMPORT:");
  packet.push("Please return only plain text in this format:");
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
  packet.push("- Cardio Name: 30 min");
  packet.push("");
  packet.push("Use exercise names from the library when possible. Keep each routine exercise on one dash line. Do not include extra commentary outside this format.");

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
  alert("Coach packet copied to clipboard.");
}

async function saveReviewPacket() {
  const packet = generateReviewPacket();
  const fileName = getReviewPacketFileName();
  try {
    const saveMode = await saveTextFile(packet, fileName);
    if (saveMode === "picked") {
      alert(`Coach packet saved as ${fileName}.`);
    } else {
      alert(`Coach packet downloaded as ${fileName}. Firefox and some mobile browsers do not support a Save As picker from web apps, so they use Downloads.`);
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
- Goblet Squat: 3x8
- Push-up: 3x8
- Dumbbell Row: 3x10
- Plank: 3x30

ROUTINE: Full Body B
- Deadlift: 3x8
- Shoulder Press: 3x8
- Squat: 3x8
- Plank: 2x30

ROUTINE: Optional Walk
- Treadmill Walk: 30 min`;
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
  const target = cleaned.slice(separatorIndex + 1).trim().toLowerCase();
  const exerciseId = findExerciseIdByName(exerciseName);

  const durationMatch = target.match(/(\d+)\s*(min|minute|minutes)/);
  if (durationMatch) {
    return {
      exerciseId,
      targetDuration: Number(durationMatch[1])
    };
  }

  const strengthMatch = target.match(/(\d+)\s*(x|sets?\s*(of)?|by)\s*(\d+)/);
  if (strengthMatch) {
    return {
      exerciseId,
      targetSets: Number(strengthMatch[1]),
      targetReps: Number(strengthMatch[4])
    };
  }

  return null;
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

    if (mode === "routine" && currentRoutine && /^[-*]\s*/.test(line)) {
      const parsedExercise = parseRoutineExerciseLine(line);
      if (parsedExercise) currentRoutine.exercises.push(parsedExercise);
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
  tab.addEventListener("click", () => {
    showScreen(tab.dataset.target, true);
  });
});

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const filter = chip.dataset.filter || "all";
    filterChips.forEach((item) => item.classList.toggle("is-active", item === chip));
    renderExercises(filter);
  });
});

// Library: edit / remove / inline-edit actions on the exercise list.
exerciseList?.addEventListener("click", handleLibraryListClick);

// Library: the "Add your own exercise" form.
const libraryAddForm = document.querySelector("#library-add-form");
const newExerciseName = document.querySelector("#new-exercise-name");
libraryAddForm?.addEventListener("click", (event) => {
  const typeOption = event.target.closest(".type-option");
  if (!typeOption) return;
  libraryAddForm.querySelectorAll(".type-option").forEach((btn) => btn.classList.toggle("is-active", btn === typeOption));
});
libraryAddForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = newExerciseName?.value || "";
  if (!name.trim()) return;
  const type = libraryAddForm.querySelector(".type-option.is-active")?.dataset.type || "strength";
  addLibraryExercise(name, type);
  if (newExerciseName) newExerciseName.value = "";
});

addExerciseButton?.addEventListener("click", addExerciseToWorkout);

exercisePicker?.addEventListener("change", () => {
  if (exercisePicker.value) addExerciseToWorkout();
});

activeWorkoutList?.addEventListener("input", handleWorkoutInput);
activeWorkoutList?.addEventListener("change", handleWorkoutInput);
activeWorkoutList?.addEventListener("click", handleWorkoutClick);

saveWorkoutButton?.addEventListener("click", () => {
  saveWorkout().catch((error) => {
    setWorkoutStatus(error.message, "bad");
  });
});

todayRoutineList?.addEventListener("click", handleTodayWorkoutClick);
todayRoutineList?.addEventListener("change", handleTodayWorkoutChange);

reviewReminderGo?.addEventListener("click", () => showScreen("plan", true));
reviewReminderDismiss?.addEventListener("click", () => {
  localStorage.setItem(STORAGE.reviewReminderDismissed, getTodayDateString());
  renderReviewReminder();
});

startTodayButton?.addEventListener("click", startTodayWorkout);
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

refreshLibrary();
renderExercises();
renderExercisePicker();
renderActiveWorkout();
renderTodayRoutine();
renderPlan();
showScreen(localStorage.getItem(STORAGE.activeTab) || "today");

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
  let appMod, authMod, fsMod;
  try {
    [appMod, authMod, fsMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js")
    ]);
  } catch (error) {
    // Offline or the Firebase code could not load: the app still works
    // fully on this device using the local backup. Sync resumes next launch.
    console.error("Cloud sync could not load right now:", error);
    // No cloud to reconcile against, so it is safe to seed locally now.
    seedSoccerOnce();
    updateCloudUi();
    return;
  }

  const fbApp = appMod.initializeApp(FIREBASE_CONFIG);
  const fbAuth = authMod.getAuth(fbApp);
  const fbDb = fsMod.getFirestore(fbApp);
  const provider = new authMod.GoogleAuthProvider();
  _setDoc = fsMod.setDoc;

  // Decide what to do when the cloud sends us the latest saved data.
  function reconcile(remote) {
    const local = readJson(STORAGE.localData);
    const localTime = local?.updatedAt ? Date.parse(local.updatedAt) : 0;
    const remoteTime = remote?.updatedAt ? Date.parse(remote.updatedAt) : 0;

    if (!remote) {
      // Nothing saved in the cloud yet: push this device's data up as the
      // starting point (this carries over existing local workouts).
      if (local) cloudSave(local).catch((e) => console.error("Initial cloud push failed:", e));
      return;
    }

    if (remoteTime >= localTime) {
      // Cloud has the newest data: take it and refresh the screens.
      saveLocalData(remote);
      refreshLibrary();
      renderExercises();
      renderExercisePicker();
      renderTodayRoutine();
      renderActiveWorkout();
      renderPlan();
      renderHistory();
    } else if (local) {
      // This device has newer data (e.g. logged offline): push it up.
      cloudSave(local).catch((e) => console.error("Cloud push failed:", e));
    }
  }

  authMod.onAuthStateChanged(fbAuth, (user) => {
    if (_cloudUnsub) { _cloudUnsub(); _cloudUnsub = null; }

    if (user) {
      cloudUser = { uid: user.uid, email: user.email };
      _fbDoc = fsMod.doc(fbDb, "users", user.uid);
      // Listen for changes so the other device updates automatically.
      _cloudUnsub = fsMod.onSnapshot(_fbDoc, (snap) => {
        if (snap.metadata.hasPendingWrites) return; // ignore our own just-made save
        reconcile(snap.exists() ? snap.data() : null);
        // Seed soccer on top of the freshest synced data (runs once). Doing it
        // here, not at startup, avoids a stale device overwriting newer data.
        seedSoccerOnce();
      }, (error) => console.error("Cloud listener error:", error));
    } else {
      cloudUser = null;
      _fbDoc = null;
      // Signed out: no cloud to reconcile against, so seed locally now.
      seedSoccerOnce();
    }
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

  cloudSignInButton?.addEventListener("click", () => {
    // Popup sign-in is the most reliable on desktop and avoids the redirect
    // session being dropped. If a popup is blocked (some phone setups), fall
    // back to the redirect style instead.
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
  });

  cloudSignOutButton?.addEventListener("click", () => {
    authMod.signOut(fbAuth).catch((error) => console.error("Sign-out failed:", error));
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
