import { Router } from "express"
import { registerUser, loginUser, logOut, refreshAccessToken, changeCurrentPassword ,getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,} from "../controllers/user.controller.js"
import { upload } from "../middleware/multer.middleware.js"
import { verifyJWT  } from "../middleware/auth.middleware.js"
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
router.route("/change-pass").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/avatar-update").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-update").patch(verifyJWT,upload.single("cover"),updateUserCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory )


export default router 