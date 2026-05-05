import { authClient } from "~~/lib/auth-client";
import { isAuthorizedTeacher } from "~~/lib/teacher-emails";

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch);
  const user = session.value?.user;

  if (!user) {
    return navigateTo("/");
  }

  // Ensure the user is either a student or authorized teacher
  const email = (user.email || "").toLowerCase();
  const isStudent = email.endsWith("@students.nido.cl");
  const isTeacher = isAuthorizedTeacher(email);

  if (!isStudent && !isTeacher) {
    return navigateTo("/");
  }
});
