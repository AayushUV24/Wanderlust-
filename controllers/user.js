const User = require("../models/user.js");
const OTP = require("../models/otp");
const generateOTP = require("../utils/generateOTP");
const sendOTPEmail  = require("../utils/sendEmail");

module.exports.renderSignupForm = (req,res) => {
     res.render("users/signup.ejs"); 
}

module.exports.sendOTP = async(req,res,next) => {
    try{
        console.log("OTP route hit");

        console.log("EMAIL_USER =", process.env.EMAIL_USER);
        console.log("EMAIL_PASS exists =", !!process.env.EMAIL_PASS);

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
        console.log("Email sent successfully");
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

module.exports.logout = (req,res,next) => {
    req.logout((err) => {
        if(err){
            return next(err);
        }
        req.flash("success","you are logged out!");
        res.redirect("/listings");
    }) 
}