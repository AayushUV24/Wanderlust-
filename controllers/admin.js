const User =
require("../models/user");

const Listing =
require("../models/listing");

const Review =
require("../models/review");

const Conversation =
require("../models/Conversation");

const Message =
require("../models/Message");

module.exports.dashboard =
async(req,res,next)=>{

    try{

        const totalUsers =
        await User.countDocuments();

        const totalListings =
        await Listing.countDocuments();

        const totalReviews =
        await Review.countDocuments();

        const totalConversations =
        await Conversation.countDocuments();

        const totalMessages =
        await Message.countDocuments();

        const recentConversations = await Conversation.find()
                                   .populate("user")
                                   .sort({ createdAt: -1 })
                                   .limit(5);
        
        const recentMessages = await Message.find({ role: "user"})
                                            .populate({
                                                path: "conversation",
                                                populate: {
                                                    path: "user",
                                                    model: "User"
                                                }
                                            })
                                            .sort({ createdAt: -1 })
                                            .limit(5);  
                                            
        const topQueries = await Message.aggregate([
                {
                   $match:{role:"user"}
                },
                {
                    $group:{ _id:"$content",count:{ $sum:1}}
                },
                {
                    $sort:{count:-1}
                },
                {
                    $limit:5
                }
            ]);  
        
        const recentUsers = await User.find()
                                    .sort({ createdAt: -1 })
                                    .limit(5);    

        res.render(
            "admin/dashboard",
            {
                totalUsers,
                totalListings,
                totalReviews,
                totalConversations,
                totalMessages,
                recentConversations,
                recentMessages,
                topQueries,
                recentUsers,
            }
        );

    }catch(err){
        next(err);
    }
};