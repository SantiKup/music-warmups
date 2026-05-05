<template>
  <section aria-labelledby="teacherAdminTitle" class="flex justify-center items-center">
    <div
      class="mt-20 mb-10 rounded-tl-[12px] rounded-tr-[12px] border border-b-0 border-border bg-surface w-[80vw] p-4.5">
      <div class="mb-3.5">
        <h2 id="teacherAdminTitle" class="font-serif text-[1.25rem] tracking-[-0.02em]">
          Teacher Upload Panel
        </h2>
        <p class="mt-1.5 text-muted">
          Upload style audio, part video, and sheet music.
        </p>
      </div>

      <!-- Unified Context Bar: single place to pick Style / Instrument / Part -->
      <section class="mb-4 grid gap-3">
        <h3 class="sr-only">Upload context</h3>
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-lg border border-border bg-popover p-3.5">
            <div class="mb-2.5 flex items-baseline justify-between gap-3">
              <h4 class="m-0 font-serif text-[1.05rem] tracking-[-0.01em]">
                Musical style
              </h4>
              <div class="text-[0.95rem] text-muted">
                {{ selectedStyle || "Not selected" }}
              </div>
            </div>
            <OptionPills :options="STYLES" :selected="selectedStyle" @select="selectedStyle = $event" />
          </div>

          <div class="rounded-lg border border-border bg-popover p-3.5">
            <div class="mb-2.5 flex items-baseline justify-between gap-3">
              <h4 class="m-0 font-serif text-[1.05rem] tracking-[-0.01em]">
                Instrument
              </h4>
              <div class="text-[0.95rem] text-muted">
                {{ selectedInstrument || "Not selected" }}
              </div>
            </div>
            <OptionPills :options="INSTRUMENTS" :selected="selectedInstrument" @select="selectedInstrument = $event" />
          </div>

          <div class="rounded-lg border border-border bg-popover p-3.5">
            <div class="mb-2.5 flex items-baseline justify-between gap-3">
              <h4 class="m-0 font-serif text-[1.05rem] tracking-[-0.01em]">
                Part number
              </h4>
              <div class="text-[0.95rem] text-muted">
                {{ selectedDifficulty || "Not selected" }}
              </div>
            </div>
            <OptionPills :options="DIFFICULTIES" :selected="selectedDifficulty" @select="selectedDifficulty = $event" />
          </div>
        </div>
      </section>

      <p v-if="!isSupabaseReady" class="mt-3 text-[0.95rem] font-semibold text-red-700" role="alert">
        Supabase is not configured. Set the NUXT_PUBLIC_SUPABASE_* environment
        variables.
      </p>

      <div class="grid gap-4 min-[980px]:grid-cols-2 min-[980px]:items-start">
        <div class="grid gap-4">
          <section class="grid gap-3">
            <h3 class="text-[1.05rem] font-serif tracking-[-0.01em]">
              Style Audio
            </h3>
            <p class="text-muted">
              Shared across all instruments and part numbers for the selected
              style.
            </p>

            <div class="grid gap-3.5">
              <section class="rounded-lg border border-border bg-popover p-3.5" aria-labelledby="styleAudioStyleTitle">
                <div class="mb-2.5 flex items-baseline justify-between gap-3">
                  <h3 id="styleAudioStyleTitle" class="m-0 font-serif text-[1.05rem] tracking-[-0.01em]">
                    Musical style
                  </h3>
                  <div class="text-[0.95rem] text-muted">
                    {{ selectedStyle || "Not selected" }}
                  </div>
                </div>
              </section>
            </div>

            <div class="mt-3.5 grid gap-2.5 border-b border-border pb-3.5">
              <label class="grid gap-1.5">
                <span class="font-semibold">Full Demo</span>
                <input
                  class="w-full rounded-xl border border-border bg-white px-3 py-2.75 focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
                  type="file"
                  accept=".mp3,.wav,.ogg,.m4a,.aac,.webm,audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,audio/webm"
                  @change="onFullJamChange" />
              </label>
              <p class="text-[0.95rem] text-muted">{{ fullJamFileName }}</p>
              <div class="mt-3.5 flex flex-wrap justify-end items-center gap-3">
                <button
                  class="inline-flex items-center justify-center rounded-lg border border-border-strong bg-primary-gradient bg-primary-gradient-shadow px-3.5 py-2.5 text-[1rem] font-semibold text-primary-foreground transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-(--ease) hover:-translate-y-px hover:bg-primary-gradient-dark hover:shadow-primary-gradient-dark active:translate-y-px focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:translate-y-0"
                  type="button" :disabled="!canSaveFullJam" @click="saveFullJam">
                  <Icon name="lucide:save" class="mr-2" /> Save Full Demo
                </button>
              </div>

              <div v-if="existingFullJamEntry">
                <span class="font-semibold">Existing Full Demo</span>
                <audio :src="existingFullJamEntry.data" controls class="w-full"></audio>
                <p class="text-[0.95rem] text-muted">
                  Name: {{ existingFullJamEntry.name }}
                </p>
              </div>

              <label class="grid gap-1.5">
                <span class="font-semibold">Backing Track</span>
                <input
                  class="w-full rounded-xl border border-border bg-white px-3 py-2.75 focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
                  type="file"
                  accept=".mp3,.wav,.ogg,.m4a,.aac,.webm,audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,audio/webm"
                  @change="onBackingTrackChange" />
              </label>
              <p class="text-[0.95rem] text-muted">
                {{ backingTrackFileName }}
              </p>

              <div class="mt-3.5 flex flex-wrap justify-end items-center gap-3">
                <button
                  class="inline-flex items-center justify-center rounded-lg border border-border-strong bg-primary-gradient bg-primary-gradient-shadow px-3.5 py-2.5 text-[1rem] font-semibold text-primary-foreground transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-(--ease) hover:-translate-y-px hover:bg-primary-gradient-dark hover:shadow-primary-gradient-dark active:translate-y-px focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:translate-y-0"
                  type="button" :disabled="!canSaveBackingTrack" @click="saveBackingTrack">
                  <Icon name="lucide:save" class="mr-2" /> Save Backing Track
                </button>
              </div>

              <p v-if="styleAudioStatus" class="text-[0.95rem] font-semibold text-emerald-700" role="status"
                aria-live="polite">
                {{ styleAudioStatus }}
              </p>
              <div v-if="existingFullJamEntry || existingBackingTrackEntry" class="mt-3 grid gap-3">
                <p class="text-[0.95rem] text-muted">
                  {{ existingStyleAudioStatus }}
                </p>

                <div v-if="existingBackingTrackEntry">
                  <span class="font-semibold">Existing Backing Track</span>
                  <audio :src="existingBackingTrackEntry.data" controls class="w-full"></audio>
                  <p class="text-[0.95rem] text-muted">
                    Name: {{ existingBackingTrackEntry.name }}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section class="grid gap-3">
            <h3 class="text-[1.05rem] font-serif tracking-[-0.01em]">
              Part Video
            </h3>
            <p class="text-muted">
              Shared across all instruments for the selected style and part
              number.
            </p>

            <div class="grid gap-3.5 md:grid-rows-2 md:items-start">
              <section class="rounded-xl border border-border bg-popover p-3.5" aria-labelledby="levelAudioStyleTitle">
                <div class="mb-2.5 flex items-baseline justify-between gap-3">
                  <h3 id="levelAudioStyleTitle" class="m-0 font-serif text-[1.05rem] tracking-[-0.01em]">
                    Musical style
                  </h3>
                  <div class="text-[0.95rem] text-muted">
                    {{ selectedStyle || "Not selected" }}
                  </div>
                </div>
              </section>

              <section class="rounded-xl border border-border bg-popover p-3.5"
                aria-labelledby="levelAudioDifficultyTitle">
                <div class="mb-2.5 flex items-baseline justify-between gap-3">
                  <h3 id="levelAudioDifficultyTitle" class="m-0 font-serif text-[1.05rem] tracking-[-0.01em]">
                    Part number
                  </h3>
                  <div class="text-[0.95rem] text-muted">
                    {{ selectedDifficulty || "Not selected" }}
                  </div>
                </div>
              </section>
            </div>

            <div class="mt-3.5 grid gap-2.5 pb-3.5">
              <label class="grid gap-1.5">
                <span class="font-semibold">Part Demo Video</span>
                <input
                  class="w-full rounded-xl border border-border bg-white px-3 py-2.75 focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
                  type="file" accept=".mp4,.webm,.mov,.m4v,video/mp4,video/webm,video/quicktime"
                  @change="onLevelJamChange" />
              </label>
              <p class="text-[0.95rem] text-muted">{{ levelJamFileName }}</p>

              <div v-if="levelJamPreviewUrl" class="mt-1 grid gap-1">
                <span class="font-semibold">Selected Part Demo Video</span>
                <video :src="levelJamPreviewUrl" controls preload="metadata" class="w-full mt-1 rounded-lg"></video>
              </div>

              <div class="mt-3.5 flex flex-wrap justify-end items-center gap-3">
                <button
                  class="inline-flex items-center justify-center rounded-lg border border-border-strong bg-primary-gradient bg-primary-gradient-shadow px-3.5 py-2.5 text-[1rem] font-semibold text-primary-foreground transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-(--ease) hover:-translate-y-px hover:bg-primary-gradient-dark hover:shadow-primary-gradient-dark active:translate-y-px focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:translate-y-0"
                  type="button" :disabled="!canSaveLevelJam" @click="saveLevelJam">
                  <Icon name="lucide:save" class="mr-2" /> Save Part Demo Video
                </button>
              </div>

              <p v-if="levelAudioStatus" class="text-[0.95rem] font-semibold text-emerald-700" role="status"
                aria-live="polite">
                {{ levelAudioStatus }}
              </p>
              <div v-if="existingLevelJamEntry" class="mt-3 grid gap-2">
                <p class="text-[0.95rem] text-muted">
                  {{ existingLevelAudioStatus }}
                </p>
                <div class="grid gap-1">
                  <span class="font-semibold">Existing Part Demo Video</span>
                  <video v-if="isLevelJamVideo" :src="existingLevelJamEntry.data" controls preload="metadata"
                    class="w-full mt-1 rounded-lg"></video>
                  <audio v-else :src="existingLevelJamEntry.data" controls class="w-full mt-1"></audio>
                  <p class="text-[0.95rem] text-muted">
                    Name: {{ existingLevelJamEntry.name }}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="grid gap-4">
          <section class="grid gap-3">
            <h3 class="text-[1.05rem] font-serif tracking-[-0.01em]">
              Sheet Music
            </h3>
            <p class="text-muted">
              Saved to one style + instrument + part number combination.
            </p>

            <div class="grid gap-3.5 md:grid-rows-3 md:items-start">
              <section class="rounded-lg border border-border bg-popover p-3.5" aria-labelledby="adminStyleTitle">
                <div class="mb-2.5 flex items-baseline justify-between gap-3">
                  <h3 id="adminStyleTitle" class="m-0 font-serif text-[1.05rem] tracking-[-0.01em]">
                    Musical style
                  </h3>
                  <div class="text-[0.95rem] text-muted">
                    {{ selectedStyle || "Not selected" }}
                  </div>
                </div>
              </section>

              <section class="rounded-lg border border-border bg-popover p-3.5" aria-labelledby="adminInstrumentTitle">
                <div class="mb-2.5 flex items-baseline justify-between gap-3">
                  <h3 id="adminInstrumentTitle" class="m-0 font-serif text-[1.05rem] tracking-[-0.01em]">
                    Instrument
                  </h3>
                  <div class="text-[0.95rem] text-muted">
                    {{ selectedInstrument || "Not selected" }}
                  </div>
                </div>
              </section>

              <section class="rounded-lg border border-border bg-popover p-3.5" aria-labelledby="adminDifficultyTitle">
                <div class="mb-2.5 flex items-baseline justify-between gap-3">
                  <h3 id="adminDifficultyTitle" class="m-0 font-serif text-[1.05rem] tracking-[-0.01em]">
                    Part number
                  </h3>
                  <div class="text-[0.95rem] text-muted">
                    {{ selectedDifficulty || "Not selected" }}
                  </div>
                </div>
              </section>
            </div>

            <div class="grid gap-2.5">
              <label class="grid gap-1.5">
                <span class="font-semibold">Band Jam file (PDF)</span>
                <input
                  class="w-full rounded-lg border border-border bg-white px-3 py-2.75 focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
                  type="file" accept="application/pdf" @change="onSheetFileChange" />
              </label>

              <p class="text-[0.95rem] text-muted">{{ adminFileName }}</p>
              <p v-if="adminIsPdf" class="text-[0.95rem] text-muted">
                PDF selected
              </p>

              <div v-if="adminPreviewSrc"
                class="rounded-[10px] border border-dashed border-border-strong bg-card p-2.5">
                <img :src="adminPreviewSrc"
                  class="max-h-80 w-full rounded-lg border border-border bg-white object-contain"
                  alt="Preview before saving" />
              </div>
            </div>

            <p v-if="existingSheetStatus" class="text-[0.95rem] text-muted" role="status" aria-live="polite">
              {{ existingSheetStatus }}
            </p>

            <div v-if="existingSheetEntry && existingSheetIsImage"
              class="rounded-[10px] border border-dashed border-border-strong bg-card p-2.5">
              <img :src="existingSheetEntry.data"
                class="max-h-80 w-full rounded-lg border border-border bg-white object-contain"
                alt="Existing file preview" />
            </div>

            <div v-else-if="existingSheetEntry && existingSheetIsPdf"
              class="mx-auto w-full max-w-245 overflow-hidden rounded-xl border border-border bg-white shadow-(--shadow-soft-sm)">
              <embed :src="existingSheetEntry.data" class="block h-[min(72vh,900px)] w-full" type="application/pdf" />
            </div>

            <p class="text-[0.95rem] text-muted" role="status" aria-live="polite">
              {{ adminHelperText }}
            </p>
            <p v-if="adminSaveStatus" class="text-[0.95rem] font-semibold text-emerald-700" role="status"
              aria-live="polite">
              {{ adminSaveStatus }}
            </p>

            <div class="mt-3.5 flex flex-wrap justify-end items-center gap-3">
              <button
                class="inline-flex items-center justify-center rounded-lg border border-border-strong bg-primary-gradient bg-primary-gradient-shadow px-3.5 py-2.5 text-[1rem] font-semibold text-primary-foreground transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-(--ease) hover:-translate-y-px hover:bg-primary-gradient-dark hover:shadow-primary-gradient-dark active:translate-y-px focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:translate-y-0"
                type="button" :disabled="!canSaveSheet" @click="saveSheet">
                <Icon name="lucide:save" class="mr-2" /> Save Band Jam
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { authClient } from "~~/lib/auth-client";
import {
  DIFFICULTIES,
  INSTRUMENTS,
  STYLES,
} from "~/composables/useBandJamCatalog";
import type { AssetEntry } from "~/composables/useBandJamCatalog";

