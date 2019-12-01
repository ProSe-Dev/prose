const { ipcMain } = require("electron");
const settings = require("../settings");
const Log = require("../helpers/log");
const events = require("../../src/shared/ipc-events");

ipcMain.handle(events.SETTINGS_SET, async (e, ...args) => {
  Log.ipcLog(events.SETTINGS_SET, args);
  let namespace = args[0];
  let key = args[1];
  let value = args[2];
  return settings.set(namespace, key, value);
});

ipcMain.handle(events.SETTINGS_GET, async (e, ...args) => {
  Log.ipcLog(events.SETTINGS_GET, args);
  let namespace = args[0];
  let key = args[1];
  return settings.getVal(namespace, key);
});
