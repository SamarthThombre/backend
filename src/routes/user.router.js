import { Router } from "express";
import { regesterUsers } from "../controllers/user.controller.js";

const router = Router()

router.route("/regester").post(regesterUsers)

export default router