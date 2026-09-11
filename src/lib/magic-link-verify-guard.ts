/** Block Better Auth HTTP GET/HEAD session minting via /magic-link/verify. */
export function isMagicLinkVerifyPath(pathname: string): boolean {
  return pathname.endsWith("/magic-link/verify");
}

/** Returns a 405 with no Set-Cookie / no body when the path is magic-link verify. */
export function blockedMagicLinkVerifyResponse(request: Request): Response | null {
  const { pathname } = new URL(request.url);
  if (!isMagicLinkVerifyPath(pathname)) return null;
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST" },
  });
}
