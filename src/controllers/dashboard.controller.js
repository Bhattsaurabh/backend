import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {mongoose} from "mongoose"


const getChannelStats = asyncHandler(async (req, res) =>{

    try {
        const {channelId} = req.params
        //console.log(channelId)
        if(!channelId)
        {
             throw new ApiError(400, "channel not found")
        }
    
        const totalVideoUploaded = await Video.countDocuments({"owner": {$eq: channelId}})
    
        const totalViews = await Video.countDocuments({"views": {$exists: true}})
    
        const totalSubscribers = await Subscription.countDocuments({"channel" : {$eq: channelId}})
    
        const totalLikes = await Like.countDocuments({"likedBy" : {$exists: true}})
        
        totalVideoUploaded === null ? 0 : totalVideoUploaded
        totalViews === null ? 0 : totalViews
        totalSubscribers === null ? 0 : totalSubscribers
        totalLikes === null ? 0 : totalLikes

        const response = {totalVideoUploaded, totalViews, totalSubscribers, totalLikes}

        return res
        .status(200)
        .json( new ApiResponse( 200, 
             response,
            "Channel stats fetched successfully"
        ))
    } catch (error) {
        throw new ApiError(500, error.message || "Internal server error failed to fetch channel stats")
    }

})

const getChannelAllVideos = asyncHandler(async(req, res)    =>{

   try {
     const {channelId} = req.params
     
     if(!channelId)
     {
          throw new ApiError(400, "channel not found")
     }
 
     const check = await User.findOne({_id: channelId})
     if(!check)
     {
         throw new ApiError(401, "channel not exist")
     }
 
     const videos = await Video.find({owner: channelId})
     
    // console.log(videos)
     return res
     .status(200)
     .json( new ApiResponse(200, videos === null ? "No video posted" : videos, "Videos fetched successfully"))
   } catch (error) {
        throw new ApiError(500, error.message || "Internal server error failed to fetched videos")
   }

})


export {getChannelStats, getChannelAllVideos}