import { Shell } from "@/components/shell";
import { getRequestDictionary } from "@/lib/i18n";
import { getPendingMembership } from "@/lib/journal";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function PendingPage() {
  const user = await requireUser();
  if (!(await getPendingMembership(user.id))) redirect("/");
  const { locale, dict } = await getRequestDictionary();
  return (
    <Shell user={user} dict={dict} locale={locale}>
      <section className="panel">
        <h1>{dict.pending.title}</h1>
        <p className="lede">{dict.pending.lede}</p>
      </section>
    </Shell>
  );
}
