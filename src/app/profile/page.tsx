import { saveProfile } from "@/app/actions";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <Shell user={user}>
      <section className="panel">
        <h1>What should we call you?</h1>
        <p className="lede">Shown next to “I prayed” and notes. Email stays private.</p>
        <form action={saveProfile}>
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            name="displayName"
            defaultValue={user.displayName ?? user.name ?? ""}
            maxLength={80}
          />
          <p>
            <button type="submit">Save</button>
          </p>
        </form>
      </section>
    </Shell>
  );
}
