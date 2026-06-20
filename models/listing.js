const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Reveiw = require("./review.js");


const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description:{
      type:String,
  },
  image: {
    url:String,
    filename:String
  },
  price: Number,
  location: String,
  country: String,
  reviews:[
    {
      type:Schema.Types.ObjectId,
      ref:"Review",
    },
  ],
  owner:{
      type:Schema.Types.ObjectId,
      ref:"User",
  },
  geometry: {
        type: {
            type: String,
            enum: ["Point"],
        },
        coordinates: {
            type: [Number],
        },
    },
});

// deleting Listing -- using middlewere post method 
listingSchema.post("findOneAndDelete",async(listing)=> {
  if(listing){
      await Reveiw.deleteMany({_id:{$in:listing.reviews}});
  } 
})

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;

