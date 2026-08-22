import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./schema";
import { sendMail } from "./mail";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-only-change-me-in-production-32b",
  baseURL,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  user: {
    additionalFields: {
      displayName: { type: "string", required: false, input: true },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    window: 60,
    max: 10,
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 30,
      storeToken: "hashed",
      disableSignUp: false,
      sendMagicLink: async ({ email, token }) => {
        const confirm = new URL("/sign-in/confirm", baseURL);
        confirm.searchParams.set("token", token);
        await sendMail(
          email,
          "Sign in to Prayer Journal",
          `Sign in to Prayer Journal:\n\n${confirm.toString()}\n\nThis link expires in 30 minutes. If you did not request it, ignore this email.`,
        );
      },
    }),
    nextCookies(),
  ],
});
