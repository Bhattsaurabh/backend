import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {mongoose} from "mongoose"


const healthCheck = asyncHandler(async (req, res)=> {

    try {
        const dbStatus = mongoose.connection.readyState ? "DB connected" : "DB disconnected" 
    
        const healthcheck = {
            dbStatus,
            uptime: process.uptime(),
            message: "OK",
            timestamps: Date.now(),
            hrtime: process.hrtime(),
            serverStatus: `server is running on PORT ${process.env.PORT}`
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, healthCheck, "health checked successfully"))


    } catch (error) {
        const healthcheck = {
            dbStatus,
            uptime: process.uptime(),
            message: "Error",
            timestamps: Date.now(),
            hrtime: process.hrtime(),
            error: error?.message
        }

        console.log("Error in health check", error)

        return res
        .status(500)
        .json(new ApiResponse(200, healthCheck, "health checked failed"))

        
    }


})

export {healthCheck}