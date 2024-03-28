import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import { makeAccessToken, makeRefreshToken } from "../helpers/common";
import StatusCode from "../helpers/httpStatusCode";
import Permission from "../helpers/permissions";
import { User } from "../models/userModel";
import PasswordResetMail from "../services/emails/passwordReset";
import * as UserService from "../services/userService";

/**
 * Used when access tokens have expired. Generate a new access token and a new refresh token.
 */

export const refresh = asyncErrorHandler(async (req, res, next) => {
  const cookies = req.cookies;
  if (!cookies)
    return next(
      new CustomError(
        "User not logged in or cookies disabled!",
        StatusCode.BAD_REQUEST,
      ),
    );

  const refreshToken = cookies.jwt as string;

  if (!refreshToken) {
    const err = new CustomError(
      "No refreshToken found! Please login again!",
      StatusCode.BAD_REQUEST,
    );
    return next(err);
  }

  const foundUser = await UserService.checkUserExists({
    refreshToken: refreshToken,
  });

  if (!foundUser) {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
    return next(
      new CustomError("Invalid refresh token", StatusCode.BAD_REQUEST),
    );
  }
  const refresh_secret_key = process.env.REFRESH_SECRET_KEY;
  if (!refresh_secret_key) {
    return next(
      new CustomError(
        "Refresh secret key not found in env",
        StatusCode.INTERNAL_SERVER_ERROR,
      ),
    );
  }

  const newRefreshToken = makeRefreshToken(foundUser.email, foundUser._id);

  foundUser.refreshToken = newRefreshToken;
  await foundUser.save();

  jwt.verify(refreshToken, refresh_secret_key, (err, decoded: JwtPayload) => {
    if (err || foundUser.email != decoded.email) {
      res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      return next(
        new CustomError(
          "Expired/Invalid refresh token",
          StatusCode.BAD_REQUEST,
        ),
      );
    }

    const newAccessToken = makeAccessToken(foundUser.email, foundUser._id);
    //set refreshToken cookie (whose name is jwt) in headers of response which will store in browser
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, //1 day
      sameSite: "none",
      secure: true,
    });

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
      StatusCode.BAD_REQUEST,
    );
    return next(error);
  }

  const isDuplicate = await UserService.checkUserExists({ email: email });
  console.log(isDuplicate);

  if (isDuplicate) {
    const error = new CustomError(
      "Email already registered",
      StatusCode.NOT_ACCEPTABLE,
    );
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
      StatusCode.BAD_REQUEST,
    );
    return next(error);
  }

  //check if user exists in database with given email
  const foundUser = await UserService.checkUserExists({ email: email });

  if (!foundUser) {
    const error = new CustomError(
      "No user exists with this email.",
      StatusCode.UNAUTHORIZED,
    );
    return next(error);
  }

  const match = await bcrypt.compare(password, foundUser.password);

  if (match) {
    const accessToken = makeAccessToken(email, foundUser._id);
    const refreshToken = makeRefreshToken(email, foundUser._id);

    foundUser.refreshToken = refreshToken;
    await foundUser.save();

    //set refreshToken cookie (whose name is jwt) in headers of response which will store in browser
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, //1 day
      sameSite: "none",
      secure: true,
    });

    console.log("Logged in user");
    const allowed_perms: Set<Permission> = new Set();
    foundUser.extra_permissions?.forEach((perm) => allowed_perms.add(perm));
    foundUser.role_id?.permissions?.forEach((perm) => allowed_perms.add(perm));
    foundUser.removed_permissions?.forEach((perm) =>
      allowed_perms.delete(perm),
    );
    res.json({
      status: "success",
      message: "User successfully login!",
      data: {
        accessToken,
        user: {
          id: foundUser._id,
          name: foundUser.name,
          email: foundUser.email,
          bio: foundUser.bio,
          role: foundUser.role_id.name,
          permission: [...allowed_perms],
          is_superuser:
            foundUser.role_id._id.toString() === process.env.SUPERUSER_ROLE_ID,
        },
      },
    });
  } else {
    const error = new CustomError(
      "Password is wrong!",
      StatusCode.UNAUTHORIZED,
    );
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
    data: { user },
  });
});

export const forgotPassword = asyncErrorHandler(async (req, res, next) => {
  const refresh_secret_key = process.env.REFRESH_SECRET_KEY;
  if (!refresh_secret_key) {
    throw Error("Refresh/Reset secret key not found in env");
  }

  //get user based on post email from database
  const email: string = req.body.email;
  const user = await UserService.checkUserExists({ email: email });
  if (!user) {
    const error = new CustomError(
      "No user exists with this email.",
      StatusCode.NOT_FOUND,
    );
    return next(error);
  }

  console.log(`Forgot password intitiated for ${email}`);
  //generate random reset token to send to user
  const resetToken = jwt.sign({ email: user.email }, refresh_secret_key, {
    expiresIn: "10m",
  });

  user.passwordResetToken = resetToken;

  await user.save();
  console.log("Password reset token added to db", user);

  const mail = new PasswordResetMail(user);

  try {
    await mail.sendTo(email);
    console.log("Password reset email sent");
    res.status(StatusCode.OK).json({
      status: "success",
      message: "Password reset link successfully sent.",
    });
  } catch (err) {
    const error = new CustomError(
      "There was an error in sending password reset email. Please try again.",
      StatusCode.INTERNAL_SERVER_ERROR,
    );
    return next(error);
  }
});

/**
 * Update new password in db and generate new access token and refresh token for user.
 */

export const resetPassword = asyncErrorHandler(async (req, res, next) => {
  const resetToken = req.params.token;
  const { newPassword } = req.body;
  const hashed_password = await bcrypt.hash(newPassword, 10);
  const key = process.env.REFRESH_SECRET_KEY;
  if (!key) {
    const error = new CustomError(
      "Refresh/Reset secret key not found in env",
      StatusCode.INTERNAL_SERVER_ERROR,
    );
    return next(error);
  }
  // Decode the token to get the user's email
  let decoded_payload: jwt.JwtPayload;
  try {
    decoded_payload = jwt.verify(resetToken, key) as jwt.JwtPayload;
  } catch (e) {
    const err = new CustomError(
      "Invalid/Expired Token",
      StatusCode.BAD_REQUEST,
    );
    return next(err);
  }

  const email: string | undefined = decoded_payload.email;
  if (!email) {
    const error = new CustomError(
      "Generated reset link is invalid!",
      StatusCode.BAD_REQUEST,
    );
    return next(error);
  }

  const user = await UserService.checkUserExists({ email: email });

  if (!user || user.passwordResetToken !== resetToken) {
    const error = new CustomError(
      "Token has been invalidated!",
      StatusCode.BAD_REQUEST,
    );
    return next(error);
  }

  user.password = hashed_password;
  user.passwordResetToken = undefined;
  user.refreshToken = undefined;
  await user.save();

  console.log("Password reset successfully for user", user);

  res.status(StatusCode.OK).json({
    status: "success",
    data: {
      email: user.email,
      name: user.name,
    },
  });
});

/**
 * Handle user logout.
 */

export const logout = asyncErrorHandler(async (req, res, _next) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(StatusCode.NO_CONTENT);
  const refreshToken = cookies.jwt;

  const foundUser = await User.findOne({ refreshToken }).exec();

  if (!foundUser) {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
    return res.sendStatus(StatusCode.NO_CONTENT);
  }

  // delete refreshToken present in db
  foundUser.refreshToken = "";
  await foundUser.save();

  res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
  res.sendStatus(StatusCode.NO_CONTENT);
});
