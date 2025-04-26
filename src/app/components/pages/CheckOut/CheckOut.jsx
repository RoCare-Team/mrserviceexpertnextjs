import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link, data } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SavedIcon from '../../../assets/images/savedIcon.png';
import PhoneVerification from "../../PhoneVerification/PhoneVerification";
import BookingSlots from "../../bookingData/BookingSlots";
import EmptyCart from '../../../assets/images/emptyCart.png';
import Cart from "../../cart/Cart";
// import Modal from '../../modals/Modal';

const CheckOut = () => {
    const location = useLocation();
    const navigate = useNavigate();
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

    const displayCartData=()=>{
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
                localStorage.setItem('cart_total_price',data.total_price);
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
          localStorage.setItem('cart_total_price', data.total_price == null ? 0 : data.total_price);
                displayCartData();
                toast.success(data.msg);
    
    
            } else {
                toast.success(data.msg);
            }
    
        };

    // //   console.log(updatedServices+'this being increase');

    // const onDecrement = (serviceId) => {
    //     setServices(prevServices => {
    //         const updatedServices = prevServices
    //             .map(service =>
    //                 service.id === serviceId
    //                     ? { ...service, quantity: (service.quantity || 1) - 1 }
    //                     : service
    //             )
    //             .filter(service => service.quantity >= 1);  // Changed to >= 1

    //         // localStorage.setItem('cartItems', JSON.stringify(updatedServices));
    //         return updatedServices;
    //     });
    // };

    // Tip handling methods
    // const handleTipSelection = (amount) => {
    //     setTip(prev => prev === amount ? 0 : amount);
    //     setCustomTip("");
    // };

    // const handleCustomTip = (e) => {
    //     const value = e.target.value;
    //     setCustomTip(value);
    //     if (value !== "") setTip(0);
    // };

    // const applyCustomTip = () => {
    //     const customTipValue = Number(customTip);
    //     if (isNaN(customTipValue) || customTipValue < 25 || customTipValue > 500) {
    //         toast.error("Tip must be between ₹25 and ₹500");
    //         return;
    //     }

    //     setTip(customTipValue);
    //     toast.success(`Tip of ₹${customTipValue} applied`);
    // };

    // const removeTip = () => {
    //     setTip(0);
    //     setCustomTip("");
    // };


    //     const requestData = {
    //         bookingAddress: bookingAddress,
    //         bookingTimeSlot: bookingTimeSlot,
    //         cartItems: services,  
    //         cartTotal: finalTotal,  
    //         checkoutState: {
    //             selectedServices: services,
    //             finalTotal: finalTotal,
    //             discountAmount: discountAmount,
    //             tip: tip,
    //             customTip: customTip
    //         },
    //         userPhone: phoneNumber, 
    //     };

    // console.log(requestData);



    return (
        <div className="checkout common-spacing bg-white">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="checkSection">
                <div className="checkLeft lg:w-5/12">
                    <div className="sticky top-15">
                        {/* {cartDataArray.length > 0 && discountAmount > 0 && (
                            <div className="flex items-center gap-0.5 text-green-300">
                                <div className="problemIcon">
                                    <img src={SavedIcon} alt="saved" />
                                </div>
                                <h5 className="m-0">You saved ₹{discountAmount.toFixed(2)}</h5>
                            </div>
                        )} */}

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

                                <div className="cancellation-section">
                                    <h3 className="mb-4 text-xl">Cancellation policy</h3>
                                    <p>Free cancellations if done more than 12 hrs before the service or if a professional isn’t assigned. A fee will be charged otherwise.</p>
                                    <a href='/privacy-and-policy' target="_blank" rel="noopener noreferrer" className="text-black"><button>Read Full Privacy </button></a>

                                </div>
                            </div>

                        )}
                    </div>
                </div>

                <div className="checkRight max-w-lg">
                    <h3>Order Summary</h3>
                    <div className="order-summary">

                        {/* <Cart
                                // selectedServices={selectedServices}
                                total={totalAmount}
                                onRemove={handleRemoveFromCart}
                                onIncrement={handleIncrementService}
                                onDecrement={handleDecrementService}
                                onCartLoad={handleCartLoad}
                            /> */}

                        {cartDataArray?.length > 0 ? (
                            <div className="checkOutOrder">
                                <div>
                                {cartDataArray?.map((service) => (
  <div key={service.cart_id}>
    <p>{service.leadtype_name}</p>
                                    {service.cart_dtls.map((service) => (
                                        <div key={service.service_id} className="checkout-item service-card2 flex items-center">
                                            <div className="problemIcon">
                                                <img src={service.image} alt={service.service_name} />
                                            </div>
                                            <div>
                                                <p className="mb-0">{service.service_name}</p>
                                                {/* <p className="text-xs text-gray-300">{service.briefInfo}</p> */}
                                                <p className="text-xs text-gray-300" dangerouslySetInnerHTML={{ __html: service.description }}></p>


                                                {/* {service.details && (
                                                    <div className="appliance-details text-sm text-gray-600 mt-1 flex flex-wrap gap-2">
                                                        {service.details.brand && (
                                                            <span><strong>Brand:</strong> {service.details.brand},</span>
                                                        )}
                                                        {service.details.type && (
                                                            <span><strong>Type:</strong> {service.details.type},</span>
                                                        )}
                                                        {service.details.problems && service.details.problems.length > 0 && (
                                                            <span>
                                                                <strong>Issues: </strong>
                                                                {service.details.problems.length > 2
                                                                    ? `${service.details.problems.slice(0, 2).join(', ')}...`
                                                                    : service.details.problems.join(', ')
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {service.acDetails && (
                                                    <div className="ac-details text-sm text-gray-600 mt-1 flex flex-wrap gap-2">
                                                        <span><strong>Brand:</strong> {service.acDetails?.brand},</span>
                                                        <span><strong>Type:</strong> {service.acDetails?.type},</span>

                                                        {service.acDetails?.problems?.length > 0 && (
                                                            <span>
                                                                <strong>Issues: </strong>
                                                                {service.acDetails.problems.length > 2
                                                                    ? `${service.acDetails.problems.slice(0, 2).join(', ')}...`
                                                                    : service.acDetails.problems.join(', ')
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                )} */}
                                            </div>
                                            <div className="flex items-center flex-col">

                                                <div>
                                                    <p className="text-xs text-gray-700 mb-1"> ₹{service.price}</p>
                                                    {/* <p className="text-xs text-gray-700"> ₹{service.price} x {service.quantity || 1}</p> */}
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
                                     </div>
))}
                                </div>

                                <div className='p-3 bg-white rounded-lg shadow'>
                                    <div>
                                        <h4>Payment summary</h4>
                                        <div className="tip-portion">
                                            <div className="flex items-center justify-between">
                                                <p className="text-2xs mb-2">Item total</p>
                                                {/* <p className="text-2xs mb-2">₹{totalWithDiscount}</p> */}
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
                                            {/* <div className="dashedLine"></div>

                                            <h6>Add a tip to thank the Professional</h6> */}
                                            {/* <div className="tip-buttons">
                                                {[25, 50, 75].map((amount) => (
                                                    <button
                                                        key={amount}
                                                        className={`tip-btn ${tip === amount ? "selected" : ""}`}
                                                        onClick={() => handleTipSelection(amount)}
                                                        type="button"
                                                    >
                                                        ₹{amount}
                                                    </button>
                                                ))}
                                                <div className="custom-tip-container">
                                                    <input
                                                        type="number"
                                                        placeholder="Custom"
                                                        className="tip-input"
                                                        value={customTip}
                                                        onChange={handleCustomTip}
                                                        min="25"
                                                        style={{
                                                            width: '100%'
                                                        }}
                                                    />
                                                    <button
                                                        className="tip-apply-btn"
                                                        onClick={applyCustomTip}
                                                        disabled={!customTip}
                                                        type="button"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                            </div> */}

                                            {/* Remove Tip Button */}
                                            {/* {tip > 0 && (
                                                <button className="mt-3 text-red-500 text-sm" onClick={removeTip} type="button">
                                                    Remove Tip
                                                </button>
                                            )} */}

                                            {/* {customTip && Number(customTip) < 25 && (
                                                <p className="tip-error text-red-500">Minimum tip amount is ₹25</p>
                                            )}
                                            {
                                                customTip && Number(customTip) > 500 && (
                                                    <p className="tip-error text-red-500">Maximum tip amount is ₹500</p>
                                                )
                                            } */}
                                        </div>
                                    </div>
                                    <div className="dashedLine"></div>
                                    <div className="checkout-total flex gap-2.5 ">
                                        {/* <p className="total-breakdown m-0">Total: ₹{(finalTotal + (tip || 0)).toFixed(2)}</p> */}
                                        <p className="total-breakdown m-0">Total: ₹{finalTotal}</p>
                                        {/* <p className={`total-breakdown m-0 ${tip < 25 ? 'hidden' : ''}`}>

                                            (Items: ₹{finalTotal} {(tip > 0 || customTip) ? ` + Tip: ₹${tip || 0}` : ''})
                                        </p> */}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="emptyCartStyle emptyStyle">
                                <img src={EmptyCart} alt="" />
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