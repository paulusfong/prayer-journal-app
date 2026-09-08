import { auth } from "@/lib/auth";
import { canRequestMagicLink, inviteTokenFromCookieHeader } from "@/lib/auth-gate";
import { toNextJsHandler } from "better-auth/next-js";

const { GET, POST: authPost } = toNextJsHandler(auth);

export { GET };

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
    const invite = inviteTokenFromCookieHeader(request.headers.get("cookie"));
    if (!(await canRequestMagicLink(email, invite))) {
      return Response.json({ status: true });
    }
  }
  return authPost(request);
}