type StyleAudioAssetType = "full_jam" | "backing_track";

definePageMeta({
  middleware: "teacher-auth",
});

const {
  uploadAssetFile,
  isSupabaseReady,
  getUploadedSheetAsset,
  getFullJamAsset,
  getLevelJamAsset,
  getBackingTrackAsset,
} = useBandJamAssets();

// Unified context selections (single source of truth for all uploads)
const selectedStyle = ref<string | null>(null);
const selectedInstrument = ref<string | null>(null);
const selectedDifficulty = ref<string | null>(null);

// File refs
const fullJamFile = ref<File | null>(null);
const backingTrackFile = ref<File | null>(null);
const levelJamFile = ref<File | null>(null);
const adminFile = ref<File | null>(null);

// Statuses
const styleAudioStatus = ref("");
const levelAudioStatus = ref("");
const adminSaveStatus = ref("");

const existingSheetEntry = ref<AssetEntry | null>(null);
const existingSheetStatus = ref("");

// Existing audio previews (fetched from storage if present)
const existingFullJamEntry = ref<AssetEntry | null>(null);
const existingBackingTrackEntry = ref<AssetEntry | null>(null);
const existingLevelJamEntry = ref<AssetEntry | null>(null);

const existingStyleAudioStatus = ref("");
const existingLevelAudioStatus = ref("");
const levelJamPreviewUrl = ref("");

