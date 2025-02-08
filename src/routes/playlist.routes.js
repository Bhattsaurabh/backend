import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {
        createPlaylist,
        getUserPlaylists,
        getUserPlaylistbyId,
        addVideoToPlaylist,
        removeVideoFromPlaylist,
        updatePlaylist
        } from "../controllers/playlist.controller.js"


const router  = Router()

router.route("/create-playlist").post(verifyJWT, createPlaylist)

router.route("/get-user-playlists/:userid").get(verifyJWT, getUserPlaylists)

router.route("/get-user-playlistbyId/:playlistId").get(verifyJWT, getUserPlaylistbyId)

router.route("/add-video-playlist/:playlistId/:videoId").patch(verifyJWT, addVideoToPlaylist)

router.route("/remove-video-playlist/:playlistId/:videoId").delete(verifyJWT, removeVideoFromPlaylist)

router.route("/update-playlist/:playlistId").patch(verifyJWT, updatePlaylist)



export default router