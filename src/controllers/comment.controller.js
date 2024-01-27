import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  try {
    const { videoId } = req.params;
    if (!videoId) {
      throw new ApiError(401, "video id is required in params");
    }
    const { page = 1, limit = 10 } = req.query;
    const allcomments = await Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: parseInt(limit, 10),
      },
    ]);
    res
      .status(200)
      .send(new ApiResponse(200, allcomments, "comments fetched successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      `some error occured while fetching the comment of the video ${error}`
    );
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  try {
    const { videoId } = req.params;
    const content = req.body.content;
    if (!videoId) {
      throw new ApiError(401, "video id is required in params");
    }
    const comment = await Comment.create({
      content: content,
      video: videoId,
      owner: req.user._id,
    });
    await comment.save();
    res
      .status(200)
      .send(new ApiResponse(200, comment, "commented successfully on video"));
  } catch (error) {
    throw new ApiError(
      500,
      `some error occured while fetching the comment of the video ${error}`
    );
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  try {
    const { commentId } = req.params;
    const content = req.body.content;
    if (!commentId) {
      throw new ApiError(401, "comment id is required in params");
    }

    const commentToBeUpdated = await Comment.findById(commentId);
    // console.log(commentToBeUpdated.owner)
    // console.log(req.user._id)
    // console.log(!commentToBeUpdated.owner.equals(req.user._id))
    if (!commentToBeUpdated.owner.equals(req.user._id)) {
      throw new ApiError(401, "unauthorized request diff owner");
    }
    commentToBeUpdated.content=content
    await commentToBeUpdated.save();

    // const updatedcomment = await Comment.findByIdAndUpdate(commentId, {
    //   content: content,
    // });
    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          commentToBeUpdated,
          "comment updated successfully on video"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      `some error occured while updating the comment of the video ${error}`
    );
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  try {
    const { commentId } = req.params;
    if (!commentId) {
      throw new ApiError(401, "comment id is required in params");
    }

    const commentToBeDeleted = await Comment.findById(commentId);
    if (!commentToBeDeleted.owner.equals(req.user._id)) {
      throw new ApiError(401, "unauthorized request diff owner");
    }
    const deletecomment = await Comment.findByIdAndDelete(commentId)
    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          deletecomment,
          "comment deleted successfully from video"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      `some error occured while deleting the comment of the video ${error}`
    );
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };
