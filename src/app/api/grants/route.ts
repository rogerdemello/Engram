import { readGrants, toUiGrants } from "@/lib/server/consent";
import { serverEnv } from "@/lib/server/env";

export async function GET(request: Request) {
  try {
    const reg = new URL(request.url).searchParams.get("registryId") || undefined;
    const raw = await readGrants(reg);
    const e = serverEnv();
    return Response.json({
      grants: toUiGrants(raw),
      owner: e.SUI_ADDRESS,
      registryId: reg || e.MNEME_REGISTRY_ID,
      packageId: e.MNEME_PACKAGE_ID,
      apps: { chat: e.CHAT_APP_ADDRESS, meal: e.MEAL_APP_ADDRESS },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "failed to read grants" },
      { status: 500 },
    );
  }
}
