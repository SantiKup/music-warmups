import { betterAuth } from "better-auth";
import { Pool } from "pg";

const baseURL = process.env.BETTER_AUTH_URL;

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  baseURL: baseURL ?? {
    allowedHosts: ["localhost:*", "127.0.0.1:*"],
    fallback: "http://localhost:3000",
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: (profile: any) => ({
        email: profile.email,
      }),
    },
  },

  // Intercept user creation during OAuth callback and reject anyone
  // whose email is not the allowed teacher email.
  databaseHooks: {
    user: {
      create: {
        before: async (user: any, ctx: any) => {
          // Only run this check for OAuth callback paths
          if (
            ctx.path === "/callback/:id" ||
            (ctx.path && ctx.path.startsWith("/callback"))
          ) {
            const email = (user.email || "").toLowerCase();
            if (
              email !== "jgibbs@nido.cl" &&
              email !== "fanhongmeng.zhai@students.nido.cl"
            ) {
              // Throwing an error will abort the flow and Better Auth will
              // use the OAuth state's `errorURL` (if provided) to redirect.
              throw new Error("email_not_allowed");
            }
          }

          return { data: user };
        },
      },
    },
  },
});
