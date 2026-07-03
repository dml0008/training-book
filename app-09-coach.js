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
