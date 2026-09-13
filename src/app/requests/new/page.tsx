import { createPrayerRequest } from "@/app/actions";
import { Shell } from "@/components/shell";
import { getRequestDictionary } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/schema";
import { requireApproved } from "@/lib/session";

export default async function NewRequestPage() {
  const { user, membership } = await requireApproved();
  const { locale, dict } = await getRequestDictionary();
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

          <fieldset>
            <legend>{dict.requestForm.visibilityLegend}</legend>
            <label className="choice">
              <input type="radio" name="visibility" value="circle" defaultChecked /> {dict.requestForm.visibilityCircle}
            </label>
            <label className="choice">
              <input type="radio" name="visibility" value="private" /> {dict.requestForm.visibilityPrivate}
            </label>
          </fieldset>

          <button type="submit">{dict.requestForm.submitNew}</button>
        </form>
      </section>
    </Shell>
  );
}
