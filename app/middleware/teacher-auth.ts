import { authClient } from "~~/lib/auth-client";
import { isAuthorizedTeacher } from "~~/lib/teacher-emails";

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch);
  const user = session.value?.user;

  if (!user) {
    return navigateTo("/");
  }

  // Ensure the user is an authorized teacher
  const email = (user.email || "").toLowerCase();
  if (!isAuthorizedTeacher(email)) {
    return navigateTo("/");
  }
});
