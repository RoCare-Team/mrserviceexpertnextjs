"use client";

import { useRouter } from "next/navigation";
import OtpSignIn from "./OtpSignIn";

export default function PartnerLoginForm() {
  const router = useRouter();
  // A number with no account gets a fresh draft and continues registration.
  return (
    <OtpSignIn
      askName={false}
      submitLabel="Verify & sign in"
      onVerified={(d) => router.replace(d.created ? "/join-as-partner" : "/partner/dashboard")}
    />
  );
}
