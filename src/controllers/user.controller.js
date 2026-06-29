import asyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/CustomApierror.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscriptions.model.js"
import { uploadOnCloudinary  ,deleteOnCloudinary ,getPublicId} from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const refreshtoken = await user.generateRefreshToken();
        const accesstoken = await user.generateAccessToken();

        user.refreshToken = refreshtoken;

        await user.save({
            validateBeforeSave: false,
        });

        return { accesstoken, refreshtoken };
    } catch (err) {
        throw new ApiError(500, "Server side issue");
    }
};

const registerUser = asyncHandler(async (req, res) => {

    const { fullname, email, username, password } = req.body;

    if (
        [fullname, email, username, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const ExitsUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (ExitsUser) {
        throw new ApiError(
            409,
            "User with email or username already exists"
        );
    }

    const avatarlocalpath = req.files?.avatar?.[0]?.path;
    const coverlocalpath = req.files?.coverImage?.[0]?.path;

    if (!avatarlocalpath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarlocalpath);

    const cover = coverlocalpath
        ? await uploadOnCloudinary(coverlocalpath)
        : null;

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: cover?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createduser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createduser) {
        throw new ApiError(
            500,
            "Something went wrong while registering user"
        );
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            createduser,
            "User registered successfully"
        )
    );
});

const loginUser = asyncHandler(async (req, res) => {

    const { username, email, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(
            400,
            "Username or Email is required"
        );
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const valid = await user.isPasswordCorrect(password);

    if (!valid) {
        throw new ApiError(401, "Invalid password");
    }

    const { accesstoken, refreshtoken } =
        await generateAccessandRefreshToken(user._id);

    const loggedinuser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accesstoken, options)
        .cookie("refreshToken", refreshtoken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedinuser,
                    accesstoken,
                    refreshtoken,
                },
                "User logged in successfully"
            )
        );
});

const logOut = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
        throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(
            401,
            "Refresh token is expired or already used"
        );
    }

    const { accesstoken, refreshtoken } =
        await generateAccessandRefreshToken(user._id);

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accesstoken, options)
        .cookie("refreshToken", refreshtoken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accesstoken,
                    refreshtoken,
                },
                "Access token refreshed successfully"
            )
        );
});
const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { oldpassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect =
        await user.isPasswordCorrect(oldpassword);

    if (!isPasswordCorrect) {
        throw new ApiError(
            401,
            "Current password is incorrect"
        );
    }

    user.password = newPassword;

    await user.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    );
});
const getCurrentUser = asyncHandler(async (req, res) => {

    return res.status(200).json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully"
        )
    );

});

const updateAccountDetails = asyncHandler(async (req, res) => {

    const { fullname, email } = req.body;

    if (!fullname || !email) {
        throw new ApiError(
            400,
            "All fields are required"
        );
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email,
            },
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Account updated successfully"
        )
    );

});
const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar?.url) {
        throw new ApiError(
            400,
            "Error while uploading avatar"
        );
    }
    const temphold = await User.findById(req.user?._id).select("avatar")
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            },
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");
    await deleteOnCloudinary(getPublicId(temphold))
    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Avatar updated successfully"
        )
    );
});
const updateUserCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(
            400,
            "Cover image file is missing"
        );
    }

    const coverImage = await uploadOnCloudinary(
        coverImageLocalPath
    );

    if (!coverImage?.url) {
        throw new ApiError(
            400,
            "Error while uploading cover image"
        );
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            },
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Cover image updated successfully"
        )
    );
});

const getUserChannelProfile= asyncHandler( async (req,res) => {
    const {username} = req.params
    if( !username?.trim() ){
        throw new ApiError(400, "username is required")
    }
    const channel = await User.aggregate([
        {
            $match: username.toLowerCase()

        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        }
        ,
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        }
        ,
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        $if: {$in : [req.user?._id,"#subscribers.subscriber"]},
                        then: true,
                        else: false,
                    }
                    
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                cover: 1,
                avatar: 1,
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404, "channel does not exist")
    }
    return res.status(200).json(
        new ApiResponse(200,channel[0],"user channel fetched successfully")
    )
} );
export {
    registerUser,
    loginUser,
    logOut,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
};