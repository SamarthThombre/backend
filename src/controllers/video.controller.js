import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    
    const offset = (page - 1) * limit;
    let filter = {};

    // Apply query filter
    if (query) {
        filter = {
            $or: [
                { title: { $regex: query, $options: 'i' } },         // Search by title
                { description: { $regex: query, $options: 'i' } }    // Search by description
            ]
        };
    }

    // Apply userId filter
    if (userId) {
        filter.owner = userId;  // Assuming the video's owner is stored in the 'owner' field
    }

    // Sorting logic
    const sortOptions = {};
    if (sortBy) {
        sortOptions[sortBy] = sortType === 'desc' ? -1 : 1;  // Ascending or Descending
    }

    // Query the database with filters, sorting, and pagination
    const videos = await VideoModel.find(filter)
        .sort(sortOptions)    // Sorting based on provided field and direction
        .skip(offset)         // Skip videos for pagination
        .limit(limit);        // Limit the number of returned results

    // Count total documents that match the filter
    const totalVideos = await VideoModel.countDocuments(filter);

    // Send response
    res.status(200).json({ videos, page, limit, totalVideos });
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // Check for required fields
    if (!title || !description) {
        throw new ApiError(400, "Title or Description not provided");
    }

    // Check for video and thumbnail in the request
    if (!req.files || !req.files.video) {
        throw new ApiError(400, "Video not uploaded");
    }

    if (!req.files.thumbnail) {
        throw new ApiError(400, "Thumbnail not uploaded");
    }

    // Extract local paths for video and thumbnail files
    const videoLocalPath = req.files.video.path;
    const thumbnailLocalPath = req.files.thumbnail.path;

    // Check if video file was uploaded correctly
    if (!videoLocalPath) {
        throw new ApiError(400, "Video file not uploaded");
    }

    // Check if thumbnail file was uploaded correctly
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file not uploaded");
    }

    // Upload video to Cloudinary
    const videoUploadRes = await uploadOnCloudinary(videoLocalPath, { resource_type: "video" });
    if (!videoUploadRes) {
        throw new ApiError(400, "Failed to upload video");
    }

    // Upload thumbnail to Cloudinary
    const thumbnailUploadRes = await uploadOnCloudinary(thumbnailLocalPath, { resource_type: "image" });
    if (!thumbnailUploadRes) {
        throw new ApiError(400, "Failed to upload thumbnail");
    }

    // Create new video entry in the database
    const newVideo = await Video.create({
        title,
        description,
        videoField: videoUploadRes.secure_url,  // Use secure_url from Cloudinary response
        thumbnail: thumbnailUploadRes.secure_url,  // Use secure_url from Cloudinary response
        owner: req.user._id,  // Assuming the user is authenticated
        duration: req.body.duration || 0  // Default duration if not provided

    });

    // Send success response
    return res.status(201).json(
        new ApiResponse(201, newVideo, "Video published successfully")
    );
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)){
        throw new ApiError(404, "Video does not exist");
    }

    // Find video by ID
    const video = await VideoModel.findById(videoId);

    // Check if video exists
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Send response with video details
    res.status(200).json({ video });
});


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description, thumbnail } = req.body;

    // Validate videoId
    if (!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID format");
    }

    // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (thumbnail) updateData.thumbnail = thumbnail;

    // Update video details using findByIdAndUpdate
    const updatedVideo = await VideoModel.findByIdAndUpdate(videoId, updateData, {
        new: true, // Return the updated document
        runValidators: true, // Validate before update
    });

    // Check if the video was found
    if (!updatedVideo) {
        throw new ApiError(404, "Video not found");
    }

    // Return updated video details
    return res.status(200).json({
        message: "Video updated successfully",
        video: updatedVideo,
    });
});


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate videoId
    if (!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID format");
    }

    // Find and delete the video by ID
    const deletedVideo = await Video.findByIdAndDelete(videoId);

    // Check if video exists
    if (!deletedVideo) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate videoId
    if (!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID format");
    }

    // Find the video by ID
    const video = await Video.findById(videoId);

    // Check if the video exists
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Toggle the publish status
    video.isPublished = !video.isPublished;

    // Save the updated video
    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video status updated"));
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}