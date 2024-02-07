import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateUserAvatar,
  updateUserCover,
  updateAccountDetails,
  getUserChannelProfile,
  getWatchHistory,
  getUser
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import authmiddleware from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "cover",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/getuser").post(getUser);

//secured
router.route("/logout").post(authmiddleware, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/update-avatar")
  .patch(authmiddleware, upload.single("avatar"), updateUserAvatar);
router
  .route("/update-cover")
  .patch(authmiddleware, upload.single("cover"), updateUserCover);
router.route("/update-details").patch(authmiddleware, updateAccountDetails);
router.route("/update-password").post(authmiddleware, changeCurrentPassword);
router.route("/current-user").get(authmiddleware, getCurrentUser);
router.route("/c/:username").get(authmiddleware, getUserChannelProfile);
router.route("/watch-histort").get(authmiddleware,getWatchHistory);

export default router;
