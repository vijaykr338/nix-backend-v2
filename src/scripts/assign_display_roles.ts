import "colors";
import mongoose from "mongoose";
import MainWebsiteRole from "../api/helpers/mainWebsiteRole";
import { User } from "../api/models/userModel";
import connectDB from "../config/DatabaseConfig";

async function main() {
  await connectDB();
  // const roles = await Role.find({});
  // const roleMap = new Map<string, string>();
  // roles.forEach((role) => {
  //   roleMap.set(role._id, role.name);
  // });
  // console.log(roleMap);
  const map = {
    "6597db1d0d50d9a5fb67b995": MainWebsiteRole.DoNotDisplay,
    "65d772d279fbbf70a71949e1": MainWebsiteRole.DoNotDisplay,
    "65da26ddbb534f2dd10c8c4a": MainWebsiteRole.Coordinator,
    "65da2704bb534f2dd10c8c57": MainWebsiteRole.Columnist,
    "65da2f62bb534f2dd10c8c89": MainWebsiteRole.Developer,
    "66066f4ab226c3e5db8e647b": MainWebsiteRole.Designer,
    "66066febb226c3e5db8e648e": MainWebsiteRole.Illustrator,
    "6606701ab226c3e5db8e6495": MainWebsiteRole.Alumni,
    "6606703fb226c3e5db8e64a5": MainWebsiteRole.Photographer,
    "66067079b226c3e5db8e64ac": MainWebsiteRole.Coordinator,
  };
  for (const key in map) {
    const value = map[key];
    console.log(`Key: ${key}, Value: ${value}`);
    User.updateMany(
      { role_id: new mongoose.Types.ObjectId(key) },
      { team_role: value },
    )
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

main();
