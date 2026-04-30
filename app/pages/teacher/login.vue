<template>
  <section aria-labelledby="teacherLoginTitle" class="flex justify-center items-center">
    <div
      class="mt-20 rounded-tl-[12px] rounded-tr-[12px] h-[calc(100vh-205px)] border border-b-0 border-border bg-surface w-[40vw] p-4.5">
      <div class="mb-3.5">
        <h2 id="teacherLoginTitle" class="font-serif text-5xl tracking-[-0.02em]">
          Teacher Login
        </h2>
        <p class="mt-1.5 text-muted">
          Sign in with Google to manage Band Jam uploads.
        </p>
      </div>

      <div class="grid gap-3">
        <p class="text-[0.95rem] text-muted">
          Use the authorized teacher Google account to sign in.
        </p>

        <div class="flex flex-wrap items-center gap-2.5">
          <button
            class="cursor-pointer inline-flex items-center justify-center rounded-[8px] border border-border bg-white px-[14px] py-[10px] text-[1rem] font-semibold text-foreground shadow-[var(--shadow-soft-sm)] transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-[var(--ease)] hover:-translate-y-px hover:bg-card hover:shadow-[0_10px_18px_rgba(31,42,55,0.12)] active:translate-y-[1px] focus-visible:outline focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
            type="button" @click="socialSignIn">
            <Icon name="material-icon-theme:google" class="mr-2" />Sign in with
            Google
          </button>
          <button
            class="cursor-pointer inline-flex items-center justify-center rounded-[8px] border border-border bg-card px-[14px] py-[10px] text-[1rem] font-semibold text-foreground transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-[var(--ease)] hover:-translate-y-px hover:bg-card active:translate-y-[1px] focus-visible:outline focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
            type="button" @click="navigateTo('/')">
            <Icon name="lucide:arrow-left" class="mr-2" /> Back
          </button>
        </div>

        <p v-if="errorMessage" class="text-[0.95rem] font-semibold text-red-700" role="alert">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { authClient } from "~~/lib/auth-client";
const { isTeacherAuthenticated } = useBandJamState();

if (isTeacherAuthenticated.value) {
  await navigateTo("/teacher/admin");
}

const errorMessage = ref("");

const socialSignIn = async () => {
  try {
    const res = await authClient.signIn.social({
      provider: "google",
      disableRedirect: true,
      callbackURL: "/teacher/admin",
    });

    if (res?.data?.url) {
      await navigateTo(res.data.url, { external: true });
    }
  } catch (err) {
    errorMessage.value = "Sign-in failed. Please try again.";
    // eslint-disable-next-line no-console
    console.error("Google sign-in error", err);
  }
};
</script>
