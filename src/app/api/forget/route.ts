import { forgetMemory } from "@/lib/server/store";

/** POST { blobId } -> tombstone a memory (agent stops using it, leaves inspector). */
export async function POST(request: Request) {
  try {
    const { blobId } = await request.json();
    if (!blobId) return Response.json({ error: "blobId is required" }, { status: 400 });
    forgetMemory(blobId);
    return Response.json({ forgotten: blobId });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "forget failed" },
      { status: 500 },
    );
  }
}
