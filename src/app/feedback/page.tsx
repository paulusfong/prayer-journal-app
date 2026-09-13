import { submitAppFeedback } from "@/app/actions";
import { Shell } from "@/components/shell";
import { listAppFeedback } from "@/lib/feedback";
import { displayLabel } from "@/lib/ids";
import { getRequestDictionary } from "@/lib/i18n";
import { requireApproved } from "@/lib/session";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { user, membership } = await requireApproved();
  const { locale, dict } = await getRequestDictionary();
  const { sent } = await searchParams;
  const isOwner = membership.role === "owner";
  const items = isOwner ? await listAppFeedback(user.id) : [];
  const f = dict.feedback;

  return (
    <Shell user={user} isOwner={isOwner} approved dict={dict} locale={locale}>
      <section className="panel">
        <h1>{f.title}</h1>
        <p className="lede">{f.lede}</p>
        {sent ? <p className="flash">{f.thanks}</p> : null}
        <form action={submitAppFeedback}>
          <fieldset>
            <legend>{f.kindLegend}</legend>
            <label className="choice">
              <input type="radio" name="kind" value="comment" defaultChecked /> {f.kindComment}
            </label>
            <label className="choice">
              <input type="radio" name="kind" value="feature" /> {f.kindFeature}
            </label>
          </fieldset>
          <label htmlFor="body">{f.bodyLabel}</label>
          <textarea id="body" name="body" rows={5} required maxLength={2000} />
          <p>
            <button type="submit">{f.submit}</button>
          </p>
        </form>
      </section>
      {isOwner ? (
        <section className="panel">
          <h2>{f.received}</h2>
          {items.length === 0 ? (
            <p className="muted">{f.empty}</p>
          ) : (
            <ul className="people">
              {items.map((row) => (
                <li key={row.id}>
                  <span>
                    <strong>{row.kind === "feature" ? f.kindFeatureShort : f.kindCommentShort}</strong>
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
