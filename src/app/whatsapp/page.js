// app/page.js
'use client';

import { useEffect, useRef } from 'react';
import {
  FaWhatsapp,
  FaCheckCircle,
} from 'react-icons/fa';
import { HiLightningBolt } from 'react-icons/hi';

export default function Home() {
  const heroRef = useRef(null);
  const cardsRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) observer.observe(heroRef.current);
    if (cardsRef.current) observer.observe(cardsRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);

    return () => observer.disconnect();
  }, []);

  const handleWhatsAppClick = () => {
    const phoneNumber = "8506096741"; 
    const message = "Chat%20Now";
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 overflow-x-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] -left-[10%] w-[500px] h-[500px] bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute bottom-[30%] right-[20%] w-[400px] h-[400px] bg-green-600/10 rounded-full blur-2xl animate-pulse delay-700"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-1">
        {/* Hero Section */}
        <section
          ref={heroRef}
          className="min-h-screen flex flex-col items-center justify-center px-3 md:px-6 py-8 md:py-20 transition-all duration-700 transform opacity-0 translate-y-10"
        >
            
          <div className="max-w-6xl mx-auto text-center">
            {/* Badge */}
            {/* <div className="inline-flex items-center gap-2 bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-full px-4 py-2 mb-8 animate-pulse">
              <HiLightningBolt className="text-green-400 w-5 h-5" />
              <span className="text-green-300 text-sm font-medium">Limited Time Offer</span>
            </div> */}

            {/* WhatsApp CTA Button */}
            <div className="mb-10">
              <button
                onClick={handleWhatsAppClick}
                className="group relative bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full px-10 py-2 md:py-5 text-xl font-bold shadow-2xl shadow-green-500/50 transition-all duration-300 transform hover:scale-105 animate-pulse-glow"
              >
                <div className="absolute inset-0 rounded-full bg-green-400 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative flex items-center gap-3">
                  <FaWhatsapp className="w-7 h-7" />
                  <span>Chat Now on WhatsApp</span>
                  <HiLightningBolt className="w-5 h-5" />
                </div>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <FaCheckCircle className="text-green-400 w-4 h-4" />
                <span>No registration</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <FaCheckCircle className="text-green-400 w-4 h-4" />
                <span>Free consultation</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <FaCheckCircle className="text-green-400 w-4 h-4" />
                <span>Secure chat</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold my-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-green-300 to-green-400 bg-clip-text text-transparent">
                Chat With Us &amp;
              </span>
              <br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                Get 10% OFF Today!
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Fast replies, exclusive offers, expert support, and instant booking directly on WhatsApp. 
              Join 10,000+ happy customers who trust us for instant solutions..
            </p>

            
          </div>
        </section>

      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
          }
          50% {
            box-shadow: 0 0 0 15px rgba(34, 197, 94, 0);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }
      `}</style>
    </div>
  );
}