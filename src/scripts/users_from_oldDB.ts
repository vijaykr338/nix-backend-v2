import { IUser, User } from "../api/models/userModel";
import connectDB from "../config/DatabaseConfig";
import users from "./users.json";
import bcrypt from "bcrypt";
import "colors";

export interface OldUserData {
  id: number;
  name: string;
  uuid: string;
  email: string;
  username: string;
  activated: number;
  bio: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  display_mail: string;
  medium: string;
  password: string;
  remember_token: string;
  created_at: string;
  updated_at: string;
  blocked: number;
  show: number;
  position: string;
}

const old_users = users as OldUserData[];

const positions = new Set(old_users.map((user) => user.position));
console.log(positions);

const role_map = {
  council: "65da26ddbb534f2dd10c8c4a",
  columnist: "65da2704bb534f2dd10c8c57",
  designer: "66066f4ab226c3e5db8e647b",
  illustrator: "66066febb226c3e5db8e648e",
  alumni: "6606701ab226c3e5db8e6495",
  photographer: "6606703fb226c3e5db8e64a5",
  developer: "65da2f62bb534f2dd10c8c89",
  "society-head": "66067079b226c3e5db8e64ac",
};
Promise.all([
  connectDB(),
  ...old_users.map(async (old_user) => {
    const password = old_user.email.split("@")[0];
    const hashed_password = await bcrypt.hash(password, 10);

    const new_user = {
      name: old_user.name,
      email: old_user.email,
      password: hashed_password,
      role_id: role_map[old_user.position],
      bio: old_user.bio,
      date_joined: new Date(old_user.created_at),
      show: old_user.show === 1,
    } as IUser;
    return new_user;
  }),
]).then((new_users) => {
  console.log(new_users);
  // create(new_users);
});

function create(users: IUser[]) {
  User.insertMany(users, {
    ordered: false,
  })
    .then(() => {
      console.log("Users added successfully");
    })
    .catch((err) => {
      console.log(err);
    });
}
