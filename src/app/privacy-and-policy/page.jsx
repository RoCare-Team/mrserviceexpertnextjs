import { ShieldCheck, Mail, Phone, MapPin, UserRound, Clock } from "lucide-react";
import { Breadcrumbs, Container, SITE } from "@/app/components/public/ui";

// Text below is copied verbatim from "Mr. Service Experts privacy policy.docx".
// **bold** markers reproduce the bold runs of the original document.

export const metadata = {
  title: "Privacy Policy | Mr. Service Expert",
  description:
    "How Mr. Service Experts collects, uses, shares and protects your personal data, and the choices and rights you have under Indian law, including the DPDP Act, 2023.",
  alternates: { canonical: `${SITE}/privacy-and-policy` },
  robots: "index, follow",
};

const LAST_UPDATED = "10.11.2026";

const SECTIONS = [
  {
    title: "1. Introduction",
    blocks: [
      { p: 'Welcome to Mr. Service Experts ("**Mr. Service Experts**", "**we**", "**us**", or "**our**"). We operate a platform, available through our website [www.yourwebsite.com] and our mobile application (together, the "**Platform**"), that connects customers ("**Customers**", "**you**") with independent, verified service professionals ("**Service Professionals**") for home and on-demand services such as plumbing, electrical work, appliance and AC repair, deep cleaning, pest control, carpentry, painting and similar services (the "**Services**").' },
      { p: "This Privacy Policy explains what personal data we collect, why we collect it, how we use, share and protect it, and the choices and rights you have. By accessing or using the Platform, you agree to this Privacy Policy. If you do not agree, please do not use the Platform." },
      { p: 'This Policy is published in accordance with the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, the Digital Personal Data Protection Act, 2023 ("**DPDP Act**"), and other applicable Indian laws.' },
    ],
  },
  {
    title: "2. Information We Collect",
    blocks: [
      { h3: "2.1 Information you provide to us" },
      { label: "Customers:" },
      {
        ul: [
          "**Account details:** name, mobile number, email address, and profile photo (optional).",
          "**Address details:** service address, landmark, and saved addresses.",
          "**Booking details:** type of service requested, date and time slots, special instructions, photos or videos you upload to describe the problem (for example, a leaking pipe or a faulty appliance).",
          "**Payment details:** transaction ID, payment method, and billing information. Card, UPI and net-banking details are handled directly by our payment partners and are not stored by us in full.",
          "**Communications:** messages, chat, call recordings, reviews, ratings, feedback and support requests.",
        ],
      },
      { label: "Service Professionals:" },
      {
        ul: [
          "Name, phone number, email, photo, address, and date of birth.",
          "Identity and verification documents (for example, Aadhaar, PAN, driving licence or other government ID), as permitted by law, along with background or police verification results.",
          "Skills, work experience, certifications, and service areas.",
          "Bank account or UPI details for payouts, and tax information.",
          "Training, performance, ratings and complaint records.",
        ],
      },
      { h3: "2.2 Information collected automatically" },
      {
        ul: [
          "**Device and technical data:** IP address, device type, operating system, browser type, unique device identifiers, app version, crash logs and language settings.",
          "**Usage data:** pages and screens viewed, features used, search queries, clicks, time spent and referral source.",
          "**Location data:** with your permission, we collect precise location (GPS) to help you pick your service address and to help match, route and track Service Professionals during a booking. Service Professionals' location may be collected while they are logged in and on an active job.",
          "**Cookies and similar technologies:** see Section 8.",
        ],
      },
      { h3: "2.3 Information from third parties" },
      {
        ul: [
          "Payment gateways, banks and UPI providers (payment status and confirmation).",
          "Identity and background verification agencies (for Service Professionals).",
          "Social login providers (such as Google), if you choose to sign in with them.",
          "Marketing and analytics partners, and publicly available sources, where permitted by law.",
        ],
      },
      { h3: "2.4 Information we do not intentionally collect" },
      { p: "We do not ask for or intentionally collect sensitive categories of data such as health records, biometric data, religion, caste, political views or sexual orientation. Please do not include such information in notes, photos or messages." },
    ],
  },
  {
    title: "3. How We Use Your Information",
    blocks: [
      { p: "We use personal data for the following purposes:" },
      {
        ul: [
          "**To provide the Services:** create and manage your account, process bookings, match you with suitable Service Professionals, enable communication, and complete the service.",
          "**Payments:** process payments, refunds, payouts to Service Professionals, and prevent payment fraud.",
          "**Safety and trust:** verify Service Professionals, handle complaints and disputes, and protect the safety of Customers, Service Professionals and our staff.",
          "**Customer support:** respond to your queries, requests and feedback.",
          "**Communication:** send booking confirmations, service reminders, status updates, invoices and important notices by SMS, email, push notification, WhatsApp or calls.",
          "**Improvement and personalisation:** analyse usage, improve features, develop new services, and show relevant recommendations.",
          "**Marketing:** send offers, promotions and updates, where you have consented. You can opt out at any time.",
          "**Quality assurance and training:** review call recordings, chats and ratings to monitor service quality and train our teams.",
          "**Legal and compliance:** comply with applicable laws, enforce our Terms of Use, respond to lawful requests from authorities, and detect, prevent and investigate fraud, abuse or illegal activity.",
        ],
      },
    ],
  },
  {
    title: "4. Consent and Lawful Basis",
    blocks: [
      { p: "We process your personal data based on your consent, which you provide when you register or use the Platform, and for certain legitimate uses permitted under the DPDP Act, such as fulfilling a service you requested, complying with legal obligations, responding to emergencies, and preventing fraud." },
      { p: "You may withdraw your consent at any time by contacting us (see Section 15). Withdrawal will not affect processing done before withdrawal. Please note that withdrawing consent may mean we can no longer provide some or all of the Services." },
    ],
  },
  {
    title: "5. How We Share Your Information",
    blocks: [
      { p: "We do not sell your personal data. We share it only as described below:" },
      {
        ul: [
          "**Service Professionals:** to fulfil your booking, we share your name, service address, contact details (which may be masked or routed through a virtual number), and booking details. We share only what is needed for the job.",
          "**Service providers and vendors:** payment gateways, cloud hosting, SMS/email/WhatsApp providers, analytics, customer-support tools, identity and background verification agencies, and logistics or insurance partners who process data on our behalf under confidentiality obligations.",
          "**Group companies and business transfers:** in connection with a merger, acquisition, restructuring or sale of assets, your data may be transferred to the successor entity, which will continue to honour this Policy.",
          "**Legal and regulatory authorities:** where required by law, court order, or government request, or to protect our rights, property or safety, or that of our users or the public.",
          "**With your consent:** in any other case where you have agreed to the sharing.",
        ],
      },
      { p: "Service Professionals are independent professionals and must keep Customer data confidential and use it only for completing the booked service." },
    ],
  },
  {
    title: "6. Call Recording, Chat and Photos",
    blocks: [
      { p: "Calls and chats between you, Service Professionals and our support team that go through the Platform may be recorded or stored for quality, safety, dispute resolution and training purposes. Photos or videos you upload are shared with the assigned Service Professional to help diagnose the job. We ask you not to share personal or financial information (such as OTPs, card numbers or passwords) over calls or chat with anyone." },
    ],
  },
  {
    title: "7. Cookies and Tracking Technologies",
    blocks: [
      { p: "We and our partners use cookies, pixels, SDKs and similar technologies to keep you signed in, remember preferences, measure performance, prevent fraud and show relevant content. You can control cookies through your browser settings and manage app permissions through your device settings. Disabling certain cookies or permissions may affect how the Platform works." },
    ],
  },
  {
    title: "8. Location Data",
    blocks: [
      { p: "You can allow or deny location access through your device settings. If you deny access, you can still enter your address manually, but some features, such as address auto-detection and live tracking, may not work. We use location data only for the purposes described in this Policy." },
    ],
  },
  {
    title: "9. Data Retention",
    blocks: [
      { p: "We retain personal data only for as long as needed for the purposes described in this Policy, or as required by law. Typically:" },
      {
        ul: [
          "Account data is retained while your account is active and for a reasonable period afterwards to handle disputes, claims, and legal requirements.",
          "Transaction and invoice records are retained for the period required under tax and accounting laws.",
          "Call recordings and chats are retained for a limited period, unless needed for an open complaint or legal matter.",
        ],
      },
      { p: "When data is no longer needed, we delete or anonymise it." },
    ],
  },
  {
    title: "10. Data Security",
    blocks: [
      { p: "We use reasonable technical, administrative and physical safeguards to protect your data, including encryption in transit, access controls, secure servers and periodic security reviews. However, no system is completely secure. You are responsible for keeping your login credentials and OTPs confidential. If we become aware of a personal data breach affecting you, we will notify you and the relevant authorities as required by law." },
    ],
  },
  {
    title: "11. Your Rights",
    blocks: [
      { p: "Subject to applicable law, you have the right to:" },
      {
        ul: [
          "**Access:** request a summary of the personal data we process about you and the parties we have shared it with.",
          "**Correction and updating:** request correction of inaccurate or incomplete data.",
          "**Erasure:** request deletion of your personal data, unless we need to retain it for legal or legitimate purposes.",
          "**Withdraw consent:** at any time, as described in Section 5.",
          "**Grievance redressal:** raise a complaint with our Grievance Officer (Section 15).",
          "**Nominate:** nominate another person to exercise your rights in the event of your death or incapacity.",
        ],
      },
      { p: "You can delete your account from the app settings or by writing to us. We may need to verify your identity before acting on a request. If you are not satisfied with our response, you may approach the Data Protection Board of India as provided under the DPDP Act." },
    ],
  },
  {
    title: "12. Children's Privacy",
    blocks: [
      { p: "The Platform is intended for users aged 18 years and above. We do not knowingly collect personal data from children. If we learn that we have collected data of a child without verifiable parental consent, we will delete it. Parents or guardians who believe their child has used the Platform may contact us." },
    ],
  },
  {
    title: "14. Cross-Border Transfers and Third-Party Links",
    blocks: [
      { p: "Your data may be stored or processed on servers located outside India by our service providers. Where this happens, we take steps to ensure appropriate safeguards and comply with applicable law." },
      { p: "The Platform may contain links to third-party websites or services. We are not responsible for their privacy practices, and we encourage you to read their policies." },
    ],
  },
  {
    title: "15. Contact Us and Grievance Redressal.",
    contact: true,
    blocks: [{ p: "If you have questions, concerns, or requests relating to this Policy or your personal data, please contact:" }],
  },
  {
    title: "16. Changes to This Policy",
    blocks: [
      { p: 'We may update this Privacy Policy from time to time to reflect changes in our practices, the Platform or the law. The updated version will be posted on the Platform with a new "Last Updated" date. For material changes, we will notify you through the app, email, or SMS. Your continued use of the Platform after the changes take effect means you accept the updated Policy.' },
    ],
  },
  {
    title: "17. Governing Law and Jurisdiction",
    blocks: [
      { p: "The laws of India govern this Policy. Subject to applicable law, the courts at [Delhi, India] shall have exclusive jurisdiction over any dispute arising from it." },
    ],
  },
];

