import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import { CommunityPost } from "../models/community.model.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    
    // Validate videoId
    if (!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID format");
    }    

    // Find the video by ID
    const video = await Video.findById(videoId);

    // Check if video exists
    if (!deletedVideo) {
        throw new ApiError(404, "Video not found");
    }
    
    const userId = req.user._id;
    const likedIndex = video.likes.indexOf(userId);

    if (likedIndex !== -1) {
        // User already liked the video, so remove the like
        video.likes.splice(likedIndex, 1);
    } else {
        // User has not liked the video, so add the like
        video.likes.push(userId);
    }

    // Save the updated video document
    await video.save();

    // Return the updated like status
    res.status(200).json(new ApiResponse(200, {
        likes: video.likes,
        likeCount: video.likes.length
    }, "Video like status updated successfully"));


})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const userId = req.user._id

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const existingLike = await Like.findOne({
        comment : commentId,
        likedBy : userId
    })

    if(existingLike)
    {
        await existingLike.remove();
        return res.status(200).json(new ApiResponse(200, null, "Comment like removed successfully")); 
    }

    const newLike = await Like.create({
        comment: commentId,
        likedBy: userId
    })
    return res.status(200).json(
        new ApiResponse(200, newLike, "Comment liked successfully")
    )

})

const toggleCommunityPostLike = asyncHandler(async (req, res) => {
    const {communityPostId} = req.params
    
    const userId = req.user._id

    const post = await CommunityPost.findById(communityPostId)

    if (!post) {
        throw new ApiError(404, "post not found");
    }

    const existingLike = await Like.findOne({
        communityPost: communityPostId,
        likedBy: userId
    })

    if(existingLike)
    {
        await existingLike.remove()
        return res.status(200).json(new ApiResponse(200, null, "post like removed successfully")); 
    }

    const newLike = await Like.create({
        communityPost: communityPostId,
        likedBy: userId
    })

    return res.status(200).json(
        new ApiResponse(200, newLike, "post liked successfully")
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id
    console.log("User ID:", userId);

    const likedVideos = await Like.find({ likedBy: userId , video: {$exists : true}}).populate('video')

    if (!likedVideos.length) {
        throw new ApiError(404, "No liked videos found for this user");
    }
    return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
})


export {
    toggleCommentLike,
    toggleCommunityPostLike,
    toggleVideoLike,
    getLikedVideos
}

