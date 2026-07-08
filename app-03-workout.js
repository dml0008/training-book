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
    cardioSegments: [],
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
    const intervals = formatCardioSegmentsSummary(ex.cardioSegments, { compact: true });
    return ex.cardioDone ? `${Number(ex.actualDuration) || 0} min${intervals ? ` · ${intervals}` : ""}${formatCardioStats(collectCardioStats(ex))}` : "Not logged";
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

function makeCardioSegment(kind = "work") {
  return {
    id: `seg-${randomString(5)}`,
    kind: kind === "rest" ? "rest" : "work",
    seconds: kind === "rest" ? 60 : 60,
    targetType: "",
    targetValue: "",
    notes: ""
  };
}

function normalizeCardioSegments(segments) {
  if (!Array.isArray(segments)) return [];
  return segments.map((segment, index) => {
    const kind = segment?.kind === "rest" ? "rest" : "work";
    const seconds = Math.max(0, Math.round(Number(segment?.seconds) || 0));
    if (seconds <= 0) return null;
    const rawTargetType = segment?.targetType || segment?.target?.type || "";
    const targetType = ["watts", "pace", "incline", "resistance"].includes(rawTargetType) ? rawTargetType : "";
    const targetValue = String(segment?.targetValue || segment?.target?.value || "").trim();
    const notes = String(segment?.notes || "").trim();
    const out = {
      id: String(segment?.id || `seg-${index + 1}`),
      kind,
      seconds
    };
    if (targetType && targetValue) out.target = { type: targetType, value: targetValue };
    if (notes) out.notes = notes;
    return out;
  }).filter(Boolean);
}

function formatSegmentDuration(seconds) {
  const sec = Math.max(0, Math.round(Number(seconds) || 0));
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  if (min && rem) return `${min}:${String(rem).padStart(2, "0")}`;
  if (min) return `${min}m`;
  return `${sec}s`;
}

function formatCardioTarget(target) {
  if (!target || !target.type || !target.value) return "";
  const label = {
    watts: "W",
    pace: "pace",
    incline: "% incline",
    resistance: "resistance"
  }[target.type] || target.type;
  return target.type === "watts"
    ? `${target.value} ${label}`
    : `${target.value} ${label}`;
}

function formatCardioSegmentsSummary(segments, options = {}) {
  const clean = normalizeCardioSegments(segments);
  if (!clean.length) return "";
  const work = clean.filter((segment) => segment.kind !== "rest").length;
  const rest = clean.filter((segment) => segment.kind === "rest").length;
  const totalSeconds = clean.reduce((sum, segment) => sum + (Number(segment.seconds) || 0), 0);
  if (options.compact) {
    const pieces = [];
    if (work) pieces.push(`${work} work`);
    if (rest) pieces.push(`${rest} rest`);
    return `intervals: ${pieces.join(" / ")} · ${formatSegmentDuration(totalSeconds)}`;
  }
  return clean.map((segment, index) => {
    const target = formatCardioTarget(segment.target);
    return `${index + 1}. ${segment.kind === "rest" ? "Rest" : "Work"} ${formatSegmentDuration(segment.seconds)}${target ? ` @ ${target}` : ""}${segment.notes ? ` (${segment.notes})` : ""}`;
  }).join(" · ");
}

