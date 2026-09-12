import { submitAppFeedback } from "@/app/actions";
import { Shell } from "@/components/shell";
import { listAppFeedback } from "@/lib/feedback";
import { displayLabel } from "@/lib/ids";
import { requireApproved } from "@/lib/session";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { user, membership } = await requireApproved();
  const { sent } = await searchParams;
  const isOwner = membership.role === "owner";
  const items = isOwner ? await listAppFeedback(user.id) : [];

  return (
    <Shell user={user} isOwner={isOwner} approved>
      <section className="panel">
        <h1>About this app</h1>
        <p className="lede">A feature idea or a short comment. The circle owner can read it.</p>
        {sent ? <p className="flash">Thanks — it was saved.</p> : null}
        <form action={submitAppFeedback}>
          <fieldset>
            <legend>What is this</legend>
            <label className="choice">
              <input type="radio" name="kind" value="comment" defaultChecked /> Comment
            </label>
            <label className="choice">
              <input type="radio" name="kind" value="feature" /> Feature request
            </label>
          </fieldset>
          <label htmlFor="body">Your note</label>
          <textarea id="body" name="body" rows={5} required maxLength={2000} />
          <p>
            <button type="submit">Send</button>
          </p>
        </form>
      </section>
      {isOwner ? (
        <section className="panel">
          <h2>Received</h2>
          {items.length === 0 ? (
            <p className="muted">Nothing yet.</p>
          ) : (
            <ul className="people">
              {items.map((row) => (
                <li key={row.id}>
                  <span>
                    <strong>{row.kind === "feature" ? "Feature" : "Comment"}</strong>
                    {" · "}
                    {displayLabel({
                      email: row.authorEmail,
                      name: null,
                      displayName: row.authorName,
                    })}
                    <br />
                    {row.body}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </Shell>
  );
}
