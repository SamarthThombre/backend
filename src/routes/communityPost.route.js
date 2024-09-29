import { Router } from 'express';
import {
    createcommunityPost,
    deletecommunityPost,
    getUsercommunityPosts,
    updatecommunityPost,
} from "../controllers/communityPost.controller.js"

import authMiddleware from '../middleware/auth.middleware.js';
const router = Router();
router.use(authMiddleware); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createcommunityPost);
router.route("/user/:userId").get(getUsercommunityPosts);
router.route("/:communityPostId").patch(updatecommunityPost).delete(deletecommunityPost);

export default router