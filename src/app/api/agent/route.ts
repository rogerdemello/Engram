import { recallForAgent, captureMemories } from "@/lib/server/memory-service";
import { runAgent, agentConfigured } from "@/lib/server/agent";
import { rateLimit, globalCap, tooMany } from "@/lib/server/ratelimit";
import type { Memory, Receipt } from "@/lib/types";

/** Demoable reply when Azure OpenAI isn't configured yet — still proves the
 *  memory + consent layers by showing exactly what the agent could see. */
function fallbackReply(receipts: Receipt[], blocked: { namespace: string }[]): string {
  const lines: string[] = [];
  if (receipts.length) {
    lines.push("Using your memories I can see:");
    for (const r of receipts) lines.push(`• ${r.text}`);
  } else {
    lines.push("I couldn't find any memories I'm allowed to read for this request.");
  }
  if (blocked.length) {
    lines.push(
      `\n(Blocked from: ${blocked.map((b) => b.namespace).join(", ")} — no on-chain consent.)`,
    );
  }
  lines.push("\n[Add AZURE_OPENAI_API_KEY + AZURE_OPENAI_RESOURCE_NAME to .env.local for full AI replies.]");
  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const rl = rateLimit(request, "agent", 15);
    if (!rl.ok) return tooMany(rl.retryAfter);
    if (!globalCap()) return tooMany(60, "Demo is busy right now — try again shortly.");

    const body = await request.json();
    const appId: string = body.appId ?? "chat";
    const message: string = body.message;
    const capture: boolean = Boolean(body.capture);
    const registryId: string | undefined = body.registryId || undefined;
    if (!message || !String(message).trim()) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const { receipts, blocked } = await recallForAgent(appId, message, registryId);

    let stored: Memory[] = [];
    if (capture) {
      try {
        stored = await captureMemories(appId, message);
      } catch {
        /* capture is best-effort; never block the reply */
      }
    }

    const reply = agentConfigured()
      ? (await runAgent({ appId, message, memories: receipts })).reply
      : fallbackReply(receipts, blocked);

    return Response.json({ reply, receipts, stored, blocked });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "agent failed" },
      { status: 500 },
    );
  }
}
