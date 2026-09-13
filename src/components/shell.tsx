import Image from "next/image";
import Link from "next/link";
import { setLocale, signOut } from "@/app/actions";
import { displayLabel } from "@/lib/ids";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
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
          <form action={setLocale} className="lang-switch">
            <label>
              <span className="sr-only">{dict.nav.language}</span>
              <select name="locale" defaultValue={locale} aria-label={dict.nav.language}>
                {LOCALES.map((code) => (
                  <option key={code} value={code}>
                    {dict.localeNames[code]}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="text-btn">
              {dict.nav.language}
            </button>
          </form>
        </div>
      </header>
      <main>{children}</main>
      <footer className="colophon">
        <Link href="/privacy">{dict.nav.privacy}</Link>
      </footer>
    </div>
  );
}
