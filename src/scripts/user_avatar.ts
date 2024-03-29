import old_users from "./users.json";
import fs from "fs";
import connectDB from "../config/DatabaseConfig";
import { User } from "../api/models/userModel";
import "colors";
import old_media from "./media.json";
import { OldUserData } from "./users_from_oldDB";
import { OldMedia } from "./blogs_from_oldDB";

async function main() {
  await connectDB();
  const users = old_users as OldUserData[];
  const media = old_media.map((m) => ({
    ...m,
    model_id: Number(m.model_id),
  })) as OldMedia[];
  const users_db = await User.find({});

  const users_mapped = users.map((u) => {
    const user = users_db.find((u_db) => u_db.email === u.email);
    if (!user) {
      throw "User not found";
    }
    return {
      user: u,
      mongo_user: user,
    };
  });

  Promise.all(
    users_mapped.map(async (u) => {
      const avatar = media.find(
        (m) => m.model_id === u.user.id && m.model_type === "App\\User",
      );
      if (avatar) {
        fs.rename(
          `db/${avatar.id}/${avatar.file_name}`,
          `db/images/${u.mongo_user._id}`,
          (err) => {
            if (err) {
              console.error(err);
            }
          },
        );
      }
    }),
  )
    .then(() => console.log("Done"))
    .catch((e) => {
      console.error(e);
    })
    .finally(() => process.exit(0));
}

main();
