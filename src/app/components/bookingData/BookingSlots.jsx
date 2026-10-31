"use client";

import React, { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, CalendarDays, Check, Pencil } from "lucide-react";
import { toast } from "react-toastify";
import AdressModal from "../modals/AdressModal";
import TimeSlotModal from "../modals/TimeSlotModal";

// Defined at module level on purpose: an inline component would get a new
// identity on every render and remount its children (and the modals inside
// them) each time the checkout refreshes.
const Step = ({ n, icon: Icon, title, done, children, disabled }) => (
  <li className={`relative flex gap-3 ${disabled ? "opacity-50" : ""}`}>
    <span
      className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ring-4 ring-white ${
        done ? "bg-emerald-500 text-white" : "bg-purple-100 text-purple-800"
      }`}
    >
      {done ? <Check className="h-4 w-4" aria-hidden="true" /> : n}
    </span>
    <div className="min-w-0 flex-1 pb-5">
      <p className="flex items-center gap-1.5 text-[14px] font-bold text-[var(--ink)]">
        <Icon className="h-4 w-4 text-purple-600" aria-hidden="true" /> {title}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  </li>
);

/**
 * Booking details for the checkout: who (from the login), where (address
 * modal) and when (time-slot modal). Selections are kept in localStorage
 * (bookingAddress / address_id / bookingTimeSlot) — the checkout reads them
 * from there when the order is placed.
 */
export default function BookingSlots({ phoneNumber, bookingSlotsKey }) {
  const [addressOpen, setAddressOpen] = useState(false);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [steps, setSteps] = useState({
    address: { completed: false, data: null },
    timeSlot: { completed: false, data: null },
  });

  useEffect(() => {
    try {
      setUserEmail(localStorage.getItem("userEmail") || localStorage.getItem("email") || "");
      setUserName(localStorage.getItem("userName") || localStorage.getItem("name") || "");
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, []);

  useEffect(() => {
    try {
      const savedAddress = localStorage.getItem("bookingAddress");
      if (savedAddress) {
        let data = savedAddress;
        try {
          data = JSON.parse(savedAddress);
        } catch {
          /* plain string address */
        }
        setSteps((s) => ({ ...s, address: { completed: true, data } }));
      }
      const savedTimeSlot = localStorage.getItem("bookingTimeSlot");
      if (savedTimeSlot) {
        try {
          setSteps((s) => ({ ...s, timeSlot: { completed: true, data: JSON.parse(savedTimeSlot) } }));
        } catch {
          localStorage.removeItem("bookingTimeSlot");
        }
      }
    } catch (error) {
      console.error("Error loading booking data:", error);
    }
  }, [bookingSlotsKey]);

  const handleAddressSelected = (selectedAddress) => {
    try {
      setSteps((s) => ({ ...s, address: { completed: true, data: selectedAddress } }));
      localStorage.setItem("bookingAddress", typeof selectedAddress === "object" ? JSON.stringify(selectedAddress) : selectedAddress);
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    }
  };

  const handleTimeSlotSelected = (selectedTimeSlot) => {
    try {
      setSteps((s) => ({ ...s, timeSlot: { completed: true, data: selectedTimeSlot } }));
      localStorage.setItem("bookingTimeSlot", JSON.stringify(selectedTimeSlot));
      setShowTimeSlotModal(false);
    } catch (error) {
      console.error("Error saving time slot:", error);
      toast.error("Failed to save time slot");
    }
  };

  const addressText = () => {
    const d = steps.address.data;
    if (!d) return "";
    if (typeof d === "object") return [d.houseNo, d.city, d.state, d.pincode].filter(Boolean).join(", ");
    return d;
  };

  const editBtn = "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--line-strong)] bg-white px-3 text-[13px] font-semibold text-[var(--ink-soft)] hover:bg-purple-50";
  const primaryBtn = "inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-purple-600 px-4 text-[13.5px] font-semibold text-white hover:bg-purple-700";

  return (
    <ol className="relative ml-4 border-l-2 border-purple-100 pl-6">
      <Step n={1} icon={User} title="Your details" done>
        <dl className="text-[13.5px] text-[var(--body-text)]">
          {userName && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden="true" />
              <dd>{userName}</dd>
            </div>
          )}
          {userEmail && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden="true" />
              <dd className="truncate">{userEmail}</dd>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden="true" />
            <dd>+91 {phoneNumber}</dd>
          </div>
        </dl>
      </Step>

      <Step n={2} icon={MapPin} title="Service address" done={steps.address.completed}>
        {steps.address.completed ? (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
            <p className="text-[13.5px] leading-snug text-[var(--ink-soft)]">{addressText()}</p>
            <button type="button" onClick={() => setAddressOpen(true)} className={editBtn}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setAddressOpen(true)} className={primaryBtn}>
            <MapPin className="h-4 w-4" aria-hidden="true" /> Select an address
          </button>
        )}
        <AdressModal setAddressOpen={setAddressOpen} addressOpen={addressOpen} onAddressSelected={handleAddressSelected} />
      </Step>

      <Step n={3} icon={CalendarDays} title="Appointment time" done={steps.timeSlot.completed} disabled={!steps.address.completed}>
        {!steps.address.completed ? (
          <p className="text-[13px] text-[var(--muted)]">Select an address first.</p>
        ) : steps.timeSlot.completed ? (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
            <p className="text-[13.5px] leading-snug text-[var(--ink-soft)]">
              <b className="text-[var(--ink)]">{steps.timeSlot.data?.date}</b> at {steps.timeSlot.data?.time}
            </p>
            <button type="button" onClick={() => setShowTimeSlotModal(true)} className={editBtn}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Change
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowTimeSlotModal(true)} className={primaryBtn}>
            <CalendarDays className="h-4 w-4" aria-hidden="true" /> Pick a time slot
          </button>
        )}
        {showTimeSlotModal && <TimeSlotModal open={showTimeSlotModal} onTimeSlotSelected={handleTimeSlotSelected} onClose={() => setShowTimeSlotModal(false)} />}
      </Step>
    </ol>
  );
}