const anchor = (title) => "s-" + title.split(".")[0];

/** Renders **bold** segments as <strong>. */
function Rich({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-[var(--ink)]">{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

function Block({ b }) {
  if (b.p) return <p className="text-[15px] leading-[1.75] text-[var(--body-text)]"><Rich text={b.p} /></p>;
  if (b.h3) return <h3 className="pt-2 text-[16.5px] font-bold text-[var(--ink)]">{b.h3}</h3>;
  if (b.label) return <p className="text-[15px] font-bold text-[var(--ink-soft)]">{b.label}</p>;
  if (b.ul)
    return (
      <ul className="space-y-2.5">
        {b.ul.map((t) => (
          <li key={t} className="relative pl-6 text-[15px] leading-[1.7] text-[var(--body-text)]">
            <span className="absolute left-1 top-[0.7em] h-1.5 w-1.5 rounded-full bg-purple-600" aria-hidden="true" />
            <Rich text={t} />
          </li>
        ))}
      </ul>
    );
  return null;
}

function ContactCard() {
  const row = "flex items-start gap-3 text-[15px] leading-relaxed text-[var(--body-text)]";
  const ico = "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-purple-700 shadow-[var(--shadow-sm)]";
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-soft)] p-5">
      <p className="text-[15px] leading-relaxed text-[var(--body-text)]">For questions, requests, or complaints about this notice or your data:</p>
      <p className={row}>
        <span className={ico}><Mail className="h-4 w-4" aria-hidden="true" /></span>
        <span>
          <strong className="font-semibold text-[var(--ink)]">Email:</strong> [{" "}
          <a href="mailto:info@mrserviceexpert.com" className="font-semibold text-purple-700 underline underline-offset-2 hover:text-purple-900">info@mrserviceexpert.com</a>]
        </span>
      </p>
      <p className={row}>
        <span className={ico}><Phone className="h-4 w-4" aria-hidden="true" /></span>
        <span>Phone: +91706505942</span>
      </p>
      <div className={row}>
        <span className={ico}><UserRound className="h-4 w-4" aria-hidden="true" /></span>
        <span>
          <span className="block font-semibold text-[var(--ink)]">Grievance Officer</span>
          Yogita Yadav, Associate
        </span>
      </div>
      <div className={row}>
        <span className={ico}><MapPin className="h-4 w-4" aria-hidden="true" /></span>
        <span>
          <span className="block font-semibold text-[var(--ink)]">Registered address</span>
          Unit 831, JMD Megapolis, Sohna Road, Sector 48, Gurugram, Haryana 122018
        </span>
      </div>
      <p className={row}>
        <span className={ico}><Clock className="h-4 w-4" aria-hidden="true" /></span>
        <span>
          <strong className="font-semibold text-[var(--ink)]">Response time:</strong> We aim to acknowledge complaints within [48 hours] and resolve them within [30 days].
        </span>
      </p>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-[var(--bg)] pb-16">
      <section className="border-b border-[var(--line)] bg-white">
        <Container className="py-8 sm:py-12">
          <Breadcrumbs items={[{ label: "Privacy Policy" }]} className="mb-5" />
          <div className="flex items-start gap-4">
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[0_10px_22px_-10px_rgba(98,41,205,.7)] sm:inline-flex">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-[30px] font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-[40px]">Privacy Policy</h1>
              <p className="mt-2 inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-[13px] font-semibold text-purple-800">
                Last Updated: {LAST_UPDATED}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="grid grid-cols-1 gap-8 pt-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-28 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-sm)]">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">On this page</p>
            <ol className="space-y-0.5">
              {SECTIONS.map((s) => (
                <li key={s.title}>
                  <a href={`#${anchor(s.title)}`} className="block rounded-lg px-2.5 py-1.5 text-[13.5px] leading-snug text-[var(--ink-soft)] transition hover:bg-purple-50 hover:text-purple-800">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="min-w-0 space-y-5">
          {SECTIONS.map((s) => (
            <section
              key={s.title}
              id={anchor(s.title)}
              aria-labelledby={`${anchor(s.title)}-h`}
              className="scroll-mt-28 rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7"
            >
              <h2 id={`${anchor(s.title)}-h`} className="mb-4 border-b border-[var(--line)] pb-3 text-[19px] font-bold leading-snug text-[var(--ink)] sm:text-[21px]">
                {s.title}
              </h2>
              <div className="space-y-4">
                {s.blocks.map((b, i) => (
                  <Block key={i} b={b} />
                ))}
                {s.contact && <ContactCard />}
              </div>
            </section>
          ))}
        </article>
      </Container>
    </main>
  );
}
