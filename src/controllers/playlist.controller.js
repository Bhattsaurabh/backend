import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { Playlist} from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {mongoose} from "mongoose"


const createPlaylist = asyncHandler(async(req,res)    =>{

    try {
        const {name, description} = req.body
    
        if(!name || !description || name.trim() === "" || description.trim() === "")
        {
            throw new ApiError(400, "name and description required")
        }
    
        const userid = req.user?._id
    
        if(!userid)
        {
            throw new ApiError(401, "unauthorized user")
        }
    
        const newPlaylist = await Playlist.create({
                name: name,
                description: description,
                owner: userid
        })
    
        if(!newPlaylist)
        {
            throw new ApiError(500, newPlaylist,  "Internal server error failed to create playlist")
        }
    
        return res
        .status(200)
        .json( new ApiResponse(200, newPlaylist, "Playlist successfully created"))
    } catch (error) {
        throw new ApiError(500, error.message || "Internal server error")
    }

})


const getUserPlaylists = asyncHandler(async(req, res)  =>{

   try {
     const {userid} = req.params
    
    // console.log(userid)

     if(!userid )
     {
         throw new ApiError(400, "Invalid userid")
     }

     const isPlaylist = await Playlist.findOne({owner: userid})

    // console.log(isPlaylist)

     if(!isPlaylist)
        {
            throw new ApiError(400, "No playlist found")
        }
 
     const pipeline = [
         {
             $match: 
                 {   
                  owner: new mongoose.Types.ObjectId(userid)
                 }
         },
         {   $lookup: {
                 from: "Video",
                 localField: "videos",
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
                        $unset: "owner"
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
                    }

                 ]
             }
 
         },
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
                            avatar: "$avtar.url"
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
     ]
 
     const usersPlaylist = await Playlist.aggregate(pipeline)
     console.log(usersPlaylist)
     if(!usersPlaylist)
     {
         throw new ApiError(401, "No playlist found for this user")
     }
 
     return res
     .status(200)
     .json(new ApiResponse(200, usersPlaylist, "Playlist fetched successfully"))
   } catch (error) {
        throw new ApiError(500, error.message || "Internal server error failed to fetch playlist")
   }

})

const getUserPlaylistbyId = asyncHandler(async(req, res) =>{

   try {
     const {playlistId} = req.params
     
     if(!playlistId)
     {
         throw new ApiError(400, "unable to find playlist")
     }
 
     const playlist = await Playlist.findById(playlistId)
 
     if(!playlist)
     {
             throw new ApiError(400, "No playlist found")
     }

     const pipeline = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $match: {
                            deleted: {
                                $ne: "true"
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
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
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
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
                owner: {
                    $first: "$owner"
                }
            }
        }
     ]

     const videosList = await Playlist.aggregate(pipeline)
 
     return res
     .status(200)
     .json(new ApiResponse(200, videosList, "playlist fetched successfully"))
   } catch (error) {
        throw new ApiError(500, error.message || "Internal server error failed to find playlist")
    
   }

})


const addVideoToPlaylist  = asyncHandler(async (req, res) =>{
    
    
    try {
        const userId = req.user?._id
        if(!userId)
        {
            throw new ApiError(400, "user not found")
        }

        const {playlistId, videoId} = req.params

        //console.log(playlistId)
        //console.log(videoId)
    
        if(!playlistId || !videoId)
        {
            throw new ApiError(400, "playlist and video is required")
        }

        
        const checkplaylist = await Playlist.findById(playlistId)
       // console.log(checkplaylist)

        if(!checkplaylist)
            {
                throw new ApiError(400, "playlist not found")
            }

        const checkvideo = await Video.findOne({_id: videoId, owner: userId})
        //console.log(checkvideo)
        if(!checkvideo)
            {
                throw new ApiError(400, "video not found")
            }

        const checkOwner =  await Playlist.findOne({_id: playlistId, owner: userId})

        if(!checkOwner)
            {
                throw new ApiError(401, "unauthorized access to playlist")
            }


        const addvideo = await Playlist.findByIdAndUpdate(
            playlistId,
           { 
            $addToSet:{
                        videos: videoId
                }
            },
            {
                new: true
            }
        )
    
        if(!addvideo)
        {
            throw new ApiError(500, "Internal server error failed to add video")
        }
       // console.log(addvideo)
        return res
        .status(200)
        .json( new ApiResponse(200, addvideo,  "Video added to playlist succcessfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "Internal server error")   
    }

})


const removeVideoFromPlaylist  = asyncHandler(async (req, res) =>{
    
    
    try {
        const userId = req.user?._id
        if(!userId)
        {
            throw new ApiError(400, "user not found")
        }

        const {playlistId, videoId} = req.params
    
        if(!playlistId || !videoId)
        {
            throw new ApiError(400, "playlist and video is required")
        }

        const checkplaylist = await Playlist.findById(playlistId)
        if(!checkplaylist)
            {
                throw new ApiError(400, "playlist not found")
            }

        const checkvideo = await Video.findById(videoId)
        if(!checkvideo)
            {
                throw new ApiError(400, "video not found")
            }

    
        const isVideoinPlaylist = await Playlist.findOne({
            _id: playlistId,
            videos: videoId,
            owner: userId
        })

        if(!isVideoinPlaylist)
        {
            throw new ApiError(400, "video not found in this playlist")
        }

        const removeVideo = await Playlist.findByIdAndUpdate(
            playlistId,
            {   
                $pull: {
                    videos: videoId
                }
            },
            {
                new: true
            }
    ) 
    
        return res
        .status(200)
        .json( new ApiResponse(200, removeVideo, "Video removed from playlist succcessfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "Internal server error failed to remove video from playlist")   
    }

})


const updatePlaylist = asyncHandler(async(req, res)=>{

    try {
        const userId = req.user?._id
        if(!userId)
        {
            throw new ApiError(400, "user not found")
        }

        const {playlistId} = req.params
        const{name, description} = req.body
    
        if(!name && !description)
        {
            throw new ApiError(400, "name or description cannot be empty some changes requires")
        }

        const checkOwner =  await Playlist.findOne({_id: playlistId, owner: userId})

        if(!checkOwner)
        {
            throw new ApiError(401, "unauthorized access to playlist")
        }

        
    
        const updatePlaylist  = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: {
                    name,
                    description
                }
            },
            {
                new: true
            }
        ) 
    
        if(!updatePlaylist)
        {
            throw new ApiError(500, "Internal server error unable to update playlist")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, updatePlaylist, "Playlist updated successfully"))
    } catch (error) {
        throw new ApiError(500, error.message ||  "Internal server error failed to update playlist")
    }

})



export {createPlaylist, getUserPlaylists, getUserPlaylistbyId, addVideoToPlaylist, removeVideoFromPlaylist, updatePlaylist}


