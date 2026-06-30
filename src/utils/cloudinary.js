import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import { ApiError } from './CustomApierror.js';


console.log(process.env.CLOUDINARY_CLOUD_NAME);
console.log(process.env.CLOUDINARY_API_KEY);
console.log(process.env.CLOUDINARY_API_SECRET);

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
        
    });

const uploadOnCloudinary = async (path) => {
    try {

        if (!path) return null;

        const response = await cloudinary.uploader.upload(path, {
            resource_type: "auto"
        });

        console.log("Uploaded:", response.secure_url);

        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
        }

        return response;

    } catch (error) {

        console.log("Cloudinary Error:", error);

        if (path && fs.existsSync(path)) {
            fs.unlinkSync(path);
        }

        return null;
    }
};
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