const DROPBOX_AUTHORIZE_URL = "https://www.dropbox.com/oauth2/authorize";
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload";
const DROPBOX_DOWNLOAD_URL = "https://content.dropboxapi.com/2/files/download";
const DATA_FILE_PATH = "/workout-data.json";

const STORAGE = {
  appKey: "trainingBookDropboxAppKey",
  verifier: "trainingBookDropboxVerifier",
  state: "trainingBookDropboxState",
  accessToken: "trainingBookDropboxAccessToken",
  accessTokenExpiresAt: "trainingBookDropboxAccessTokenExpiresAt",
  refreshToken: "trainingBookDropboxRefreshToken",
  localData: "trainingBookWorkoutData",
  pendingData: "trainingBookPendingWorkoutData",
  deviceId: "trainingBookDeviceId"
};

const screens = Array.from(document.querySelectorAll(".screen"));
const tabs = Array.from(document.querySelectorAll(".tab"));
const dateLabel = document.querySelector("#today-date");
const todayRoutineName = document.querySelector("#today-routine-name");
const todayRoutineList = document.querySelector("#today-routine-list");
const todayProgressNumber = document.querySelector("#today-progress-number");
const todayProgressLabel = document.querySelector("#today-progress-label");
const saveTodayWorkoutButton = document.querySelector("#save-today-workout");
const syncPill = document.querySelector("#sync-pill");
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

const today = new Date();
const todayDisplay = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric"
}).format(today);

const exercises = [
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
    todayRoutineList.innerHTML = `
      <div class="empty-routine">
        <p class="eyebrow">No workout today</p>
        <p>You have a rest day scheduled. Tap the Log tab if you want to log an extra workout.</p>
      </div>
    `;
    if (todayRoutineName) {
      todayRoutineName.textContent = "Rest day";
    }
    updateTodayProgress();
    return;
  }

  if (todayRoutineName) {
    todayRoutineName.textContent = routine.name;
  }

  activeWorkout.exercises = routine.exercises.map((plannedEx) => {
    const exerciseInfo = exercises.find((e) => e.id === plannedEx.exerciseId) || exercises[0];
    return {
      id: `today-${plannedEx.exerciseId}-${randomString(5)}`,
      exerciseId: plannedEx.exerciseId,
      name: exerciseInfo.name,
      area: exerciseInfo.area,
      icon: exerciseInfo.icon,
      targetSets: plannedEx.targetSets,
      targetReps: plannedEx.targetReps,
      targetDuration: plannedEx.targetDuration,
      checked: false
    };
  });

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

async function saveTodayWorkout() {
  const routine = getTodayPlannedRoutine();
  if (!routine) {
    alert("No workout planned for today.");
    return;
  }

  const progress = getTodayWorkoutProgress();
  if (progress.done === 0) {
    alert("Log at least one exercise before saving.");
    return;
  }

  const data = getLocalData();
  const savedAt = new Date().toISOString();
  data.updatedAt = savedAt;
  data.updatedBy = getDeviceId();
  data.workouts = Array.isArray(data.workouts) ? data.workouts : [];

  const loggedEntries = activeWorkout.exercises
    .filter((ex) => ex.checked)
    .map((ex) => {
      if (ex.targetDuration) {
        return {
          id: ex.id,
          type: "cardio",
          exerciseId: ex.exerciseId,
          exerciseName: ex.name,
          durationMinutes: ex.targetDuration,
          done: true
        };
      }
      return {
        id: ex.id,
        type: "strength",
        exerciseId: ex.exerciseId,
        exerciseName: ex.name,
        sets: Array.from({ length: ex.targetSets || 1 }).map((_, i) => ({
          id: `set-${i + 1}`,
          setNumber: i + 1,
          reps: ex.targetReps || 0,
          weight: 0,
          done: true
        }))
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
    alert("Workout saved to Dropbox!");
    activeWorkout.exercises = [];
    renderTodayRoutine();
  } catch (error) {
    alert(`${error.message} Workout is saved locally for now.`);
  }
}

const savedAppKey = localStorage.getItem(STORAGE.appKey);
if (savedAppKey && appKeyInput) {
  appKeyInput.value = savedAppKey;
}

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === name);
  });

  tabs.forEach((tab) => {
    const isActive = tab.dataset.target === name;
    tab.classList.toggle("is-active", isActive);
    if (isActive) {
      tab.setAttribute("aria-current", "page");
    } else {
      tab.removeAttribute("aria-current");
    }
  });
}

function setSyncStatus(message, tone = "") {
  if (!syncStatus) return;
  syncStatus.textContent = message;
  syncStatus.className = tone ? `sync-status ${tone}` : "sync-status";
}

