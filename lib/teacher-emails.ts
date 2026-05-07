// Whitelist of authorized teacher email addresses
export const AUTHORIZED_TEACHER_EMAILS = [
  "jgibbs@nido.cl",
  "zhaihongmeng@gmail.com",
  "saguayo@nido.cl",
];

export function isAuthorizedTeacher(email: string): boolean {
  return AUTHORIZED_TEACHER_EMAILS.includes(email.toLowerCase());
}
