import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  try {
    const channelId = req.params.channelId;
    const ChannelStatsAndDetails = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "owner",
          as: "stats",
          pipeline: [
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videolikes",
              },
            },
            {
              $addFields: {
                numberOfLikes: {
                  $size: "$videolikes",
                },
              },
            },
            {
              $group: {
                _id: null,
                totalLikes: { $sum: "$numberOfLikes" },
                totalViews: { $sum: "$views" },
                totalVideos: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          stats: { $first: "$stats" },
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscriptions",
        },
      },
      {
        $addFields: {
          TotalSubscriptions: { $size: "$subscriptions" },
        },
      },
      {
        $project: {
          TotalSubscriptions: 1,
          stats: 1,
          _id: 1,
          fullname: 1,
          coverImage: 1,
          createdAt: 1,
          username: 1,
          email: 1,
          avatar: 1,
        },
      },
    ]);
    const isSubscribed= await Subscription.findOne({
      subscriber: req.user._id,
      channel: channelId
    })
    // console.log(isSubscribed)
    let Subscribed
    if(isSubscribed){
      Subscribed = true;
    }
    else{
      Subscribed=false;
    }
    if (!ChannelStatsAndDetails) {
      throw new ApiError(
        500,
        "error in aggregation pipeline of stats and details of channel"
      );
    }
    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          {ChannelStatsAndDetails, Subscribed}
        )
      );
  } catch (error) {
    throw new ApiError(
      501,
      `following error occurred while getting channel stats ${error}`
    );
  }
});

const yourChannel = asyncHandler(async (req, res) => {
  try {
    const ChannelStatsAndDetails = await User.aggregate([
      {
        $match: {
          _id: req.user._id,
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "owner",
          as: "stats",
          pipeline: [
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videolikes",
              },
            },
            {
              $addFields: {
                numberOfLikes: {
                  $size: "$videolikes",
                },
              },
            },
            {
              $group: {
                _id: null,
                totalLikes: { $sum: "$numberOfLikes" },
                totalViews: { $sum: "$views" },
                totalVideos: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          stats: { $first: "$stats" },
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscriptions",
        },
      },
      {
        $addFields: {
          TotalSubscriptions: { $size: "$subscriptions" },
        },
      },
      {
        $project: {
          TotalSubscriptions: 1,
          stats: 1,
          _id: 1,
          fullname: 1,
          coverImage: 1,
          createdAt: 1,
          username: 1,
          email: 1,
          avatar: 1,
        },
      },
    ]);
    const uploadedVideos = await Video.aggregate([
      {
        $match: {
          owner: req.user._id,
          isPublished: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "result",
        },
      },
      {
        $addFields: {
          ownerdetails: {
            $first: "$result",
          },
        },
      },
      {
        $project: {
          thumbnail: 1,
          videoFile: 1,
          title: 1,
          owner: 1,
          createdAt: 1,
          duration: 1,
          views: 1,
          ownerdetails: 1,
          _id: 1,
          description: 1,
          isPublished: 1,
        },
      },
    ]);
    if (!uploadedVideos) {
      throw new ApiError(400, "No videos uploaded by this user");
    }
    res
    .status(200)
    .send(
      new ApiResponse(
        200,
        {uploadedVideos,ChannelStatsAndDetails},
        "Fetched your channel stats and videos"
      )
    );
  } catch (error) {
    throw new ApiError(
      501,
      `following error occured while fetching the details of your channel ${error}`
    );
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  try {
    const channelId = req.params.channelId;
    const { page = 1, limit = 3 } = req.query;

    if (!channelId) {
      throw new ApiError(400, "ChannelId is required");
    }
    const uploadedVideos = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(channelId),
          isPublished: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "result",
        },
      },
      {
        $addFields: {
          ownerdetails: {
            $first: "$result",
          },
        },
      },
      {
        $project: {
          thumbnail: 1,
          videoFile: 1,
          title: 1,
          owner: 1,
          createdAt: 1,
          duration: 1,
          views: 1,
          ownerdetails: 1,
          _id: 1,
          description: 1,
          isPublished: 1,
        },
      },
    ]);
    if (!uploadedVideos) {
      throw new ApiError(400, "No videos uploaded by this user");
    }
    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          uploadedVideos,
          "Fetched Uplaoded Videos of this channel"
        )
      );
  } catch (error) {
    throw new ApiError(
      501,
      `following error occured while fetching the uploaded videos of the channel ${error}`
    );
  }
});

export { getChannelStats, getChannelVideos, yourChannel };
