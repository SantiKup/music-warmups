/* ==========================================================================
   Sight Reading Warm-Ups (static)

   HOW TO ADD REAL WARM-UP IMAGES LATER
   - Put image files in the `assets/` folder (jpg/png/webp/svg).
   - Update the `WARMUPS` object below to point each combination to the correct file path.
     Example:
       WARMUPS["Groovy"]["Tenor Sax"]["Easy"] = "assets/groovy_tenor_easy.jpg";
   - If a combination is missing from WARMUPS, the UI will show:
       "This warm-up has not been added yet."
   ========================================================================== */

const STYLES = ["Groovy", "Swing", "Ballad", "Rock"];
const INSTRUMENTS = [
  "Tuba",
  "Trombone",
  "Bari Sax",
  "Tenor Sax",
  "Alto Sax",
  "Clarinet",
  "Bassoon",
  "Oboe",
  "Trumpet",
  "Flute",
  "Drums",
];
const DIFFICULTIES = ["Easy", "Hard"];

// Placeholder files (you can replace these images later)
const STYLE_PLACEHOLDER = {
  Groovy: "assets/groovy_placeholder.svg",
  Swing: "assets/swing_placeholder.svg",
  Ballad: "assets/ballad_placeholder.svg",
  Rock: "assets/rock_placeholder.svg",
};

// Mapping: style -> instrument -> difficulty -> image path
// Note: this demo includes MOST combinations mapped to placeholders, and one intentionally missing
// (Rock / Oboe / Hard) so you can see the friendly "not added yet" message working.
const WARMUPS = buildDefaultWarmups();

function buildDefaultWarmups() {
  const map = {};
  for (const style of STYLES) {
    map[style] = {};
    for (const instrument of INSTRUMENTS) {
      map[style][instrument] = {};
      for (const difficulty of DIFFICULTIES) {
        map[style][instrument][difficulty] = STYLE_PLACEHOLDER[style];
      }
    }
  }

  // Example "missing" entry (delete this line later if you want every combination to exist)
  delete map.Rock.Oboe.Hard;

  return map;
}

function getWarmupPath(style, instrument, difficulty) {
  return WARMUPS?.[style]?.[instrument]?.[difficulty] ?? null;
}

// ----- UI wiring -----
const $ = (id) => document.getElementById(id);

const screenLanding = $("screenLanding");
const screenSelect = $("screenSelect");
const screenResult = $("screenResult");

const startBtn = $("startBtn");
const howItWorksBtn = $("howItWorksBtn");
const howItWorksPanel = $("howItWorksPanel");

const styleOptions = $("styleOptions");
const instrumentOptions = $("instrumentOptions");
const difficultyOptions = $("difficultyOptions");

const styleSelected = $("styleSelected");
const instrumentSelected = $("instrumentSelected");
const difficultySelected = $("difficultySelected");

const backToLandingBtn = $("backToLandingBtn");
const resetBtn = $("resetBtn");
const resetBtnTop = $("resetBtnTop");
const showBtn = $("showBtn");
const helperText = $("helperText");

const backToSelectBtn = $("backToSelectBtn");
const chooseAnotherBtn = $("chooseAnotherBtn");

const resultChips = $("resultChips");
const missingMessage = $("missingMessage");
const sheetFigure = $("sheetFigure");
const sheetImage = $("sheetImage");

const lightbox = $("lightbox");
const lightboxImg = $("lightboxImg");
const lightboxClose = $("lightboxClose");
const topbar = document.querySelector(".topbar");

const state = {
  style: null,
  instrument: null,
  difficulty: null,
};

function setScreen(active) {
  for (const el of [screenLanding, screenSelect, screenResult]) {
    el.classList.toggle("is-active", el === active);
    el.hidden = el !== active;
  }

  requestAnimationFrame(() => {
    const topbarOffset = topbar ? topbar.offsetHeight : 0;
    const targetTop = Math.max(active.offsetTop - topbarOffset - 12, 0);
    window.scrollTo({ top: targetTop, behavior: "smooth" });
  });
}

function humanize(value) {
  return value ?? "Not selected";
}

