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
    const intervals = formatCardioSegmentsSummary(entry.segments, { compact: true });
    return `${subtype ? `${subtype}: ` : ""}${planned}actual ${entry.durationMinutes || 0} min${intervals ? ` · ${intervals}` : ""}${formatCardioStats(entry.stats)}${entry.notes ? ` · ${entry.notes}` : ""}`;
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
