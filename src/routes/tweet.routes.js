import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import{
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets
    }   from '../controllers/tweet.controller.js'
 

const router = Router()

router.route("/post-tweet").post(verifyJWT, createTweet)

router.route("/update-tweet/:tweetid").patch(verifyJWT, updateTweet)

router.route("/delete-tweet/:tweetid").delete(verifyJWT, deleteTweet)

router.route("/c/:username").get(verifyJWT, getUserTweets)



export default router