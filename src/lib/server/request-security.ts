import "server-only";

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  if (!host) throw new Error("FORBIDDEN");

  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new Error("FORBIDDEN");
  }

  if (originHost !== host) throw new Error("FORBIDDEN");
}
