import { asyncHandler } from "../utils/asyncHendler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async ( req, res, next) =>{
   
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
        console.log("verifyjwt is started")
        console.log(token)
        if(token) {
            throw new ApiError (401,"Unauthorized request")
    
        }
    
        const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
        console.log(decodedToken)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        console.log(user)
        if(!user) {
            throw new ApiError (401,"Invalid Access Token")
    
        }
    
        req.user = user;
        next()      
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Acess Token")
    }

})




