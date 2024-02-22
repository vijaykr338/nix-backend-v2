import mongoose, { Document, Schema } from "mongoose";
import Permission from "../helpers/permissions";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  refreshToken?: string;
  passwordResetToken?: string;
  passwordResetTokenExpires?: string;
  role_id: mongoose.Schema.Types.ObjectId;
  bio: string;
  extra_permissions?: Permission[];
  removed_permissions?: Permission[];
  date_joined: Date;
}

const userSchema = new Schema<IUser>({
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
    type: String
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetTokenExpires: {
    type: Date,
  },
  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "role",
    // warn: default role from env
    default: new mongoose.Types.ObjectId(process.env.DEFAULT_ROLE_ID)
  },
  extra_permissions: {
    type: [Number],
    enum: Object.values(Permission).filter(value => typeof value === "number"),
  },
  removed_permissions: {
    type: [Number],
    enum: Object.values(Permission).filter(value => typeof value === "number"),
  },
  date_joined: {
    type: Date,
  }
}, {
  timestamps: {
    createdAt: "date_joined",
    updatedAt: false,
  },
});

const User = mongoose.model("user", userSchema);

export { User };
