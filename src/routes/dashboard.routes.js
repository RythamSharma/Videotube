import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos,
    yourChannel
} from "../controllers/dashboard.controller.js"
import authmiddleware from "../middlewares/auth.middleware.js"

const router = Router();

router.use(authmiddleware); // Apply verifyJWT middleware to all routes in this file

router.route("/stats/:channelId").get(getChannelStats);
router.route("/videos/:channelId").get(getChannelVideos);
router.route("/you").get(yourChannel);

export default router