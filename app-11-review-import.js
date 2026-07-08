// Mirrors choosePerson() in ai-fitness-coach/functions/index.js so the manual
// "Copy prompt" packet knows whose equipment facts to include. cloudUser is a
// global set in app-12-bootstrap.js's auth listener (declared app-01-core.js).
function getReviewPacketPerson() {
  const label = `${cloudUser?.name || ""} ${cloudUser?.email || ""}`.toLowerCase();
  if (label.includes("shaina")) return "Shaina";
  if (label.includes("daniel")) return "Daniel";
  return "Generic";
}

// Per-person equipment/location facts for the manual "Copy prompt" packet.
// Source of truth for these facts is the private docs in ai-fitness-coach/ —
// keep this in sync with Daniel's and Shaina's current-goals.md Equipment
// sections whenever equipment changes. Generic (unrecognized user) gets no
// invented equipment — the packet just prompts the AI to ask, as before.
function getReviewPacketEquipmentLines(person) {
  if (person === "Daniel") {
    return [
      "MY EQUIPMENT & TRAINING LOCATIONS:",
      "- Home: Peloton Bike, adjustable dumbbells up to 50 lb each hand, mat/bodyweight space.",
      "  No bench at home — press from the floor or use push-ups instead.",
      "- Sister's gym: REP Ares 2.0 power rack with an integrated dual-independent-stack",
      "  cable/functional trainer — Lat Pulldown, Seated Cable Row, Cable Crossover, and",
      "  Incline Cable Fly are all on it and logged/discussed as PER-SIDE weight, not a",
      "  combined total. Also there: a pull-up bar, an adjustable bench, barbell + weight",
      "  plates, adjustable dumbbells, a Peloton Tread AND a Peloton Bike, mats, and a sauna.",
      "  No other selectorized machines (no leg press, leg curl/extension, pec deck, etc.) —",
      "  leg and accessory work uses the barbell, dumbbells, cables, and bodyweight instead.",
      "- Typical weekly split: about 2-3 days/week at the sister's gym, 2 days/week at home,",
      "  plus Thursday soccer — but the exact split varies week to week, so always ask me how",
      "  many sessions I'm planning at each location before finalizing a plan.",
      "- Each of my current routines is tagged in CURRENT ROUTINES below as [Home], [Gym], or",
      "  [Home or gym] — use that tag to know which location's equipment applies, and update it",
      "  if we change where a routine happens.",
      "- Exercise equipment tags below, mapped to where I can actually do them: \"body only\" and",
      "  \"dumbbell\" work at both locations. \"barbell\" and \"cable\" only work at the sister's gym",
      "  (no barbell or cable machine at home). \"machine\" and \"kettlebell\" exercises are NOT",
      "  available to me at either location right now — do not program those unless I tell you",
      "  that's changed.",
      ""
    ];
  }
  if (person === "Shaina") {
    return [
      "MY EQUIPMENT & TRAINING LOCATIONS:",
      "- Home: Peloton Bike, adjustable dumbbells, and a mat.",
      "- Sibling's house: a treadmill and a REP Ares 2.0 cable machine (dual-independent-stack",
      "  — Cable Crossover, Incline Cable Fly, Lat Pulldown, and Seated Cable Row are",
      "  logged/discussed as PER-SIDE weight, not a combined total).",
      "- Typical schedule: about 4-5 days/week, often Monday, Wednesday, Friday, Saturday,",
      "  Sunday, roughly 20-45 minutes per session — but the exact split varies week to week,",
      "  so always ask me how many sessions I'm planning at each location before finalizing a",
      "  plan.",
      "- Limitation: recurring hip and lumbar pain — keep spinal loading light; avoid heavy",
      "  hinging/deadlifts and loaded twisting.",
      "- Each of my current routines is tagged in CURRENT ROUTINES below as [Home], [Gym], or",
      "  [Home or gym] — use that tag to know which location's equipment applies, and update it",
      "  if we change where a routine happens.",
      "- Exercise equipment tags below, mapped to where I can actually do them: \"body only\" and",
      "  \"dumbbell\" work at both locations. \"cable\" only works at the sibling's house (the Ares",
      "  2.0 cable machine there). \"barbell\", \"machine\", and \"kettlebell\" exercises are NOT",
      "  available to me at either location right now — do not program those unless I tell you",
      "  that's changed.",
      ""
    ];
  }
  return [];
}

