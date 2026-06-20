const Listing = require("./models/listing.js");
const Review = require("./models/review.js")
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema,reviewSchema} = require("./schema.js");
const { findById } = require("./models/review.js");

module.exports.isLoggedIn = (req,res,next) => {
      if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","you must be logged in to create listing!");
        return res.redirect("/login"); 
      }
      next();
}

module.exports.saveRedirectUrl = (req,res,next) => {
  if(req.session.redirectUrl){
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
}

module.exports.isOwner = async(req,res,next) => {
  let {id} = req.params;
  let listing = await Listing.findById(id);
  if(res.locals.currUser && !listing.owner.equals(res.locals.currUser._id)){
      req.flash("error","You are not the owner of this listing");
      return res.redirect(`/listings/${id}`);
  }
  next();
}

module.exports.isReviewAuthor = async(req,res,next) => {
  let {id,reviewId} = req.params;
  let review = await Review.findById(reviewId);
  if(!review.author.equals(res.locals.currUser._id)){
      req.flash("error","You did't create this review");
      return res.redirect(`/listings/${id}`);
  }
  next();
}

// Validate Listingschema Server side 
module.exports.validateListing = (req,res,next) => {
    let {error} = listingSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400,errMsg);
    }else{
        next();
    }
};

// Returing to same filtered page
module.exports.saveReturnTo = (req, res, next) => {
    if (req.originalUrl.includes("/listings/filter") || req.originalUrl.includes("/listings/search")) {
        req.session.returnTo = req.originalUrl;
    }
    next();
};

// Validate Reviewschema Server side 
module.exports.validateReview = (req,res,next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400,errMsg);
    }else{
        next();
    }
};