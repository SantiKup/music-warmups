import { auth } from "~~/server/auth";
import { toWebRequest } from "h3";

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event));
});
