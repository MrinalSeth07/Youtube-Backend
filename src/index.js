import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";

import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
;(async () => {
    try {
        const connection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("Errr : " , error);
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT }`);

        })
    } catch (error){
        console.error("ERROR: ", error)
        throw error
    }
})()