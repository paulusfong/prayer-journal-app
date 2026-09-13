import { Shell } from "@/components/shell";
import { getRequestDictionary } from "@/lib/i18n";
import { getSessionUser } from "@/lib/session";

export default async function PrivacyPage() {
  const user = await getSessionUser();
  const { locale, dict } = await getRequestDictionary();
  return (
    <Shell user={user ?? undefined} dict={dict} locale={locale}>
      <article className="panel">
        <h1>{dict.privacy.title}</h1>
        <p>{dict.privacy.p1}</p>
        <p>{dict.privacy.p2}</p>
        <p>{dict.privacy.p3}</p>
      </article>
    </Shell>
  );
}
