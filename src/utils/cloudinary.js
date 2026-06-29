import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import { ApiError } from './CustomApierror';




    // Configuration
    cloudinary.config({ 
        cloud_name: processes.env.CLOUDINARY_CLOUD_NAME, 
        api_key: processes.env.CLOUDINARY_API_KEY, 
        api_secret: processes.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
    });

const uploadOnCloudinary = async(path) => {
    try{
        if(!path) return null
        //upload the file on cloudinary
       const response = await cloudinary.uploader.upload(path , {
            resource_type: "auto"
            
        })  
        // file has been uploaded
        console.log(" file has been uploaded " , response.url);
        fs.unlinkSync(path)
        return response;
    }catch{
        fs.unlinkSync(path) // remove the file from the server as the operation got failed
        return null;
    }
}
const deleteOnCloudinary = async (publicId) => {

    if (!publicId) {
        throw new ApiError(
            400,
            "Public ID is required"
        );
    }

    try {

        const response =
            await cloudinary.uploader.destroy(
                publicId,
                {
                    invalidate: true,
                }
            );

        return response;

    } catch (error) {

        throw new ApiError(
            500,
            "Error deleting file from Cloudinary"
        );

    }

};
const getPublicId = (url) => {

    const urlParts = url.split("/");

    const fileName = urlParts.pop();

    const folder = urlParts.pop();

    return `${folder}/${fileName.split(".")[0]}`;
};
export { uploadOnCloudinary, deleteOnCloudinary ,getPublicId}