const adminIsPdf = ref(false);
const adminPreviewSrc = ref("");

const isLevelJamVideo = computed(() => {
  return (existingLevelJamEntry.value?.type || "").startsWith("video/");
});

const existingSheetIsPdf = computed(
  () => existingSheetEntry.value?.type === "application/pdf",
);
const existingSheetIsImage = computed(() => {
  if (!existingSheetEntry.value) return false;
  return (
    existingSheetEntry.value.type.startsWith("image/") ||
    existingSheetEntry.value.type === "image/*"
  );
});

const fullJamFileName = computed(() =>
  fullJamFile.value
    ? `Selected: ${fullJamFile.value.name}`
    : "No file selected.",
);
const backingTrackFileName = computed(() =>
  backingTrackFile.value
    ? `Selected: ${backingTrackFile.value.name}`
    : "No file selected.",
);
const levelJamFileName = computed(() =>
  levelJamFile.value
    ? `Selected: ${levelJamFile.value.name}`
    : "No file selected.",
);
const adminFileName = computed(() =>
  adminFile.value ? `Selected: ${adminFile.value.name}` : "No file selected.",
);

const canSaveFullJam = computed(() =>
  Boolean(isSupabaseReady.value && selectedStyle.value && fullJamFile.value),
);
const canSaveBackingTrack = computed(() =>
  Boolean(
    isSupabaseReady.value && selectedStyle.value && backingTrackFile.value,
  ),
);
const canSaveLevelJam = computed(() =>
  Boolean(
    isSupabaseReady.value &&
    selectedStyle.value &&
    selectedDifficulty.value &&
    levelJamFile.value,
  ),
);
const canSaveSheet = computed(() =>
  Boolean(
    isSupabaseReady.value &&
    selectedStyle.value &&
    selectedInstrument.value &&
    selectedDifficulty.value &&
    adminFile.value,
  ),
);

