import { asyncHandler } from "../utils/asyncHendler.js"
import { ApiError, APIError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiRespponse } from "../utils/ApiResponse.js"


const regesterUsers = asyncHandler( async (req, res ) => {
    
    const { fullName, email, userName, password } = req.body
    console.log("email: ",email);
    
    if (
        [fullName, email, userName,password].some((field) => 
        field?.trim() ==="")
    ) {
        throw new APIError(400, "All fields are required")
    }

    const existedUser = User.findOne({
        $or: [{ userName },{ email }]
    })

    if (existedUser) {
        throw new APIError(409,"user with email or username already exist")
    }

    const avataeLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avataeLocalPath) {
        throw new ApiError( 400," Avatar file not uploded  ")
    }

    const avatar = await uploadOnCloudinary(avataeLocalPath)
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


export { regesterUsers }