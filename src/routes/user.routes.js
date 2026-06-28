import { Router } from "express"
import { registerUser, loginUser, logOut, refreshAccessToken } from "../controllers/user.controller"
import { upload } from "../middleware/multer.middleware"
import { verifyJWT  } from "../middleware/auth.middleware"
const router = Router()
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1 ,
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

//secure routers
router.route("/logout").post(verifyJWT,logOut)
router.route("/refresh-token").post(refreshAccessToken)
export default router 