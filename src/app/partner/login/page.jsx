import { redirect } from "next/navigation";
import Link from "next/link";
import { getPartnerId } from "@/lib/partners/auth";
import PartnerLoginForm from "@/app/components/partners/PartnerLoginForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Partner Login | Mr. Service Expert",
  robots: "noindex, nofollow",
};

export default async function PartnerLoginPage() {
  if (await getPartnerId()) redirect("/partner/dashboard");

  return (
    <main className="bg-[var(--bg)] px-4 py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-[var(--ink)]">Partner login</h1>
        <p className="mb-6 mt-1 text-sm text-[var(--muted)]">Sign in with the mobile number you registered with.</p>
        <PartnerLoginForm />
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          New here?{" "}
          <Link href="/join-as-partner" className="font-semibold text-purple-700 underline">
            Join as a partner
          </Link>
        </p>
      </div>
    </main>
  );
}
