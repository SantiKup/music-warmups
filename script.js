/* ==========================================================================
   BandJam (static)
   - Role-based flow: Student or Teacher
   - Teacher uploads use localStorage (front-end only persistence)
   ========================================================================== */

// Core option labels used across student and teacher selectors.
const STYLES = ["Blues", "Swing", "Pop Rock", "Disco", "Reggae", "6/8", "Funk", "Latin", "Country", "Waltz"];
const INSTRUMENTS = [
  "C",
  "Bb",
  "Eb",
  "F",
  "Bass clef (upper)",
  "Bass line (Bass guitar)",
  "Bass line (Tuba), Harmony",
  "Drumkit",
  "Mallets",
];
// Difficulty scale labels: 1 (easiest) -> 3 (hardest)
const DIFFICULTIES = ["1", "2", "3"];

const LOCAL_STORAGE_KEY = "musicWarmupsByCombo";
const TEACHER_USERNAME = "JGibbs";
const TEACHER_PASSWORD = "Music.site2026JG";

const STYLE_PLACEHOLDER = {
  Blues: "assets/groovy_placeholder.svg",
  Swing: "assets/swing_placeholder.svg",
  "Pop Rock": "assets/rock_placeholder.svg",
  Disco: "assets/ballad_placeholder.svg",
  Reggae: "assets/groovy_placeholder.svg",
  "6/8": "assets/ballad_placeholder.svg",
  Funk: "assets/groovy_placeholder.svg",
  Latin: "assets/swing_placeholder.svg",
  Country: "assets/ballad_placeholder.svg",
  Waltz: "assets/rock_placeholder.svg",
};

const WARMUPS = buildDefaultWarmups();
let teacherWarmups = loadTeacherWarmups();

function buildDefaultWarmups() {
  const map = {};
  for (const style of STYLES) {
    map[style] = {
      fullJamMaster: null,
      backingTrack: null,
      levels: {},
    };
    for (const difficulty of DIFFICULTIES) {
      map[style].levels[difficulty] = {
        levelFullJam: null,
        instruments: {},
      };
      for (const instrument of INSTRUMENTS) {
        map[style].levels[difficulty].instruments[instrument] = {
          sheetFile: STYLE_PLACEHOLDER[style],
        };
      }
    }
  }
  delete map.Waltz.levels["3"].instruments.Mallets;
  return map;
}

function ensureStyleKey(obj, style) {
  if (!obj[style]) {
    obj[style] = { fullJamMaster: null, backingTrack: null, levels: {} };
  }
  if (!obj[style].levels) obj[style].levels = {};
  return obj[style];
}

function ensureLevelKey(obj, style, difficulty) {
  const styleEntry = ensureStyleKey(obj, style);
  if (!styleEntry.levels[difficulty]) {
    styleEntry.levels[difficulty] = { levelFullJam: null, instruments: {} };
  }
  if (!styleEntry.levels[difficulty].instruments) {
    styleEntry.levels[difficulty].instruments = {};
  }
  return styleEntry.levels[difficulty];
}

function ensureSheetKey(obj, style, difficulty, instrument) {
  const levelEntry = ensureLevelKey(obj, style, difficulty);
  if (!levelEntry.instruments[instrument]) {
    levelEntry.instruments[instrument] = {};
  }
  return levelEntry.instruments[instrument];
}

