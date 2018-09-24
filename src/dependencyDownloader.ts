import * as download from "download";
import * as fs from "fs";
import * as path from "path";
import * as shelljs from "shelljs";

export interface Config {
  repository: string;
  dependencies: Dependencies;
  targetFolder: string;
}

export interface Dependencies {
  [name: string]: string;
}

const cwd = process.cwd();

export function downloadDeps(config: Config) {
  const targetFolder = path.resolve(cwd, config.targetFolder);
  shelljs.mkdir("-p", targetFolder);
  const files = fs.readdirSync(targetFolder);
  const ignore: string[] = [];
  const toBeDeleted: string[] = [];
  files.forEach(file => {
    const version = config.dependencies[file];
    const filePath = path.resolve(targetFolder, file);
    if (!version) {
      toBeDeleted.push(filePath);
      return;
    }
    const state = fs.statSync(filePath);
    if (!state.isDirectory) {
      return;
    }
    const manifestPath = path.resolve(filePath, "manifest.json");
    const manifest = JSON.parse(
      fs.readFileSync(manifestPath, {
        encoding: "utf8"
      })
    );
    if (manifest.version === version) {
      ignore.push(file);
    }
  });
  // TODO: download files, delete old files
}
