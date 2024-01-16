import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import CustomError from "../../config/CustomError";
import passwordResetMail from "../services/emailService";
import * as UserService from "../services/userService";
import mongoose from "mongoose";
import StatusCode from "../helpers/httpStatusCode";


const makeAccessToken = (email: string, user_id: mongoose.Schema.Types.ObjectId) => {
  return jwt.sign({ email, user_id }, process.env.ACCESS_SECRET_KEY, {
    expiresIn: "1d",
  });
};

const makeRefreshToken = (email: string, user_id: mongoose.Schema.Types.ObjectId) => {
  return jwt.sign({ email, user_id }, process.env.REFRESH_SECRET_KEY, {
    expiresIn: "7d",
  });
};


/**
 * Used when access tokens have expired. Generate a new access token and a new refresh token.
 */

export const refresh = asyncErrorHandler(async (req, res, next) => {
  const cookies = req.cookies;
  if (!cookies) return next(new CustomError("User not logged in or cookies disabled!", StatusCode.UNAUTHORIZED));

  const refreshToken = cookies.jwt as string;

  if (!refreshToken) {
    const err = new CustomError("No refreshToken found! Please login again!", StatusCode.UNAUTHORIZED);
    return next(err);
  }

  const foundUser = await UserService.checkUserExists({ refreshToken: refreshToken });

  if (!foundUser) {
    return next(new CustomError("Invalid refresh token", StatusCode.FORBIDDEN));
  }

  jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY, (err, decoded: JwtPayload) => {
    if (err || foundUser.email != decoded.email) {
      return next(new CustomError("Invalid refresh token", StatusCode.FORBIDDEN));
    }

    const newAccessToken = makeAccessToken(foundUser.email, foundUser._id);

    res.status(StatusCode.OK).json({
      status: "success",
      message: "AccessToken generated successfully",
      data: {
        accessToken: newAccessToken,
      },
    });
  });
});

/**
 * Create new user.
 */

export const signup = asyncErrorHandler(async (req, res, next) => {
  const { name, username: email } = req.body;

  if (!email || !name) {
    const error = new CustomError(
      "Please provide name and email ID to sign up.",
      StatusCode.BAD_REQUEST
    );
    return next(error);
  }

  const isDuplicate = await UserService.checkUserExists({ email: email });
  console.log(isDuplicate);

  if (isDuplicate) {
    const error = new CustomError("Email already registered", StatusCode.NOT_ACCEPTABLE);
    return next(error);
  }

  await UserService.createNewUser(name, email);

  res.status(StatusCode.CREATED).json({
    status: "success",
    message: "User successfully created!",
    data: {
      name,
      email,
    },
  });
});

/**
 * Handle user login. Generate new access and refresh tokens for user.
 */
export const login = asyncErrorHandler(async (req, res, next) => {
  console.log(req.method);
  const { email, password } = req.body;
  console.log("Login request", email);

  if (!email || !password) {
    const error = new CustomError(
      "Please provide email ID and Password for login.",
      StatusCode.BAD_REQUEST
    );
    return next(error);
  }

  //check if user exists in database with given email
  const foundUser = await UserService.checkUserExists({ email: email });

  if (!foundUser) {
    const error = new CustomError("No user exists with this email.", StatusCode.UNAUTHORIZED);
    return next(error);
  }

  const match = await bcrypt.compare(password, foundUser.password);

  if (match) {
    const accessToken = makeAccessToken(email, foundUser._id);
    const refreshToken = makeRefreshToken(email, foundUser._id);

    const user = await UserService.addRefreshToken(email, refreshToken);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, //1 day
      sameSite: "none",
      secure: true,
    });

    console.log("Logged in user");

    res.json({
      status: "success",
      message: "User successfully login!",
      data: {
        accessToken,
        refreshToken,
        user: {
          name: user!.name,
          email: user!.email,
        },
      },
    });
  } else {
    const error = new CustomError("Password is wrong!", StatusCode.UNAUTHORIZED);
    return next(error);
  }
});

