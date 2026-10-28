import { redirect } from "next/navigation";
import JoinWizard from "@/app/components/partners/JoinWizard";
import { getPartnerId } from "@/lib/partners/auth";
import { getApplication } from "@/lib/partners/application";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Partner Profile | Mr. Service Expert",
  robots: "noindex, nofollow",
};

/** Same wizard as registration, opened at step 1 for editing. */
export default async function PartnerProfilePage() {
  const id = await getPartnerId();
  if (!id) redirect("/partner/login");
  const app = await getApplication(id);
  if (!app) redirect("/partner/login");

  return (
    <main className="bg-[var(--bg)] px-4 py-8 sm:py-12">
      <h1 className="mb-6 text-center text-2xl font-bold text-[var(--ink)] sm:text-3xl">Edit your partner profile</h1>
      <JoinWizard initialApp={{ ...app, current_step: Math.max(app.current_step, 1) }} />
    </main>
  );
}
