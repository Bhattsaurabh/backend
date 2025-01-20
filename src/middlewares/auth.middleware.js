
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";


// customize middleware 
// logout karne k liye user ko jo login pr tokens diye wo sb clear karne honge.
// user ko logout karne k liye user ka access lena pdega tabhi toh accesstoken and refreshtoken hatayenge
// issliye ye middleware ka use krk logout method par jane se pehle req mai req.user ko add krdenge jisme  access and refresh tokens honge.


export const verifyJWT = asyncHandler(async (req, _, next) => {

  try {                                       
                                                // for mobile user
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      throw new ApiError(401, "Unauthorized request")
    }

    // user k pass jo bhi token diya jata h wo encrypted hota h
    // usko DB wale refresh token se compare krne se pehle decode krna pdta h
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

    if (!user) {
      throw new ApiError(401, "Invalid access token")
    }

    req.user = user;             // adding user in the request before going to logout
    next()                              // next() ka kaam h route k ander next method ko run krao ab
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
  }


})