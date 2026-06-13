import { grantAccess, revokeAccess } from "@/lib/server/consent";
import { appAddress } from "@/lib/server/env";
import { rateLimit, tooMany } from "@/lib/server/ratelimit";

/** POST { appId, namespace, revoke? } -> grant or revoke on-chain consent. */
export async function POST(request: Request) {
  try {
    const rl = rateLimit(request, "grant", 10);
    if (!rl.ok) return tooMany(rl.retryAfter);
    const { appId, namespace, revoke } = await request.json();
    if (!appId || !namespace) {
      return Response.json({ error: "appId and namespace are required" }, { status: 400 });
    }
    const addr = appAddress(appId);
    const digest = revoke
      ? await revokeAccess(addr, namespace)
      : await grantAccess(addr, namespace);
    return Response.json({ digest, app: appId, appAddress: addr, namespace, revoked: Boolean(revoke) });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "consent update failed" },
      { status: 500 },
    );
  }
}
