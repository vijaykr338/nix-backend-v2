import { User } from "../models/userModel";

export const createUser = async (user) => {
  const newUser = await User.create(user);
  return newUser;
};

export const checkUserExists = async (email = "randomTextNotInDB", refreshToken = "randomTextNotInDB") => {
  const user = await User.find({
    $or: [{ email: email }, { refreshToken: refreshToken }],
  });
  if (user.length === 0) return null;
  return user[0];
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
