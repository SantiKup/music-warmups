/* ==========================================================================
   Class Grooves (static)
   - Role-based flow: Student or Teacher
   - Teacher uploads use localStorage (front-end only persistence)
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
// Difficulty scale labels: 1 (easiest) -> 3 (hardest)
const DIFFICULTIES = ["1", "2", "3"];

const LOCAL_STORAGE_KEY = "musicWarmupsByCombo";
const TEACHER_USERNAME = "JGibbs";
const TEACHER_PASSWORD = "Music.site2026JG";

const STYLE_PLACEHOLDER = {
  Groovy: "assets/groovy_placeholder.svg",
  Swing: "assets/swing_placeholder.svg",
  Ballad: "assets/ballad_placeholder.svg",
  Rock: "assets/rock_placeholder.svg",
};

const WARMUPS = buildDefaultWarmups();
let teacherWarmups = loadTeacherWarmups();

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
  delete map.Rock.Oboe["3"];
  return map;
}

function ensureNestedKey(obj, style, instrument) {
  if (!obj[style]) obj[style] = {};
  if (!obj[style][instrument]) obj[style][instrument] = {};
}

// localStorage load: this is where teacher-saved warm-ups are restored on page load.
function loadTeacherWarmups() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
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

function getWarmupEntry(style, instrument, difficulty) {
  // Student reads teacher-uploaded warm-up first, then static fallback map.
  const teacherEntry = normalizeWarmupEntry(teacherWarmups?.[style]?.[instrument]?.[difficulty]);
  if (teacherEntry) return teacherEntry;
  return normalizeWarmupEntry(WARMUPS?.[style]?.[instrument]?.[difficulty]);
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
  teacherDraftFile: null,
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
  state.teacherDraftFile = null;
  adminFileInput.value = "";
  adminFileNameText.textContent = "No file selected.";
  adminPdfNote.hidden = true;
  adminPreviewWrap.hidden = true;
  adminPreviewImage.removeAttribute("src");
  adminSaveSuccess.hidden = true;
  updateTeacherAdminUI();
}

function makeChip(text, extraClass) {
  const span = document.createElement("span");
  span.className = `chip ${extraClass}`.trim();
  span.textContent = text;
  return span;
}

function showResult() {
  const { style, instrument, difficulty } = state.student;
  const entry = getWarmupEntry(style, instrument, difficulty);

  resultChips.innerHTML = "";
  resultChips.appendChild(makeChip(style, "is-primary"));
  resultChips.appendChild(makeChip(instrument, "is-accent"));
  resultChips.appendChild(makeChip(difficulty, ""));

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
adminFileInput.addEventListener("change", () => {
  const file = adminFileInput.files && adminFileInput.files[0];
  handleTeacherFilePick(file || null);
});

adminSaveBtn.addEventListener("click", () => {
  const { style, instrument, difficulty } = state.teacher;
  if (!(style && instrument && difficulty && state.teacherDraftFile)) return;

  // localStorage save payload includes file data + MIME type + file name.
  ensureNestedKey(teacherWarmups, style, instrument);
  teacherWarmups[style][instrument][difficulty] = state.teacherDraftFile;
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

