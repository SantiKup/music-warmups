<template>
  <div class="flex flex-wrap gap-2.5" role="list">
    <button v-for="option in options" :key="option" type="button"
      class="rounded-[10px] border px-3 py-2.5 text-center text-[0.95rem] font-medium leading-tight shadow-[0_4px_12px_rgba(31,42,55,0.06)] transition-[transform,box-shadow,border-color,background-color] duration-300 ease-(--ease) hover:-translate-y-px hover:shadow-[0_8px_16px_rgba(31,42,55,0.1)] focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 cursor-pointer"
      :class="getOptionClasses(option)" :aria-pressed="option === selected ? 'true' : 'false'"
      @click="emit('select', option)">
      {{ option }}
    </button>
  </div>
</template>

<script setup lang="ts">
type PillStatus = "missing" | "existing";

const props = defineProps<{
  options: readonly string[];
  selected?: string | null;
  statusByOption?: Partial<Record<string, PillStatus>>;
}>();

const emit = defineEmits<{
  (event: "select", value: string): void;
}>();

const getOptionClasses = (option: string): string => {
  const isSelected = option === props.selected;
  const status = props.statusByOption?.[option];

  if (status === "existing") {
    return isSelected
      ? "border-emerald-700 bg-emerald-700 text-white shadow-[0_10px_18px_rgba(4,120,87,0.28)]"
      : "border-emerald-300 bg-emerald-50 text-emerald-900";
  }

  if (status === "missing") {
    return isSelected
      ? "border-rose-700 bg-rose-700 text-white shadow-[0_10px_18px_rgba(190,18,60,0.28)]"
      : "border-rose-300 bg-rose-50 text-rose-900";
  }

  return isSelected
    ? "border-border-strong bg-primary-gradient text-primary-foreground shadow-[0_10px_18px_rgba(31,42,55,0.12)] hover:bg-primary-gradient-dark hover:shadow-primary-gradient-dark"
    : "border-border text-foreground";
};
</script>
