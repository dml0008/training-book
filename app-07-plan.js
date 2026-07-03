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
    const intervalDetail = entry.type === "cardio" && Array.isArray(entry.segments) && entry.segments.length
      ? ` | Intervals: ${formatCardioSegmentsSummary(entry.segments)}`
      : "";
    lines.push(`  ${entry.exerciseName}: ${formatEntryDetails(entry)}${intervalDetail} | ${effort}${notes ? ` | Notes: ${notes}` : ""}`);
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
