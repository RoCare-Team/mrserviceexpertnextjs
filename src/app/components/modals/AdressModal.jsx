import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  IconButton,
  Divider,
  Paper,
  Box,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddressFormModal from './AddressFormModal';

function AddressModal({ onAddressSelected, addressOpen, setAddressOpen }) {
  const [userAddress, setUserAddress] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [mannuallyAddress, setMannuallyAddress] = useState(false);

  // Sample predefined addresses
  const savedAddresses = {
    // home: "JMD MegaPolis, Badshahpur Sohna Road, Sector 48, Gurgaon, Haryana",
    // office: "JMD MegaPolis, Badshahpur Sohna Road, Sector 48, Gurgaon, Haryana"

  };

  let RecentAddress = JSON.parse(localStorage.getItem('RecentAddress'));
  // console.log(RecentAddress);

// console.log(RecentAddress[0].id +' the saved address id');
// const savedAddress = localStorage.getItem('bookingAddress');




  const handleClose = () => {
    setAddressOpen(false);
  };

  const handleInputChange = (e) => {
    setUserAddress(e.target.value);

  };

  const handleSelectAddress = (address,id) => {
    localStorage.setItem("address_id",id);
    setSelectedAddress(address);
    setUserAddress(address);

    // localStorage.setItem('bookingAddress', JSON.stringify(address));
  };

  const handleMannualOpen = () => {
    setMannuallyAddress(true);
  };

  const handleMannualClose = () => {
    setMannuallyAddress(false);
  };

  const handleCurrentLocation = () => {
    // In a real app, you would get the user's location here using navigator.geolocation
    if (navigator.geolocation) {
      setUserAddress("Fetching your current location...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you would reverse geocode these coordinates to get an address
          // For this example, we'll just display the coordinates
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const currentLocationAddress = `Location at: ${lat.toFixed(4)}, ${lng.toFixed(4)} (Would be converted to full address)`;

          setUserAddress(currentLocationAddress);
          setSelectedAddress(currentLocationAddress);
        },
        (error) => {
          console.error("Error getting location:", error);
          setUserAddress("Could not get your current location. Please enter manually.");
        }
      );
    } else {
      setUserAddress("Geolocation is not supported by your browser. Please enter your address manually.");
    }
  };

  const handleSubmit = () => {
    if (userAddress) {
      setSelectedAddress(userAddress);
      if (onAddressSelected) {
        onAddressSelected(userAddress);
      }
      handleClose();
    }
  };

  // Handler for receiving address from manual form
  const handleAddressFormSubmit = (formattedAddress) => {
    // Extract the formatted address string if it's an object
    const addressString = typeof formattedAddress === 'object' ?
      formattedAddress.formattedAddress : formattedAddress;

    setUserAddress(addressString);
    setSelectedAddress(addressString);
    setMannuallyAddress(false);

    // Pass it up to parent
    if (onAddressSelected) {
      onAddressSelected(formattedAddress);
    }

    // Close the main address modal as well since we now have an address
    handleClose();
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2}>
        {/* Display the selected address outside the modal */}
        {/* {selectedAddress && (
          <Typography variant="span" color="purple" >
            {selectedAddress}
          </Typography>
        )} */}

        {/* Address Dialog */}
        <Dialog
          open={addressOpen}
          onClose={handleClose}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ m: 0, p: 2 }}>
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 0,
                color: 'black',
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ mt: 2 }}>
            <Box className="searchLocation">
              <TextField
                fullWidth
                placeholder="Enter Your Location"
                variant="outlined"
                value={userAddress}
                onChange={handleInputChange}
                disabled
                sx={{ mb: 2 }}
              />

              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap={'wrap'}>
                <Button
                  startIcon={<LocationOnIcon />}
                  onClick={handleCurrentLocation}
                  sx={{ color: '#8a2be2', textTransform: 'none' }}
                >
                  Use Current Location
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleMannualOpen}
                  sx={{ textTransform: 'none', background: 'rgb(142 102 255)', color: 'white', border: '1px solid white' }}
                >
                  Add Manually
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 2, borderStyle: 'dashed', borderBottomWidth: '3px', borderColor: 'gray' }} />

            <Box className="recentLocation">
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                Recents
              </Typography>

              <Grid container spacing={2}>
                {/* <Grid item xs={12}>
                  <Paper 
                    elevation={0}
                    variant="outlined"
                    sx={{ 
                      p: 2, 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                    
                  > */}
                {/* <Typography variant="subtitle1" fontWeight={500}>
                      Home
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                     
                    </Typography> */}


                {/* </Paper>
                </Grid> */}

                {RecentAddress.map((city, index) => {
                  return (
                    //       <Typography variant='span' key={index}>
                    //       {city.address}  sx={{marginBottom:'20px'}}
                    // </Typography>
                    <Grid item xs={12} md={12} lg={12} key={index}   >
                      <Paper
                        elevation={0}
                        variant="outlined"
                        tabIndex={0} 
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          display:'flex',
                          justifyContent:'space-between',
                          alignItems:'center',
                          '&:hover': { backgroundColor: '#f5f5f5' },
                          '&:focus':{background:'#7533ea',color:'white'}
                        }}
                        onClick={() => handleSelectAddress(city.address,city.id)}
                      >
                        <Typography variant='div' key={index}

                          sx={{
                            p: 1,
                            cursor: 'pointer',
                            // border: '1px solid gray',
                            // borderRadius: '15px',
                            // marginBottom: '10px',

                            // gap: '30px',

                            // '&:hover': { backgroundColor: '#f5f5f5' },
                            // '&:focus':{background:'#f5f5f5'}
                          }}>

                          {city.flat_no},{city.landmark},{city.area},{city.state},{city.city},{city.pincode},{city.address_id}
                        </Typography>
                        <Typography variant='span' sx={{
                            p: 1,
                            cursor: 'pointer',
                          }}>
                          Edit
                        </Typography>
                      </Paper>
                    </Grid>
                  )
                })}

                {/* <Grid item xs={12}>
                  <Paper 
                    elevation={0}
                    variant="outlined"
                    sx={{ 
                      p: 2, 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                    onClick={() => handleSelectAddress(savedAddresses.office)}
                  >
                    <Typography variant="subtitle1" fontWeight={500}>
                      Office
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {savedAddresses.office}
                    </Typography>
                  </Paper>
                </Grid> */}
              </Grid>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!userAddress}
              sx={{
                backgroundColor: '#8a2be2',
                '&:hover': { backgroundColor: 'rgb(142 102 255)' }
              }}
            >
              Confirm Address
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Address Form Modal */}
      <AddressFormModal
        open={mannuallyAddress}
        handleClose={handleMannualClose}
        onAddressSubmit={handleAddressFormSubmit}
      />

    </Box>


  );
}

export default AddressModal;