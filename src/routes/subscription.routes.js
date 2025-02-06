import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import{
    toggleSubscription,
     getUserChannelSubscriber, 
     getSubscribedChannel
    }   from '../controllers/subscription.controller.js'
 

const router = Router()

router.route("/toggle-subscription/:channelId").patch(verifyJWT, toggleSubscription)
router.route("/get-subcribers/:channelId").get(verifyJWT, getUserChannelSubscriber)
router.route("/get-subscribedTo/:subscriberId").get(verifyJWT, getSubscribedChannel)


export default router