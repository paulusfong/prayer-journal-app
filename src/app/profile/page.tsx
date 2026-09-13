import { saveProfile } from "@/app/actions";
import { Shell } from "@/components/shell";
import { getRequestDictionary } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await requireUser();
  const { locale, dict } = await getRequestDictionary();
  return (
    <Shell user={user} dict={dict} locale={locale}>
      <section className="panel">
        <h1>{dict.profile.title}</h1>
        <p className="lede">{dict.profile.lede}</p>
        <form action={saveProfile}>
          <label htmlFor="displayName">{dict.profile.displayName}</label>
          <input
            id="displayName"
            name="displayName"
            defaultValue={user.displayName ?? user.name ?? ""}
            maxLength={80}
          />
          <p>
            <button type="submit">{dict.profile.save}</button>
          </p>
        </form>
      </section>
    </Shell>
  );
}
