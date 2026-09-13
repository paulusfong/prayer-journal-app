import Link from "next/link";
import { Shell } from "@/components/shell";
import { displayLabel } from "@/lib/ids";
import { getRequestDictionary, localizedCategoryLabel } from "@/lib/i18n";
import { listRequests } from "@/lib/journal";
import { requestLoggedDate } from "@/lib/request-fields";
import { requireApproved } from "@/lib/session";

export default async function HomePage() {
  const { user, membership } = await requireApproved();
  const { locale, dict } = await getRequestDictionary();
  const rows = await listRequests(user.id, membership.circleId, "open");

  return (
    <Shell user={user} isOwner={membership.role === "owner"} approved dict={dict} locale={locale}>
      <div className="list-head">
        <h1>{dict.home.title}</h1>
        <Link href="/requests/new" className="btn" title={dict.home.logRequestTitle}>
          {dict.home.logRequest}
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="empty">{dict.home.empty}</p>
      ) : (
        <ul className="request-list">
          {rows.map(({ request, author }) => (
            <li key={request.id} className="request-card">
              <Link href={`/requests/${request.id}`}>
                <h2>{request.title}</h2>
                <p className="meta">
                  {request.visibility === "private" ? `${dict.home.private} · ` : null}
                  {displayLabel(author)}
                  {localizedCategoryLabel(dict, request.category, request.categoryOther)
                    ? ` · ${localizedCategoryLabel(dict, request.category, request.categoryOther)}`
                    : null}
                  {` · ${requestLoggedDate(request.createdAt)}`}
                </p>
              </Link>
              {request.authorId === user.id ? (
                <p className="card-actions">
                  <Link href={`/requests/${request.id}/edit`}>{dict.home.edit}</Link>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
