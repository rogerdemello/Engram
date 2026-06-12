import { readGrants, toUiGrants } from "@/lib/server/consent";
import { serverEnv } from "@/lib/server/env";

export async function GET() {
  try {
    const raw = await readGrants();
    const e = serverEnv();
    return Response.json({
      grants: toUiGrants(raw),
      owner: e.SUI_ADDRESS,
      registryId: e.MNEME_REGISTRY_ID,
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
