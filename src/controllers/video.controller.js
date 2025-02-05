import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"



const publishAVideo  = asyncHandler(async (req, res) =>{

    try {
        const {title, description} = req.body
        
        // console.log(title)
        // console.log(description)
        if(!title && !description)
            {
            throw new ApiError(400, "title and description cannot be empty")
            }
    
        const userid = req.user?._id
        // console.log(userid)
   
        if(!userid)
            {
            throw new ApiError(400, "user not found")
            }
    
        let videoPath
        if(req.files  && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0)
            {
            videoPath = req.files.videoFile[0].path
            }
            else{
            throw new ApiError(400, "Videofile is required")
            }
        let thumbnailPath
        if(req.files  && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0)
            {
                thumbnailPath = req.files.thumbnail[0].path
            }
            else{
                throw new ApiError(400, "Thumbnail is required")
            }
       
            // console.log(videoPath)
            // console.log(thumbnailPath) 
    
        const videoFileCloud = await uploadOnCloudinary(videoPath)
    
        if(!videoFileCloud)
            {
                throw new ApiError(500, "unable to upload video on cloud")
            }
    
        const thumbnailCloud = await uploadOnCloudinary(thumbnailPath)
    
        if(!thumbnailCloud)
            {
                    throw new ApiError(500, "unable to upload thumbnail on cloud")
            }
    
        const user = await User.findById(userid)
    
        if(!user)
            {
                throw new ApiError(500, "user not found")
            }

        // console.log(user)
        
        const createnewVideo = new Video({
            videoFile: videoFileCloud.url,
            thumbnail: thumbnailCloud.url,
            title: title,
            description: description,
            owner: userid,
            duration: videoFileCloud.duration
        })
        // console.log(createnewVideo)
        
        await createnewVideo.save()

        if(!createnewVideo)
        {
             throw new ApiError(500, "Error occured while saving video")
        }
    
    
        return res
        .status(200)
        .json( new ApiResponse(200, createnewVideo, "video uploaded successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "something went wrong unable to upload video")
    }
})


const getVideoById = asyncHandler(async(req, res)   =>{

    try {
        const {videoid} = req.params
        console.log(videoid)

        if(!videoid)
        {
             throw new ApiError(400, "unable to find video")
        }

    
        const video = await Video.findById(videoid)
        console.log(video)

        if(!video)
        {
             throw new ApiError(500, "video not found")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, video, "video fetched successfully"))
    } catch (error) {
        throw new ApiError(500, error.message ||  "something went wrong video is not accessible")
        
    }

})


const updateVideo = asyncHandler(async(req, res)   =>{

    try {
        const {videoid} = req.params
        const updateDetails = req.body
        const thumbnailPath = req.file?.path
    
        if(!videoid)
        {
            throw new ApiError(400, "unable to find video")
        }

        if( !(updateDetails|| thumbnailPath) ){
                throw new ApiError(400, "Error some updation required")
            }
        
        
        console.log(updateDetails)
        console.log(thumbnailPath)
       
        let thumbnailCloud
        if(thumbnailPath)
        {
            thumbnailCloud = await uploadOnCloudinary(thumbnailPath)
            
            if(!thumbnailCloud)
                {
                        throw new ApiError(500, "unable to upload thumbnail on cloud")
                }
        }

        // const video = await Video.findById(videoid)
        // const previousthumbnailUrl = video.thumbnail
        // const previoustitle = video.title
        // const previousdescription = video.description
        
       
        const updateTextData = await Video.findByIdAndUpdate(
            videoid,
            {
               $set: updateDetails
            },
            {
               new: true
            } 
       )

        const updateVideo = await Video.findByIdAndUpdate(
             videoid,
             {
                $set: {thumbnail: thumbnailCloud?.url}
             },
             {
                new: true
             } 
        )
        console.log(updateVideo)
        if(!updateVideo)
        {
            throw new ApiError(500, "something went wrong unable to do video updation")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, updateVideo, "video update successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "failed to update video")
        
    }

})

const deleteVideo = asyncHandler(async(req, res) =>{

   try {
     const {videoid} = req.params
     console.log(videoid)
     if(!videoid)
     {
         throw new ApiError(400, "unable to find video")
     }
 
     const deleteVideo = await Video.findByIdAndDelete(videoid)
     console.log(deleteVideo)
     if(!deleteVideo)
     {
         throw new ApiError(500, "something went wrong video did not deleted")
     }
 
     return res
     .status(200)
     .json( new ApiResponse(200, deleteVideo, "video successfully deleted"))
   } catch (error) {
        throw new ApiError(500, "something went wrong Internal server error")
    
   }

})

const togglePublishStatus = asyncHandler(async(req,res) =>{

    try {
        const {videoid} = req.params
        if(!videoid)
            {
                throw new ApiError(400, "unable to find video")
            }
        
        const video = await Video.findById(videoid)
        if(!video)
            {
                throw new ApiError(500, "cannot find video")
            }
        
        video.isPublished = !video.isPublished
        await video.save()
    
        console.log(video)
    
        
            return res
            .status(200)
            .json( new ApiResponse(200, video, "publish status successfully toggled"))
    } catch (error) {
        throw new ApiError(500, error.message || "publish status not updated")
        
    }


})


export {publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus}