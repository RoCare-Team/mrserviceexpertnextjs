// Admin job writes: create, update and lifecycle actions. Job status is
// independent of application status — closing / archiving a job never
// touches its applications.

import db from "@/lib/db";
import { HttpError } from "@/lib/careers/http";
import { validateJob, applyPublishDefaults, assertSlugFree, uniqueSlug, JOB_COLUMNS, adminGetJob, todayIst } from "@/lib/careers/jobs";
import { getSettings } from "@/lib/careers/settings";

function dupSlugError(err) {
  if (err?.code === "ER_DUP_ENTRY") {
    throw new HttpError(409, "validation", "This URL slug is already used by another job.", { slug: "This URL slug is already used by another job." });
  }
  throw err;
}

/** intent: draft | publish */
export async function createJob(body, admin) {
  const publishing = body.intent === "publish";
  let job = validateJob(body, { publishing });
  await assertSlugFree(job.slug);
  if (publishing) {
    job = applyPublishDefaults(job, await getSettings());
    if (!job.publish_date) job.publish_date = new Date();
  }
  const cols = [...JOB_COLUMNS, "status", "created_by", "updated_by", "published_at"];
  const vals = [...JOB_COLUMNS.map((c) => job[c]), publishing ? "published" : "draft", admin.id, admin.id, publishing ? new Date() : null];
  try {
    const [r] = await db.query(`INSERT INTO career_jobs (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`, vals);
    return r.insertId;
  } catch (err) {
    dupSlugError(err);
  }
}

/** intent: update (keep status) | draft | publish */
export async function updateJob(id, body, admin) {
  const current = await adminGetJob(id);
  if (current.status === "archived") throw new HttpError(409, "archived", "Restore this job before editing it.");
  const target = body.intent === "publish" ? "published" : body.intent === "draft" ? "draft" : current.status;
  const publishing = target === "published";
  let job = validateJob(body, { publishing });
  await assertSlugFree(job.slug, id);
  if (publishing && current.status !== "published") job = applyPublishDefaults(job, await getSettings());

  if (publishing && !job.publish_date) job.publish_date = current.publish_date || new Date();

  const sets = [...JOB_COLUMNS.map((c) => `${c} = ?`), "status = ?", "updated_by = ?"];
  const vals = [...JOB_COLUMNS.map((c) => job[c]), target, admin.id];
  if (publishing) sets.push("published_at = COALESCE(published_at, NOW())", "closed_reason = NULL", "closed_at = NULL");
  try {
    await db.query(`UPDATE career_jobs SET ${sets.join(", ")} WHERE id = ?`, [...vals, id]);
  } catch (err) {
    dupSlugError(err);
  }
  return { from: current.status, to: target };
}

const isPastDate = (d) => d && String(d).slice(0, 10) < todayIst();

/** action: publish | unpublish | close | reopen | duplicate | archive | restore */
export async function jobAction(id, action, admin) {
  const job = await adminGetJob(id);
  const set = async (sql, params = []) => db.query(`UPDATE career_jobs SET ${sql}, updated_by = ? WHERE id = ?`, [...params, admin.id, id]);

  switch (action) {
    case "publish": {
      if (job.status === "published") throw new HttpError(409, "bad_state", "This job is already published.");
      if (job.status === "archived") throw new HttpError(409, "bad_state", "Restore this job before publishing it.");
      // Same rules as the form: a public posting must be complete.
      let checked = validateJob({ ...job, publish_date: job.publish_date_input }, { publishing: true });
      checked = applyPublishDefaults(checked, await getSettings());
      await set(
        `status = 'published', published_at = COALESCE(published_at, NOW()), publish_date = COALESCE(publish_date, NOW()),
         expiry_date = ?, closed_reason = NULL, closed_at = NULL`,
        [checked.expiry_date]
      );
      return { message: "Job published." };
    }
    case "unpublish":
      if (job.status !== "published") throw new HttpError(409, "bad_state", "Only a published job can be unpublished.");
      await set("status = 'draft'");
      return { message: "Job moved back to draft — it is no longer on the website." };
    case "close":
      if (job.status !== "published") throw new HttpError(409, "bad_state", "Only a published job can be closed.");
      await set("status = 'closed', closed_reason = 'manual', closed_at = NOW()");
      return { message: "Job closed. Existing applications are unchanged." };
    case "reopen": {
      if (job.status !== "closed") throw new HttpError(409, "bad_state", "Only a closed job can be reopened.");
      if (isPastDate(job.application_deadline) || isPastDate(job.expiry_date)) {
        throw new HttpError(409, "expired", "The deadline / expiry date has passed. Edit the job and set a new date, then publish it.");
      }
      await set("status = 'published', closed_reason = NULL, closed_at = NULL, published_at = COALESCE(published_at, NOW())");
      return { message: "Job reopened and accepting applications." };
    }
    case "archive":
      if (job.status === "archived") throw new HttpError(409, "bad_state", "This job is already archived.");
      await set("status = 'archived', archived_at = NOW()");
      return { message: "Job archived. It is hidden from the website; its applications are kept." };
    case "restore":
      if (job.status !== "archived") throw new HttpError(409, "bad_state", "Only an archived job can be restored.");
      await set("status = 'draft', archived_at = NULL");
      return { message: "Job restored as a draft." };
    case "duplicate": {
      const slug = await uniqueSlug(`${job.slug}-copy`);
      const copyCols = JOB_COLUMNS.filter((c) => !["slug", "application_deadline", "expiry_date", "publish_date", "is_featured", "canonical_url"].includes(c));
      const [r] = await db.query(
        `INSERT INTO career_jobs (${copyCols.join(", ")}, slug, status, created_by, updated_by)
         SELECT ${copyCols.join(", ")}, ?, 'draft', ?, ? FROM career_jobs WHERE id = ?`,
        [slug, admin.id, admin.id, id]
      );
      await db.query("UPDATE career_jobs SET title = LEFT(CONCAT(title, ' (Copy)'), 160) WHERE id = ?", [r.insertId]);
      return { message: "Job duplicated as a draft.", id: r.insertId };
    }
    default:
      throw new HttpError(400, "bad_request", "Unknown action.");
  }
}
