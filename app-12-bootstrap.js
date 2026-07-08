// Swap any data-icon placeholders (e.g. the nav bar) for their Lucide SVGs.
renderUiIcons();

tabs.forEach((tab) => {
  tab.addEventListener("click", async () => {
    if (activeWorkout.started && tab.dataset.target !== "today") {
      const ok = await showConfirmModal({
        title: "Leave workout screen?",
        message: "Your progress is saved as a draft. Leaving the focused view can break your rhythm, so Training Book asks first.",
        confirmLabel: "Leave screen",
        danger: false
      });
      if (!ok) return;
      persistActiveWorkoutDraft();
    }
    showScreen(tab.dataset.target, true);
  });
});

// Filter chips are rebuilt whenever categories change, so use delegation.
filterStrip?.addEventListener("click", (event) => {
  const chip = event.target.closest(".filter-chip");
  if (!chip) return;
  const filter = chip.dataset.filter || "all";
  filterStrip.querySelectorAll(".filter-chip").forEach((item) => item.classList.toggle("is-active", item === chip));
  renderExercises(filter);
});

// Library: the "Edit categories" button opens the category manager modal.
document.querySelector("#open-edit-categories")?.addEventListener("click", openCategoriesModal);

// Library: how-to / favourite / edit / remove actions on the exercise list.
exerciseList?.addEventListener("click", handleLibraryListClick);

// Library: the edit-exercise modal — controls + staged photo uploads.
const libraryEditModalRoot = document.querySelector("#library-edit-modal-root");
libraryEditModalRoot?.addEventListener("click", handleEditModalClick);
libraryEditModalRoot?.addEventListener("change", (event) => {
  const fileInput = event.target.closest('input[type="file"][data-photo-slot]');
  if (!fileInput || !fileInput.files || !fileInput.files[0]) return;
  const slot = fileInput.dataset.photoSlot;
  downscaleImage(fileInput.files[0])
    .then((dataUrl) => {
      if (!editingDraftPhotos) editingDraftPhotos = {};
      editingDraftPhotos[slot] = dataUrl;
      applyStagedPhotoToModal(fileInput, dataUrl);
    })
    .catch((error) => alert(error.message || "That image could not be used."));
});
libraryEditModalRoot?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.classList.contains("exercise-edit-name")) {
    event.preventDefault();
    const modal = event.target.closest(".edit-sheet");
    modal?.querySelector('[data-action="save-exercise"]')?.click();
  }
});

// Library: live search box filters the cards as you type.
const librarySearchInput = document.querySelector("#library-search");
librarySearchInput?.addEventListener("input", () => {
  librarySearch = librarySearchInput.value || "";
  renderExercises();
});

// Library: the "How to do it" sheet is read-only now — just close on X / Done /
// scrim. (Photo editing moved to the exercise edit card.)
const librarySheetRoot = document.querySelector("#library-sheet-root");
librarySheetRoot?.addEventListener("click", (event) => {
  const onCloseButton = event.target.closest('[data-action="close-library-how-to"]');
  const onScrim = event.target.classList.contains("lw-sheet-scrim");
  if (onCloseButton || onScrim) closeLibraryReference();
});

// The Today preview's "How to do it" sheet: close on its close button or scrim.
const todayHowToRoot = document.querySelector("#today-howto-root");
todayHowToRoot?.addEventListener("click", (event) => {
  const onCloseButton = event.target.closest('[data-action="close-today-how-to"]');
  const onScrim = event.target.classList.contains("lw-sheet-scrim");
  if (onCloseButton || onScrim) closeTodayReference();
});

// "Report an issue" lives on the shared how-to sheet, which renders in three
// different roots (live workout, Library, Today), so route it once at the top.
document.addEventListener("click", (event) => {
  const btn = event.target.closest('[data-action="report-exercise-issue"]');
  if (!btn) return;
  reportExerciseIssue(btn.dataset.id, btn.dataset.name);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (editingExerciseId) closeEditExerciseModal();
  else if (categoriesModalOpen) closeCategoriesModal();
  else if (addModalOpen) closeAddExerciseModal();
  else if (planPicker.routineId) closePlanPicker();
  else if (libraryReferenceId) closeLibraryReference();
  else if (todayReferenceId) closeTodayReference();
});

