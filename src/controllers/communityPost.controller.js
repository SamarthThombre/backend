import {communityPost} from "../models/communityPost.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createcommunityPost = asyncHandler(async (req, res) => {
    //TODO: create communityPost
    const {content} = req.body
    const userId = req.user._id

    if(!content)
    {
        throw new ApiError(404 , "enter communityPost content")
    }

    const communityPost = await communityPost.create({
        content,
        owner : userId
    })

    return res.status(201).json(
        new ApiResponse(201, communityPost, "communityPost created successfully")
    );

})

const getUsercommunityPosts = asyncHandler(async (req, res) => {
    // TODO: get user communityPosts

    const userId = req.user._id
    const user = await User.findById(userId)

    if(!user)
    {
        throw new ApiError(404 , "communityPost user cannot found")
    }

    const communityPosts = await communityPost.find({owner : userId})


    if (!communityPosts.length) {
        throw new ApiError(404, "No communityPosts found for this user");
    }

    // Return the user's communityPosts with a custom ApiResponse
    return res.status(200).json(
        new ApiResponse(200, communityPosts, "communityPosts found successfully")
    );

})

const updatecommunityPost = asyncHandler(async (req, res) => {
    //TODO: update communityPost
    const {communityPostId} = req.params
    const {content} = req.body
    const userId = req.user._id

    if(!content)
    {
        throw new ApiError(404, "No content");
    }

    const communityPost = await communityPost.findById(communityPostId)

    if(!communityPost)
    {
        throw new ApiError(404, "communityPost does not exist");
    }

    if (communityPost.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this communityPost");
    }

     // Update the communityPost content
     communityPost.content = content;
     const updatedcommunityPost = await communityPost.save();
 
     // Send the updated communityPost as a response
     return res.status(200).json(
         new ApiResponse(200, updatedcommunityPost, "communityPost updated successfully")
     );

})

const deletecommunityPost = asyncHandler(async (req, res) => {
    //TODO: delete communityPost
    const {communityPostId} = req.params
    const userId = req.user._id

    const communityPost = await communityPost.findById(communityPostId)

    if(!communityPost)
    {
        throw new ApiError(404 , "communityPost does not exist")
    }

    if(communityPost.owner.toString() !== userId.toString())
    {
        throw new ApiError(404 , "only owner if this communityPost can delete this")
    }

    await communityPost.findByIdAndDelete(communityPostId)

    return res.status(200).json(
        new ApiResponse(200, null, "communityPost deleted successfully")
    );
})

export {
    createcommunityPost,
    getUsercommunityPosts,
    updatecommunityPost,
    deletecommunityPost
}

