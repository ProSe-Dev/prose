const { ipcMain } = require("electron");
const Log = require("../helpers/log");
const events = require("../../src/shared/ipc-events");
const crypto = require("crypto");

ipcMain.handle(events.CREATE_KEY_PAIR, async (e, ...args) => {
  Log.ipcLog(events.CREATE_KEY_PAIR, args);
  let secret = args[0];
  let result = crypto.generateKeyPairSync("ed25519", {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "pem"
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
      cipher: "aes-256-cbc",
      passphrase: secret
    }
  });
  return result;
});
