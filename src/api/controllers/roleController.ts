import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import { Role } from "../models/rolesModel";

export const add_or_update_role = asyncErrorHandler(async (req, res, next) => {
  const data = req.body;
  const { role_name: name, permissions, role_id: id } = data;
  if (!name) {
    const error = new CustomError(
      "Please provide name to create a role.",
      400
    );
    return next(error);
  }

  if (!id && !permissions) {
    // create a new user
    // todo: should be under service logic
    const role = await Role.create({ name });
    console.log("Role created", role);

    return res.status(201).json({
      status: "success",
      message: "Role created successfully",
      data: role,
    });
  }
  if(!id || !permissions) {
    const error = new CustomError(
      "Please provide both role_id and permissions to update a role.",
      400
    );
    return next(error);
  }

  // update existing user
  // todo: should be under service logic
  const role = await Role.updateOne({ _id: id }, { name, permissions });
  console.log("Role updated", role);

  res.status(200).json({
    status: "success",
    message: "Role updated successfully",
    data,
  });
});

export const get_all_roles = asyncErrorHandler(async (_req, res, _next) => {
  // todo: should be under service
  const roles = await Role.find({});

  res.status(200).json({
    status: "success",
    message: "Roles fetched successfully",
    data: roles.map((role) => {
      return {
        role_id: role._id,
        role_name: role.name,
        permissions: role.permissions,
      };
    }),
  });
});
