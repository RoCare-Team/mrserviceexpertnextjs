"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import useServiceOverrides from "@/lib/useServiceOverrides";

const CART_API = "https://waterpurifierservicecenter.in/customer/ro_customer/add_to_cart.php";

/** The CRM cart for the signed-in customer, shown in the sticky column. */
const Cart = ({ cartLoaded, cartLoadedToggle, hideWhenEmpty = false }) => {
  const [cartDataArray, setCartDataArray] = useState([]);
  const [finalTotal, setFinalTotal] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin title / description / image (prices stay from the cart API).
  const withOverride = useServiceOverrides(cartDataArray?.flatMap((c) => (c.cart_dtls || []).map((d) => d.service_id)));

  const displayCartData = () => {
    const cartdata = localStorage.getItem("checkoutState");
    const arr = cartdata ? JSON.parse(cartdata) || [] : [];
    const getPrice = localStorage.getItem("cart_total_price");
    const total = arr.map((item) => Number(item.total_main || getPrice || 0)).reduce((acc, p) => acc + p, 0);
    setFinalTotal(total);
    setCartDataArray(arr);
  };

  useEffect(() => {
    displayCartData();
  }, [cartLoaded]);

  const post = async (payload) => {
    const res = await fetch(CART_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return res.json();
  };

  const onIncrement = async (service_id, type, qunt) => {
    const cid = localStorage.getItem("customer_id");
    const quantity = Number(qunt) + 1;
    if (quantity > 5) {
      toast.error("You can't add more than 5 of one service", { autoClose: 3000 });
      return;
    }
    const data = await post({ service_id, type, cid, quantity });
    localStorage.setItem("checkoutState", JSON.stringify(data.AllCartDetails));
    localStorage.setItem("cart_total_price", data.total_price);
    displayCartData();
    window.dispatchEvent(new Event("cartItemsUpdated"));
  };

  const onDecrement = async (service_id, type, qunt) => {
    const cid = localStorage.getItem("customer_id");
    const quantity = Number(qunt) - 1;
    const data = await post({ service_id, type, cid, quantity });
    localStorage.setItem("checkoutState", JSON.stringify(data.AllCartDetails == null ? [] : data.AllCartDetails));
    localStorage.setItem("cart_total_price", data.total_main == null ? 0 : data.total_main);
    if (quantity === 0) {
      const old = JSON.parse(localStorage.getItem("cartItems") || "[]");
      localStorage.setItem("cartItems", JSON.stringify(old.filter((id) => id !== service_id)));
      if (typeof cartLoadedToggle === "function") cartLoadedToggle();
    }
    displayCartData();
    window.dispatchEvent(new Event("cartItemsUpdated"));
  };

  const handleRemoveFromCart = async (service_id, type) => {
    const cid = localStorage.getItem("customer_id");
    const data = await post({ service_id, type, cid, quantity: 0 });
    localStorage.setItem("checkoutState", JSON.stringify(data.AllCartDetails == null ? [] : data.AllCartDetails));
    localStorage.setItem("cart_total_price", data.total_main == null ? 0 : data.total_main);
    const old = JSON.parse(localStorage.getItem("cartItems") || "[]");
    localStorage.setItem("cartItems", JSON.stringify(old.filter((id) => id !== service_id)));
    if (typeof cartLoadedToggle === "function") cartLoadedToggle();
    displayCartData();
    window.dispatchEvent(new Event("cartItemsUpdated"));
  };

  useEffect(() => {
    const getcartdata = async () => {
      setLoading(true);
      const cid = localStorage.getItem("customer_id");
      if (!cid) {
        setCartDataArray([]);
        setCartItems([]);
        setFinalTotal(0);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/view_cart_details.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cid }),
        });
        const data = await res.json();
        const cart_details = data?.AllCartDetails || [];
        setCartDataArray(cart_details);
        setFinalTotal(Number(data?.total_price) || 0);
        localStorage.setItem("checkoutState", JSON.stringify(cart_details));
        localStorage.setItem("cart_total_price", data?.total_price || 0);
        const serviceIds = cart_details.flatMap((item) => (item.cart_dtls || []).filter((s) => Number(s.quantity) > 0).map((s) => s.service_id));
        localStorage.setItem("cartItems", JSON.stringify(serviceIds));
        setCartItems(serviceIds);
        if (typeof cartLoadedToggle === "function") cartLoadedToggle();
      } catch (err) {
        console.error("Error fetching cart data:", err);
        setCartDataArray([]);
        setCartItems([]);
        setFinalTotal(0);
      } finally {
        setLoading(false);
      }
    };
    getcartdata();
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    if (typeof cartLoadedToggle === "function") cartLoadedToggle();
  }, [cartItems]);

  const count = cartDataArray.reduce((n, c) => n + (c.cart_dtls || []).reduce((m, d) => m + (Number(d.quantity) || 1), 0), 0);

  // Service pages show the partners first and the cart only once something
  // has been added.
  if (hideWhenEmpty && !loading && cartDataArray.length === 0) return null;

  return (
    <section aria-labelledby="cart-h" className="rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3.5">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[0_6px_14px_-6px_rgba(98,41,205,.6)]">
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 id="cart-h" className="flex-1 text-[15px] font-bold text-[var(--ink)]">
          Your cart
        </h2>
        {count > 0 && <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">{count}</span>}
      </div>

      {loading ? (
        <div className="space-y-2.5 p-4" aria-busy="true">
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
          <div className="h-9 w-full animate-pulse rounded-xl bg-gray-200" />
        </div>
      ) : cartDataArray.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-7 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/emptyCart.webp" alt="" width={64} height={64} className="h-16 w-16 opacity-80" />
          <p className="text-sm font-semibold text-[var(--ink-soft)]">No services added yet</p>
          <p className="text-xs text-[var(--muted)]">Tap “Add” on a service to start your booking.</p>
        </div>
      ) : (
        <>
          <div className="max-h-[22rem] overflow-y-auto">
            {cartDataArray.map((group) => (
              <div key={group.category_cart_id} className="border-b border-[var(--line)] last:border-b-0">
                <p className="bg-[var(--surface-soft)] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{group.leadtype_name}</p>
                <ul className="divide-y divide-[var(--line)]">
                  {group.cart_dtls?.map((d) => withOverride(d)).map((item) => (
                    <li key={item.service_id} className="flex items-start gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold leading-snug text-[var(--ink)]">{item.service_name}</p>
                        <div className="mt-2 inline-flex items-center rounded-lg border border-[var(--line-strong)] bg-white">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => onDecrement(item.service_id, "delete", item.quantity)}
                            className="inline-flex h-7 w-7 items-center justify-center text-purple-700 hover:bg-purple-50"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span className="min-w-[1.75rem] text-center text-[13px] font-bold text-[var(--ink)]">{item.quantity || 1}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => onIncrement(item.service_id, "add", item.quantity)}
                            disabled={(item.quantity || 1) >= 5}
                            className="inline-flex h-7 w-7 items-center justify-center text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-[14px] font-bold text-[var(--ink)]">₹{item.price}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${item.service_name}`}
                          onClick={() => handleRemoveFromCart(item.service_id, "delete")}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--line)] p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">Total</span>
              <span className="text-lg font-extrabold tracking-tight text-[var(--ink)]">₹{finalTotal}</span>
            </div>
            <Link
              href="/checkout"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--grad-brand)] text-[15px] font-semibold text-white shadow-[var(--shadow-cta)] transition hover:brightness-110"
            >
              Proceed to checkout <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </>
      )}
    </section>
  );
};

export default Cart;
