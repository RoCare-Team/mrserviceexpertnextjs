// Shared, hook-free building blocks for the public pages (home, city,
// category, city+category, city+brand+category). Every piece renders in both
// server and client trees. Visual language: white cards on the soft brand
// background, purple as the single accent, amber only for ratings.

import Link from "next/link";
import { ChevronDown, ChevronRight, Home, MapPin, Phone, ShieldCheck, Clock, BadgeCheck, Wrench, Star } from "lucide-react";

export const SITE = "https://www.mrserviceexpert.com";
export const PHONE = "+919311587715";
export const PHONE_DISPLAY = "+91 93115 87715";

export const cardCls = "rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-sm)]";
export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[image:var(--grad-brand)] px-5 text-[15px] font-semibold text-white shadow-[var(--shadow-cta)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";
export const btnGhost =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--line-strong)] bg-white px-5 text-[15px] font-semibold text-[var(--ink-soft)] transition hover:border-purple-300 hover:bg-purple-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";
export const chipCls =
  "inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-[13px] font-medium text-[var(--ink-soft)] transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-800";

export function Container({ className = "", children, as: Tag = "div", ...rest }) {
  return (
    <Tag className={`pub-container ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/** Vertical rhythm between page blocks. */
export function Section({ className = "", children, ...rest }) {
  return (
    <section className={`py-6 sm:py-8 ${className}`} {...rest}>
      {children}
    </section>
  );
}

export function SectionHeader({ eyebrow, title, subtitle, action, align = "left", as: Tag = "h2", id }) {
  const center = align === "center";
  return (
    <div className={`mb-5 flex flex-wrap items-end gap-3 sm:mb-6 ${center ? "justify-center text-center" : ""}`}>
      <div className={center ? "w-full" : "min-w-0 flex-1"}>
        {eyebrow && <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-purple-700">{eyebrow}</p>}
        <Tag id={id} className="text-[22px] font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-[26px]">
          {title}
        </Tag>
        {subtitle && <p className={`mt-1.5 text-[15px] text-[var(--muted)] ${center ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Card({ className = "", children, as: Tag = "div", ...rest }) {
  return (
    <Tag className={`${cardCls} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/** Card header row: gradient icon tile + title (+ optional right slot). */
export function CardTitle({ icon: Icon, title, aside, as: Tag = "h2", id, tone = "purple" }) {
  const tones = {
    purple: "from-purple-500 to-purple-700 shadow-[0_6px_14px_-6px_rgba(98,41,205,.6)]",
    amber: "from-amber-400 to-orange-500 shadow-[0_6px_14px_-6px_rgba(224,137,0,.6)]",
    green: "from-emerald-400 to-emerald-600 shadow-[0_6px_14px_-6px_rgba(18,147,77,.6)]",
  };
  return (
    <div className="mb-4 flex items-center gap-3 border-b border-[var(--line)] pb-3.5">
      {Icon && (
        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${tones[tone]}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
      <Tag id={id} className="min-w-0 flex-1 text-[17px] font-bold leading-snug text-[var(--ink)] sm:text-lg">
        {title}
      </Tag>
      {aside && <div className="shrink-0 text-xs font-medium text-[var(--muted)]">{aside}</div>}
    </div>
  );
}

/**
 * Breadcrumb trail + BreadcrumbList JSON-LD. items: [{ label, href }] — the
 * last item is the current page and is not linked.
 */
export function Breadcrumbs({ items, className = "" }) {
  const list = [{ label: "Home", href: "/" }, ...items.filter((i) => i && i.label)];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE}${c.href}` } : {}),
    })),
  };
  return (
    <nav aria-label="Breadcrumb" className={`min-w-0 ${className}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[13px] text-[var(--muted)]">
        {list.map((c, i) => {
          const last = i === list.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {i === 0 ? (
                <Link href="/" className="inline-flex items-center gap-1 hover:text-purple-700" title="Home">
                  <Home className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">Home</span>
                </Link>
              ) : last || !c.href ? (
                <span className="truncate font-medium text-[var(--ink-soft)]" aria-current={last ? "page" : undefined}>
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="truncate hover:text-purple-700">
                  {c.label}
                </Link>
              )}
              {!last && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--line-strong)]" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * A titled cloud of chip links (cities, brands, related services). The first
 * `max` are visible; the rest sit behind a "+N more" toggle (native details,
 * so it works without JS and every link stays in the DOM for crawlers).
 */
export function LinkCloud({ title, subtitle, items = [], max = 30, icon: Icon = MapPin, id, className = "" }) {
  const list = items.filter((i) => i && i.href && i.label);
  if (!list.length) return null;
  const head = list.slice(0, max);
  const rest = list.slice(max);
  const Chip = ({ item }) => (
    <li>
      <Link href={item.href} title={item.title || item.label} className={chipCls}>
        {Icon && <Icon className="h-3.5 w-3.5 text-purple-500" aria-hidden="true" />}
        {item.label}
      </Link>
    </li>
  );
  return (
    <Card as="section" id={id} className={`p-5 sm:p-6 ${className}`} aria-labelledby={id ? `${id}-h` : undefined}>
      <div className="mb-4">
        <h2 id={id ? `${id}-h` : undefined} className="text-[17px] font-bold text-[var(--ink)] sm:text-lg">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>
      <ul className="flex flex-wrap gap-2">
        {head.map((item) => (
          <Chip key={item.href} item={item} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="pub-details group">
          <summary className="mt-3 inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-full bg-purple-50 px-3.5 text-[13px] font-semibold text-purple-800 hover:bg-purple-100">
            <span className="group-open:hidden">Show {rest.length} more</span>
            <span className="hidden group-open:inline">Show less</span>
            <ChevronDown className="pub-chevron h-3.5 w-3.5 transition-transform" aria-hidden="true" />
          </summary>
          <ul className="pub-details-body mt-3 flex flex-wrap gap-2">
            {rest.map((item) => (
              <Chip key={item.href} item={item} />
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

/** One expandable row. Native <details>; `name` groups rows so one opens at a time. */
export function Disclosure({ title, children, name, open = false, className = "" }) {
  return (
    <details name={name} open={open || undefined} className={`pub-details group rounded-xl border border-[var(--line)] bg-white transition open:border-purple-200 open:shadow-[var(--shadow-sm)] ${className}`}>
      <summary className="flex items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-[var(--ink)] sm:px-5">
        <span className="min-w-0 flex-1">{title}</span>
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-700">
          <ChevronDown className="pub-chevron h-4 w-4 transition-transform" aria-hidden="true" />
        </span>
      </summary>
      <div className="pub-details-body prose-site border-t border-[var(--line)] px-4 py-4 text-[14.5px] sm:px-5">{children}</div>
    </details>
  );
}

/** FAQ list. items: [{ q, a }] — `a` may be a string or JSX. */
export function Faq({ items = [], title = "Frequently asked questions", subtitle, id = "faq" }) {
  const list = items.filter((i) => i && i.q && i.a);
  if (!list.length) return null;
  return (
    <section id={id} aria-labelledby={`${id}-h`}>
      <SectionHeader id={`${id}-h`} title={title} subtitle={subtitle} />
      <div className="flex flex-col gap-2.5">
        {list.map((f, i) => (
          <Disclosure key={i} name={id} title={f.q} open={i === 0}>
            {typeof f.a === "string" ? <p>{f.a}</p> : f.a}
          </Disclosure>
        ))}
      </div>
    </section>
  );
}

const TRUST = [
  { icon: Clock, label: "Doorstep in 30 min", hint: "Technician at your door, same day" },
  { icon: BadgeCheck, label: "Verified technicians", hint: "Background-checked and trained" },
  { icon: Wrench, label: "Genuine spare parts", hint: "Brand-compliant parts only" },
  { icon: ShieldCheck, label: "Service warranty", hint: "Free follow-up if the issue persists" },
];

/** Four trust points in a row (hero bottom / sidebar). */
export function TrustStrip({ compact = false, className = "" }) {
  return (
    <ul className={`grid grid-cols-2 gap-2 ${compact ? "" : "sm:grid-cols-4"} ${className}`}>
      {TRUST.map(({ icon: Icon, label, hint }) => (
        <li key={label} className="flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 leading-tight">
            <b className="block truncate text-[13px] font-semibold text-[var(--ink)]">{label}</b>
            {!compact && <span className="block truncate text-[11px] text-[var(--muted)]">{hint}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function RatingPill({ value = 4.8, count = "30K+", className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-semibold text-amber-800 ${className}`}>
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
      {value}
      <span className="font-medium text-amber-700/80">({count} reviews)</span>
    </span>
  );
}

