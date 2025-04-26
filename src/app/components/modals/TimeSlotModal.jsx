import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const TimeSlotModal = ({ onTimeSlotSelected, onClose, open }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedTimeId, setSelectedTimeId] = useState(null);

  // Function to generate the next three days dynamically
  const getNextSevenDays = () => {
    let days = [];
    for (let i = 0; i < 7; i++) {
      let date = new Date();
      date.setDate(date.getDate() + i);
      const day = date.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = date.getDate();
      days.push({ label: `${day} ${dayNum}`, value: date });
    }
    return days;
  };

  const availableDates = getNextSevenDays();

  // Function to generate time slots from 8:30 AM to 8:00 PM (30 min intervals)
  const generateTimeSlots = () => {
    let slots = [];
    let hours = 7,
      minutes = 0,
      period = "AM";

    while (!(hours === 8 && minutes === 30 && period === "PM")) {
      let time = `${hours}:${minutes === 0 ? "00" : minutes} ${period}`;
      slots.push(time);

      // Increment by 30 minutes
      minutes += 30;
      if (minutes === 60) {
        minutes = 0;
        hours += 1;
        if (hours === 12) period = period === "AM" ? "PM" : "AM"; // Switch AM/PM
        if (hours > 12) hours = 1; // Reset to 1 after 12
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Function to check if a time slot needs an extra charge
  const hasExtraCharge = (time) => {
    // Early morning slots (first 3 slots)
    const earlySlots = ['7:00 AM', '7:30 AM', '8:00 AM'];
    // Late evening slots (last 3 slots)
    const lateSlots = ['7:00 PM', '7:30 PM', '8:00 PM'];

    return earlySlots.includes(time) || lateSlots.includes(time);
  };

  // Handle date selection
  const handleDateSelect =async (date) => {
const sdate=date.toISOString().split('T')[0];
const payload = { date: sdate };
// console.log(JSON.stringify(payload));
 
    const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/time_slot.php", {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });

    const data = await res.json();
  // console.log(data);
    localStorage.setItem("time_slot",JSON.stringify(data.all_time_slots));
    
    setSelectedDate(date);
    setSelectedTime(null); // Reset time selection when date changes
  };


  // const selectedDateData=()=>{
  //   // setSelectedDate(date);
  //   setSelectedTimeId
  //   // console.log();
  // }


  const timeslot = JSON.parse(localStorage.getItem("time_slot") || "[]");
  
  // if(Array.isArray(timeslot)){
  //   console.log("iss array");
    
  // }

  
  
  // const timeDataArray = timeslot ? JSON.parse(timeslot) : [];
  // Handle close button click
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Handle proceed to checkout
  const handleProceed = () => {
    // console.log(id);
    
    if (selectedDate && selectedTime && onTimeSlotSelected && selectedTimeId) {

      // Format date as YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0'); // Add 1 because months are 0-indexed
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      // Keep the existing human-readable format for display purposes
      const readableDate = selectedDate.toLocaleDateString("en-US", {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
      // const timeId = setSelectedTimeId(time.id)

      

      onTimeSlotSelected({
        date: formattedDate,
        time: selectedTime,
        id: selectedTimeId
       
      });

      // Close the modal after selection is complete
      handleClose();
    }
  };

  const handleTimeSlot = (time,id) => {

    setSelectedTime(time);
    setSelectedTimeId(id)
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          p: 2
        }
      }}
    >
      <DialogTitle sx={{ p: 2, pb: 0 }}>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {/* Inner content remains the same */}
        <div className="mb-4">
          <h5 className="text-xs font-semibold m-0 text-left">When should the professional arrive?</h5>
          <p className="text-gray-600 text-sm text-left">Service will take approx. 3 hrs & 5 mins</p>
        </div>

        {/* Date Selection */}
        <div className="flex gap-2 mb-4">
          {availableDates?.map((date, index) => (
            <button
              key={index}
              onClick={() => handleDateSelect(date.value)}
              className={`px-1 py-3  dateStyle ${selectedDate && selectedDate.toDateString() === date.value.toDateString()
                  ? "bg-violet-500 text-white"
                  : "bg-white text-gray-800 border-gray-300"
                }`}
            >
              {date.label}
            </button>
          ))}
        </div>

        {/* Time Slot Selection in Grid - Only show when a date is selected */}
        {selectedDate && (
          <div className="mb-4 mt-6">
            <h5 className="text-sm font-medium mb-2 text-left ">Available time slots for {selectedDate.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}</h5>
            <div className="h-40 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2 p-3">
             
               {timeslot.length>0 ? (


timeslot.map((time) => (
  <div key={time.id}>
    <button
      className={`w-full py-2 px-3 border slotButton relative text-sm ${selectedTime === time.time_slots
          ? "bg-violet-300 text-white"
          : "bg-white text-gray-800 border-gray-300"
        }`}
      
      onClick={() => handleTimeSlot(time.time_slots,time.id)}
    >
      {time.time_slots}
      {/* {hasExtraCharge(time) && (
        <span className={`text-xs ${selectedTime === time ? "text-orange-500 extraCharge" : "text-orange-500 extraCharge"} ml-1`}>+ ₹150</span>
      )} */}
    </button>
  </div>
))
               ):(
               
               <div className='w-full'>
                <p className='text-center'><b>no available slots go to other dates</b></p>
               </div>
               
               )}
              </div>
            </div>

          </div>
        )}

        {/* Checkout Button - Only show when both date and time are selected */}
        {selectedDate && (
          <Box textAlign="center" mt={3}>
            <button
              className={`px-6 py-2 rounded-md w-full ${!selectedTime
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 cursor-pointer"
                } text-white`}
              disabled={!selectedTime}
              onClick={handleProceed}
            >
              Proceed to checkout
            </button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TimeSlotModal;