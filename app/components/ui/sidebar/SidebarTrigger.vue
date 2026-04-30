<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { PanelLeft } from "lucide-vue-next"
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { useSidebar } from "./utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()

const { toggleSidebar } = useSidebar()
</script>

<template>
  <button
    class="cursor-pointer fixed top-4 left-4 z-30 inline-flex items-center justify-center rounded-lg border border-border bg-white px-3.5 py-2.5 text-[0.95rem] font-semibold text-foreground shadow-(--shadow-soft-sm) transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-(--ease) hover:-translate-y-px hover:text-primary-foreground hover:border-border-strong hover:shadow-[0_10px_18px_rgba(31,42,55,0.12)] active:translate-y-px focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
    type="button" title="Open navigation" @click="toggleSidebar">
    <Icon name="lucide:menu" class="h-4 w-4" />
  </button>
</template>
