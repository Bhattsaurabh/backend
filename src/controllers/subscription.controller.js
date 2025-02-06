import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose"


const toggleSubscription = asyncHandler(async (req, res)=> {

    try {
        const {channelId} = req.params
       // console.log(channelId)
    
        if(!channelId)
        {
            throw new ApiError(400, "channel not found")
        }
        //console.log(req.user?._id)
        if(!req.user?._id)
        {
            throw new ApiError(400, "user not found ")
        }
    
        const subscriberId = req.user?._id;
    
        const isSubscribed = await Subscription.findOne({subscriber: subscriberId, channel: channelId })
        //console.log(isSubscribed)
    
        const response = isSubscribed 
                        ?  await Subscription.deleteOne({subscriber: subscriberId, channel: channelId}) 
                        :  await Subscription.create({subscriber: subscriberId, channel: channelId}) 
    
        //console.log(response)
        return res
        .status(200)
        .json(new ApiResponse(200, response, isSubscribed === null ? "subscribed successfully" : "unsubscribed successfully" ))
    
    } catch (error) {
        throw new ApiError(500, "Internal server error failed to toggle subscription")
        
    }

})


const getUserChannelSubscriber = asyncHandler(async(req, res) =>{
    const {channelId} = req.params

    if(!channelId)
    {
        throw new ApiError(401, " channel not found")
    }

    const user = User.findById(req.user?._id, {_id : 1})
    if(!user)
        {
            throw new ApiError(401, "unauthorized user")
        }

    const pipeline = [
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from :"users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: "$avatar?.url"
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriber: {
                    $first: "$subscriber",
                }
            }
        }
    ]

   try {
     const subscribers = await Subscription.aggregate(pipeline)
     const subscriberList = subscribers.map(item => item.subscriber)
 
     return res
     .status(200)
     .json( new ApiResponse(200, subscriberList, "subscriber List fetched successfully"))
   } catch (error) {
        throw new ApiError(500, "Internal server error failed to fetched subscriber list")
   }
    
})


const getSubscribedChannel = asyncHandler(async(req, res) =>{
    const {subscriberId} = req.params

    console.log(subscriberId)

    if(!subscriberId)
    {
        throw new ApiError(401, " user not found")
    }
    if(!req.user?._id)
    {
        throw new ApiError(401, " unauthorized user")
    }

    const pipeline = [
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from :"users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedTo",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: "$avatar?.url"
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribedTo"
        },
        {
            $project: {
                subscribedchannel: "$subscribedTo"
                
            }
        }
    ]

   try {
     const subsChannels = await Subscription.aggregate(pipeline)
     const subscribedChannelList = subsChannels.map(item => item.subscribedchannel)
     console.log(subscribedChannelList)

     return res
     .status(200)
     .json( new ApiResponse(200, subscribedChannelList, "channel List subscribed by user fetched successfully"))
   } catch (error) {
        throw new ApiError(500, "Internal server error failed to fetched channel List subscribed by user")
   }
    
})


export {toggleSubscription, getUserChannelSubscriber, getSubscribedChannel}