/**
 * Handle user password reset request. Send a mail to user with password reset link.
 */
export const changePassword = asyncErrorHandler(async (req, res, next) => {
  interface ChangePasswordRequest {
    old_password: string;
    new_password: string;
    email: string;
  }
  const body = req.body as ChangePasswordRequest;
  if (!body.email || !body.old_password || !body.new_password) {
    const err = new CustomError("Invalid request", StatusCode.BAD_REQUEST);
    return next(err);
  }

  const user = await UserService.checkUserExists({ email: body.email });
  if (!user) {
    const err = new CustomError("Invalid email", StatusCode.BAD_REQUEST);
    return next(err);
  }
  if (!bcrypt.compare(body.old_password, user.password)) {
    const err = new CustomError("Invalid old password", StatusCode.BAD_REQUEST);
    return next(err);
  }

  const hashed_password = await bcrypt.hash(body.new_password, 10);
  user.password = hashed_password;
  await user.save();

  console.log("Password changed successfully for user", user);
  res.status(StatusCode.OK).json({
    status: "success",
    message: "Password changed successfully",
    data: { user }
  });
});

export const forgotPassword = asyncErrorHandler(async (req, res, next) => {
  //get user based on post email from database
  const email = req.body.email;
  const user = await UserService.checkUserExists({ email: email });

  if (!user) {
    const error = new CustomError("No user exists with this email.", StatusCode.NOT_FOUND);
    return next(error);
  }

  console.log(`Forgot password intitiated for ${email}`);
  //generate random reset token to send to user
  const resetToken = crypto.randomBytes(32).toString("hex");

  //encrypted reset token to store in db
  //store in db todo
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // todo: maybe add expiration?
  // const passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

  user.passwordResetToken = passwordResetToken;
  // user.passwordResetTokenExpires = passwordResetTokenExpires;

  await user.save();
  console.log("Password reset token added to db", user);

  const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/resetPassword/${resetToken}`;

  const mail = new passwordResetMail.passwordResetMail(email, resetUrl);

  try {
    await mail.sendTo(email);
    console.log("Password reset email sent");
    res.status(StatusCode.OK).json(
      {
        status: "success",
        message: "Password reset link successfully sent."
      }
    );
  } catch (err) {
    const error = new CustomError(
      "There was an error in sending password reset email. Please try again.",
      StatusCode.INTERNAL_SERVER_ERROR
    );
    return next(error);
  }
});

/**
 * Update new password in db and generate new access token and refresh token for user.
 */

export const resetPassword = asyncErrorHandler(async (req, res, next) => {
  const token = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // todo : add date and time to expire password reset token ?
  // todo: should be under service logic
  const user = await UserService.resetUserPassword(token);

  if (!user) {
    const error = new CustomError("Token is invalid or has expired", StatusCode.BAD_REQUEST);
    return next(error);
  }

  //login the user
  const accessToken = makeAccessToken(user.email, user._id);
  const refreshToken = makeRefreshToken(user.email, user._id);

  // todo : move to service logic
  user.refreshToken = refreshToken;
  await user.save();

  console.log("Password reset successfully for user", user);

  res.status(StatusCode.OK).json({
    status: "success",
    data: {
      accessToken,
      refreshToken,
      email: user.email,
      name: user.name,
    }
  });
});

/**
 * Handle user logout.
 */

export const logout = asyncErrorHandler(async (req, res, _next) => {
  const cookies = req.cookies;

  //if no refreshToken present
  if (!cookies?.jwt) {
    return res.sendStatus(StatusCode.NO_CONTENT);
  }

  const refreshToken = cookies.jwt as string;

  //if no refreshToken present in db
  const foundUser = await UserService.checkUserExists({ refreshToken: refreshToken });
  if (!foundUser) {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
    return res.sendStatus(StatusCode.NO_CONTENT);
  }

  // delete refreshToken present in db
  await UserService.deleteRefreshToken(foundUser.email);
  res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });

  console.log("User logged out successfully", foundUser);
  return res.sendStatus(StatusCode.NO_CONTENT);
});
