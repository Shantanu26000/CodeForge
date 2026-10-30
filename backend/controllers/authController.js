const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_WAIT_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const registerValidation = [
  body("username").trim().isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3–30 characters"),
  body("email").trim().isEmail().withMessage("Enter a valid email").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
];

const loginValidation = [
  body("email").trim().isEmail().withMessage("Enter a valid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const emailValidation = [
  body("email").trim().isEmail().withMessage("Enter a valid email").normalizeEmail(),
];

const otpValidation = [
  body("email").trim().isEmail().withMessage("Enter a valid email").normalizeEmail(),
  body("otp").isString().matches(/^\d{6}$/).withMessage("Enter the 6-digit OTP"),
];

const resetPasswordValidation = [
  ...otpValidation,
  body("newPassword").isString().isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

function makeOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function validOtp(user, hashField, expiryField, attemptsField, otp) {
  const expiry = user[expiryField];
  if (!user[hashField] || !expiry || expiry.getTime() < Date.now()) {
    return { ok: false, message: "OTP is invalid or expired. Request a new OTP." };
  }
  if ((user[attemptsField] || 0) >= MAX_OTP_ATTEMPTS) {
    return { ok: false, message: "Too many incorrect attempts. Request a new OTP." };
  }
  if (hashOtp(otp) !== user[hashField]) {
    user[attemptsField] = (user[attemptsField] || 0) + 1;
    return { ok: false, message: "Incorrect OTP." };
  }
  return { ok: true };
}

function clearOtp(user, prefix) {
  user[`${prefix}OtpHash`] = undefined;
  user[`${prefix}OtpExpiresAt`] = undefined;
  user[`${prefix}OtpAttempts`] = 0;
}

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    const error = new Error("Email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.");
    error.statusCode = 503;
    throw error;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendOtpEmail(email, otp, purpose) {
  const transporter = createTransporter();
  const purposeText = {
    verification: "verify your CodeForge email address",
    login: "log in to your CodeForge account",
    reset: "reset your CodeForge password",
  }[purpose];

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your CodeForge verification code",
    text: `Your OTP to ${purposeText} is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2>CodeForge verification</h2><p>Use this code to ${purposeText}:</p><div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px;background:#f3f4f6;text-align:center">${otp}</div><p>This code expires in 10 minutes. Do not share it with anyone.</p></div>`,
  });
}

function issueToken(user) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured.");
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d", issuer: "codeforge" }
  );
}

function userPayload(user) {
  return { id: user._id, username: user.username, email: user.email, role: user.role };
}

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

async function register(req, res) {
  if (!checkValidation(req, res)) return;
  try {
    const { username, email, password } = req.body;
    let user = await User.findOne({ email }).select("+emailOtpHash +emailOtpExpiresAt +emailOtpAttempts +emailOtpLastSentAt");
    if (user && user.emailVerified !== false) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    if (user && user.emailOtpLastSentAt &&
        Date.now() - user.emailOtpLastSentAt.getTime() < OTP_RESEND_WAIT_MS) {
      return res.status(429).json({ message: "Please wait before requesting another OTP." });
    }

    const otp = makeOtp();
    if (!user) {
      user = new User({ username, email, password, emailVerified: false });
    } else {
      // Allow an unverified registration to be safely restarted with new details.
      user.username = username;
      user.password = password;
      user.emailVerified = false;
    }
    user.emailOtpHash = hashOtp(otp);
    user.emailOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    user.emailOtpAttempts = 0;
    user.emailOtpLastSentAt = new Date();

    await sendOtpEmail(email, otp, "verification");
    await user.save();

    return res.status(201).json({
      message: "OTP sent to your email. Verify it to activate your account.",
      email,
      requiresVerification: true,
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Unable to start registration.",
    });
  }
}

async function verifyEmailOtp(req, res) {
  if (!checkValidation(req, res)) return;
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email })
      .select("+emailOtpHash +emailOtpExpiresAt +emailOtpAttempts");
    if (!user || user.emailVerified !== false) {
      return res.status(400).json({ message: "No pending email verification found." });
    }

    const result = validOtp(user, "emailOtpHash", "emailOtpExpiresAt", "emailOtpAttempts", otp);
    if (!result.ok) {
      await user.save();
      return res.status(400).json({ message: result.message });
    }

    user.emailVerified = true;
    clearOtp(user, "email");
    await user.save();

    const token = issueToken(user);
    return res.status(200).json({
      message: "Email verified successfully.",
      token,
      user: userPayload(user),
    });
  } catch (error) {
    console.error("Email OTP verification error:", error.message);
    return res.status(500).json({ message: "Unable to verify email." });
  }
}

