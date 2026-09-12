/** One-time raw invite token cookie set by rotateInvite; shown once on /circle. */
export const INVITE_LINK_ONCE_COOKIE = "invite_link_once";

export function inviteLinkOnceClearInit(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 0,
  };
}

/** Clear on the response when /circle is served with the flash cookie present. */
export function shouldClearInviteLinkOnce(pathname: string, hasCookie: boolean) {
  return Boolean(hasCookie) && (pathname === "/circle" || pathname.startsWith("/circle/"));
}
