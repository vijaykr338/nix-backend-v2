import jwt from "jsonwebtoken";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import CustomError from "../../config/CustomError";

export const protect = asyncErrorHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Get token from header
    token = req.headers.authorization.split(" ")[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY);

      // Add decoded information to the request body
      req.body.email = decoded.email;
      req.body.user_id = decoded.user_id;

      console.log(req.body.email);
      console.log(req.body.user_id);

      // Continue to the next middleware or route handler
      return next();
    } catch (err) {
      // Handle token verification error
      return next(new CustomError(err, 403));
    }
  }

  if (!token) {
    const err = new CustomError(`Not authorized`, 401);
    return next(err);
  }
});
