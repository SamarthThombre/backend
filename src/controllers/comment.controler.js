import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    // Get video id
    const { videoId } = req.params;

    // Set pagination
    const { page = 1, limit = 10 } = req.query;

    // Validate video id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Video does not exist");
    }

    // Build a filter
    let filter = { video: videoId };

    // Fetch comments with pagination
    const comments = await Comment.find(filter)
        .skip((Number(page) - 1) * Number(limit)) // Ensure page and limit are numbers
        .limit(Number(limit))
        .sort({ createdAt: -1 }); // Sort by newest comments first

    // Get total count of comments
    const totalComments = await Comment.countDocuments(filter);

    // Calculate total pages (optional)
    const totalPages = Math.ceil(totalComments / limit);

    // Return results
    res.status(200).json({
        page: Number(page),
        limit: Number(limit),
        totalComments,
        totalPages, // Optional: total number of pages
        comments,
    });
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    // Validate video ID
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid video ID");
    }

    // Validate comment content
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }

    // Optional: Check if the video exists
    const video = await VideoModel.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Create a new comment
    const newComment = await Comment.create({
        video: videoId,
        user: req.user._id, // Assuming user is authenticated
        content,
    });

    // Return the created comment
    res.status(201).json({
        message: "Comment added successfully",
        comment: newComment,
    });
});


const updateComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    // Validate video ID
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid video ID");
    }

    // Validate comment content
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }

    // Optional: Check if the video exists
    const video = await VideoModel.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Find and update the comment
    const comment = await Comment.findOneAndUpdate(
        { video: videoId, user: req.user._id }, // Match comment by video and user
        { $set: { content } }, // Update comment content
        { new: true } // Return the updated comment
    );

    if (!comment) {
        throw new ApiError(404, "Comment not found or you're not authorized to update it");
    }

    // Return updated comment
    return res.status(200).json({   
        message: "Comment updated successfully",
        comment
    });
});


const deleteComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate video ID
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid video ID");
    }

    // Find and delete the comment
    const delComment = await Comment.findOneAndDelete(
        { video: videoId, user: req.user._id }
    );

    if (!delComment) {
        throw new ApiError(404, "Comment not found or you're not authorized to delete it");
    }

    // Return success message
    return res.status(200).json({
        message: "Comment deleted successfully"
    });
});


export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }