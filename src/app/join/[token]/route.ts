import { cookies } from "next/headers";
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

  const cookieStore = await cookies();
  cookieStore.set("invite_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  const session = await auth.api.getSession({ headers: request.headers });
  if (session?.user) {
    const result = await redeemInvite(session.user.id, token);
    if (result.ok && result.status === "approved") {
      return NextResponse.redirect(new URL("/", url.origin));
    }
    return NextResponse.redirect(new URL("/pending", url.origin));
  }

  return NextResponse.redirect(new URL("/sign-in", url.origin));
}
