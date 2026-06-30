import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        fullname: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        avatar: {
            type: String,
            required: true,
        },

        coverImage: {
            type: String,
            default: "",
        },

        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],

        password: {
            type: String,
            required: [true, "Password is required"],
        },

        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
// In Mongoose 8/9, if you declare your middleware as an async function, Mongoose treats it as promise-based middleware. You don't need next().
// userSchema.pre("save", async function (next) {

//     if (!this.isModified("password")) {
//         return next();
//     }

//     this.password = await bcrypt.hash(this.password, 10);

//     next();
// });

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);
});
// Compare Password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Generate Access Token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userSchema);