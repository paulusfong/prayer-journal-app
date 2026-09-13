import { Shell } from "@/components/shell";
import { getRequestDictionary } from "@/lib/i18n";

export default async function ExpiredInvitePage() {
  const { locale, dict } = await getRequestDictionary();
  return (
    <Shell dict={dict} locale={locale}>
      <section className="panel">
        <h1>{dict.expired.title}</h1>
        <p className="lede">{dict.expired.lede}</p>
      </section>
    </Shell>
  );
}
