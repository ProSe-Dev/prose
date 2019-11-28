const { ipcMain } = require("electron");
const { URL } = require("url");
const hash = require("crypto").createHash("sha256");
const fetch = require("node-fetch");
const Log = require("../helpers/log");
const events = require("../../src/shared/ipc-events");
const fs = require("../helpers/fs");
const RELAY_URL = process.env.RELAY_URL
  ? process.env.RELAY_URL
  : "http://localhost:8080";

ipcMain.handle(events.SEARCH_FILE, async (e, ...args) => {
  Log.ipcLog(events.SEARCH_FILE, args);
  let filePath = args[0];
  let isRemote = args[1];
  let fileContent;
  // remote url! should handle with fetch
  if (isRemote) {
    Log.debugLog(events.SEARCH_FILE, "reading remote file: " + filePath);
    let fileUrl = new URL(filePath);
    // TODO: should get file content with fetch
    fileContent = "abcdefg";
  } else {
    Log.debugLog(events.SEARCH_FILE, "reading local file: " + filePath);
    fileContent = await fs.readFileAsync(filePath);
  }
  Log.debugLog(events.SEARCH_FILE, "file content: " + fileContent);
  hash.update(fileContent);
  let fileHash = hash.digest("hex");
  Log.debugLog(events.SEARCH_FILE, "computed hash: " + fileHash);
  let searchUrl = new URL("/search", RELAY_URL);
  searchUrl.search = `filehash=${fileHash}`;
  Log.debugLog(events.SEARCH_FILE, "request: " + searchUrl.toString());
  let result;
  res = await fetch(searchUrl.toString());
  if (res.status === 200) {
    result = await res.json();
    Log.debugLog(events.SEARCH_FILE, result);
  } else {
    Log.debugLog(events.SEARCH_FILE, res);
    throw new Error("Bad response");
  }
  return result;
});