function setConnectionUi(message, tone = "") {
  if (connectionBadge) {
    connectionBadge.textContent = message;
    connectionBadge.className = tone ? `connection-badge ${tone}` : "connection-badge";
  }

  if (syncPill) {
    syncPill.className = tone ? `sync-pill ${tone}` : "sync-pill";
    syncPill.lastChild.textContent = message;
  }
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
    routines: getStarterRoutines(),
    weeklyPlan: getStarterWeeklyPlan(),
    completedWorkouts: [],
    missedWorkouts: [],
    testEntries: [],
    workouts: []
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
  return readJson(STORAGE.localData) || makeEmptyData();
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

function renderExercises(filter = "all") {
  if (!exerciseList) return;

  const visibleExercises = filter === "all"
    ? exercises
    : exercises.filter((exercise) => exercise.tags.includes(filter));

  if (libraryCount) {
    const label = visibleExercises.length === 1 ? "exercise" : "exercises";
    libraryCount.textContent = `${visibleExercises.length} ${label}`;
  }

  exerciseList.innerHTML = visibleExercises.map((exercise) => `
    <article class="exercise-card">
      <div class="exercise-art">
        ${getExerciseIcon(exercise.icon)}
      </div>
      <div class="exercise-info">
        <h3>${escapeHtml(exercise.name)}</h3>
        <p class="exercise-meta">${escapeHtml(exercise.area)}</p>
        <div class="tag-row">
          ${exercise.tags.map((tag) => `<span class="exercise-tag">${escapeHtml(formatTag(tag))}</span>`).join("")}
        </div>
      </div>
    </article>
  `).join("");
}

function renderExercisePicker() {
  if (!exercisePicker) return;

  exercisePicker.innerHTML = `
    <option value="">Choose from the starter library</option>
    ${exercises.map((exercise) => `<option value="${escapeHtml(exercise.id)}">${escapeHtml(exercise.name)}</option>`).join("")}
  `;
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
      durationMinutes: ""
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
    ]
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
        done: Number(exercise.durationMinutes) > 0
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
      }))
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
  return activeWorkout.exercises.some((exercise) => {
    if (exercise.type === "cardio") return Number(exercise.durationMinutes) > 0;
    return exercise.sets.some((set) => set.done || Number(set.reps) > 0 || Number(set.weight) > 0);
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
  setWorkoutStatus("Saved on this device. Syncing to Dropbox...", "warn");

  if (!navigator.onLine) {
    resetActiveWorkout();
    setWorkoutStatus("Workout saved on this device. It will sync when internet is back.", "warn");
    return;
  }

  try {
    await uploadWorkoutData(data);
    clearPendingData();
    resetActiveWorkout();
    setWorkoutStatus("Workout saved to Dropbox and kept as a local backup.", "good");
  } catch (error) {
    resetActiveWorkout();
    setWorkoutStatus(`${error.message} Workout is saved locally for now.`, "warn");
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
  const appKey = appKeyInput?.value.trim();
  if (!appKey) {
    setSyncStatus("Paste the Dropbox app key first.", "warn");
    appKeyInput?.focus();
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
  const token = await getAccessToken();
  if (!token) throw new Error("Connect Dropbox before syncing.");

  const response = await fetch(DROPBOX_UPLOAD_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path: DATA_FILE_PATH,
        mode: "overwrite",
        autorename: false,
        mute: false,
        strict_conflict: false
      })
    },
    body: JSON.stringify(data, null, 2)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Dropbox save failed: ${message}`);
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
    setSyncStatus("Offline right now. Showing the local backup on this device.", "warn");
    renderTestEntries();
    return;
  }

  const data = await downloadWorkoutData();
  saveLocalData(data);
  setSyncStatus("Loaded the latest workout data from Dropbox.", "good");
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
  setSyncStatus("Pending data synced to Dropbox.", "good");
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
  const hasDropbox = Boolean(localStorage.getItem(STORAGE.refreshToken) || getStoredAccessToken());
  if (!navigator.onLine) {
    setConnectionUi(hasPendingData() ? "Offline, pending" : "Offline", "warn");
    return;
  }

  if (hasPendingData()) {
    setConnectionUi("Pending sync", "warn");
  } else if (hasDropbox) {
    setConnectionUi("Dropbox ready", "good");
  } else {
    setConnectionUi("Local only");
  }
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    showScreen(tab.dataset.target);
  });
});

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const filter = chip.dataset.filter || "all";
    filterChips.forEach((item) => item.classList.toggle("is-active", item === chip));
    renderExercises(filter);
  });
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

todayRoutineList?.addEventListener("change", handleTodayExerciseCheck);

saveTodayWorkoutButton?.addEventListener("click", () => {
  saveTodayWorkout().catch((error) => {
    console.error("Error saving today's workout:", error);
    alert(`Error: ${error.message}`);
  });
});

window.addEventListener("online", () => {
  updateConnectionState();
  syncPendingData().catch(() => {
    // Sync failed but will retry when user saves next workout
  });
});

window.addEventListener("offline", updateConnectionState);

renderExercises();
renderExercisePicker();
renderActiveWorkout();
renderTodayRoutine();

finishDropboxConnect().catch((error) => {
  console.error("Dropbox connection error:", error);
  updateConnectionState();
});

// Auto-authenticate with Dropbox if credentials exist
updateConnectionState();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // The shell still works if a browser skips service workers.
    });
  });
}
