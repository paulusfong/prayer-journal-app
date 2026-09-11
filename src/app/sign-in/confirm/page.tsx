import { confirmMagicLink } from "@/app/actions";
import { Shell } from "@/components/shell";
import { redirect } from "next/navigation";

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect("/sign-in");

  return (
    <Shell>
      <section className="panel auth">
        <h1>Finish signing in</h1>
        <p className="lede">
          Click below to enter the journal. This keeps email scanners from using the link for you.
        </p>
        <form action={confirmMagicLink}>
          <input type="hidden" name="token" value={token} />
          <button type="submit">Sign in</button>
        </form>
      </section>
    </Shell>
  );
}
