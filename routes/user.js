const express = require("express");
const wrapAsync = require("../utils/wrapAsync");
const router = express.Router();
const passport = require("passport");
const { saveRedirectUrl } = require("../middlewere.js");

const userController = require("../controllers/user.js");

// send OTP
router.post(
    "/send-otp",
    wrapAsync(userController.sendOTP)
);

// Signup 
router.route("/signup")
      .get(userController.renderSignupForm)
      .post(wrapAsync(userController.signup));  

// Login
router.route("/login")
      .get(userController.renderLoginForm)
      .post(saveRedirectUrl,
            passport.authenticate("local",{   
                failureRedirect:"/login",
                failureFlash:"Username or password is wrong"}),
            wrapAsync(userController.login));

// Logout 
router.get("/logout",userController.logout);

module.exports = router;