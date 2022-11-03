import * as core from "@actions/core";
import * as github from "@actions/github";
import fetch from "node-fetch";
import fs from "fs";
import * as asyncfs from "node:fs/promises";
import { join } from "path";
import * as crypto from "crypto";

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
  let res = await fetch(
    `https://${storageEndpoint}/${storageZone}/${dir}`,
    {
      method: "GET",
      headers: {
        AccessKey: storageKey
      }
    }
  );
  res = await res.json();

  let results = [];
  core.debug(`In directory ${dir}`);
  for(let a = 0; a < res.length; a++) {
    let i = res[a];
    if(i["IsDirectory"] == true) {
      core.debug(`Found directory ${i["ObjectName"]}`);

      const dirFiles = await getFiles(`${dir}/${i["ObjectName"]}/`, storageKey, storageZone, storageEndpoint);
      results.push({dir: true, name: i["ObjectName"], files: dirFiles});
    } else {
      core.debug(`Found file ${i["ObjectName"]} with checksum "${i["Checksum"]}"`);
      results.push({dir: false, name: i["ObjectName"], checksum: i["Checksum"]});
    }
  }
  return results;
}

const getLocalFiles = async (dir) => {
  let f = await asyncfs.readdir(dir, { withFileTypes: true });

  let results = [];
  core.debug(`In local directory ${dir}`);
  for(let i = 0; i < f.length; i++) {
    let node = f[i];

    if(node.isDirectory()) {
      core.debug(`Found local directory ${node.name}`);
      let files = await getLocalFiles(`${dir}/${node.name}`);
      results.push({dir: true, name: node.name, files: files});
    } else if(node.isFile()) {
      const buf = fs.readFileSync(`${dir}/${node.name}`);
      const c = crypto.createHash("sha256").update(buf).digest("hex").toUpperCase();

      core.debug(`Found local file ${node.name} with checksum "${c}"`);

      results.push({dir: false, name: node.name, checksum: c});
    } else {
      core.info(`Non-regular file found: ${node.name}`);
    }
  }
  return results;
}

const upload_ = async (src, path, server, local, storageKey, storageZone, storageEndpoint) => {
  for (let i = 0; i < local.length; i++) {
    let localNode = local[i];

    if(localNode.dir == true) {
      let serverNode;
      for(let j = 0; j < server.length; j++) {
        if(server[j].name == localNode.name) {
          serverNode = server[j];
          break;
        }
      }

      if(serverNode && serverNode.dir) {
        upload_(src, `${path}/${localNode.name}`, serverNode.files, localNode.files, storageKey, storageZone, storageEndpoint);
      } else {
        upload_(src, `${path}/${localNode.name}`, [], localNode.files, storageKey, storageZone, storageEndpoint);
      }
    } else {
      // This is a file!
      let serverNode;
      for(let j = 0; j < server.length; j++) {
        if(server[j].name == localNode) {
          serverNode = server[j];
          break;
        }
      }

      if(serverNode && serverNode.checksum == localNode.checksum) {
        core.info(`File ${localNode.name} has not changed`);
      } else {
        core.info(`File ${localNode.name} has changed, uploading!`);

        const stream = fs.createReadStream(`${src}/${path}/${localNode.name}`);
        const res = await fetch(
          `https://${storageEndpoint}/${storageZone}/${path}`,
          {
            method: "PUT",
            headers: {
              AccessKey: storageKey
            },
            body: stream
          }
        );

        if(res.status == 201) {
          core.info(`Successfully uploaded ${localNode.name}`);
        } else {
          throw new Error(`Failed to upload ${localNode.name}`);
        }
      }
    }
  }
}

// Note: This is checking folders recursively.
const upload = async (source, storageKey, storageZone, storageEndpoint) => { 
  core.info(`Uploading files to ${storageZone} from folder ${source}]`);

  const readStream = fs.createReadStream(source);

  let serverTree = await getFiles("", storageKey, storageZone, storageEndpoint);
  let localTree = await getLocalFiles(source);

  core.info(JSON.stringify(serverTree));
  core.info(JSON.stringify(localTree));

  upload_(source, "", serverTree, localTree, storageKey, storageZone, storageEndpoint);
}

const clear = async () => { core.setFailed("Clearing is not yet implemented");  return; }
const purge = async () => { core.setFailed("Puring is not yet implemented"); return; }

run();

