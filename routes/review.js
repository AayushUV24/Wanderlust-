const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const Review = require("../models/review.js")
const Listing = require("../models/listing.js")
const {isLoggedIn, isOwner ,validateReview,isReviewAuthor} = require("../middlewere.js"); 
const reviewController = require("../controllers/reviews.js");


// Reveiws ---->  post route
router.post("/",isLoggedIn,validateReview,wrapAsync(reviewController.createReview));

// Delete Review route
router.delete("/:reviewId",isLoggedIn,isReviewAuthor,wrapAsync(reviewController.deleteReview));

module.exports = router;
