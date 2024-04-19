import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const makeAccessToken = (
  email: string,
  user_id: mongoose.Schema.Types.ObjectId,
) => {
  const access_secret_key = process.env.ACCESS_SECRET_KEY;
  if (!access_secret_key) {
    throw Error("Access secret key not found in env");
  }
  return jwt.sign({ email, user_id }, access_secret_key, {
    expiresIn: "2m",
  });
};

export const makeRefreshToken = (
  email: string,
  user_id: mongoose.Schema.Types.ObjectId,
) => {
  const refresh_secret_key = process.env.REFRESH_SECRET_KEY;
  if (!refresh_secret_key) {
    throw Error("Refresh secret key not found in env");
  }
  return jwt.sign({ email, user_id }, refresh_secret_key, {
    expiresIn: "4d",
  });
};
