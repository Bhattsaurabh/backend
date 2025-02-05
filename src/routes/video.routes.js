import { Router } from "express";
import  {
    publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus
} from "../controllers/video.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/upload-video").post(verifyJWT, 
    upload.fields([
        {
            name: 'videoFile',
            maxCount: 1,
        },
        {
            name: 'thumbnail',
            maxCount: 1,
        }
    ]),
    publishAVideo 
)


router.route("/get-video/:videoid").get(verifyJWT, getVideoById)
router.route("/update-video/:videoid").patch(verifyJWT, upload.single('thumbnail'), updateVideo)
router.route("/delete-video/:videoid").delete(verifyJWT, deleteVideo)
router.route("/toggle-publish-status/:videoid").patch(verifyJWT, togglePublishStatus)




export default router