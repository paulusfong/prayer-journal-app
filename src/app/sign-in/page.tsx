import { requestMagicLink } from "@/app/actions";
import { Shell } from "@/components/shell";
import { getRequestDictionary } from "@/lib/i18n";
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
  const { locale, dict } = await getRequestDictionary();

  return (
    <Shell dict={dict} locale={locale}>
      <section className="panel auth">
        <h1>{dict.signIn.title}</h1>
        <p className="lede">{dict.signIn.lede}</p>
        {sent ? <p className="flash">{dict.signIn.sent}</p> : null}
        <form action={requestMagicLink}>
          <label htmlFor="email">{dict.signIn.email}</label>
          <input id="email" name="email" type="email" required autoFocus autoComplete="email" />
          <p>
            <button type="submit">{dict.signIn.sendLink}</button>
          </p>
        </form>
      </section>
    </Shell>
  );
}
