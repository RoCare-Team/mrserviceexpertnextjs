import React, { useEffect, useState } from 'react';
import AdressModal from '../modals/AdressModal';
import TimeSlotModal from '../modals/TimeSlotModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faCalendarDays, faCalendarPlus, faCalendarTimes, faEnvelope, faMailBulk, faPhone, faSms, faUser, faUserCircle, faVoicemail } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { Payment } from '@mui/icons-material';

function BookingSlots({ phoneNumber ,bookingSlotsKey}) {
  // State to control the visibility of the TimeSlotModal
  const [addressOpen, setAddressOpen] = useState(false);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // State to track completion status of each step
  const [steps, setSteps] = useState({
    address: {
      completed: false,
      data: null
    },
    timeSlot: {
      completed: false,
      data: null
    },
    payment: {
      completed: false,
      data: null
    }
  });

  // Load user data on component mount
  useEffect(() => {
    try {
      // Try both key variations to handle all cases
      const email = localStorage.getItem('userEmail') || localStorage.getItem('email');
      const name = localStorage.getItem('userName') || localStorage.getItem('name');

      setUserEmail(email || '');
      setUserName(name || '');
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, []);

  // Load booking data on component mount
  useEffect(() => {
    try {
      // Load address data
      const savedAddress = localStorage.getItem('bookingAddress');
      if (savedAddress) {
        try {
          // Try to parse as JSON first (for object data)
          const parsedAddress = JSON.parse(savedAddress);
          setSteps(prevSteps => ({
            ...prevSteps,
            address: {
              completed: true,
              data: parsedAddress
            }
          }));
        } catch {
          // If JSON parsing fails, treat as string
          setSteps(prevSteps => ({
            ...prevSteps,
            address: {
              completed: true,
              data: savedAddress
            }
          }));
        }
      }

      // Load time slot data
      const savedTimeSlot = localStorage.getItem('bookingTimeSlot');
      if (savedTimeSlot) {
        try {
          const parsedTimeSlot = JSON.parse(savedTimeSlot);
          setSteps(prevSteps => ({
            ...prevSteps,
            timeSlot: {
              completed: true,
              data: parsedTimeSlot
            }
          }));
        } catch (parseError) {
          console.error("Error parsing time slot data:", parseError);
          // Clean up corrupted data
          localStorage.removeItem('bookingTimeSlot');
        }
      }

    } catch (error) {
      console.error("Error loading booking data:", error);
    }
  }, []);

  const handleAddressOpen = () => {
    setAddressOpen(true);
  };

  // Function to handle address selection
  const handleAddressSelected = (selectedAddress) => {
    try {
      setSteps(prevSteps => ({
        ...prevSteps,
        address: {
          completed: true,
          data: selectedAddress
        }
      }));

      // Store address data consistently
      if (typeof selectedAddress === 'object') {
        localStorage.setItem('bookingAddress', JSON.stringify(selectedAddress));
      } else {
        localStorage.setItem('bookingAddress', selectedAddress);
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    }
  };

  // Function to handle time slot selection
  const handleTimeSlotSelected = (selectedTimeSlot) => {
    try {
      console.log(selectedTimeSlot);

      setSteps(prevSteps => ({
        ...prevSteps,
        timeSlot: {
          completed: true,
          data: selectedTimeSlot,
        }
      }));

      localStorage.setItem('bookingTimeSlot', JSON.stringify(selectedTimeSlot));
      
      // Close the modal after selection
      setShowTimeSlotModal(false);
      
      // toast.success("Time slot selected successfully");
    } catch (error) {
      console.error("Error saving time slot:", error);
      toast.error("Failed to save time slot");
    }
  };

  // Function to close time slot modal
  const handleCloseTimeSlotModal = () => {
    setShowTimeSlotModal(false);
  };

  // Helper function to display address
  const getAddressDisplay = () => {
    if (!steps.address.data) return '';
    
    if (typeof steps.address.data === 'object') {
      return `${steps.address.data.houseNo || ''}, ${steps.address.data.city || ''}, ${steps.address.data.state || ''}, ${steps.address.data.pincode || ''}`;
    }
    return steps.address.data;
  };

  return (
    <div className="bookingContainer">
      <div className='bookingHeading text-white flex flex-row items-center justify-center gap-2.5 p-5 rounded-xl mb-4'>
        <FontAwesomeIcon icon={faBook} />
        <h3 className='text-xl'>Booking Confirmation</h3>
      </div>
      
      <div className="bookingDetails">
        <div className="bookingSlots flex items-center g-2.5">
          <div className="flex gap-1.5">
            <div className="text-blue-800">
              <FontAwesomeIcon icon={faUserCircle} />
            </div>
            <div className="flex flex-col items-start">
              <p className='text-black'>Booking Details</p>
              <span className='text-gray-500 flex items-center gap-2.5'>
                <FontAwesomeIcon icon={faUser} />Name: {userName}
              </span>
              <span className='text-gray-500 flex items-center gap-2.5'>
                <FontAwesomeIcon icon={faEnvelope} />Email: {userEmail}
              </span>
              <span className='text-gray-500 flex items-center gap-2.5'>
                <FontAwesomeIcon icon={faPhone} />Phone: {phoneNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="flex flex-col selectAddress bookingSlots items-start gap-2.5">
          <div className="flex gap-2.5 items-center flex-row">
            <div className="text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="billAdress">
              <p className='text-black'>Address</p>
            </div>
          </div>

          <div className={`flex gap-1.5 ${steps.address.completed ? 'flex-row-reverse' : 'flex-col'}`}>
            <button onClick={handleAddressOpen} className='bookingBtn'>
              {steps.address.completed ? 'Edit' : 'Select an Address'}
            </button>
            
            {steps.address.completed && steps.address.data && (
              <div className="selected-address-preview text-sm text-green-600">
                <p className='break-all'>{getAddressDisplay()}</p>
              </div>
            )}
            
            <AdressModal 
              setAddressOpen={setAddressOpen} 
              addressOpen={addressOpen} 
              onAddressSelected={handleAddressSelected} 
            />
          </div>
        </div>

        {/* Time Slot Section - Only enabled if address is completed */}
        <div className={`SlotsArea bookingSlots ${!steps.address.completed ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-1.5">
            <div className="text-blue-800 w-7">
              <FontAwesomeIcon icon={faCalendarDays} />
            </div>
            <p className='text-black'>Appointment Time</p>
          </div>

          {steps.address.completed ? (
            <>
              <div className='mt-1.5'>
                <div className={`flex gap-1.5 ${steps.timeSlot.completed ? 'flex-row-reverse justify-between' : 'flex'}`}>
                  <button
                    onClick={() => setShowTimeSlotModal(true)}
                    className="bookingBtn"
                  >
                    {steps.timeSlot.completed ? 'Change Time Slot' : 'Select Time Slot'}
                  </button>

                  {steps.timeSlot.completed && steps.timeSlot.data && (
                    <div className="selected-slot-preview text-sm text-gray-400 mt-2">
                      <p className='text-black'>
                        Booked For: {steps.timeSlot.data?.date} at {steps.timeSlot.data?.time}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {showTimeSlotModal && (
                <TimeSlotModal
                  open={showTimeSlotModal}
                  onTimeSlotSelected={handleTimeSlotSelected}
                  onClose={handleCloseTimeSlotModal}
                />
              )}
            </>
          ) : (
            <button disabled className="text-gray-400">
              Please select an address first
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingSlots;