import type { AuthConfiguration } from "./options";

export async function handleAuthentication(
  auth: { handler: (request: Request) => Promise<Response> },
  config: AuthConfiguration,
  request: Request,
) {
  const path = new URL(request.url).pathname.replace(/^\/api\/auth/, "");
  if (!["/sign-in/email", "/sign-out", "/get-session"].includes(path))
    return Response.json({ message: "Not found." }, { status: 404 });
  if (
    request.method === "POST" &&
    request.headers.get("origin") !== config.appUrl
  )
    return Response.json({ message: "Invalid origin." }, { status: 403 });
  // A single-owner global bucket persists across processes. Ignore supplied IPs.
  const headers = new Headers(request.headers);
  headers.set("x-bet-tracker-client", "127.0.0.1");
  try {
    let body: Uint8Array<ArrayBuffer> | undefined;
    if (request.body) {
      const reader = request.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        for (;;) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.byteLength;
          if (size > 16_384) {
            await reader.cancel();
            return Response.json(
              { message: "Request too large." },
              { status: 413 },
            );
          }
          chunks.push(part.value);
        }
      } finally {
        reader.releaseLock();
      }
      body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
      }
    }
    // NextRequest can come from a different Request implementation in production.
    const normalized = new Request(request.url, {
      method: request.method,
      headers,
      body,
    });
    const response = await auth.handler(normalized);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    console.error(
      "Authentication request failed; check service configuration.",
    );
    return Response.json(
      { message: "Unable to sign in. Please try again." },
      { status: 503 },
    );
  }
}
