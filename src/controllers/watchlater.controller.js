import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Watchlater} from "../models/watchlater.model.js"

const toggleVideoWatchLater = asyncHandler(async (req, res) => {
    try {
      const { videoId } = req.params;
      if (!videoId) {
        throw new ApiError(401, "Video Id is required");
      }
      const alreadyadded = await Watchlater.findOne({
        video: videoId,
        addedby: req.user._id,
      });
      if (alreadyadded) {
        const remove = await Watchlater.findByIdAndDelete(alreadyadded._id);
        return res
          .status(200)
          .send(new ApiResponse(200, remove, "Video removed from watch later"));
      }
      const addvideo = await Watchlater.create({
        video: videoId,
        addedby: req.user._id,
      });
      addvideo.save();
      return res
        .status(200)
        .send(new ApiResponse(200, addvideo, "Video added to watch later"));
    } catch (error) {
      throw new ApiError(
        500,
        `following error occured while liking this video ${error}`
      );
    }
  });

  
const getWatchlaterVideos = asyncHandler(async (req, res) => {
  //TODO: get all watchlater videos
  try {
    const WatchlaterVideos = await Watchlater.aggregate([
      {
        $match: {
          addedby: req.user._id,
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
          localField: "addedby",
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
    if (!WatchlaterVideos) {
      return res
        .status(200)
        .send(new ApiResponse(200, {}, "No Videos found"));
    }
    res
      .status(200)
      .send(new ApiResponse(200, WatchlaterVideos, "Watch later videos fetched"));
  } catch (error) {
    throw new ApiError(
      500,
      `following error occured while liking this tweet ${error}`
    );
  }
});

export { getWatchlaterVideos, toggleVideoWatchLater };