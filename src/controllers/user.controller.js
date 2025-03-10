import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateAccessandRefreshTokens = async (userId) => {

    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken                    // assigning refreshtoken to user
        await user.save({ validateBeforeSave: false })        // saving refereshtoken in user

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation   -   not empty
    // check if user is already exists: username, email
    // check for images, and avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return response



    // extract data from req.body (sirf text data hold krta h)
    console.log(req.body);
    const { fullName, email, username, password } = req.body          //destructuring
    console.log("fullName: ", fullName, "email: ", email, "username: ", username)

    // check if any field is empty or not
    if (
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All field are required")
    }

    //checking email validation
    if (req.body.email.indexOf('@') == -1) {
        throw new ApiError(400, "Email is not valid.")
    }

    //checking user exists or not
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]          //  means checking all field using OR operation
    })

    if (existedUser) {                          // if user already registered then throw error
        throw new ApiError(409, "User with email or username already exists")
    }

    console.log("user created")

    //checking avatar and image
    // getting path of files stored in local machine.

    console.log(req.files);

    let avatarLocalPath;
    // because avatar is required field in our user model
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path;
    }
    else {
        throw new ApiError(400, "Avatar file is required")
    }

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    console.log("avatarLocalPath", avatarLocalPath)

    //upload files on cloudinary
    const avatarCloud = await uploadOnCloudinary(avatarLocalPath)

    if (!avatarCloud)                                // this avatar is a response from cloudinary 
    {
        throw new ApiError(400, "Avatar file is required")
    }

    console.log("avatar url", avatarCloud.url)

    const coverImageCloud = await uploadOnCloudinary(coverImageLocalPath)
    console.log("coverImage url", coverImageCloud?.url)

    // create entry in db
    // save hone   se  pehle   pre method  chlega
    const user = await User.create({
        fullName,
        avatar: avatarCloud.url,
        coverImage: coverImageCloud?.url || "",          // coverimage can be empty hai toh thik warna khali
        email,
        password,
        username: username.toLowerCase()
    })


    // remove password and refresh token field from response
    const createdUser = await User.findById(user.id).select(         // mongoDB auto generate a id for every entry 
        "-password -refreshToken"
    )

    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    }


    console.log("User Registered Successfully")
    //returning  response to user interface
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )


})

const loginUser = asyncHandler(async (req, res) => {

    // req body -> data
    // username or email
    // find the user
    // verify user is there or not
    // check password
    // access and refresh token
    // send cookie

    const { email, username, password } = req.body

    //checking username or email is there or not
    if (!(username) && !(email)) {
        throw new ApiError(400, "username or email is required")
    }

    // find user has a valid username or email by checking in mongoDB
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user does not exists")
    }

    // check user input password is correct or not
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid Password")
    }

    // getting accesstoken and refreshtoken
    // accesstoken => user ko login krte time accesstoken provide kiya jata h for a fixed time.
    // refreshtoken => accesstoken expire hone k baad user ko bina dubara login kraye refreshtoken se user ko login rkha jata h agr
    // user ka refreshtoken DB k refreshtoken se match hogya.
    const { accessToken, refreshToken } = await generateAccessandRefreshTokens(user._id)

    //sending cookie
    const loggedInUser = await User.findById(user.id).select("-password -refreshToken")

    const options = {
        httpOnly: true,         // cookie only manage by server
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            },
                "User logged in Successfully"
            )
        )
})

// logout user
// logout karne k liye user ko jo login pr tokens diye wo sb clear karne honge.
// user ko logout karne k liye user ka access lena pdega tabhi toh accesstoken and refreshtoken hatayenge
// issliye ye middleware ka use krk logout method par jane se pehle req mai req.user ko add krdenge jisme  access and refresh tokens honge.


const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(req.user.id,
        {
            $unset: {
                refreshToken: 1     //this remove the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"))

})

// jab user ka accesstoken expire hojyga then usko dubara login na krne k liye uska refreshtoken verify krenge
// login pe user ko jo refreshtoken diya h usko DB mai save wale se verify krenge.
// user ko diya hua koi b token encoded hota h or DB mai decoded m hota h
const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newrefreshToken } = await generateAccessandRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(200, { accessToken, newrefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }


})

