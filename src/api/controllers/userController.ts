import * as UserService from "../services/userService";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import CustomError from "../../config/CustomError";
import mongoose from "mongoose";
import Permission from "../helpers/permissions";
import StatusCode from "../helpers/httpStatusCode";


export const getAllUsers = asyncErrorHandler(async (req, res) => {
  //add logic here 

  const allUsers = await UserService.getAllUsers({});

  res.status(StatusCode.OK).json({
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
        role: user.role_id?.name,
        role_id: user.role_id?._id,
        bio: user.bio,
        created_at: user.date_joined,
      };
    }),
  });
});

export const getCurrentUserController = asyncErrorHandler(async (req, res, next) => {
  const user_id = new mongoose.Types.ObjectId(req.body.user_id);
  const user = await UserService.checkUserExists({ _id: user_id });
  if (!user) {
    const error = new CustomError("Unable to get current user", StatusCode.FORBIDDEN);
    return next(error);
  }

  const allowed_perms: Set<Permission> = new Set();
  user.extra_permissions?.forEach((perm) => allowed_perms.add(perm));
  user?.role_id?.permissions?.forEach((perm) => allowed_perms.add(perm));
  user.removed_permissions?.forEach((perm) => allowed_perms.delete(perm));

  const permissions = [...allowed_perms];

  res.status(StatusCode.OK).json({
    status: "success",
    message: "User fetched successfully",
    data: {
      permission: permissions,
      id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      role: user.role_id?.name,
      is_superuser: user._id.toString() === process.env.SUPERUSER_ROLE_ID,
    }
  });
});
