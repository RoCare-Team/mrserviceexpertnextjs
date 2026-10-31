"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Phone,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  Home,
  LayoutGrid,
  Users,
  LogIn,
  LogOut,
  CalendarCheck,
  LifeBuoy,
  Wrench,
  Sparkles,
  Hammer,
  Search,
} from "lucide-react";
import SearchBar from "../searchbar/index";
import PhoneVerification from "../PhoneVerification/PhoneVerification";
import { HOME_CARE_SERVICES, HANDYMAN_SERVICES } from "@/lib/homeCare";

const PHONE = "+919311587715";
const PHONE_DISPLAY = "+91 93115 87715";
const WHATSAPP = "https://wa.me/919311587715?text=Hi%2C%20I%20need%20help%20with%20a%20service%20booking";

/** WhatsApp brand mark (lucide has no brand icons). */
function WhatsAppIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.54-3.69 8.24-8.23 8.24m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28" />
    </svg>
  );
}

const APPLIANCES = [
  { name: "RO Water Purifier", url: "ro-water-purifier" },
  { name: "AC Repair", url: "ac" },
  { name: "Washing Machine", url: "washing-machine-repair" },
  { name: "Refrigerator", url: "refrigerator-repair" },
  { name: "Geyser", url: "geyser-repair" },
  { name: "Microwave", url: "microwav-repair" },
  { name: "LED TV", url: "led-tv-repair" },
  { name: "Kitchen Chimney", url: "kitchen-chimney-repair" },
  { name: "Air Purifier", url: "air-purifier-repair" },
  { name: "Vacuum Cleaner", url: "vacuum-cleaner-repair" },
];

const SERVICE_GROUPS = [
  { label: "Appliance repair", icon: Wrench, items: APPLIANCES },
  { label: "Home care", icon: Sparkles, items: HOME_CARE_SERVICES },
  { label: "Handyman", icon: Hammer, items: HANDYMAN_SERVICES },
];

const COMPLAINTS_API = "https://waterpurifierservicecenter.in/customer/ro_customer/all_complaints.php";

/**
 * Site header: logo, Services menu, Join as partner, call + WhatsApp,
 * search, call button, cart and account. On phones: logo + call + menu
 * drawer, plus the fixed bottom bar (Home / Services / Cart / Account).
 */
