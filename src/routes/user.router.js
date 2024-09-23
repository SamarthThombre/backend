import { Router } from "express";
import { regesterUsers } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
const router = Router()

router.route("/regester").post(
    upload.fields(
        {
            name:"avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ),
    
    regesterUsers
    )


export default router