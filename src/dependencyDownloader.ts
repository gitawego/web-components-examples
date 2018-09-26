import * as debug from "debug";
import * as download from "download";
import * as fs from "fs";
import * as path from "path";
import * as shelljs from "shelljs";
import * as url from "url";

const logger = debug("depDownloader");

export interface Config {
  repository: string;
  dependencies: Dependencies;
  targetFolder: string;
}

export interface Dependencies {
  [name: string]: string;
}

const cwd = process.cwd();
const TMP_PATH = path.resolve(process.cwd(), "tmp");

export function getTargetDirectory(targetFolder: string) {
  return path.resolve(cwd, targetFolder);
}

export async function downloadDeps(config: Config, tmpPath: string = TMP_PATH) {
  shelljs.mkdir("-p", tmpPath);
  const targetFolder = getTargetDirectory(config.targetFolder);
  shelljs.mkdir("-p", targetFolder);
  const files = fs.readdirSync(targetFolder);
  logger("local folder", files);
  const toBeDeleted: string[] = [];
  const ignored: string[] = [];
  for (const file of files) {
    const version = config.dependencies[file];
    const filePath = path.resolve(targetFolder, file);
    if (!version) {
      toBeDeleted.push(filePath);
      continue;
    }
    const state = fs.statSync(filePath);
    if (!state.isDirectory) {
      logger(`${filePath} is not a directory, ignore`);
      continue;
    }
    const manifest = getManifest(filePath);
    if (!manifest) {
      logger(`no manifest.json in ${filePath}, remove folder`);
      shelljs.rm("-rf", filePath);
      continue;
    }
    if (manifest.version === version) {
      ignored.push(file);
    }
  }
  await downloadWC(config, ignored, tmpPath);
  logger("all deps are downloaded, removing unused deps", toBeDeleted);
  for (const rmFile of toBeDeleted) {
    shelljs.rm("-rf", rmFile);
  }
  // TODO: download files, delete old filesgit
}

export function getManifest(folder: string) {
  try {
    const manifestPath = path.resolve(folder, "manifest.json");
    return JSON.parse(
      fs.readFileSync(manifestPath, {
        encoding: "utf8"
      })
    );
  } catch (err) {
    return null;
  }
}

export async function downloadWC(
  config: Config,
  ignored: string[] = [],
  tmpPath: string
) {
  const wcFiles = Object.keys(config.dependencies);
  const targetDir = getTargetDirectory(config.targetFolder);
  logger("file to download", wcFiles, ignored);
  for (const wcFile of wcFiles) {
    if (ignored.indexOf(wcFile) > -1) {
      continue;
    }
    const targetUrl = getUrl(wcFile, config);
    const tmpDest = path.resolve(tmpPath, `./${wcFile}`);
    shelljs.rm("-rf", tmpDest);
    logger("download url", targetUrl);
    await download(targetUrl, tmpPath, { extract: true });
    shelljs.mv(tmpDest, targetDir);
  }
}

export function getUrl(id: string, config: Config) {
  return url.resolve(
    config.repository,
    `${id}/${id}.v${config.dependencies[id]}.zip`
  );
}
