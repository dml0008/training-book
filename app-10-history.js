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
