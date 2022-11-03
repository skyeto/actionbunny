import * as core from "@actions/core";
import * as github from "@actions/github";
import fetch from "node-fetch";
import fs from "fs";
import { join } from "path";

const run = async () => {
  try {
    const source = join(process.env.GITHUB_WORKSPACE, core.getInput("source"));
    const apiKey = core.getInput("apiKey");
    const storageZone = core.getInput("storageZone");
    const storageEndpoint = core.getInput("storageEndpoint");
    const pullZone = core.getInput("pullZone");
    const shouldPurge = core.getInput("purge") == "true";
    const shouldClear = core.getInput("clear") == "true";


    if(shouldClear) {
      clear();
    }
    
    upload();

    if(pullZone && shouldPurge) {
      purge();
    }
  } catch(ex) {
    core.setFailed(ex);
  }
}

const upload = async (source, apiKey, storageZone, storageEndpoint) => { 
  core.info(`Uploading files to ${storageZone} from folder ${source}]`);

  const readStream = fs.createReadStream(source);
}

const clear = async () => { core.setFailed("Clearing is not yet implemented");  return; }
const purge = async () => { core.setFailed("Puring is not yet implemented"); return; }

run();