const hasAdminSelection = computed(() =>
  Boolean(
    selectedStyle.value && selectedInstrument.value && selectedDifficulty.value,
  ),
);

const adminHelperText = computed(() => {
  if (!hasAdminSelection.value) {
    return "Select style, instrument, part number, and choose a PDF.";
  }

  if (!adminFile.value) {
    if (existingSheetEntry.value)
      return "Existing file found. Choose a new image or PDF to replace it.";
    return "Choose an image or PDF to upload.";
  }

  if (existingSheetEntry.value)
    return "Ready to replace the existing band jam file.";
  return "Ready to save this band jam file.";
});

const checkExistingSheet = async () => {
  existingSheetEntry.value = null;
  existingSheetStatus.value = "";

  if (!hasAdminSelection.value) {
    existingSheetStatus.value =
      "Select style, instrument, and part number to check for an existing file.";
    return;
  }

  if (!isSupabaseReady.value) return;

  existingSheetStatus.value = "Checking for existing file...";

  try {
    const existing = await getUploadedSheetAsset(
      selectedStyle.value as string,
      selectedDifficulty.value as string,
      selectedInstrument.value as string,
    );

    if (existing) {
      existingSheetEntry.value = existing;
      existingSheetStatus.value = `Existing file found: ${existing.name}`;
    } else {
      existingSheetStatus.value = "No existing file for this combination yet.";
    }
  } catch (error: unknown) {
    existingSheetStatus.value =
      error instanceof Error
        ? error.message
        : "Could not check for an existing file.";
  }
};