// Library: the "Add an exercise" button opens a small modal (name + type).
document.querySelector("#open-add-exercise")?.addEventListener("click", openAddExerciseModal);

const libraryAddModalRoot = document.querySelector("#library-add-modal-root");
libraryAddModalRoot?.addEventListener("click", (event) => {
  const typeOption = event.target.closest("[data-add-type] .type-option");
  if (typeOption) {
    addModalType = typeOption.dataset.type || "strength";
    libraryAddModalRoot.querySelectorAll("[data-add-type] .type-option").forEach((btn) => btn.classList.toggle("is-active", btn === typeOption));
    return;
  }
  const button = event.target.closest("[data-action]");
  if (button?.dataset.action === "submit-add") submitAddExercise();
  else if (button?.dataset.action === "close-add" || event.target.hasAttribute("data-add-scrim")) closeAddExerciseModal();
});
libraryAddModalRoot?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.id === "add-ex-name") {
    event.preventDefault();
    submitAddExercise();
  }
});

// Library: the "Edit categories" modal — add / remove / relabel + save / close.
const libraryCategoriesModalRoot = document.querySelector("#library-categories-modal-root");
libraryCategoriesModalRoot?.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-categories-scrim")) { closeCategoriesModal(); return; }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "add-category") addCategoryRow();
  else if (action === "remove-category") removeCategoryRow(Number(button.dataset.index));
  else if (action === "save-categories") saveCategories();
  else if (action === "close-categories") closeCategoriesModal();
});
libraryCategoriesModalRoot?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.classList.contains("cat-row-input")) {
    event.preventDefault();
    saveCategories();
  }
});

const settingsButton = document.querySelector("#settings-button");
settingsButton?.addEventListener("click", openSettingsModal);

const settingsModalRoot = document.querySelector("#settings-modal-root");
settingsModalRoot?.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-settings-scrim")) { closeSettingsModal(); return; }
  const button = event.target.closest("[data-action]");
  if (button?.dataset.action === "close-settings") { closeSettingsModal(); return; }
  if (button) handleSettingsDataAction(event);
});
settingsModalRoot?.addEventListener("change", handleRestoreFileChosen);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settingsModalOpen) closeSettingsModal();
});

// Plan details modal: small icon button on the Plan heading opens it.
const planDetailsButton = document.querySelector("#plan-details-button");
planDetailsButton?.addEventListener("click", openPlanDetailsModal);

const planDetailsModalRoot = document.querySelector("#plan-details-modal-root");
planDetailsModalRoot?.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-plan-details-scrim")) { closePlanDetailsModal(); return; }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (button.dataset.action === "close-plan-details") { closePlanDetailsModal(); return; }
  if (button.dataset.action === "save-plan-notes") saveActivePlanFromScreen();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && planDetailsModalOpen) closePlanDetailsModal();
});

// Milestone goal editor: shared by the Plan tab's "Add goal"/"Edit" buttons
// and the edit icon on the Progress focus-goal card (handlePlanClick and the
// Progress wiring in renderProgress() both just call openGoalPicker/openGoalEditor).
const goalEditorModalRoot = document.querySelector("#goal-editor-modal-root");
goalEditorModalRoot?.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-goal-editor-scrim")) { closeGoalEditor(); return; }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  switch (button.dataset.action) {
    case "close-goal-editor": closeGoalEditor(); break;
    case "pick-goal-exercise": pickGoalExercise(button.dataset.id); break;
    case "save-goal": saveGoalFromEditor(); break;
    case "delete-goal": deleteGoal(button.dataset.id); break;
    default: break;
  }
});
goalEditorModalRoot?.addEventListener("input", (event) => {
  if (event.target.id !== "goal-picker-search") return;
  goalEditor.query = event.target.value;
  const resultsEl = goalEditorModalRoot.querySelector(".goal-picker-results");
  if (resultsEl) resultsEl.innerHTML = renderGoalPickerResults();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && goalEditor.step !== "closed") closeGoalEditor();
});

