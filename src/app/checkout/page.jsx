"use client"

import React, { useState, useEffect, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PhoneVerification from "../components/PhoneVerification/PhoneVerification";
import BookingSlots from "../components/bookingData/BookingSlots";
import Link from "next/link";

const CheckOut = () => {

    const [phoneNumber, setPhoneNumber] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [bookingSlotsKey, setBookingSlotsKey] = useState(0);


    let handlePopup = () => {
        setShowModal(true)
    }

    // Comprehensive state management
    const [services, setServices] = useState([]);
    const [totalWithDiscount, setTotalWithDiscount] = useState("0.00");
    const [discountAmount, setDiscountAmount] = useState(0);
    const [tip, setTip] = useState(0);
    const [customTip, setCustomTip] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [cartDataArray, setCartDataArray] = useState([]);
    const [finalTotal, setFinalTotal] = useState(0);

    const [bookingCompleted, setBookingCompleted] = useState(false);
    const [bookingData, setBookingData] = useState({
        address: null,
        timeSlot: null,
        addressId: null
    });

    // Add booking modal state
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [currentBookingItem, setCurrentBookingItem] = useState(null);

    const displayCartData = () => {
        const cartdata = localStorage.getItem('checkoutState');
        const cartDataArray = cartdata ? JSON.parse(cartdata) : [];
        setCartDataArray(cartDataArray);
        setFinalTotal(localStorage.getItem('cart_total_price'));
        console.log(localStorage.getItem('cart_total_price') + 'fdsafasd');

    }

    // Function to refresh booking data from localStorage
    const refreshBookingData = useCallback(() => {
        const address = localStorage.getItem('bookingAddress');
        const timeSlot = localStorage.getItem('bookingTimeSlot');
        const addressId = localStorage.getItem('address_id');

        setBookingData({
            address,
            timeSlot: timeSlot ? JSON.parse(timeSlot) : null,
            addressId
        });

        // Update booking completed status
        const isComplete = address && timeSlot && addressId;
        setBookingCompleted(isComplete);
    }, []);

    // Load initial data
    useEffect(() => {
        displayCartData();

        // Check login status
        const userToken = localStorage.getItem('userToken');
        const userPhone = localStorage.getItem('userPhone');

        setIsLoggedIn(!!userToken);
        if (userPhone) setPhoneNumber(userPhone);

        // Initial booking data load
        refreshBookingData();
    }, [refreshBookingData]);

    // Listen for storage changes (when BookingSlots component updates localStorage)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'bookingAddress' || e.key === 'bookingTimeSlot' || e.key === 'address_id') {
                refreshBookingData();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [refreshBookingData]);

    // Polling mechanism to check for localStorage changes (as storage event doesn't work for same-window changes)
    useEffect(() => {
        let intervalId;

        if (showBookingModal) {
            intervalId = setInterval(() => {
                refreshBookingData();
            }, 1000); // Check every second while modal is open
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [showBookingModal, refreshBookingData]);

    // Increment and Decrement handlers
    const onIncrement = async (service_id, type, qunt) => {
        const cid = localStorage.getItem("customer_id");
        const num = Number(qunt);
        const quantity = num + 1;

        if (quantity <= 5) {
            const payload = { service_id, type, cid, quantity };

            try {
                const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/add_to_cart.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const data = await res.json();
                localStorage.setItem('checkoutState', JSON.stringify(data.AllCartDetails));
                localStorage.setItem('cart_total_price', data.total_main);

                displayCartData();
            } catch (error) {
                toast.error("Error updating cart");
                console.error("Error:", error);
            }
        } else {
            toast.error("You can't add more than 5 items");
        }
    };

    const onDecrement = async (service_id, type, qunt) => {
        const cid = localStorage.getItem("customer_id");
        const num = Number(qunt);
        const quantity = num - 1;

        if (quantity >= 0) {
            const payload = { service_id, type, cid, quantity };

            try {
                const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/add_to_cart.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const data = await res.json();
                localStorage.setItem('checkoutState', JSON.stringify(data.AllCartDetails == null ? [] : data.AllCartDetails));
                localStorage.setItem('cart_total_price', data.total_main == null ? 0 : data.total_main);

                if (quantity === 0) {
                    const oldCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
                    const updatedCartItems = oldCartItems.filter(id => id !== service_id);
                    localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
                     window.dispatchEvent(new Event('cartItemsUpdated'));
                }
                
                displayCartData();
            } catch (error) {
                toast.error("Error updating cart");
                console.error("Error:", error);
            }
        }
    };

    // Handle Book Now click - open booking modal
    const handleBookNowClick = (service) => {
        if (!isLoggedIn) {
            handlePopup();
            return;
        }

        setCurrentBookingItem(service);
        setShowBookingModal(true);
        // Refresh booking data when modal opens
        setTimeout(() => refreshBookingData(), 100);
    };

    // Check if booking is complete (pure function without side effects)
    const isBookingComplete = () => {
        return bookingData.address && bookingData.timeSlot && bookingData.addressId;
    };

    const handleProceedToPayment = () => {
        // Force refresh booking data before checking
        refreshBookingData();

        // Small delay to ensure state is updated
        setTimeout(() => {
            const isComplete = isBookingComplete();

            if (isComplete && currentBookingItem) {
                setShowBookingModal(false);
                handlePaymentCompleted(currentBookingItem.category_cart_id);
            } else {
                // Double check with localStorage directly
                const address = localStorage.getItem('bookingAddress');
                const timeSlot = localStorage.getItem('bookingTimeSlot');
                const addressId = localStorage.getItem('address_id');

                if (address && timeSlot && addressId && currentBookingItem) {
                    setShowBookingModal(false);
                    handlePaymentCompleted(currentBookingItem.category_cart_id);
                } else {
                    toast.error("Please complete all booking details before proceeding");
                }
            }
        }, 200);
    };

    const handlePaymentCompleted = async (leadtype, redirect = true) => {
        const cust_id = localStorage.getItem("customer_id");
        const cust_mobile = localStorage.getItem("userPhone");
        const address_id = localStorage.getItem("address_id");
        const cust_email = localStorage.getItem("email") || localStorage.getItem('userEmail') ;
        const chkout = JSON.parse(localStorage.getItem("checkoutState") || "[]");
        const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");
        const cart_id = leadtype;

        const timeSlotData = localStorage.getItem("bookingTimeSlot");
        const time = timeSlotData ? JSON.parse(timeSlotData) : {};
        const appointment_time = time.time;
        const appointment_date = time.date;

        const source = 'mrserviceexpert website';

        // Validate all required fields
        if (!cust_id || !cust_mobile || !address_id || !cust_email || !appointment_date || !appointment_time) {
            toast.error("Please complete all booking details before proceeding to payment", {
                autoClose: 3000,
            });
            return;
        }

        const payload = {
            cust_id,
            cust_mobile,
            address_id,
            cust_email,
            cart_id,
            appointment_time,
            appointment_date,
            source
        };

        try {
            const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/add_lead_with_full_dtls.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (data.error == false) {
                // toast.success(data.msg);

                const leftOverItems = chkout.filter(items => items.category_cart_id !== cart_id);

                if (leftOverItems.length > 0) {
                    localStorage.setItem('checkoutState', JSON.stringify(leftOverItems));
                } else {
                    localStorage.setItem('checkoutState', JSON.stringify([]));
                }

                const currentCategoryItem = chkout.find(item => item.category_cart_id === cart_id);

                if (currentCategoryItem && cartItems.length > 0) {
                    const checkedOutServiceIds = currentCategoryItem.cart_dtls.map(service => String(service.service_id));

                    const remainingItems = cartItems.filter(item => {
                        const isIncluded = checkedOutServiceIds.includes(String(item));
                        return !isIncluded;
                    });

                    localStorage.setItem('cartItems', JSON.stringify(remainingItems));
                      window.dispatchEvent(new Event('cartItemsUpdated'));
                } else if (leftOverItems.length === 0) {
                    localStorage.setItem('cartItems', JSON.stringify([]));
                }

                // Clear booking data
                const itemsToRemove = [
                    "bookingTimeSlot",
                    "bookingAddress",
                    "time_slot",
                    "address_id",
                ];

                itemsToRemove.forEach(item => {
                    localStorage.removeItem(item);
                });

                // Reset booking state
                setBookingData({
                    address: null,
                    timeSlot: null,
                    addressId: null
                });
                setBookingCompleted(false);
 setBookingSlotsKey(prev => prev + 1);
                displayCartData();

                if (redirect) {
                    setTimeout(() => {
                        window.location.href = data.lead_id_for_payment;
                    }, 100);
                } else {
                    toast.success("Team Will Contact You Soon!......");
                }

                // setTimeout(() => {
                //     window.location.href = data.lead_id_for_payment;
                // }, 100);
            } else {
                toast.error(data.msg || "Payment processing failed");
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
            console.error("Payment error:", error);
        }
    };

    // Close modal handler
    const handleCloseModal = () => {
        setShowBookingModal(false);
        setCurrentBookingItem(null);
    };

    return (

        <div className="checkout common-spacing bg-white">


            <div className="checkSection">
                {cartDataArray.length > 0 ? (
                    <div className="checkLeft lg:w-5/12">
                        <div className="sticky top-15">
                            <h4 className="text-2xl">Account</h4>
                            {!isLoggedIn ? (
                                <div className="login-required-container rounded-lg shadow-sm bg-gray-50 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="text-red-500 text-3xl mb-2">
                                            <i className="fas fa-user-lock"></i>
                                        </div>
                                        <p className="text-gray-600 mb-4">
                                            To proceed with your booking, please login or create an account.
                                        </p>
                                        <div className="flex gap-4">
                                            <button className="checkout-btn2" onClick={handlePopup}>Login to Continue</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="address-section hidden_pay">
                                    <h3 className="mb-4 text-xl">Delivery Address</h3>
                                    <BookingSlots phoneNumber={phoneNumber} key={bookingSlotsKey} />

                                    
                               <div className="cancellation-section block md:hidden">
    {/* <h3 className="mb-4 text-xl">Cancellation Policy</h3> */}
    {/* <p>No questions asked </p> */}
    <a href='/privacy-and-policy' target="_blank" rel="noopener noreferrer" className="text-black">
        <button>Read Full Privacy</button>
    </a>
</div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}

                <div className="checkRight max-w-lg">
                    {cartDataArray.length > 0 ? (
                        <h3>Order Summary</h3>
                    ) : (
                        <div className="emptyCartHeading">
                            <h3 className="text-center text-black">
                                <b>For Availing Services Go To <Link href={'/ro-water-purifier'}>Services</Link></b>
                            </h3>
                        </div>
                    )}

                    <div className="order-summary">
                        {cartDataArray?.length > 0 ? (
                            <div className="checkOutOrder">
                                <div>
                                    {/* {cartDataArray?.map((service) => {
                                           const categoryTotal = service.cart_dtls.reduce((sum, item) => {
                                            const price = Number(  item.total_price || item.price );
                                            const quantity = Number(item.quantity || 1);
                                            
                                            return sum + price * quantity;
                                        }, 0);
                                        return(
                                             <div key={service.cart_id}>
                                            <p className="text-xl"><b>{service.leadtype_name}</b></p>
                                            {service.cart_dtls.map((serviceDetail) => (
                                                <div key={serviceDetail.service_id} className="checkout-item service-card2 flex items-center">
                                                    <div className="problemIcon">
                                                        <img src={serviceDetail.image} alt={serviceDetail.service_name} />
                                                    </div>
                                                    <div>
                                                        <p className="mb-0">{serviceDetail.service_name}</p>
                                                        <p className="text-xs text-gray-300" dangerouslySetInnerHTML={{ __html: serviceDetail.description }}></p>
                                                    </div>
                                                    <div className="flex items-center flex-col">
                                                        <div>
                                                            <p className="text-xs text-gray-700 mb-1">₹{serviceDetail.total_price || serviceDetail.price}</p>
                                                        </div>
                                                        <div className="quantity-control">
                                                            <button className="IncrementDcrementBtn" onClick={() => onDecrement(serviceDetail.service_id, 'delete', serviceDetail.quantity)}>
                                                                -
                                                            </button>
                                                            <span>{serviceDetail.quantity || 1}</span>
                                                            <button className="IncrementDcrementBtn" onClick={() => onIncrement(serviceDetail.service_id, 'add', serviceDetail.quantity)}>
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                           <div className="flex justify-between">
                                            <button  onClick={()=>handlePaymentCompleted(service.category_cart_id, false)} className="bg-gray-400 hidden md:block  p-2 rounded-xl text-white hover:bg-blue-700 transition-colors">Pay Later</button>
                                             <button 
                                                className="bg-purple-600  md:w-xs w-full p-2 rounded-xl text-white hover:bg-purple-700 transition-colors" 
                                                onClick={() => {
                                                    if (window.innerWidth < 768) {
                                                        handleBookNowClick(service);
                                                    } else {
                                                        handlePaymentCompleted(service.category_cart_id);
                                                    }
                                                }}
                                            >
                                                
                                                Book Now: ₹{categoryTotal}
                                            </button>
                                           </div>
                                        </div>
                                        )
                                    })} */}
                                    {cartDataArray?.map((service) => {
                                        const calculatedTotal = service.cart_dtls.reduce((sum, item) => {
                                            const price = Number(item.total_price || item.price || 0);
                                            const quantity = Number(item.quantity || 1);
                                            return sum + (price * quantity);
                                        }, 0);

                                        const serverTotal = Number(service.total_main) || 0;
                                        const categoryTotal = serverTotal || calculatedTotal;

                                        return (
                                            <div key={service.cart_id}>
                                                <p className="text-xl"><b>{service.leadtype_name}</b></p>
                                                {service.cart_dtls.map((serviceDetail) => (
                                                    <div key={serviceDetail.service_id} className="checkout-item service-card2 flex items-center">
                                                        <div className="problemIcon">
                                                            <img src={serviceDetail.image} alt={serviceDetail.service_name} />
                                                        </div>
                                                        <div>
                                                            <p className="mb-0">{serviceDetail.service_name}</p>
                                                            <p className="text-xs text-gray-300" dangerouslySetInnerHTML={{ __html: serviceDetail.description }}></p>
                                                        </div>
                                                        <div className="flex items-center flex-col">
                                                            <div>
                                                                <p className="text-xs text-gray-700 mb-1">₹{serviceDetail.total_price || serviceDetail.price}</p>
                                                            </div>
                                                            <div className="quantity-control">
                                                                <button className="IncrementDcrementBtn" onClick={() => onDecrement(serviceDetail.service_id, 'delete', serviceDetail.quantity)}>
                                                                    -
                                                                </button>
                                                                <span>{serviceDetail.quantity || 1}</span>
                                                                <button className="IncrementDcrementBtn" onClick={() => onIncrement(serviceDetail.service_id, 'add', serviceDetail.quantity)}>
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between">
                                                    <button onClick={() => handlePaymentCompleted(service.category_cart_id, false)} className="bg-gray-400 hidden md:block p-2 rounded-xl text-white hover:bg-blue-700 transition-colors">
                                                        Pay Later
                                                    </button>
                                                    <button
                                                        className="bg-purple-600 md:w-xs w-full p-2 rounded-xl text-white hover:bg-purple-700 transition-colors"
                                                        onClick={() => {
                                                            if (window.innerWidth < 768) {
                                                                handleBookNowClick(service);
                                                            } else {
                                                                handlePaymentCompleted(service.category_cart_id);
                                                            }
                                                        }}
                                                    >
                                                        Book Now: ₹{categoryTotal}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                </div>

                                <div className="cancellation-section block md:hidden">
                                    <h3 className="mb-4 text-xl">Cancellation policy</h3>
                                    <p>Free cancellations if done more than 12 hrs before the service or if a professional isn't assigned. A fee will be charged otherwise.</p>
                                    <a href='/privacy-and-policy' target="_blank" rel="noopener noreferrer" className="text-black">
                                        <button>Read Full Privacy</button>
                                    </a>
                                </div>

                                <div className='p-3 bg-white rounded-lg shadow hidden'>
                                    <div>
                                        <h4>Payment summary</h4>
                                        <div className="tip-portion">
                                            <div className="flex items-center justify-between">
                                                <p className="text-2xs mb-2">Item total</p>
                                                <p className="text-2xs mb-2">₹{finalTotal}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-2xs mb-2">Service Fee</p>
                                                <p className="text-2xs mb-2">NIL</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-2xs mb-2">Discount</p>
                                                <p className="text-green-400 text-2xs mb-2">-₹{discountAmount.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="dashedLine"></div>
                                    <div className="checkout-total flex gap-2.5">
                                        <p className="total-breakdown m-0">Total: ₹{finalTotal}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="emptyCartStyle emptyStyle">
                                <img src="/assets/images/emptyCart.png" alt="Empty Cart" />
                                <p>No items in the cart.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-purple-100 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Complete Your Booking</h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700 text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4">
                            <BookingSlots phoneNumber={phoneNumber} />

                            {/* Booking Status Display */}
                            {/* <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium mb-2">Booking Status:</p>
                                <div className="space-y-1 text-xs">
                                    <div className={`flex items-center ${bookingData.address ? 'text-green-600' : 'text-red-600'}`}>
                                        <span className="mr-2">{bookingData.address ? '✓' : '✗'}</span>
                                        Address: {bookingData.address ? 'Selected' : 'Not selected'}
                                    </div>
                                    <div className={`flex items-center ${bookingData.timeSlot ? 'text-green-600' : 'text-red-600'}`}>
                                        <span className="mr-2">{bookingData.timeSlot ? '✓' : '✗'}</span>
                                        Time Slot: {bookingData.timeSlot ? 'Selected' : 'Not selected'}
                                    </div>
                                    <div className={`flex items-center ${bookingData.addressId ? 'text-green-600' : 'text-red-600'}`}>
                                        <span className="mr-2">{bookingData.addressId ? '✓' : '✗'}</span>
                                        Address ID: {bookingData.addressId ? 'Confirmed' : 'Not confirmed'}
                                    </div>
                                </div>
                            </div> */}

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => {
                                        handleCloseModal();
                                        // Call handlePaymentCompleted with redirect=false for "Pay Later"
                                        if (currentBookingItem) {
                                            handlePaymentCompleted(currentBookingItem.category_cart_id, false);
                                        }
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Pay Later
                                </button>
                                <button
                                    onClick={handleProceedToPayment}
                                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${bookingCompleted
                                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    disabled={!bookingCompleted}
                                >
                                    {bookingCompleted ? 'Next' : 'Book Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PhoneVerification setShowModal={setShowModal} showModal={showModal} />
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default CheckOut;