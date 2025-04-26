import React, { useState } from "react";
import {
  Modal,
  Box,
  Button,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import CongratsModal from "./CongratsModal";

const steps = ["Submit your Request", "Verify your OTP"];

export default function BasicModal({ buttonName }) {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [otp, setOtp] = useState("");
  const [showCongrats, setShowCongrats] = useState(false); // ✅ Added for Congrats Modal

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setActiveStep(0);
    setOtp("");
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setOtp("");
  };

  const handleVerifyOtp = () => {
    console.log("OTP Verified:", otp);
    handleNext();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted");
    handleClose();
    setShowCongrats(true); // ✅ Show Congrats Modal on submit
  };

  const handleCongratsClose = () => setShowCongrats(false); // ✅ Close Congrats Modal

  return (
    <div>
      <Button variant="contained" onClick={handleOpen}>
        {buttonName}
      </Button>

      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 700,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" mb={2}>
            Basic Details:
          </Typography>

          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNext();
              }}
            >
              <div className="row">
                <div className="col-lg-6">
                  <TextField
                    fullWidth
                    label="Full Name"
                    variant="outlined"
                    margin="normal"
                  />
                </div>
                <div className="col-lg-6">
                  <TextField
                    fullWidth
                    label="Your Email"
                    type="email"
                    variant="outlined"
                    margin="normal"
                  />
                </div>

                <div className="col-lg-6">
                  <TextField
                    fullWidth
                    label="Phone Number"
                    type="tel"
                    variant="outlined"
                    margin="normal"
                  />
                </div>
                <div className="col-lg-6">
                  <TextField
                    fullWidth
                    label="Enter Your Pincode"
                    type="number"
                    variant="outlined"
                    margin="normal"
                  />
                </div>
                <div className="col-lg-12">
                  <h4>Address</h4>
                  <TextField
                    fullWidth
                    label="Enter Your House No"
                    type="text"
                    variant="outlined"
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Enter Your Street/Road Area"
                    type="text"
                    variant="outlined"
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Enter Nearest Landmark"
                    type="text"
                    variant="outlined"
                    margin="normal"
                  />
                </div>
              </div>

              <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                <Button variant="outlined" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained">
                  Next
                </Button>
              </Box>
            </form>
          )}

          {activeStep === 1 && (
            <Box mt={3}>
              <TextField
                fullWidth
                label="Enter OTP"
                variant="outlined"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                margin="normal"
              />
              <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                <Button variant="outlined" onClick={handleBack}>
                  Back
                </Button>
                <Button variant="contained" onClick={handleVerifyOtp}>
                  Verify OTP
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === steps.length && (
            <Box mt={3}>
              <Typography sx={{ mb: 2 }}>
                All steps completed - you're finished!
              </Typography>
              <Box display="flex" justifyContent="flex-end" gap={1}>
                <Button onClick={handleReset}>Reset</Button>
                <Button variant="contained" onClick={handleSubmit}>
                  Submit
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Modal>

      {/* ✅ Congrats Modal */}
      {showCongrats && <CongratsModal onClose={handleCongratsClose} />}
    </div>
  );
}