function migrateWarmupData(data) {
  if (!data || typeof data !== "object") return {};
  const migrated = {};

  for (const style of Object.keys(data)) {
    const styleEntry = data[style];
    if (!styleEntry || typeof styleEntry !== "object") continue;

    const targetStyle = ensureStyleKey(migrated, style);
    targetStyle.fullJamMaster = normalizeAudioEntry(styleEntry.fullJamMaster);
    targetStyle.backingTrack = normalizeAudioEntry(styleEntry.backingTrack);

    if (styleEntry.levels && typeof styleEntry.levels === "object") {
      for (const difficulty of Object.keys(styleEntry.levels)) {
        const levelEntry = styleEntry.levels[difficulty];
        if (!levelEntry || typeof levelEntry !== "object") continue;
        const targetLevel = ensureLevelKey(migrated, style, difficulty);
        targetLevel.levelFullJam = normalizeAudioEntry(levelEntry.levelFullJam);

        const instruments = levelEntry.instruments || {};
        for (const instrument of Object.keys(instruments)) {
          ensureSheetKey(migrated, style, difficulty, instrument).sheetFile =
            normalizeWarmupEntry(instruments[instrument]?.sheetFile);
        }
      }
    } else {
      // Backward compatibility for old localStorage shape: style -> instrument -> difficulty.
      for (const instrument of Object.keys(styleEntry)) {
        if (!INSTRUMENTS.includes(instrument)) continue;
        for (const difficulty of Object.keys(styleEntry[instrument] || {})) {
          ensureSheetKey(migrated, style, difficulty, instrument).sheetFile =
            normalizeWarmupEntry(styleEntry[instrument][difficulty]);
        }
      }
    }
  }

  return migrated;
}

// localStorage load: this is where teacher-saved warm-ups are restored on page load.
function loadTeacherWarmups() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return migrateWarmupData(parsed);
  } catch {
    return {};
  }
}

// localStorage save: this persists teacher uploads for this browser.
function persistTeacherWarmups() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(teacherWarmups));
}

// File-type detection and normalization:
// - old entries may be plain strings (image src/data URL)
// - new entries are objects with { name, type, data }
function normalizeWarmupEntry(entry) {
  if (!entry) return null;
  if (typeof entry === "string") {
    return {
      name: "warmup-image",
      type: entry.startsWith("data:application/pdf") ? "application/pdf" : "image/*",
      data: entry,
    };
  }
  if (typeof entry === "object" && typeof entry.data === "string") {
    return {
      name: entry.name || "warmup-file",
      type: entry.type || (entry.data.startsWith("data:application/pdf") ? "application/pdf" : "image/*"),
      data: entry.data,
    };
  }
  return null;
}

function normalizeAudioEntry(entry) {
  if (!entry) return null;
  if (typeof entry === "object" && typeof entry.data === "string") {
    return {
      name: entry.name || "audio-file",
      type: entry.type || "audio/*",
      data: entry.data,
    };
  }
  return null;
}

function getSheetEntryFromWarmups(map, style, instrument, difficulty) {
  const structuredEntry = map?.[style]?.levels?.[difficulty]?.instruments?.[instrument]?.sheetFile;
  if (structuredEntry) return normalizeWarmupEntry(structuredEntry);

  // Legacy read path for any old unsaved structure still in memory.
  return normalizeWarmupEntry(map?.[style]?.[instrument]?.[difficulty]);
}

function getWarmupEntry(style, instrument, difficulty) {
  // Student reads teacher-uploaded warm-up first, then static fallback map.
  const teacherEntry = getSheetEntryFromWarmups(teacherWarmups, style, instrument, difficulty);
  if (teacherEntry) return teacherEntry;
  return getSheetEntryFromWarmups(WARMUPS, style, instrument, difficulty);
}

function getStyleAudioEntry(style, audioKey) {
  return normalizeAudioEntry(teacherWarmups?.[style]?.[audioKey] || WARMUPS?.[style]?.[audioKey]);
}

function getLevelAudioEntry(style, difficulty) {
  return normalizeAudioEntry(
    teacherWarmups?.[style]?.levels?.[difficulty]?.levelFullJam ||
      WARMUPS?.[style]?.levels?.[difficulty]?.levelFullJam
  );
}

const $ = (id) => document.getElementById(id);
const topbar = document.querySelector(".topbar");

const screenRole = $("screenRole");
const screenLanding = $("screenLanding");
const screenSelect = $("screenSelect");
const screenResult = $("screenResult");
const screenTeacherLogin = $("screenTeacherLogin");
const screenTeacherAdmin = $("screenTeacherAdmin");
const ALL_SCREENS = [screenRole, screenLanding, screenSelect, screenResult, screenTeacherLogin, screenTeacherAdmin];

