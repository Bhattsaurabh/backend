import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { Comment} from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {mongoose} from "mongoose"


const addComment = asyncHandler(async(req, res) => {

    try {
        const {videoId} = req.params
        const {content} = req.body
        const userId = req.user?._id

        if(!videoId)
        {
            throw new ApiError(400, "video not found")
        }
        
        if(!content || content.trim() === "")
            {
                throw new ApiError(400, "comment cannot be empty")
            }
    
    
        const newComment  = await Comment.create({
            content:  content,
            video: videoId,
            owner: userId
        })
    
        if(!newComment)
        {
             throw new ApiError(500, "Internal server error failed to add comment")
        }
    
        return res
        .status(200)
        .json( new ApiResponse(200, newComment, "comment added successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "something went wrong failed to add comment")
        
    }

})

const updateComment = asyncHandler(async(req, res) => {

    try {
        const {commentId} = req.params
        const {content} = req.body
        const userId = req.user?._id
        
        if(!commentId)
        {
            throw new ApiError(400, "comment not found")
        }
        if(!content || content.trim() === "")
        {
            throw new ApiError(400, "comment cannot be empty some updation required")
        }

        const check = await Comment.findOne({
            _id: commentId,
            owner: userId
        })

        if(!check)
        {
            throw new ApiError(401, "comment not exists")
        }
        
    
        const updatecomment = await Comment.findByIdAndUpdate(
            commentId,
            {
                $set: {
                         content: content
                      }
            },
            {
                new : true
            }
        )
    
    
        if(!updatecomment)
        {
            throw new ApiError(500, "Internal server error failed to update comment")
        }
    
        return res
        .status(200)
        .json( new ApiResponse(200, updatecomment, "comment updated successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "something went wrong failed update comment")
    }
    

})


const deleteComment = asyncHandler(async(req, res) => {

    try {
        const {commentId} = req.params
        const userId = req.user?._id
    
        if(!commentId)
        {
            throw new ApiError(400, "comment not found")
        }
        
        const check = await Comment.findOne({
            _id: commentId,
            owner: userId
        })

        if(!check)
        {
            throw new ApiError(401, "comment not exist")
        }
    
        const deletecomment = await Comment.findByIdAndDelete(commentId)
    
        if(!deletecomment)
        {
            throw new ApiError(500, "Internal server error failed to delete comment")
        }
    
        return res
        .status(200)
        .json( new ApiResponse(200, deletecomment, "comment deleted successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "something went wrong failed to delete comment")
    }
    

})


const getVideoComments = asyncHandler(async (req, res)  =>{

     
    try {
        const {videoId} = req.params
         
         if(!videoId)
         {
            throw new ApiError(400, "video not found")
         }
    
    
         const pipeline = [
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "Video",
                    localField: "video",
                    foreignField: "_id",
                    as: "comments",
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
                        }
                    ]
                }
            }
    
         ]  
    
         const comments = await Comment.aggregate(pipeline)
    
         if(!comments)
         {
            throw new ApiError(500, "Internal server error failed to load comments")
         }
    
         return res
         .status(200)
         .json( new ApiResponse(200, comments, "comments fetched successfully"))
    } catch (error) {
            throw new ApiError(500, error.message || "Internal server error failed to load all comments")
    }


})


export {addComment, updateComment, deleteComment, getVideoComments}