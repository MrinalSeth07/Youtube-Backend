import cookieParser from "cookie-parser"
import express from "express";
import cors from "cors";
const app = express()
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))
app.use((express.json({limit: "16Kb"})))
app.use((express.urlencoded({extended:true , limit: "16Kb"}))) // sends form data as the string
app.use(express.static("public"))
app.use(cookieParser())


// import The router

import userRouter from './routes/user.routes.js'

// route declaration
app.use("/api/v1/users" , userRouter)

export { app }
