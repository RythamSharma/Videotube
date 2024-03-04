import mongoose, { Mongoose, isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on video
  try {
    const { videoId } = req.params;
    if (!videoId) {
      throw new ApiError(401, "Video Id is required");
    }
    const alreadyliked = await Like.findOne({
      video: videoId,
      likedBy: req.user._id,
    });
    if (alreadyliked) {
      const removelike = await Like.findByIdAndDelete(alreadyliked._id);
      return res
        .status(200)
        .send(new ApiResponse(200, removelike, "removed like from the video"));
    }
    const likevideo = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    likevideo.save();
    return res
      .status(200)
      .send(new ApiResponse(200, likevideo, "successfully liked the video"));
  } catch (error) {
    throw new ApiError(
      500,
      `following error occured while liking this video ${error}`
    );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on comment
  try {
    const { commentId } = req.params;
    if (!commentId) {
      throw new ApiError(401, "commentId is required");
    }
    const alreadyliked = await Like.findOne({
      comment: commentId,
      likedBy: req.user._id,
    });
    if (alreadyliked) {
      const removelike = await Like.findByIdAndDelete(alreadyliked._id);
      return res
        .status(200)
        .send(
          new ApiResponse(200, removelike, "removed like from the comment")
        );
    }
    const likecomment = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    likecomment.save();
    return res
      .status(200)
      .send(
        new ApiResponse(200, likecomment, "successfully liked the comment")
      );
  } catch (error) {
    throw new ApiError(
      500,
      `following error occured while liking this comment ${error}`
    );
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on tweet
  try {
    const { tweetId } = req.params;
    if (!tweetId) {
      throw new ApiError(401, "tweetId is required");
    }
    const alreadyliked = await Like.findOne({
      tweet: tweetId,
      likedBy: req.user._id,
    });
    if (alreadyliked) {
      const removelike = await Like.findByIdAndDelete(alreadyliked._id);
      return res
        .status(200)
        .send(new ApiResponse(200, removelike, "removed like from the tweet"));
    }
    const liketweet = await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
    liketweet.save();
    return res
      .status(200)
      .send(new ApiResponse(200, liketweet, "successfully liked the tweet"));
  } catch (error) {
    throw new ApiError(
      500,
      `following error occured while liking this tweet ${error}`
    );
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  try {
    const likedVideos = await Like.aggregate([
      {
        $match: {
          likedBy: req.user._id,
        },
      },
      {
        $match: {
          video: { $exists: true },
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "result",
        },
      },
      {
        $addFields: {
          Videodetails: { $first: "$result" },
        },
      },{
        $lookup: {
          from: "users",
          localField: "likedBy",
          foreignField: "_id",
          as: "result2"
        }
      },{
        $addFields: {
          Ownerdetails: {$first : "$result2" },
        },
      },
      {
        $project: {
          likedBy: 1,
          Videodetails: 1,
          Ownerdetails:1
        },
      },
    ]);
    if (!likedVideos) {
      return res
        .status(200)
        .send(new ApiResponse(200, {}, "No liked Videos found"));
    }
    res
      .status(200)
      .send(new ApiResponse(200, likedVideos, "liked videos fetched"));
  } catch (error) {
    throw new ApiError(
      500,
      `following error occured while liking this tweet ${error}`
    );
  }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
