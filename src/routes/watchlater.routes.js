import { Router } from 'express';
import  { getWatchlaterVideos, toggleVideoWatchLater }from "../controllers/watchlater.controller.js"
import authmiddleware from "../middlewares/auth.middleware.js"

const router = Router();
router.use(authmiddleware); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/w/:videoId").post(toggleVideoWatchLater);
router.route("/videos").get(getWatchlaterVideos);

export default router