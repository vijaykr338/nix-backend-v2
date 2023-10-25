import * as UserService from "../services/userService.js";
import asyncErrorHandler from "../helpers/asyncErrorHandler.js";


export const getAllUsers = asyncErrorHandler(async (req, res) => {
  const allUsers = await UserService.getAllUsers({});
  res.status(200).json({
    status: "success",
    message: "Users fetched successfully",
    data: allUsers,
  });
});
