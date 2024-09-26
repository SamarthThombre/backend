import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUSerChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAcessToken, regesterUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    
    regesterUser
    )

router.route("/login").post(loginUser)

// secure route
router.route("/logout").post(verifyJWT, logoutUser) 
router.route("/refresh-token").post(refreshAcessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword )
router.route("/").get(verifyJWT, getCurrentUser )
router.route("/update-account").patch(verifyJWT, updateAccountDetails )
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar )
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage )

router.route("/c/:username").get(verifyJWT, getUSerChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)


export default router