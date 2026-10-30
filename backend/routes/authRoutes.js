const express = require("express");
const {
  register,
  login,
  registerValidation,
  loginValidation,
  verifyEmailOtp,
  resendVerificationOtp,
  emailValidation,
  otpValidation,
  requestLoginOtp,
  verifyLoginOtp,
  forgotPassword,
  resetPassword,
  resetPasswordValidation,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerValidation, register);
router.post("/verify-email", otpValidation, verifyEmailOtp);
router.post("/resend-verification", emailValidation, resendVerificationOtp);

router.post("/login", loginValidation, login);
router.post("/request-login-otp", emailValidation, requestLoginOtp);
router.post("/verify-login-otp", otpValidation, verifyLoginOtp);

router.post("/forgot-password", emailValidation, forgotPassword);
router.post("/reset-password", resetPasswordValidation, resetPassword);

module.exports = router;
