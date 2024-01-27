import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  uploadOnCloudinary,
  deletefromcloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
const generateAccessAndRefreshToken = async (id) => {
  try {
    const user = await User.findById(id);
    const accesstoken = user.generateAccessToken();
    const refreshtoken = user.generateRefreshToken();

    user.refreshToken = refreshtoken;
    await user.save({ validate: false });
    return { accesstoken, refreshtoken };
  } catch (error) {
    throw new ApiError(
      500,
      "server error while creating access and refresh tokens "
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "ALL fields are required");
  }
  const exists = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (exists) {
    throw new ApiError(408, "User already exists");
  }
  // console.log(req.files)
  const avatarlocalpath = req.files?.avatar[0]?.path;
  // const coverlocalpath = req.files?.cover[0]?.path;
  let coverlocalpath;
  if (
    req.files &&
    Array.isArray(req.files.cover) &&
    req.files.cover.length > 0
  ) {
    coverlocalpath = req.files.cover[0].path;
  }
  if (!avatarlocalpath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarlocalpath);
  const cover = await uploadOnCloudinary(coverlocalpath);
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }
  const user = await User.create({
    email,
    username: username.toLowerCase(),
    fullname,
    password,
    avatar: avatar.url,
    avatarId: avatar.public_id,
    coverImage: cover?.url || "",
    coverImageId: cover?.public_id || "",
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Error while creating new user");
  }
  res.send(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //get username and pass from user with req.body
  //check if username and password are not empty
  //findone by username in the db
  //compare passwords with schema method
  //asign a access token
  //assign a refresh token
  //send response with refresh and access token in data

  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(401, "email or username is required");
  }
  if (!password) {
    throw new ApiError(401, "password is required");
  }
  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(401, "User not Found");
  }
  const ispasswordvalid = await user.isPasswordCorrect(password);
  if (!ispasswordvalid) {
    throw new ApiError(401, "Invalid Credentials Entered");
  }
  const { accesstoken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedinuser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    http: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accesstoken, options)
    .cookie("RefreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { loggedinuser, accesstoken, refreshToken },
        "User Logged In successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const { id } = req.user._id;
  const user = User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    http: true,
    secure: true,
  };
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("RefreshToken", options)
    .json(new ApiResponse(200, {}, "Logged Out Successfully!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const options = {
    http: true,
    secure: true,
  };
  const incomingRefreshToken = req.cookie.RefreshToken || req.body.RefreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken) {
      throw new ApiError(401, "Unauthorized request");
    }
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "user not found");
    }
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Token expired or used ");
    }
    const { newAccessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    return res
      .status(200)
      .cookie("accessToken", newAccessToken, options)
      .cookie("RefreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken: newAccessToken, RefreshToken: newRefreshToken },
          "access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, "some error occured while refreshing access token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldpass, newpass } = req.body;
  const user = await User.findById(req.user?._id);
  const ispasscorrect = await user.isPasswordCorrect(oldpass);
  if (!ispasscorrect) {
    throw new ApiError(400, "wrong password entered");
  }
  user.password = newpass;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "fetched user successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "fullname and email both are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");
  res
    .status(200)
    .json(new ApiResponse(200, user, "account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const localpath = req.file.path;
  if (!localpath) {
    throw new ApiError(400, "avatar file is required");
  }
  const avatar = await uploadOnCloudinary(localpath);
  if (!avatar) {
    throw new ApiError(500, "error occured while uploading on cloudinary");
  }
  const user = await User.findById(req.user._id);
  const oldAvatarId = user.avatarId;
  user.avatar = avatar.url;
  user.avatarId = avatar.public_id;
  user.save({ validateBeforeSave: false });
  const updateduser = await User.findById(req.user._id).select("-password");
  const result = await deletefromcloudinary(oldAvatarId);
  return res
    .status(200)
    .json(new ApiResponse(200, updateduser, "avatar updated succesfully"));
});
const updateUserCover = asyncHandler(async (req, res) => {
  const localpath = req.file.path;
  if (!localpath) {
    throw new ApiError(400, "cover file is required");
  }
  const cover = await uploadOnCloudinary(localpath);
  if (!cover) {
    throw new ApiError(500, "error occured while uploading on cloudinary");
  }
  const user = await User.findById(req.user._id);
  const oldcoverImageId = user.coverImageId;
  user.coverImage = cover.url;
  user.coverImageId = cover.public_id;
  user.save({ validateBeforeSave: false });
  const updateduser = await User.findById(req.user._id).select("-password");
  const result = await deletefromcloudinary(oldcoverImageId);
  return res
    .status(200)
    .json(new ApiResponse(200, updateduser, "cover updated  succesfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const username = req.params.username;
  if (!username?.trim()) {
    throw new ApiError(400, "invalid username");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "stats",
        pipeline:[
          {
            $lookup:{
              from:"likes",
              localField:"_id",
              foreignField:"video",
              as:"videolikes"
            }
          },
          {
            $addFields:{
              numberOfLikes:{
                $size: "$videolikes"
              }
            }
          },
          {
            $group:{
              _id:null,
              totalLikes: {$sum: "$numberOfLikes"},
              totalViews: {$sum: "$views"},
              totalVideos: { $sum: 1 } 
            }
          }
        ]
      }
    },
    {
      $addFields: {
        stats: {$first:"$stats"}
      }
    },
  ]);
  return res
  .status(200)
  .json(
      new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch history fetched successfully"
      )
  )
});

export {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCover,
  getUserChannelProfile,
  getWatchHistory,
};
