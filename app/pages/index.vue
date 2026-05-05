<template>
  <section aria-labelledby="roleTitle" class="grid place-items-center h-screen relative">
    <!-- Menu discovery arrow -->
    <div class="absolute top-14 left-10 flex flex-col items-center gap-2 pointer-events-none">
      <div class="text-accent-ink">
        <Icon name="lucide:arrow-up-left" class="h-6 w-6" />
      </div>
      <p class="text-[0.9rem] font-semibold text-accent-ink font-serif -mt-3">menu here!</p>
    </div>

    <div class="flex flex-col">
      <ClientOnly>
        <UiBlurReveal :delay="0.2" :duration="0.75">
          <h1 id="roleTitle" class="font-serif text-9xl italic inline-flex">
            <Icon name="mdi:music-clef-treble" class="mr-1" /> BandJam
          </h1>
          <h2 class="font-serif text-center italic text-secondary-foreground text-3xl">&ldquo;A new way to jam.&rdquo;
          </h2>
          <p class="text-[1.05rem] mt-10 text-muted text-center w-full">Select your role to continue.</p>
          <div v-if="isSessionLoaded" class="mt-4 flex flex-wrap justify-center items-center gap-2.5 mx-auto">
            <NuxtLink
              class="inline-flex items-center justify-center rounded-xl border border-border-strong bg-primary-gradient bg-primary-gradient-shadow px-[14px] py-[10px] text-[1rem] font-semibold text-primary-foreground transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-[var(--ease)] hover:-translate-y-px hover:bg-primary-gradient-dark hover:shadow-primary-gradient-dark active:translate-y-[1px] focus-visible:outline focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
              :to="studentLink">
              <Icon name="lucide:book-open-text" class="mr-2" /> Student
            </NuxtLink>
            <NuxtLink
              class="inline-flex items-center justify-center rounded-xl border border-border-strong bg-primary-gradient bg-primary-gradient-shadow px-[14px] py-[10px] text-[1rem] font-semibold text-primary-foreground transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-[var(--ease)] hover:-translate-y-px hover:bg-primary-gradient-dark hover:shadow-primary-gradient-dark active:translate-y-[1px] focus-visible:outline focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
              :to="teacherLink">
              <Icon name="lucide:lock-keyhole" class="mr-2" /> Teacher
            </NuxtLink>
          </div>
        </UiBlurReveal>
      </ClientOnly>
    </div>
  </section>
</template>

<script setup lang="ts">
import { authClient } from "~~/lib/auth-client";
import { isAuthorizedTeacher } from "~~/lib/teacher-emails";

const stepEasing = (t: number) => Math.floor(t * 10) / 10;

const isSessionLoaded = ref(false);

// Fetch session explicitly to ensure it's loaded
const { data: sessionData } = await useFetch("/api/auth/session", {
  watch: false,
});

const session = authClient.useSession();
const user = computed(() => session.value.data?.user);
const userEmail = computed(() => (user.value?.email || "").toLowerCase());

// Mark as loaded once we have the session data
onMounted(() => {
  isSessionLoaded.value = true;
});

const studentLink = computed(() => {
  if (!isSessionLoaded.value) return "/student/login";
  return user.value && userEmail.value.endsWith("@students.nido.cl")
    ? "/student"
    : "/student/login";
});

const teacherLink = computed(() => {
  if (!isSessionLoaded.value) return "/teacher/login";
  return user.value && isAuthorizedTeacher(userEmail.value)
    ? "/teacher/admin"
    : "/teacher/login";
});
</script>
