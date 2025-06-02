
"use client"

import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PhoneVerification from "../components/PhoneVerification/PhoneVerification";
import BookingSlots from "../components/bookingData/BookingSlots";
import Link from "next/link";

const CheckOut = () => {

    const [phoneNumber, setPhoneNumber] = useState('');
    const [showModal, setShowModal] = useState(false);


    let handlePopup = () => {
        setShowModal(true)
    }

    // Comprehensive state management
    const [services, setServices] = useState([]);
    const [totalWithDiscount, setTotalWithDiscount] = useState("0.00");
    const [discountAmount, setDiscountAmount] = useState(0);
    // const [finalTotal, setFinalTotal] = useState(0);
    const [tip, setTip] = useState(0);
    const [customTip, setCustomTip] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [bookingAddress, setBookingAddress] = useState(false);
    const [bookingTimeSlot, setBookingTimeSlot] = useState(false);
    const [cartDataArray, setCartDataArray] = useState([]);
    const [finalTotal, setFinalTotal] = useState(0);

    const displayCartData = () => {
        const cartdata = localStorage.getItem('checkoutState');

        // console.log(cartdata);

        const cartDataArray = cartdata ? JSON.parse(cartdata) : [];
        setCartDataArray(cartDataArray);


        setFinalTotal(localStorage.getItem('cart_total_price'));
    }




    // Load initial data
    useEffect(() => {
        // loadCartData();
        displayCartData();

        // Check login status
        const userToken = localStorage.getItem('userToken');
        const userPhone = localStorage.getItem('userPhone');

        setIsLoggedIn(!!userToken);
        if (userPhone) setPhoneNumber(userPhone);
    }, []);

    // Increment and Decrement handlers
    const onIncrement = async (service_id, type, qunt) => {
        const cid = localStorage.getItem("customer_id");
        const num = Number(qunt);
        const quantity = num + 1;

        if (quantity <= 5) {
            const payload = { service_id, type, cid, quantity };
            // console.log(JSON.stringify(payload));

            const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/add_to_cart.php", {

                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            localStorage.setItem('checkoutState', JSON.stringify(data.AllCartDetails));
            localStorage.setItem('cart_total_price', data.total_main);
            // window.location.reload();
            // console.log(data);

            displayCartData();
            toast.success(data.msg);
        } else {
            toast.error("You can't add more than 5 items");
        }

    };




    const onDecrement = async (service_id, type, qunt) => {
        const cid = localStorage.getItem("customer_id");
        const num = Number(qunt);
        const quantity = num - 1;

        if (quantity <= 5) {
            const payload = { service_id, type, cid, quantity };
            // console.log(JSON.stringify(payload));

            const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/add_to_cart.php", {

                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            // localStorage.setItem('checkoutState', JSON.stringify(data.AllCartDetails, data.total_cart_price, data.cart_id));
            localStorage.setItem('checkoutState', JSON.stringify(data.AllCartDetails == null ? [] : data.AllCartDetails));
            localStorage.setItem('cart_total_price', data.total_main == null ? 0 : data.total_main);
            if (quantity === 0) {
                const oldCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
                const updatedCartItems = oldCartItems.filter(id => id !== service_id);
                localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
                // console.log(service_id, oldCartItems);

            }
            displayCartData();
            toast.success(data.msg);


        } else {
            toast.success(data.msg);
        }

    };

    const handlePaymentCompleted = async (leadtype) => {



        
        const cust_id = localStorage.getItem("customer_id");
        const cust_mobile = localStorage.getItem("userPhone");
        const address_id = localStorage.getItem("address_id");
        const cust_email = localStorage.getItem("email");
        const chkout = JSON.parse(localStorage.getItem("checkoutState"));
        // const fakeId=JSON.parse(localStorage.getItem("cartItems"));
        const cartItems = JSON.parse(localStorage.getItem("cartItems"));
        const cart_id = leadtype;
        const addedValues = JSON.stringify(cartItems);
        // console.log(addedValues);

        // console.log(localStorage.getItem("cartItems"));


        console.log(JSON.stringify(cartItems) + 'before doing anything');

        const time = JSON.parse(localStorage.getItem("bookingTimeSlot") || "[]");
        const appointment_time = time.time;
        const appointment_date = time.date;







        const payload = { cust_id, cust_mobile, address_id, cust_email, cart_id, appointment_time, appointment_date };

        if(cust_id===null || cust_mobile=== null  || address_id === null ||  cust_email=== null || appointment_date === null || appointment_time === null )
        {
            // alert("please choose the booking details first before paying");
            toast.error("please choose the booking details first before paying");

            

        }

   

      else{
          // console.log(address_id);
        const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/add_lead_with_full_dtls.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (data.error == false) {
            toast.success(data.msg);

            const leftOverItems = chkout.filter(items => items.category_cart_id !== cart_id)

            console.log(leftOverItems);

            if (leftOverItems.length > 0) {
                localStorage.setItem('checkoutState', JSON.stringify(leftOverItems));
                // console.log('Leftover items:', leftOverItems);
            } else {
                localStorage.setItem('checkoutState', JSON.stringify([]));
            }

            const currentCategoryItem = chkout.find(item => item.category_cart_id === cart_id);
            
            if (currentCategoryItem && cartItems.length > 0) {
                const checkedOutServiceIds = currentCategoryItem.cart_dtls.map(service => String(service.service_id));
                
                // console.log('Service IDs being checked out (current category only):', checkedOutServiceIds);
                
                const remainingItems = cartItems.filter(item => {
                    const isIncluded = checkedOutServiceIds.includes(String(item));
                    // console.log(`Checking item: ${item}, will be removed: ${isIncluded}`);
                    return !isIncluded; 
                });

                // console.log('Remaining cart items after filtering:', remainingItems);

                localStorage.setItem('cartItems', JSON.stringify(remainingItems));
            } else if (leftOverItems.length === 0) {
                // If no items left in checkout, clear cartItems
                localStorage.setItem('cartItems', JSON.stringify([]));
            }


            const itemsToRemove = [
                
                "bookingTimeSlot",
                "bookingAddress",
                // "checkoutState",
                "time_slot",
                // "cart_total_price",
                "address_id",
                // "cartItems",
            ];

            itemsToRemove.forEach(item => {
                localStorage.removeItem(item);
            });


            displayCartData();

             setTimeout(() => {
               window.location.href = data.lead_id_for_payment;
             }, 100);

        }
      }


    };


    return (
        <div className="checkout common-spacing bg-white">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="checkSection">
                {cartDataArray.length > 0 ? (<div className="checkLeft lg:w-5/12">
                    <div className="sticky top-15">
                        <h4 className="text-2xl">Account</h4>
                        {!isLoggedIn ? (
                            // Show login prompt if user is not logged in
                            <div className="login-required-container  rounded-lg shadow-sm bg-gray-50 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="text-red-500 text-3xl mb-2">
                                        <i className="fas fa-user-lock"></i>
                                    </div>
                                    <p className="text-gray-600 mb-4">
                                        To proceed with your booking, please login or create an account.
                                    </p>
                                    <div className="flex gap-4">
                                        {/* <PhoneVerification buttonName={'Login To Continue'}  /> */}
                                        <button className="checkout-btn2" onClick={handlePopup}>Login to Continue</button>
                                        {/* <Modal buttonName="RO Service" /> */}
                                    </div>
                                </div>

                            </div>

                        ) : (
                            // Show address section if user is logged in
                            <div className="address-section">
                                <h3 className="mb-4 text-xl">Delivery Address</h3>
                                <BookingSlots phoneNumber={phoneNumber} />

                                <div className="cancellation-section  hidden lg:block xl:block">
                                    <h3 className="mb-4 text-xl">Cancellation policy</h3>
                                    <p>Free cancellations if done more than 12 hrs before the service or if a professional isn’t assigned. A fee will be charged otherwise.</p>
                                    <a href='/privacy-and-policy' target="_blank" rel="noopener noreferrer" className="text-black"><button>Read Full Privacy </button></a>

                                </div>
                            </div>

                        )}
                    </div>
                </div>) : (<></>)}

                <div className="checkRight max-w-lg">
                    {cartDataArray.length > 0 ? (<h3>Order Summary</h3>) : (<div className="emptyCartHeading">
                        <h3 className="text-center text-black"><b>For Availing Services Go To <Link href={'/ro-water-purifier'} >Services</Link></b></h3>
                    </div>)}
                    <div className="order-summary">
                        {cartDataArray?.length > 0 ? (
                            <div className="checkOutOrder">
                                <div>
                                    {cartDataArray?.map((service) => (
                                        <div key={service.cart_id}>
                                            <p className="text-xl"><b>{service.leadtype_name}</b></p>
                                            {service.cart_dtls.map((service) => (
                                                <div key={service.service_id} className="checkout-item service-card2 flex items-center">
                                                    <div className="problemIcon">
                                                        <img src={service.image} alt={service.service_name} />
                                                    </div>
                                                    <div>
                                                        <p className="mb-0">{service.service_name}</p>
                                                        <p className="text-xs text-gray-300" dangerouslySetInnerHTML={{ __html: service.description }}></p>
                                                    </div>
                                                    <div className="flex items-center flex-col">

                                                        <div>
                                                            <p className="text-xs text-gray-700 mb-1"> ₹{service.total_price}</p>

                                                        </div>
                                                        <div className="quantity-control">
                                                            <button className="IncrementDcrementBtn" onClick={() => onDecrement(service.service_id, 'delete', service.quantity)}>
                                                                -
                                                            </button>
                                                            <span>{service.quantity || 1}</span>
                                                            <button className="IncrementDcrementBtn" onClick={() => onIncrement(service.service_id, 'add', service.quantity)}>
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>

                                                </div>
                                            ))}
                                            <button className="bg-purple-600 w-full p-2 rounded-xl text-white" onClick={() => handlePaymentCompleted(service.category_cart_id)}>Pay Now: ₹{service.total_main} </button>
                                        </div>

                                    ))}
                                </div>

 <div className="cancellation-section block md:hidden   ">
                                    <h3 className="mb-4 text-xl">Cancellation policy</h3>
                                    <p>Free cancellations if done more than 12 hrs before the service or if a professional isn’t assigned. A fee will be charged otherwise.</p>
                                    <a href='/privacy-and-policy' target="_blank" rel="noopener noreferrer" className="text-black"><button>Read Full Privacy </button></a>

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
                                            </div >
                                            <div className="flex items-center justify-between">
                                                <p className="text-2xs mb-2">Discount</p>
                                                <p className="text-green-400 text-2xs mb-2">-₹{discountAmount.toFixed(2)}</p>
                                            </div>

                                        </div>
                                    </div>
                                    <div className="dashedLine"></div>
                                    <div className="checkout-total flex gap-2.5 ">
                                        <p className="total-breakdown m-0">Total: ₹{finalTotal}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="emptyCartStyle emptyStyle">
                                <img src="/assets/images/emptyCart.png" alt="" />
                                <p>No items in the cart.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PhoneVerification setShowModal={setShowModal} showModal={showModal} />
        </div>
    );
};

export default CheckOut;