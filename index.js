import * as core from "@actions/core";
import * as github from "@actions/github";
import fetch from "node-fetch";
import fs from "fs";
import { join } from "path";

const run = async () => {
  try {
    const source = join(process.env.GITHUB_WORKSPACE, core.getInput("source"));
    const apiKey = core.getInput("apiKey");
    const storageKey = core.getInput("storageKey");
    const storageZone = core.getInput("storageZone");
    const storageEndpoint = core.getInput("storageEndpoint");
    const pullZone = core.getInput("pullZone");
    const shouldPurge = core.getInput("purge") == "true";
    const shouldClear = core.getInput("clear") == "true";


    if(shouldClear) {
      clear();
    }
    
    upload(source, storageKey, storageZone, storageEndpoint);

    if(pullZone && shouldPurge) {
      purge();
    }
  } catch(ex) {
    core.setFailed(ex);
  }
}

const getFiles = async (dir, storageKey, storageZone, storageEndpoint) => {
  const res = await fetch(
    `https://${storageEndpoint}/${storageZone}/${dir}`,
    {
      method: "GET",
      headers: {
        AccessKey: storageKey
      }
    }
  );

  let results = [];
  for(const i of await res.json()) {
    if(i["IsDirectory"] == true) {
      const dirFiles = await getFiles(`${dir}/${i["ObjectName"]}`, storageKey, storageZone, storageEndpoint);
      results.push({dir: true, files: dirFiles});
    } else {
      results.push({dir: false, filename: i["ObjectName"], checksum: i["Checksum"]});
    }
  }
}

// Note: This is checking folders recursively.
const upload = async (source, storageKey, storageZone, storageEndpoint) => { 
  core.info(`Uploading files to ${storageZone} from folder ${source}]`);

  const readStream = fs.createReadStream(source);

  let serverTree = await getFiles("", storageKey, storageZone, storageEndpoint);
  core.info(serverTree);
}

const clear = async () => { core.setFailed("Clearing is not yet implemented");  return; }
const purge = async () => { core.setFailed("Puring is not yet implemented"); return; }

run();

