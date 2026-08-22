import { decideMembership, rotateInvite } from "@/app/actions";
import { Shell } from "@/components/shell";
import { displayLabel } from "@/lib/ids";
import { activeInvite, listCirclePeople } from "@/lib/journal";
import { requireApproved } from "@/lib/session";
import { notFound } from "next/navigation";

export default async function CirclePage() {
  const { user, membership } = await requireApproved();
  if (membership.role !== "owner") notFound();

  const people = await listCirclePeople(membership.circleId);
  const invite = await activeInvite(membership.circleId);
  const pending = people.filter((p) => p.membership.status === "pending");
  const members = people.filter((p) => p.membership.status === "approved");
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

  return (
    <Shell user={user} isOwner approved>
      <section className="panel">
        <h1>Circle</h1>
        <h2>Invite</h2>
        {invite ? (
          <>
            <p className="invite-url">
              <code>
                {base}/join/{invite.token}
              </code>
            </p>
            <p className="muted">
              Reusable until {invite.expiresAt.toISOString().slice(0, 10)}. Anyone with the link still needs your
              approval.
            </p>
          </>
        ) : (
          <p className="muted">No active invite link.</p>
        )}
        <form action={rotateInvite}>
          <button type="submit">Reset invite link</button>
        </form>

        <h2>Waiting {pending.length ? `(${pending.length})` : ""}</h2>
        {pending.length === 0 ? (
          <p className="muted">No one waiting.</p>
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
                      Approve
                    </button>
                  </form>{" "}
                  <form action={decideMembership.bind(null, m.id, "decline")} style={{ display: "inline" }}>
                    <button className="danger" type="submit">
                      Decline
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}

        <h2>Members</h2>
        <ul className="people">
          {members.map(({ membership: m, person }) => (
            <li key={m.id}>
              <span>
                {displayLabel(person)}
                {m.role === "owner" ? " · owner" : ""}
              </span>
              {m.userId !== user.id ? (
                <form action={decideMembership.bind(null, m.id, "revoke")}>
                  <button className="danger" type="submit">
                    Remove
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
