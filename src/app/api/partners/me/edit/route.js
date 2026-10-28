import { ok, handle, assertSameOrigin } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { startEditing, getApplication } from "@/lib/partners/application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Re-open an approved / pending application for editing (unlists it). */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  await startEditing(p.id);
  return ok(await getApplication(p.id));
});
