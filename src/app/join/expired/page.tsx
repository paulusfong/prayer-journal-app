import { Shell } from "@/components/shell";

export default function ExpiredInvitePage() {
  return (
    <Shell>
      <section className="panel">
        <h1>This invite is no longer valid</h1>
        <p className="lede">Ask the owner for a new link.</p>
      </section>
    </Shell>
  );
}
