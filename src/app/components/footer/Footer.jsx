'use client';

// Requires: npm install lucide-react
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Facebook,
  Twitter,
  Linkedin,
  MapPin,
  Phone,
  Mail,
  ArrowUp,
} from 'lucide-react';
import Image from 'next/image';

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'Blogs', href: '/blogs' },
  { label: 'Career', href: '/careers' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Store Locator', href: '/store-locator' },
];

const serviceLinks = [
  { label: 'AC Repair & Service', href: '/ac' },
  { label: 'RO Water Purifier', href: '/ro-water-purifier' },
  { label: 'Washing Machine Repair', href: '/washing-machine-repair' },
  { label: 'Refrigerator Repair', href: '/refrigerator-repair' },
  { label: 'Geyser Repair', href: '/geyser-repair' },
];

const bottomLinks = [
  { label: 'Home', href: '/' },
  { label: 'Terms', href: '/terms-and-conditions' },
  { label: 'Privacy Policy', href: '/privacy-and-policy' },
  { label: 'Career', href: '/careers' },
];

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/MrServiceExpert/', icon: Facebook },
  { label: 'Twitter', href: 'https://twitter.com/mrserviceexper4/', icon: Twitter },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/mr-service-expert/', icon: Linkedin },
];

export default function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-black text-gray-300">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block text-2xl font-bold text-white">
             <Image src="/assets/images/serviceLogo.webp" alt="Mr Service Expert Logo" width={150} height={50} />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Reliable home service experts for AC, RO, appliance repair, plumbing, plumbing work, and more-providing fast, affordable, and professional solutions trusted by thousands of happy customers across India.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-white transition-colors hover:bg-purple-500"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-semibold text-white">Quick Links</h3>
            <ul className="mt-4 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-purple-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-base font-semibold text-white">Our Services</h3>
            <ul className="mt-4 space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-purple-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-base font-semibold text-white">Contact Us</h3>
            <ul className="mt-4 space-y-4 text-sm text-gray-400">
              <li className="flex gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-purple-400" />
                <span>
                  Unit No. 831, 8th Floor, JMD Megapolis, Sohna Rd,
                  Sector-48, Gurugram, Haryana 122018
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="shrink-0 text-purple-400" />
                <a href="tel:+919311587715" className="transition-colors hover:text-purple-400">
                  +91-9311587715
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="shrink-0 text-purple-400" />
                <a
                  href="mailto:info@mrserviceexpert.com"
                  className="transition-colors hover:text-purple-400"
                >
                  info@mrserviceexpert.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-gray-500">
            <span>© {new Date().getFullYear()} Mr Service Expert</span>
            {bottomLinks.map((link) => (
              <span key={link.label} className="flex items-center gap-x-2">
                <span className="text-gray-700">|</span>
                <Link href={link.href} className="transition-colors hover:text-purple-400">
                  {link.label}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* Scroll to top */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-gray-700 text-white shadow-lg transition-all duration-300 hover:bg-purple-500 ${
          showScrollTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <ArrowUp size={20} />
      </button>
    </footer>
  );
}