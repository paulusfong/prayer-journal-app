import { Shell } from "@/components/shell";
import { getSessionUser } from "@/lib/session";

export default async function PrivacyPage() {
  const user = await getSessionUser();
  return (
    <Shell user={user ?? undefined}>
      <article className="panel">
        <h1>Privacy</h1>
        <p>
          Prayer Journal stores your email address, the name you choose, the prayer requests, updates, and notes you
          write, and any app comments or feature ideas you send.
        </p>
        <p>
          We do not sell this. We do not use analytics that phone home. Mail we send uses the request title and a
          link — not the prayer body.
        </p>
        <p>Ask the circle owner, or whoever runs this instance, to delete your account if you want out.</p>
      </article>
    </Shell>
  );
}
