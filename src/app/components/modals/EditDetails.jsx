import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';

const EditDetails = ({ open, setOpen, phoneNumber, onSubmitDetails }) => {
  // State for form values - initialize with empty values
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // State for tracking if any changes were made
  const [hasChanges, setHasChanges] = useState(false);

  // State for validation errors
  const [errors, setErrors] = useState({
    name: '',
    email: ''
  });

  // Use useEffect to load saved values from localStorage when dialog opens
  useEffect(() => {
    if (open) {
      const savedName = localStorage.getItem('name');
      const savedPhone = localStorage.getItem('userPhone');
      const savedEmail = localStorage.getItem('email');

      const initialData = {
        name: savedName || '',
        phone: savedPhone || phoneNumber || '',
        email: savedEmail || ''
      };

      setFormData(initialData);
      
      // Reset changes flag when opening dialog
      setHasChanges(false);
    }
  }, [open, phoneNumber]);

  // Handle closing the modal
  const handleClose = () => {
    setOpen(false);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    const newFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(newFormData);

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    // Check if there are any changes compared to stored values
    const storedName = localStorage.getItem('name') || '';
    const storedEmail = localStorage.getItem('email') || '';
    
    const nameChanged = newFormData.name !== storedName;
    const emailChanged = newFormData.email !== storedEmail;
    
    setHasChanges(nameChanged || emailChanged);
  };

  // Validate form
  const validateForm = () => {
    let valid = true;
    const newErrors = { name: '', email: '' };

    // Only validate email if it's provided
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is not valid';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Handle submission
  const handleSubmit = async () => {
    if (validateForm()) {
      // Prepare user data object
      const userData = {};
      const customer_id = localStorage.getItem('customer_id');
      
      // Check if any values have changed to determine if we need to make an API call
      const nameChanged = formData.name.trim() && formData.name !== localStorage.getItem('name');
      const emailChanged = formData.email.trim() && formData.email !== localStorage.getItem('email');

      if (!nameChanged && !emailChanged) {
        toast.info("No changes detected");
        handleClose();
        return;
      }

      // Always include all fields in the userData object regardless of what changed
      if (customer_id) {
        userData.customer_id = customer_id;
      }

      // Always include name from form or localStorage if available
      userData.name = formData.name.trim() || localStorage.getItem('name') || '';

      // Always include email from form or localStorage if available  
      userData.email = formData.email.trim() || localStorage.getItem('email') || '';

      // Always include phone number from localStorage (no changes allowed)
      userData.phoneNumber = localStorage.getItem('userPhone') || '';

      try {
        // Make API call to update details
        const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/update_user_dtls.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });

        const data = await res.json();
        console.log(data);

        if (!data.error) {
          // Update localStorage only after successful response
          if (formData.name.trim()) {
            localStorage.setItem('name', formData.name);
          }

          if (formData.email.trim()) {
            localStorage.setItem('email', formData.email);
          }

          // Call onSubmitDetails callback with all user data
          if (onSubmitDetails) {
            await onSubmitDetails(userData);
          }

          // Show success message
          toast.success(data.msg || "Profile updated successfully");
        } else if (data.error) {
          toast.error(data.msg || "Failed to update profile");
        }

        // Close the dialog
        handleClose();
      } catch (error) {
        toast.error("Failed to update information: " + (error.message || "Unknown error"));
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
    >
      <DialogTitle>Edit Profile Information</DialogTitle>

      <DialogContent>
        <DialogContentText>
          Update your personal details. Phone number cannot be changed.
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

          {/* Phone field - disabled/read-only */}
          <TextField
            name="phone"
            label="Phone Number"
            type="tel"
            fullWidth
            variant="outlined"
            value={formData.phone}
            disabled={true}
            helperText="For Changing contact the Support Team"
          />

          {/* Email field */}
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
        <Button onClick={handleClose} color="primary">Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!hasChanges || Object.values(errors).some(error => error !== '')}
        >
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDetails;