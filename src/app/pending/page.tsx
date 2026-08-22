import { Shell } from "@/components/shell";
import { getPendingMembership } from "@/lib/journal";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function PendingPage() {
  const user = await requireUser();
  if (!(await getPendingMembership(user.id))) redirect("/");
  return (
    <Shell user={user}>
      <section className="panel">
        <h1>Waiting for approval</h1>
        <p className="lede">The circle owner has your request. You’ll see the journal once they approve you.</p>
      </section>
    </Shell>
  );
}
