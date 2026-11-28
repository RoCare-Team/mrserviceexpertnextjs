import Link from "next/link";
import { ArrowRight, CalendarCheck, ShieldCheck, Wrench, PhoneCall, MapPin } from "lucide-react";
import { Container, Section, SectionHeader, Card, Breadcrumbs, LinkCloud, Faq, TrustStrip, btnPrimary, btnGhost, PHONE, PHONE_DISPLAY, SITE } from "@/app/components/public/ui";
import { SERVICE_GROUPS, ALL_SERVICES, TOP_CITIES } from "@/lib/serviceCatalog";

const URL = `${SITE}/our-services`;

export const metadata = {
  title: "Our Services — Appliance Repair, Home Care & Handyman | Mr. Service Expert",
  description:
    "All Mr. Service Expert services in one place: RO, AC, washing machine, refrigerator, geyser, TV and chimney repair, home cleaning, pest control, plumber, electrician and more — at your doorstep across India.",
  alternates: { canonical: URL },
  openGraph: { title: "Our Services | Mr. Service Expert", url: URL, type: "website" },
};

// City links shown under each service card (the full list is further down).
const CARD_CITIES = TOP_CITIES.slice(0, 6);

const STEPS = [
  { icon: CalendarCheck, title: "Book in a minute", text: "Pick a service online or call us. Choose a time slot that suits you." },
  { icon: Wrench, title: "Expert at your door", text: "A trained, verified technician arrives on time with the right tools and parts." },
  { icon: ShieldCheck, title: "Pay after the job", text: "Upfront pricing, genuine parts and a service warranty on the work done." },
];

const FAQS = [
  { q: "Which cities do you provide services in?", a: "We serve 1500+ cities and towns across India, including Delhi NCR, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata, Pune and all state capitals. Open your city's page to see the services available there." },
  { q: "Do you repair all brands?", a: "Yes. Our technicians are trained on 300+ brands of home appliances, and every brand-specific page lists the brands we service in your city." },
  { q: "How do I book a service?", a: `Choose the service below and book online, or call ${PHONE_DISPLAY}. Most bookings get a technician visit within 24 hours.` },
  { q: "Is there a warranty on repairs?", a: "Yes. Repairs come with a limited service warranty and free follow-up visits if the same issue comes back within the warranty period." },
];

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Mr. Service Expert services",
  url: URL,
  itemListElement: ALL_SERVICES.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name, url: `${SITE}/${s.url}` })),
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function OurServicesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <Container className="pt-4 sm:pt-6">
        <Breadcrumbs items={[{ label: "Our Services" }]} />
        <header className="mt-3 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow-md)] sm:p-10">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-purple-700">Our services</p>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-[var(--ink)] sm:text-[38px]">
            Every home service you need, <span className="text-purple-700">from one trusted team</span>
          </h1>
          <p className="mt-3 max-w-3xl text-[15.5px] text-[var(--muted)]">
            From appliance repair to deep cleaning and everyday handyman jobs — {ALL_SERVICES.length} services delivered at your doorstep by trained,
            background-verified professionals in 1500+ cities across India.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={`tel:${PHONE}`} className={btnPrimary}>
              <PhoneCall className="h-4 w-4" aria-hidden="true" /> Call {PHONE_DISPLAY}
            </a>
            <Link href="/about-us" className={btnGhost}>
              About Mr. Service Expert
            </Link>
          </div>
          <nav aria-label="Service groups" className="mt-6 flex flex-wrap gap-2">
            {SERVICE_GROUPS.map((g) => (
              <a key={g.key} href={`#${g.key}`} className="rounded-full bg-purple-50 px-3 py-1.5 text-[13px] font-semibold text-purple-800 hover:bg-purple-100">
                {g.title}
              </a>
            ))}
          </nav>
        </header>
      </Container>

      <Container>
        {SERVICE_GROUPS.map((g) => (
          <Section key={g.key} id={g.key} className="scroll-mt-24">
            <SectionHeader title={g.title} subtitle={g.subtitle} />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((s) => (
                <li key={s.url}>
                  <Card className="flex h-full flex-col p-5">
                    <Link href={`/${s.url}`} className="group flex items-start gap-3.5">
                      <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50">
                        {s.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.image} alt="" loading="lazy" className="h-10 w-10 object-contain" />
                        ) : (
                          <Wrench className="h-6 w-6 text-purple-700" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <h3 className="text-[16.5px] font-bold text-[var(--ink)] group-hover:text-purple-800">{s.name}</h3>
                        {s.blurb && <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--muted)]">{s.blurb}</p>}
                      </span>
                    </Link>
                    <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--line)] pt-3">
                      {CARD_CITIES.map((c) => (
                        <Link key={c.url} href={`/${c.url}/${s.url}`} title={`${s.name} in ${c.name}`} className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[12px] font-medium text-[var(--ink-soft)] hover:border-purple-300 hover:text-purple-800">
                          {c.name}
                        </Link>
                      ))}
                    </div>
                    <Link href={`/${s.url}`} className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-purple-700 hover:text-purple-900">
                      View {s.name} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Card>
                </li>
              ))}
            </ul>
          </Section>
        ))}
      </Container>

      <Container>
        <Section className="!pt-0">
          <SectionHeader title="How it works" subtitle="Simple, transparent and on time" />
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-sm)]">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-[16px] font-bold text-[var(--ink)]">
                  {i + 1}. {title}
                </h3>
                <p className="mt-1 text-[14px] text-[var(--muted)]">{text}</p>
              </li>
            ))}
          </ol>
        </Section>
      </Container>

      <Container>
        <Section className="!pt-0">
          <LinkCloud
            id="cities"
            icon={MapPin}
            title="Services in your city"
            subtitle="Open your city to see every service, price and nearby technician"
            items={TOP_CITIES.map((c) => ({ href: `/${c.url}`, label: c.name, title: `Home services in ${c.name}` }))}
          />
        </Section>
      </Container>

      <Container>
        <Section className="!pt-0">
          <Faq id="services-faq" title="Frequently asked questions" items={FAQS} />
        </Section>
      </Container>

      <Container>
        <Section className="!pt-0">
          <TrustStrip />
        </Section>
      </Container>
    </>
  );
}
