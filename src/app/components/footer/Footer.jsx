"use client"
import React from "react";
import StateLinks from "../stateLinks/StateLinks";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-10 px-6">
      {/* bg-gradient-to-r from-indigo-800 to-purple-900 */}
      <div className="flex flex-col gap-8">



        {/* Useful Links */}
        <div>
          <h3 className="text-lg font-semibold ">Useful Links</h3>
          <ul className="space-y-2 p-0  flex items-center gap-4 mb-0 flex-wrap ">
            <li className="text-xl hover:text-purple-400 transition mb-0"><strong>Services</strong></li>
            <li className="mb-0"><a href="#" className="mb-0 hover:text-yellow-400 transition">Kent Service</a></li>
            <li className="mb-0"><a href="#" className=" mb-0 hover:text-yellow-400 transition">Pureit Service</a></li>
            <li className="mb-0"><a href="#" className="mb-0 hover:text-yellow-400 transition">Livpure Service</a></li>
            <li className="mb-0"><a href="#" className="mb-0 hover:text-yellow-400 transition">Water Purifier Service</a></li>
          </ul>
        </div>



        {/* Kent RO Popular Cities */}
        <div className="mb-2.5">
          <h3 className="text-lg font-semibold mb-4">Service in Popular Cities</h3>
          <div className="flex flex-wrap gap-2">
            {["Gurgaon",
              "Delhi",
              "Mumbai",
              "Bangalore",
              "Hyderabad",
              "Ahmedabad",
              "Chennai",
              "Kolkata",
              "Noida",
              "Ghaziabad",
              "Faridabad",
              "Surat",
              "Pune",
              "Jaipur",
              "Lucknow",
              "Kanpur",
              "Thane",
              "Patna",
              "Indore",
              "Bhopal",
              "Ranchi",
              "Greater Noida",
              "Meerut",
              "Varanasi",
              "Allahabad",
              "Prayagraj",
              "Chandigarh"].map((item,index) => (
                <a
                  key={index}
                  href={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className=" text-white px-3 py-1  text-sm hover:text-yellow-300 transition"
                >
                  {item}
                </a>
              ))}
          </div>
        </div>
        {/* RO Service Popular Cities */}
        <div>
          <StateLinks />
        </div>

        {/* Contact Info */}
        <div className=" contact-footer-style ">
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <p className="text-sm leading-relaxed">
              Shop 22, Malibu Town, Sector 47,<br />
              Gurugram, Haryana 122018
            </p>

          </div>
          <div className="flex space-x-3 socialLinks">
            <a href="https://x.com/RoCareIndia" target='_blank' rel="noopener noreferrer" className="hover:text-yellow-400 transition text-xl"><img src="/assets/images/socialIcons/twitter.png" alt="" className="w-10 h-10" /></a>
            <a href="https://www.instagram.com/rocareindia/" target='_blank' rel="noopener noreferrer" className="hover:text-yellow-400 transition text-xl"><img src="/assets/images/socialIcons/insta.svg" alt="" className="w-10 h-10" /></a>
            <a href="https://www.linkedin.com/company/rocareindia/" target='_blank' rel="noopener noreferrer" className="hover:text-yellow-400 transition text-xl"><img src="/assets/images/socialIcons/linkdnn.svg" alt="" className="w-10 h-10" /></a>
          </div>
        </div>

      </div>
      {/* Footer Bottom */}
      <div className="mt-10 text-center text-sm border-t border-gray-500 pt-6">
        © {new Date().getFullYear()} RO Customer Care |
        <a href="/" target='_blank' rel="noopener noreferrer" className="hover:text-yellow-400 transition mx-2">Home</a> |
        <a href="/terms-and-conditions" target='_blank' rel="noopener noreferrer" className="hover:text-yellow-400 transition mx-2">Terms</a> |
        <a href="/privacy-and-policy" target='_blank' rel="noopener noreferrer" className="hover:text-yellow-400 transition mx-2">Privacy Policy</a> |
        <a href="/contact" target='_blank' rel="noopener noreferrer" className="hover:text-yellow-400 transition mx-2">Contact</a>|
        <a href="/careers" target='_blank' rel="noopener noreferrer" className="hover:text-yellow-400 transition mx-2">Career</a>

      </div>

      {/* Scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="scrollUpBtn"
        aria-label="Scroll to top"
      >
        ↑
      </button>
    </footer>
  );
};

export default Footer;