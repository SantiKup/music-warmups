<template>
  <section aria-labelledby="studentLoginTitle" class="flex justify-center items-center">
    <div
      class="mt-20 rounded-tl-[12px] rounded-tr-[12px] h-[calc(100vh-205px)] border border-b-0 border-border bg-surface w-[40vw] p-4.5">
      <div class="mb-3.5">
        <h2 id="studentLoginTitle" class="font-serif text-5xl tracking-[-0.02em]">
          {{ isSignUp ? "Create Account" : "Student Login" }}
        </h2>
        <p class="mt-1.5 text-muted">
          {{ isSignUp
            ? "Sign up with your student email (@students.nido.cl)"
            : "Sign in with your student account"
          }}
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="grid gap-3">
        <div>
          <label for="email" class="block text-[0.95rem] font-semibold mb-2">
            Email
          </label>
          <UiInput id="email" v-model="form.email" type="email" placeholder="your.name@students.nido.cl" required
            :disabled="isLoading" />
          <p v-if="!isSignUp && form.email && !form.email.endsWith('@students.nido.cl')"
            class="text-[0.85rem] text-orange-600 mt-1">
            ⚠ Must end with @students.nido.cl
          </p>
        </div>

        <div>
          <label for="password" class="block text-[0.95rem] font-semibold mb-2">
            Password
          </label>
          <UiInput id="password" v-model="form.password" type="password"
            :placeholder="isSignUp ? 'Create a password' : 'Enter your password'" required :disabled="isLoading" />
          <p v-if="isSignUp && form.password" class="text-[0.85rem] text-muted mt-1">
            {{ form.password.length >= 8 ? "✓ Strong" : `${8 - form.password.length} more characters` }}
          </p>
        </div>

        <button type="submit" :disabled="isLoading || (isSignUp && !form.email.endsWith('@students.nido.cl'))"
          class="cursor-pointer inline-flex items-center justify-center rounded-xl border border-border bg-[linear-gradient(180deg,#2c3b4f,#233141)] px-[14px] py-[10px] text-[1rem] font-semibold text-brand-ink shadow-[0_8px_18px_rgba(31,42,55,0.18)] transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-[var(--ease)] hover:-translate-y-px hover:bg-[linear-gradient(180deg,#324458,#253547)] hover:shadow-[0_12px_22px_rgba(31,42,55,0.22)] active:translate-y-[1px] focus-visible:outline focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:translate-y-0">
          <Icon v-if="isLoading" name="lucide:loader-2" class="mr-2 animate-spin" />
          {{ isLoading ? "Loading..." : (isSignUp ? "Create Account" : "Sign In") }}
        </button>

        <button type="button" @click="toggleForm" :disabled="isLoading"
          class="cursor-pointer inline-flex items-center justify-center rounded-xl border border-border bg-card px-[14px] py-[10px] text-[1rem] font-semibold text-foreground transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-[var(--ease)] hover:-translate-y-px hover:bg-[rgba(31,42,55,0.08)] active:translate-y-[1px] focus-visible:outline focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:opacity-55">
          {{ isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up" }}
        </button>

        <button type="button" @click="navigateTo('/')" :disabled="isLoading"
          class="cursor-pointer inline-flex items-center justify-center rounded-xl border border-border bg-[rgba(31,42,55,0.04)] px-[14px] py-[10px] text-[1rem] font-semibold text-[rgba(31,42,55,0.92)] transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ease-[var(--ease)] hover:-translate-y-px hover:bg-[rgba(31,42,55,0.08)] active:translate-y-[1px] focus-visible:outline focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:opacity-55">
          <Icon name="lucide:arrow-left" class="mr-2" /> Back
        </button>
      </form>

      <p v-if="errorMessage" class="text-[0.95rem] font-semibold text-red-700 mt-3" role="alert">
        {{ errorMessage }}
      </p>

      <div class="mt-6 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <p class="text-[0.85rem] text-blue-900">
          <strong>Student Email Format:</strong> Must end with <code
            class="bg-blue-100 px-1 rounded">@students.nido.cl</code>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { authClient } from "~~/lib/auth-client";

// Check if already logged in as student
const session = authClient.useSession();
if (session.value?.data?.user) {
  const email = (session.value.data.user.email || "").toLowerCase();
  if (email.endsWith("@students.nido.cl")) {
    await navigateTo("/student");
  }
}

const isSignUp = ref(false);
const isLoading = ref(false);
const errorMessage = ref("");

const form = ref({
  email: "",
  password: "",
});

const toggleForm = () => {
  isSignUp.value = !isSignUp.value;
  errorMessage.value = "";
};

const handleSubmit = async () => {
  errorMessage.value = "";

  // Validate email format
  if (!form.value.email.endsWith("@students.nido.cl")) {
    errorMessage.value = "Email must end with @students.nido.cl";
    return;
  }

  // Validate password length
  if (form.value.password.length < 8) {
    errorMessage.value = "Password must be at least 8 characters";
    return;
  }

  isLoading.value = true;

  try {
    if (isSignUp.value) {
      // Sign up
      const response = await authClient.signUp.email({
        email: form.value.email,
        password: form.value.password,
      });

      if (response.error) {
        errorMessage.value = response.error.message || "Sign up failed";
        return;
      }

      await navigateTo("/student");
    } else {
      // Sign in
      const response = await authClient.signIn.email({
        email: form.value.email,
        password: form.value.password,
      });

      if (response.error) {
        errorMessage.value = response.error.message || "Sign in failed";
        return;
      }

      await navigateTo("/student");
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    errorMessage.value = `Error: ${errMsg}`;
    // eslint-disable-next-line no-console
    console.error("Auth error:", errMsg, err);
  } finally {
    isLoading.value = false;
  }
};
</script>
