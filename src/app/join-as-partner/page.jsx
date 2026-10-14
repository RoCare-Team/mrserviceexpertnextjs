import { BadgeCheck, MapPin, Users } from "lucide-react";
import JoinWizard from "@/app/components/partners/JoinWizard";
import { getPartnerId } from "@/lib/partners/auth";
import { getApplication } from "@/lib/partners/application";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Join as a Partner – Grow Your Appliance Service Business | Mr. Service Expert",
  description:
    "Register your appliance repair shop or service center with Mr. Service Expert. Verify your mobile, choose your services, brands and service areas, and get listed after approval.",
  alternates: { canonical: "https://www.mrserviceexpert.com/join-as-partner" },
  robots: "index, follow",
};

export default async function JoinAsPartnerPage() {
  // Signed-in partners resume their saved draft.
  const partnerId = await getPartnerId();
  const app = partnerId ? await getApplication(partnerId) : null;

  return (
    <main className="bg-[var(--bg)] px-4 pb-16 pt-8 sm:pt-12">
      <header className="mx-auto mb-8 max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-purple-600">For technicians & service centers</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--ink)] sm:text-4xl">Join Mr. Service Expert as a Partner</h1>
        <p className="mx-auto mt-3 max-w-2xl text-[var(--body-text)]">
          List your appliance repair business on the city and locality pages customers already visit. Registration takes about
          10 minutes and your progress is saved as you go.
        </p>
        <ul className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[var(--ink-soft)]">
          <li className="flex items-center gap-1.5"><Users className="h-4 w-4 text-purple-600" /> Reach local customers</li>
          <li className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-purple-600" /> Choose your own service areas</li>
          <li className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-purple-600" /> Free to register</li>
        </ul>
      </header>
      <JoinWizard initialApp={app} />
    </main>
  );
}
