import {
  linkSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  constants,
} from "node:fs";
import path from "path";
import os from "os";
import ora from "ora";
import chalk from "chalk";

const isMac = os.platform() === "darwin";

export function hardLinkSync(dir: string, targetDir: string) {
  try {
    const files = readdirSync(dir);
    return files.map((file) => {
      const filePath = path.join(dir, file);
      const targetPath = path.join(targetDir, file);
      const stat = lstatSync(filePath);
      if (stat.isDirectory()) {
        mkdirSync(targetPath, { recursive: true });
        hardLinkSync(filePath, targetPath);
      } else {
        // Create previous folders if they don't exist
        mkdirSync(path.dirname(targetPath), { recursive: true });
        if (!isMac) {
          try {
            linkSync(filePath, targetPath);
          } catch (e: any) {
            if (e.code === "EEXIST") return;
            if (e.code === "EXDEV")
              return copyFileSync(
                filePath,
                targetPath,
                constants.COPYFILE_FICLONE
              );
            ora(
              chalk.red(
                `Error: ${e.message} (file: ${filePath}, target: ${targetPath})`
              )
            ).fail();
          }
        } else {
          // Use clonefile on mac
          copyFileSync(filePath, targetPath, constants.COPYFILE_FICLONE);
        }
      }
    });
  } catch (e) {
    throw e;
  }
}
