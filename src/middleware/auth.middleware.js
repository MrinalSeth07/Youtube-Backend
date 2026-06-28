import asyncHandler from "../utils/AsyncHandler";
import { ApiError } from "../utils/CustomApierror";
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"
export const verifyJWT = asyncHandler( async(req,res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if(!token){ 
            throw new ApiError(401,"Unauthorise request")
        }
        const decoded = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decoded?._id).select("-password -refrestoken")
        if(!user){
            
            throw new ApiError(401, "Invalid Access token")
        }
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access token")
    }
})