function renderCardioIntervalsEditor(ex) {
  const segments = Array.isArray(ex.cardioSegments) ? ex.cardioSegments : [];
  const open = segments.length ? " open" : "";
  const totalSeconds = normalizeCardioSegments(segments).reduce((sum, segment) => sum + (Number(segment.seconds) || 0), 0);
  const rows = segments.map((segment, index) => `
    <div class="lw-interval-row" data-segment-index="${index}">
      <select data-action="cardio-segment-field" data-field="kind" aria-label="Interval ${index + 1} type">
        <option value="work"${segment.kind !== "rest" ? " selected" : ""}>Work</option>
        <option value="rest"${segment.kind === "rest" ? " selected" : ""}>Rest</option>
      </select>
      <label class="lw-field lw-interval-seconds">
        <input type="number" inputmode="numeric" min="0" step="5" value="${escapeHtml(segment.seconds || "")}" data-action="cardio-segment-field" data-field="seconds" aria-label="Interval ${index + 1} seconds" placeholder="60">
        <span>sec</span>
      </label>
      <select data-action="cardio-segment-field" data-field="targetType" aria-label="Interval ${index + 1} target type">
        <option value="">No target</option>
        <option value="watts"${(segment.targetType || segment.target?.type) === "watts" ? " selected" : ""}>Watts</option>
        <option value="pace"${(segment.targetType || segment.target?.type) === "pace" ? " selected" : ""}>Pace</option>
        <option value="incline"${(segment.targetType || segment.target?.type) === "incline" ? " selected" : ""}>Incline</option>
        <option value="resistance"${(segment.targetType || segment.target?.type) === "resistance" ? " selected" : ""}>Resistance</option>
      </select>
      <input class="lw-interval-target" type="text" value="${escapeHtml(segment.targetValue || segment.target?.value || "")}" data-action="cardio-segment-field" data-field="targetValue" aria-label="Interval ${index + 1} target value" placeholder="target">
      <button class="lw-interval-remove btn-ico" type="button" data-action="remove-cardio-segment" data-segment-index="${index}" aria-label="Remove interval ${index + 1}">${getUiIcon("x")}</button>
    </div>
  `).join("");
  return `
    <details class="lw-cardio-stats lw-cardio-intervals"${open}>
      <summary>Intervals (optional)</summary>
      <div class="lw-interval-list">
        ${rows || `<p class="lw-cardio-stat-hint">Add work/rest blocks for interval sessions. Leave empty for steady cardio.</p>`}
      </div>
      <div class="lw-interval-actions">
        <button class="quiet-button small-button btn-ico" type="button" data-action="add-cardio-segment" data-kind="work">${getUiIcon("plus")}Work</button>
        <button class="quiet-button small-button btn-ico" type="button" data-action="add-cardio-segment" data-kind="rest">${getUiIcon("plus")}Rest</button>
        ${totalSeconds > 0 ? `<button class="quiet-button small-button" type="button" data-action="use-cardio-interval-total">Use ${Math.round(totalSeconds / 60)} min total</button>` : ""}
      </div>
      <p class="lw-cardio-stat-hint">Saved as interval detail only; the total minutes above still drives Progress, calories, and coaching summaries.</p>
    </details>`;
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
      ${renderCardioIntervalsEditor(ex)}
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

  if (action === "cardio-segment-field") {
    const index = Number(input.closest("[data-segment-index]")?.dataset.segmentIndex);
    const field = input.dataset.field;
    const segment = exercise.cardioSegments?.[index];
    if (!segment) return;
    if (field === "seconds") segment.seconds = clampNumber(input.value, 0, 3600);
    else if (field === "kind") segment.kind = input.value === "rest" ? "rest" : "work";
    else if (field === "targetType") segment.targetType = input.value;
    else if (field === "targetValue") segment.targetValue = input.value;
    persistActiveWorkoutDraft();
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

  if (action === "add-cardio-segment" && exercise) {
    exercise.cardioSegments = Array.isArray(exercise.cardioSegments) ? exercise.cardioSegments : [];
    exercise.cardioSegments.push(makeCardioSegment(button.dataset.kind || "work"));
    renderTodayWorkout();
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "remove-cardio-segment" && exercise) {
    const index = Number(button.dataset.segmentIndex);
    if (Array.isArray(exercise.cardioSegments)) exercise.cardioSegments.splice(index, 1);
    renderTodayWorkout();
    persistActiveWorkoutDraft();
    return;
  }

  if (action === "use-cardio-interval-total" && exercise) {
    const totalSeconds = normalizeCardioSegments(exercise.cardioSegments).reduce((sum, segment) => sum + (Number(segment.seconds) || 0), 0);
    if (totalSeconds > 0) exercise.actualDuration = Math.round(totalSeconds / 60);
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
        const segments = normalizeCardioSegments(ex.cardioSegments);
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
        if (segments.length) entry.segments = segments;
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