export function CallButton({ className = "", label = "Call now" }) {
  return (
    <a href={`tel:${PHONE}`} className={`${btnPrimary} ${className}`} title={`Call ${PHONE_DISPLAY}`}>
      <Phone className="h-4 w-4" aria-hidden="true" /> {label}
    </a>
  );
}

/**
 * Hero for a service / city landing page: breadcrumb, h1, subtitle, trust
 * row and CTAs on the left; the category banner on the right.
 */
export function ServiceHero({ crumbs = [], eyebrow, title, subtitle, image, imageAlt = "", chips, cta = true, compact = false, children }) {
  // Compact: service pages — the services themselves are the content, so the
  // hero is one tight card: breadcrumb, H1, one line, a few proof chips.
  if (compact) {
    return (
      <header className={`${cardCls} relative overflow-hidden px-4 py-4 sm:px-6 sm:py-5`}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(520px 200px at 0% -40%, rgba(109,42,216,0.10), transparent 60%)" }}
        />
        <div className="relative flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1">
            {crumbs.length > 0 && <Breadcrumbs items={crumbs} className="mb-2" />}
            <h1 className="text-[22px] font-extrabold leading-[1.2] tracking-tight text-[var(--ink)] sm:text-[26px] lg:text-[30px]">{title}</h1>
            {subtitle && <p className="mt-1.5 line-clamp-2 max-w-2xl text-[13.5px] leading-snug text-[var(--muted)] sm:text-[14.5px]">{subtitle}</p>}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <RatingPill />
              {chips}
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-800">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Doorstep in 30 min
              </span>
              <span className="hidden items-center gap-1 rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-[12px] font-semibold text-[var(--ink-soft)] ring-1 ring-[var(--line)] sm:inline-flex">
                <BadgeCheck className="h-3.5 w-3.5 text-purple-600" aria-hidden="true" /> Verified technicians
              </span>
              <span className="hidden items-center gap-1 rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-[12px] font-semibold text-[var(--ink-soft)] ring-1 ring-[var(--line)] sm:inline-flex">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-600" aria-hidden="true" /> Service warranty
              </span>
            </div>
          </div>
          {cta && (
            <a href={`tel:${PHONE}`} className={`${btnGhost} !min-h-10 !px-4 max-lg:!hidden`} title={`Call ${PHONE_DISPLAY}`}>
              <Phone className="h-4 w-4" aria-hidden="true" /> {PHONE_DISPLAY}
            </a>
          )}
          {children}
        </div>
      </header>
    );
  }

  return (
    <header className={`${cardCls} relative overflow-hidden`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(760px 320px at 0% -20%, rgba(109,42,216,0.10), transparent 60%), radial-gradient(560px 280px at 100% 0%, rgba(246,162,30,0.10), transparent 55%)",
        }}
      />
      <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-10 lg:p-9">
        <div className="min-w-0">
          {crumbs.length > 0 && <Breadcrumbs items={crumbs} className="mb-4" />}
          {eyebrow && <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-purple-700">{eyebrow}</p>}
          <h1 className="text-[26px] font-extrabold leading-[1.15] tracking-tight text-[var(--ink)] sm:text-[32px] lg:text-[38px]">{title}</h1>
          {subtitle && <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--body-text)] sm:text-base">{subtitle}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <RatingPill />
            {chips}
          </div>
          {cta && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              <a href="#services" className={btnPrimary}>
                Book a service
              </a>
              <a href={`tel:${PHONE}`} className={btnGhost} title={`Call ${PHONE_DISPLAY}`}>
                <Phone className="h-4 w-4" aria-hidden="true" /> {PHONE_DISPLAY}
              </a>
            </div>
          )}
          {children}
        </div>
        {image && (
          <div className="relative hidden overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] shadow-[var(--shadow-md)] lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={imageAlt} width={475} height={345} loading="eager" className="h-auto w-full object-cover" />
          </div>
        )}
      </div>
      <div className="relative border-t border-[var(--line)] bg-[var(--surface-soft)]/70 px-5 py-3.5 sm:px-7 lg:px-9">
        <TrustStrip />
      </div>
    </header>
  );
}

/** 2/3 + 1/3 layout for service pages; the aside sticks on desktop. */
export function TwoThirds({ main, aside, className = "" }) {
  return (
    <div className={`grid gap-6 lg:grid-cols-5 lg:items-start ${className}`}>
      <div className="min-w-0 lg:col-span-3">{main}</div>
      <aside className="pub-sticky min-w-0 lg:col-span-2">{aside}</aside>
    </div>
  );
}
