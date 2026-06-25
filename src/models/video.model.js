import mongoose ,{ Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
    {
        videoFile: {
            type: String, // cloudinary Url
            required: true,
        },
        thumbnail: {
            type: String,   // cloudinary Url
            required: true,
        },
        title: {
            type: String,   // cloudinary Url
            required: true,
        },
        description: {
            type: String,   // cloudinary Url
            required: true,
        },
        duration: {
            type: Number,   // cloudinary Url
            required: true,
        },
        views: {
            type: Number,   // cloudinary Url
            default: 0,
        },
        isPublished: {
            type: Boolean,   // cloudinary Url
            default: true,
        },
        owner: {
            types: Schema.Types.ObjectsId,
            ref: "User",
        }
    },
    {
        timestamps:true,
    }
)
videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video" , videoSchema)