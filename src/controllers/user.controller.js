import asyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/CustomApierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

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

export {
    registerUser,
    loginUser,
    logOut,
};