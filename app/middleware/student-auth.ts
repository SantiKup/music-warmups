import { authClient } from "~~/lib/auth-client";
import { isAuthorizedTeacher } from "~~/lib/teacher-emails";

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch);
  const user = session.value?.user;

  if (!user) {
    return navigateTo("/");
  }

  // Allow both students and authorized teachers to access student views
  const email = (user.email || "").toLowerCase();
  const isStudent = email.endsWith("@students.nido.cl");
  const isTeacher = isAuthorizedTeacher(email);

  if (!isStudent && !isTeacher) {
    // If not a student or authorized teacher, redirect to student login
    return navigateTo("/");
  }
});
