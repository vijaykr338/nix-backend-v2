import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  refreshToken?: string;
  role_id: Number;
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
  role_id: {
    type: Number,
    default: 0 // 0 would mean columninst
  }
});

const User = mongoose.model("user", userSchema);

export { User };