watch(
  [selectedStyle, selectedInstrument, selectedDifficulty, isSupabaseReady],
  () => {
    void checkExistingSheet();
  },
  { immediate: true },
);

// Fetch existing style audio (full demo + backing track) for the selected style
const checkExistingStyleAudios = async () => {
  existingFullJamEntry.value = null;
  existingBackingTrackEntry.value = null;
  existingStyleAudioStatus.value = "";

  if (!selectedStyle.value) {
    existingStyleAudioStatus.value =
      "Select a style to check for existing audio.";
    return;
  }

  if (!isSupabaseReady.value) return;

  existingStyleAudioStatus.value = "Checking for existing style audio...";

  try {
    const [full, backing] = await Promise.all([
      getFullJamAsset(selectedStyle.value as string),
      getBackingTrackAsset(selectedStyle.value as string),
    ]);

    if (full) existingFullJamEntry.value = full;
    if (backing) existingBackingTrackEntry.value = backing;

    existingStyleAudioStatus.value =
      full || backing
        ? "Existing style audio loaded."
        : "No existing style audio for this style yet.";
  } catch (error: unknown) {
    existingStyleAudioStatus.value =
      error instanceof Error
        ? error.message
        : "Could not check for style audio.";
  }
};

watch(
  [selectedStyle, isSupabaseReady],
  () => {
    void checkExistingStyleAudios();
  },
  { immediate: true },
);

