const { dialog } = require('electron');

/**
 * open dialog that lets user selects a directory
 * @return String[] folder path selected by user | null if none is selected
 */
function selectDirSync() {
  let selectedPaths = dialog.showOpenDialogSync(null, {
    title: 'Select Project Folder',
    defaultPath: './',
    buttonLabel: 'Select',
    properties: ['openDirectory']
  });
  return selectedPaths ? selectedPaths[0] : null;
}

  /**
 * open dialog that lets user selects a directory
 * @return String[] folder path selected by user | null if none is selected
 */
function selectDirAsync() {
  return dialog.showOpenDialog(null, {
    title: 'Select Project Folder',
    defaultPath: './',
    buttonLabel: 'Select',
    properties: ['openDirectory']
  });
}

module.exports = {
  selectDirSync,
  selectDirAsync
};
