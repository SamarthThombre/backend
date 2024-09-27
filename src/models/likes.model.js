import mongoose, { Schema } from "mongoose";

const likesSchema = new Schema({
    comment:{
        type: Schema.Types.ObjectId,
        ref: "Comments"
    },
    video:{
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    community:{
        type: Schema.Types.ObjectId,
        ref: "Community"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }, 
}, {
    timestamps: true
})


export const Likes = mongoose.model("Likes",  likesSchema)