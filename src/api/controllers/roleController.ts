import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import { Role, IRole } from "../models/rolesModel";

export const add_or_update_role = asyncErrorHandler(async (req, res, next) => {
  const data = req.body as IRole;
  const { name, permissions, _id : id } = data;
  if (!id) {
    const error = new CustomError("Role id not specified!", 400);
    return next(error);
  }
  if (!name || !permissions) {
    const error = new CustomError(
      "Please provide name and permissions to create a role.",
      400
    );
    return next(error);
  }


  // todo: should be under service logic
  const role = await Role.updateOne({ _id : id }, { name, permissions }, { upsert: true });
  console.log("Role updated", role);

  res.status(200).json({
    status: "success",
    message:
            role.matchedCount == 1 ? "Role updated successfully" : "Role created successfully",
    data,
  });
});

export const get_all_roles = asyncErrorHandler(async (_req, res, _next) => {
  // todo: should be under service
  const roles = await Role.find({});

  res.status(200).json({
    status: "success",
    message: "Roles fetched successfully",
    data: roles,
  });
});