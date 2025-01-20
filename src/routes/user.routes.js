import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()


// user registeration
// registerUser method ka use krne se pehle upload middleware ka use krk files ko check aor local machine m save kiya jara h

router.route("/register").post(
    upload.fields([                         // middleware to check files 
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    registerUser
    )

router.route("/login").post(loginUser)

//secured routes
// logout user
// logout karne k liye user ko jo login pr tokens diye wo sb clear karne honge.
// user ko logout karne k liye user ka access lena pdega tabhi toh accesstoken and refreshtoken hatayenge
// issliye ye verifyJWT middleware ka use krk logout method par jane se pehle req mai req.user ko add krdenge jisme  access and refresh tokens honge.

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)


export default router