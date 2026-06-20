const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js")
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, isOwner ,validateListing,saveReturnTo} = require("../middlewere.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer({storage,
                        limits: {
                              fileSize: 3 * 1024 * 1024, // 5 MB
                        },
                        fileFilter: (req, file, cb) => {
                            const allowedTypes = [
                                   "image/jpeg",
                                   "image/jpg",
                                   "image/png",
                                   "image/webp"
                              ];

                        if (allowedTypes.includes(file.mimetype)) {
                            cb(null, true);
                        }else {
                            cb(new Error("Only image files are allowed"));
                        }
                        }
                  });

// Index Route and Create Route 
router.route("/")
      .get(wrapAsync(listingController.index))
      .post(isLoggedIn,validateListing,
            upload.single('listing[image]'), 
            wrapAsync(listingController.createListing
      ));

// New Route
router.get("/new",isLoggedIn,listingController.renderNewForm);

// Search Route 
router.get("/search",saveReturnTo ,wrapAsync(listingController.searchListings));

// Filter Route
router.get("/filter",saveReturnTo ,wrapAsync(listingController.filterListings));

// my Listing 
router.get("/my-listings", isLoggedIn, wrapAsync(listingController.myListings));

// save listing
router.post("/:id/save", isLoggedIn, wrapAsync(listingController.toggleSaveListing));

// booking listing
router.post("/:id/book", isLoggedIn, wrapAsync(listingController.bookListing));

// Edit Route
router.get("/:id/edit",isLoggedIn,isOwner,wrapAsync(listingController.editRenderForm));        

// Show route , Update route and delete route       
router.route("/:id") 
      .get(wrapAsync(listingController.showListing))
      .put(isLoggedIn,isOwner,
           validateListing, 
           upload.single('listing[image]'),
           wrapAsync(listingController.updateListing)
       )
      .delete(isLoggedIn,isOwner,wrapAsync(listingController.deleteListing));


module.exports = router;