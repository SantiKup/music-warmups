import { createAuthClient } from "better-auth/vue";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
});
export const { signIn, signOut, useSession } = authClient;
