const { string } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;


const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    profileImage: {
        url: {
            type: String,
            default: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"
        },
        filename: String
    },
    bio: {
        type: String,
        default: ""
    },
    phone: {
        type: String,
        default: ""
    },
    age: {
        type: Number
    },
    savedListings: [{
        type: Schema.Types.ObjectId,
        ref: "Listing"
    }],
}, {
    timestamps: true
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",userSchema);