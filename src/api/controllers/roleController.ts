import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import StatusCode from "../helpers/httpStatusCode";
import { Role } from "../models/rolesModel";
import Permission from "../helpers/permissions";

export const add_or_update_role = asyncErrorHandler(async (req, res, next) => {
  const data = req.body;
  const { role_name: name, permissions, role_id: id } = data;

  console.log('Permissions:', permissions);

  // Check if id is provided for updating an existing role
  if (id) {
    // Update existing role with id
    // todo: should be under service logic
    const role = await Role.updateOne({ _id: id }, { name, permissions });
    console.log('Role updated', role);

    return res.status(StatusCode.OK).json({
      status: 'success',
      message: 'Role updated successfully',
      role,
    });
  }

  // If id is not present, create a new role
  if (name && permissions) {
    // Manual validation of permissions
    const isPermissionsValid = permissions.every((permission) =>
      Object.values(Permission).includes(permission)
    );

    if (!isPermissionsValid) {
      const error = new CustomError(
        'Invalid permission value in the array.',
        StatusCode.BAD_REQUEST
      );
      return next(error);
    }

    // Create a new role
    // todo: should be under service logic
    const newRole = await Role.create({ name, permissions });
    console.log('Role created', newRole);

    return res.status(StatusCode.CREATED).json({
      status: 'success',
      message: 'Role created successfully',
      data: newRole,
    });
  }

  // If neither id nor (name and permissions) is provided, return an error
  const error = new CustomError(
    'Please provide either role_id for updating or both role_name and permissions for creating a role.',
    StatusCode.BAD_REQUEST
  );
  return next(error);
});

export const get_all_roles = asyncErrorHandler(async (_req, res, _next) => {
  // todo: should be under service
  const roles = await Role.find({});

  res.status(StatusCode.OK).json({
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
