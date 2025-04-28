"use client"
import React, { useState, useRef, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  ListItemIcon,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchBar from '../searchbar/index';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faCartShopping, faDoorClosed, faHeadset, faHome, faPerson, faSignIn, faSignOut, faTools, faUser } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import PhoneVerification from "../PhoneVerification/PhoneVerification";
import { useRouter } from "next/navigation";

export default function Header() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartCount, setCartCount] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

 const navigate=useRouter();
  

  // Profile popup states
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    setIsLoggedIn(!!token);
  }, []);


  let handlePopup = () => {
    setShowModal(true)
  }


  

  // For phone verification popup
  const [isPhoneModalOpen, setPhoneModalOpen] = useState(false);

  useEffect(() => {

    // let data = JSON.parse(localStorage.getItem('checkoutState'))
    // setCartCount(data)
    // console.log(cartCount[0]);
 
    
    // console.log(cartCount.quantity);
    
    // Close popup when clicking outside
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsPopupVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  useEffect(() => {
    // Get cart data from localStorage
    let data = JSON.parse(localStorage.getItem('checkoutState'));
    
    // Calculate total quantity
    let totalQuantity = 0;

    if(data && data.length>0){
      totalQuantity=data.reduce((sum,item)=>{
        return sum+(parseInt(item.quantity)|| 0);
      },0)
    }

    // if (Array.isArray(data)) {
    //   totalQuantity = data.reduce((sum, item) => {
    //     return sum + (parseInt(item.quantity) || 0);
    //   }, 0);
    // }
    
    // Set the total quantity
    setCartCount(totalQuantity);
    
    // For debugging
    console.log("Cart items:", data);
    console.log("Total quantity:", totalQuantity);
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const handleNavigation = (path) => {
    navigate.push(path);
    handleMenuClose();
    setDrawerOpen(false);
    setIsPopupVisible(false);
  };

  const togglePopup = () => {
    setIsPopupVisible(!isPopupVisible);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setIsPopupVisible(false);
    setPhoneModalOpen(false);
  };

  const getbookingdata=async()=>{
    setIsPopupVisible(false);
  const user_no=localStorage.getItem("userPhone");
  const payload={user_no:user_no}
    const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/all_complaints.php", {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    localStorage.setItem("all_cmpl",JSON.stringify(data.complainDetails));
    // console.log(data.complainDetails);
    

  }

  const handleLogout = () => {
    // Remove user data from localStorage
   localStorage.clear();
    // Any other user-related items you want to clear

    // Update state to reflect logged out status
    setIsLoggedIn(false);
    setIsPopupVisible(false);

    // Optionally refresh the page to reset app state
    window.location.reload();
  };

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          top: '0px',
          backgroundColor: "rgb(197, 180, 245)",
          color: "#000",
          padding: { xs: "0 10px", md: "0 50px" },
          zIndex: 10,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <div onClick={() => handleNavigation('/')} style={{ cursor: 'pointer' }}>
              <Link href={'/'}>
              <img
                src="/assets/images/serviceLogo.png"
                alt="service logo"
                style={{ height: "50px" }}
              /></Link>
            </div>
          </Box>

          {/* Desktop Menu */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 2,
            }}
          >
            <div className="flex items-center mobileNumber">
              <span className="w-10 h-10">
                <img src="/assets/images/Call (2).png" alt="urname" className="w-100" />
              </span>
              <a href="tel:+91-9311587744" className="text-black">
                <button className="text-black">+91-9311587744</button>
              </a>
            </div>

            <SearchBar />

           

            <Link href='/ro-water-purifier'>
              <Button
                style={{ color: 'white' }}
                sx={{ textTransform: "none", fontSize: "16px" }}
              >
                Service
              </Button>
            </Link>

            {/* Cart Icon */}
            <div className="cartLink relative">
              <a href="/checkout">
                <FontAwesomeIcon icon={faCartShopping} style={{ fontSize: "24px", cursor: "pointer" }} />
              </a>
              {cartCount > 0 ? (<span className='cartCountStyle absolute '>{cartCount}</span>): (<></>)}
            </div>

            {/* Profile Icon */}
            <div style={{ position: 'relative' }} className="profileMenu">
              <FontAwesomeIcon
                icon={faUser}
                style={{ fontSize: "24px", cursor: "pointer" }}
                onClick={() => setIsPopupVisible(!isPopupVisible)}
              />

              {/* Profile Popup */}
              {isPopupVisible && (
                <div
                  ref={popupRef}
                  style={{
                    position: 'absolute',
                    top: '40px',
                    right: '0',
                    backgroundColor: 'white',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                    padding: '10px',
                    zIndex: 10,
                    minWidth: '130px'
                  }}
                >
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {isLoggedIn ? (
                      <>


                        <Link
                         href="/profile"
                          style={{ textDecoration: 'none', color: 'black', fontSize: '12px' }}
                          onClick={() => setIsPopupVisible(false)}
                        >
                          <li style={{ padding: '8px 4px' }}> <span>
                            <FontAwesomeIcon icon={faUser} style={{ fontSize: "12px", cursor: "pointer", marginRight: '4px' }} />
                          </span>Profile</li>
                        </Link>

                        <Link
                         href="/help-center"
                          style={{ textDecoration: 'none', color: 'black', fontSize: '12px' }}
                          onClick={() => setIsPopupVisible(false)}
                        >
                          <li style={{ padding: '8px 4px' }}> <span>
                            <FontAwesomeIcon icon={faTools} style={{ fontSize: "12px", cursor: "pointer", marginRight: '3.5px' }} />
                          </span>Help Center</li>
                        </Link>
                        <Link
                         href="/booking"
                          style={{ textDecoration: 'none', color: 'black', fontSize: '12px' }}
                          onClick={() => getbookingdata()}
                        >
                          <li style={{ padding: '8px 4px' }}><span>
                            <FontAwesomeIcon icon={faBook} style={{ fontSize: "12px", cursor: "pointer", marginRight: '3.5px' }} />
                          </span>    My Bookings</li>
                        </Link>
                        <li style={{ padding: '8px 4px' }}>
                          <button
                            onClick={handleLogout}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              color: 'black',
                              textAlign: 'left',
                              width: '100%',
                              fontSize: '12px',
                              display: 'flex',
                              gap: '5px',
                            }}
                          >
                            <span>
                              <FontAwesomeIcon icon={faSignOut} style={{ fontSize: "12px", cursor: "pointer" }} />
                            </span>
                            Logout
                          </button>
                        </li>
                      </>
                    ) : (
                      <li style={{ padding: '8px 4px' }}>
                        <button
                          onClick={handlePopup}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            color: 'black',
                            textAlign: 'left',
                            width: '100%',
                            display: 'flex',
                            gap: '4px'
                          }}
                        >
                          <span><FontAwesomeIcon icon={faSignIn} style={{ fontSize: "12px", cursor: "pointer" }} /></span>
                          Login
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </Box>

          {/* Mobile Menu Icon */}
          <IconButton
            sx={{ display: { xs: "flex", md: "none" } }}
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)} >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <List>
            <ListItem>
              <img src="/assets/images/serviceLogo.png" alt='Online Customer Service' />
            </ListItem>

            <ListItem button onClick={() => handleNavigation('/')}>
              <ListItemIcon sx={{ minWidth: '34px' }}>
                <FontAwesomeIcon icon={faHome} />
              </ListItemIcon>
              <Typography variant="span" fontWeight="normal" >
                Home
              </Typography>
            </ListItem>
            <Divider sx={{ borderColor: 'gray' }} />
            <ListItem button onClick={() => handleNavigation('/ro-water-purifier')}>
              <ListItemIcon sx={{ minWidth: '34px' }}><FontAwesomeIcon icon={faTools} /> </ListItemIcon>
              <Typography variant="span" fontWeight="400">
                Service
              </Typography>
            </ListItem>

            <Divider sx={{ borderColor: 'gray' }} />

            <ListItem button onClick={() => handleNavigation('/checkout')}>
              <ListItemIcon sx={{ minWidth: '34px' }}><FontAwesomeIcon icon={faCartShopping} /></ListItemIcon>
              <Typography variant="span" fontWeight='400'>
                Checkout
              </Typography>
            </ListItem>

            {/* Login/Logout in drawer */}
            <Divider sx={{ borderColor: 'gray' }} />
            {isLoggedIn ? (
              <>

                    <ListItem button onClick={()=> handleNavigation('/profile')}>
                      <ListItemIcon sx={{minWidth:'34px'}}><FontAwesomeIcon icon={faUser}/>
                      </ListItemIcon> <ListItemText primary="Profile"/> </ListItem>

                      <Divider sx={{ borderColor: 'gray' }} />

                <ListItem button onClick={() => handleNavigation('/booking')} >
                  <ListItemIcon sx={{ minWidth: '34px' }}><FontAwesomeIcon icon={faBook} /></ListItemIcon>
                  <ListItemText primary="Booking" />
                </ListItem>

                <Divider sx={{ borderColor: 'gray' }} />

                <ListItem button onClick={() => handleNavigation('/help-center')} >
                  <ListItemIcon sx={{ minWidth: '34px' }}><FontAwesomeIcon icon={faHeadset} /></ListItemIcon>
                  <ListItemText primary="Help Center" />
                </ListItem>

                <Divider sx={{ borderColor: 'gray' }} />

                <ListItem button onClick={handleLogout}>
                  <ListItemIcon sx={{ minWidth: '34px' }}><FontAwesomeIcon icon={faSignOut} /></ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItem>
                <Divider sx={{ borderColor: 'gray' }} />
              </>
            ) : (
              <ListItem button onClick={() => setShowModal(true)}>
                <ListItemIcon sx={{ minWidth: '34px' }}><FontAwesomeIcon icon={faSignIn} /></ListItemIcon>
                <ListItemText primary="Login" />
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>

      {/* Phone Verification Modal */}
      <PhoneVerification setShowModal={setShowModal} showModal={showModal} />
    </>
  );
}