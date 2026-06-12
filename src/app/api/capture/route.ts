import { captureMemories } from "@/lib/server/memory-service";

export async function POST(request: Request) {
  try {
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
