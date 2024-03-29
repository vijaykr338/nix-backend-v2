import { exec } from "child_process";

// const child = exec("sudo apt install poppler-utils -y");
// child.stdout?.pipe(process.stdout);
// child.stderr?.pipe(process.stderr);

import fs from "fs";
import path from "path";

const directoryPath = path.join(__dirname, "editions");

fs.mkdirSync("src/scripts/edition_images", { recursive: true });
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.error("Unable to scan directory: " + err);
  }

  files.forEach((file) => {
    const ed_id = Number(file.split(".")[0].split("Edition")[1].trim());
    exec(
      `pdftoppm -png "src/scripts/editions/${file}" src/scripts/edition_images/edition-${ed_id} -f 1 -l 1`,
    ).on("exit", (code) => {
      if (code === 0) {
        fs.rename(
          `src/scripts/edition_images/edition-${ed_id}-01.png`,
          `src/scripts/edition_images/edition-${ed_id}`,
          (err) => {
            if (err) {
              console.error("Error renaming file", err);
            } else {
              console.log(`Edition ${ed_id} converted to PNG successfully`);
            }
          },
        );
      } else {
        console.error(`Error converting edition ${ed_id}`);
      }
    });
  });
});
