import mongoose, { Document, Schema } from "mongoose";
import Permission from "../helpers/permissions";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  refreshToken?: string;
  passwordResetToken?: string;
  role_id: mongoose.Schema.Types.ObjectId;
  extra_permissions?: Permission[];
  removed_permissions?: Permission[];
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
  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "role",
    // warn: default role from env
    default: new mongoose.Types.ObjectId(process.env.DEFAULT_ROLE_ID)
  },
  extra_permissions: {
    type: [Number],
    enum: Object.values(Permission),
  },
  removed_permissions: {
    type: [Number],
    enum: Object.values(Permission),
  }
});

const User = mongoose.model("user", userSchema);

export { User };
