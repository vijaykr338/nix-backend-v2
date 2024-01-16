import jwt, { JwtPayload } from "jsonwebtoken";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import CustomError from "../../config/CustomError";
import StatusCode from "../helpers/httpStatusCode";


export const protect = asyncErrorHandler(async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Get token from header
    const token_split = req.headers.authorization.split(" ");
    if (token_split.length !== 2) {
      const err = new CustomError("Invalid JWT token! Please login again", StatusCode.BAD_REQUEST);
      return next(err);
    }

    const token = token_split[1];
    if (!token) {
      const err = new CustomError("Not authorized", StatusCode.UNAUTHORIZED);
      return next(err);
    }

    try {
      // Verify token
      const { email, user_id }: JwtPayload = jwt.verify(token, process.env.ACCESS_SECRET_KEY) as JwtPayload;
      if (!email || !user_id) return next(new CustomError("Invalid JWT token! Please login again", StatusCode.FORBIDDEN));

      // Add decoded information to the request body
      req.body.email = email as string;
      req.body.user_id = user_id as string;

      // Continue to the next middleware or route handler
      return next();
    } catch (err) {
      // Handle token verification error
      return next(new CustomError(err, StatusCode.FORBIDDEN));
    }
  } else {
    const err = new CustomError("Not authorized", StatusCode.UNAUTHORIZED);
    return next(err);
  }
});
