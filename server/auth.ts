import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { AUTHORIZED_TEACHER_EMAILS } from "~~/lib/teacher-emails";

const baseURL = process.env.BETTER_AUTH_URL;

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  baseURL: baseURL ?? {
    allowedHosts: ["localhost:*", "127.0.0.1:*"],
    fallback: "http://localhost:3000",
  },
  emailAndPassword: {
    enabled: true,
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

  // Intercept user creation during OAuth callback and validate authorized teachers.
  databaseHooks: {
    user: {
      create: {
        before: async (user: any, ctx: any) => {
          const email = (user.email || "").toLowerCase();

          // Only run this check for OAuth callback paths (Google sign-in)
          if (
            ctx.path === "/callback/:id" ||
            (ctx.path && ctx.path.startsWith("/callback"))
          ) {
            // For Google OAuth, only allow authorized teacher emails
            if (!AUTHORIZED_TEACHER_EMAILS.includes(email)) {
              throw new Error("email_not_allowed");
            }
          }

          // For email/password registration (students), validate @students.nido.cl
          if (ctx.path === "/sign-up/email" || ctx.path?.includes("/sign-up")) {
            if (!email.endsWith("@students.nido.cl")) {
              throw new Error("invalid_student_email");
            }
          }

          return { data: user };
        },
      },
    },
  },
});
