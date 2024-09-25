import { asyncHandler } from "../utils/asyncHendler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponce } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            console.error("User not found");
            throw new ApiError(404, "User not found");
        }
        
        console.log("User found:", user);

        const accessToken = user.generateAccessToken();
        console.log("Access token generated:", accessToken);

        const refreshToken = user.generateRefreshToken(); 
        console.log("Refresh token generated:", refreshToken);

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Error generating tokens:", error);
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens");
    }
};


const regesterUser = asyncHandler( async (req, res ) => {
    
    const { fullName, email, userName, password } = req.body
    
    
    if (
        [fullName, email, userName,password].some((field) => 
        field?.trim() ==="")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ userName },{ email }]
    })

    if (existedUser) {
        throw new ApiError(409, "user with email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
   
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    if (!avatarLocalPath) {
        throw new ApiError( 400," Avatar file not uploded  ")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar){
        throw new ApiError( 400," Avatar file not uploded  ")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })

   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if (!createdUser ){
    throw new ApiError(500,"semething went wrong while  regestring the user")
   }

   return res.status(201).json(
    new ApiResponce(200, createdUser, "user regesterd sucessfully")
   )    

})

const loginUser = asyncHandler(async (req, res) =>{
    
    const {email, username, password} = req.body
    console.log("user login started");
    console.log(email,password);
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    const user = await User.findOne({
        $or: [{username}, {email}]
    })


    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)
   console.log(isPasswordValid)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponce(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})


const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 
            }
        },
        {
            new: true
        }
    )

    const options ={
        httpOnly:true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiError(200,{}, "User logged Out"))
        
})

const refreshAcessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cokies.refreshToken || req.body.refreshToken

    if (incomingRefreshToken) {
        throw new ApiError (401,"unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = User.findById(decodedToken?._id)
    
    
        if (!user) {
            throw new ApiError (401,"invalid refresh token")
        }
    
        if (!incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }
    
        const options ={
            httpOnly: true,
            secure: true
        } 
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
            .status(200)
            .cookie("acessToken", accessToken, options)
            .cokies("refresnToken", newRefreshToken, options)
            .json(
                new ApiResponce(
                    200,{accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body 

    const user = await User.findById(req.user?._id)
    
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400,"INvalid password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: flase})

    return res.status(200)
    .json(new ApiError(200,{},"Password changed sucessfully"))

})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res 
        .status(200)
        .json(new ApiError(200,req.user, "currentuser fetched sucessfully"))
})

const updateAccountDetails = asyncHandler(async (req,res) => {
    const { fullName, email} = req.body 

    if (!fullName || !email) {
        throw new ApiError(400,"all fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },{
            new:true
        }
    ).select("-password")

    return res.status(200)
        .json(new ApiError(200 , user, "Acconunt details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res) =>{
    const oldAvatar = req.user?.avatar
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is missing ")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath) 

    if (!avatar.url) {
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,{
            $set: {
                avatar : avatar.url
            }
        },{
            new: true
        }
    ).select("-password")

    if (oldAvatar && user ) {
        const publicId = getPublicIdFromUrl(oldAvatar);
        
        // Delete the old avatar from Cloudinary
        const deletionResult = await deleteFromCloudinary(publicId);
        console.log('Old avatar deletion result:', deletionResult);    
    }

    return res.status(200)
        .json(
            new ApiError (200,user, "Avatar Iamge update sucessfully")
        )

})

const updateUserCoverImage = asyncHandler(async(req,res) =>{
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400,"Cover Image file is missing ")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath) 

    if (!coverImage.url) {
        throw new ApiError(400,"Error while uploading on cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.iser?._id,{
            $set: {
                coverImage : coverImage.url
            }
        },{
            new: true
        }
    ).select("-password")

    return res.status(200)
        .json(
            new ApiError (200,user, "Cover Iamge update sucessfully")

        )
})

export { 
    regesterUser,
    loginUser,
    logoutUser,
    refreshAcessToken,
    updateUserAvatar,
    updateAccountDetails,
    getCurrentUser,
    changeCurrentPassword
}