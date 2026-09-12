import { notFound } from "next/navigation";
import { updatePrayerRequest } from "@/app/actions";
import { Shell } from "@/components/shell";
import { CATEGORIES } from "@/lib/schema";
import { getVisibleRequest } from "@/lib/journal";
import { requireApproved } from "@/lib/session";

export default async function EditRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, membership } = await requireApproved();
  const found = await getVisibleRequest(user.id, membership.circleId, id);
  if (!found || found.request.authorId !== user.id) notFound();
  const r = found.request;

  return (
    <Shell user={user} isOwner={membership.role === "owner"} approved>
      <section className="panel">
        <h1>Edit request</h1>
        <form action={updatePrayerRequest.bind(null, r.id)}>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" required maxLength={120} defaultValue={r.title} />

          <label htmlFor="body">The ask (optional)</label>
          <textarea id="body" name="body" rows={5} maxLength={2000} defaultValue={r.body ?? ""} />

          <label htmlFor="category">Category (optional)</label>
          <select id="category" name="category" defaultValue={r.category ?? ""}>
            <option value="">None</option>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          <label htmlFor="categoryOther">If other, say what</label>
          <input id="categoryOther" name="categoryOther" maxLength={80} defaultValue={r.categoryOther ?? ""} />

          <fieldset>
            <legend>Who can see this</legend>
            <label className="choice">
              <input type="radio" name="visibility" value="circle" defaultChecked={r.visibility === "circle"} /> Whole
              circle
            </label>
            <label className="choice">
              <input type="radio" name="visibility" value="private" defaultChecked={r.visibility === "private"} /> Only
              me
            </label>
          </fieldset>

          <button type="submit">Save</button>
        </form>
      </section>
    </Shell>
  );
}
