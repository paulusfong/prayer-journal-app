import { notFound } from "next/navigation";
import { updatePrayerRequest } from "@/app/actions";
import { Shell } from "@/components/shell";
import { VisibilityFields } from "@/components/visibility-fields";
import { displayLabel } from "@/lib/ids";
import { getRequestDictionary } from "@/lib/i18n";
import { getVisibleRequest, listCirclePeople, listRequestGrantUserIds } from "@/lib/journal";
import { CATEGORIES } from "@/lib/schema";
import { requireApproved } from "@/lib/session";

export default async function EditRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, membership } = await requireApproved();
  const { locale, dict } = await getRequestDictionary();
  const found = await getVisibleRequest(user.id, membership.circleId, id);
  if (!found || found.request.authorId !== user.id) notFound();
  const r = found.request;
  const people = (await listCirclePeople(membership.circleId))
    .filter((p) => p.membership.status === "approved" && p.person.id !== user.id)
    .map((p) => ({ id: p.person.id, label: displayLabel(p.person) }));
  const grantedUserIds = await listRequestGrantUserIds(r.id);

  return (
    <Shell user={user} isOwner={membership.role === "owner"} approved dict={dict} locale={locale}>
      <section className="panel">
        <h1>{dict.requestForm.editTitle}</h1>
        <form action={updatePrayerRequest.bind(null, r.id)}>
          <label htmlFor="title">{dict.requestForm.title}</label>
          <input id="title" name="title" required maxLength={120} defaultValue={r.title} />

          <label htmlFor="body">{dict.requestForm.body}</label>
          <textarea id="body" name="body" rows={5} maxLength={2000} defaultValue={r.body ?? ""} />

          <label htmlFor="category">{dict.requestForm.category}</label>
          <select id="category" name="category" defaultValue={r.category ?? ""}>
            <option value="">{dict.requestForm.categoryNone}</option>
            {Object.keys(CATEGORIES).map((k) => (
              <option key={k} value={k}>
                {dict.categories[k as keyof typeof dict.categories]}
              </option>
            ))}
          </select>

          <label htmlFor="categoryOther">{dict.requestForm.categoryOther}</label>
          <input id="categoryOther" name="categoryOther" maxLength={80} defaultValue={r.categoryOther ?? ""} />

          <VisibilityFields dict={dict} people={people} defaultVisibility={r.visibility} grantedUserIds={grantedUserIds} />

          <button type="submit">{dict.requestForm.submitEdit}</button>
        </form>
      </section>
    </Shell>
  );
}
