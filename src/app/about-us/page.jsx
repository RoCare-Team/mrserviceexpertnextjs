import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, IndianRupee, MapPin, PhoneCall, ShieldCheck, Store, Tag, Users, Wrench, Handshake, Newspaper, BriefcaseBusiness, LifeBuoy } from "lucide-react";
import { Container, Section, SectionHeader, Card, Breadcrumbs, LinkCloud, btnPrimary, btnGhost, PHONE, PHONE_DISPLAY, SITE } from "@/app/components/public/ui";
import { SERVICE_GROUPS, TOP_CITIES } from "@/lib/serviceCatalog";

const URL = `${SITE}/about-us`;

export const metadata = {
  title: "About Us — India's Trusted Home Appliance Service Brand | Mr. Service Expert",
  description:
    "Mr. Service Expert brings trained, verified technicians to your doorstep for appliance repair, home care and handyman services in 1500+ cities. Learn who we are, how we work and why 8 million+ customers trust us.",
  alternates: { canonical: URL },
  openGraph: { title: "About Mr. Service Expert", url: URL, type: "website" },
};

// Same figures as the homepage "Numbers" strip.
const STATS = [
  { icon: Users, value: "8 Million+", label: "Happy customers" },
  { icon: MapPin, value: "1500+", label: "Cities served" },
  { icon: Tag, value: "300+", label: "Brands covered" },
  { icon: Store, value: "20,000+", label: "Retail stores" },
];

const VALUES = [
  { icon: BadgeCheck, title: "Trained & verified technicians", text: "Every professional is skill-tested and background-verified before their first visit." },
  { icon: IndianRupee, title: "Upfront, fair pricing", text: "You see the price before work starts. No hidden charges, no surprises." },
  { icon: Wrench, title: "Genuine spare parts", text: "Original parts and company-approved tools for repairs that last." },
  { icon: ShieldCheck, title: "Service warranty", text: "Limited warranty on the work done, with free follow-ups if the issue returns." },
  { icon: Clock, title: "On time, 7 days a week", text: "Same-day and next-day slots in most cities, including weekends and holidays." },
  { icon: PhoneCall, title: "Real people on call", text: `Our support team is a call away on ${PHONE_DISPLAY} to help before and after the visit.` },
];

const MORE_LINKS = [
  { icon: Wrench, title: "Our services", text: "Every service we offer, by category and city.", href: "/our-services" },
  { icon: Store, title: "Store locator", text: "Find a Mr. Service Expert store near you.", href: "/store-locator" },
  { icon: Handshake, title: "Join as a partner", text: "Technicians and service businesses — grow with us.", href: "/join-as-partner" },
  { icon: BriefcaseBusiness, title: "Careers", text: "Open roles in our teams across India.", href: "/careers" },
  { icon: Newspaper, title: "Blog", text: "Appliance care tips and how-to guides.", href: "/blogs" },
  { icon: LifeBuoy, title: "Help center", text: "Bookings, payments and service questions.", href: "/help-center" },
];

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Mr. Service Expert",
  url: URL,
  mainEntity: {
    "@type": "Organization",
    name: "Mr Service Expert",
    url: SITE,
    logo: `${SITE}/assets/images/serviceLogo.webp`,
    email: "info@mrserviceexpert.com",
    telephone: "+91-9311587715",
    address: {
      "@type": "PostalAddress",
      streetAddress: "8th Floor, Head Office, JMD MEGAPOLIS, Sector 48",
      addressLocality: "Gurgaon",
      addressRegion: "Haryana",
      addressCountry: "IN",
    },
    areaServed: "IN",
    sameAs: ["https://www.facebook.com/MrServiceExpert/", "https://www.linkedin.com/company/mr-service-expert/", "https://x.com/mrserviceexpert"],
  },
};

