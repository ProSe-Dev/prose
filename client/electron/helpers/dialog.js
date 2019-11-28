const { dialog } = require("electron");

/**
 * open dialog that lets user select a directory
 * @return String[] folder path selected by user | null if none is selected
 */
function selectDirSync() {
  let selectedPaths = dialog.showOpenDialogSync(null, {
    title: "Select Project Folder",
    defaultPath: "./",
    buttonLabel: "Select",
    properties: ["openDirectory", "showHiddenFiles"]
  });
  return selectedPaths ? selectedPaths[0] : null;
}

/**
 * open dialog that lets user select a directory
 * @return String[] folder path selected by user | null if none is selected
 */
function selectDirAsync() {
  return dialog.showOpenDialog(null, {
    title: "Select Project Folder",
    defaultPath: "./",
    buttonLabel: "Select",
    properties: ["openDirectory", "showHiddenFiles"]
  });
}

/**
 * open dialog that lets user select a file
 * @return String[] file path selected by user | null if none is selected
 */
function selectFileSync() {
  let selectedPaths = dialog.showOpenDialogSync(null, {
    title: "Select File",
    defaultPath: "./",
    buttonLabel: "Select",
    properties: ["openFile", "showHiddenFiles"]
  });
  return selectedPaths ? selectedPaths[0] : null;
}

/**
 * open dialog that lets user select a file
 * @return String[] file path selected by user | null if none is selected
 */
function selectFileAsync() {
  return dialog.showOpenDialog(null, {
    title: "Select File",
    defaultPath: "./",
    buttonLabel: "Select",
    properties: ["openFile", "showHiddenFiles"]
  });
}

module.exports = {
  selectDirSync,
  selectDirAsync,
  selectFileSync,
  selectFileAsync
};
