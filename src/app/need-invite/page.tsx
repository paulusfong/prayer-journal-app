import { Shell } from "@/components/shell";
import { getRequestDictionary } from "@/lib/i18n";
import { getApprovedMembership, getPendingMembership } from "@/lib/journal";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function NeedInvitePage() {
  const user = await requireUser();
  if (await getApprovedMembership(user.id)) redirect("/");
  if (await getPendingMembership(user.id)) redirect("/pending");
  const { locale, dict } = await getRequestDictionary();
  return (
    <Shell user={user} dict={dict} locale={locale}>
      <section className="panel">
        <h1>{dict.needInvite.title}</h1>
        <p className="lede">{dict.needInvite.lede}</p>
      </section>
    </Shell>
  );
}
