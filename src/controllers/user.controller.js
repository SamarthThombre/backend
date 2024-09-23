import { asyncHandler } from "../utils/asyncHendler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponce } from "../utils/ApiResponse.js"


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
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
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

const loginUser = asyncHandler(async (req,res) => {
        
})

export { regesterUser }