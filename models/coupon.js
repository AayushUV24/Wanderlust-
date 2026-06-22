const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },

    discountType: {
        type: String,
        enum: ["percentage", "flat"],
        required: true
    },

    discountValue: {
        type: Number,
        required: true
    },

    expiryDate: {
        type: Date
    },

    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model("Coupon", couponSchema);