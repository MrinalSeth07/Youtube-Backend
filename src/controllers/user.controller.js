import asyncHandler from "../utils/AsyncHandler"
import { ApiError } from "../utils/CustomApierror"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
const registerUser = asyncHandler( async (req,res) => {
    // get the data from the frontend
    // check the validation like the all of them are present or not
    // check if the user is present or not : username , email
    // check the avatar or the images are present or not
    // send the avatar to mutter than to the cloudinary
    // regiter the user in the db - create entry in db
    // remove the password and the refres toke from the response
    // check for the user creation
    // return response
    // if success delete the data from the temp server


    const {fullname, email, username, password} = req.body()
    if( [fullname , email , username , password].some((field) => field?.trim === "")){
        throw new ApiError(400,"Full name is required My friend !! ")
    }
    const ExitsUser = User.findOne({
        $or: [{ username } , { email }]
    })
    if(ExitsUser){
        throw new ApiError(409 , "User with email or username already exist")
    }

    const avatarlocalpath = req.files?.avatar[0]?.path;
    const coverlocalpath = req.files?.avatar[1]?.path;

    if(!avatarlocalpath){
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarlocalpath)
    const cover = await uploadOnCloudinary(coverlocalpath)
    if( !avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    }
    )
    const createduser = User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createduser){
        throw new ApiError(500, "Something went wrong Apologies from the Server")
    }
    return res.status(201).json(
        new ApiError(200, createduser , "User registered successfull time takes db on the other side")
    )

})

export{
    registerUser
}