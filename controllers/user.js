const User = require("../models/user.js");
const OTP = require("../models/otp");
const generateOTP = require("../utils/generateOTP");
const sendOTPEmail  = require("../utils/sendEmail");
const Booking = require("../models/booking");

module.exports.renderSignupForm = (req,res) => {
     res.render("users/signup.ejs"); 
}

module.exports.sendOTP = async(req,res,next) => {
    try{

        const {email} = req.body;
         
        const existingUser = await User.findOne({ email });

        if(existingUser){
            return res.status(400).json({
                success:false,
                message:"Email already registered!"
            });
        }
         
        const otp = generateOTP();
        await OTP.deleteMany({ email });

        await OTP.create({
            email,
            otp,
        });

        await sendOTPEmail(email, otp);
        res.json({ success:true,
                   message:"OTP sent successfully"
                });

    }catch(err){
         console.error("OTP ERROR:", err);

        return res.status(500).json({
            success:false,
            message:err.message
        });
    }
};

// SignUp function
module.exports.signup = async(req,res,next) => {
    try{
        const {username,email,password,otp} = req.body;
        const otpRecord = await OTP.findOne({ email, otp });

        if(!otpRecord){
            req.flash("error","Invalid or Expired OTP");
            return res.redirect("/signup");
        }
        
        const newUser = new User({email,username});
        const registeredUser =  await User.register(newUser,password); 
        await OTP.deleteMany({ email });

        req.login(registeredUser,(err) => {
            if(err){
                return next(err);
            }
            req.flash("success","Welcome to Wonderlust!");
            res.redirect("/listings");
        });
    }catch(err){
        req.flash("error",err.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req,res) => {
     res.render("users/login.ejs"); 
};

module.exports.login = async(req,res) => {
        req.flash("success", "Welcome back to Wonderlust!");
        let redirectUrl = res.locals.redirectUrl;
        if(redirectUrl){
           res.redirect(redirectUrl);
        }
        else{
            res.redirect("/listings");
        }
        
}

module.exports.updateProfile = async (req, res) => {
    const { username, email, bio, phone, age } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
        username,
        email,
        bio,
        phone,
        age
    });

    req.flash("success", "Profile updated successfully!");
    res.redirect("/listings");
};

module.exports.uploadProfileImage = async(req,res)=>{
    const url = req.file.path;
    const filename = req.file.filename;

    await User.findByIdAndUpdate(req.user._id,{
        profileImage:{
            url,
            filename
        }
    });

    req.flash("success","Profile image updated!");
    res.redirect("/listings");
};

module.exports.savedListings = async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate("savedListings");

    if (user.savedListings.length === 0) {
        req.flash("error", "No saved listings yet!");
        return res.redirect("/listings");
    }

    res.render("users/savedListings.ejs", {
        savedListings: user.savedListings
    });
};

module.exports.myTrips = async (req, res) => {
    const bookings = await Booking.find({
        user: req.user._id
    }).populate("listing");

    if (bookings.length === 0) {
        req.flash("error", "No trips booked yet!");
        return res.redirect("/listings");
    }
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let booking of bookings) {
        if (
            booking.status === "confirmed" &&
            new Date(booking.checkOut) < today
        ) {
            booking.status = "completed";
            await booking.save();
        }
    }

    res.render("users/myTrips.ejs", { bookings });
};

module.exports.cancelBooking = async (req, res) => {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/my-trips");
    }

    booking.status = "cancelled";
    await booking.save();
    
    console.log("Updated booking:", booking);
    req.flash("success", "Booking cancelled successfully");
    res.redirect("/my-trips");
};

module.exports.logout = (req,res,next) => {
    req.logout((err) => {
        if(err){
            return next(err);
        }
        req.flash("success","you are logged out!");
        res.redirect("/listings");
    }) 
}