import bcrypt from "bcrypt";
import mongoose, { FilterQuery } from "mongoose";
import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import StatusCode from "../helpers/httpStatusCode";
import MainWebsiteRole from "../helpers/mainWebsiteRole";
import Permission from "../helpers/permissions";
import { user_to_response } from "../helpers/user_to_response";
import { IRole } from "../models/rolesModel";
import { IUser, PopulatedUser, User } from "../models/userModel";
import * as UserService from "../services/userService";
import { Blog } from "../models/blogModel";

export const getTeam = asyncErrorHandler(async (req, res) => {
  const filter: FilterQuery<IUser> = {
    team_role: { $ne: MainWebsiteRole.DoNotDisplay },
  };

  const allUsers = await UserService.getAllUsers(filter);

  res.status(StatusCode.OK).json({
    status: "success",
    message: "Users fetched successfully",
    data: allUsers.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { permission, is_superuser, ...user_resp } = user_to_response(user);
      return user_resp;
    }),
  });
});

export const getAllUsers = asyncErrorHandler(async (req, res) => {
  //add logic here

  const allUsers = await UserService.getAllUsers({});

  res.status(StatusCode.OK).json({
    status: "success",
    message: "Users fetched successfully",
    data: allUsers.map((user) => {
      const user_resp = user_to_response(user);
      return user_resp;
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

    const user_resp = user_to_response(user);

    res.status(StatusCode.OK).json({
      status: "success",
      message: "User fetched successfully",
      data: user_resp,
    });
  },
);

export const getUserController = asyncErrorHandler(async (req, res, next) => {
  const user_id = new mongoose.Types.ObjectId(req.params.id);
  const user = await UserService.checkUserExists({ _id: user_id });
  if (!user) {
    const error = new CustomError(
      "Unable to get current user",
      StatusCode.UNAUTHORIZED,
    );
    return next(error);
  }

  const user_resp = user_to_response(user);

  res.status(StatusCode.OK).json({
    status: "success",
    message: "User fetched successfully",
    data: user_resp,
  });
});

export const updateUserController = asyncErrorHandler(
  async (req, res, next) => {
    const user_id = new mongoose.Types.ObjectId(req.body.user_id);
    const target_user_id = new mongoose.Types.ObjectId(req.body.target_user_id);

    const user = await UserService.checkUserExists({ _id: target_user_id });
    req.body.user = user;

    if (!target_user_id.equals(user_id)) {
      return next();
    }

    if (!user) {
      const error = new CustomError(
        "Unable to get current user",
        StatusCode.NOT_FOUND,
      );
      return next(error);
    }

    // Update user properties if provided in request body
    if (req.body.target_name) user.name = req.body.target_name;
    if (req.body.target_email) user.email = req.body.target_email;
    if (req.body.password) {
      const hashed_password: string = await bcrypt.hash(req.body.password, 10);
      user.password = hashed_password;
    }
    if (req.body.target_bio) user.bio = req.body.target_bio;

    await user.save();
    req.body.user = user;
    if (!req.body.permission && !req.body.role_id) {
      const user_resp = user_to_response(user);

      return res.status(StatusCode.OK).json({
        status: "success",
        message: "User updated successfully",
        data: {
          user: user_resp,
        },
      });
    }
    return next();
  },
);

export const permsUpdateController = asyncErrorHandler(
  async (req, res, next) => {
    let user: PopulatedUser = req.body.user;
    const {
      permission,
      role_id,
    }: { permission: Permission[]; role_id: string } = req.body;

    if (!user) {
      const error = new CustomError(
        "Requested user not found",
        StatusCode.NOT_FOUND,
      );
      return next(error);
    }
    if (role_id) {
      const updated_user = await User.findByIdAndUpdate(
        user,
        {
          role_id: role_id,
        },
        { new: true },
      ).populate<{
        role_id: IRole;
      }>("role_id");
      if (!updated_user) {
        const error = new CustomError(
          "Unable to update user",
          StatusCode.INTERNAL_SERVER_ERROR,
        );
        return next(error);
      }
      user = updated_user;
    }

    if (permission !== undefined || permission !== null) {
      const role_perms_taken_away = user.role_id.permissions.filter(
        (perm) => !permission.includes(perm),
      );
      const extra_perms_given = permission.filter(
        (perm) => !user.role_id.permissions.includes(perm),
      );
      user.removed_permissions = role_perms_taken_away;
      user.extra_permissions = extra_perms_given;
    }

    user.team_role =
      (req.body.team_role as MainWebsiteRole) || MainWebsiteRole.DoNotDisplay;

    await user.save();

    const user_resp = user_to_response(user);
    return res.status(StatusCode.OK).json({
      status: "success",
      message: "User updated successfully",
      data: {
        user: user_resp,
      },
    });
  },
);

export const deleteUserController = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const user_id = new mongoose.Types.ObjectId(id);
    const target_user_id = new mongoose.Types.ObjectId(req.body.target_user_id);
    const new_owner = new mongoose.Types.ObjectId(process.env.EMAIL_USER_OBJID);

    if (target_user_id.equals(new_owner)) {
      const err = new CustomError(
        "You cannot delete the default account!",
        StatusCode.FORBIDDEN,
      );
      return next(err);
    }

    const user = await UserService.checkUserExists({ _id: target_user_id });

    if (!user) {
      const error = new CustomError(
        "Unable to get user account!",
        StatusCode.NOT_FOUND,
      );
      return next(error);
    }

    if (target_user_id.equals(user_id)) {
      const err = new CustomError(
        "You cannot delete your own account",
        StatusCode.FORBIDDEN,
      );
      return next(err);
    }

    const ownership = await Blog.updateMany(
      {
        user: user._id,
      },
      { user: new_owner },
    );

    console.log(
      "User",
      user,
      "deleted by",
      user_id,
      "upgraded ownership blogs result",
      ownership,
    );

    await user.deleteOne();

    res.status(StatusCode.OK).json({
      status: "success",
      message: "User deleted successfully",
    });
  },
);
