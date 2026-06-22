const { required } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required:true,
    },

    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required:true,
    },

    checkIn: {
        type: Date,
        required: true
    },

    checkOut: {
        type: Date,
        required: true
    },

    guests: {
        type: Number,
        default: 1
    },
    basePrice: {
        type: Number,
        required: true
    },

    gst: {
        type: Number,
        required: true
    },

    serviceFee: {
        type: Number,
        required: true
    },

    totalPrice: {
        type: Number,
        required:true,
    },
    discount: {
        type: Number,
        default: 0
    },

    couponCode: {
        type: String,
        default: null
    },

    status: {
        type: String,
        enum:["confirmed","cancelled","completed"],
        default: "confirmed"
    },
    paymentId: {
        type: String
    },
    orderId: {
        type: String
    },

    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Booking", bookingSchema);