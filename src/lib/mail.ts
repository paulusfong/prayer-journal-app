import fs from "node:fs";
import path from "node:path";

const FROM = process.env.MAIL_FROM ?? "Prayer Journal <prayer@localhost>";

function isProductionMailEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === "production" || env.VERCEL === "1";
}

/**
 * Send outbound email. Fail-closed in production/Vercel without RESEND_API_KEY.
 * File sink is development-only (never in production, never under Vercel).
 */
export async function sendMail(
  to: string,
  subject: string,
  text: string,
  env: NodeJS.ProcessEnv = process.env,
) {
  const key = env.RESEND_API_KEY;
  if (key) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, text }),
    });
    if (!res.ok) {
      // Do not log email body (may contain magic-link URLs).
      console.error("Resend failed", res.status);
    }
    return;
  }

  if (isProductionMailEnv(env)) {
    throw new Error("RESEND_API_KEY is required in production");
  }

  // File sink only in local development — not test/CI/staging without Resend.
  if (env.NODE_ENV !== "development") {
    return;
  }

  const dir = path.join(process.cwd(), "tmp", "mails");
  fs.mkdirSync(dir, { recursive: true });
  const body = `From: ${FROM}\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`;
  fs.appendFileSync(path.join(dir, to), `${body}\n---\n`);
}
