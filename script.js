/* ==========================================================================
   BandJam (static)
   - Role-based flow: Student or Teacher
   - Teacher uploads use Supabase Storage + Database metadata
   ========================================================================== */

// Core option labels used across student and teacher selectors.
async function testUpload() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";

  fileInput.onchange = async () => {
    const file = fileInput.files[0];

    const result = await uploadFileToSupabase(
      file,
      `test/${Date.now()}_${safeFileName(file.name)}`
    );

    console.log("Uploaded:", result);
  };

  fileInput.click();
}

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

const TEACHER_USERNAME = "JGibbs";
const TEACHER_PASSWORD = "Music.site2026JG";

// ----- Supabase config -----
// Paste your project URL and anon key here. The browser client is loaded in index.html.
const SUPABASE_URL = "https://inqqzjhorxddsdbsbmya.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UenSczlYdz4mGb7z2cTUmA_iXjZG4fs";
const SUPABASE_BUCKET = "bandjam-files";
const ASSETS_TABLE = "assets";

const supabaseClient =
  window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

function isSupabaseReady() {
  return !!supabaseClient;
}

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

function isSupabaseReady() {
  return Boolean(supabaseClient);
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function safeFileName(name) {
  const parts = String(name || "file").split(".");
  const extension = parts.length > 1 ? parts.pop().toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const baseName = slugify(parts.join(".") || "file");
  return extension ? `${baseName}.${extension}` : baseName;
}

function buildStoragePath(assetType, style, difficulty, instrument, fileName) {
  const cleanStyle = slugify(style);
  const cleanDifficulty = difficulty ? slugify(difficulty) : null;
  const cleanInstrument = instrument ? slugify(instrument) : null;
  const cleanFileName = safeFileName(fileName);

  if (assetType === "sheet") {
    return `sheets/${cleanStyle}/${cleanDifficulty}/${cleanInstrument}/${cleanFileName}`;
  }
  if (assetType === "full_jam") {
    return `audio/full-jam/${cleanStyle}/${cleanFileName}`;
  }
  if (assetType === "level_jam") {
    return `audio/level-jam/${cleanStyle}/${cleanDifficulty}/${cleanFileName}`;
  }
  if (assetType === "backing_track") {
    return `audio/backing-track/${cleanStyle}/${cleanFileName}`;
  }
  return `uploads/${cleanStyle}/${cleanFileName}`;
}

// Uploads the raw browser File to Supabase Storage, then reads its public URL.
async function uploadFileToSupabase(file, filePath) {
  if (!isSupabaseReady()) throw new Error("Supabase is not configured yet.");

  const { error: uploadError } = await supabaseClient.storage.from(SUPABASE_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data } = supabaseClient.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath);
  return {
    file_path: filePath,
    file_url: data.publicUrl,
    mime_type: file.type || "application/octet-stream",
    label: file.name,
  };
}

function applyAssetFilters(query, { asset_type, style, difficulty = null, instrument = null }) {
  query = query.eq("asset_type", asset_type).eq("style", style);
  query = difficulty === null ? query.is("difficulty", null) : query.eq("difficulty", difficulty);
  query = instrument === null ? query.is("instrument", null) : query.eq("instrument", instrument);
  return query;
}

async function saveAssetMetadata(asset) {
  if (!isSupabaseReady()) throw new Error("Supabase is not configured yet.");
  const { data, error } = await supabaseClient.from(ASSETS_TABLE).insert(asset).select().single();
  if (error) throw error;
  return data;
}

