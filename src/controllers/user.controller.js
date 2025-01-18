import  {asyncHandler} from "../utils/asyncHandler.js"
import  {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { body, validationResult } from 'express-validator';

const registerUser  =   asyncHandler( async (req, res) =>{
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
    const {fullName, email, username, password} = req.body          //destructuring
    console.log("fullName: ", fullName, "email: ", email, "username: ", username)

    // check if any field is empty or not
    if(
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All field are required")
    }

    //checking email validation
    if(req.body.email.indexOf('@') == -1)
    {
        throw new ApiError(400, "Email is not valid.")
    }

    //checking user exists or not
    const existedUser = await User.findOne({
        $or: [{ username },   { email }]          //  means checking all field using OR operation
    })

    if(existedUser){                          // if user already registered then throw error
        throw new ApiError(409, "User with email or username already exists")
    }

    console.log("user created")
   
    //checking avatar and image
    // getting path of files stored in local machine.

    console.log(req.files);

    let avatarLocalPath;
     // because avatar is required field in our user model
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length>0)
    {
        avatarLocalPath = req.files.avatar[0].path;
    }
    else{
        throw new ApiError(400, "Avatar file is required")
    }
  
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
       coverImageLocalPath = req.files.coverImage[0].path;
    }
    

    console.log("avatarLocalPath", avatarLocalPath)

    //upload files on cloudinary
    const avatarCloud =  await uploadOnCloudinary(avatarLocalPath)

    if(!avatarCloud)                                // this avatar is a response from cloudinary 
    {
        throw new ApiError(400, "Avatar file is required")
    }   

    console.log("avatar url", avatarCloud.url)
    
    const coverImageCloud =  await uploadOnCloudinary(coverImageLocalPath)
    console.log("coverImage url", coverImageCloud?.url)

    // create entry in db
    //  save hone   se  pehle   pre method  chlega
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
    if(!createdUser)
    {
        throw new ApiError(500, "Something went wrong while registering user")
    }


    console.log("User Registered Successfully")
    //returning  response to user interface
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully" )
    )


} )

export {registerUser}