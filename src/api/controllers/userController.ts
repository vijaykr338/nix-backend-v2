import * as UserService from "../services/userService";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import CustomError from "../../config/CustomError";
import mongoose from "mongoose";
import Permission from "../helpers/permissions";
import StatusCode from "../helpers/httpStatusCode";
import bcrypt from "bcrypt";

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

export const getCurrentUserController = asyncErrorHandler(
  async (req, res, next) => {
    const user_id = new mongoose.Types.ObjectId(req.body.user_id);
    const user = await UserService.checkUserExists({ _id: user_id });
    if (!user) {
      const error = new CustomError(
        "Unable to get current user",
        StatusCode.UNAUTHORIZED,
      );
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
      },
    });
  },
);


/**
 * Updates the user's profile.
 * Users can update their bio, password, and username.
 * If the user has the permission to Update Profile, they can also update Role, extra_perms, and removed_perms.
 */
export const updateUserController = asyncErrorHandler(async (req, res, next) => {
  const user_id = new mongoose.Types.ObjectId(req.body.user_id);
  // Check if the user exists
  const user = await UserService.checkUserExists({ _id: user_id });

  if (!user) {
    const error = new CustomError(
      "Unable to get current user",
      StatusCode.UNAUTHORIZED,
    );
    return next(error);
  }

  // Update user properties if provided in request body
  if (req.body.name) user.name = req.body.name;
  if (req.body.password) {
    const hashed_password: string = await bcrypt.hash(req.body.password, 10);
    user.password = hashed_password;
  }
  if (req.body.bio) user.bio = req.body.bio;

  // If user has permission to update profile
  if (req.body.extra_permissions || req.body.removed_permissions || req.body.role_id) {
    const allowed_perms: Set<Permission> = new Set();
    user.extra_permissions?.forEach((perm) => allowed_perms.add(perm));
    user?.role_id?.permissions?.forEach((perm) => allowed_perms.add(perm));
    user.removed_permissions?.forEach((perm) => allowed_perms.delete(perm));

    const permissions = [...allowed_perms];

    if (permissions.includes(Permission.UpdateProfile)) {
      if (req.body.role_id) user.role_id = req.body.role_id;
      if (req.body.extra_permissions) user.extra_permissions = req.body.extra_permissions;
      if (req.body.removed_permissions) user.removed_permissions = req.body.removed_permissions;
    }
  }

  // Save the updated user
  await user.save();

  res.status(StatusCode.OK).json({
    status: "success",
    message: "Profile Updated",
    data: { user }
  });
});


/**
 * Allows a user with permission to update profiles to update Role and Perms of other members.
 */
export const permsUpdateController = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const user_id = new mongoose.Types.ObjectId(id);
  const user = await UserService.checkUserExists({ _id: user_id });

  if (!user) {
    const error = new CustomError(
      "Requested user not found",
      StatusCode.NOT_FOUND,
    );
    return next(error);
  }

  if (req.body.role_id) user.role_id = req.body.role_id;
  if (req.body.extra_permissions) user.extra_permissions = req.body.extra_permissions;
  if (req.body.removed_permissions) user.removed_permissions = req.body.removed_permissions;

  await user.save();

  res.status(StatusCode.OK).json({
    status: "success",
    message: "Perms Updated",
    data: { user }
  })
});