// App / product notes: the header button opens the sheet; the live-workout
// topbar button (handled in handleTodayWorkoutClick) opens it tagged "workout".
const notesButton = document.querySelector("#notes-button");
notesButton?.addEventListener("click", () => openNotesModal({ source: "manual" }));

const notesModalRoot = document.querySelector("#notes-modal-root");
notesModalRoot?.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-notes-scrim")) { closeNotesModal(); return; }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  handleNotesAction(button.dataset.action, button.dataset.noteId);
});
// Ctrl/Cmd+Enter in the compose box is a quick "add note" so capture stays fast.
notesModalRoot?.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && event.target.id === "note-input") {
    event.preventDefault();
    addNoteFromInput();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && notesModalOpen) closeNotesModal();
});

// Schedule calendar modal: open from the Workout day switcher, navigate months,
// tap a day for its detail, and close via scrim / X / Escape.
openCalendarButton?.addEventListener("click", openCalendarModal);

calendarModalRoot?.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-calendar-scrim")) { closeCalendarModal(); return; }
  if (event.target.closest('[data-action="close-calendar"]')) { closeCalendarModal(); return; }
  const step = event.target.closest("[data-cal-step]");
  if (step) {
    const delta = Number(step.dataset.calStep) || 0;
    progressMonthDate = new Date(Date.UTC(
      progressMonthDate.getUTCFullYear(),
      progressMonthDate.getUTCMonth() + delta,
      1
    ));
    renderCalendarModal();
    return;
  }
  handleCalendarDayClick(event);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && calendarModalOpen) closeCalendarModal();
});

// Tapping a day on the Progress-tab calendar opens its detail panel too. The
// month-nav arrows there are wired per-render inside renderProgress.
progressContent?.addEventListener("click", handleCalendarDayClick);

addExerciseButton?.addEventListener("click", addExerciseToWorkout);

exercisePicker?.addEventListener("change", () => {
  if (exercisePicker.value) addExerciseToWorkout();
});

activeWorkoutList?.addEventListener("input", handleWorkoutInput);
activeWorkoutList?.addEventListener("change", handleWorkoutInput);
activeWorkoutList?.addEventListener("click", handleWorkoutClick);
historyContent?.addEventListener("click", handleHistoryClick);

saveWorkoutButton?.addEventListener("click", () => {
  saveWorkout().catch((error) => {
    setWorkoutStatus(error.message, "bad");
  });
});

todayRoutineList?.addEventListener("click", handleTodayWorkoutClick);
todayRoutineList?.addEventListener("change", handleTodayWorkoutChange);
todayRoutineList?.addEventListener("input", handleTodayWorkoutChange);
// Keyboard activation for the tappable preview rows (role="button").
todayRoutineList?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest('[data-action="preview-how-to"]');
  if (!card) return;
  event.preventDefault();
  openTodayReference(card.dataset.id);
});

reviewReminderGo?.addEventListener("click", () => showScreen("coach", true));
reviewReminderDismiss?.addEventListener("click", () => {
  snoozeCoachReminder(7);
});

startTodayButton?.addEventListener("click", openWorkoutFlowChoice);
startCustomButton?.addEventListener("click", startCustomWorkout);
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

// Plan screen: one set of delegated listeners (attached once) handles every
// control the section renderers draw, since renderPlan() replaces the markup.
planContent?.addEventListener("click", handlePlanClick);
planContent?.addEventListener("change", handlePlanChange);
planContent?.addEventListener("input", handlePlanInput);
// Weekly-schedule drag-and-drop (desktop). Touch screens use the tap-to-swap handle.
planContent?.addEventListener("dragstart", handlePlanDragStart);
planContent?.addEventListener("dragover", handlePlanDragOver);
planContent?.addEventListener("drop", handlePlanDrop);
planContent?.addEventListener("dragend", handlePlanDragEnd);
coachContent?.addEventListener("click", handleCoachClick);

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

