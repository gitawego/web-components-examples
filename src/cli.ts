import * as program from "caporal";
import * as fs from "fs";
import * as path from "path";
import { downloadDeps } from "./dependencyDownloader";

export interface CliOptions {
  config: string;
}

function getConfig(file: string) {
  return JSON.parse(
    fs.readFileSync(file, {
      encoding: "utf8"
    })
  );
}

async function download(options: CliOptions) {
  const configPath = path.resolve(process.cwd(), options.config);
  const config = getConfig(configPath);
  await downloadDeps(config);
}

program
  .version("1.0.0")
  .description("cli to download webcomponent packages")
  .option("-c, --config <config>", "path to the config file", null, null, true)
  .action(async (args, options: any, logger) => {
    console.log(options);
    await download(options);
  });

program.parse(process.argv);
