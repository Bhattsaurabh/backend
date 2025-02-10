import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { Comment} from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import {Tweet} from "../models/tweet.model.js"
import { Like } from "../models/like.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {mongoose} from "mongoose"


const toggleVideoLike = asyncHandler(async  (req, res)  =>{

    try {
        const {videoId} = req.params
        const userId = req.user?._id
    
        if(!videoId)
        {
            throw new ApiError(400, "video not found")
        }
    
        const isLiked = await Like.findOne({
            video: videoId,
            likedBy: userId
        })
    
        const response = isLiked ? 
                         await Like.deleteOne({  video: videoId, likedBy: userId})
                         : await Like.create({video: videoId, likedBy: userId})
    
        if(!response)
        {
            throw new ApiError(500, "Internal server error failed to perform like action")
        }
    
        return res
        .status(200)
        .json( new ApiResponse(200, response, isLiked === null ? "video liked successfully" : "video disliked successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "something went wrong failed to update like")
    }


})

const toggleCommentLike = asyncHandler(async  (req, res)  =>{

    try {
        const {commentId} = req.params
        const userId = req.user?._id
    
        if(!commentId)
        {
            throw new ApiError(400, "comment not found")
        }
    
        const isLiked = await Like.findOne({
            comment: commentId,
            likedBy: userId
        })
    
        const response = isLiked ? 
                         await Like.deleteOne({comment: commentId, likedBy: userId})
                         : await Like.create({comment: commentId, likedBy: userId})
    
        if(!response)
        {
            throw new ApiError(500, "Internal server error failed to perform like action")
        }
    
        return res
        .status(200)
        .json( new ApiResponse(200, response, isLiked === null ? "comment liked successfully" : "comment disliked successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "something went wrong failed to update like")
    }


})

const toggleTweetLike = asyncHandler(async  (req, res)  =>{

    try {
        const {tweetId} = req.params
        const userId = req.user?._id
    
        if(!tweetId)
        {
            throw new ApiError(400, "comment not found")
        }
    
        const isLiked = await Like.findOne({
            tweet: tweetId,
            likedBy: userId
        })
    
        const response = isLiked ? 
                         await Like.deleteOne({tweet: tweetId, likedBy: userId})
                         : await Like.create({tweet: tweetId, likedBy: userId})
    
        if(!response)
        {
            throw new ApiError(500, "Internal server error failed to perform like action")
        }
    
        return res
        .status(200)
        .json( new ApiResponse(200, response, isLiked === null ? "tweet liked successfully" : "tweet disliked successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "something went wrong failed to update like")
    }


})


const getLikedVideos = asyncHandler(async(req, res) =>{

   try {
     const userId = req.user?._id
    // console.log(userId)
     if(!userId)
     {
        throw new ApiError(400, "unauthorized user")
     }
 
     const pipeline = [
         {
             $match: {
                 likedBy: new mongoose.Types.ObjectId(userId)
             }
         },
         {
             $lookup: {
                 from: "Video",
                 localField: "video",
                 foreignField: "_id",
                 as: "videos",
                 pipeline: [
                    {
                        $lookup: {
                           from: "User",
                           localField: "owner",
                           foreignField: "_id",
                           as: "owner",
                           pipeline: [
                               {
                                   $project: {
                                       fullName: 1,
                                       username: 1,
                                       avatar: "$avatar.url"
                                   }
                               }
                           ] 
                        }   
                    },
                    {
                        $addFields: {
                            videoOwner: {
                                $first: "$owner"
                                    }
                        }
                    },
                    {
                        $addFields: {
                            videoFile: "$videoFile.url"
                        }
                    },
                    {
                        $addFields: {
                            thumbnail: "$thumbnail.url"
                        }
                    },

                 ]
             }
         }
        
     ]
 
 
     const likedVideos = await Like.aggregate(pipeline)
     //console.log(likedvideos)

     if(!likedVideos)
     {
          throw new ApiError(500, "Internal server error failed to get liked videos")
     }
 
     return res
     .status(200)
     .json( new ApiResponse(200, likedVideos, "Liked videos fetched successfully"))
   } catch (error) {
        throw new ApiError(500, error.message || "Internal server error failed to load liked videos")
   }


})


export {toggleVideoLike, toggleCommentLike,  toggleTweetLike, getLikedVideos}