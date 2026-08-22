import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findActiveInvite, redeemInvite } from "@/lib/journal";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await findActiveInvite(token);
  const url = new URL(request.url);

  if (!invite) {
    return NextResponse.redirect(new URL("/join/expired", url.origin));
  }

  const session = await auth.api.getSession({ headers: request.headers });
  const destination = session ? "/pending" : "/sign-in";
  const res = NextResponse.redirect(new URL(destination, url.origin));
  res.cookies.set("invite_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  if (session?.user) {
    const result = await redeemInvite(session.user.id, token);
    if (result.ok && result.status === "approved") {
      return NextResponse.redirect(new URL("/", url.origin));
    }
  }

  return res;
}
