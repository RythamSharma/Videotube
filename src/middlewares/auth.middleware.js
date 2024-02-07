import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const authmiddleware = asyncHandler( async (req, res, next) => {
 try {
     const accessToken =
       req.cookies?.accessToken ||
       req.headers["authorization"]?.replace("bearer ", "");
     if (!accessToken) {
       throw new ApiError(401, "access token not provided");
     }
     const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
     if (!user) {
       throw new ApiError(401, "Unauthorized request");
     }
     req.user = user;
     next();
 } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token")
 }

});
export default authmiddleware;