// Fetch existing level audio for selected style + difficulty
const checkExistingLevelAudio = async () => {
  existingLevelJamEntry.value = null;
  existingLevelAudioStatus.value = "";

  if (!(selectedStyle.value && selectedDifficulty.value)) {
    existingLevelAudioStatus.value =
      "Select style and part number to check for existing level audio.";
    return;
  }

  if (!isSupabaseReady.value) return;

  existingLevelAudioStatus.value = "Checking for existing level audio...";

  try {
    const lvl = await getLevelJamAsset(
      selectedStyle.value as string,
      selectedDifficulty.value as string,
    );
    if (lvl) existingLevelJamEntry.value = lvl;
    existingLevelAudioStatus.value = lvl
      ? "Existing level audio loaded."
      : "No existing level audio for this style/part yet.";
  } catch (error: unknown) {
    existingLevelAudioStatus.value =
      error instanceof Error
        ? error.message
        : "Could not check for level audio.";
  }
};

watch(
  [selectedStyle, selectedDifficulty, isSupabaseReady],
  () => {
    void checkExistingLevelAudio();
  },
  { immediate: true },
);

const getFileFromEvent = (event: Event): File | null => {
  const input = event.target as HTMLInputElement | null;
  return input?.files?.[0] || null;
};

const isSupportedAudioFile = (file: File): boolean => {
  return (
    file.type.startsWith("audio/") ||
    /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(file.name)
  );
};

const isSupportedVideoFile = (file: File): boolean => {
  return (
    file.type.startsWith("video/") ||
    /\.(mp4|webm|mov|m4v)$/i.test(file.name)
  );
};

const onFullJamChange = (event: Event) => {
  styleAudioStatus.value = "";
  const nextFile = getFileFromEvent(event);

  if (nextFile && !isSupportedAudioFile(nextFile)) {
    fullJamFile.value = null;
    styleAudioStatus.value = "Choose an MP3, WAV, OGG, M4A, AAC, or WEBM file.";
    return;
  }

  fullJamFile.value = nextFile;
};

const onBackingTrackChange = (event: Event) => {
  styleAudioStatus.value = "";
  const nextFile = getFileFromEvent(event);

  if (nextFile && !isSupportedAudioFile(nextFile)) {
    backingTrackFile.value = null;
    styleAudioStatus.value = "Choose an MP3, WAV, OGG, M4A, AAC, or WEBM file.";
    return;
  }

  backingTrackFile.value = nextFile;
};

