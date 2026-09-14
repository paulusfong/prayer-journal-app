import { cookies } from "next/headers";
import { INVITE_LINK_ONCE_COOKIE } from "@/lib/invite-flash";
import { decideMembership, rotateInvite } from "@/app/actions";
import { Shell } from "@/components/shell";
import { displayLabel } from "@/lib/ids";
import { getRequestDictionary, t } from "@/lib/i18n";
import { activeInvite, listCirclePeople } from "@/lib/journal";
import { requireApproved } from "@/lib/session";
import { notFound } from "next/navigation";

export default async function CirclePage(props?: {
  searchParams?: Promise<{ invite?: string }>;
}) {
  const { user, membership } = await requireApproved();
  if (membership.role !== "owner") notFound();
  const { locale, dict } = await getRequestDictionary();

  const people = await listCirclePeople(membership.circleId);
  const invite = await activeInvite(membership.circleId);
  const pending = people.filter((p) => p.membership.status === "pending");
  const members = people.filter((p) => p.membership.status === "approved");
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const sp = (await props?.searchParams) ?? {};
  const onceToken =
    (typeof sp.invite === "string" && sp.invite.trim()) ||
    (await cookies()).get(INVITE_LINK_ONCE_COOKIE)?.value;

  return (
    <Shell user={user} isOwner approved dict={dict} locale={locale}>
      <section className="panel">
        <h1>{dict.circle.title}</h1>
        <h2>{dict.circle.invite}</h2>
        {onceToken ? (
          <>
            <p className="invite-url">
              <code>
                {base}/join/{onceToken}
              </code>
            </p>
            <p className="muted">{dict.circle.copyOnce}</p>
          </>
        ) : invite ? (
          <p className="muted">
            {t(dict, "circle.activeUntil", { date: invite.expiresAt.toISOString().slice(0, 10) })}
          </p>
        ) : (
          <p className="muted">{dict.circle.noInvite}</p>
        )}
        <form action={rotateInvite}>
          <button type="submit">{dict.circle.resetInvite}</button>
        </form>

        <h2>{pending.length ? t(dict, "circle.waitingCount", { count: pending.length }) : dict.circle.waiting}</h2>
        {pending.length === 0 ? (
          <p className="muted">{dict.circle.noWaiting}</p>
        ) : (
          <ul className="people">
            {pending.map(({ membership: m, person }) => (
              <li key={m.id}>
                <span>
                  {displayLabel(person)} · {person.email}
                </span>
                <span>
                  <form action={decideMembership.bind(null, m.id, "approve")} style={{ display: "inline" }}>
                    <button className="btn-small" type="submit">
                      {dict.circle.approve}
                    </button>
                  </form>{" "}
                  <form action={decideMembership.bind(null, m.id, "decline")} style={{ display: "inline" }}>
                    <button className="danger" type="submit">
                      {dict.circle.decline}
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}

        <h2>{dict.circle.members}</h2>
        <ul className="people">
          {members.map(({ membership: m, person }) => (
            <li key={m.id}>
              <span>
                {displayLabel(person)}
                {m.role === "owner" ? ` · ${dict.circle.ownerRole}` : ""}
              </span>
              {m.userId !== user.id ? (
                <form action={decideMembership.bind(null, m.id, "revoke")}>
                  <button className="danger" type="submit">
                    {dict.circle.remove}
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}
