import Link from "next/link";
import { Shell } from "@/components/shell";
import { categoryLabel, listRequests } from "@/lib/journal";
import { displayLabel } from "@/lib/ids";
import { requireApproved } from "@/lib/session";

export default async function AnsweredPage() {
  const { user, membership } = await requireApproved();
  const rows = await listRequests(user.id, membership.circleId, "answered");

  return (
    <Shell user={user} isOwner={membership.role === "owner"} approved>
      <h1>Answered</h1>
      {rows.length === 0 ? (
        <p className="empty">Nothing marked answered yet.</p>
      ) : (
        <ul className="request-list">
          {rows.map(({ request, author }) => (
            <li key={request.id} className="request-card">
              <Link href={`/requests/${request.id}`}>
                <h2>{request.title}</h2>
                <p className="meta">
                  {displayLabel(author)}
                  {request.answeredAt
                    ? ` · answered ${request.answeredAt.toISOString().slice(0, 10)}`
                    : null}
                  {categoryLabel(request.category, request.categoryOther)
                    ? ` · ${categoryLabel(request.category, request.categoryOther)}`
                    : null}
                </p>
              </Link>
              {request.authorId === user.id ? (
                <p className="card-actions">
                  <Link href={`/requests/${request.id}/edit`}>Edit</Link>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
