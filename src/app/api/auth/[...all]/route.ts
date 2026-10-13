import { handleAuthentication } from "@/features/auth/http";
import { authConfiguration } from "@/features/auth/options";
import { authentication } from "@/features/auth/server";
import { hasAuthentication, isDemo } from "@/lib/config";
export const runtime = "nodejs";
async function handle(request: Request) {
  if (isDemo() || !hasAuthentication())
    return Response.json(
      { message: "Private login is unavailable." },
      { status: 503 },
    );
  return handleAuthentication(authentication(), authConfiguration(), request);
}
export const GET = handle;
export const POST = handle;
