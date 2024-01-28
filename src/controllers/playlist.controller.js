import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      throw new ApiError(401, "Name and Description both are required");
    }
    const playlist = await Playlist.create({
      name: name,
      description: description,
      owner: req.user._id,
    });
    playlist.save();
    if (!playlist) {
      throw new ApiError(501, "Playlist Creation Failed");
    }
    return res
      .status(200)
      .send(new ApiResponse(300, playlist, "PLaylist Created successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      `following error occured while creating the playlist ${error}`
    );
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      throw new ApiError(401, "User Id is required");
    }
    const playlists = await Playlist.find({
      owner: new mongoose.Types.ObjectId(userId),
    });
    if (!playlists) {
      throw new ApiError(400, "No playlists found for this user");
    }
    return res
      .status(200)
      .send(new ApiResponse(200, playlists, "Playlist fetched"));
  } catch (error) {
    throw new ApiError(
      500,
      `following error occured while fetching the playlists ${error}`
    );
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
  try {
    const { playlistId } = req.params;
    if (!playlistId) {
      throw new ApiError(400, "Playlist Id required");
    }
    const playlist = await Playlist.findById(
      new mongoose.Types.ObjectId(playlistId)
    );
    if (!playlist) {
      throw new ApiError(401, "playlist not found");
    }
    return res
      .status(200)
      .send(new ApiResponse(200, playlist, "playlist fetched by Id"));
  } catch (error) {
    throw new ApiError(
      500,
      `following error occured while fetching the playlist by id ${error}`
    );
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;
    if (!playlistId || !videoId) {
      throw new ApiError(401, "playlist id and video id both are required");
    }
    const playlist = await Playlist.findById(
      new mongoose.Types.ObjectId(playlistId)
    );
    if (!playlist) {
      throw new ApiError(401, "playlist not found");
    }
    if (playlist.videos.includes(new mongoose.Types.ObjectId(videoId))) {
      throw new ApiError(401, "Video already added to the playlist");
    }
    playlist.videos.push(new mongoose.Types.ObjectId(videoId));
    const updatedPlaylist = await playlist.save();
    return res
      .status(200)
      .send(
        new ApiResponse(
          200,
          updatedPlaylist,
          "video added to playlist successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      `following error occured while fetching the playlist by id ${error}`
    );
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  try {
    const { playlistId, videoId } = req.params;
    if (!playlistId || !videoId) {
      throw new ApiError(401, "playlist id and video id both are required");
    }
    const playlist = await Playlist.findById(
      new mongoose.Types.ObjectId(playlistId)
    );
    if (!playlist) {
      throw new ApiError(401, "playlist not found");
    }
    const videoIndex = playlist.videos.indexOf(
      new mongoose.Types.ObjectId(videoId)
    );
    if (videoIndex === -1) {
      throw new ApiError(404, "Video not found in the playlist");
    }
    playlist.videos.splice(videoIndex, 1);
    const updatedPlaylist = await playlist.save();
    return res
      .status(200)
      .send(
        new ApiResponse(
          200,
          updatedPlaylist,
          "Video successfully removed from the playlist"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      `following error occured while removing the video from the playlist ${error}`
    );
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
  try {
    const { playlistId } = req.params;
    if (!playlistId) {
      throw new ApiError(401, "PLaylist Id is required");
    }
    const deletedPlaylist = await Playlist.findByIdAndDelete(
      new mongoose.Types.ObjectId(playlistId)
    );
    if (!deletedPlaylist) {
      throw new ApiError(400, "playlist not found");
    }
    return res
      .status(200)
      .send(
        new ApiResponse(200, deletedPlaylist, "playlist deleted successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      `following error occured while deleting the playlist by id ${error}`
    );
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  //TODO: update playlist
  try {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    if (!playlistId) {
      throw new ApiError(401, "playlist id is required");
    }
    if (!name && !description) {
      throw new ApiError(401, "name or description is required");
    }
    const playlistToBeUpdated = await Playlist.findById(
      new mongoose.Types.ObjectId(playlistId)
    );
    if (!playlistToBeUpdated) {
      throw new ApiError(401, "playlist not found");
    }
    if (name) {
      playlistToBeUpdated.name = name;
    }
    if (description) {
      playlistToBeUpdated.description = description;
    }
    playlistToBeUpdated.save();

    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          playlistToBeUpdated,
          "Playlist updated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      `following error occured while fetching the playlist by id ${error}`
    );
  }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
