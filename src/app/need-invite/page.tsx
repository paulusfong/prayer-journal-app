import { Shell } from "@/components/shell";
import { getApprovedMembership, getPendingMembership } from "@/lib/journal";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function NeedInvitePage() {
  const user = await requireUser();
  if (await getApprovedMembership(user.id)) redirect("/");
  if (await getPendingMembership(user.id)) redirect("/pending");
  return (
    <Shell user={user}>
      <section className="panel">
        <h1>Ask the owner for an invite</h1>
        <p className="lede">This journal is a closed circle. You need an invite link to join.</p>
      </section>
    </Shell>
  );
}
