import { verifyBlob } from "@/lib/server/walrus";

/** GET ?blobId= -> verify the memory blob is live on Walrus. */
export async function GET(request: Request) {
  const blobId = new URL(request.url).searchParams.get("blobId");
  if (!blobId) return Response.json({ error: "blobId is required" }, { status: 400 });
  const result = await verifyBlob(blobId);
  return Response.json(result);
}
