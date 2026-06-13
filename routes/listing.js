const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js")
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, isOwner ,validateListing} = require("../middlewere.js");
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