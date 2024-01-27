import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ObjectId } from "mongodb";

const toggleSubscription = asyncHandler(async (req, res) => {
  // TODO: toggle subscription
  try {
    const { channelId } = req.params;
    const deleted = await Subscription.findOneAndDelete({
      $and: [{ channel: channelId }, { subscriber: req.user._id }],
    });
    if (deleted) {
      return res
        .status(200)
        .send(new ApiResponse(200, deleted, "Unsubscribed successfully"));
    } else {
      const newsub = await Subscription.create({
        channel: channelId,
        subscriber: req.user._id,
      });
      await newsub.save();
      return res
        .status(201)
        .send(new ApiResponse(201, newsub, "Subscribed successfully"));
    }
  } catch (error) {
    throw new ApiError(401, "Error while subscription toggle");
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;
    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new ObjectId(channelId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subc",
        },
      },
      {
        $addFields: {
          userdetails: { $first: "$subc" },
        },
      },
      {
        $project: {
          subscriber: 1,
          channel: 1,
          userdetails: 1,
        },
      },
    ]);
    res
      .status(200)
      .send(new ApiResponse(200, subscribers, "subscribers fetched"));
    // console.log(subscribers);
  } catch (error) {
    throw new ApiError(
      500,
      "some rror occurred while fetching subscribers of the channel"
    );
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;
    const channelsSubscribed = await Subscription.aggregate([
      {
        $match: {
          subscriber: new ObjectId(channelId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "subc",
        },
      },
      {
        $addFields: {
          channeldetails: { $first: "$subc" },
        },
      },
      {
        $project: {
          subscriber: 1,
          channel: 1,
          channeldetails: 1,
        },
      },
    ]);
    return res
      .status(200)
      .json(new ApiResponse(200, { channelsSubscribed }, "Success"));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
