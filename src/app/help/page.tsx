import { Shell } from "@/components/shell";
import { getApprovedMembership } from "@/lib/journal";
import { getRequestDictionary } from "@/lib/i18n";
import { getSessionUser } from "@/lib/session";

export default async function HelpPage() {
  const user = await getSessionUser();
  const membership = user ? await getApprovedMembership(user.id) : null;
  const { locale, dict } = await getRequestDictionary();
  const h = dict.help;

  return (
    <Shell
      user={user ?? undefined}
      approved={Boolean(membership)}
      isOwner={membership?.role === "owner"}
      dict={dict}
      locale={locale}
    >
      <article className="panel help">
        <h1>{h.title}</h1>
        <p className="lede">{h.intro}</p>

        <h2>{h.joinTitle}</h2>
        <p>{h.joinBody}</p>

        <h2>{h.signInTitle}</h2>
        <p>{h.signInBody}</p>

        <h2>{h.requestsTitle}</h2>
        <p>{h.requestsBody}</p>

        <h2>{h.prayTitle}</h2>
        <p>{h.prayBody}</p>

        <h2>{h.answeredTitle}</h2>
        <p>{h.answeredBody}</p>

        <h2>{h.circleTitle}</h2>
        <p>{h.circleBody}</p>

        <h2>{h.languageTitle}</h2>
        <p>{h.languageBody}</p>

        <h2>{h.feedbackTitle}</h2>
        <p>{h.feedbackBody}</p>
      </article>
    </Shell>
  );
}
