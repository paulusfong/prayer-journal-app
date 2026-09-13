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
import { getRequestDictionary, localizedCategoryLabel, t } from "@/lib/i18n";
import { requestDetail } from "@/lib/journal";
import { requestLoggedDate } from "@/lib/request-fields";
import { requireApproved } from "@/lib/session";

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, membership } = await requireApproved();
  const { locale, dict } = await getRequestDictionary();
  const detail = await requestDetail(user.id, membership.circleId, id);
  if (!detail) notFound();

  const { request, author, marks, notes, updates } = detail;
  const mine = request.authorId === user.id;
  const prayed = marks.some((m) => m.mark.userId === user.id);
  const open = request.status === "open";
  const category = localizedCategoryLabel(dict, request.category, request.categoryOther);
  const prayedLabel =
    marks.length === 1
      ? t(dict, "request.personPrayed", { count: marks.length })
      : t(dict, "request.peoplePrayed", { count: marks.length });

  return (
    <Shell user={user} isOwner={membership.role === "owner"} approved dict={dict} locale={locale}>
      <article>
        <p className="eyebrow">
          {request.visibility === "private" ? `${dict.request.private} · ` : null}
          {request.status === "answered" ? `${dict.request.answered} · ` : null}
          {displayLabel(author)}
          {category ? ` · ${category}` : null}
          {` · ${requestLoggedDate(request.createdAt)}`}
        </p>
        <h1>{request.title}</h1>
        {request.body ? <div className="body">{request.body}</div> : null}
        <p className="prayed">
          {prayedLabel}
          {marks.length ? ` · ${marks.map((m) => displayLabel(m.person)).join(", ")}` : null}
        </p>
        <div className="actions">
          {open ? (
            <>
              <form action={prayed ? unpray.bind(null, request.id) : pray.bind(null, request.id)}>
                <button type="submit">{prayed ? dict.request.iPrayedUndo : dict.request.iPrayed}</button>
              </form>
              <form action={markAnswered.bind(null, request.id)}>
                <button type="submit">{dict.request.markAnswered}</button>
              </form>
            </>
          ) : (
            <form action={reopen.bind(null, request.id)}>
              <button type="submit">{dict.request.reopen}</button>
            </form>
          )}
          {mine ? (
            <>
              <Link href={`/requests/${request.id}/edit`}>{dict.request.edit}</Link>
              <form action={removePrayerRequest.bind(null, request.id)}>
                <button type="submit" className="text-btn danger">
                  {dict.request.delete}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </article>

      <section className="panel">
        <h2>{dict.request.updates}</h2>
        {updates.length === 0 ? (
          <p className="muted">{dict.request.noUpdates}</p>
        ) : (
          <ol className="timeline">
            {updates.map(({ update, person }) => (
              <li key={update.id}>
                <time>{update.createdAt.toISOString().slice(0, 10)}</time>
                <div>{update.body}</div>
                {person.id === user.id ? (
                  <form action={removeUpdate.bind(null, request.id, update.id)}>
                    <button type="submit" className="text-btn">
                      {dict.request.remove}
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ol>
        )}
        {mine ? (
          <form action={postUpdate.bind(null, request.id)}>
            <label htmlFor="update">{dict.request.addUpdateLabel}</label>
            <textarea id="update" name="body" rows={3} maxLength={2000} required />
            <p>
              <button type="submit">{dict.request.addUpdate}</button>
            </p>
          </form>
        ) : null}
      </section>

      <section className="panel">
        <h2>{dict.request.notes}</h2>
        {notes.length === 0 ? (
          <p className="muted">{dict.request.noNotes}</p>
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
                      {dict.request.remove}
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {open ? (
          <form action={postNote.bind(null, request.id)}>
            <label htmlFor="note">{dict.request.addNoteLabel}</label>
            <textarea id="note" name="body" rows={2} maxLength={280} required />
            <p>
              <button type="submit">{dict.request.addNote}</button>
            </p>
          </form>
        ) : null}
      </section>
    </Shell>
  );
}
