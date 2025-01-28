import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose, { isValidObjectId } from "mongoose"
import { response } from "express"


const createTweet = asyncHandler(async (req, res) => {

   try {
     
     const  content  = req.body.content
     const  userid  = req.user._id
    console.log(userid)
     const user = await User.findById(userid)

     if(!user)
     {
         throw new ApiError(400, "user not found")
     }

     if (!content) {
         throw new ApiError(400, "Tweet can not be empty")
     }
 
       const createTweet =  new Tweet({
             content: content,
             owner: userid
        })

        await createTweet.save()
 
        if(!createTweet)
        {
             throw new ApiResponse(500, "Error occured while posting tweet")
        }
      
         return res
             .status(200)
             .json(new ApiResponse(200, { createTweet }, "Tweet Posted Successfully"))
   } catch (error) {
    throw new ApiError(500, error.message || "Something went wrong Tweet not Posted Successfully")
   }

})

const updateTweet = asyncHandler(async (req, res) => {

    try {
        const {tweetid} = req.params
        const {content} = req.body
        const userid = req.user._id
        // console.log(tweetid)
        // console.log(content)
        // console.log(userid)

        if (!tweetid) {
            throw new ApiError(400, "Tweet is unreachable")
        }
        if (!content) {
            throw new ApiError(400, "Tweet is required")
        }
        if (!userid) {
            throw new ApiError(400, "unauthorized access")
        }

        const ownerDetails = await Tweet.findOne(
            {
                owner: new mongoose.Types.ObjectId(userid)
            }
        ).select("-content")

        if(!ownerDetails)
        {
            throw new ApiError(400, "owner not found")
        }

        const updateTweet = await Tweet.updateOne(
            { _id: tweetid },
            { $set: 
                 { content: content }
            }
        )
        if(!updateTweet)
            {
                throw new ApiError(400, "Something went wrong unable to update tweet")
            }

        return res
            .status(200)
            .json(new ApiResponse(200, updateTweet, "Tweet updated successfully"))
    } catch (error) {
        throw new ApiError(500, "tweet not updated")

    }


})

const deleteTweet = asyncHandler(async (req, res) => {

    try {
        const {tweetid} = req.params
        const userid = req.user._id
        
        if (!tweetid) {
            throw new ApiError(400, "Tweet is unreachable")
        }
        if (!userid) {
            throw new ApiError(400, "unauthorized access")
        }

        const ownerDetails = await Tweet.findOne(
            {
                owner: new mongoose.Types.ObjectId(userid)
            }
        ).select("-content")

        if(!ownerDetails)
        {
            throw new ApiError(400, "owner not found")
        }

        const deleteTweet = await Tweet.findByIdAndDelete(tweetid)

        if(!deleteTweet)
        {
            throw new ApiError(500, "unable to delete this tweet")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, deleteTweet, "Tweet deleted successfully"))
    } catch (error) {
        throw new ApiError(400, "Tweet not deleted")
    }


})

const getUserTweets = asyncHandler(async (req, res) => {

   try {
     const {username} = req.params
     console.log(username)
     const user = await User.findOne({username: username})
     if(!user)
         {
            throw new ApiError(400, "User with this username not found")
         }
     const userid = user._id
     console.log(userid)
 
     if(!userid)
     {
         throw new ApiError(400, "unauthorized access")
     }
 
    //  const allTweets = await Tweet.findOne({
    //      owner: new mongoose.Types.ObjectId(userid),
    //  })
     
     const allTweets = await User.aggregate([
        {
            $match: {
                _id: userid
            }
        },
        {
            $lookup: {
                from: "Tweet",
                localField: "_id",
                foreignField: "owner",
                as: "tweets"
            }
        },
        {
            $addFields: {
                totalTweetsCount: {
                    $size: "$tweets"
                }
            }
        },
        {
            $project:{
                _id:   1,
                fullName: 1,
                username: 1,
                tweets: 1,
                totalTweetsCount: 1
            }
        }

     ])

     if(!allTweets)
     {
         throw new ApiError(500, "some error occured")
     }
     
    // console.log(allTweets)
    return res
     .status(200)
     .json(new ApiResponse(200, allTweets,  "User Tweets fetched successfully"))
   } catch (error) {
        throw new ApiError(400, error.message || "something went wrong")
   }

})


export { createTweet, updateTweet, deleteTweet, getUserTweets }