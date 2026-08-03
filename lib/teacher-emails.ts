// Whitelist of authorized teacher email addresses
export const AUTHORIZED_TEACHER_EMAILS = [
  "zhaihongmeng@gmail.com",
  "charles.gibbs@students.nido.cl",
  "jgibbs020177@gmail.com"
];

export function isAuthorizedTeacher(email: string): boolean {
  return (
    AUTHORIZED_TEACHER_EMAILS.includes(email.toLowerCase()) ||
    email.toLowerCase().endsWith("@nido.cl")
  );
}