// changing password of user
const changeCurrentPassword  = asyncHandler( async(req,res) =>{

    console.log(req.body)
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    console.log(user)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect)
    {
        throw new ApiError(400, "Invalid password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})   //save se pehle pre method chlega 

    return res.status(200)
    .json(new ApiResponse(200, {}, "Password change successfully"))
})

// getting current user details
const getCurrentUser = asyncHandler( async(req, res) =>{

    return res
    .status(200)
    .json( new ApiResponse(200, req.user, "Current user fetched successfully"))
    
})

//updating user details
const updateAccountDetails = asyncHandler( async(req, res) =>{
    
     const updateField = req.body
     console.log(updateField)
     if(!updateField)
     {
        throw new ApiError(400, "All fields are required")
     }

     
    try {
        const user = await User.findByIdAndUpdate(
               req.user?._id, 
               {
                $set: updateField
               },
               { new: true}
            ).select("-password")
    
        // console.log(user)
    
         return res
         .status(200)
         .json(new ApiResponse(200, user, "Account details successfully updated"))
    } catch (error) {
        throw new ApiError(500,  "your data is not updated")
        
     }


})

 

// updating user avatar file
const updateUserAvatar = asyncHandler(async(req, res) =>{
    console.log(req.file)
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath)
        {
            throw new ApiError(400, "Avatar is required")
        }
    const avatarCloud = await uploadOnCloudinary(avatarLocalPath)
    
    if(!avatarCloud)
    {
        throw new ApiError(400, "Error while uploading avatar")
    }
    

        try {
            const user = await User.findByIdAndUpdate(
                req.user?._id,
                {
                    $set: {avatar: avatarCloud.url}
                },
                {new: true}
            ).select("-password")       // response se password remove krre h
            
            console.log(user)
            return res
            .status(200)
            .json(new ApiResponse(200, user, "Avatar successfully updated" ))
        } catch (error) {
            throw new ApiError(500, "avatar is not updated")
            
        }
    

})

// updating user coverimage
const updateUserCoverImage = asyncHandler(async(req, res) =>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath)
        {
            throw new ApiError(400, "CoverImage is required")
        }
    const CoverImageCloud = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!CoverImageCloud)
    {
        throw new ApiError(400, "Error while uploading CoverImage")
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {coverImage: CoverImageCloud.url}
            },
            {new: true}
        ).select("-password")       // response se password remove krre h
    
        return res
        .status(200)
        .json(new ApiResponse(200, user, "coverImage successfully updated" ))
    } catch (error) {
        throw new ApiError(500, "coverimage is not updated")
    }

})

// delete the coverimage

const deleteCoverImage = asyncHandler(async(req, res)   =>{

    try {
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $unset: {
                    coverImage: 1
                }
            }
        ).select("-password")
    
        return res
        .status(200)
        .json(new ApiResponse(200, "CoverImage deleted successfully"))
    } catch (error) {
        throw new ApiError(400, "CoverImage not deleted")
    }

})

// getting User channel profile

const getUserChannelProfile = asyncHandler(async(req, res) =>{
    const {username} = req.params      //params is when we get data from url 

    if(!username?.trim())
    {
        throw new ApiError(400, "Username is missing")
    }
    console.log(username)

    // getting channel's details like total subcribers, subscribedTo, avatar, coverimage etc.
    //MongoDB aggregation pipelines
    // In aggregation pipelines every stage output treat as input for next stage
    // aggregation pipeline return array of objects
    const channel =  await User.aggregate([
        {
            $match: {                                   // $match pipeline used for finding the matched document
                username: username?.toLowerCase()
            }
        },
        {                                               //mera channel count krk mere subscriber count krra h
            $lookup: {                                  // $lookup pipeline is used as left outer join
                from: "subscription",
                localField: "_id",                      // yaha pe _id as a PK ki tarah h
                foreignField: "channel",                // aor channel jo ki user hi h wo FK ki tarah h
                as: "subscribers"
            }
        },
        {                                               // mene kitne channel subscribed kr rkhe h
            $lookup: {                                  // $lookup pipeline is used as left outer join
                from: "subscription",
                localField: "_id",                      // yaha pe _id as a PK ki tarah h
                foreignField: "subscriber",             // aor subscriber jo ki user hi h wo FK ki tarah h
                as: "subscribedTo"
            }
        },
        {                                                // adding 3 more field to User model i.e subscribers, subcribedTo and (subscribe/subscribed) button
            $addFields: {                                // $addField pipeline is used to add new field to document
                subscribersCount: {
                    $size: "$subscribers"               //$size operator is used to count the total number of elements in an array
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {                            //$in operator is used check a field value within a array
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {                                 // $project pipeline is used to pass the specific fields to next stage
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])
    //console.log(channel)

    if(!channel?.length)        // array of objects hoga channel m
    {
        throw new ApiError(404, "channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched Successfully")
    )


})

// getting watch-History  
const getWatchHistory = asyncHandler(async(req, res) =>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "Video",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from : "User",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                        
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json( new ApiResponse(200, user.watchHistory, "Watch history fetched successfully"))
})


export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, deleteCoverImage, getUserChannelProfile, getWatchHistory }