const homeBtn = $("homeBtn");
const resetBtnTop = $("resetBtnTop");
const studentRoleBtn = $("studentRoleBtn");
const teacherRoleBtn = $("teacherRoleBtn");

const startBtn = $("startBtn");
const howItWorksBtn = $("howItWorksBtn");
const howItWorksPanel = $("howItWorksPanel");
const backToLandingBtn = $("backToLandingBtn");
const resetBtn = $("resetBtn");
const showBtn = $("showBtn");
const helperText = $("helperText");

const styleOptions = $("styleOptions");
const instrumentOptions = $("instrumentOptions");
const difficultyOptions = $("difficultyOptions");
const styleSelected = $("styleSelected");
const instrumentSelected = $("instrumentSelected");
const difficultySelected = $("difficultySelected");

const backToSelectBtn = $("backToSelectBtn");
const chooseAnotherBtn = $("chooseAnotherBtn");
const resultChips = $("resultChips");
const fullJamAudioSlot = $("fullJamAudioSlot");
const levelJamAudioSlot = $("levelJamAudioSlot");
const backingTrackAudioSlot = $("backingTrackAudioSlot");
const missingMessage = $("missingMessage");
const sheetFigure = $("sheetFigure");
const sheetImage = $("sheetImage");
const pdfViewerWrap = $("pdfViewerWrap");
const pdfViewer = $("pdfViewer");

const teacherLoginForm = $("teacherLoginForm");
const teacherUsername = $("teacherUsername");
const teacherPassword = $("teacherPassword");
const teacherLoginError = $("teacherLoginError");
const teacherLoginBackBtn = $("teacherLoginBackBtn");
const teacherLogoutBtn = $("teacherLogoutBtn");

const styleAudioOptions = $("styleAudioOptions");
const styleAudioSelected = $("styleAudioSelected");
const fullJamInput = $("fullJamInput");
const fullJamFileNameText = $("fullJamFileNameText");
const fullJamSaveBtn = $("fullJamSaveBtn");
const backingTrackInput = $("backingTrackInput");
const backingTrackFileNameText = $("backingTrackFileNameText");
const backingTrackSaveBtn = $("backingTrackSaveBtn");
const styleAudioSaveSuccess = $("styleAudioSaveSuccess");

const levelAudioStyleOptions = $("levelAudioStyleOptions");
const levelAudioDifficultyOptions = $("levelAudioDifficultyOptions");
const levelAudioStyleSelected = $("levelAudioStyleSelected");
const levelAudioDifficultySelected = $("levelAudioDifficultySelected");
const levelFullJamInput = $("levelFullJamInput");
const levelFullJamFileNameText = $("levelFullJamFileNameText");
const levelFullJamSaveBtn = $("levelFullJamSaveBtn");
const levelAudioSaveSuccess = $("levelAudioSaveSuccess");

const adminStyleOptions = $("adminStyleOptions");
const adminInstrumentOptions = $("adminInstrumentOptions");
const adminDifficultyOptions = $("adminDifficultyOptions");
const adminStyleSelected = $("adminStyleSelected");
const adminInstrumentSelected = $("adminInstrumentSelected");
const adminDifficultySelected = $("adminDifficultySelected");
const adminFileInput = $("adminFileInput");
const adminPreviewWrap = $("adminPreviewWrap");
const adminPreviewImage = $("adminPreviewImage");
const adminFileNameText = $("adminFileNameText");
const adminPdfNote = $("adminPdfNote");
const adminSaveBtn = $("adminSaveBtn");
const adminHelperText = $("adminHelperText");
const adminSaveSuccess = $("adminSaveSuccess");

const lightbox = $("lightbox");
const lightboxImg = $("lightboxImg");
const lightboxClose = $("lightboxClose");

const state = {
  role: null,
  student: { style: null, instrument: null, difficulty: null },
  teacher: { style: null, instrument: null, difficulty: null },
  styleAudio: { style: null },
  levelAudio: { style: null, difficulty: null },
  teacherDraftFile: null,
  fullJamDraftFile: null,
  backingTrackDraftFile: null,
  levelFullJamDraftFile: null,
};

