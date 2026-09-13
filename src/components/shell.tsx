import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/actions";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { displayLabel } from "@/lib/ids";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n";

type Props = React.PropsWithChildren<{
  user?: { email: string; name?: string | null; displayName?: string | null };
  isOwner?: boolean;
  approved?: boolean;
  dict?: Dictionary;
  locale?: Locale;
}>;

export function Shell({
  children,
  user,
  isOwner,
  approved,
  dict = getDictionary("en"),
  locale = "en",
}: Props) {
  return (
    <div className="shell">
      <header className="mast">
        <Link className="wordmark" href={approved ? "/" : user ? "/pending" : "/sign-in"}>
          <Image
            className="wordmark-mark"
            src="/prayer-hands.png"
            alt=""
            width={40}
            height={40}
            priority
          />
          <span className="wordmark-text">{dict.appName}</span>
        </Link>
        <div className="mast-end">
          {user ? (
            <nav className="nav">
              {approved ? (
                <>
                  <Link href="/">{dict.nav.open}</Link>
                  <Link href="/answered">{dict.nav.answered}</Link>
                  <Link className="nav-cta" href="/requests/new">
                    {dict.nav.newRequest}
                  </Link>
                  <Link href="/feedback">{dict.nav.feedback}</Link>
                  <Link href="/help">{dict.nav.help}</Link>
                  {isOwner ? <Link href="/circle">{dict.nav.circle}</Link> : null}
                </>
              ) : null}
              <Link href="/profile">{displayLabel(user)}</Link>
              <form action={signOut}>
                <button type="submit" className="text-btn">
                  {dict.nav.signOut}
                </button>
              </form>
            </nav>
          ) : null}
          <LocaleSwitcher locale={locale} label={dict.nav.language} names={dict.localeNames} />
        </div>
      </header>
      <main>{children}</main>
      <footer className="colophon">
        <Link href="/help">{dict.nav.help}</Link>
        <Link href="/privacy">{dict.nav.privacy}</Link>
      </footer>
    </div>
  );
}
