const Groq = require("groq-sdk");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Listing = require("../models/listing");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

module.exports.renderChatPage = async(req,res,next)=>{
   try{

        if(!req.user){
            req.flash(
                "error",
                "Please login first"
            );

            return res.redirect("/login");
        }

        let conversation =
            await Conversation.findOne({
                user:req.user._id
            });

        if(!conversation){

            conversation =
            await Conversation.create({
                user:req.user._id,
                title:"New Chat",
            });
        }

        let listing = null;
        if(req.query.listingId){
            listing = await Listing.findById(req.query.listingId);
        }
        console.log("Listing:", listing);
        res.render("chat/chat",{
                conversationId:conversation._id,
                listing
            }
        );
    }catch(err){
        next(err);
    }
};

module.exports.sendMessage = async(req,res,next)=>{
    try{
        const { message,conversationId,listingContext } = req.body;
        
        const savedMessage =  await Message.create({
            conversation:conversationId,
            role:"user",
            content:message,
        });
        
        const previousMessages =
            await Message.find({
            conversation: conversationId
        }).sort({ createdAt: 1 });

        const listingInfo = listingContext ?`
                IMPORTANT:The user is currently viewing this listing.
                Current Wanderlus Listing:
                    Title: ${listingContext.title}
                    Description: ${listingContext.description}
                    Location: ${listingContext.location}
                    Price: ₹${listingContext.price}
                    Country: ${listingContext.country}

                    When answering questions about "this listing",
                    Use this information when answering.
                    `
                : "";

        const chatHistory = [
                    {
                        role:"system",
                        content:`
                        You are Wanderlust AI Assistant.

                        ${listingInfo}

                        If listing information is available,
                        prioritize it over general travel advice.

                        If the user asks about:
                        - this listing
                        - this property
                        - this stay
                        - this accommodation
                        - here

                        assume they are referring to the current listing provided above.

                        You ONLY answer questions related to:

                        - Travel
                        - Travel destinations
                        - Tourism
                        - Hotels
                        - Airbnb
                        - Wanderlust listings
                        - Accommodation
                        - Booking related questions
                        - Property recommendations
                        - Family trips
                        - Budget trips
                        - Luxury stays
                        - Travel planning

                        When listing information is available:
                        - Use the listing title, description, location and price.
                        - Answer questions about suitability, pricing, location and amenities based on the listing details.
                        - Do not say the listing is undefined if listing information is provided.

                        Do not answer:
                        - Coding
                        - DSA
                        - Programming
                        - Politics
                        - Sports
                        - General knowledge unrelated to travel

                        If unrelated, respond exactly:

                        "I can only help with Wanderlust and travel-related questions."
                        `
                    }
                ];

        previousMessages.forEach((msg)=>{
            chatHistory.push({
                role: msg.role,
                content: msg.content
            });
        });  

        const completion =
            await groq.chat.completions.create({
                model:"llama-3.3-70b-versatile",
                messages: chatHistory,
        });

        const reply =
            completion.choices[0].message.content;

        await Message.create({
            conversation: conversationId,
            role: "assistant",
            content: reply,
        }); 

        res.json({
            success:true,
            reply
        });

    }catch(err){
        next(err);
    }
};