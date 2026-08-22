import { requestMagicLink } from "@/app/actions";
import { Shell } from "@/components/shell";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/");
  const { sent } = await searchParams;

  return (
    <Shell>
      <section className="panel auth">
        <h1>Sign in</h1>
        <p className="lede">We’ll email you a link. No password.</p>
        {sent ? <p className="flash">Check your email for a sign-in link.</p> : null}
        <form action={requestMagicLink}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoFocus autoComplete="email" />
          <p>
            <button type="submit">Send link</button>
          </p>
        </form>
      </section>
    </Shell>
  );
}
