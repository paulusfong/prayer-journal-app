import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";
import { sendMail } from "./mail";

const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
});

describe("sendMail", () => {
  it("throws in production when RESEND_API_KEY is missing", async () => {
    await assert.rejects(
      () => sendMail("a@b.co", "s", "body", { NODE_ENV: "production" }),
      /RESEND_API_KEY is required in production/,
    );
  });

  it("throws when VERCEL=1 and RESEND_API_KEY is missing", async () => {
    await assert.rejects(
      () => sendMail("a@b.co", "s", "body", { VERCEL: "1", NODE_ENV: "test" }),
      /RESEND_API_KEY is required in production/,
    );
  });

  it("writes the file sink only in development", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pj-mail-"));
    process.chdir(dir);
    await sendMail("dev@example.com", "Hello", "link-secret", { NODE_ENV: "development" });
    const out = path.join(dir, "tmp", "mails", "dev@example.com");
    assert.ok(fs.existsSync(out));
    assert.match(fs.readFileSync(out, "utf8"), /link-secret/);
  });

  it("does not write the file sink outside development without a key", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pj-mail-"));
    process.chdir(dir);
    await sendMail("test@example.com", "Hello", "no-file", { NODE_ENV: "test" });
    assert.equal(fs.existsSync(path.join(dir, "tmp", "mails")), false);
  });
});
