import mongoose from "mongoose"

const subscriptionSchema = mongoose.Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,  //one who is subscribing
        ref: "User"
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,  // one to whom subcriber is subscribing
        ref: "User"
    }

},{timestamps})




export const Subscription = mongoose.model("Subscription", subscriptionSchema)