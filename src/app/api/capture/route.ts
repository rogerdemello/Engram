import { captureMemories } from "@/lib/server/memory-service";
import { rateLimit, tooMany } from "@/lib/server/ratelimit";

export async function POST(request: Request) {
  try {
    const rl = rateLimit(request, "capture", 15);
    if (!rl.ok) return tooMany(rl.retryAfter);
    const { appId, text } = await request.json();
    if (!text || !String(text).trim()) {
      return Response.json({ error: "text is required" }, { status: 400 });
    }
    const memories = await captureMemories(appId ?? "chat", String(text));
    return Response.json({ memories });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "capture failed" },
      { status: 500 },
    );
  }
}
