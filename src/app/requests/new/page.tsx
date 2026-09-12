import { createPrayerRequest } from "@/app/actions";
import { Shell } from "@/components/shell";
import { CATEGORIES } from "@/lib/schema";
import { requireApproved } from "@/lib/session";

export default async function NewRequestPage() {
  const { user, membership } = await requireApproved();
  return (
    <Shell user={user} isOwner={membership.role === "owner"} approved>
      <section className="panel">
        <h1>Log a request</h1>
        <form action={createPrayerRequest}>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" required maxLength={120} />

          <label htmlFor="body">The ask (optional)</label>
          <textarea id="body" name="body" rows={5} maxLength={2000} />

          <label htmlFor="category">Category (optional)</label>
          <select id="category" name="category" defaultValue="">
            <option value="">None</option>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          <label htmlFor="categoryOther">If other, say what</label>
          <input id="categoryOther" name="categoryOther" maxLength={80} />

          <fieldset>
            <legend>Who can see this</legend>
            <label className="choice">
              <input type="radio" name="visibility" value="circle" defaultChecked /> Whole circle
            </label>
            <label className="choice">
              <input type="radio" name="visibility" value="private" /> Only me
            </label>
          </fieldset>

          <button type="submit">Log request</button>
        </form>
      </section>
    </Shell>
  );
}
