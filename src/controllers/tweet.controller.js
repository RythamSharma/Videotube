import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  try {
    const owner = req.user._id;
    const content = req.body.content;
    if (!owner || !content) {
      throw new ApiError(401, "content and owner are required");
    }
    const tweet = await Tweet.create({
      content: content,
      owner: owner,
    });
    await tweet.save();
    res.status(200).send(new ApiResponse(200, tweet, "Tweeted successfully"));
  } catch (err) {
    throw new ApiError(500, "internal server error while tweeting your tweet");
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  try {
    const userid = req.params.userId;
    if (!userid) {
      throw new ApiError(400, "userid is required");
    }
    console.log(userid);
    const tweets = await Tweet.find({ owner: userid });
    if (!tweets) {
      throw new ApiError(400, "no tweets found or an internal server error");
    }
    res
      .status(200)
      .send(
        new ApiResponse(200, tweets, "Tweets of user fetched successfully")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "internal server error while fetching your tweets");
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  try {
    const tweetId = req.params.tweetId;
    const newContent = req.body.content;
    // console.log(tweetId)
    // console.log(newContent)
    if (!tweetId || !newContent) {
      throw new ApiError(401, "content and tweetId is required");
    }
    const tweet = await Tweet.findByIdAndUpdate(tweetId, {
      content: newContent,
    });
    res
      .status(200)
      .send(new ApiResponse(200, tweet, "tweet updated successfully"));
  } catch (err) {
    throw new ApiError(401, err);
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  try {
    const tweetId = req.params.tweetId;
    if (!tweetId) {
      throw new ApiError(401, "content and tweetId is required");
    }
    const deleted = await Tweet.findByIdAndDelete(tweetId);
    res
      .status(200)
      .send(new ApiResponse(200, deleted, "tweet deleted successfully"));
  } catch (error) {
    throw new ApiError(401, err);
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
