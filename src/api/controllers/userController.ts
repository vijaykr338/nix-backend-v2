import * as UserService from "../services/userService";
import asyncErrorHandler from "../helpers/asyncErrorHandler";


export const getAllUsers = asyncErrorHandler(async (req, res) => {
  //add logic here 

  const allUsers = await UserService.getAllUsers({});
  
  res.status(200).json({
    status: "success",
    message: "Users fetched successfully",
    data: allUsers,
  });
});