function setScreen(active) {
  for (const el of ALL_SCREENS) {
    const activeNow = el === active;
    el.classList.toggle("is-active", activeNow);
    el.hidden = !activeNow;
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

function createPill(label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pill";
  btn.textContent = label;
  btn.setAttribute("aria-pressed", "false");
  btn.addEventListener("click", () => onClick(label));
  return btn;
}

function renderGroupOptions(container, labels, onClick) {
  container.innerHTML = "";
  for (const label of labels) {
    container.appendChild(createPill(label, onClick));
  }
}

function syncPillGroup(container, selectedLabel) {
  for (const pill of container.querySelectorAll(".pill")) {
    pill.setAttribute("aria-pressed", pill.textContent === selectedLabel ? "true" : "false");
  }
}

function updateStudentUI() {
  styleSelected.textContent = humanize(state.student.style);
  instrumentSelected.textContent = humanize(state.student.instrument);
  difficultySelected.textContent = humanize(state.student.difficulty);
  syncPillGroup(styleOptions, state.student.style);
  syncPillGroup(instrumentOptions, state.student.instrument);
  syncPillGroup(difficultyOptions, state.student.difficulty);

  const ready = Boolean(state.student.style && state.student.instrument && state.student.difficulty);
  showBtn.disabled = !ready;
  helperText.textContent = ready
    ? "Ready. Press “Show Warm-Up”."
    : "Select style, instrument, and difficulty to continue.";
}

function updateTeacherAdminUI() {
  adminStyleSelected.textContent = humanize(state.teacher.style);
  adminInstrumentSelected.textContent = humanize(state.teacher.instrument);
  adminDifficultySelected.textContent = humanize(state.teacher.difficulty);
  syncPillGroup(adminStyleOptions, state.teacher.style);
  syncPillGroup(adminInstrumentOptions, state.teacher.instrument);
  syncPillGroup(adminDifficultyOptions, state.teacher.difficulty);

  const ready = Boolean(
    state.teacher.style && state.teacher.instrument && state.teacher.difficulty && state.teacherDraftFile
  );
  adminSaveBtn.disabled = !ready;
  adminHelperText.textContent = ready
    ? "Ready to save this warm-up file."
    : "Select style, instrument, difficulty, and choose an image or PDF.";
}

function updateStyleAudioUI() {
  styleAudioSelected.textContent = humanize(state.styleAudio.style);
  syncPillGroup(styleAudioOptions, state.styleAudio.style);

  fullJamSaveBtn.disabled = !(state.styleAudio.style && state.fullJamDraftFile);
  backingTrackSaveBtn.disabled = !(state.styleAudio.style && state.backingTrackDraftFile);
}

function updateLevelAudioUI() {
  levelAudioStyleSelected.textContent = humanize(state.levelAudio.style);
  levelAudioDifficultySelected.textContent = humanize(state.levelAudio.difficulty);
  syncPillGroup(levelAudioStyleOptions, state.levelAudio.style);
  syncPillGroup(levelAudioDifficultyOptions, state.levelAudio.difficulty);

  levelFullJamSaveBtn.disabled = !(
    state.levelAudio.style &&
    state.levelAudio.difficulty &&
    state.levelFullJamDraftFile
  );
}

function resetStudentSelections() {
  state.student.style = null;
  state.student.instrument = null;
  state.student.difficulty = null;
  updateStudentUI();
}

function resetTeacherDraft() {
  state.teacher.style = null;
  state.teacher.instrument = null;
  state.teacher.difficulty = null;
  state.styleAudio.style = null;
  state.levelAudio.style = null;
  state.levelAudio.difficulty = null;
  state.teacherDraftFile = null;
  state.fullJamDraftFile = null;
  state.backingTrackDraftFile = null;
  state.levelFullJamDraftFile = null;
  adminFileInput.value = "";
  fullJamInput.value = "";
  backingTrackInput.value = "";
  levelFullJamInput.value = "";
  adminFileNameText.textContent = "No file selected.";
  fullJamFileNameText.textContent = "No file selected.";
  backingTrackFileNameText.textContent = "No file selected.";
  levelFullJamFileNameText.textContent = "No file selected.";
  adminPdfNote.hidden = true;
  adminPreviewWrap.hidden = true;
  adminPreviewImage.removeAttribute("src");
  adminSaveSuccess.hidden = true;
  styleAudioSaveSuccess.hidden = true;
  levelAudioSaveSuccess.hidden = true;
  updateStyleAudioUI();
  updateLevelAudioUI();
  updateTeacherAdminUI();
}

function makeChip(text, extraClass) {
  const span = document.createElement("span");
  span.className = `chip ${extraClass}`.trim();
  span.textContent = text;
  return span;
}

function renderAudioSlot(slot, entry) {
  slot.innerHTML = "";
  if (!entry) {
    slot.textContent = "Not added";
    return;
  }

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.preload = "none";

  const source = document.createElement("source");
  source.src = entry.data;
  source.type = entry.type;
  audio.appendChild(source);

  // If the browser cannot play the file, the audio control remains visible and this text is available.
  audio.append("Audio format not supported by this browser.");
  slot.appendChild(audio);
}

function renderResultAudio(style, difficulty) {
  // Result audio follows the hierarchy:
  // Full Jam and Backing Track are style-wide, while Level Jam belongs to style + difficulty.
  renderAudioSlot(fullJamAudioSlot, getStyleAudioEntry(style, "fullJamMaster"));
  renderAudioSlot(levelJamAudioSlot, getLevelAudioEntry(style, difficulty));
  renderAudioSlot(backingTrackAudioSlot, getStyleAudioEntry(style, "backingTrack"));
}

function showResult() {
  const { style, instrument, difficulty } = state.student;
  const entry = getWarmupEntry(style, instrument, difficulty);

  resultChips.innerHTML = "";
  resultChips.appendChild(makeChip(style, "is-primary"));
  resultChips.appendChild(makeChip(instrument, "is-accent"));
  resultChips.appendChild(makeChip(difficulty, ""));
  renderResultAudio(style, difficulty);

  if (!entry) {
    missingMessage.hidden = false;
    sheetFigure.hidden = true;
    sheetImage.removeAttribute("src");
    pdfViewerWrap.hidden = true;
    pdfViewer.removeAttribute("src");
  } else {
    missingMessage.hidden = true;
    const isPdf = entry.type === "application/pdf" || entry.data.startsWith("data:application/pdf");
    if (isPdf) {
      sheetFigure.hidden = true;
      sheetImage.removeAttribute("src");
      pdfViewerWrap.hidden = false;
      // PDF rendering is browser-native via <embed>.
      pdfViewer.src = entry.data;
    } else {
      pdfViewerWrap.hidden = true;
      pdfViewer.removeAttribute("src");
      sheetFigure.hidden = false;
      sheetImage.src = entry.data;
    }
  }
  setScreen(screenResult);
}

function openLightbox() {
  if (!sheetImage.src) return;
  lightboxImg.src = sheetImage.src;
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

function navigateHome() {
  state.role = null;
  teacherLoginError.hidden = true;
  teacherLoginForm.reset();
  setScreen(screenRole);
}

function handleTeacherFilePick(file) {
  adminSaveSuccess.hidden = true;
  if (!file) {
    state.teacherDraftFile = null;
    adminFileNameText.textContent = "No file selected.";
    adminPdfNote.hidden = true;
    adminPreviewWrap.hidden = true;
    adminPreviewImage.removeAttribute("src");
    updateTeacherAdminUI();
    return;
  }

  // File type detection: keep images previewable, PDFs saved with metadata and note.
  adminFileNameText.textContent = `Selected: ${file.name}`;
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  adminPdfNote.hidden = !isPdf;

  const reader = new FileReader();
  reader.onload = () => {
    state.teacherDraftFile = {
      name: file.name,
      type: isPdf ? "application/pdf" : file.type || "image/*",
      data: String(reader.result),
    };
    if (isPdf) {
      adminPreviewWrap.hidden = true;
      adminPreviewImage.removeAttribute("src");
    } else {
      adminPreviewImage.src = state.teacherDraftFile.data;
      adminPreviewWrap.hidden = false;
    }
    updateTeacherAdminUI();
  };
  reader.readAsDataURL(file);
}

function isSupportedAudioFile(file) {
  return (
    file.type.startsWith("audio/") ||
    /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(file.name)
  );
}

function handleAudioFilePick(file, draftKey, fileNameText, updateUI) {
  styleAudioSaveSuccess.hidden = true;
  levelAudioSaveSuccess.hidden = true;

  if (!file) {
    state[draftKey] = null;
    fileNameText.textContent = "No file selected.";
    updateUI();
    return;
  }

  if (!isSupportedAudioFile(file)) {
    state[draftKey] = null;
    fileNameText.textContent = "Choose an MP3, WAV, OGG, M4A, AAC, or WEBM file.";
    updateUI();
    return;
  }

  fileNameText.textContent = `Selected: ${file.name}`;

  const reader = new FileReader();
  reader.onload = () => {
    state[draftKey] = {
      name: file.name,
      type: file.type || "audio/*",
      data: String(reader.result),
    };
    updateUI();
  };
  reader.readAsDataURL(file);
}

function saveStyleAudio(audioKey, draftKey, successMessage) {
  const { style } = state.styleAudio;
  if (!(style && state[draftKey])) return;

  // Style audio is stored on the style itself so every instrument and level can share it.
  const styleEntry = ensureStyleKey(teacherWarmups, style);
  styleEntry[audioKey] = state[draftKey];
  persistTeacherWarmups();

  styleAudioSaveSuccess.hidden = false;
  styleAudioSaveSuccess.textContent = successMessage;
  updateStyleAudioUI();
}

function saveLevelAudio() {
  const { style, difficulty } = state.levelAudio;
  if (!(style && difficulty && state.levelFullJamDraftFile)) return;

  // Level audio is stored under style + difficulty, never under an instrument.
  const levelEntry = ensureLevelKey(teacherWarmups, style, difficulty);
  levelEntry.levelFullJam = state.levelFullJamDraftFile;
  persistTeacherWarmups();

  levelAudioSaveSuccess.hidden = false;
  levelAudioSaveSuccess.textContent = "Level full jam saved successfully.";
  updateLevelAudioUI();
}

// ----- Init -----
renderGroupOptions(styleOptions, STYLES, (label) => {
  state.student.style = label;
  updateStudentUI();
});
renderGroupOptions(instrumentOptions, INSTRUMENTS, (label) => {
  state.student.instrument = label;
  updateStudentUI();
});
renderGroupOptions(difficultyOptions, DIFFICULTIES, (label) => {
  state.student.difficulty = label;
  updateStudentUI();
});

renderGroupOptions(styleAudioOptions, STYLES, (label) => {
  state.styleAudio.style = label;
  styleAudioSaveSuccess.hidden = true;
  updateStyleAudioUI();
});

renderGroupOptions(levelAudioStyleOptions, STYLES, (label) => {
  state.levelAudio.style = label;
  levelAudioSaveSuccess.hidden = true;
  updateLevelAudioUI();
});
renderGroupOptions(levelAudioDifficultyOptions, DIFFICULTIES, (label) => {
  state.levelAudio.difficulty = label;
  levelAudioSaveSuccess.hidden = true;
  updateLevelAudioUI();
});

renderGroupOptions(adminStyleOptions, STYLES, (label) => {
  state.teacher.style = label;
  adminSaveSuccess.hidden = true;
  updateTeacherAdminUI();
});
renderGroupOptions(adminInstrumentOptions, INSTRUMENTS, (label) => {
  state.teacher.instrument = label;
  adminSaveSuccess.hidden = true;
  updateTeacherAdminUI();
});
renderGroupOptions(adminDifficultyOptions, DIFFICULTIES, (label) => {
  state.teacher.difficulty = label;
  adminSaveSuccess.hidden = true;
  updateTeacherAdminUI();
});

updateStudentUI();
updateStyleAudioUI();
updateLevelAudioUI();
updateTeacherAdminUI();
setScreen(screenRole);

// ----- Global nav events -----
homeBtn.addEventListener("click", navigateHome);
resetBtnTop.addEventListener("click", () => {
  resetStudentSelections();
  adminSaveSuccess.hidden = true;
});

// ----- Role flow -----
studentRoleBtn.addEventListener("click", () => {
  state.role = "student";
  setScreen(screenLanding);
});

teacherRoleBtn.addEventListener("click", () => {
  state.role = "teacher";
  teacherLoginError.hidden = true;
  teacherLoginForm.reset();
  setScreen(screenTeacherLogin);
});

// ----- Student flow -----
startBtn.addEventListener("click", () => setScreen(screenSelect));
howItWorksBtn.addEventListener("click", () => {
  howItWorksPanel.hidden = !howItWorksPanel.hidden;
});
backToLandingBtn.addEventListener("click", () => setScreen(screenLanding));
resetBtn.addEventListener("click", resetStudentSelections);

showBtn.addEventListener("click", () => {
  if (!showBtn.disabled) showResult();
});
backToSelectBtn.addEventListener("click", () => setScreen(screenSelect));
chooseAnotherBtn.addEventListener("click", () => setScreen(screenSelect));

// ----- Teacher login -----
teacherLoginBackBtn.addEventListener("click", navigateHome);
teacherLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // Credential check happens here (simple front-end gate, not secure auth).
  if (teacherUsername.value === TEACHER_USERNAME && teacherPassword.value === TEACHER_PASSWORD) {
    teacherLoginError.hidden = true;
    resetTeacherDraft();
    setScreen(screenTeacherAdmin);
  } else {
    teacherLoginError.hidden = false;
    teacherLoginError.textContent = "incorrect password";
  }
});

// ----- Teacher admin -----
fullJamInput.addEventListener("change", () => {
  const file = fullJamInput.files && fullJamInput.files[0];
  handleAudioFilePick(file || null, "fullJamDraftFile", fullJamFileNameText, updateStyleAudioUI);
});

backingTrackInput.addEventListener("change", () => {
  const file = backingTrackInput.files && backingTrackInput.files[0];
  handleAudioFilePick(file || null, "backingTrackDraftFile", backingTrackFileNameText, updateStyleAudioUI);
});

levelFullJamInput.addEventListener("change", () => {
  const file = levelFullJamInput.files && levelFullJamInput.files[0];
  handleAudioFilePick(file || null, "levelFullJamDraftFile", levelFullJamFileNameText, updateLevelAudioUI);
});

fullJamSaveBtn.addEventListener("click", () => {
  saveStyleAudio("fullJamMaster", "fullJamDraftFile", "Full jam master saved successfully.");
});

backingTrackSaveBtn.addEventListener("click", () => {
  saveStyleAudio("backingTrack", "backingTrackDraftFile", "Backing track saved successfully.");
});

levelFullJamSaveBtn.addEventListener("click", saveLevelAudio);

adminFileInput.addEventListener("change", () => {
  const file = adminFileInput.files && adminFileInput.files[0];
  handleTeacherFilePick(file || null);
});

adminSaveBtn.addEventListener("click", () => {
  const { style, instrument, difficulty } = state.teacher;
  if (!(style && instrument && difficulty && state.teacherDraftFile)) return;

  // localStorage save payload includes file data + MIME type + file name.
  ensureSheetKey(teacherWarmups, style, difficulty, instrument).sheetFile = state.teacherDraftFile;
  persistTeacherWarmups();

  adminSaveSuccess.hidden = false;
  adminSaveSuccess.textContent = "Warm-up saved successfully.";
});

teacherLogoutBtn.addEventListener("click", () => {
  resetTeacherDraft();
  navigateHome();
});

// ----- Lightbox -----
sheetImage.addEventListener("click", openLightbox);
lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  const rect = lightbox.getBoundingClientRect();
  const clickedOutside =
    e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
  if (clickedOutside) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});
