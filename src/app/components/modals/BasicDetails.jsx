import React, { useState } from 'react';
import { 
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack
} from '@mui/material';
import { toast } from 'react-toastify';

const BasicDetails = ({open,setOpen,phoneNumber, onSubmitDetails}) => {
  // State for modal open/close
//   const [open, setOpen] = useState(false);
  
  // State for form values
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  
  // State for validation errors
  const [errors, setErrors] = useState({
    name: '',
    email: ''
  });

  // Handle opening the modal
//   const handleClickOpen = () => {
//     setOpen(true);
//   };

  // Handle closing the modal
  const handleClose = () => {
    setOpen(false);
    // Reset form data and errors when closing
    setFormData({ name: '', email: '' });
    setErrors({ name: '', email: '' });
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Validate form
  const validateForm = () => {
    let valid = true;
    const newErrors = { name: '', email: '' };
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is not valid';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };

  // Handle submission
   // Handle submission
   const handleSubmit = async () => {
    if (validateForm()) {
      // Combine the phone number with the form data
      const userData = {
        ...formData,
        phoneNumber: phoneNumber // Use phone number from props
      };

      // Call the callback function passed from parent with complete user data
      if (onSubmitDetails) {
        try {
          await onSubmitDetails(userData);
          // Success handling is now in the parent component
          handleClose();
        } catch (error) {
          toast.error("Failed to submit details: " + error.message);
        }
      } else {
        console.log('Form submitted without callback:', userData);
        handleClose();
      }
    }
  };
  

  return (
    <div>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Basic Information</DialogTitle>
        
        <DialogContent>
          <DialogContentText>
            Please enter your name and email address to proceed.
          </DialogContentText>
          
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              autoFocus
              name="name"
              label="Full Name"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
            />
            
            <TextField
              name="email"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Stack>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BasicDetails;