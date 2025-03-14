import mongoose, { Schema } from "mongoose";

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    videos: [
        {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
        }
    ],
    owner: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                unique: false
    }
    
},{timestamps: true})



export const Playlist = mongoose.model("Playlist", playlistSchema)