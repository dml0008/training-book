const DROPBOX_AUTHORIZE_URL = "https://www.dropbox.com/oauth2/authorize";
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload";
const DROPBOX_DOWNLOAD_URL = "https://content.dropboxapi.com/2/files/download";
const DATA_FILE_PATH = "/04_Technical/06_Side_Projects/Workout and Nutrition App/data/workout-data.json";
const APP_VERSION = "2026.06.10-cache-fix";

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
  activeTab: "trainingBookActiveTab"
};

const screens = Array.from(document.querySelectorAll(".screen"));
const tabs = Array.from(document.querySelectorAll(".tab"));
const dateLabel = document.querySelector("#today-date");
const todayRoutineName = document.querySelector("#today-routine-name");
const todayRoutineList = document.querySelector("#today-routine-list");
const todayProgressNumber = document.querySelector("#today-progress-number");
const todayProgressLabel = document.querySelector("#today-progress-label");
const saveTodayWorkoutButton = document.querySelector("#save-today-workout");
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
  }
  ];
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
  exercises: []
};

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

function getRoutineById(routineId) {
  const data = getLocalData();
  return data.routines?.find((r) => r.id === routineId) || null;
}

function getTodayPlannedRoutine() {
  const data = getLocalData();
  const dayOfWeek = getDayOfWeek();
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
  const isCardio = Boolean(plannedEx.targetDuration) || exerciseInfo.type === "cardio";
  const targetSets = Number(plannedEx.targetSets) || (isCardio ? 0 : 3);
  const targetReps = Number(plannedEx.targetReps) || 0;
  const targetDuration = Number(plannedEx.targetDuration) || 0;

  return {
    id: `today-${exerciseInfo.id}-${randomString(5)}`,
    exerciseId: exerciseInfo.id,
    name: exerciseInfo.name,
    type: isCardio ? "cardio" : "strength",
    area: exerciseInfo.area,
    icon: exerciseInfo.icon,
    source,
    targetSets,
    targetReps,
    targetDuration,
    actualSets: targetSets || 1,
    actualReps: targetReps,
    actualWeight: 0,
    actualDuration: targetDuration || 30,
    difficulty: 5,
    checked: false
  };
}

