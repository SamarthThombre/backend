import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../model/user.js"

const getChannelStats = asyncHandler(async (req, res) => {

    const { channelId } = req.params;

    // Validate channel ID
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const user = await User.findById(channelId); 
    if (!user) {
        throw new ApiError(404, "Channel not found");
    }

    // Total videos uploaded by the channel
    const totalVideos = await Video.countDocuments({ owner: channelId });

    // Aggregate total video views
    const totalViewsResult = await Video.aggregate([
        { $match: { owner:new mongoose.Types.ObjectId(channelId) } },
        { $group: { _id: null, viewsCount: { $sum: "$views" } } }
    ]);

    let viewCount = totalViewsResult[0]?.viewsCount || 0; // Handle cases with no views

    // Aggregate total likes for all videos
    const totalLikesResult = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
        { $group: { _id: null, totalLikes: { $sum: { $size: { $ifNull: ["$likes", []] } } } } }
    ]);

    let totalLikes = totalLikesResult[0]?.totalLikes || 0; // Handle cases with no likes

    // Return channel stats
    return res.status(200).json(new ApiResponse(200, {
        totalVideos,
        viewCount,
        totalLikes
    }, "Channel stats fetched successfully"));
});




const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate channel ID
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const user = await User.findById(channelId);
    if (!user) {
        throw new ApiError(404, "Channel not found");
    }

    // Fetch videos uploaded by the channel
    const videos = await Video.find({ owner: channelId });

    // Return empty list if no videos found
    if (videos.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No videos uploaded by this channel"));
    }

    // Return the list of videos
    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
});



export {
    getChannelStats, 
    getChannelVideos
    }