export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const servicesRef = useRef(null);
  const accountRef = useRef(null);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("userToken"));
  }, [showModal]);

  // Cart badge: count of distinct services in the local cart, kept in sync
  // with the add/remove flows via the "cartItemsUpdated" event.
  useEffect(() => {
    const update = () => {
      try {
        const items = JSON.parse(localStorage.getItem("cartItems")) || [];
        setCartCount(items.reduce((n, i) => n + (i?.quantity || 1), 0));
      } catch {
        setCartCount(0);
      }
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener("cartItemsUpdated", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("cartItemsUpdated", update);
    };
  }, []);

  // Close menus on outside click / Escape / route change.
  useEffect(() => {
    const down = (e) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target)) setServicesOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    const key = (e) => {
      if (e.key !== "Escape") return;
      setServicesOpen(false);
      setAccountOpen(false);
      setDrawer(false);
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, []);

  useEffect(() => {
    setDrawer(false);
    setServicesOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const refreshBookings = async () => {
    try {
      const res = await fetch(COMPLAINTS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_no: localStorage.getItem("userPhone") }),
      });
      const data = await res.json();
      localStorage.setItem("all_cmpl", JSON.stringify(data.complainDetails));
    } catch (err) {
      console.error("bookings refresh failed", err);
    }
  };

  const goBookings = async () => {
    setAccountOpen(false);
    setDrawer(false);
    await refreshBookings();
    router.push("/booking");
  };

  const logout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setAccountOpen(false);
    setDrawer(false);
    window.location.reload();
  };

  const login = () => {
    setAccountOpen(false);
    setDrawer(false);
    setShowModal(true);
  };

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));
  const linkCls = (on) =>
    `inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-[14px] font-semibold transition ${on ? "bg-purple-50 text-purple-800" : "text-[var(--ink-soft)] hover:bg-purple-50 hover:text-purple-800"}`;

  const AccountItem = ({ href, onClick, icon: Icon, children, danger }) => {
    const cls = `flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium ${danger ? "text-red-600 hover:bg-red-50" : "text-[var(--ink)] hover:bg-purple-50"}`;
    return href ? (
      <Link href={href} className={cls} onClick={() => setAccountOpen(false)}>
        <Icon className="h-4 w-4" aria-hidden="true" /> {children}
      </Link>
    ) : (
      <button type="button" className={cls} onClick={onClick}>
        <Icon className="h-4 w-4" aria-hidden="true" /> {children}
      </button>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-white/90 backdrop-blur-md">
        <div className="pub-container flex h-16 items-center gap-3">
          {/* Logo */}
          <Link href="/" title="Mr. Service Expert — Home" className="flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/serviceLogo.webp" alt="Mr. Service Expert" width={190} height={44} className="h-9 w-auto sm:h-10" />
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main" className="ml-2 hidden items-center gap-1.5 lg:flex xl:ml-6">
            <div ref={servicesRef} className="relative">
              <button
                type="button"
                onClick={() => setServicesOpen((v) => !v)}
                aria-expanded={servicesOpen}
                aria-haspopup="true"
                className={linkCls(servicesOpen)}
              >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" /> Services
                <ChevronDown className={`h-3.5 w-3.5 transition ${servicesOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {servicesOpen && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-[640px] rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-lg)]">
                  <div className="grid grid-cols-3 gap-4">
                    {SERVICE_GROUPS.map((g) => (
                      <div key={g.label}>
                        <p className="mb-1.5 flex items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-purple-700">
                          <g.icon className="h-3.5 w-3.5" aria-hidden="true" /> {g.label}
                        </p>
                        <ul>
                          {g.items.map((s) => (
                            <li key={s.url}>
                              <Link href={`/${s.url}`} className="block rounded-lg px-2 py-1.5 text-[13.5px] font-medium text-[var(--ink)] hover:bg-purple-50 hover:text-purple-800">
                                {s.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link href="/join-as-partner" className={`${linkCls(isActive("/join-as-partner"))} !text-purple-700`}>
              <Users className="h-4 w-4" aria-hidden="true" /> Join as partner
            </Link>
          </nav>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-2">
            <SearchBar className="hidden w-56 md:block lg:w-48 xl:w-80" />
            <a
              href={`tel:${PHONE}`}
              title={`Call ${PHONE_DISPLAY}`}
              className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-[image:var(--grad-brand)] px-3 text-[13.5px] font-semibold text-white shadow-[var(--shadow-cta)] transition hover:brightness-110 sm:px-4"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{PHONE_DISPLAY}</span>
              <span className="sm:hidden">Call</span>
            </a>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              title="Chat on WhatsApp"
              aria-label="Chat on WhatsApp"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_18px_-8px_rgba(37,211,102,.9)] transition hover:brightness-105 max-sm:hidden"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
            <Link href="/checkout" title="Cart" className="relative hidden h-10 w-10 items-center justify-center rounded-xl text-[var(--ink-soft)] hover:bg-purple-50 hover:text-purple-800 md:inline-flex">
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--amber)] px-1 text-[11px] font-bold text-white ring-2 ring-white">{cartCount}</span>
              )}
            </Link>
            <div ref={accountRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-expanded={accountOpen}
                aria-haspopup="true"
                title={isLoggedIn ? "Account" : "Login"}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition ${accountOpen ? "bg-purple-50 text-purple-800" : "text-[var(--ink-soft)] hover:bg-purple-50 hover:text-purple-800"}`}
              >
                <User className="h-5 w-5" aria-hidden="true" />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-56 rounded-2xl border border-[var(--line)] bg-white p-1.5 shadow-[var(--shadow-lg)]">
                  {isLoggedIn ? (
                    <>
                      <AccountItem href="/profile" icon={User}>Profile</AccountItem>
                      <AccountItem onClick={goBookings} icon={CalendarCheck}>My bookings</AccountItem>
                      <AccountItem href="/help-center" icon={LifeBuoy}>Help center</AccountItem>
                      <div className="my-1 border-t border-[var(--line)]" />
                      <AccountItem onClick={logout} icon={LogOut} danger>Logout</AccountItem>
                    </>
                  ) : (
                    <>
                      <AccountItem onClick={login} icon={LogIn}>Login / Sign up</AccountItem>
                      <AccountItem href="/help-center" icon={LifeBuoy}>Help center</AccountItem>
                      <div className="my-1 border-t border-[var(--line)]" />
                      <AccountItem href="/join-as-partner" icon={Users}>Join as partner</AccountItem>
                    </>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--ink-soft)] hover:bg-purple-50 lg:hidden"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / tablet drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
          <div className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-[var(--line)] px-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/images/serviceLogo.webp" alt="Mr. Service Expert" width={160} height={36} className="h-8 w-auto" />
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-purple-50">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <SearchBar className="mb-4" onNavigate={() => setDrawer(false)} />
              <Link href="/join-as-partner" className="mb-4 flex items-center gap-3 rounded-2xl bg-[image:var(--grad-brand-deep)] p-3.5 text-white shadow-[var(--shadow-md)]">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="leading-tight">
                  <b className="block text-[15px]">Join as a partner</b>
                  <span className="text-xs text-white/80">Technicians and service shops — get bookings</span>
                </span>
              </Link>
              <ul className="mb-4 flex flex-col">
                <li>
                  <Link href="/" className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-[15px] font-semibold text-[var(--ink)] hover:bg-purple-50">
                    <Home className="h-4.5 w-4.5 text-purple-600" aria-hidden="true" /> Home
                  </Link>
                </li>
              </ul>
              {SERVICE_GROUPS.map((g) => (
                <details key={g.label} className="pub-details group border-t border-[var(--line)]" open={g.label === "Appliance repair"}>
                  <summary className="flex items-center gap-3 px-2 py-3 text-[15px] font-semibold text-[var(--ink)]">
                    <g.icon className="h-4.5 w-4.5 text-purple-600" aria-hidden="true" />
                    <span className="flex-1">{g.label}</span>
                    <ChevronDown className="pub-chevron h-4 w-4 text-[var(--muted)] transition-transform" aria-hidden="true" />
                  </summary>
                  <ul className="pub-details-body grid grid-cols-2 gap-1 pb-3 pl-2">
                    {g.items.map((s) => (
                      <li key={s.url}>
                        <Link href={`/${s.url}`} className="block rounded-lg px-2 py-1.5 text-[13.5px] font-medium text-[var(--ink-soft)] hover:bg-purple-50 hover:text-purple-800">
                          {s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
              <div className="mt-2 border-t border-[var(--line)] pt-3">
                {isLoggedIn ? (
                  <ul className="flex flex-col">
                    <li><AccountItem href="/profile" icon={User}>Profile</AccountItem></li>
                    <li><AccountItem onClick={goBookings} icon={CalendarCheck}>My bookings</AccountItem></li>
                    <li><AccountItem href="/help-center" icon={LifeBuoy}>Help center</AccountItem></li>
                    <li><AccountItem onClick={logout} icon={LogOut} danger>Logout</AccountItem></li>
                  </ul>
                ) : (
                  <ul className="flex flex-col">
                    <li><AccountItem onClick={login} icon={LogIn}>Login / Sign up</AccountItem></li>
                    <li><AccountItem href="/help-center" icon={LifeBuoy}>Help center</AccountItem></li>
                  </ul>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-[var(--line)] p-4">
              <a href={`tel:${PHONE}`} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[image:var(--grad-brand)] text-[14px] font-semibold text-white shadow-[var(--shadow-cta)]">
                <Phone className="h-4 w-4" aria-hidden="true" /> Call us
              </a>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-[14px] font-semibold text-white shadow-[0_8px_18px_-8px_rgba(37,211,102,.9)]">
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom bar: floating pill, raised Call button in the middle. */}
      <nav aria-label="Quick" className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(10px,env(safe-area-inset-bottom))] md:hidden">
        <ul className="relative grid grid-cols-5 items-end rounded-[22px] border border-white/60 bg-white/90 shadow-[0_10px_30px_-8px_rgba(26,18,64,0.35)] ring-1 ring-[var(--line)] backdrop-blur-xl">
          {[
            { label: "Home", icon: Home, href: "/", on: pathname === "/" },
            { label: "Services", icon: LayoutGrid, onClick: () => setDrawer(true), on: drawer },
            { label: "Call", icon: Phone, href: `tel:${PHONE}`, raised: true },
            { label: "Cart", icon: ShoppingCart, href: "/checkout", on: pathname === "/checkout", badge: cartCount },
            isLoggedIn ? { label: "Account", icon: User, href: "/profile", on: pathname === "/profile" } : { label: "Login", icon: LogIn, onClick: login },
          ].map((it) => {
            if (it.raised) {
              return (
                <li key={it.label} className="flex justify-center">
                  <a href={it.href} title={`Call ${PHONE_DISPLAY}`} className="-mt-6 flex flex-col items-center gap-1">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[image:var(--grad-brand)] text-white shadow-[0_12px_24px_-8px_rgba(98,41,205,0.8)] ring-4 ring-white transition active:scale-95">
                      <it.icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="pb-2 text-[11px] font-bold text-purple-800">{it.label}</span>
                  </a>
                </li>
              );
            }
            const inner = (
              <>
                <span className={`relative inline-flex h-9 w-12 items-center justify-center rounded-2xl transition ${it.on ? "bg-purple-100 text-purple-800" : "text-[var(--muted)]"}`}>
                  <it.icon className={`h-[21px] w-[21px] ${it.on ? "stroke-[2.4]" : ""}`} aria-hidden="true" />
                  {it.badge > 0 && (
                    <span className="absolute -right-0.5 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--amber)] px-1 text-[10px] font-bold text-white ring-2 ring-white">{it.badge}</span>
                  )}
                </span>
                <span className={`text-[11px] font-semibold ${it.on ? "text-purple-800" : "text-[var(--muted)]"}`}>{it.label}</span>
              </>
            );
            const cls = "flex h-[62px] w-full flex-col items-center justify-center gap-0.5 active:scale-95 transition";
            return (
              <li key={it.label}>
                {it.href ? (
                  <Link href={it.href} className={cls} aria-current={it.on ? "page" : undefined}>{inner}</Link>
                ) : (
                  <button type="button" onClick={it.onClick} className={cls}>{inner}</button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <PhoneVerification setShowModal={setShowModal} showModal={showModal} />
    </>
  );
}