function generateReviewPacket() {
  const data = getLocalData();
  const packet = [];
  const activePlan = { ...getStarterActivePlan(), ...(data.activePlan || {}) };
  const weeklyPlan = data.weeklyPlan || getStarterWeeklyPlan();
  const routines = Array.isArray(data.routines) ? data.routines : [];
  const library = Array.isArray(data.library) ? data.library : exercises;
  const bodyWeights = Array.isArray(data.bodyWeights) ? data.bodyWeights.slice() : [];
  const weightTarget = typeof data.weightTarget === "number" ? data.weightTarget : null;
  const person = getReviewPacketPerson();

  packet.push("=== TRAINING BOOK — AI COACH HANDOFF ===");
  packet.push(`Exported: ${new Date().toISOString()}`);
  packet.push("");

  packet.push("YOU ARE MY PERSONAL STRENGTH & CONDITIONING COACH.");
  packet.push("Everything below is my real training context: my goals, my current plan, my");
  packet.push("complete workout history (including how hard each set felt), my body weight, and");
  packet.push("my exercise library. Please read all of it before you respond.");
  packet.push("");

  packet.push("HOW TO COACH ME (read this carefully):");
  packet.push("- Do NOT open by dumping a new plan. Start like a real coach: a short read on how");
  packet.push("  last week actually went, based on the data below.");
  packet.push("- Then ask me questions before deciding anything — e.g. how my body feels, any pain");
  packet.push("  or niggles, what I want to focus on this week, how many days and how much time I");
  packet.push("  have, equipment access, and anything the numbers can't tell you.");
  packet.push("- Before finalizing any plan, ask me how many sessions I expect at each location I");
  packet.push("  train this week (e.g. home vs. gym) rather than assuming a fixed split — confirm");
  packet.push("  the split with me, then design around it.");
  packet.push("- Give me options with a clear recommendation and the reasoning behind it. This is a");
  packet.push("  back-and-forth conversation — react to my answers, push back when useful, and help");
  packet.push("  me decide. Don't rush to a final plan.");
  packet.push("- Use plain language and avoid emojis. Keep the tone practical, specific, and easy");
  packet.push("  to read on a phone.");
  packet.push("- Use my effort ratings, notes, skipped exercises, rest, and trends to progress me");
  packet.push("  sensibly: add reps/weight where sets felt easy, hold or back off where something");
  packet.push("  was painful, repeatedly skipped, or consistently maxed out.");
  packet.push("");

  packet.push("THE FINAL DELIVERABLE (important):");
  packet.push("- After we've talked it through and I've confirmed I'm happy, your LAST message must");
  packet.push("  be ONLY my next-week plan in the exact paste-ready format shown at the very bottom");
  packet.push("  of this document — nothing else in that message, no commentary around it.");
  packet.push("- I paste that block straight into Training Book's \"Paste an updated plan\" importer,");
  packet.push("  so it must match the format exactly (including any rest targets).");
  packet.push("- Include short exercise-specific coach notes when they will help me during the");
  packet.push("  workout. Training Book shows these as live \"Coach\" callouts on that exercise.");
  packet.push("- Alongside the week's plan, also include 1 extra alternate routine tagged [Home] and");
  packet.push("  1 extra alternate routine tagged [Gym] that I can manually swap into any day later —");
  packet.push("  still built from my real history, effort trends, and goals, just not referenced in");
  packet.push("  the WEEKLY PLAN section (so they land in my routine list without being scheduled).");
  packet.push("  Skip this only if I say I don't want alternates this time.");
  packet.push("- Do not say you saved or changed my plan. You are drafting; I preview and save");
  packet.push("  changes manually inside Training Book.");
  packet.push("- Do NOT give me that plan block until we've discussed and I ask for it. Until then,");
  packet.push("  just coach me.");
  packet.push("");

  packet.push("HOW TRAINING BOOK WORKS (so the plan you give me imports cleanly):");
  packet.push("- My workout follows the weekly plan and its routines, but I can add ad-hoc exercises mid-session.");
  packet.push("- Strength targets are sets x reps, optionally a starting weight (3x8 @ 95 lb) and a rest target (rest 90s). I log actual sets, reps, weight, per-set notes, and an optional per-set effort 1-10.");
  packet.push("- Cardio/Peloton targets are a subtype plus minutes (Peloton Tread: Incline Walk, 30 min; Peloton Bike: Just Ride, 20 min). I log output, average power, distance, notes, effort, and sometimes optional work/rest interval segments; the total minutes are still the source of truth for volume.");
  packet.push("- For bike work, default to Peloton Bike instead of Stationary Bike unless I explicitly say it is a non-Peloton stationary bike.");
  packet.push("- Russian Twist should usually include a light starting weight when programming it for me, and one rep means right side plus left side. Dead Bug reps also count right plus left as one full rep.");
  packet.push("- Cable Crossover, Incline Cable Fly, Lat Pulldown, and Seated Cable Row are on a dual-independent-stack cable machine (Ares 2.0): the weight for these is per side, not a combined total, and every place it's shown says \"lb per side\" or \"lb/side\". When suggesting a weight for these four exercises, give the per-side number, matching what's already logged.");
  packet.push("- Held moves (e.g. plank) are timed: targets are sets x seconds (3x45 sec), optionally a rest target. I log EACH hold's actual seconds separately (e.g. 60s · 60s · 45s) plus optional per-hold effort.");
  packet.push("- Effort is rated 1-10 (1 = easy, 10 = all-out), logged per set/hold, and is optional — \"not logged\" means I didn't rate it, not that it was easy.");
  packet.push("- Rest targets (rest 90s) show during the live workout. Add \"timer\" after a rest target only when Training Book should run a countdown.");
  packet.push("- Exercise coach notes are imported with a `note:` line under an exercise. These");
  packet.push("  are not general plan notes; they appear during the live workout for that move.");
  packet.push("- Skipped exercises are marked skipped in History; coach around repeated skips.");
  packet.push("");

  getReviewPacketEquipmentLines(person).forEach((line) => packet.push(line));

  packet.push("ACTIVE PLAN:");
  packet.push(`name: ${activePlan.name || "Current Training Plan"}`);
  packet.push(`main goal: ${activePlan.mainGoal || "(not set)"}`);
  packet.push(`review cadence: ${activePlan.reviewCadence || "(not set)"}`);
  packet.push(`next review date: ${activePlan.nextReviewDate || "(not set)"}`);
  packet.push(`notes: ${activePlan.notes || "(none)"}`);
  packet.push("");

  const focusGoals = Array.isArray(activePlan.focusGoals) ? activePlan.focusGoals : [];
  if (focusGoals.length) {
    packet.push("FOCUS GOALS (context only — this manual chat format has no way to save changes to these):");
    focusGoals.forEach((goal) => {
      const name = goal.exerciseName || getExerciseById(goal.exerciseId)?.name || goal.exerciseId || "Exercise";
      const goalWeightUnit = getExerciseById(goal.exerciseId)?.dualStack ? "lb per side" : "lb";
      const targetParts = [];
      if (Number(goal.targetWeight) > 0) targetParts.push(`${goal.targetWeight} ${goalWeightUnit}`);
      if (Number(goal.targetReps) > 0) targetParts.push(`${goal.targetReps} reps`);
      if (Number(goal.targetSets) > 0) targetParts.push(`${goal.targetSets} sets`);
      const { sessions } = goal.exerciseId ? getStrengthSeries(goal.exerciseId) : { sessions: [] };
      const best = sessions.reduce((top, s) => (!top || s.y > top.y) ? s : top, null);
      packet.push(`- ${name}: target ${targetParts.length ? targetParts.join(" x ") : "(not set)"}, best so far ${best ? `${best.y} ${goalWeightUnit} x ${best.reps} (${best.date})` : "(no logged sets yet)"}`);
    });
    packet.push("");
  }

  packet.push("EXERCISE LIBRARY (equipment tag shows what each exercise needs — cross-check against");
  packet.push("MY EQUIPMENT & TRAINING LOCATIONS above to know where each exercise is actually possible):");
  library.forEach((exercise) => {
    const tags = [exercise.type || "strength", exercise.area, exercise.equipment].filter(Boolean);
    packet.push(`- ${exercise.name} (${tags.join(", ")})`);
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
    packet.push(`ROUTINE: ${routine.name} [${formatLocation(routine.location)}]`);
    routine.exercises?.forEach((exercise) => {
      packet.push(formatRoutineExercise(exercise));
      if (exercise.coachNote) packet.push(`  note: ${exercise.coachNote}`);
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

  packet.push("=== FINAL DELIVERABLE: RETURN FORMAT FOR TRAINING BOOK IMPORT ===");
  packet.push("Only once we've talked through the week and I ask you for the plan, send a final");
  packet.push("message containing ONLY plain text in exactly this format (no intro, no commentary");
  packet.push("before or after — just this block so I can paste it straight into the app):");
  packet.push("");
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
  packet.push("ROUTINE: Routine Name [Gym]");
  packet.push("- Exercise Name: 3x8");
  packet.push("- Bench Press: 3x8 @ 95 lb, rest 90s");
  packet.push("  note: One short live cue or adjustment for this exercise, if useful.");
  packet.push("- Plank: 3x45 sec, rest 45s");
  packet.push("- Peloton Tread: Incline Walk, 30 min");
  packet.push("- Peloton Bike: Just Ride, 20 min");
  packet.push("");
  packet.push("Rules for the final block:");
  packet.push("- Use exercise names from my library above when possible.");
  packet.push("- Keep each routine exercise on one dash line.");
  packet.push("- Tag each ROUTINE line with where it happens: add \"[Home]\", \"[Gym]\", or \"[Home or");
  packet.push("  gym]\" right after the routine name (e.g. \"ROUTINE: Full Body A [Gym]\"), matching");
  packet.push("  the tags shown for my current routines above. Only use \"[Home or gym]\" when a");
  packet.push("  routine genuinely works at either location.");
  packet.push("- Add a rest target with \"rest 90s\" (seconds) on strength/timed lines where rest matters; leave it off where it doesn't.");
  packet.push("- Add a `note:` line under exercises where I need a live cue, adjustment, caution,");
  packet.push("  or reminder during the workout. Keep each note short and specific.");
  packet.push("- Include the 2 alternate routines (1 [Home], 1 [Gym]) as extra ROUTINE blocks that");
  packet.push("  are NOT referenced by name in the WEEKLY PLAN section above — that's what keeps them");
  packet.push("  unscheduled so I can swap one in manually whenever I want it.");
  packet.push("- Do not include any text outside this format in that final message.");

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

async function copyReviewPacket() {
  const packet = generateReviewPacket();
  await copyTextToClipboard(packet);
  alert("Coach prompt copied. Paste it into an AI chat (ChatGPT, Claude, etc.) to start your weekly review.");
}

async function saveReviewPacket() {
  const packet = generateReviewPacket();
  const fileName = getReviewPacketFileName();
  try {
    const saveMode = await saveTextFile(packet, fileName);
    if (saveMode === "picked") {
      alert(`Coach prompt saved as ${fileName}.`);
    } else {
      alert(`Coach prompt downloaded as ${fileName}. Firefox and some mobile browsers do not support a Save As picker from web apps, so they use Downloads.`);
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      alert("File save was cancelled.");
      return;
    }
    alert(`The file save did not finish: ${error.message}`);
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

ROUTINE: Full Body A [Home]
- Goblet Squat: 3x8 @ 35, rest 90s timer
  note: Chest tall and drive through your heels — ease off the last set, you burned out here last week.
- Push-up: 3x8, rest 60s
- Dumbbell Row: 3x10 @ 30, rest 75s
- Plank: 3x30, rest 45s

ROUTINE: Full Body B [Gym]
- Deadlift: 3x8 @ 95, rest 120s
- Shoulder Press: 3x8 @ 20, rest 90s
- Squat: 3x8 @ 45, rest 90s
- Plank: 2x30, rest 45s

ROUTINE: Optional Walk [Gym]
- Peloton Tread: Incline Walk, 30 min
- Peloton Bike: Just Ride, 20 min`;
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
  let rawTarget = cleaned.slice(separatorIndex + 1).trim();

  // Optional inline coach note at the tail, e.g. "3x8 @ 135 | note: chest tall"
  // or "...(note: ease off here)". Pulled out first so its words can't be
  // misread as reps/rest/timer below. A note may also arrive on its own line
  // (see parseAiPlanText), so this is just the convenient one-line form.
  let coachNote = "";
  const noteMatch = rawTarget.match(/[|(\-–—]?\s*(?:coach\s*note|coach|note)\s*[:=]\s*(.+)$/i);
  if (noteMatch) {
    coachNote = noteMatch[1].replace(/[)\s]+$/, "").trim();
    rawTarget = rawTarget.slice(0, noteMatch.index).replace(/[|(\-–—,;\s]+$/, "").trim();
  }

  // Optional rest target, e.g. "3x8 @ 135, rest 90s" or "90s rest". Pulled out
  // (and stripped) first so its number can't be misread as reps/minutes below.
  const restSeconds = parseRestSeconds(rawTarget);
  // "rest 90s timer" / "90s rest (timer)" turns the rest into a live countdown.
  const restTimer = /\btimer\b/i.test(rawTarget);
  rawTarget = rawTarget
    .replace(/,?\s*rest\s*:?\s*\d+\s*(?:s|sec|secs|seconds?)?\b/i, "")
    .replace(/,?\s*\d+\s*(?:s|sec|secs|seconds?)\s+rest\b/i, "")
    .replace(/[(]?\s*timer\s*[)]?/ig, "")
    .replace(/[,;|]\s*$/, "")
    .trim();
  const target = rawTarget.toLowerCase();
  const exerciseId = findExerciseIdByName(exerciseName);
  const withRest = (parsed) => {
    if (restSeconds > 0) parsed.targetRest = restSeconds;
    if (restSeconds > 0 && restTimer) parsed.restTimer = true;
    if (coachNote) parsed.coachNote = coachNote;
    return parsed;
  };

  const durationMatch = target.match(/(\d+)\s*(min|minute|minutes)/);
  if (durationMatch) {
    const parsed = {
      exerciseId,
      targetDuration: Number(durationMatch[1])
    };
    const subtypeText = rawTarget.slice(0, rawTarget.toLowerCase().indexOf(durationMatch[0])).replace(/[,|-]+$/g, "").trim();
    if (subtypeText && !/^\d/.test(subtypeText)) parsed.targetSubtype = subtypeText;
    return withRest(parsed);
  }

  const strengthMatch = target.match(/(\d+)\s*(x|sets?\s*(of)?|by)\s*(\d+)/);
  if (strengthMatch) {
    const parsed = {
      exerciseId,
      targetSets: Number(strengthMatch[1]),
      targetReps: Number(strengthMatch[4])
    };
    // Optional starting weight: "3x8 @ 135", "3x8 at 135", or "3x8 135 lb".
    const weightMatch = target.match(/(?:@|at)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)\b/);
    const weight = weightMatch ? Number(weightMatch[1] || weightMatch[2]) : 0;
    if (weight > 0) parsed.targetWeight = weight;
    return withRest(parsed);
  }

  return null;
}

// Read a rest target in seconds from a target string. Accepts "rest 90s",
// "rest: 90", "rest 90 sec", or "90s rest". Returns 0 when none is present.
function parseRestSeconds(target) {
  const m = target.match(/rest\s*:?\s*(\d+)\s*(?:s|sec|secs|seconds?)?\b/i)
    || target.match(/(\d+)\s*(?:s|sec|secs|seconds?)\s+rest\b/i);
  return m ? Math.max(0, Math.round(Number(m[1]))) : 0;
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

// Reads an optional trailing "[Home]" / "[Gym]" / "[Home or gym]" tag off a
// parsed ROUTINE name — the same tag generateReviewPacket()'s CURRENT
// ROUTINES section and final-deliverable format spec both use. Returns
// location: null when no recognized tag is present, so callers can fall back
// to the existing routine's current location instead of stomping it.
function extractRoutineLocationTag(rawName) {
  const match = rawName.match(/\s*\[([^\]]+)\]\s*$/);
  if (!match) return { name: rawName, location: null };
  const name = rawName.slice(0, match.index).trim();
  const tag = match[1].trim().toLowerCase();
  const location = tag === "home" ? "home" : tag === "gym" ? "gym" : "mixed";
  return { name, location };
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
      const rawName = line.slice(line.indexOf(":") + 1).replace(/\*\*/g, "").trim();
      const { name, location } = extractRoutineLocationTag(rawName);
      currentRoutine = {
        name,
        location, // null when no tag was found; resolved in buildImportedPlanData()
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

    if (mode === "routine" && currentRoutine) {
      // A standalone note line (e.g. "note: ease off the last set you burned
      // out on") attaches to the most recently listed exercise, so the coach
      // can write longer guidance on its own line under each move.
      const noteLine = line.replace(/^[-*•]\s*/, "").match(/^(?:coach\s*note|coach|note)\s*[:=]\s*(.+)$/i);
      if (noteLine) {
        const last = currentRoutine.exercises[currentRoutine.exercises.length - 1];
        if (last) {
          const text = noteLine[1].trim();
          last.coachNote = last.coachNote ? `${last.coachNote} ${text}` : text;
        }
        return;
      }
      if (/^[-*]\s*/.test(line)) {
        const parsedExercise = parseRoutineExerciseLine(line);
        if (parsedExercise) currentRoutine.exercises.push(parsedExercise);
      }
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
      location: routine.location != null ? routine.location : (existing?.location || "mixed"),
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

  normalizeSoccerDurationInData(data);
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
