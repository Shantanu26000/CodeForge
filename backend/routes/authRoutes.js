
const express = require("express");
const {
  register,
  login,
  registerValidation,
  loginValidation,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);

module.exports = router;
