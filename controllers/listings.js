const Listing = require("../models/listing.js");
const axios = require("axios");
const User = require("../models/user");
const Booking = require("../models/booking");
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");

async function getSavedListings(req) {
    let savedListings = [];

    if (req.user) {
        const user = await User.findById(req.user._id);
        savedListings = user.savedListings;
    }

    return savedListings;
}

async function getAvailabilityMap(listings) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let availabilityMap = {};

    for (let listing of listings) {
        const activeBooking = await Booking.findOne({
            listing: listing._id,
            status: "confirmed",
            checkIn: { $lte: today },
            checkOut: { $gt: today }
        });

        if (activeBooking) {
            let nextDate = new Date(activeBooking.checkOut);
            nextDate.setDate(nextDate.getDate() + 1);

            availabilityMap[listing._id] =
                nextDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short"
                });
        } else {
            availabilityMap[listing._id] = "Today";
        }
    }

    return availabilityMap;
}

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    const savedListings = await getSavedListings(req);
    const availabilityMap = await getAvailabilityMap(allListings);

    res.render("listings/index.ejs", {
        allListings,
        savedListings,
        availabilityMap
    });
};

module.exports.renderNewForm = async(req,res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async(req,res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate({path:"reviews",populate:{path:"author"}})
    .populate("owner");
    if(!listing){
       req.flash("error","Listing you requested for does not exist!");
       return res.redirect("/listings");
    }
    delete req.session.returnTo;
    res.render("listings/show.ejs",{listing});
};

module.exports.createListing = async(req,res,next) => {
    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url,filename};

    let location = `${req.body.listing.location}, ${req.body.listing.country}`;
    const response = await axios.get(
            "https://nominatim.openstreetmap.org/search",
        {
            params: {
                q: location,
                format: "json",
                limit: 1,
            },
            headers: {
               "User-Agent": "Wanderlust-App",
            },
        }
    );

    const lat = parseFloat(response.data[0].lat);
    const lon = parseFloat(response.data[0].lon);

    newListing.geometry = {
       type: "Point",
       coordinates: [lon, lat],
    };

    await newListing.save();
    
    req.flash("success","New Listing Created!");
    res.redirect("/listings");
};

module.exports.editRenderForm = async(req,res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
       req.flash("error","Listing you requested for does not exist!");
       return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs",{listing,originalImageUrl});
};

module.exports.updateListing = async(req,res) => {
    let {id} = req.params;
    let listing =  await Listing.findByIdAndUpdate(id,{...req.body.listing});
    if(typeof req.file != 'undefined'){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url,filename};
        await listing.save();
    }
    req.flash("success","Listing Updated!");
    res.redirect(`/listings/${id}`);
};

// Search logic
module.exports.searchListings = async (req, res) => {
    const { search } = req.query;

    if (!search) {
        req.flash("error", "Please enter a location");
        return res.redirect("/listings");
    }

    const listings = await Listing.find({
        $or: [{
                location: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                country: {
                    $regex: search,
                    $options: "i"
                }
            }
        ]
    });

    if (listings.length === 0) {
        req.flash("error", "No listings found");
        return res.redirect("/listings");
    }

    const savedListings = await getSavedListings(req);
    const availabilityMap = await getAvailabilityMap(listings);

    res.render("listings/index.ejs", {allListings: listings,savedListings,availabilityMap});
};

// Filter and sorting
module.exports.filterListings = async (req, res) => {
    const { price, sort } = req.query;

    let query = {};
    let sortQuery = {};

    // Price Filter
    if (price === "under-2000") {
        query.price = { $gte: 0, $lte: 2000 };
    } 
    else if (price === "2000-5000") {
        query.price = { $gte: 2000, $lte: 5000 };
    } 
    else if (price === "5000-8000") {
        query.price = { $gte: 5000, $lte: 8000 };
    } 
    else if (price === "8000-10000") {
        query.price = { $gte: 8000, $lte: 10000 };
    } 
    else if (price === "10000+") {
        query.price = { $gte: 10000 };
    }

    // Sorting
    if (sort === "lowToHigh") {
        sortQuery.price = 1;
    } 
    else if (sort === "highToLow") {
        sortQuery.price = -1;
    }

    const filteredListings = await Listing.find(query).sort(sortQuery);

    if (filteredListings.length === 0) {
        req.flash("error", "No listings found");
        return res.redirect("/listings");
    }

        const savedListings = await getSavedListings(req);
        const availabilityMap = await getAvailabilityMap(filteredListings);

        res.render("listings/index.ejs", {
            allListings: filteredListings,
            savedListings,
            availabilityMap
        });
};

// Searching my listing
module.exports.myListings = async (req, res) => {
    const myListings = await Listing.find({
        owner: req.user._id
    });

    if (myListings.length === 0) {
        req.flash("error", "You haven't created any listings yet!");
        return res.redirect("/listings");
    }

    res.render("listings/myListings.ejs", { myListings });
};
// saving listing logic
module.exports.toggleSaveListing = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(req.user._id);

    const alreadySaved = user.savedListings.includes(id);

    if (alreadySaved) {
        user.savedListings.pull(id);
        req.flash("success", "Removed from saved listings");
    } else {
        user.savedListings.push(id);
        req.flash("success", "Added to saved listings");
    }

    await user.save();

    res.redirect(req.get("Referrer") || "/listings");
};

