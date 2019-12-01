const { ipcMain } = require("electron");
const { URL } = require("url");
const crypto = require("crypto");
const fetch = require("node-fetch");
const Log = require("../helpers/log");
const events = require("../../src/shared/ipc-events");
const fs = require("../helpers/fs");
const s = require("../../src/shared/settings");
const settings = require("../settings");

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
  let hash = crypto.createHash("sha256");
  hash.update(fileContent);
  let fileHash = hash.digest("hex");
  Log.debugLog(events.SEARCH_FILE, "computed hash: " + fileHash);
  let relayUrl =
    settings.getVal(s.NAMESPACES.APP, s.KEYS.RELAY_HOST_ADDRESS) ||
    "http://localhost:8080";
  let searchUrl = new URL("/search", relayUrl);
  searchUrl.search = `filehash=${fileHash}`;
  Log.debugLog(events.SEARCH_FILE, "request: " + searchUrl.toString());
  let result;
  try {
    res = await fetch(searchUrl.toString());
  } catch (e) {
    throw e;
  }
  if (res.status === 200) {
    result = await res.json();
    resultsProcessed = [];
    let myPublicKey = await settings.getVal(
      s.NAMESPACES.APP,
      s.KEYS.MASTER_KEYS
    ).publicKey;
    for (const p of result) {
      let projectOrder = Number.MAX_SAFE_INTEGER;
      let isOwnedByMe = false;
      if (p.length === 0) {
        return;
      }
      isOwnedByMe = p[0].Data.PublicKey === myPublicKey;
      p.forEach((b, idx) => {
        if (b.Data.FileHashes.hasOwnProperty(fileHash)) {
          projectOrder = Math.min(projectOrder, Date.parse(b.Data.Timestamp));
          p[idx].IsContainingBlock = true;
        }
      });
      resultsProcessed.push({
        Order: projectOrder,
        IsOwnedByMe: isOwnedByMe,
        Data: p,
        ProjectID: p[0].Data.ProjectID,
        Signature: p[0].Data.Signature,
        PublicKey: p[0].Data.PublicKey
      });
    }
    resultsProcessed.sort((a, b) => {
      return a.Order - b.Order;
    });
    result = resultsProcessed;
    Log.debugLog(events.SEARCH_FILE, myPublicKey);
    Log.debugLog(events.SEARCH_FILE, resultsProcessed);
  } else {
    Log.debugLog(events.SEARCH_FILE, res);
    throw new Error("Bad response");
  }
  return result;
});
