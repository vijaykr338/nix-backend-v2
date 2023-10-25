import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = Schema({
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
  refreshToken:{
    type: String
  }
});

const User = mongoose.model("user", userSchema);

export { User };
