<template>
  <section aria-labelledby="selectTitle" class="flex justify-center items-center">
    <div
      class="mt-20 rounded-tl-[12px] rounded-tr-[12px] h-screen border border-b-0 border-border bg-surface w-[40vw] p-4.5">
      <div class="mb-3.5">
        <h2 id="selectTitle" class="font-serif text-[1.25rem] tracking-[-0.02em]">
          Choose your Band Jam
        </h2>
        <p class="mt-1.5 text-muted">
          Pick a style and instrument. You will choose a part number next.
        </p>
      </div>

      <div class="grid gap-3.5 md:grid-rows-2 md:items-start">
        <section
          class="rounded-[8px] border border-[rgba(31,42,55,0.1)] bg-[linear-gradient(180deg,rgba(31,42,55,0.02),transparent)] p-[14px]"
          aria-labelledby="styleTitle">
          <div class="mb-2.5 flex items-baseline justify-between gap-3">
            <h3 id="styleTitle" class="m-0 font-serif text-[1.05rem] tracking-[-0.01em]">
              Musical style
            </h3>
            <div class="text-[0.95rem] text-muted">
              {{ studentSelection.style || "Not selected" }}
            </div>
          </div>
          <OptionPills :options="STYLES" :selected="studentSelection.style"
            @select="setStudentField('style', $event)" />
        </section>

        <section
          class="rounded-[8px] border border-[rgba(31,42,55,0.1)] bg-[linear-gradient(180deg,rgba(31,42,55,0.02),transparent)] p-[14px]"
          aria-labelledby="instrumentTitle">
          <div class="mb-2.5 flex items-baseline justify-between gap-3">
            <h3 id="instrumentTitle" class="m-0 font-serif text-[1.05rem] tracking-[-0.01em]">
              Instrument
            </h3>
            <div class="text-[0.95rem] text-muted">
              {{ studentSelection.instrument || "Not selected" }}
            </div>
          </div>
          <OptionPills :options="INSTRUMENTS" :selected="studentSelection.instrument"
            @select="setStudentField('instrument', $event)" />
        </section>
      </div>

      <div class="mt-3.5 flex flex-wrap items-center justify-between gap-3">
        <NuxtLink
          class="cursor-pointer inline-flex items-center justify-center rounded-lg border border-border bg-[rgba(31,42,55,0.04)] px-3.5 py-2.5 text-[1rem] font-semibold text-[rgba(31,42,55,0.92)] transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-(--ease) hover:-translate-y-px hover:bg-[rgba(31,42,55,0.08)] active:translate-y-[1px] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[rgba(139,107,69,0.32)] focus-visible:outline-offset-2"
          to="/">
          <Icon name="lucide:arrow-left" class="mr-2" /> Back
        </NuxtLink>
        <div class="flex flex-wrap items-center gap-2.5">
          <button
            class="cursor-pointer inline-flex items-center justify-center rounded-lg border border-border bg-[rgba(31,42,55,0.04)] px-3.5 py-2.5 text-[1rem] font-semibold text-[rgba(31,42,55,0.92)] transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-(--ease) hover:-translate-y-px hover:bg-[rgba(31,42,55,0.08)] active:translate-y-[1px] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[rgba(139,107,69,0.32)] focus-visible:outline-offset-2"
            type="button" @click="resetStudentSelection">
            <Icon name="lucide:rotate-ccw" class="mr-2" /> Reset
          </button>
          <button
            class="cursor-pointer inline-flex items-center justify-center rounded-lg border border-border bg-[linear-gradient(180deg,#2c3b4f,#233141)] px-3.5 py-2.5 text-[1rem] font-semibold text-brand-ink shadow-[0_8px_18px_rgba(31,42,55,0.18)] transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-[var(--ease)] hover:-translate-y-px hover:bg-[linear-gradient(180deg,#324458,#253547)] hover:shadow-[0_12px_22px_rgba(31,42,55,0.22)] active:translate-y-[1px] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[rgba(139,107,69,0.32)] focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:translate-y-0"
            type="button" :disabled="!selectionReady" @click="goToResult">
            <Icon name="lucide:eye" class="mr-2" />
            Show Band Jam
          </button>
        </div>
      </div>

      <p class="mt-3 text-[0.95rem] text-muted" role="status" aria-live="polite">
        {{ helperText }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { INSTRUMENTS, STYLES } from "~/composables/useBandJamCatalog";

const {
  studentSelection,
  selectionReady,
  setStudentField,
  resetStudentSelection,
} = useBandJamState();

const helperText = computed(() => {
  if (selectionReady.value) return 'Ready. Press "Show Band Jam".';
  return "Select style and instrument to continue.";
});

const goToResult = () => {
  if (!selectionReady.value) return;
  navigateTo("/student/result");
};
</script>
