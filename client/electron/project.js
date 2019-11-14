const { dialog, ipcMain } = require('electron');

const SYNC_CREATE_PROJECT_CH = 'sync-create-project';
const ASYNC_CREATE_PROJECT_CH = 'async-create-project';


function selectDir() {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
}

// TODO: should creating project be sync. or async. ?
// sync: easier to handle on the GUI
// async: better UX / performance cuz GUI can be preloaded during wait 
ipcMain.on(ASYNC_CREATE_PROJECT_CH, (event, arg) => {
  console.log(event, arg);
  // TODO: do create project work here
  let projectInfo = {
    name: 'VPN',
    files: {},
    certificate: null
  };
  setTimeout(5000, () => {
    // send a async reply back to RP
    event.reply(SYNC_CREATE_PROJECT_CH, projectInfo);
  });
});

ipcMain.on(SYNC_CREATE_PROJECT_CH, (event, arg) => {
  console.log(event, arg);
  // TODO: do create project work here
  let projectInfo = {
    name: 'VPN',
    files: {},
    certificate: null
  };

  setTimeout(5000, () => {
    // store result so RP can proceed
    event.returnValue = projectInfo;
  });
});