window.addEventListener("beforeunload", (event) => {
  if (!activeWorkout.started) return;
  persistActiveWorkoutDraft();
  event.preventDefault();
  event.returnValue = "";
});

refreshLibrary();
repairSoccerDurationInvariant();
renderFilterStrip();
renderExercises();
renderExercisePicker();
renderActiveWorkout();
renderTodayRoutine();
renderPlan();
showScreen(localStorage.getItem(STORAGE.activeTab) || "today");
offerResumeWorkoutDraft();

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
  let appMod, authMod, fsMod, fnMod;
  try {
    [appMod, authMod, fsMod, fnMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/12.14.0/firebase-functions.js")
    ]);
  } catch (error) {
    // Offline or the Firebase code could not load: the app still works
    // fully on this device using the local backup. Sync resumes next launch.
    console.error("Cloud sync could not load right now:", error);
    // No cloud to reconcile against, so it is safe to seed locally now.
    reseedLibraryOnce();
    mergeLibraryV3Once();
    refreshLibraryFieldsOnce();
    seedSoccerOnce();
    seedPelotonOnce();
    seedPickleballOnce();
    restoreSportTypesOnce();
    repairCatalogDataOnce();
    repairPelotonBikeHistoryOnce();
    repairSoccerDurationInvariant({ rerender: true });
    updateCloudUi();
    return;
  }

  const fbApp = appMod.initializeApp(FIREBASE_CONFIG);
  firebaseLoaded = true;
  const fbAuth = authMod.getAuth(fbApp);
  const fbDb = fsMod.getFirestore(fbApp);
  const fbFunctions = fnMod.getFunctions(fbApp, "us-central1");
  const provider = new authMod.GoogleAuthProvider();
  // Always show Google's account chooser instead of silently re-using the last
  // account. Without this, "Switch account" could just sign the same person back
  // in. With it, Daniel can pick which profile (his or his wife's) to load.
  provider.setCustomParameters({ prompt: "select_account" });
  _setDoc = fsMod.setDoc;
  _coachReviewCallable = fnMod.httpsCallable(fbFunctions, "coachReview");
  // Capture the Firestore helpers the version-history backup layer needs.
  _fb = {
    db: fbDb,
    collection: fsMod.collection,
    doc: fsMod.doc,
    setDoc: fsMod.setDoc,
    getDoc: fsMod.getDoc,
    getDocs: fsMod.getDocs,
    query: fsMod.query,
    orderBy: fsMod.orderBy,
    deleteDoc: fsMod.deleteDoc
  };

  // Decide what to do when the cloud sends us the latest saved data. We MERGE
  // rather than overwrite: history lists are unioned and a freshly-seeded
  // starter plan never replaces a customised one, so an empty/default copy from
  // one device can no longer wipe real data off the others (the bug that lost
  // Daniel's history on 2026-06-18). If our merge recovers something the cloud
  // was missing, we push the repaired copy back so all devices converge on it.
  function reconcile(remote) {
    const local = readJson(STORAGE.localData);

    function applySharedAppNotesCache() {
      if (!Array.isArray(sharedAppNotesCache)) return;
      const localNotes = getLocalData().appNotes || [];
      const mergedNotes = mergeAppNotes(sharedAppNotesCache, localNotes);
      if (JSON.stringify(localNotes) !== JSON.stringify(mergedNotes)) {
        setLocalAppNotes(mergedNotes);
      }
    }

    if (!remote) {
      // Nothing in the cloud yet: seed it from this device, but never write a
      // blank/starter doc as the canonical copy.
      if (local && normalizeSoccerDurationInData(local)) {
        applyRecoveredData(local);
        applySharedAppNotesCache();
      }
      if (local && hasRealHistory(local)) {
        cloudSave(local).catch((e) => console.error("Initial cloud push failed:", e));
      }
      return;
    }

    if (!local) {
      // First run on this device: take the cloud copy as-is.
      const firstRun = structuredClone(remote);
      const soccerFixed = normalizeSoccerDurationInData(firstRun);
      applyRecoveredData(firstRun);
      applySharedAppNotesCache();
      if (soccerFixed) {
        cloudSave(firstRun).catch((e) => console.error("Soccer duration cloud repair failed:", e));
      }
      return;
    }

    const merged = mergeWorkoutData(local, remote);
    const soccerFixed = normalizeSoccerDurationInData(merged);

    // Keep a one-tap undo point whenever an incoming sync changes this device.
    if (dataChanged(local, merged)) pushLocalSnapshot("before sync", local);

    applyRecoveredData(merged);
    applySharedAppNotesCache();

    // Heal the cloud if our merge holds data the remote copy was missing.
    if (soccerFixed || dataChanged(merged, remote)) {
      cloudSave(merged).catch((e) => console.error("Cloud heal push failed:", e));
    }
  }

  function reconcileSharedAppNotes(remote) {
    const remoteNotes = Array.isArray(remote?.notes)
      ? remote.notes
      : (Array.isArray(remote?.appNotes) ? remote.appNotes : []);
    const localNotes = getLocalData().appNotes || [];
    const pendingNotes = readJson(STORAGE.pendingAppNotes)?.notes || [];
    const merged = mergeAppNotes(remoteNotes, mergeAppNotes(localNotes, pendingNotes));
    const localChanged = JSON.stringify(localNotes) !== JSON.stringify(merged);
    const remoteChanged = JSON.stringify(remoteNotes) !== JSON.stringify(merged);

    sharedAppNotesCache = merged;
    if (localChanged) setLocalAppNotes(merged);
    if (!remote || remoteChanged) {
      saveSharedAppNotes(merged).catch((e) => {
        markPendingAppNotes(merged);
        console.error("Shared notes migration/sync failed:", e);
      });
    }
  }

  authMod.onAuthStateChanged(fbAuth, (user) => {
    if (_cloudUnsub) { _cloudUnsub(); _cloudUnsub = null; }
    if (_sharedNotesUnsub) { _sharedNotesUnsub(); _sharedNotesUnsub = null; }

    if (user) {
      // Profile-switch guard. The working copy in localStorage belongs to one
      // account at a time. If the person signing in is DIFFERENT from the one
      // who owns the device's current local copy, wipe that copy first so it
      // cannot bleed into - or, via reconcile()'s merge, overwrite and then get
      // pushed onto - the new account's cloud document. With local cleared,
      // reconcile() takes the first-run path and loads the new account's own
      // cloud data cleanly. The previous account's data stays safe in its own
      // users/{uid} document and version history. Same person re-signing in
      // (uid unchanged) keeps their local copy, including any unsynced edits.
      const prevOwner = localStorage.getItem(STORAGE.localDataOwner);
      if (prevOwner && prevOwner !== user.uid) {
        clearDeviceLocalData();
      }
      localStorage.setItem(STORAGE.localDataOwner, user.uid);

      cloudUser = { uid: user.uid, email: user.email, name: user.displayName || "" };
      _fbDoc = fsMod.doc(fbDb, "users", user.uid);
      _sharedAppNotesDoc = fsMod.doc(fbDb, "shared", "appNotes");
      // Listen for changes so the other device updates automatically.
      _cloudUnsub = fsMod.onSnapshot(_fbDoc, (snap) => {
        if (snap.metadata.hasPendingWrites) return; // ignore our own just-made save
        reconcile(snap.exists() ? snap.data() : null);
        // Replace the library with the photo/glyph set, then seed soccer - both
        // on top of the freshest synced data (each runs once). Doing it here, not
        // at startup, avoids a stale device overwriting newer cloud data.
        reseedLibraryOnce();
        mergeLibraryV3Once();
        refreshLibraryFieldsOnce();
        seedSoccerOnce();
        seedPelotonOnce();
        seedPickleballOnce();
        restoreSportTypesOnce();
        repairCatalogDataOnce();
        repairPelotonBikeHistoryOnce();
        repairSoccerDurationInvariant({ rerender: true });
      }, (error) => console.error("Cloud listener error:", error));
      _sharedNotesUnsub = fsMod.onSnapshot(_sharedAppNotesDoc, (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        reconcileSharedAppNotes(snap.exists() ? snap.data() : null);
        syncPendingAppNotes().catch((e) => console.error("Pending shared notes sync failed:", e));
      }, (error) => console.error("Shared notes listener error:", error));
    } else {
      cloudUser = null;
      _fbDoc = null;
      _sharedAppNotesDoc = null;
      sharedAppNotesCache = null;
      // Signed out: the local cache belongs to whoever just left, so drop it.
      // No plan/history/progress should linger on the device while nobody is
      // signed in - that lingering cache is what let one account's data bleed
      // into another. The signed-out gate (updateCloudUi) covers the app until
      // someone signs in, at which point reconcile() loads their account fresh.
      // Library seeding intentionally does NOT run here anymore; it runs after
      // sign-in (in the snapshot handler), on top of that account's own data.
      clearDeviceLocalData();
    }
    authChecked = true;
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

  // Popup sign-in is the most reliable on desktop and avoids the redirect
  // session being dropped. If a popup is blocked (some phone setups), fall back
  // to the redirect style instead. Shared by both the Sign in and Switch account
  // buttons so the account-chooser behaviour is identical.
  function startSignIn() {
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
  }

  cloudSignInButton?.addEventListener("click", startSignIn);
  document.querySelector("#gate-signin")?.addEventListener("click", startSignIn);

  // Sign out cleanly. Because signing out drops this device's local cache (so no
  // data lingers for the next person), push any unsynced edits up FIRST while we
  // still can - after sign-out we can no longer write to this account's document.
  async function signOutCurrentUser() {
    try {
      if (hasPendingData() && navigator.onLine) {
        const pending = readJson(STORAGE.pendingData);
        if (pending) { await uploadWorkoutData(pending); clearPendingData(); }
      }
      if (hasPendingAppNotes() && navigator.onLine) {
        await syncPendingAppNotes();
      }
    } catch (e) {
      console.error("Pre-sign-out sync skipped:", e);
    }
    await authMod.signOut(fbAuth);
  }

  cloudSignOutButton?.addEventListener("click", () => {
    signOutCurrentUser().catch((error) => console.error("Sign-out failed:", error));
  });

  // Switch account: sign out of the current profile, then immediately open the
  // Google account chooser to sign in as someone else (e.g. Daniel -> his wife).
  // When the new account differs from the one that owns this device's local copy,
  // onAuthStateChanged wipes that copy first (see clearDeviceLocalData), so each
  // profile loads cleanly from its own cloud document - no merging between people.
  // The previous profile's data stays safe in its own account; switching back
  // reloads it from the cloud. signOutCurrentUser() flushes any unsynced edits
  // up first. Confirm anyway, since it changes whose data is on screen.
  cloudSwitchButton?.addEventListener("click", async () => {
    const current = cloudUser ? (cloudUser.name || cloudUser.email || "this account") : "this account";
    const ok = await showConfirmModal({
      title: "Switch account?",
      message: `This signs out of ${current} and loads a different person's plan on this device. ${current}'s data stays safe in their own account and reloads when you switch back.`,
      confirmLabel: "Switch account",
      danger: false
    });
    if (!ok) return;
    try {
      await signOutCurrentUser();
    } catch (error) {
      console.error("Sign-out before switch failed:", error);
    }
    startSignIn();
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
