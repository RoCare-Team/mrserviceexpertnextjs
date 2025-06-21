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
import { faBook, faCartShopping, faDoorClosed, faHeadset, faHome, faPerson, faPhone, faSignIn, faSignOut, faTools, faUser } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import PhoneVerification from "../PhoneVerification/PhoneVerification";
import { useRouter } from "next/navigation";
import PhoneIcon from '@mui/icons-material/Phone';



export default function Header() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartCount, setCartCount] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useRouter();


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

    if (data && data.length > 0) {
      totalQuantity = data.reduce((sum, item) => {
        return sum + (parseInt(item.quantity) || 0);
      }, 0)
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

  const getbookingdata = async () => {
    setIsPopupVisible(false);
    const user_no = localStorage.getItem("userPhone");
    const payload = { user_no: user_no }
    const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/all_complaints.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    localStorage.setItem("all_cmpl", JSON.stringify(data.complainDetails));
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
              <Link href={'/'} title="Home Services">
                <img
                  src="/assets/images/serviceLogo.webp"
                  alt="service logo"
                  title="Mr Service Expert"
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
                <img src="/assets/images/Call (2).webp" alt="Call For Services" height={40} width={40} title='For calling contact +91 9311587715' className="w-100" />
              </span>
              <a href="tel:+91-9311587715" className="text-black" title='For calling contact +91 9311587715'>
                <button className="text-black" title="Call for services">+91-9311587715</button>
              </a>
            </div>

            <SearchBar />



            <Link href='/ro-water-purifier' title="ro water purifier services">
              <Button
                title="Services"
                style={{ color: 'white' }}
                sx={{ textTransform: "none", fontSize: "16px" }}
              >
                Service
              </Button>
            </Link>

            {/* Cart Icon */}
            <div className="cartLink relative">
              <a href="/checkout" title="Checkout">
                <FontAwesomeIcon icon={faCartShopping} style={{ fontSize: "24px", cursor: "pointer" }} />
              </a>
              {cartCount > 0 ? (<span className='cartCountStyle absolute '>{cartCount}</span>) : (<></>)}
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
                          title="profile section"
                          style={{ textDecoration: 'none', color: 'black', fontSize: '12px' }}
                          onClick={() => setIsPopupVisible(false)}
                        >
                          <li style={{ padding: '8px 4px' }}> <span>
                            <FontAwesomeIcon icon={faUser} style={{ fontSize: "12px", cursor: "pointer", marginRight: '4px' }} />
                          </span>Profile</li>
                        </Link>

                        <Link
                          href="/help-center"
                          title="help center for any issue related to services"
                          style={{ textDecoration: 'none', color: 'black', fontSize: '12px' }}
                          onClick={() => setIsPopupVisible(false)}
                        >
                          <li style={{ padding: '8px 4px' }}> <span>
                            <FontAwesomeIcon icon={faTools} style={{ fontSize: "12px", cursor: "pointer", marginRight: '3.5px' }} />
                          </span>Help Center</li>
                        </Link>
                        <Link
                          href="/booking"
                          title="previous and upcoming services booking section"
                          style={{ textDecoration: 'none', color: 'black', fontSize: '12px' }}
                          onClick={() => getbookingdata()}
                        >
                          <li style={{ padding: '8px 4px' }}><span>
                            <FontAwesomeIcon icon={faBook} style={{ fontSize: "12px", cursor: "pointer", marginRight: '3.5px' }} />
                          </span>    My Bookings</li>
                        </Link>
                        <li style={{ padding: '8px 4px' }}>
                          <button
                            title="Logout"
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
                          title="login"
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

          <Box sx={{ display: { xs: 'flex', md: 'none', alignItems: 'center', justifyContent: 'center' }, gap: 1 }}>
            {/* Menu Icon */}
            {/* <IconButton onClick={toggleDrawer(true)} title="Menu View">
              <MenuIcon />
            </IconButton> */}

            {/* Call Button */}
            <IconButton
              component="a"
              href="tel:+919311587715"  // replace with your number
              title="Call Now at 9311587715 for ro services "
              sx={{ background: '#e9d5ff', color: '#5D3FD3', }}
            >
              <PhoneIcon /> {/* from @mui/icons-material */}
              {/* OR use FontAwesome if preferred */}
              {/* <FontAwesomeIcon icon={faPhone} /> */}
            </IconButton>
          </Box>

        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      {/* <Drawer anchor="bottom" open={drawerOpen} onClose={toggleDrawer(false)} > */}
      <Box
  sx={{
    width: '100%',
    bgcolor: '#ffffff',
    position: {
      xs: 'fixed',
      sm: 'fixed',
      md: 'static',
    },
    bottom: {
      xs: 0,
      sm: 0,
    },
    left: {
      xs: 0,
      sm: 0,
    },
    right: {
      xs: 0,
      sm: 0,
    },
    display: {
      xs: 'block',
      sm: 'block',
      md: 'none',
    },
    zIndex: 1300,
    borderTop: '1px solid #f0f0f0',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
  }}
  role="presentation"
>
  <List 
    sx={{ 
      display: 'flex',
      flexDirection: 'row',
      padding: '0px 0px',
      justifyContent: 'space-around',
      alignItems: 'center',
      margin: 0,
    }}
  >
    {/* Home */}
    <ListItem 
      button 
      onClick={() => handleNavigation('/')}
      sx={{
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px 2px',
        minWidth: '60px',
        borderRadius: '16px',
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: '#f8f9ff',
          transform: 'scale(1.05)',
        },
      }}
    >
      <Box
        sx={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: '#4f46e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2px',
          color: 'white',
          fontSize: '16px',
        }}
      >
        <FontAwesomeIcon icon={faHome} />
      </Box>
      <Typography 
        variant="caption"
        sx={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#374151',
          textAlign: 'center',
        }}
      >
        Home
      </Typography>
    </ListItem>

    {/* Cart */}
    <ListItem 
      button 
      onClick={() => handleNavigation('/checkout')}
      sx={{
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px 2px',
        minWidth: '60px',
        borderRadius: '16px',
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: '#f0fdf4',
          transform: 'scale(1.05)',
        },
      }}
    >
      <Box
        sx={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2px',
          color: 'white',
          fontSize: '16px',
        }}
      >
        <FontAwesomeIcon icon={faCartShopping} />
      </Box>
      <Typography 
        variant="caption"
        sx={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#374151',
          textAlign: 'center',
        }}
      >
        Cart
      </Typography>
    </ListItem>

    {/* Conditional Items */}
    {isLoggedIn ? (
      <>
        {/* Booking */}
        <ListItem 
          button 
          onClick={() => handleNavigation('/booking')}
          sx={{
            flexDirection: 'column',
            alignItems: 'center',
            padding: '6px 2px',
            minWidth: '60px',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: '#fff7ed',
              transform: 'scale(1.05)',
            },
          }}
        >
          <Box
            sx={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '2px',
              color: 'white',
              fontSize: '16px',
            }}
          >
            <FontAwesomeIcon icon={faBook} />
          </Box>
          <Typography 
            variant="caption"
            sx={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#374151',
              textAlign: 'center',
            }}
          >
            Booking
          </Typography>
        </ListItem>

        {/* Profile */}
        <ListItem 
          button 
          onClick={() => handleNavigation('/profile')}
          sx={{
            flexDirection: 'column',
            alignItems: 'center',
            padding: '6px 2px',
            minWidth: '60px',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: '#fdf2f8',
              transform: 'scale(1.05)',
            },
          }}
        >
          <Box
            sx={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#ec4899',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '2px',
              color: 'white',
              fontSize: '16px',
            }}
          >
            <FontAwesomeIcon icon={faUser} />
          </Box>
          <Typography 
            variant="caption"
            sx={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#374151',
              textAlign: 'center',
            }}
          >
            Profile
          </Typography>
        </ListItem>
      </>
    ) : (
      /* Login */
      <ListItem 
        button 
        onClick={() => setShowModal(true)}
        sx={{
          flexDirection: 'column',
          alignItems: 'center',
          padding: '6px 2px',
          minWidth: '60px',
          borderRadius: '16px',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: '#f0f9ff',
            transform: 'scale(1.05)',
          },
        }}
      >
        <Box
          sx={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#0ea5e9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2px',
            color: 'white',
            fontSize: '16px',
          }}
        >
          <FontAwesomeIcon icon={faSignIn} />
        </Box>
        <Typography 
          variant="caption"
          sx={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#374151',
            textAlign: 'center',
          }}
        >
          Login
        </Typography>
        </ListItem>
    )}
  </List>
</Box>
      {/* </Drawer> */}

      {/* Phone Verification Modal */}
      <PhoneVerification setShowModal={setShowModal} showModal={showModal} />
    </>
  );
}