const onLevelJamChange = (event: Event) => {
  levelAudioStatus.value = "";
  const nextFile = getFileFromEvent(event);

  if (levelJamPreviewUrl.value) {
    URL.revokeObjectURL(levelJamPreviewUrl.value);
    levelJamPreviewUrl.value = "";
  }

  if (nextFile && !isSupportedVideoFile(nextFile)) {
    levelJamFile.value = null;
    levelAudioStatus.value = "Choose an MP4, WEBM, MOV, or M4V video file.";
    return;
  }

  levelJamFile.value = nextFile;
  if (nextFile) {
    levelJamPreviewUrl.value = URL.createObjectURL(nextFile);
  }
};

onBeforeUnmount(() => {
  if (levelJamPreviewUrl.value) {
    URL.revokeObjectURL(levelJamPreviewUrl.value);
  }
});

const onSheetFileChange = (event: Event) => {
  adminSaveStatus.value = "";

  const nextFile = getFileFromEvent(event);
  adminFile.value = nextFile;
  adminIsPdf.value = false;
  adminPreviewSrc.value = "";

  if (!nextFile) return;

  adminIsPdf.value =
    nextFile.type === "application/pdf" || /\.pdf$/i.test(nextFile.name);

  if (adminIsPdf.value) return;

  const reader = new FileReader();
  reader.onload = () => {
    adminPreviewSrc.value = String(reader.result || "");
  };
  reader.readAsDataURL(nextFile);
};

const saveStyleAudio = async (
  assetType: StyleAudioAssetType,
  fileRef: { value: File | null },
  successMessage: string,
) => {
  if (!(selectedStyle.value && fileRef.value)) return;

  styleAudioStatus.value = "Uploading...";

  try {
    await uploadAssetFile({
      file: fileRef.value,
      assetType,
      style: selectedStyle.value,
    });
    styleAudioStatus.value = successMessage;
    await checkExistingStyleAudios();
  } catch (error: unknown) {
    styleAudioStatus.value =
      error instanceof Error ? error.message : "Could not save style audio.";
  }
};

const saveFullJam = () => {
  saveStyleAudio(
    "full_jam",
    fullJamFile,
    "Full jam saved successfully.",
  );
};

const saveBackingTrack = () => {
  saveStyleAudio(
    "backing_track",
    backingTrackFile,
    "Backing track saved successfully.",
  );
};

const saveLevelJam = async () => {
  if (!(selectedStyle.value && selectedDifficulty.value && levelJamFile.value))
    return;

  levelAudioStatus.value = "Uploading...";

  try {
    await uploadAssetFile({
      file: levelJamFile.value,
      assetType: "level_jam",
      style: selectedStyle.value,
      difficulty: selectedDifficulty.value,
    });
    levelAudioStatus.value = "Part demo video saved successfully.";
    await checkExistingLevelAudio();
  } catch (error: unknown) {
    levelAudioStatus.value =
      error instanceof Error ? error.message : "Could not save part demo video.";
  }
};

const saveSheet = async () => {
  if (
    !(
      selectedStyle.value &&
      selectedInstrument.value &&
      selectedDifficulty.value &&
      adminFile.value
    )
  )
    return;

  adminSaveStatus.value = "Uploading...";

  try {
    await uploadAssetFile({
      file: adminFile.value,
      assetType: "sheet",
      style: selectedStyle.value,
      difficulty: selectedDifficulty.value,
      instrument: selectedInstrument.value,
    });
    adminSaveStatus.value = "Band jam saved successfully.";
    await checkExistingSheet();
  } catch (error: unknown) {
    adminSaveStatus.value =
      error instanceof Error ? error.message : "Could not save band jam.";
  }
};

const logout = async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        navigateTo("/");
      },
    },
  });
};
</script>
