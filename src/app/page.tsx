import Link from "next/link";
import { Shell } from "@/components/shell";
import { categoryLabel, listRequests } from "@/lib/journal";
import { displayLabel } from "@/lib/ids";
import { requireApproved } from "@/lib/session";

export default async function HomePage() {
  const { user, membership } = await requireApproved();
  const rows = await listRequests(user.id, membership.circleId, "open");

  return (
    <Shell user={user} isOwner={membership.role === "owner"} approved>
      <div className="list-head">
        <h1>Open requests</h1>
        <Link href="/requests/new" className="btn" title="Click to log a new prayer request">
          Log a request
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="empty">No open requests — add one.</p>
      ) : (
        <ul className="request-list">
          {rows.map(({ request, author }) => (
            <li key={request.id} className="request-card">
              <Link href={`/requests/${request.id}`}>
                <h2>{request.title}</h2>
                <p className="meta">
                  {request.visibility === "private" ? "Private · " : null}
                  {displayLabel(author)}
                  {request.whoFor ? ` · for ${request.whoFor}` : null}
                  {categoryLabel(request.category, request.categoryOther)
                    ? ` · ${categoryLabel(request.category, request.categoryOther)}`
                    : null}
                  {request.hopeBy ? ` · ${request.hopeBy}` : null}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
