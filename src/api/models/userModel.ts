import mongoose, { HydratedDocument, Schema, Types } from "mongoose";
import MainWebsiteRole from "../helpers/mainWebsiteRole";
import Permission from "../helpers/permissions";
import { IRole } from "./rolesModel";

export interface IUser {
  name: string;
  email: string;
  password: string;
  refreshToken?: string;
  passwordResetToken?: string;
  role_id: Types.ObjectId;
  bio: string;
  extra_permissions?: Permission[];
  removed_permissions?: Permission[];
  date_joined: Date;
  team_role: MainWebsiteRole;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
    },
    bio: {
      type: String,
      default: "error 404: bio not found :)",
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
    },
    refreshToken: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "role",
      // warn: default role from env
      default: new mongoose.Types.ObjectId(process.env.DEFAULT_ROLE_ID),
    },
    extra_permissions: {
      type: [Number],
      enum: Object.values(Permission).filter(
        (value) => typeof value === "number",
      ),
    },

    removed_permissions: {
      type: [Number],
      enum: Object.values(Permission).filter(
        (value) => typeof value === "number",
      ),
    },
    date_joined: {
      type: Date,
    },
    team_role: {
      type: Number,
      enum: MainWebsiteRole,
      default: MainWebsiteRole.DoNotDisplay,
    },
  },
  {
    timestamps: {
      createdAt: "date_joined",
      updatedAt: false,
    },
  },
);

const User = mongoose.model<IUser>("user", userSchema);
type PopulatedUser = mongoose.Document<
  unknown,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  mongoose.MergeType<
    IUser,
    {
      role_id: HydratedDocument<IRole>;
    }
  >
> &
  Omit<IUser, "role_id"> & {
    role_id: HydratedDocument<IRole>;
  } & {
    _id: Types.ObjectId;
  };

export { PopulatedUser, User };
