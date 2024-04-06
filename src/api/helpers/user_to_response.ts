import { PopulatedUser } from "../models/userModel";
import MainWebsiteRole from "./mainWebsiteRole";
import Permission from "./permissions";

interface UserResponse {
  permission: Permission[];
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  team_role: MainWebsiteRole;
  role_id: string;
  created_at: Date;
  is_superuser: boolean;
}

export const user_to_response = (foundUser: PopulatedUser): UserResponse => {
  const allowed_perms: Set<Permission> = new Set();
  foundUser.extra_permissions?.forEach((perm) => allowed_perms.add(perm));
  foundUser.role_id?.permissions?.forEach((perm) => allowed_perms.add(perm));
  foundUser.removed_permissions?.forEach((perm) => allowed_perms.delete(perm));

  const data: UserResponse = {
    id: foundUser._id,
    name: foundUser.name,
    email: foundUser.email,
    bio: foundUser.bio,
    role: foundUser.role_id.name,
    role_id: foundUser.role_id._id,
    permission: [...allowed_perms],
    created_at: foundUser.date_joined,
    team_role: foundUser.team_role,
    is_superuser:
      foundUser.role_id?._id?.toString() === process.env.SUPERUSER_ROLE_ID,
  };

  return data;
};
