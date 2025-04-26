import React, { useState } from "react";
import { TextField, Button, InputAdornment } from "@mui/material";
import { toast } from "react-toastify";
import AppImg from '../../assets/images/app-pic.webp';
import Playstore from '../../assets/images/app-btns.webp';

const PhoneLinkActivator = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [visibleLink, setVisibleLink] = useState(false);
  const downloadLink = "https://play.google.com/store/apps/details?id=rocareindia.com.rocareindiapartner"; //app download link

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters

    if (value.length <= 10) {
      setPhoneNumber(value);
      setVisibleLink(value.length === 10);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(downloadLink);
    // alert("Link copied to clipboard!");
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="appLinkContainer text-white ">
      {/* service repair installation unins amc plans  */}
      {/* bg-gradient-to-r from-indigo-800 to-purple-900 */}
      <h1 className="text-center">Want the App? We'll Send You the Link!</h1>
    <div className="appLinkSection flex items-start justify-around text-white py-2 ">
    <div className="appLinkBody flex flex-col items-center ">
      <div>
      <img src={AppImg} alt="" className="w-95" /> 
      </div>
     {/* <div className="linkSection ">
      <p className="text-2xl mb-2.5">Get the app download link on your mobile phone</p>
     <div className="flex items-center servicesHero w-full flex-wrap">
     <TextField
        variant="outlined"
        placeholder="Enter phone number"
        value={phoneNumber}
        onChange={handleInputChange}
        InputProps={{
          startAdornment: <InputAdornment position="start">+91</InputAdornment>,
        }}
        inputProps={{ maxLength: 10 }}
        sx={{ width: 250,background:'white',borderRadius:"5px"}}
      />
      {visibleLink && (
        <div style={{ marginTop: "10px" }}>
          <a href={downloadLink} target="_blank" rel="noopener noreferrer">
            <Button variant="contained" color="primary">Download App</Button>
          </a>
          <Button  variant="outlined" color="secondary" onClick={copyToClipboard} sx={{ marginLeft: 1 }}>
            Copy Link
          </Button>
        </div>
      )}
     </div>
     </div> */}
     </div>
     <div className="appLinkBenifits mt-2.5">
      <h3>RO Care India – The #1 Water Purifier Service App</h3>
       <p className="text-2xl">Experience hassle-free RO service at your fingertips!</p>
       <li>✔<strong>Instant Service Booking</strong> – Raise a request in seconds.</li>
       <li>✔<strong>Live Status Tracking</strong>– Stay updated in real time.</li>
       {/* <li>✔<strong> Easy Reschedule & Cancellation</strong> – Modify requests anytime</li> */}
       <li>✔<strong>24/7 Online Support</strong>– Get quick assistance.</li>
       <div className="mt-3 download">
       <span>DOWNLOAD ROCARE APP</span>
       <div className="w-40 h-auto mt-2">
      <a href={downloadLink}> <img src={Playstore} alt="" className="w-full"  /></a>
       </div>
       </div>
     </div>
    </div>
    </div>
  );
};

export default PhoneLinkActivator;
