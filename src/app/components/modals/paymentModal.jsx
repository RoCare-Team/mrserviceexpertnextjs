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

  // if (data.status === 'Active') {
  //   console.log('add the green bg and some light effect and hover effect');

  // }
  // if (data.payment_status === 'Pending') {

  //   console.log('add the orange colors and bg of same colors');

  // }

  // if (data.status === 'Inactive') {
  //   console.log('add the red color and bg color for the ');

  // }

 

 const getStatusColors = (status) => {
  switch (status) {
    case 'Active':
      return { bg: '#f0fcf4',color:'#15a349' ,statusBg:'#dcfce7'};
    case 'Inactive':
      return { bg: '#fff2f2',color:'#db2525',statusBg:'#ffe3e3' };
    case 'Pending':
      return { bg: '#fffbe6',color:'#c98b04',statusBg:'#fffac4' };
    default:
      return { bg: '#f0fcf4',color:'#15a349',statusBg:'#fffac4' }; 
  }
};
 const statusColors=getStatusColors(data.status);
  // const getStatusColors = () => {
    {/*
        to make condition on the basis to make the img src to point to the rough img if the src shows the null or empty to get rid of the console warnings
 // payment_status "Pending"
    // status Active    
      */}
  // }

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
        paddingBottom: '10px'
      }}>
        <Typography onClick={handleClose} sx={{ background: statusColors.color, borderRadius: '50%', padding: '10px', margin: '0px', position: 'absolute', top: '-10px', right: '-10px', cursor: 'pointer', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }} >x</Typography>


        <Typography id="payment-modal-title" variant="h6" component="h2" sx={{ mb: 2, background: statusColors.bg, padding: '5px', borderRadius: '14px 14px 0px 0px', color: statusColors.color }}>
          Booking Details
        </Typography>
        <div className='px-2'>
          {/* Booking Status */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2,
            p: 2,
            bgcolor:statusColors.bg,
            border:`1px solid ${statusColors.color}` ,
            borderRadius: '14px 14px 12px 12px',
            borderTop:  `3px solid ${statusColors.color} !important` 
            
          }}>
            <FontAwesomeIcon icon={faList} style={{ marginRight: '16px', color: statusColors.color, padding: '6px', borderRadius: '5px', backgroundColor: statusColors.statusBg }} />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">Booking Status</Typography>
              <Typography variant="body2" sx={{ color: statusColors.color }}> <b>{data.status}</b></Typography>
            </Box>
          </Box>

          {/* <Divider sx={{ my: 1, borderStyle: 'dashed',borderColor:'#314ee7' }} /> */}

          {/* User Details */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2,
            p: 2,
            bgcolor: '#faf5ff',
            borderRadius: '14px 14px 12px 12px',
            borderTop: '3px solid #650fe9 !important',
            border:'1px solid #650fe9 '

          }}>
            <FontAwesomeIcon icon={faUser} style={{ marginRight: '16px', color: '#9234eb', padding: '6px', borderRadius: '5px', }} />
            <Box>
              <Typography variant="body2">Customer</Typography>
              <Typography variant="subtitle1" fontWeight="bold">{data.name}</Typography>

            </Box>
          </Box>

          {/* <Divider sx={{ my: 1, borderStyle: 'dashed',borderColor:'#314ee7' }} /> */}

          {/* Address Details */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2,
            p: 2,
           bgcolor: '#faf5ff',
            borderRadius: '14px 14px 12px 12px',
            borderTop: '3px solid #650fe9 !important',
            border:'1px solid #650fe9 '
          }}>
            <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: '16px',  color: '#9234eb', padding: '6px', borderRadius: '5px', }} />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">{'Delivery Address'}</Typography>
              <Typography variant="body2">{data.address}</Typography>
            </Box>
          </Box>

          {/* <Divider sx={{ my: 1, borderStyle: 'dashed',borderColor:'#314ee7' }} /> */}

          {/* Time Details */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2,
            p: 2,
            bgcolor: '#faf5ff',
            borderRadius: '14px 14px 12px 12px',
            borderTop: '3px solid #650fe9 !important',
            border:'1px solid #650fe9 '
          }}>
            <FontAwesomeIcon icon={faClock} style={{ marginRight: '16px', color: '#9234eb', padding: '6px', borderRadius: '5px',  }} />
            <Box>

              <Typography variant="subtitle1" fontWeight="bold">{data.appointment_date}</Typography>
              <Typography variant="body2"> at {data.appointment_time}</Typography>
            </Box>
          </Box>

          {/* <Divider sx={{ my: 1, borderStyle: 'dashed',borderColor:'#314ee7' }} /> */}

          {/* Payment Status */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            p: 2,
             bgcolor:statusColors.bg,
            border:`1px solid ${statusColors.color}` ,
            borderRadius: '14px 14px 12px 12px',
            borderTop:  `3px solid ${statusColors.color} !important`
            // cursor: 'pointer'
          }}>
            <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: '16px', color: statusColors.color, padding: '6px', borderRadius: '5px', backgroundColor: statusColors.statusBg }} />
            <Box>
               <Typography variant='span' sx={{ color: statusColors.color }}>Payment Status</Typography>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: statusColors.color }}> {data.payment_status}</Typography>
              <Typography variant="body2">To Pay go to Mannu bhai App</Typography>
            </Box>

          </Box>
          <div className="mt-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-200 border-dashed text-center">
            <p className="text-xs text-gray-600 italic">
              ✨ Thank you for choosing our services! We'll see you soon.
            </p>
          </div>
        </div>
      </Box>
    </Modal>
  );
}