function updateSelectedLabels() {
  styleSelected.textContent = humanize(state.style);
  instrumentSelected.textContent = humanize(state.instrument);
  difficultySelected.textContent = humanize(state.difficulty);
}

function updateShowButton() {
  const ready = Boolean(state.style && state.instrument && state.difficulty);
  showBtn.disabled = !ready;
  helperText.textContent = ready
    ? "Ready. Press “Show Warm-Up”."
    : "Select style, instrument, and difficulty to continue.";
}

function createPill(label, groupKey) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pill";
  btn.textContent = label;
  btn.setAttribute("aria-pressed", "false");
  btn.addEventListener("click", () => {
    state[groupKey] = label;
    syncPills();
    updateSelectedLabels();
    updateShowButton();
  });
  return btn;
}

function renderOptions(container, labels, groupKey) {
  container.innerHTML = "";
  for (const label of labels) {
    container.appendChild(createPill(label, groupKey));
  }
}

function syncPills() {
  syncPillGroup(styleOptions, state.style);
  syncPillGroup(instrumentOptions, state.instrument);
  syncPillGroup(difficultyOptions, state.difficulty);
}

function syncPillGroup(container, selectedLabel) {
  for (const el of container.querySelectorAll(".pill")) {
    const isSelected = el.textContent === selectedLabel;
    el.setAttribute("aria-pressed", isSelected ? "true" : "false");
  }
}

function resetSelections({ keepScreen = true } = {}) {
  state.style = null;
  state.instrument = null;
  state.difficulty = null;
  syncPills();
  updateSelectedLabels();
  updateShowButton();
  if (!keepScreen) setScreen(screenLanding);
}

function setResultChips() {
  resultChips.innerHTML = "";
  resultChips.appendChild(makeChip(state.style, "is-primary"));
  resultChips.appendChild(makeChip(state.instrument, "is-accent"));
  resultChips.appendChild(makeChip(state.difficulty, ""));
}

function makeChip(text, extraClass) {
  const span = document.createElement("span");
  span.className = `chip ${extraClass}`.trim();
  span.textContent = text;
  return span;
}

function showResult() {
  setResultChips();
  const path = getWarmupPath(state.style, state.instrument, state.difficulty);

  if (!path) {
    missingMessage.hidden = false;
    sheetFigure.hidden = true;
    sheetImage.removeAttribute("src");
  } else {
    missingMessage.hidden = true;
    sheetFigure.hidden = false;
    sheetImage.src = path;
  }

  setScreen(screenResult);
}

function openLightbox() {
  if (!sheetImage.src) return;
  lightboxImg.src = sheetImage.src;

  // Use <dialog> when supported; fallback is just opening the image in a new tab.
  if (typeof lightbox.showModal === "function") {
    lightbox.showModal();
  } else {
    window.open(sheetImage.src, "_blank", "noopener,noreferrer");
  }
}

function closeLightbox() {
  if (lightbox.open) lightbox.close();
  lightboxImg.removeAttribute("src");
}

// ----- Init -----
renderOptions(styleOptions, STYLES, "style");
renderOptions(instrumentOptions, INSTRUMENTS, "instrument");
renderOptions(difficultyOptions, DIFFICULTIES, "difficulty");

updateSelectedLabels();
updateShowButton();
setScreen(screenLanding);

// ----- Events -----
startBtn.addEventListener("click", () => {
  setScreen(screenSelect);
});

howItWorksBtn.addEventListener("click", () => {
  howItWorksPanel.hidden = !howItWorksPanel.hidden;
});

backToLandingBtn.addEventListener("click", () => {
  setScreen(screenLanding);
});

resetBtn.addEventListener("click", () => resetSelections());
resetBtnTop.addEventListener("click", () => resetSelections());

showBtn.addEventListener("click", () => {
  if (showBtn.disabled) return;
  showResult();
});

backToSelectBtn.addEventListener("click", () => {
  setScreen(screenSelect);
});

chooseAnotherBtn.addEventListener("click", () => {
  setScreen(screenSelect);
});

sheetImage.addEventListener("click", openLightbox);
lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  // Clicking the backdrop closes the dialog.
  const rect = lightbox.getBoundingClientRect();
  const clickedOutside =
    e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
  if (clickedOutside) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

