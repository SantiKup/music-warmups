// Whitelist of authorized teacher email addresses
export const AUTHORIZED_TEACHER_EMAILS = [
  "jgibbs@nido.cl",
  "fanhongmeng.zhai@students.nido.cl",
];

export function isAuthorizedTeacher(email: string): boolean {
  return AUTHORIZED_TEACHER_EMAILS.includes(email.toLowerCase());
}