export default function AboutUsPage() {
  const appliances = SERVICE_GROUPS.find((g) => g.key === "appliance").items;
  const others = SERVICE_GROUPS.filter((g) => g.key !== "appliance").flatMap((g) => g.items);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }} />

      <Container className="pt-4 sm:pt-6">
        <Breadcrumbs items={[{ label: "About Us" }]} />
        <header className="mt-3 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow-md)] sm:p-10">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-purple-700">About us</p>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-[var(--ink)] sm:text-[38px]">
            Making home services <span className="text-purple-700">simple, honest and on time</span>
          </h1>
          <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-[var(--muted)]">
            Mr. Service Expert is one of India&apos;s most trusted names in home appliance repair and home services. We connect households with
            trained, verified technicians who come to your door, fix the problem properly and charge a fair, upfront price.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/our-services" className={btnPrimary}>
              Explore our services <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a href={`tel:${PHONE}`} className={btnGhost}>
              <PhoneCall className="h-4 w-4" aria-hidden="true" /> {PHONE_DISPLAY}
            </a>
          </div>
        </header>
      </Container>

      <Container>
        <Section>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STATS.map(({ icon: Icon, value, label }) => (
              <li key={label} className="flex items-center gap-3.5 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="leading-tight">
                  <b className="block text-xl font-extrabold text-[var(--ink)] sm:text-2xl">{value}</b>
                  <span className="text-[13px] font-semibold text-[var(--ink-soft)]">{label}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </Container>

      <Container>
        <Section className="!pt-0">
          <Card className="p-5 sm:p-8">
            <div className="prose-site max-w-none">
              <h2>Who we are</h2>
              <p>
                We started with a simple idea: getting an appliance repaired should not be stressful. Finding a reliable technician, knowing the
                real price and trusting the spare parts used were common worries for every home. Mr. Service Expert was built to solve exactly that.
              </p>
              <p>
                Today our network covers <strong>1500+ cities and towns</strong> — from metros like <Link href="/delhi">Delhi</Link>,{" "}
                <Link href="/mumbai">Mumbai</Link>, <Link href="/bangalore">Bangalore</Link> and <Link href="/hyderabad">Hyderabad</Link> to state
                capitals and growing towns — backed by 20,000+ retail stores and partner technicians trained on 300+ brands.
              </p>

              <h2>What we do</h2>
              <p>
                Our core is <strong>home appliance repair and maintenance</strong>:{" "}
                {appliances.map((s, i) => (
                  <span key={s.url}>
                    <Link href={`/${s.url}`}>{s.name}</Link>
                    {i < appliances.length - 2 ? ", " : i === appliances.length - 2 ? " and " : ""}
                  </span>
                ))}
                . We also offer home care and handyman services such as{" "}
                {others.slice(0, 6).map((s, i, arr) => (
                  <span key={s.url}>
                    <Link href={`/${s.url}`}>{s.name.toLowerCase()}</Link>
                    {i < arr.length - 2 ? ", " : i === arr.length - 2 ? " and " : ""}
                  </span>
                ))}
                . See the full list on our <Link href="/our-services">services page</Link>.
              </p>

              <h2>How we work</h2>
              <p>
                You book online or on call, choose a slot, and a verified technician visits with the tools and genuine parts needed. The price is
                agreed before any work starts, and every repair carries a service warranty with free follow-ups if the issue returns. Prefer to
                walk in? Use our <Link href="/store-locator">store locator</Link> to find a store near you.
              </p>

              <h2>Growing with our partners</h2>
              <p>
                Independent technicians and local service businesses grow with us as verified partners — they get steady leads from their own
                city and locality pages, and customers get trusted local experts. Interested? <Link href="/join-as-partner">Join as a partner</Link>.
              </p>
            </div>
          </Card>
        </Section>
      </Container>

      <Container>
        <Section className="!pt-0">
          <SectionHeader title="Why customers trust us" subtitle="The promises behind every visit" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-sm)]">
                <Icon className="h-6 w-6 text-purple-700" aria-hidden="true" />
                <h3 className="mt-2.5 text-[16px] font-bold text-[var(--ink)]">{title}</h3>
                <p className="mt-1 text-[14px] text-[var(--muted)]">{text}</p>
              </li>
            ))}
          </ul>
        </Section>
      </Container>

      <Container>
        <Section className="!pt-0">
          <LinkCloud
            id="cities"
            icon={MapPin}
            title="Where we serve"
            subtitle="Top cities — and 1500+ more across India"
            items={TOP_CITIES.map((c) => ({ href: `/${c.url}`, label: c.name, title: `Home services in ${c.name}` }))}
          />
        </Section>
      </Container>

      <Container>
        <Section className="!pt-0">
          <SectionHeader title="Explore more" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MORE_LINKS.map(({ icon: Icon, title, text, href }) => (
              <li key={href}>
                <Link href={href} className="group flex h-full items-start gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-sm)] hover:border-purple-300">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" aria-hidden="true" />
                  <span>
                    <b className="block text-[15px] text-[var(--ink)] group-hover:text-purple-800">{title}</b>
                    <span className="text-[13.5px] text-[var(--muted)]">{text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </Container>

      <Container>
        <Section className="!pt-0">
          <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="text-[20px] font-bold text-[var(--ink)]">Need a technician today?</h2>
              <p className="mt-1 text-[14.5px] text-[var(--muted)]">
                Head office: 8th Floor, JMD Megapolis, Sector 48, Gurgaon, Haryana. Write to us at info@mrserviceexpert.com or{" "}
                <Link href="/contact" className="font-semibold text-purple-700">contact us</Link>.
              </p>
            </div>
            <a href={`tel:${PHONE}`} className={btnPrimary}>
              <PhoneCall className="h-4 w-4" aria-hidden="true" /> Call {PHONE_DISPLAY}
            </a>
          </Card>
        </Section>
      </Container>
    </>
  );
}
