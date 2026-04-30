<template>
  <SidebarProvider :default-open="false">
    <AppSidebar class="fixed z-40" />
    <div class="flex min-h-screen flex-col">
      <SidebarTrigger />
      <main id="page-content" class="relative w-screen h-max flex-1" role="main">
        <slot />
      </main>

      <footer class="mx-auto w-screen -mt-10 h-10 px-4 pt-2.5 text-[0.92rem] text-muted bg-surface z-50">
        <div class="text-center">
          &copy; {{ new Date().getFullYear() }} Justin Gibbs - All Rights
          Reserved
        </div>
      </footer>
    </div>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
</script>
