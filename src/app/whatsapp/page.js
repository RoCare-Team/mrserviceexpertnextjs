// app/page.js
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  FaWhatsapp,
  FaCheckCircle,
  FaTimes,
  FaMedal,
  FaComments,
  FaClock,
  FaShieldAlt,
  FaStar,
} from 'react-icons/fa';
import { HiLightningBolt } from 'react-icons/hi';

export default function Home() {
  const [showPopup, setShowPopup] = useState(false);
  const heroRef = useRef(null);
  const cardsRef = useRef(null);

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

    // Show popup after 2 seconds
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 2000);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const handleWhatsAppClick = () => {
    const phoneNumber = "8506096741";
    const message = "Chat%20Now";
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    setShowPopup(false);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
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

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-10 flex items-center justify-center px-4 animate-fadeIn">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClosePopup}></div>
          
          {/* Popup Card */}
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-md w-full border border-green-500/30 shadow-2xl shadow-green-500/20 animate-slideUp">
            {/* Close Button */}
            <button
              onClick={handleClosePopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>

            {/* Popup Content */}
            <div className="p-6 text-center">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4 animate-pulse">
                <FaWhatsapp className="w-8 h-8 text-white" />
              </div>

              {/* Headline */}
              <h3 className="text-2xl font-bold text-white mb-2">
                Get 10% OFF! 🎉
              </h3>
              
              {/* Subtext */}
              <p className="text-gray-300 text-sm mb-4">
                Chat with us on WhatsApp and get an exclusive discount instantly!
              </p>

              {/* Offer Cards */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <FaMedal className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                  <span className="text-xs text-gray-300">10% OFF</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <FaComments className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <span className="text-xs text-gray-300">Instant Reply</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <FaClock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <span className="text-xs text-gray-300">24/7 Support</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <FaShieldAlt className="w-4 h-4 text-green-400 mx-auto mb-1" />
                  <span className="text-xs text-gray-300">Trusted</span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="w-4 h-4 text-yellow-500" />
                ))}
                <span className="text-xs text-gray-400 ml-2">(10K+ reviews)</span>
              </div>

              {/* WhatsApp Button */}
              <button
                onClick={handleWhatsAppClick}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl py-3 px-4 font-bold flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/30"
              >
                <FaWhatsapp className="w-5 h-5" />
                Chat Now on WhatsApp
                <HiLightningBolt className="w-4 h-4" />
              </button>

              {/* Trust Indicators */}
              <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FaCheckCircle className="text-green-500 w-3 h-3" />
                  No spam
                </span>
                <span className="flex items-center gap-1">
                  <FaCheckCircle className="text-green-500 w-3 h-3" />
                  Free
                </span>
                <span className="flex items-center gap-1">
                  <FaCheckCircle className="text-green-500 w-3 h-3" />
                  Instant
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-1">
        {/* Hero Section - Compact */}
        <section
          ref={heroRef}
          className="min-h-screen flex flex-col items-center justify-center px-4 py-12 transition-all duration-700 transform opacity-0 translate-y-10"
        >
          <div className="max-w-6xl mx-auto text-center">
            {/* WhatsApp CTA Button */}
            <div className="mb-8">
              <button
                onClick={handleWhatsAppClick}
                className="group relative bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full px-8 py-3 md:px-10 md:py-4 text-lg md:text-xl font-bold shadow-2xl shadow-green-500/50 transition-all duration-300 transform hover:scale-105 animate-pulse-glow"
              >
                <div className="absolute inset-0 rounded-full bg-green-400 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative flex items-center gap-2 md:gap-3">
                  <FaWhatsapp className="w-5 h-5 md:w-7 md:h-7" />
                  <span>Chat Now on WhatsApp</span>
                  <HiLightningBolt className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </button>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-white via-green-300 to-green-400 bg-clip-text text-transparent">
                Chat With Us &amp;
              </span>
              <br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                Get 10% OFF Today!
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
              Fast replies, exclusive offers, expert support, and instant booking directly on WhatsApp.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs md:text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <FaCheckCircle className="text-green-400 w-3 h-3 md:w-4 md:h-4" />
                <span>No registration</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <FaCheckCircle className="text-green-400 w-3 h-3 md:w-4 md:h-4" />
                <span>Free consultation</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <FaCheckCircle className="text-green-400 w-3 h-3 md:w-4 md:h-4" />
                <span>Secure chat</span>
              </div>
            </div>

            {/* Mini Stats */}
            <div className="mt-8 flex justify-center gap-6">
              <div className="text-center">
                <div className="text-green-400 font-bold text-xl">10K+</div>
                <div className="text-gray-500 text-xs">Customers</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-bold text-xl">4.9</div>
                <div className="text-gray-500 text-xs">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-bold text-xl">24/7</div>
                <div className="text-gray-500 text-xs">Support</div>
              </div>
            </div>
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
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}