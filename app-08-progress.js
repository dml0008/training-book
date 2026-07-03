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
