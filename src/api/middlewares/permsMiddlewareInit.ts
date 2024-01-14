import asyncErrorHandler from "../helpers/asyncErrorHandler";
import CustomError from "../../config/CustomError";
import { Role } from "../models/rolesModel";
import Permission from "../helpers/permissions";
import * as UserService from "../services/userService";


/**
 * This generates a middleware to check for certain given permissions
 * 
 * Note: This is not a middleware in itself
 *
 * @export
 * @param {Permission[]} permissions_required An array of permissions required
 * @returns Middleware function
 */
export default function protected_route(permissions_required: Permission[]) {
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
    const user = await UserService.checkUserExists({ email: email });
    if (!user) {
      /** this code should be unreachable; only way to
        * reach this is code is if user was logged in
        * before the entry was deleted from db
        * must be a bad user
        */
      const err = new CustomError("Cannot find your login in database! hehe", 401);
      return next(err);
    }

    const role = user.role_id;

    if (!role) {
      const err = new CustomError(`Invalid role! ${role}`, 409);
      return next(err);
    }
    if (role.id?.toString() === process.env.SUPERUSER_ROLE_ID) {
      return next();
    }

    const satisfied = permissions_required.every((perm) => {
      if (user.removed_permissions?.includes(perm)) {
        console.log(`Permission ${perm} denied (${Permission[perm]})`);
        return false;
      }

      const perm_given = role.permissions.includes(perm) || user.extra_permissions?.includes(perm);
      if (!perm_given) {
        console.log(`Permission ${perm} not satisfied (${Permission[perm]})`);
      }
      return perm_given;
    });

    if (satisfied) {
      return next();
    }

    const err = new CustomError("You do not have permission to access this setting.", 403);
    return next(err);
  });

  return protect;
}