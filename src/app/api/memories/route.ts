import { listMemories } from "@/lib/server/store";
import { rehydrateInspector } from "@/lib/server/memory-service";

export async function GET(request: Request) {
  const ns = new URL(request.url).searchParams.get("namespace");
  let memories = listMemories(ns || undefined);
  // serverless-robust: if the local index is empty, rebuild it from Walrus
  if (memories.length === 0) {
    try {
      await rehydrateInspector();
      memories = listMemories(ns || undefined);
    } catch {
      /* best-effort */
    }
  }
  return Response.json({ memories });
}
