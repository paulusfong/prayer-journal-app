import { confirmMagicLink } from "@/app/actions";
import { Shell } from "@/components/shell";
import { getRequestDictionary } from "@/lib/i18n";
import { redirect } from "next/navigation";

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect("/sign-in");
  const { locale, dict } = await getRequestDictionary();

  return (
    <Shell dict={dict} locale={locale}>
      <section className="panel auth">
        <h1>{dict.signIn.confirmTitle}</h1>
        <p className="lede">{dict.signIn.confirmLede}</p>
        <form action={confirmMagicLink}>
          <input type="hidden" name="token" value={token} />
          <button type="submit">{dict.signIn.confirmButton}</button>
        </form>
      </section>
    </Shell>
  );
}
