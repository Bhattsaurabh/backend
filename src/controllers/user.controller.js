import  {asyncHandler} from "../utils/asyncHandler.js"
import  {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


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


    const {fullname, email, username, password} = req.body
    console.log("email: ", email)

    if(
        [fullname, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All field are required")
    }

    //checking email validation
    body('name').isLength({ min: 5 }),
    body('email').isEmail(),
    body('password').isLength({ min: 6 })


    //checking user exists or not
    const existedUser =  User.findOne({
        $or: [{username},   {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    //checking avatar and image
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    if(!avatarLocalPath)
    {
        throw new ApiError(400, "Avatar file is required")
    }

    //upload image and avatar in cloudinary
    const avatar =  await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImage)

    if(!avatar)
    {
        throw new ApiError(400, "Avatar file is required")
    }    

    // create entry in db

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowercase
    })

   
    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

     // check for user creation
    if(!createdUser)
    {
        throw new ApiError(500, "Something went wrong while registering user")
    }

    //response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully" )
    )


} )

export {registerUser}