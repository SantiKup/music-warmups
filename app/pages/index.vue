<template>
  <main>
    <section aria-labelledby="loginTitle" class="grid min-h-screen place-items-center px-6 py-12 relative">
      <div class="w-full max-w-5xl">
        <ClientOnly>
          <UiBlurReveal :delay="0.2" :duration="0.75">
            <div class="mb-8 text-center">
              <h1 id="loginTitle" class="font-serif text-8xl italic inline-flex items-center justify-center">
                <Icon name="mdi:music-clef-treble" class="mr-1" /> BandJam
              </h1>
              <h2 class="font-serif italic text-secondary-foreground text-3xl">&ldquo;A new way to jam.&rdquo;</h2>
            </div>

            <div v-if="isSessionLoaded" class="mx-auto mt-4 w-full max-w-2xl">
              <article class="rounded-3xl border border-border bg-surface p-8 shadow-[0_16px_40px_rgba(31,42,55,0.08)]">
                <p class="text-sm font-semibold uppercase tracking-[0.2em] text-muted text-center">Sign-In</p>
                <h3 class="mt-3 font-serif text-3xl tracking-[-0.02em] text-center">Start your jamming journey
                  <strong>today</strong>
                </h3>
                <div class="mt-8 flex justify-center">
                  <button
                    class="inline-flex items-center justify-center rounded-xl border border-border bg-white px-4 py-3 text-[1rem] font-semibold text-foreground shadow-(--shadow-soft-sm) transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-(--ease) hover:-translate-y-px hover:bg-card hover:shadow-[0_10px_18px_rgba(31,42,55,0.12)] active:translate-y-px focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
                    type="button" :disabled="isLoading" @click="signInWithGoogle">
                    <Icon v-if="isLoading" name="lucide:loader-2" class="mr-2 animate-spin" />
                    <Icon v-else name="material-icon-theme:google" class="mr-2" />
                    {{ isLoading ? 'Signing in...' : 'Sign in with Google' }}
                  </button>
                </div>
              </article>
            </div>
          </UiBlurReveal>
        </ClientOnly>
      </div>
    </section>
    <footer class="mx-auto w-screen -mt-10 h-10 px-4 pt-2.5 text-[0.92rem] text-muted bg-surface z-50">
      <div class="text-center">
        &copy; {{ new Date().getFullYear() }} Justin Gibbs - All Rights
        Reserved
      </div>
    </footer>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})
import { useTimeout } from "@vueuse/core";
import { useTime } from "motion-v";
import { authClient } from "~~/lib/auth-client";
import { isAuthorizedTeacher } from "~~/lib/teacher-emails";

const isSessionLoaded = ref(false);
const isLoading = ref(false);

const session = authClient.useSession();
const user = computed(() => session.value.data?.user);

watch(
  () => user.value,
  async (newUser) => {
    if (!newUser) return;

    const email = (newUser.email || "").toLowerCase();
    const isStudent = email.endsWith("@students.nido.cl");
    const isTeacher = isAuthorizedTeacher(email);

    if (isStudent || isTeacher) {
      await navigateTo("/home");
    }
  },
  { immediate: true }
);

onMounted(() => {
  isSessionLoaded.value = true;
});

const signInWithGoogle = async () => {
  try {
    isLoading.value = true;
    await authClient.signIn.social({ provider: "google" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Google sign-in error:", err);
  } finally {
    useTimeout(1000, {
      callback: () => {
        isLoading.value = false;
      }
    })
  }
};
</script>
