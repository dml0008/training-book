// ===== App / product notes =====
// A small global notes surface for Daniel's feature ideas and agent notes,
// opened from the header (and from the live-workout topbar, where the header is
// hidden). Notes sync through one shared Firestore document, with data.appNotes
// kept as the offline/local migration copy. They stay completely separate from
// workout history and can be copied/exported as plain markdown.
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

// Save the notes list to the shared app-notes document. We still keep a local
// copy in data.appNotes so existing saved notes migrate forward and the sheet
// works offline, but notes no longer belong to one user's private workout doc.
function persistAppNotes(notes) {
  const data = getLocalData();
  data.appNotes = notes;
  saveLocalData(data);
  markPendingAppNotes(notes);
  if (!navigator.onLine) return;
  saveSharedAppNotes(notes).catch((error) => {
    const msg = String(error?.message || error || "");
    const expected = /sign in/i.test(msg);
    if (!expected) {
      console.error("Shared notes save failed:", error);
      setNotesStatus("Saved on this device. Shared sync will retry automatically.", "warn");
    }
    updateConnectionState();
  });
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
