import mongoose from "mongoose"

const subscriptionSchema = mongoose.Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,  //one who is my channel's subscriber--mere subscribers
        ref: "User"
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,  // wo sare channels jinhe mene subscribe kiya hua h
        ref: "User"
    }

}, {timestamps: true})




export const Subscription = mongoose.model("Subscription", subscriptionSchema)