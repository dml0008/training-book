// ===== F3: muscle-group anatomy figures + worked-muscle heat map =====
// Maps a library exercise's primaryMuscle/secondaryMuscles (real anatomy) onto
// the 10 figure groups the prepared SVGs cover (mockups/MuscleGroups/, synced
// in via MUSCLE_FIGURES above). A few real muscles don't get their own figure
// and fall back to the closest visible group: traps -> back, adductors ->
// quads, abductors -> glutes.
const MUSCLE_GROUP_MAP = {
  chest: "chest",
  "lower back": "back",
  "middle back": "back",
  lats: "back",
  traps: "back",
  shoulders: "shoulders",
  biceps: "arms",
  triceps: "arms",
  forearms: "forearms",
  abdominals: "abs",
  quadriceps: "quads",
  adductors: "quads",
  hamstrings: "hamstrings",
  glutes: "glutes",
  abductors: "glutes",
  calves: "calves"
};

const MUSCLE_FIGURE_GROUP_ORDER = ["chest", "back", "shoulders", "arms", "forearms", "abs", "quads", "hamstrings", "glutes", "calves"];
const MUSCLE_FIGURE_GROUP_LABELS = {
  chest: "Chest", back: "Back", shoulders: "Shoulders", arms: "Arms", forearms: "Forearms",
  abs: "Abs", quads: "Quads", hamstrings: "Hamstrings", glutes: "Glutes", calves: "Calves"
};

// Per-exercise muscle-group involvement, weighted 0-1. The primary muscle is
// full weight; hand-curated secondary muscles (see exercises.json) are
// lighter. "full body" moves (burpees, soccer, ...) have no single dominant
// muscle, so every group gets one flat, modest weight instead of guessing.
function getExerciseMuscleWeights(lib) {
  const weights = {};
  if (!lib) return weights;
  if (lib.primaryMuscle === "full body") {
    MUSCLE_FIGURE_GROUP_ORDER.forEach((g) => { weights[g] = 0.3; });
  } else {
    const primaryGroup = MUSCLE_GROUP_MAP[lib.primaryMuscle];
    if (primaryGroup) weights[primaryGroup] = 1;
  }
  (Array.isArray(lib.secondaryMuscles) ? lib.secondaryMuscles : []).forEach((entry) => {
    const group = MUSCLE_GROUP_MAP[entry?.muscle];
    const weight = Number(entry?.weight);
    if (!group || !Number.isFinite(weight) || weight <= 0) return;
    weights[group] = Math.max(weights[group] || 0, weight);
  });
  return weights;
}

// Compose a front+back figure from the shared outline plus one lime fill
// layer per group with nonzero weight (opacity = weight). Fill layers render
// first and the outline on top, matching the source SVGs' own stacking (the
// outline's anatomical crease lines are meant to show over a filled muscle).
function buildMuscleFigure(weights, opts = {}) {
  const ariaLabel = opts.ariaLabel || "Muscles worked";
  const layers = MUSCLE_FIGURE_GROUP_ORDER
    .filter((g) => (weights[g] || 0) > 0)
    .map((g) => `<g class="muscle-fill" style="opacity:${Math.min(1, weights[g]).toFixed(2)}">${MUSCLE_FIGURE_FILLS[g]}</g>`)
    .join("");
  return `
    <svg class="muscle-figure${opts.className ? ` ${opts.className}` : ""}" viewBox="${MUSCLE_FIGURE_VIEWBOX}" role="img" aria-label="${escapeHtml(ariaLabel)}">
      ${layers}
      <g class="muscle-outline">${MUSCLE_FIGURE_OUTLINE}</g>
    </svg>`;
}

// Shared badge markup for both the how-to sheet and the live-workout hero -
// same figure, sized/positioned differently by the wrapper class.
function renderMuscleBadge(exerciseId, wrapperClass, ariaLabel) {
  const weights = getExerciseMuscleWeights(getExerciseById(exerciseId));
  if (!Object.keys(weights).length) return "";
  return `<div class="${wrapperClass}">${buildMuscleFigure(weights, { className: "muscle-figure-badge", ariaLabel })}</div>`;
}

function getMetricProfile(exerciseInfo, plannedEx = {}) {
  if (plannedEx.metricProfile) return plannedEx.metricProfile;
  if (!exerciseInfo) return "strength-weighted";
  if (exerciseInfo.metricProfile) return exerciseInfo.metricProfile;
  if (exerciseInfo.type === "timed") return "timed-hold";
  if (exerciseInfo.type === "sport") return "sport-duration";
  if (exerciseInfo.type === "cardio") {
    return exerciseInfo.id === "peloton-tread" || exerciseInfo.id === "peloton-bike"
      ? "peloton"
      : "cardio-duration";
  }
  const tags = Array.isArray(exerciseInfo.tags) ? exerciseInfo.tags : [];
  const text = `${exerciseInfo.area || ""} ${exerciseInfo.primaryMuscle || ""}`.toLowerCase();
  if (tags.includes("bodyweight") || text.includes("core") || text.includes("abs")) return "strength-bodyweight";
  return "strength-weighted";
}

function usesWeightMetric(ex) {
  return ex?.metricProfile !== "strength-bodyweight";
}
