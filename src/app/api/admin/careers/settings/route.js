import { ok, handle, requireAdmin, readJson, assertSameOrigin, logAdmin } from "@/lib/careers/http";
import { getSettings, validateSettings, saveSettings } from "@/lib/careers/settings";
import { mailConfigured } from "@/lib/careers/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  return ok({ settings: await getSettings(), mailConfigured: mailConfigured(), storageConfigured: Boolean(process.env.AWS_S3_BUCKET && process.env.AWS_S3_REGION) });
});

export const PUT = handle(async (req) => {
  assertSameOrigin(req);
  const admin = await requireAdmin(req);
  const values = validateSettings(await readJson(req));
  await saveSettings(values, admin.id);
  await logAdmin(admin, "settings", null, "update", Object.keys(values).join(", "), req);
  return ok({ settings: await getSettings() });
});