async function resendVerificationOtp(req, res) {
  if (!checkValidation(req, res)) return;
  try {
    const { email } = req.body;
    const user = await User.findOne({ email })
      .select("+emailOtpLastSentAt +emailOtpHash +emailOtpExpiresAt +emailOtpAttempts");
    if (!user || user.emailVerified !== false) {
      return res.status(404).json({ message: "No pending verification found for this email." });
    }
    if (user.emailOtpLastSentAt && Date.now() - user.emailOtpLastSentAt.getTime() < OTP_RESEND_WAIT_MS) {
      return res.status(429).json({ message: "Please wait 60 seconds before requesting another OTP." });
    }
    const otp = makeOtp();
    user.emailOtpHash = hashOtp(otp);
    user.emailOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    user.emailOtpAttempts = 0;
    user.emailOtpLastSentAt = new Date();
    await sendOtpEmail(email, otp, "verification");
    await user.save();
    return res.json({ message: "A new OTP has been sent." });
  } catch (error) {
    console.error("Resend verification OTP error:", error.message);
    return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Unable to resend OTP." });
  }
}

async function login(req, res) {
  if (!checkValidation(req, res)) return;
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.emailVerified === false) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }
    return res.status(200).json({
      message: "Login successful",
      token: issueToken(user),
      user: userPayload(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function requestLoginOtp(req, res) {
  if (!checkValidation(req, res)) return;
  try {
    const { email } = req.body;
    const user = await User.findOne({ email })
      .select("+loginOtpLastSentAt +loginOtpHash +loginOtpExpiresAt +loginOtpAttempts");
    // Use the same response for unknown and known addresses to reduce account enumeration.
    if (!user || user.emailVerified === false) {
      return res.status(200).json({ message: "If the account is eligible, a login OTP has been sent." });
    }
    if (user.loginOtpLastSentAt && Date.now() - user.loginOtpLastSentAt.getTime() < OTP_RESEND_WAIT_MS) {
      return res.status(429).json({ message: "Please wait before requesting another OTP." });
    }
    const otp = makeOtp();
    user.loginOtpHash = hashOtp(otp);
    user.loginOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    user.loginOtpAttempts = 0;
    user.loginOtpLastSentAt = new Date();
    await sendOtpEmail(email, otp, "login");
    await user.save();
    return res.json({ message: "If the account is eligible, a login OTP has been sent." });
  } catch (error) {
    console.error("Login OTP request error:", error.message);
    return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Unable to request login OTP." });
  }
}

async function verifyLoginOtp(req, res) {
  if (!checkValidation(req, res)) return;
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email })
      .select("+loginOtpHash +loginOtpExpiresAt +loginOtpAttempts");
    if (!user || user.emailVerified === false) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }
    const result = validOtp(user, "loginOtpHash", "loginOtpExpiresAt", "loginOtpAttempts", otp);
    if (!result.ok) {
      await user.save();
      return res.status(400).json({ message: result.message });
    }
    clearOtp(user, "login");
    await user.save();
    return res.json({ message: "Login successful", token: issueToken(user), user: userPayload(user) });
  } catch (error) {
    console.error("Verify login OTP error:", error.message);
    return res.status(500).json({ message: "Unable to verify login OTP." });
  }
}

async function forgotPassword(req, res) {
  if (!checkValidation(req, res)) return;
  try {
    const { email } = req.body;
    const user = await User.findOne({ email })
      .select("+passwordResetOtpLastSentAt +passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpAttempts");
    if (!user || user.emailVerified === false) {
      return res.status(200).json({ message: "If the account exists, a password reset OTP has been sent." });
    }
    if (user.passwordResetOtpLastSentAt && Date.now() - user.passwordResetOtpLastSentAt.getTime() < OTP_RESEND_WAIT_MS) {
      return res.status(429).json({ message: "Please wait before requesting another OTP." });
    }
    const otp = makeOtp();
    user.passwordResetOtpHash = hashOtp(otp);
    user.passwordResetOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    user.passwordResetOtpAttempts = 0;
    user.passwordResetOtpLastSentAt = new Date();
    await sendOtpEmail(email, otp, "reset");
    await user.save();
    return res.json({ message: "If the account exists, a password reset OTP has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Unable to request password reset." });
  }
}

async function resetPassword(req, res) {
  if (!checkValidation(req, res)) return;
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email })
      .select("+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpAttempts");
    if (!user || user.emailVerified === false) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }
    const result = validOtp(user, "passwordResetOtpHash", "passwordResetOtpExpiresAt", "passwordResetOtpAttempts", otp);
    if (!result.ok) {
      await user.save();
      return res.status(400).json({ message: result.message });
    }
    user.password = newPassword;
    clearOtp(user, "passwordReset");
    await user.save();
    return res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error.message);
    return res.status(500).json({ message: "Unable to reset password." });
  }
}

module.exports = {
  register, login, registerValidation, loginValidation,
  verifyEmailOtp, resendVerificationOtp, emailValidation, otpValidation,
  requestLoginOtp, verifyLoginOtp, forgotPassword, resetPassword, resetPasswordValidation,
};
