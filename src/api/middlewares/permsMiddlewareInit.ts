import asyncErrorHandler from "../helpers/asyncErrorHandler";
import CustomError from "../../config/CustomError";
import { User } from "../models/userModel";
import { Role } from "../models/rolesModel";

/**
 * This generates a middleware to check for certain given permissions
 * 
 * Note: This is not a middleware in itself
 *
 * @export
 * @param {[Permission.default]} permissions_required An array of permissions required
 * @returns Middleware function
 */
export default function protected_route(permissions_required /*: [Permission.default]*/) {
    const protect = asyncErrorHandler(async (req, res, next) => {
        if (!permissions_required) {
            // no permissions required is a no-op
            return next();
        }
        const email = req.body.email;
        if (!email) {
            const err = new CustomError("Not authorized", 401);
            return next(err);
        }
        const user = await User.findOne({ email: email });
        if (!user) {
            /** this code should be unreachable; only way to
            * reach this is code is if user was logged in
            * before the entry was deleted from db
            * must be a bad user
            */
      const err = new CustomError("Cannot find your login in database! hehe", 401);
      return next(err);
    }

    const role_id = user.role_id;
    if (role_id === 100) { // 100 is SUPERUSER
      return next();
    }
    const role = await Role.findOne({ id: role_id });
    if (!role) {
      const err = new CustomError("Invalid role", 409);
      return next(err);
    }
    let satisfied = true;
    permissions_required.forEach((perm) => {
      if (satisfied && !role.permissions.includes(perm.permission_id)) {
        console.log(perm, "permission not satisfied");
        satisfied = false;
      }
    });

    if (satisfied) {
      return next();
    }

    const err = new CustomError("You do not have permission to access this setting.", 403);
    return next(err);
  });
  return protect;
}


/**
 * Should be used after protect middleware on methods
 * explicit to profiles with role as superuser
 */
export const protect_superuser = asyncErrorHandler(async (req, res, next) => {
    const email = req.body.email;
    if (!email) {
        const err = new CustomError("Not authorized", 401);
        return next(err);
    }
    const user = await User.findOne({ email });
    if (!user) {
        /** this code should be unreachable; only way to
        * reach this is code is if user was logged in
        * before the entry was deleted from db
        * must be a bad user
        */
    const err = new CustomError("Cannot find your login in database! hehe", 401);
    return next(err);
  }

  const role_id = user!.role_id;
  if (role_id === 100) { // 100 is SUPERUSER
    return next();
  }

  const err = new CustomError("You do not have permission to access this setting.", 403);
  return next(err);
});