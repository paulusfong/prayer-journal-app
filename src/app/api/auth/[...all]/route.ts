import { auth } from "@/lib/auth";
import { canRequestMagicLink, inviteTokenFromCookieHeader } from "@/lib/auth-gate";
import { blockedMagicLinkVerifyResponse } from "@/lib/magic-link-verify-guard";
import {
  allowMagicLinkRequest,
  clientIpFromHeaders,
  magicLinkThrottleKey,
} from "@/lib/magic-link-throttle";
import { toNextJsHandler } from "better-auth/next-js";

const { GET: authGet, POST: authPost } = toNextJsHandler(auth);

export async function GET(request: Request) {
  const blocked = blockedMagicLinkVerifyResponse(request);
  if (blocked) return blocked;
  return authGet(request);
}

export async function HEAD(request: Request) {
  const blocked = blockedMagicLinkVerifyResponse(request);
  if (blocked) return blocked;
  const res = await authGet(request);
  return new Response(null, { status: res.status, headers: res.headers });
}

async function emailFromAuthRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { email?: unknown };
      return String(body.email ?? "")
        .trim()
        .toLowerCase();
    }
    const form = await request.formData();
    return String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.endsWith("/sign-in/magic-link")) {
    const email = await emailFromAuthRequest(request.clone());
    const throttleKey = magicLinkThrottleKey(email, clientIpFromHeaders(request.headers));
    if (!allowMagicLinkRequest(throttleKey)) {
      // Match no-enumeration UX used by the HTTP gate and server action.
      return Response.json({ status: true });
    }
    const invite = inviteTokenFromCookieHeader(request.headers.get("cookie"));
    if (!(await canRequestMagicLink(email, invite))) {
      return Response.json({ status: true });
    }
  }
  return authPost(request);
}
