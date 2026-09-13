import Link from "next/link";
import { Shell } from "@/components/shell";
import { displayLabel } from "@/lib/ids";
import { getRequestDictionary, localizedCategoryLabel, t } from "@/lib/i18n";
import { listRequests } from "@/lib/journal";
import { requireApproved } from "@/lib/session";

export default async function AnsweredPage() {
  const { user, membership } = await requireApproved();
  const { locale, dict } = await getRequestDictionary();
  const rows = await listRequests(user.id, membership.circleId, "answered");

  return (
    <Shell user={user} isOwner={membership.role === "owner"} approved dict={dict} locale={locale}>
      <h1>{dict.answered.title}</h1>
      {rows.length === 0 ? (
        <p className="empty">{dict.answered.empty}</p>
      ) : (
        <ul className="request-list">
          {rows.map(({ request, author }) => (
            <li key={request.id} className="request-card">
              <Link href={`/requests/${request.id}`}>
                <h2>{request.title}</h2>
                <p className="meta">
                  {displayLabel(author)}
                  {request.answeredAt
                    ? ` · ${t(dict, "answered.answeredOn", { date: request.answeredAt.toISOString().slice(0, 10) })}`
                    : null}
                  {localizedCategoryLabel(dict, request.category, request.categoryOther)
                    ? ` · ${localizedCategoryLabel(dict, request.category, request.categoryOther)}`
                    : null}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