// Metadata upsert is handled in app code so the table does not need a SQL unique constraint.
async function upsertAssetMetadata(asset) {
  if (!isSupabaseReady()) throw new Error("Supabase is not configured yet.");

  const { data: existingRows, error: selectError } = await applyAssetFilters(
    supabaseClient.from(ASSETS_TABLE).select("id").limit(1),
    asset
  );
  if (selectError) throw selectError;

  if (existingRows && existingRows.length > 0) {
    const { data, error } = await supabaseClient
      .from(ASSETS_TABLE)
      .update(asset)
      .eq("id", existingRows[0].id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  return saveAssetMetadata(asset);
}

function assetRowToEntry(row) {
  if (!row) return null;
  return {
    name: row.label || "uploaded-file",
    type: row.mime_type || "application/octet-stream",
    data: row.file_url,
    filePath: row.file_path,
  };
}

async function getAssetByHierarchy(filters) {
  if (!isSupabaseReady()) return null;

  // Student mode asks for each asset type at its correct hierarchy level.
  const { data, error } = await applyAssetFilters(
    supabaseClient.from(ASSETS_TABLE).select("*").order("created_at", { ascending: false }).limit(1),
    filters
  );
  if (error) throw error;
  return assetRowToEntry(data && data[0]);
}

function getDefaultSheetEntry(style, instrument, difficulty) {
  const filePath = WARMUPS?.[style]?.levels?.[difficulty]?.instruments?.[instrument]?.sheetFile;
  if (!filePath) return null;
  return {
    name: "default-sheet",
    type: filePath.endsWith(".pdf") ? "application/pdf" : "image/*",
    data: filePath,
  };
}

async function getSheetAsset(style, difficulty, instrument) {
  const uploaded = await getAssetByHierarchy({ asset_type: "sheet", style, difficulty, instrument });
  return uploaded || getDefaultSheetEntry(style, instrument, difficulty);
}

async function getFullJamAsset(style) {
  return getAssetByHierarchy({ asset_type: "full_jam", style, difficulty: null, instrument: null });
}

async function getLevelJamAsset(style, difficulty) {
  return getAssetByHierarchy({ asset_type: "level_jam", style, difficulty, instrument: null });
}

async function getBackingTrackAsset(style) {
  return getAssetByHierarchy({ asset_type: "backing_track", style, difficulty: null, instrument: null });
}

async function uploadAssetFile({ file, assetType, style, difficulty = null, instrument = null }) {
  const filePath = buildStoragePath(assetType, style, difficulty, instrument, file.name);
  const uploadResult = await uploadFileToSupabase(file, filePath);
  return upsertAssetMetadata({
    asset_type: assetType,
    style,
    difficulty,
    instrument,
    file_path: uploadResult.file_path,
    file_url: uploadResult.file_url,
    mime_type: uploadResult.mime_type,
    label: uploadResult.label,
  });
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

async function renderResultAudio(style, difficulty) {
  // Result audio follows the hierarchy:
  // Full Jam and Backing Track are style-wide, while Level Jam belongs to style + difficulty.
  fullJamAudioSlot.textContent = "Loading...";
  levelJamAudioSlot.textContent = "Loading...";
  backingTrackAudioSlot.textContent = "Loading...";

  const [fullJam, levelJam, backingTrack] = await Promise.all([
    getFullJamAsset(style),
    getLevelJamAsset(style, difficulty),
    getBackingTrackAsset(style),
  ]);

  renderAudioSlot(fullJamAudioSlot, fullJam);
  renderAudioSlot(levelJamAudioSlot, levelJam);
  renderAudioSlot(backingTrackAudioSlot, backingTrack);
}

async function showResult() {
  const { style, instrument, difficulty } = state.student;

  resultChips.innerHTML = "";
  resultChips.appendChild(makeChip(style, "is-primary"));
  resultChips.appendChild(makeChip(instrument, "is-accent"));
  resultChips.appendChild(makeChip(difficulty, ""));

  missingMessage.hidden = false;
  sheetFigure.hidden = true;
  sheetImage.removeAttribute("src");
  pdfViewerWrap.hidden = true;
  pdfViewer.removeAttribute("src");

  try {
    const [entry] = await Promise.all([
      getSheetAsset(style, difficulty, instrument),
      renderResultAudio(style, difficulty),
    ]);

    if (!entry) {
      missingMessage.hidden = false;
    } else {
      missingMessage.hidden = true;
      const isPdf = entry.type === "application/pdf" || /\.pdf($|\?)/i.test(entry.data);
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
  } catch (error) {
    console.error("Could not load assets from Supabase:", error);
    fullJamAudioSlot.textContent = "Not added";
    levelJamAudioSlot.textContent = "Not added";
    backingTrackAudioSlot.textContent = "Not added";
    missingMessage.hidden = false;
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

  // Keep the File object for Supabase upload. Image preview is only a local convenience.
  state.teacherDraftFile = file;
  adminFileNameText.textContent = `Selected: ${file.name}`;
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  adminPdfNote.hidden = !isPdf;

  if (isPdf) {
    adminPreviewWrap.hidden = true;
    adminPreviewImage.removeAttribute("src");
    updateTeacherAdminUI();
  } else {
    const reader = new FileReader();
    reader.onload = () => {
      adminPreviewImage.src = String(reader.result);
      adminPreviewWrap.hidden = false;
      updateTeacherAdminUI();
    };
    reader.readAsDataURL(file);
  }
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

  // Audio is not previewed like an image; Supabase receives the original File object.
  state[draftKey] = file;
  fileNameText.textContent = `Selected: ${file.name}`;
  updateUI();
}

async function saveStyleAudio(assetType, draftKey, successMessage) {
  const { style } = state.styleAudio;
  if (!(style && state[draftKey])) return;

  try {
    styleAudioSaveSuccess.hidden = false;
    styleAudioSaveSuccess.textContent = "Uploading...";
    await uploadAssetFile({ file: state[draftKey], assetType, style });
    styleAudioSaveSuccess.textContent = successMessage;
  } catch (error) {
    console.error("Style audio upload failed:", error);
    styleAudioSaveSuccess.hidden = false;
    styleAudioSaveSuccess.textContent = error.message || "Could not save style audio.";
  } finally {
    updateStyleAudioUI();
  }
}

async function saveLevelAudio() {
  const { style, difficulty } = state.levelAudio;
  if (!(style && difficulty && state.levelFullJamDraftFile)) return;

  try {
    levelAudioSaveSuccess.hidden = false;
    levelAudioSaveSuccess.textContent = "Uploading...";
    await uploadAssetFile({
      file: state.levelFullJamDraftFile,
      assetType: "level_jam",
      style,
      difficulty,
    });
    levelAudioSaveSuccess.textContent = "Level full jam saved successfully.";
  } catch (error) {
    console.error("Level audio upload failed:", error);
    levelAudioSaveSuccess.hidden = false;
    levelAudioSaveSuccess.textContent = error.message || "Could not save level audio.";
  } finally {
    updateLevelAudioUI();
  }
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
  saveStyleAudio("full_jam", "fullJamDraftFile", "Full jam master saved successfully.");
});

backingTrackSaveBtn.addEventListener("click", () => {
  saveStyleAudio("backing_track", "backingTrackDraftFile", "Backing track saved successfully.");
});

levelFullJamSaveBtn.addEventListener("click", saveLevelAudio);

adminFileInput.addEventListener("change", () => {
  const file = adminFileInput.files && adminFileInput.files[0];
  handleTeacherFilePick(file || null);
});

adminSaveBtn.addEventListener("click", async () => {
  const { style, instrument, difficulty } = state.teacher;
  if (!(style && instrument && difficulty && state.teacherDraftFile)) return;

  try {
    adminSaveSuccess.hidden = false;
    adminSaveSuccess.textContent = "Uploading...";
    await uploadAssetFile({
      file: state.teacherDraftFile,
      assetType: "sheet",
      style,
      difficulty,
      instrument,
    });
    adminSaveSuccess.textContent = "Warm-up saved successfully.";
  } catch (error) {
    console.error("Sheet upload failed:", error);
    adminSaveSuccess.hidden = false;
    adminSaveSuccess.textContent = error.message || "Could not save warm-up.";
  } finally {
    updateTeacherAdminUI();
  }
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
