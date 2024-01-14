import { User } from "../models/userModel";

export const createUser = async (user) => {
  const newUser = await User.create(user);
  return newUser;
};


export interface ICheckUser {
  email?: string;
  refreshToken?: string;
}

export const checkUserExists = async ({ email, refreshToken }: ICheckUser) => {
  if (email && refreshToken) {
    const user = await User.findOne({
      $or: [{ email: email }, { refreshToken: refreshToken }],
    });
    if (!user) return null;
    return user;
  }
  if (email) {
    const user = await User.findOne({ email: email });
    if (!user) return null;
    return user;
  }
  const user = await User.findOne({ refreshToken: refreshToken });
  if (!user) return null;
  return user;
};

export const addRefreshToken = async (email, refreshToken) => {
  const user = await User.findOneAndUpdate(
    { email: email },
    {
      $set: { refreshToken: refreshToken },
    },
    {
      returnDocument: "after",
    }
  );
  return user;
};

export const deleteRefreshToken = async (email) => {
  const user = await User.findOneAndUpdate(
    { email: email },
    {
      $set: { refreshToken: "" },
    },
    {
      returnDocument: "after",
    }
  );
  return user;
};

export const getAllUsers = async (query) => {
  const allUsers = await User.find(query);
  return allUsers;
};
