import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

//app.use is used for configuration or middleware

app.use(cors({                              // used to handle CORS => give permission to url 
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))                 // used for json data
app.use(express.urlencoded({extended: true, limit: "16kb"}))   // used for url data
app.use(express.static("public"))               // used for store public data like favicon, images and files
app.use(cookieParser())                     // read and set cookie in user's browser


//routes import
import userRouter from './routes/user.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import videoRouter from './routes/video.routes.js'
import subcriptionRouter from './routes/subscription.routes.js'
import playlistRouter from './routes/playlist.routes.js'


//routes declaration
app.use("/api/v1/users", userRouter)       // using middleware for routing because router are in different file
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/subscription", subcriptionRouter)
app.use("/api/v1/playlist", playlistRouter)





export { app }