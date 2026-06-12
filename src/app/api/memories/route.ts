import { listMemories } from "@/lib/server/store";

export async function GET(request: Request) {
  const ns = new URL(request.url).searchParams.get("namespace");
  return Response.json({ memories: listMemories(ns || undefined) });
}