// Booking logic 
module.exports.bookListing = async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut, guests } = req.body;

    const listing = await Listing.findById(id);
    if (!listing) {
        return res.status(404).json({
            success: false,
            message: "Listing not found"
        });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check-In
    if (start < today) {
        return res.status(400).json({
            success: false,
            message: "Check-in cannot be in the past"
        });
    }
    // Check-Out 
    if (end <= start) {
        return res.status(400).json({
            success: false,
            message: "Check-out must be after check-in"
        });
    }

    const totalDays = Math.ceil(
        (end - start) / (1000 * 60 * 60 * 24)
    );
    if (totalDays < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid booking duration"
        });
    }
    const existingBooking = await Booking.findOne({
        listing: id,
        status: "confirmed",
        checkIn: { $lt: end },
        checkOut: { $gt: start }
    });
    if (existingBooking) {
        return res.status(400).json({
            success: false,
            message: "These dates are already booked"
        });
    }
    const basePrice = totalDays * listing.price;
    const gst = Math.round(basePrice * 0.18);
    const serviceFee = Math.round(basePrice * 0.05);
    const totalPrice = basePrice + gst + serviceFee;

        const options = {
            amount: totalPrice * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        let order;

        try {
            order = await razorpay.orders.create(options);
        } catch (err) {
            console.log(err);
            return res.status(500).json({
                success: false,
                message: "Payment order creation failed"
            });
        };

        return res.json({
            success: true,
            order,
            pricing: {
                totalDays,
                basePrice,
                gst,
                serviceFee,
                totalPrice
            },
            bookingData: {
                listingId: listing._id,
                checkIn,
                checkOut,
                guests
            }
        });
};

// verify payment 
module.exports.verifyPayment = async (req, res) => {
    const { payment, bookingData, pricing } = req.body;

    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(
            payment.razorpay_order_id + "|" + payment.razorpay_payment_id
        )
        .digest("hex");

    if (generatedSignature !== payment.razorpay_signature) {
        return res.status(400).json({
            success: false,
            message: "Payment verification failed"
        });
    }

    const booking = new Booking({
        user: req.user._id,
        listing: bookingData.listingId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,

        basePrice: pricing.basePrice,
        gst: pricing.gst,
        serviceFee: pricing.serviceFee,
        totalPrice: pricing.totalPrice,

        paymentId: payment.razorpay_payment_id,
        orderId: payment.razorpay_order_id,
        paymentStatus: "paid",
        status: "confirmed"
    });

    await booking.save();

    res.json({
        success: true,
        message: "Booking confirmed"
    });
};

// invoice
module.exports.downloadInvoice = async (req, res) => {
    const { id } = req.params;

    const booking = await Booking.findById(id)
        .populate("user")
        .populate("listing");

    if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/my-trips");
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=invoice-${booking._id}.pdf`
    );

    doc.pipe(res);

    // Header
    doc.fontSize(26)
        .text("WANDERLUST HOMES", { align: "center" });

    doc.fontSize(18)
        .text("BOOKING INVOICE", { align: "center" });

    doc.moveDown();
    doc.text("================================================");
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Invoice ID: INV-${booking._id.toString().slice(-6).toUpperCase()}`);
    doc.text(`Date: ${new Date().toDateString()}`);

    doc.moveDown();

    doc.text(`Guest Name: ${booking.user.username}`);
    doc.text(`Booking ID: ${booking._id}`);

    doc.moveDown();

    doc.text(`Property: ${booking.listing.title}`);
    doc.text(`Location: ${booking.listing.location}, ${booking.listing.country}`);

    doc.moveDown();
    doc.text("-----------------------------------------------");
    doc.moveDown(0.5);

    doc.fontSize(14).text("STAY DETAILS");
    doc.moveDown(0.5);

    doc.fontSize(12);
    doc.text(`Check-In : ${booking.checkIn.toDateString()}`);
    doc.text(`Check-Out: ${booking.checkOut.toDateString()}`);
    doc.text(`Guests   : ${booking.guests}`);

    doc.moveDown();
    doc.text("-----------------------------------------------");
    doc.moveDown(0.5);

    doc.fontSize(14).text("PRICE BREAKDOWN");
    doc.moveDown(0.5);

    doc.fontSize(12);
    doc.text(`Base Price       : Rs. ${booking.basePrice.toLocaleString("en-IN")}`);
    doc.text(`GST (18%)        : Rs. ${booking.gst.toLocaleString("en-IN")}`);
    doc.text(`Service Fee (5%) : Rs. ${booking.serviceFee.toLocaleString("en-IN")}`);

    doc.moveDown();
    doc.text("-----------------------------------------------");

    doc.moveDown(0.5);
    doc.fontSize(16);
    doc.text(`TOTAL PAID: Rs. ${booking.totalPrice.toLocaleString("en-IN")}`);

    doc.moveDown(2);

    doc.fontSize(12);
    doc.text(`Payment ID    : ${booking.paymentId}`);
    doc.text(`Payment Status: ${booking.paymentStatus.toUpperCase()}`);

    doc.moveDown(2);
    doc.text("Thank you for choosing WanderLust", {
        align: "center"
    });

    doc.moveDown();
    doc.text("================================================", {
        align: "center"
    });

    doc.end();
};

// deleting listing
module.exports.deleteListing = async(req,res) => {
    let {id} = req.params;
    let deletedlist = await Listing.findByIdAndDelete(id);
    // console.log(deletedlist);
    req.flash("success","Listing Deleted!");
    res.redirect(`/listings`);
}