import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

  // Configuration
  cloudinary.config({ 
    cloud_name: 'process.env.CLOUDINARY_CLOUD_NAME', 
    api_key: 'process.env.CLOUDINARY_API_KEY', 
    api_secret: 'process.env.CLOUDINARY_API_SECRET'
});

// upload function

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // upload the file 
        const response = cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        }) 
        //file has been uploaded 
        console.log("file is been uploaded sucessfully", response.url);
        return response

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the local file
        return null ;
    }
}


export { uploadOnCloudinary }