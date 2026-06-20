const express = require("express");
const wrapAsync = require("../utils/wrapAsync");
const router = express.Router();
const passport = require("passport");
const { saveRedirectUrl,isLoggedIn } = require("../middlewere.js");
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });
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

router.post( "/profile/upload-image",isLoggedIn,
                upload.single("profileImage"),
                userController.uploadProfileImage
            );

            
// profile update route 
router.post("/profile/update", isLoggedIn, userController.updateProfile);

// My Trip
router.get("/my-trips", isLoggedIn, userController.myTrips);
router.put("/bookings/:id/cancel", isLoggedIn, userController.cancelBooking);

router.get("/saved-listings", isLoggedIn, userController.savedListings);

// Logout 
router.get("/logout",userController.logout);

module.exports = router;