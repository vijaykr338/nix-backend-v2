import * as UserService from "../services/userService";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import CustomError from "../../config/CustomError";
import mongoose from "mongoose";
import Permission from "../helpers/permissions";


export const getAllUsers = asyncErrorHandler(async (req, res) => {
  //add logic here 

  const allUsers = await UserService.getAllUsers({});

  res.status(200).json({
    status: "success",
    message: "Users fetched successfully",
    data: allUsers.map((user) => {
      // do a union of permissions here and difference with removed perms
      const allowed_perms: Set<Permission> = new Set();
      user.extra_permissions?.forEach((perm) => allowed_perms.add(perm));
      user.role_id?.permissions?.forEach((perm) => allowed_perms.add(perm));
      user.removed_permissions?.forEach((perm) => allowed_perms.delete(perm));

      const permissions = [...allowed_perms];

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        permissions: permissions,
      };
    }),
  });
});

export const getCurrentUserController = asyncErrorHandler(async (req, res, next) => {
  const user_id = new mongoose.Types.ObjectId(req.body.user_id);
  const user  = await UserService.checkUserExists({ _id: user_id });
  if (!user) {
    const error = new CustomError("Unable to get current user", 403);
    next(error);
  }
  
  const allowed_perms: Set<Permission> = new Set();
  user.extra_permissions?.forEach((perm) => allowed_perms.add(perm));
  user?.role_id?.permissions?.forEach((perm) => allowed_perms.add(perm));
  user.removed_permissions?.forEach((perm) => allowed_perms.delete(perm));

  const permissions = [...allowed_perms];

  res.status(200).json({
    status: "success",
    message: "User fetched successfully",
    permissions: permissions,
    id: user._id,
    name: user.name,
    email: user.email,
  });
});