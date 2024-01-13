import * as UserService from "../services/userService";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import { User } from "../models/userModel";
import CustomError from "../../config/CustomError";


export const getAllUsers = asyncErrorHandler(async (req, res) => {
  //add logic here 

  const allUsers = await UserService.getAllUsers({});

  res.status(200).json({
    status: "success",
    message: "Users fetched successfully",
    data: allUsers.map((user) => {
      return {
        name: user.name,
        email: user.email,
        role_id: user.role_id
      }
    }),
  });
});

export const getCurrentUserController = asyncErrorHandler(async (req,res,next) => {
  const user = await User.findOne({_id:req.body.user_id});
  if(!user) {
    const error = new CustomError("Unable to get current user",403);
    next(error);
  }
  res.status(200).json({
    status: "success",
    message: "User fetched successfully",
    data: user
  })
})