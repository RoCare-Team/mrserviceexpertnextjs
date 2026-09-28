"use client";

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, User, Loader2, CheckCircle2 } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';

const PHONE = '+91-9311587715';
const EMAIL = 'info@mrserviceexpert.com';
const ADDRESS = 'Unit No. 831, 8th Floor, JMD Megapolis, Sohna Road, Sector-48, Gurugram, Haryana 122018';
const MAP_SRC = `https://maps.google.com/maps?q=${encodeURIComponent('JMD Megapolis, Sohna Road, Sector 48, Gurugram')}&z=15&output=embed`;

const INITIAL = { name: '', phone: '', email: '', subject: '', message: '', website: '' };

const CONTACT_CARDS = [
  { icon: Phone, title: 'Call us', value: PHONE, href: `tel:${PHONE}`, hint: 'Fastest way to book a service' },
  { icon: MessageCircle, title: 'WhatsApp', value: 'Chat with us', href: 'https://wa.me/919311587715', hint: 'Quick replies on WhatsApp', external: true },
  { icon: Mail, title: 'Email', value: EMAIL, href: `mailto:${EMAIL}`, hint: 'We reply within 24 hours' },
  { icon: Clock, title: 'Working hours', value: 'Open 24 × 7', hint: 'All days, including holidays' },
];

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100';

function FieldIcon({ icon: Icon, children }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
      {children}
    </div>
  );
}

export default function ContactPage() {
  const [formData, setFormData] = useState(INITIAL);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^(\+?91|0)?[6-9]\d{9}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, page_url: window.location.href }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(data.message || 'Your message has been sent. Our team will contact you soon.');
      setFormData(INITIAL);
      setSent(true);
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white">
      <ToastContainer />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-purple-600 to-fuchsia-600 text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-14 sm:px-6 md:pt-20">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            We&apos;re here to help
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">Contact Us</h1>
          <p className="mt-3 max-w-2xl text-base text-purple-100 md:text-lg">
            Have a question about a repair, a booking or a complaint? Send us a message and our
            support team will get back to you shortly.
          </p>
        </div>
      </section>

      <div className="relative mx-auto -mt-20 max-w-6xl px-4 pb-16 sm:px-6">
        {/* Quick contact cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTACT_CARDS.map(({ icon: Icon, title, value, href, hint, external }) => {
            const body = (
              <>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 transition group-hover:bg-purple-600 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
                  <p className="mt-0.5 truncate font-semibold text-gray-900">{value}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{hint}</p>
                </div>
              </>
            );
            const cls = 'group flex items-start gap-3 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg';
            return href ? (
              <a key={title} href={href} title={value} className={cls} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {body}
              </a>
            ) : (
              <div key={title} className={cls}>{body}</div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Form */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-purple-100/50 sm:p-8 lg:col-span-3">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <CheckCircle2 className="h-8 w-8" />
                </span>
                <h2 className="mt-5 text-2xl font-bold text-gray-900">Thank you!</h2>
                <p className="mt-2 max-w-sm text-gray-600">
                  Your message has been received. Our team will call or email you soon.
                  For urgent help, call <a href={`tel:${PHONE}`} className="font-semibold text-purple-700">{PHONE}</a>.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-6 rounded-xl border border-purple-200 px-5 py-2.5 font-semibold text-purple-700 transition hover:bg-purple-50"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900">Send us a message</h2>
                <p className="mt-1 text-sm text-gray-500">Fields marked * are required.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate={false}>
                  {/* Honeypot — hidden from humans */}
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldIcon icon={User}>
                      <input
                        name="name"
                        required
                        minLength={2}
                        maxLength={120}
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name *"
                        autoComplete="name"
                        className={`${inputCls} pl-11`}
                      />
                    </FieldIcon>
                    <FieldIcon icon={Phone}>
                      <input
                        name="phone"
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={14}
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Mobile number *"
                        autoComplete="tel"
                        className={`${inputCls} pl-11`}
                      />
                    </FieldIcon>
                  </div>

                  <FieldIcon icon={Mail}>
                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={160}
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email address *"
                      autoComplete="email"
                      className={`${inputCls} pl-11`}
                    />
                  </FieldIcon>

                  <input
                    name="subject"
                    maxLength={160}
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Subject (e.g. RO service, AC repair, complaint)"
                    className={inputCls}
                  />

                  <div>
                    <textarea
                      name="message"
                      required
                      minLength={5}
                      maxLength={3000}
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="How can we help you? *"
                      className={`${inputCls} resize-y`}
                    />
                    <p className="mt-1 text-right text-xs text-gray-400">{formData.message.length}/3000</p>
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-purple-200 transition hover:from-purple-700 hover:to-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {sending ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="h-5 w-5" /> Send Message</>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Office + map */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="rounded-3xl border border-purple-100 bg-purple-50/60 p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-purple-800">
                <MapPin className="h-5 w-5" /> Head Office
              </h3>
              <p className="mt-2 leading-relaxed text-gray-700">{ADDRESS}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-purple-700 hover:underline"
              >
                Get directions →
              </a>
            </div>
            <div className="min-h-[280px] flex-1 overflow-hidden rounded-3xl border border-gray-100 shadow-sm">
              <iframe
                title="Mr. Service Expert head office location"
                src={MAP_SRC}
                className="h-full min-h-[280px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
