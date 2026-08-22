import Link from "next/link";
import { notFound } from "next/navigation";
import {
  markAnswered,
  postNote,
  postUpdate,
  pray,
  removeNote,
  removePrayerRequest,
  removeUpdate,
  reopen,
  unpray,
} from "@/app/actions";
import { Shell } from "@/components/shell";
import { displayLabel } from "@/lib/ids";
import { categoryLabel, requestDetail } from "@/lib/journal";
import { requireApproved } from "@/lib/session";

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, membership } = await requireApproved();
  const detail = await requestDetail(user.id, membership.circleId, id);
  if (!detail) notFound();

  const { request, author, marks, notes, updates } = detail;
  const mine = request.authorId === user.id;
  const prayed = marks.some((m) => m.mark.userId === user.id);
  const open = request.status === "open";

  return (
    <Shell user={user} isOwner={membership.role === "owner"} approved>
      <article>
        <p className="eyebrow">
          {request.visibility === "private" ? "Private · " : null}
          {request.status === "answered" ? "Answered · " : null}
          {displayLabel(author)}
          {request.whoFor ? ` · for ${request.whoFor}` : null}
          {categoryLabel(request.category, request.categoryOther)
            ? ` · ${categoryLabel(request.category, request.categoryOther)}`
            : null}
          {request.hopeBy ? ` · ${request.hopeBy}` : null}
        </p>
        <h1>{request.title}</h1>
        {request.body ? <div className="body">{request.body}</div> : null}
        <p className="prayed">
          {marks.length} {marks.length === 1 ? "person" : "people"} prayed
          {marks.length ? ` · ${marks.map((m) => displayLabel(m.person)).join(", ")}` : null}
        </p>
        <div className="actions">
          {open ? (
            <>
              <form action={prayed ? unpray.bind(null, request.id) : pray.bind(null, request.id)}>
                <button type="submit">{prayed ? "I prayed — undo" : "I prayed"}</button>
              </form>
              <form action={markAnswered.bind(null, request.id)}>
                <button type="submit">Mark answered</button>
              </form>
            </>
          ) : (
            <form action={reopen.bind(null, request.id)}>
              <button type="submit">Reopen</button>
            </form>
          )}
          {mine ? (
            <>
              <Link href={`/requests/${request.id}/edit`}>Edit</Link>
              <form action={removePrayerRequest.bind(null, request.id)}>
                <button type="submit" className="text-btn danger">
                  Delete
                </button>
              </form>
            </>
          ) : null}
        </div>
      </article>

      <section className="panel">
        <h2>Updates</h2>
        {updates.length === 0 ? (
          <p className="muted">No updates yet.</p>
        ) : (
          <ol className="timeline">
            {updates.map(({ update, person }) => (
              <li key={update.id}>
                <time>{update.createdAt.toISOString().slice(0, 10)}</time>
                <div>{update.body}</div>
                {person.id === user.id ? (
                  <form action={removeUpdate.bind(null, request.id, update.id)}>
                    <button type="submit" className="text-btn">
                      Remove
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ol>
        )}
        {mine ? (
          <form action={postUpdate.bind(null, request.id)}>
            <label htmlFor="update">Add an update</label>
            <textarea id="update" name="body" rows={3} maxLength={2000} required />
            <p>
              <button type="submit">Add update</button>
            </p>
          </form>
        ) : null}
      </section>

      <section className="panel">
        <h2>Notes</h2>
        {notes.length === 0 ? (
          <p className="muted">No notes yet.</p>
        ) : (
          <ul className="notes">
            {notes.map(({ note, person }) => (
              <li key={note.id}>
                <strong>{displayLabel(person)}</strong>{" "}
                <span className="muted">{note.createdAt.toISOString().slice(0, 10)}</span>
                <p>{note.body}</p>
                {person.id === user.id ? (
                  <form action={removeNote.bind(null, request.id, note.id)}>
                    <button type="submit" className="text-btn">
                      Remove
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {open ? (
          <form action={postNote.bind(null, request.id)}>
            <label htmlFor="note">Leave a short note</label>
            <textarea id="note" name="body" rows={2} maxLength={280} required />
            <p>
              <button type="submit">Add note</button>
            </p>
          </form>
        ) : null}
      </section>
    </Shell>
  );
}
