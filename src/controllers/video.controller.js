import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deletefromcloudinary } from "../utils/cloudinary.js";
import { deleteVideofromcloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos based on query, sort, pagination
  try {
    const { page = 1, limit = 9, query, sortBy, sortType } = req.query;

    const sortfield = sortBy || 'createdAt'
    const sorttype = sortType==='desc'?-1:1
    const allvideos = await Video.aggregate([
      {
        $match:
          {
            title:{
              $regex :new RegExp(query, 'i'),
          }
          },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: parseInt(limit, 10),
      },
      {
        $sort:
          {
            [sortfield]:sorttype
          },
      },
      {
        $lookup:
          {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "result",
          },
      },
      {
        $addFields:
          {
            ownerdetails: {
              $first: "$result",
            },
          },
      },
      {
        $project:
          {
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
    ])
    if(!allvideos){
        return res.status(200).send(new ApiResponse(200, {}, "No Videos found"))
    }
    return res.status(201).send(new ApiResponse(201, allvideos, "fetched videos based on query"))
  } catch (error) {
    throw new ApiError(
      501,
      `following error occured while fetchin videos ${error}`
    );
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  // TODO: get video, upload to cloudinary, create video
  try {
    const { title, description } = req.body;
    if (!title) {
      throw new ApiError(400, "Title is required");
    }
    if (!description) {
      throw new ApiError(400, "description is required");
    }
    let videoFilelocalpath;
    let thumbnaillocalpath;
    console.log(req.files)
    if (
      req.files &&
      Array.isArray(req.files.videoFile) &&
      req.files.videoFile.length > 0
    ) {
      videoFilelocalpath = req.files.videoFile[0].path;
    }
    if (!videoFilelocalpath) {
      throw new ApiError(400, "Video is required");
    }
    if (
      req.files &&
      Array.isArray(req.files.thumbnail) &&
      req.files.videoFile.length > 0
    ) {
      thumbnaillocalpath = req.files.thumbnail[0].path;
    }
    if (!thumbnaillocalpath) {
      throw new ApiError(400, "thumbnail is required");
    }

    const cloudVideo = await uploadOnCloudinary(videoFilelocalpath);
    if (!cloudVideo) {
      throw new ApiError(400, "VIdeo upload error on cloudinary");
    }
    const cloudThumbnail = await uploadOnCloudinary(thumbnaillocalpath);
    if (!cloudThumbnail) {
      throw new ApiError(400, "Thumbnail upload error on cloudinary");
    }
    const newVideo = await Video.create({
      videoFile: cloudVideo.url,
      thumbnail: cloudThumbnail.url,
      videoFileId: cloudVideo.public_id,
      thumbnailId: cloudThumbnail.public_id,
      title: title,
      description: description,
      duration: cloudVideo.duration,
      views: 0,
      isPublished: true,
      owner: req.user._id,
    });
    await newVideo.save();
    res
      .status(200)
      .send(new ApiResponse(200, { newVideo }, "video published successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      `Following error occured while publishing video ${error}`
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!videoId) {
      throw new ApiError(401, "video Id is required");
    }
    const videofile = await Video.findById(videoId);
    if (!videofile) {
      throw new ApiError(401, "video not found");
    }
    if(!videofile.isPublished){
      throw new ApiError(401, "Video Unpublished")
    }
    res
      .status(200)
      .send(new ApiResponse(200, videofile, "video fetched successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      `Following error occured while fetching video ${error}`
    );
  }

  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  try {
    const { videoId } = req.params;
    if (!videoId) {
      throw new ApiError(401, "Video Id is required");
    }
    const videoToBeUpdated = await Video.findById(videoId);
    if (!videoToBeUpdated.owner.equals(req.user._id)) {
      throw new ApiError(401, "unauthorized request");
    }

    if (!videoToBeUpdated) {
      throw new ApiError(401, "video not found");
    }
    if (req.body.title) {
      videoToBeUpdated.title = req.body.title;
    }
    if (req.body.description) {
      videoToBeUpdated.description = req.body.description;
    }
    if (req.file) {
      const deletedthumbnail = await deletefromcloudinary(
        videoToBeUpdated.thumbnailId
      );
      const thumbnailLocalpath = req.file.path;
      if (!thumbnailLocalpath) {
        throw new ApiError(401, "file upload failed in multer");
      }
      const thumbnail = await uploadOnCloudinary(thumbnailLocalpath);
      videoToBeUpdated.thumbnail = thumbnail.url;
      videoToBeUpdated.thumbnailId = thumbnail.public_id;
    }
    await videoToBeUpdated.save();
    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          videoToBeUpdated,
          "Video data updated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      `Following error occured while fetching video ${error}`
    );
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!videoId) {
      throw new ApiError(401, "Video ID is required");
    }
    const videoToBeDeleted = await Video.findByIdAndDelete(videoId);
    if (!videoToBeDeleted) {
      throw new ApiError(401, "error in mongo call");
    }
    console.log(videoToBeDeleted);
    const deletedcloudvideo = await deleteVideofromcloudinary(
      videoToBeDeleted.videoFileId
    );
    const deletedcloudthumbnail = await deletefromcloudinary(
      videoToBeDeleted.thumbnailId
    );
    if (!deletedcloudvideo || !deletedcloudthumbnail) {
      throw new ApiError(
        500,
        "error deleting video or thumbnail from cloudinary"
      );
    }
    res
      .status(200)
      .send(
        new ApiResponse(200, videoToBeDeleted, "Video deleted successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      ` following error occured while deleting the video ${error} `
    );
  }
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!videoId) {
      throw new ApiError(401, "video ID is required");
    }
    const videoFile = await Video.findById(videoId);
    if (!videoFile.owner.equals(req.user._id)) {
      throw new ApiError(401, "unauthorized request");
    }
    if (!videoFile) {
      throw new ApiError(500, "error in mongo query");
    }
    if (videoFile.isPublished) {
      videoFile.isPublished = false;
    } else {
      videoFile.isPublished = true;
    }
    await videoFile.save();
    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          videoFile,
          "Video published/unpublished successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      ` following error occured while toggling the video ${error} `
    );
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
