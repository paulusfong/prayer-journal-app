import { createPrayerRequest } from "@/app/actions";
import { Shell } from "@/components/shell";
import { VisibilityFields } from "@/components/visibility-fields";
import { displayLabel } from "@/lib/ids";
import { getRequestDictionary } from "@/lib/i18n";
import { listCirclePeople } from "@/lib/journal";
import { CATEGORIES } from "@/lib/schema";
import { requireApproved } from "@/lib/session";

export default async function NewRequestPage() {
  const { user, membership } = await requireApproved();
  const { locale, dict } = await getRequestDictionary();
  const people = (await listCirclePeople(membership.circleId))
    .filter((p) => p.membership.status === "approved" && p.person.id !== user.id)
    .map((p) => ({ id: p.person.id, label: displayLabel(p.person) }));
  return (
    <Shell user={user} isOwner={membership.role === "owner"} approved dict={dict} locale={locale}>
      <section className="panel">
        <h1>{dict.requestForm.newTitle}</h1>
        <form action={createPrayerRequest}>
          <label htmlFor="title">{dict.requestForm.title}</label>
          <input id="title" name="title" required maxLength={120} />

          <label htmlFor="body">{dict.requestForm.body}</label>
          <textarea id="body" name="body" rows={5} maxLength={2000} />

          <label htmlFor="category">{dict.requestForm.category}</label>
          <select id="category" name="category" defaultValue="">
            <option value="">{dict.requestForm.categoryNone}</option>
            {Object.keys(CATEGORIES).map((k) => (
              <option key={k} value={k}>
                {dict.categories[k as keyof typeof dict.categories]}
              </option>
            ))}
          </select>

          <label htmlFor="categoryOther">{dict.requestForm.categoryOther}</label>
          <input id="categoryOther" name="categoryOther" maxLength={80} />

          <VisibilityFields dict={dict} people={people} defaultVisibility="circle" />

          <button type="submit">{dict.requestForm.submitNew}</button>
        </form>
      </section>
    </Shell>
  );
}
