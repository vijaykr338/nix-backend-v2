import { User } from "../models/userModel";
import mongoose from "mongoose";
import * as UserService from "../services/userService";
import Permission from "../helpers/permissions";
import emailService from "../services/emailService";
import { IBlog } from "../models/blogModel";

type ObjectId = mongoose.Types.ObjectId;

export const getUsersFromRoleID = async (role_id: ObjectId) => {
  const users = await User.find({ role: role_id });
  return users;
};

/**
 * Retrieves users based on their permissions.
 * @param permissions - An array of arrays of permissions. Each inner array represents a set of permissions required together.
 * @returns An array of users who have the required permissions.
 */
export const getUsersPermissionBased = async (permissions: Permission[][]) => {
  const users = await UserService.getAllUsers({});
  const allowed_users = users.filter((user) => {
    const allowed_perms: Set<Permission> = new Set();
    user.extra_permissions?.forEach((perm) => allowed_perms.add(perm));
    user.role_id?.permissions?.forEach((perm) => allowed_perms.add(perm));
    user.removed_permissions?.forEach((perm) => allowed_perms.delete(perm));
    return permissions.some((perm) => perm.every((p) => allowed_perms.has(p)));
  });
  return allowed_users;
};


// todo: maybe overload the role name to diff perm, but still send email to all users of that role
// this is quite redundant feature, so not implementing it right now
// export const getUsersFromRoleName = async (role: string) => {
//   const users = await UserService.getAllUsers({});
//   return users;
// };

export const blogForApprovalMail = async (blog: IBlog) => {
  getUsersPermissionBased([[Permission.PublishBlog]]).then((users) => {
    const emails = users.map((user) => user.email);
    const email_message = new emailService.StorySubmittedForApproval(blog);
    email_message.sendTo(emails);
  });
};