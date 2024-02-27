import mongoose from "mongoose";
import { IRole } from "../models/rolesModel";
import { User } from "../models/userModel";
import bcrypt from "bcrypt";
import generateRandomPassword from "../helpers/randomPassword";
import RegisterationMail from "./emails/registeration";


export interface ICheckUser {
  _id?: mongoose.Types.ObjectId;
  email?: string;
  refreshToken?: string;
}

export const checkUserExists = async ({ email, refreshToken, _id }: ICheckUser) => {
  // replaced $or as it was creating confusion
  // this impl should also be as effective as $or operation
  if (_id) {
    const user = await User.findOne({ _id: _id }).populate<{ role_id: IRole }>("role_id");
    return user;
  }
  if (email) {
    const user = await User.findOne({ email: email }).populate<{ role_id: IRole }>("role_id");
    return user;
  }
  if (refreshToken) {
    const user = await User.findOne({ refreshToken: refreshToken }).populate<{ role_id: IRole }>("role_id");
    return user;
  }
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

export const createNewUser = async (name: string, email: string) => {
  const password: string = generateRandomPassword(7);
  const hashed_password: string = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: name,
    email: email,
    password: hashed_password,
  });

  const reg_mail = new RegisterationMail(user, password);
  await reg_mail.sendTo(email);
  if (!reg_mail) return null;

  return user;
};
