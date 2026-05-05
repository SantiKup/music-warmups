<template>
  <section ref="containerRef" aria-labelledby="resultTitle" class="flex justify-between">
    <div class="shrink-0 p-12 w-100">
      <div>
        <h2 id="resultTitle" class="font-serif text-[1.25rem] tracking-[-0.02em]">
          {{ studentSelection.style }} - {{ studentSelection.instrument }}
        </h2>

        <section class="mt-3" aria-labelledby="partTitle">
          <div class="mb-2.5 flex items-baseline justify-between gap-3">
            <h3 id="partTitle" class="m-0 font-serif text-[1.05rem] tracking-[-0.01em]">
              Part number
            </h3>
            <div class="text-[0.95rem] text-muted">
              {{ partLabel }}
            </div>
          </div>
          <OptionPills :options="DIFFICULTIES" :selected="studentSelection.difficulty"
            @select="setStudentField('difficulty', $event)" />
        </section>
      </div>


      <div class="grid w-full max-w-105 gap-2 mt-4 space-y-2" aria-label="Media playback">
        <div class="grid gap-1 md:grid-rows">
          <span class="font-serif text-[0.95rem] font-bold">Full demo</span>
          <div class="min-w-0 text-[0.95rem] text-muted">
            <audio v-if="fullJamEntry" class="block w-full" controls preload="none">
              <source :src="fullJamEntry.data" :type="fullJamEntry.type" />
              Audio format not supported by this browser.
            </audio>
            <span v-else>{{ isLoading ? "Loading..." : "Not added" }}</span>
          </div>
        </div>

        <div class="grid gap-1 md:grid-rows">
          <span class="font-serif text-[0.95rem] font-bold">Backing Track</span>
          <div class="min-w-0 text-[0.95rem] text-muted">
            <audio v-if="backingTrackEntry" class="block w-full" controls preload="none">
              <source :src="backingTrackEntry.data" :type="backingTrackEntry.type" />
              Audio format not supported by this browser.
            </audio>
            <span v-else>{{ isLoading ? "Loading..." : "Not added" }}</span>
          </div>
        </div>

        <div class="grid gap-1 md:grid-rows">
          <span class="font-serif text-[0.95rem] font-bold">Level demo</span>
          <div class="min-w-0 text-[0.95rem] text-muted">
            <video v-if="levelJamEntry && isLevelJamVideo" class="block w-full rounded-lg" controls preload="metadata">
              <source :src="levelJamEntry.data" :type="levelJamEntry.type" />
              Video format not supported by this browser.
            </video>
            <audio v-else-if="levelJamEntry" class="block w-full" controls preload="none">
              <source :src="levelJamEntry.data" :type="levelJamEntry.type" />
              Audio format not supported by this browser.
            </audio>
            <span v-else>{{ isLoading ? "Loading..." : "Not added" }}</span>
          </div>
        </div>
      </div>

      <div class="mt-3.5 flex flex-col items-start justify-start space-y-3">
        <NuxtLink v-if="isPdf && sheetEntry" :to="sheetEntry.data" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3.5 py-2.5 text-[1rem] font-semibold text-foreground transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-(--ease) hover:-translate-y-px hover:bg-card active:translate-y-px focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2">
          <Icon name="lucide:external-link" class="mr-2" /> Open in new tab
        </NuxtLink>
        <NuxtLink
          class="inline-flex items-center justify-center rounded-lg border border-border-strong bg-primary-gradient bg-primary-gradient-shadow px-3.5 py-2.5 text-[1rem] font-semibold text-primary-foreground transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-(--ease) hover:-translate-y-px hover:bg-primary-gradient-dark hover:shadow-primary-gradient-dark active:translate-y-px focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
          to="/student">
          <Icon name="lucide:repeat" class="mr-2" />Choose Another
        </NuxtLink>
      </div>

    </div>

    <div class="flex-1">
      <div v-if="!isLoading && !isPdf">
        <div class="rounded-[12px] border border-dashed border-border-strong bg-card p-[18px]">
          <div class="font-serif font-semibold">No Band Jam uploaded yet.</div>
          <div class="mt-1 text-muted">
            Try another combination, or check back later.
          </div>
        </div>
      </div>

      <div v-if="isPdf" class="mx-auto h-screen w-full overflow-hidden">
        <embed :src="sheetEntry?.data || ''" class="block h-full w-full" type="application/pdf" />
      </div>

      <p v-if="loadError" class="mt-3 text-[0.95rem] font-semibold text-red-700" role="alert">
        {{ loadError }}
      </p>
    </div>

  </section>
</template>

<script setup lang="ts">
import { DIFFICULTIES, type AssetEntry } from "~/composables/useBandJamCatalog";

definePageMeta({
  middleware: "student-auth",
});

const { studentSelection, selectionReady, setStudentField } = useBandJamState();

if (!selectionReady.value) {
  await navigateTo("/student");
}

const {
  getSheetAsset,
  getFullJamAsset,
  getLevelJamAsset,
  getBackingTrackAsset,
} = useBandJamAssets();

const sheetEntry = ref<AssetEntry | null>(null);
const fullJamEntry = ref<AssetEntry | null>(null);
const levelJamEntry = ref<AssetEntry | null>(null);
const backingTrackEntry = ref<AssetEntry | null>(null);
const isLoading = ref(true);
const loadError = ref("");

const isPdf = computed(() => sheetEntry.value?.type === "application/pdf");
const isLevelJamVideo = computed(() => {
  return (levelJamEntry.value?.type || "").startsWith("video/");
});
const partLabel = computed(() => {
  return studentSelection.value.difficulty
    ? `Part ${studentSelection.value.difficulty}`
    : "Part ?";
});
const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const loadResult = async () => {
  const { style, instrument, difficulty } = studentSelection.value;
  if (!(style && instrument)) {
    await navigateTo("/student/");
    return;
  }

  if (!difficulty) {
    setStudentField("difficulty", DIFFICULTIES[0]);
    return;
  }

  isLoading.value = true;
  loadError.value = "";

  try {
    const [sheet, fullJam, levelJam, backingTrack] = await Promise.all([
      getSheetAsset(style, difficulty, instrument),
      getFullJamAsset(style),
      getLevelJamAsset(style, difficulty),
      getBackingTrackAsset(style),
    ]);

    sheetEntry.value = sheet;
    fullJamEntry.value = fullJam;
    levelJamEntry.value = levelJam;
    backingTrackEntry.value = backingTrack;
  } catch (error: unknown) {
    fullJamEntry.value = null;
    levelJamEntry.value = null;
    backingTrackEntry.value = null;
    sheetEntry.value = null;
    loadError.value =
      error instanceof Error ? error.message : "Could not load assets.";
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => [
    studentSelection.value.style,
    studentSelection.value.instrument,
    studentSelection.value.difficulty,
  ],
  () => {
    void loadResult();
  },
  { immediate: true },
);

</script>
