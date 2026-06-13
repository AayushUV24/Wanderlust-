const User = require("../models/user.js");

module.exports.renderSignupForm = (req,res) => {
     res.render("users/signup.ejs"); 
}

module.exports.signup = async(req,res,next) => {
    try{
        let {username,email,password} = req.body;
        const newUser = new User({email,username});
        const registeredUser =  await User.register(newUser,password); 
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