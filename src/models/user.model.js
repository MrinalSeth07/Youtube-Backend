import mongoose , { Schema } from "mongoose"
import jwt from "jsonwebtoken" //jwt is the bearer token
import bcrypt from "bcrypt" // bcrypt to has the the password before saving in the database
const userSchema = new Schema ({

    username : {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
        index: true, // make its searching efficient by making it true but on the other sde make it expensive
    },
    email : {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname : {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    avatar : {
        type: String, // cloudinary url
        required: true,
    },
    coverImage : {
        type: String, // cloudinary url
    },
    watchHistory: [
        {
        type: Schema.Types.ObjectsId,
        ref: "Video",
        }
    ],
    password: {
        type: String,
        required: [true, 'Passwrod is required']
    },
    refreshToken: {
        type: String,

    }
},{
    timestamps : true,
}
)

userSchema.pre("save",async function(next) {
    if(!this.isModified("password")){
        return next;
    }
    this.password = await bcrypt.hash(this.password, 10 /*no of rounds */)
    next()
})
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = async function(){
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
    )
}
userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

export const User = mongoose.model("User",userSchema)