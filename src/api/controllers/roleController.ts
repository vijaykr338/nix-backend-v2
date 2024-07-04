import CustomError from "../../config/CustomError";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import StatusCode from "../helpers/httpStatusCode";
import { Role } from "../models/rolesModel";
import Permission from "../helpers/permissions";
import { User } from "../models/userModel";

/**
 * @description Adds or updates a role in the system.
 * @route POST /update
 * @param req - The HTTP request object containing role data (`req.body`).
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Role created successfully' or 'Role updated successfully').
 * @returns data - Contains the details of the created or updated role.
 * @howItWorks
 * - Retrieves role data (`req.body`) including `role_name`, `permissions`, and optionally `role_id`.
 * - If `role_id` is provided, updates the existing role with the corresponding `id`.
 * - If `role_id` is not provided, validates and creates a new role with `role_name` and `permissions`.
 * - Validates permissions to ensure they are valid according to predefined values.
 * - Returns a success response with the updated or created role details upon success.
 * - If no `role_id` and insufficient `role_name` or `permissions` are provided, returns a `BAD_REQUEST` error.
 */

export const add_or_update_role = asyncErrorHandler(async (req, res, next) => {
  const data = req.body;
  const { role_name: name, permissions, role_id: id } = data;

  console.log("Permissions:", permissions);

  // Check if id is provided for updating an existing role
  if (id) {
    // Update existing role with id
    // todo: should be under service logic
    const role = await Role.updateOne({ _id: id }, { name, permissions });
    console.log("Role updated".blue, req.body, role);

    return res.status(StatusCode.OK).json({
      status: "success",
      message: "Role updated successfully",
      role,
    });
  }

  // If id is not present, create a new role
  if (name && permissions) {
    // Manual validation of permissions
    const isPermissionsValid = permissions.every((permission) =>
      Object.values(Permission).includes(permission),
    );

    if (!isPermissionsValid) {
      const error = new CustomError(
        "Invalid permission value in the array.",
        StatusCode.BAD_REQUEST,
      );
      return next(error);
    }

    // Create a new role
    // todo: should be under service logic
    const newRole = await Role.create({ name, permissions });
    console.log("Role created".blue, newRole);

    return res.status(StatusCode.CREATED).json({
      status: "success",
      message: "Role created successfully",
      data: newRole,
    });
  }

  // If neither id nor (name and permissions) is provided, return an error
  const error = new CustomError(
    "Please provide either role_id for updating or both role_name and permissions for creating a role.",
    StatusCode.BAD_REQUEST,
  );
  return next(error);
});

/**
 * @description Deletes a role from the system if it's not assigned to any user.
 * @route DELETE /roles/:id
 * @param req - The HTTP request object containing the role ID (`req.params.id`).
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the stack.
 * @returns A JSON response indicating the success of the operation.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Role deleted successfully').
 * @howItWorks
 * - Retrieves the role ID (`req.params.id`) from the request.
 * - Checks if any user is currently assigned to this role; if so, returns a `BAD_REQUEST` error.
 * - Deletes the role from the database if it exists and is not assigned to any user.
 * - Returns a success response upon successful deletion of the role.
 * - If no `role_id` is provided in the request parameters, returns a `BAD_REQUEST` error.
 */

export const delete_role = asyncErrorHandler(async (req, res, next) => {
  const id = req.params.id;

  if (id) {
    const user = await User.findOne({ role_id: id });
    if (user) {
      const error = new CustomError(
        "Cannot delete a role that is assigned to a user.",
        StatusCode.BAD_REQUEST,
      );
      return next(error);
    }
    const role = await Role.findByIdAndDelete(id);
    if (!role) {
      const error = new CustomError("Role not found.", StatusCode.NOT_FOUND);
      return next(error);
    }
    return res.status(StatusCode.OK).json({
      status: "success",
      message: "Role deleted successfully",
    });
  } else {
    const error = new CustomError(
      "Please provide role_id to delete a role.",
      StatusCode.BAD_REQUEST,
    );
    return next(error);
  }
});

/**
 * @description Retrieves all roles present in the system.
 * @route GET /
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @param _next - The next middleware function in the stack (not used).
 * @returns A JSON response containing the fetched roles.
 * @returns status - Indicates the success status of the operation ('success').
 * @returns message - Describes the outcome of the operation ('Roles fetched successfully').
 * @returns data - Contains an array of roles with their IDs, names, and permissions.
 * @howItWorks
 * - Retrieves all roles from the database.
 * - Maps each role to include its ID, name, and permissions.
 * - Sends a success response with the list of roles.
 */

export const get_all_roles = asyncErrorHandler(async (req, res, _next) => {
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
