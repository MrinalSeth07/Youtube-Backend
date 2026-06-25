import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"




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
        return response;
    }catch{
        fs.unlinkSync(path) // remove the file from the server as the operation got failed
        return null;
    }
}
expor