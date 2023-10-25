import jwt from "jsonwebtoken";
import asyncErrorHandler from "../helpers/asyncErrorHandler.js";
// import { User } from "../models/userModel";
import CustomError from "../../config/CustomError.js";

export const protect = asyncErrorHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Get token from header
    token = req.headers.authorization.split(" ")[1];

    // Verify token
    jwt.verify(token, process.env.ACCESS_SECRET_KEY, (err, decoded) => {
      if (err){ return next(new CustomError(err, 403));}

      req.user = decoded.email;

      next();
    });

    // Get user from the token and add it to request
    // req.user = await User.findById(decoded.id).select("-password");
    // next();
  }

  if (!token) {
    const err = new CustomError(`Not authorized`, 401);
    next(err);
  }
});
