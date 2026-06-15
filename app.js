if(process.env.NODE_ENV != 'production'){
    require('dotenv').config();
}
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const app = express();
const port = 8080;
require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const methodoverride = require("method-override");
const ejs_mate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const wrapAsync = require("./utils/wrapAsync.js");
const multer = require("multer");


const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");


const dbUrl = process.env.ATLASDB_URL;
main().then(() => {
    console.log("Connected to DB");
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodoverride("_method"));
const User = require("./models/user.js")
app.engine("ejs",ejs_mate);
app.use(express.static(path.join(__dirname,"/public")));
app.use(cookieParser());

const store = MongoStore.create({
    mongoUrl :dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter: 24 * 3600,
})

store.on("error",() => {
    console.log("Error in Mongo Session Store",err);
})

const secretOptions = {
    store,
    secret:process.env.SECRET,
    resave :false,
    saveUninitialized:true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
};


app.use(session(secretOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());  

app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);


// Multer Error Handler
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        req.flash("error", "Image size should be less than 3 MB");
        return res.redirect("/listings/new");
    }
    next(err);
});

// 404 Handler
app.use((req,res,next) => {
    next(new ExpressError(404,"Page not found!"));
});

// General Error Handler
app.use((err,req,res,next) => {
    let {statusCode=500,message="Something went wrong!"} = err;
    res.status(statusCode).render("error.ejs",{message});
    // res.status(statusCode).send(message);
});

app.listen(port,() => {
    console.log("Server is listening port:8080");
});