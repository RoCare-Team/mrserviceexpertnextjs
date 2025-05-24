import React, { useState } from 'react';
import { Modal, Box, Typography, Divider } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCreditCard,
  faLocationDot,
  faUser,
  faList
} from '@fortawesome/free-solid-svg-icons';


export default function PaymentModal({ open, handleClose, leadDetails }) {

  const data = leadDetails;
  // console.log(data);

  // const leaddata = JSON.parse(data);

  // useEffect(() => {
  //   console.log(leaddata[0]); // ✅ Will log the first lead correctly
  // }, []);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="payment-modal-title"
      aria-describedby="payment-modal-description"
    >



      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'white',
        boxShadow: 24,
        border: '1px solid white',
        borderRadius: '14px 14px 0px 0px',
        p: 0,
      }}>
        <Typography onClick={handleClose} sx={{ background: 'lightblue', borderRadius: '50%', padding: '10px', margin: '0px', position: 'absolute', top: '-10px', right: '-10px', cursor: 'pointer', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }} >x</Typography>

        <Typography id="payment-modal-title" variant="h6" component="h2" sx={{ mb: 2, background: '#6d28d9', padding: '5px', borderRadius: '14px 14px 0px 0px', color: 'white' }}>
          Booking Details
        </Typography>

        {/* Booking Status */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          p: 2,
          bgcolor: 'grey.300',
          borderRadius: 1
        }}>
          <FontAwesomeIcon icon={faList} style={{ marginRight: '16px', color: '#6d28d9' }} />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">Booking Status</Typography>
            <Typography variant="body2" color='lightgreen'><b>{data.status}</b></Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

        {/* User Details */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          p: 2,
          bgcolor: 'grey.300',
          borderRadius: 1
        }}>
          <FontAwesomeIcon icon={faUser} style={{ marginRight: '16px', color: '#6d28d9' }} />
          <Box>
            <Typography variant="body2">Customer</Typography>
            <Typography variant="subtitle1" fontWeight="bold">{data.name}</Typography>

          </Box>
        </Box>

        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

        {/* Address Details */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          p: 2,
          bgcolor: 'grey.300',
          borderRadius: 1
        }}>
          <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: '16px', color: '#6d28d9' }} />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">{'Address'}</Typography>
            <Typography variant="body2">{data.address}</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

        {/* Time Details */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          p: 2,
          bgcolor: 'grey.300',
          borderRadius: 1
        }}>
          <FontAwesomeIcon icon={faClock} style={{ marginRight: '16px', color: '#6d28d9' }} />
          <Box>

            <Typography variant="subtitle1" fontWeight="bold">{data.appointment_date}</Typography>
            <Typography variant="body2"> at {data.appointment_time}</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

        {/* Payment Status */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          bgcolor: 'grey.300',
          borderRadius: 1,
          // cursor: 'pointer'
        }}>
          <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: '16px', color: '#6d28d9' }} />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" color='orange'>{data.payment_status}</Typography>
            <Typography variant="body2">To Pay go to Mannu bhai App</Typography>
          </Box>

        </Box>
        <div className="mt-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-200 border-dashed text-center">
          <p className="text-xs text-gray-600 italic">
            ✨ Thank you for choosing our services! We'll see you soon.
          </p>
        </div>
      </Box>
    </Modal>
  );
}