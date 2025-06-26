"use client"
import React, { useEffect, useState } from "react";

import { IconButton } from "@mui/material";
// import { Link, useNavigate } from "react-router-dom";
import Link from "next/link";
import { toast } from "react-toastify";



// const Cart = ({cartdata, total, onRemove, onIncrement, onDecrement, onCartLoad }) => {
const Cart = ({ cartLoaded, cartLoadedToggle }) => {

  const [cartDataArray, setCartDataArray] = useState([]);
  const [finalTotal, setFinalTotal] = useState(0);



  const displayCartData = () => {
    const cartdata = localStorage.getItem('checkoutState');
    // console.log(cartdata.leadtype_name[5].cart_dtls[5]);

    // console.log(cartdata+'heres all details');

    const cartDataArray = cartdata ? JSON.parse(cartdata) || [] : [];

    // console.log(cartDataArray);


    // console.log(cartDataArray.cart_dtls[5]);


    setFinalTotal(localStorage.getItem('cart_total_price'));

    // const finalTotal = cartDataArray
    //   .map(item => Number(item.total_main)) // Convert string to number
    //   .reduce((acc, price) => acc + price, 0); // Sum up prices

    const getPrice=localStorage.getItem('cart_total_price');

    const finalTotal = cartDataArray
  .map(item => Number(item.total_main || getPrice || 0)) // Handle total_main or price or default to 0
  .reduce((acc, price) => acc + price, 0);


    setFinalTotal(finalTotal);

    // console.log(finalTotal+"after making the actuall sum of all the things");
    

    // const price_discount=cartDataArray.map(item => Number(item.total_cart_price)).reduce((acc, price) => acc + price, 0);
    // alert(price_discount)

    setCartDataArray(cartDataArray);
  }

  useEffect(() => {

    displayCartData(cartLoaded);
  }, [cartLoaded])



  const onIncrement = async (service_id, type, qunt) => {
    const cid = localStorage.getItem("customer_id");
    const num = Number(qunt);
    const quantity = num + 1;

    if (quantity <= 5) {
      const payload = { service_id, type, cid, quantity };
      console.log(JSON.stringify(payload));

      const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/add_to_cart.php", {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      localStorage.setItem('checkoutState', JSON.stringify(data.AllCartDetails));
      localStorage.setItem('cart_total_price', data.total_main);

      displayCartData();
      // toast.success(data.msg,{
      //    autoClose: 1500,
      // });


    } else {
      toast.error("You can't add more than 5 items",{
         autoClose: 3000,
      });
    }

  };
  const onDecrement = async (service_id, type, qunt) => {
    const cid = localStorage.getItem("customer_id");
    const num = Number(qunt);
    const quantity = num - 1;

    if (quantity <= 5) {
      const payload = { service_id, type, cid, quantity };
      console.log(JSON.stringify(payload));

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

        // trigger parent update
        if (typeof cartLoadedToggle === 'function') {
          cartLoadedToggle();
        }
      }

      displayCartData();
      // toast.success(data.msg);


    } else {
      toast.success('hey hey hey ',{
         autoClose: 3000,
      })
    }

  };


  const handleRemoveFromCart = async (service_id, type, qunt) => {
    const cid = localStorage.getItem("customer_id");
    // const num = Number(qunt);
    const quantity = 0;
    const payload = { service_id, type, cid, quantity };

    // console.log(JSON.stringify(payload) + 'remove thing will work here');

    const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/add_to_cart.php", {

      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    // localStorage.setItem('checkoutState', JSON.stringify(data.AllCartDetails, data.total_cart_price, data.cart_id));

    localStorage.setItem('checkoutState', JSON.stringify(data.AllCartDetails == null ? [] : data.AllCartDetails));
    localStorage.setItem('cart_total_price', data.total_main == null ? 0 : data.total_main);
    const oldCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const updatedCartItems = oldCartItems.filter(id => id !== service_id);
    console.log("cart remove" + updatedCartItems);

    localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));

    // trigger parent update
    if (typeof cartLoadedToggle === 'function') {
      cartLoadedToggle();
    }
    displayCartData();
    // toast.success(data.msg);


  };


  // console.log(finalTotal);


  return (
    <div className="cart">

      <h2>Cart</h2>


      {cartDataArray.length === 0 ? (
        <div className="emptyStyle">
          <img src="/assets/images/emptyCart.webp" alt="Empty Cart" className="emptyImg" height="auto" width={72} />
          <p className="text-center">No services added.</p>
        </div>
      ) : (
        <>
          {cartDataArray?.map((service) => (
            // key={service.cart_id}
            <div key={service.service_id} className="max-h-90 overflow-x-auto">
              <p className="ml-2.5">{service.leadtype_name}</p>

              {/* Assuming service.innerArray is the nested array */}
              {service.cart_dtls?.map((item, index) => (
                <div className="cart-item-body" key={item.cart_id}>
                  <div className="cart-item">
                    <div className="service-details flex items-start flex-col">
                      <div className="flex items-center gap-4 ">
                        <span>{item.service_name}</span>

                        <div className="quantity-control">
                          <button className="IncrementDcrementBtn" onClick={() => onDecrement(item.service_id, 'delete', item.quantity)}>
                            -
                          </button>
                          <span>{item.quantity || 1}</span>
                          <button
                            className="IncrementDcrementBtn"
                            onClick={() => onIncrement(item.service_id, 'add', item.quantity)}
                            disabled={(item.quantity || 1) >= 5}
                            style={{
                              opacity: (item.quantity || 1) >= 5 ? 0.5 : 1,
                              cursor: (item.quantity || 1) >= 5 ? 'not-allowed' : 'pointer'
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400">
                        <div dangerouslySetInnerHTML={{ __html: item.description }} />
                      </div>

                    </div>
                    <div className="flex flex-col px-1">
                      ₹{item.price}
                      <IconButton onClick={() => handleRemoveFromCart(item.service_id, 'delete', 0)} color="error" className="p-0">
                        <img src="/assets/images/Remove.png" alt="Remove" style={{ width: 24, height: 24 }} />
                      </IconButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className="cart-footer">

            {/* {discountPercentage > 0 && (
              <div className="cart-discount">
                <p className="congratsHeading">
                  🎉 Congrats! You saved ₹<strong>{discountAmount.toFixed(2)}</strong>
                </p>
              </div>
            )} */}


            <div className="totalSection">
              <Link href={'/checkout'}><div className="cart-total forMb" style={{ cursor: 'pointer' }}>
                <strong>Total: ₹{finalTotal}</strong>
                <button>View Cart</button>
              </div></Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;