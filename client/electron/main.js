const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const url = require("url");
const ipcHandlers = require("./ipcHandlers");
const settings = require("./settings");
const s = require("../src/shared/settings");
const keygen = require("./helpers/keygen");
const fs = require("./helpers/fs");
const { resolve } = require("path");
const os = require("os");
const Log = require('./helpers/log');
const APP_CONFIG_FOLDER = ".prose";
const PRIVATE_KEY_FILE = "id_ed25519";
const PUBLIC_KEY_FILE = "id_ed25519.pub";
const inProduction = !process.env.DEVELOPMENT;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // by default use URL set in environment
  // or else must be packaging, use load React's build path
  let startUrl;
  if (inProduction) {
    Log.debugLog('production!, loading from index');
    startUrl = url.format({
      pathname: path.join(__dirname, "../index.html"),
      protocol: "file:",
      slashes: true
    });
  } else {
    Log.debugLog('starting development....');
    startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
    // Open the DevTools.
    win.webContents.openDevTools();
  }

  // and load the index.html of the app.
  win.loadURL(startUrl);

  // Emitted when the window is closed.
  win.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

function getKeys() {
  Log.debugLog("getKeys", "Getting keys...");
  let keyPair = settings.getVal(s.NAMESPACES.APP, s.KEYS.MASTER_KEYS);
  if (!keyPair) {
    keyPair = keygen.createKeyPair();
    Log.debugLog("getKeys", "Generated keypair: ", keyPair);
    settings.set(s.NAMESPACES.APP, s.KEYS.MASTER_KEYS, keyPair);

    Log.debugLog("getKeys",
      "Writing private key to: ",
      resolve(os.homedir(), APP_CONFIG_FOLDER)
    );
    fs.mkdirSync(resolve(os.homedir(), APP_CONFIG_FOLDER), { recursive: true });
    fs.writeFileSync(
      resolve(os.homedir(), APP_CONFIG_FOLDER, PRIVATE_KEY_FILE),
      keyPair.privateKey
    );
    fs.writeFileSync(
      resolve(os.homedir(), APP_CONFIG_FOLDER, PUBLIC_KEY_FILE),
      keyPair.publicKey
    );

    // TODO: write public key to projects config
  }
}

async function relayBootstrap() {
  // if relay host address hasn't been set yet, we should!
  if (!settings.getVal(s.NAMESPACES.APP, s.KEYS.RELAY_HOST_ADDRESS)) {
    let relayAddress = await require('./helpers/relay').getAddress();
    settings.set(s.NAMESPACES.APP,
      s.KEYS.RELAY_HOST_ADDRESS,
      relayAddress);
  }
}

async function onReady() {
  createWindow();
  settings.start();
  ipcHandlers.bootstrap();
  getKeys();
  await relayBootstrap();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", onReady);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("quit", () => {
  settings.end();
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.Copy
