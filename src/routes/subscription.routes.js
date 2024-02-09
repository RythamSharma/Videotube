import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  isSubscribed,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import authmiddleware from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authmiddleware); // Apply verifyJWT middleware to all routes in this file

router
  .route("/c/:channelId")
  .get(getSubscribedChannels)
  .post(toggleSubscription);

router.route("/u/:channelId").get(getUserChannelSubscribers);
router.route("/b/:channelId").get(isSubscribed)

export default router;
