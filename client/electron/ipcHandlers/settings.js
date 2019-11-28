const { ipcMain } = require("electron");
const settings = require("electron-settings");
const Log = require("../helpers/log");
const events = require("../../src/shared/ipc-events");

ipcMain.handle(events.SETTINGS_SET, async (e, ...args) => {
  Log.ipcLog(events.SETTINGS_SET, args);
  return settings.set(...args);
});

ipcMain.handle(events.SETTINGS_GET, async (e, ...args) => {
  Log.ipcLog(events.SETTINGS_GET, args);
  return settings.get(...args);
});

ipcMain.handle(events.SETTINGS_HAS, async (e, ...args) => {
  Log.ipcLog(events.SETTINGS_HAS, args);
  return settings.has(...args);
});
