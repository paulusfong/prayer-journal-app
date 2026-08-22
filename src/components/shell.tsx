import Link from "next/link";
import { signOut } from "@/app/actions";
import { displayLabel } from "@/lib/ids";

type Props = {
  children: React.ReactNode;
  user?: { email: string; name?: string | null; displayName?: string | null };
  isOwner?: boolean;
  approved?: boolean;
};

export function Shell({ children, user, isOwner, approved }: Props) {
  return (
    <div className="shell">
      <header className="mast">
        <Link className="wordmark" href={approved ? "/" : user ? "/pending" : "/sign-in"}>
          Prayer Journal
        </Link>
        {user ? (
          <nav className="nav">
            {approved ? (
              <>
                <Link href="/">Open</Link>
                <Link href="/answered">Answered</Link>
                <Link href="/requests/new">New request</Link>
                {isOwner ? <Link href="/circle">Circle</Link> : null}
              </>
            ) : null}
            <Link href="/profile">{displayLabel(user)}</Link>
            <form action={signOut}>
              <button type="submit" className="text-btn">
                Sign out
              </button>
            </form>
          </nav>
        ) : null}
      </header>
      <main>{children}</main>
      <footer className="colophon">
        <Link href="/privacy">Privacy</Link>
      </footer>
    </div>
  );
}
