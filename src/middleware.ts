import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  INVITE_LINK_ONCE_COOKIE,
  inviteLinkOnceClearInit,
  shouldClearInviteLinkOnce,
} from "@/lib/invite-flash";

export function middleware(request: NextRequest) {
  const hasCookie = Boolean(request.cookies.get(INVITE_LINK_ONCE_COOKIE)?.value);
  if (!shouldClearInviteLinkOnce(request.nextUrl.pathname, hasCookie)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const secure =
    process.env.NODE_ENV === "production" ||
    (process.env.BETTER_AUTH_URL ?? "").startsWith("https");
  response.cookies.set(INVITE_LINK_ONCE_COOKIE, "", inviteLinkOnceClearInit(secure));
  return response;
}

export const config = {
  matcher: ["/circle"],
};
