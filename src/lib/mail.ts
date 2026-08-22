import fs from "node:fs";
import path from "node:path";

const FROM = process.env.MAIL_FROM ?? "Prayer Journal <prayer@localhost>";

export async function sendMail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
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
      console.error("Resend failed", await res.text());
    }
    return;
  }

  const dir = path.join(process.cwd(), "tmp", "mails");
  fs.mkdirSync(dir, { recursive: true });
  const body = `From: ${FROM}\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`;
  fs.appendFileSync(path.join(dir, to), `${body}\n---\n`);
}
