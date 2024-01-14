import mongoose from "mongoose";
import { IRole } from "../models/rolesModel";
import { User } from "../models/userModel";
import bcrypt from "bcrypt";
import generateRandomPassword from "../helpers/randomPassword";

export const createUser = async (user) => {
  const newUser = await (await User.create(user)).populate<{ role_id: IRole }>("role_id");
  return newUser;
};


export interface ICheckUser {
  _id?: mongoose.Types.ObjectId;
  email?: string;
  refreshToken?: string;
}

export const checkUserExists = async ({ email, refreshToken, _id }: ICheckUser) => {
  const bypass = "bypass";
  const user = await User.findOne(
    {
      $or: [
        { _id: _id ? _id : bypass },
        { email: email ? email : bypass },
        { refreshToken: refreshToken ? refreshToken : bypass }
      ]
    }).populate<{ role_id: IRole }>("role_id");
  if (user) return user;
  return null;
};

export const addRefreshToken = async (email, refreshToken) => {
  const user = await User.findOneAndUpdate(
    { email: email },
    { refreshToken: refreshToken },
    { returnDocument: "after" }
  ).populate<{ role_id: IRole }>("role_id");
  return user;
};

export const deleteRefreshToken = async (email) => {
  const user = await User.findOneAndUpdate(
    { email: email },
    { refreshToken: null },
    { returnDocument: "after" }
  ).populate<{ role_id: IRole }>("role_id");
  return user;
};

export const getAllUsers = async (query) => {
  const allUsers = await User.find(query).populate<{ role_id: IRole }>("role_id");
  return allUsers;
};

export const resetUserPassword = async (token: string) => {
  const password: string = generateRandomPassword(7);
  const hashed_password: string = await bcrypt.hash(password, 10);

  const user = await User.findOneAndUpdate(
    { passwordResetToken: token },
    {
      passwordResetToken: undefined,
      password: hashed_password
    },
  ).populate<{ role_id: IRole }>("role_id");
  if (!user) return null;
  return user;
};