function formatTodayTarget(exercise) {
  if (exercise.type === "cardio") return `${exercise.targetDuration || exercise.actualDuration} min planned`;
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

function renderTodayRoutine() {
  if (!todayRoutineList) return;

  const routine = getTodayPlannedRoutine();

  if (!routine) {
    activeWorkout.exercises = [];
    todayRoutineList.innerHTML = `
      <div class="empty-routine">
        <p class="eyebrow">No workout today</p>
        <p>You have a rest day scheduled. Tap the Log tab if you want to log an extra workout.</p>
      </div>
    `;
    if (todayRoutineName) {
      todayRoutineName.textContent = "Rest day";
    }
    if (todayAddExtra) {
      todayAddExtra.hidden = true;
    }
    updateTodayProgress();
    return;
  }

  if (todayRoutineName) {
    todayRoutineName.textContent = routine.name;
  }
  if (todayAddExtra) {
    todayAddExtra.hidden = false;
  }

  activeWorkout.startedAt = new Date().toISOString();
  activeWorkout.exercises = routine.exercises.map((plannedEx) => makeTodayExercise(plannedEx));
  renderTodayWorkout();
  return;

  todayRoutineList.innerHTML = activeWorkout.exercises.map((ex) => `
    <article class="today-exercise-card" data-exercise-id="${escapeHtml(ex.id)}">
      <label class="exercise-checkbox-wrapper">
        <input type="checkbox" class="today-exercise-checkbox" ${ex.checked ? "checked" : ""}>
        <div class="exercise-icon-small" aria-hidden="true">
          ${getExerciseIcon(ex.icon)}
        </div>
      </label>
      <div class="exercise-details">
        <h3>${escapeHtml(ex.name)}</h3>
        <p class="exercise-meta">${escapeHtml(ex.area)}</p>
        ${ex.targetSets ? `<p class="exercise-target">${ex.targetSets} sets × ${ex.targetReps} reps</p>` : ""}
        ${ex.targetDuration ? `<p class="exercise-target">${ex.targetDuration} minutes</p>` : ""}
      </div>
    </article>
  `).join("");

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

function renderTodayWorkout() {
  if (!todayRoutineList) return;

  todayRoutineList.innerHTML = activeWorkout.exercises.map((ex) => `
    <article class="today-exercise-card${ex.checked ? " is-done" : ""}" data-exercise-id="${escapeHtml(ex.id)}">
      <div class="today-exercise-art">
        <div class="exercise-icon-small" aria-hidden="true">
          ${getExerciseIcon(ex.icon)}
        </div>
        <button class="today-done-button${ex.checked ? " is-done" : ""}" type="button" data-action="toggle-today">${ex.checked ? "Done" : "Log"}</button>
      </div>
      <div class="exercise-details">
        <div class="today-card-topline">
          <div>
            <h3>${escapeHtml(ex.name)}</h3>
            <p class="exercise-meta">${escapeHtml(ex.area)}${ex.source === "extra" ? " - extra" : ""}</p>
          </div>
          <button class="quiet-button small-button today-skip-button" type="button" data-action="skip-today">Skip</button>
        </div>
        <p class="exercise-target">${escapeHtml(formatTodayTarget(ex))}</p>
        ${renderTodayActualControls(ex)}
        ${renderDifficultyScale(ex)}
        <div class="today-swap-row">
          <label>
            <span>Swap</span>
            <select data-action="swap-today" aria-label="Swap ${escapeHtml(ex.name)}">${renderExerciseSwapOptions(ex.exerciseId)}</select>
          </label>
        </div>
      </div>
    </article>
  `).join("");

  updateTodayProgress();
}

function addTodayExtraExercise() {
  const exerciseId = todayExtraPicker?.value;
  if (!exerciseId) return;

  const exercise = getExerciseById(exerciseId);
  if (!exercise) return;

  activeWorkout.exercises.push(makeTodayExercise({
    exerciseId: exercise.id,
    targetSets: exercise.type === "cardio" ? undefined : 3,
    targetReps: exercise.type === "cardio" ? undefined : 10,
    targetDuration: exercise.type === "cardio" ? 30 : undefined
  }, "extra"));

  if (todayExtraPicker) todayExtraPicker.value = "";
  renderTodayWorkout();
}

function handleTodayWorkoutChange(event) {
  const card = event.target.closest(".today-exercise-card");
  if (!card) return;

  const exercise = activeWorkout.exercises.find((ex) => ex.id === card.dataset.exerciseId);
  if (!exercise) return;

  if (event.target.matches("select[data-action='swap-today']")) {
    const swapTo = getExerciseById(event.target.value);
    if (!swapTo) return;

    const replacement = makeTodayExercise({
      exerciseId: swapTo.id,
      targetSets: swapTo.type === "cardio" ? undefined : exercise.targetSets || 3,
      targetReps: swapTo.type === "cardio" ? undefined : exercise.targetReps || 10,
      targetDuration: swapTo.type === "cardio" ? exercise.targetDuration || 30 : undefined
    }, exercise.source === "extra" ? "extra" : "swapped");

    replacement.id = exercise.id;
    replacement.checked = exercise.checked;
    activeWorkout.exercises = activeWorkout.exercises.map((item) => item.id === exercise.id ? replacement : item);
    renderTodayWorkout();
  }
}

function handleTodayWorkoutClick(event) {
  const button = event.target.closest("button");
  if (!button) return;

  const card = button.closest(".today-exercise-card");
  const exercise = activeWorkout.exercises.find((ex) => ex.id === card?.dataset.exerciseId);
  const action = button.dataset.action;

  if (action === "skip-today" && exercise) {
    activeWorkout.exercises = activeWorkout.exercises.filter((item) => item.id !== exercise.id);
    renderTodayWorkout();
    return;
  }

  if (action === "toggle-today" && exercise) {
    exercise.checked = !exercise.checked;
    renderTodayWorkout();
    return;
  }

  if (action === "adjust-today" && exercise) {
    const field = button.dataset.field;
    const delta = Number(button.dataset.delta) || 0;
    const min = Number(button.dataset.min) || 0;
    const max = Number(button.dataset.max) || 999;
    exercise[field] = clampNumber((Number(exercise[field]) || 0) + delta, min, max);
    renderTodayWorkout();
    return;
  }

  if (action === "set-difficulty" && exercise) {
    exercise.difficulty = Number(button.dataset.value) || 5;
    renderTodayWorkout();
  }
}

async function saveTodayWorkout() {
  const routine = getTodayPlannedRoutine();
  if (!routine) {
    alert("No workout planned for today.");
    return;
  }

  const loggedExercises = activeWorkout.exercises.filter((ex) => ex.checked);
  if (loggedExercises.length === 0) {
    alert("Log at least one exercise before saving.");
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
        return {
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
      }
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
          sets: Number(ex.actualSets) || 0,
          reps: Number(ex.actualReps) || 0,
          weight: Number(ex.actualWeight) || 0
        },
        sets: Array.from({ length: Number(ex.actualSets) || 1 }).map((_, i) => ({
          id: `set-${i + 1}`,
          setNumber: i + 1,
          reps: Number(ex.actualReps) || 0,
          weight: Number(ex.actualWeight) || 0,
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
    return;
  }

  try {
    await uploadWorkoutData(data);
    clearPendingData();
    alert("Workout saved and synced!");
    activeWorkout.exercises = [];
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
        { exerciseId: "plank", targetSets: 3 },
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
    treadmill: '<rect x="22" y="70" width="70" height="16" rx="5"></rect><line x1="77" y1="70" x2="66" y2="44"></line><line x1="66" y1="44" x2="82" y2="44"></line><circle cx="49" cy="28" r="8"></circle><line x1="49" y1="36" x2="54" y2="57"></line><line x1="54" y1="57" x2="43" y2="70"></line><line x1="55" y1="57" x2="68" y2="70"></line>'
  };

  return `<svg viewBox="0 0 116 116" role="img" aria-label="${escapeHtml(name)} line illustration">${icons[name] || icons.pushup}</svg>`;
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
          <button type="button" class="exercise-action" data-action="edit-exercise" data-id="${escapeHtml(exercise.id)}">Edit</button>
          <button type="button" class="exercise-action danger" data-action="remove-exercise" data-id="${escapeHtml(exercise.id)}">Remove</button>
        </div>
      </div>
    </article>
  `;
}

function renderExerciseEditCard(exercise) {
  const isCardio = exercise.type === "cardio";
  return `
    <article class="exercise-card is-editing">
      <div class="exercise-art">
        ${getExerciseIcon(exercise.icon)}
      </div>
      <div class="exercise-info">
        <input type="text" class="exercise-edit-name" value="${escapeHtml(exercise.name)}" maxlength="40" aria-label="Exercise name" />
        <div class="type-toggle" role="group" aria-label="Exercise type">
          <button type="button" class="type-option${isCardio ? "" : " is-active"}" data-type="strength">Strength</button>
          <button type="button" class="type-option${isCardio ? " is-active" : ""}" data-type="cardio">Cardio</button>
        </div>
        <div class="exercise-actions">
          <button type="button" class="exercise-action primary" data-action="save-exercise" data-id="${escapeHtml(exercise.id)}">Save</button>
          <button type="button" class="exercise-action" data-action="cancel-exercise">Cancel</button>
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
  const isCardio = type === "cardio";
  const newExercise = {
    id: makeExerciseId(cleanName),
    name: cleanName,
    type: isCardio ? "cardio" : "strength",
    area: isCardio ? "Cardio" : "Strength",
    icon: isCardio ? "treadmill" : "pushup",
    tags: isCardio ? ["custom", "cardio"] : ["custom"]
  };
  persistLibrary([...exercises, newExercise]);
}

function saveLibraryExerciseEdit(id, name, type) {
  const cleanName = String(name).trim();
  if (!cleanName) return;
  const isCardio = type === "cardio";
  const library = exercises.map((exercise) => {
    if (exercise.id !== id) return exercise;
    return {
      ...exercise,
      name: cleanName,
      type: isCardio ? "cardio" : "strength"
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
  if (exercise.type === "cardio") {
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
          ${exercise.type === "strength" ? '<button class="quiet-button small-button" type="button" data-action="add-set">Add set</button>' : ""}
          <button class="quiet-button small-button" type="button" data-action="remove-exercise">Remove</button>
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
    return `${planned}actual ${entry.durationMinutes || 0} min`;
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
          <button class="primary-button small-button" type="button" data-plan-save>Save plan notes</button>
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
            <input id="plan-next-review-input" value="${escapeHtml(activePlan.nextReviewDate)}" autocomplete="off" placeholder="YYYY-MM-DD">
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
          <button class="primary-button" id="export-review-packet" type="button">Copy + save coach packet</button>
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
  renderPlan();
}

function wirePlanScreen() {
  planContent?.querySelector("[data-plan-save]")?.addEventListener("click", saveActivePlanFromScreen);
  planContent?.querySelector("#export-review-packet")?.addEventListener("click", exportReviewPacket);
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
        <button class="quiet-button cal-arrow" type="button" data-cal-step="-1" aria-label="Previous month">&#8592;</button>
        <strong class="cal-month">${escapeHtml(monthLabel)}</strong>
        <button class="quiet-button cal-arrow" type="button" data-cal-step="1" aria-label="Next month">&#8594;</button>
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

async function exportReviewPacket() {
  const packet = generateReviewPacket();
  const fileName = getReviewPacketFileName();
  await copyTextToClipboard(packet);

  try {
    const saveMode = await saveTextFile(packet, fileName);
    const saveText = saveMode === "picked"
      ? `saved as ${fileName}`
      : `downloaded as ${fileName}`;
    alert(`Coach packet copied to clipboard and ${saveText}. Save it in ai-fitness-coach/exports/ if you want to keep the weekly record.`);
  } catch (error) {
    if (error?.name === "AbortError") {
      alert("Coach packet copied to clipboard. File save was cancelled.");
      return;
    }
    alert(`Coach packet copied to clipboard, but the file save did not finish: ${error.message}`);
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

addTodayExtraButton?.addEventListener("click", addTodayExtraExercise);

todayExtraPicker?.addEventListener("change", () => {
  if (todayExtraPicker.value) addTodayExtraExercise();
});

saveTodayWorkoutButton?.addEventListener("click", () => {
  saveTodayWorkout().catch((error) => {
    console.error("Error saving today's workout:", error);
    alert(`Error: ${error.message}`);
  });
});

const exportPacketButton = document.querySelector("#export-review-packet");
const importPlanButton = document.querySelector("#import-plan");

exportPacketButton?.addEventListener("click", exportReviewPacket);
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
      }, (error) => console.error("Cloud listener error:", error));
    } else {
      cloudUser = null;
      _fbDoc = null;
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
