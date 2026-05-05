import { authClient } from "~~/lib/auth-client";

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch);
  const user = session.value?.user;

  if (!user) {
    return navigateTo("/student/login");
  }

  // Ensure the user is a student (email ends with @students.nido.cl)
  const email = (user.email || "").toLowerCase();
  if (!email.endsWith("@students.nido.cl")) {
    return navigateTo("/teacher/login");
  }
});
