const Listing = require("../models/listing.js");
const axios = require("axios");
const User = require("../models/user");
const Booking = require("../models/booking");

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

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check-In
    if (start < today) {
        req.flash("error", "Check-in cannot be in the past");
        return res.redirect(`/listings/${id}`);
    }
    // Check-Out 
    if (end <= start) {
       req.flash("error", "Check-out must be after check-in");
       return res.redirect(`/listings/${id}`);
    }

    const totalDays = Math.ceil(
        (end - start) / (1000 * 60 * 60 * 24)
    );
    if (totalDays < 1) {
        req.flash("error", "Invalid booking duration");
        return res.redirect(`/listings/${id}`);
    }
    const existingBooking = await Booking.findOne({
        listing: id,
        status: "confirmed",
        checkIn: { $lt: end },
        checkOut: { $gt: start }
    });
    if (existingBooking) {
        req.flash("error", "These dates are already booked");
        return res.redirect(`/listings/${id}`);
    }

    const totalPrice = totalDays * listing.price;

    const booking = new Booking({
        user: req.user._id,
        listing: listing._id,
        checkIn,
        checkOut,
        guests,
        totalPrice,
    });

    await booking.save();

    req.flash("success", "Booking confirmed!");
    res.redirect(`/listings/${id}`);
};


// deleting listing
module.exports.deleteListing = async(req,res) => {
    let {id} = req.params;
    let deletedlist = await Listing.findByIdAndDelete(id);
    console.log(deletedlist);
    req.flash("success","Listing Deleted!");
    res.redirect(`/listings`);
}