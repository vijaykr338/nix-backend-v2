import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import { makeAccessToken, makeRefreshToken } from "../helpers/common";
import StatusCode from "../helpers/httpStatusCode";
import { user_to_response } from "../helpers/user_to_response";
import { User } from "../models/userModel";
import PasswordResetMail from "../services/emails/passwordReset";
import * as UserService from "../services/userService";

/**
 * Used when access tokens have expired. Generate a new access token and a new refresh token.
 */
/**
 * @description Handles the refresh token process, generating a new access token and refresh token for the user.
 * @route GET /refresh
 * @param req - The HTTP request object.
 * @param req.cookies - The cookies present in the request.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('AccessToken generated successfully').
 * @returns data - Contains the new access token.
 * @returns data.accessToken - The newly generated access token for the user.
 * @howItWorks
 * - Retrieves the refresh token from cookies (`req.cookies.jwt`).
 * - Checks if the refresh token exists; if not, returns an error.
 * - Verifies the refresh token against the refresh secret key stored in environment variables.
 * - If the verification fails or the refresh token is invalid, clears the refresh token from cookies and returns an error.
 * - Generates a new refresh token and updates it in the user's database record.
 * - Verifies the decoded email from the refresh token and compares it with the found user's email.
 * - Generates a new access token using the user's email and ID.
 * - Sets the new refresh token in cookies and sends a success response with the new access token.
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

/**
 * @description Handles user signup by creating a new user if the email is not already registered.
 * @route POST /signup
 * @param req - The HTTP request object.
 * @param req.body - The request body containing user details.
 * @param req.body.name - The name of the user.
 * @param req.body.username - The email of the user.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('User successfully created!').
 * @returns data - Contains the details of the newly created user.
 * @returns data.name - The name of the newly created user.
 * @returns data.email - The email ID of the newly created user.
 * @howItWorks
 * - Retrieves the user's name and email from the request body (`req.body.name` and `req.body.username`).
 * - Checks if both name and email are provided; if not, returns an error.
 * - Checks if the provided email (username) is already registered using `UserService.checkUserExists`.
 * - If the email is already registered, returns an error indicating "Email already registered".
 * - If the email is not registered, creates a new user using `UserService.createNewUser`.
 * - Sends a success response indicating user creation with the user's name and email.
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

/**
 * @description Handles user login by verifying email and password, generating access and refresh tokens, and setting a refresh token cookie.
 * @route POST /login
 * @param req - The HTTP request object.
 * @param req.body - The request body containing login credentials.
 * @param req.body.email - The email of the user.
 * @param req.body.password - The password of the user.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('User successfully logged in!').
 * @returns data - Contains the access token and user details.
 * @returns data.accessToken - The access token used for authentication.
 * @returns data.user - The user object containing user details.
 * @howItWorks
 * - Retrieves the user's email and password from the request body (`req.body.email` and `req.body.password`).
 * - Checks if both email and password are provided; if not, returns an error.
 * - Retrieves the user from the database using `UserService.checkUserExists` based on the provided email.
 * - If no user is found with the provided email, returns an error indicating "No user exists with this email".
 * - Compares the provided password with the stored password hash using `bcrypt.compare`.
 * - If the passwords match, generates an accessToken and a refreshToken using `makeAccessToken` and `makeRefreshToken`.
 * - Stores the refreshToken in a cookie named "jwt" in the response headers (for browser storage).
 * - Sends a success response containing the accessToken and user details.
 */
export const login = asyncErrorHandler(async (req, res, next) => {
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
      StatusCode.NOT_FOUND,
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
    const user = user_to_response(foundUser);

    res.json({
      status: "success",
      message: "User successfully login!",
      data: {
        accessToken,
        user: user,
      },
    });
  } else {
    const error = new CustomError("Password is wrong!", StatusCode.BAD_REQUEST);
    return next(error);
  }
});

/**
 * Handle user password reset request. Send a mail to user with password reset link.
 */

/**
 * @description Handles password change by verifying the old password, hashing the new password, and updating the user's password in the database.
 * @route POST /change-password
 * @param req - The HTTP request object.
 * @param req.body - The request body containing password change details.
 * @param req.body.old_password - The old password of the user.
 * @param req.body.new_password - The new password of the user.
 * @param req.body.email - The email of the user.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Password changed successfully').
 * @returns data - Contains updated user information.
 * @returns data.user - Updated user object containing user details.
 * @howItWorks
 * - Retrieves the user's email, old_password, and new_password from the request body (`req.body.email`, `req.body.old_password`, `req.body.new_password`).
 * - Checks if all required fields are provided; if not, returns an error.
 * - Retrieves the user from the database using `UserService.checkUserExists` based on the provided email.
 * - If no user is found with the provided email, returns an error indicating "Invalid email".
 * - Compares the provided old_password with the stored password hash using `bcrypt.compare`.
 * - If the old_password matches, hashes the new_password using `bcrypt.hash` and updates the user's password in the database.
 * - Sends a success response containing the updated user details.
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

  const user_resp = user_to_response(user);

  console.log("Password changed successfully for user", user);
  res.status(StatusCode.OK).json({
    status: "success",
    message: "Password changed successfully",
    data: { user: user_resp },
  });
});

/**
 * @description Handles the forgot password process by generating a password reset token and sending it to the user's email.
 * @route POST /forgotPassword
 * @param req - The HTTP request object.
 * @param req.body - The request body containing the user's email.
 * @param req.body.email - The email of the user requesting password reset.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of sending the password reset link.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Password reset link successfully sent.').
 * @howItWorks
 * - The function first retrieves the secret key used for token generation from the environment variables.
 * - It then extracts the user's email from the request body and checks if a user with that email exists in the database.
 * - If the user does not exist, it returns an error.
 * - If the user exists, a password reset token is generated using JWT, and this token is stored in the user's record in the database.
 * - A password reset email containing the token is then sent to the user.
 * - If the email is sent successfully, a success response is returned.
 * - If there is an error in sending the email, an error response is returned.
 */
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
/**
 * @description Handles the password reset process for a user.
 * @route PATCH /resetPassword/:token
 * @param req - The HTTP request object.
 * @param req.params - The URL parameters.
 * @param req.params.token - The reset token sent to the user.
 * @param req.body - The request body.
 * @param req.body.newPassword - The new password provided by the user.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the password reset operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns data - Contains the email and name of the user whose password was reset.
 * @returns data.email - The email ID of the user whose password was reset.
 * @returns data.name - The name of the user whose password was reset.
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
/**
 * @description Handles the user logout process by clearing the refresh token from cookies and the database.
 * @route POST /logout
 * @param req - The HTTP request object.
 * @param req.cookies - The cookies present in the request.
 * @param res - The HTTP response object.
 * @param _next - The next middleware function in the stack (not used in this function).
 * @returns A status code indicating the success of the logout operation.
 * @returns - HTTP status code indicating successful logout (204 - No Content).
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
