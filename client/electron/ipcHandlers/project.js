const { ipcMain } = require("electron");
const { resolve, basename } = require("path");
const settings = require('../settings');
const fs = require("../helpers/fs");
const filesHelper = require("../helpers/files");
const { selectDirAsync, selectFileAsync } = require("../helpers/dialog");
const Log = require("../helpers/log");
const events = require("../../src/shared/ipc-events");
const { generateUUID } = require('../helpers/id');

const PROJECT_CONFIG_FOLDER_NAME = ".prose";
const PROJECT_SETTINGS_NAMESPACE = 'projects';
const __projects = settings.get(PROJECT_SETTINGS_NAMESPACE);

/**
  * checks if a directory is already a prose project
  * @param projectPath - absolute path to the project folder
  * @return boolean
  */
function isProseProject(projectPath) {
  let configFolder = resolve(projectPath, PROJECT_CONFIG_FOLDER_NAME);
  return fs.existsAsync(configFolder);
}

/**
 * get the existing prose projects 
 */
ipcMain.handle(events.GET_EXISTING_PROJECTS, (event, args) => {
  return Object.keys(__projects).map(k => __projects[k]);
});

/**
 * get the files and certificate info of the project
 * args[0] - id of the project
 */
ipcMain.handle(events.GET_PROJECT_INFO, async (event, args) => {
  Log.ipcLog(events.GET_PROJECT_INFO, args);
  let id = args[0];
  let path = __projects[id].path;
  let projectInfo = {};

  if (!path) {
    return null;
  }

  projectInfo.files = await filesHelper.getAllFilesInDirAsync(path);
  let snapshotsRaw = await fs.readFileAsync(
    resolve(path, ".prose", "snapshots.json")
  );
  projectInfo.snapshots = JSON.parse(snapshotsRaw);

  Log.debugLog(events.GET_PROJECT_INFO, projectInfo.files);
  Log.debugLog(events.GET_PROJECT_INFO, projectInfo.snapshots);

  return projectInfo;
});

/**
 * prompts user to select a folder with open dialog
 * @returns {Promise<String>} promise resolves folder path
 */
ipcMain.handle(events.SELECT_FOLDER, async (event, ...args) => {
  Log.ipcLog(events.SELECT_FOLDER, args);
  let result = await selectDirAsync();
  if (result.canceled) {
    Log.ipcLog(events.SELECT_FOLDER, "canceled");
    return null;
  } else {
    Log.ipcLog(events.SELECT_FOLDER, result);
    return result.filePaths[0];
  }
});

/**
 * prompts user to select a file with open dialog
 * @returns {Promise<String>} promise resolves file path
 */
ipcMain.handle(events.SELECT_FILE, async (event, ...args) => {
  Log.ipcLog(events.SELECT_FILE, args);
  let result = await selectFileAsync();
  if (result.canceled) {
    Log.ipcLog(events.SELECT_FILE, "canceled");
    return null;
  } else {
    Log.ipcLog(events.SELECT_FILE, result);
    return result.filePaths[0];
  }
});

/**
 * convert a given directory into a ProSe project! yay how fun
 * args[0] - name of project
 * args[1] - author contact info
 * args[2] - absolute path to project
 */
ipcMain.handle(events.ADD_PROJECT, async (event, ...args) => {
  Log.ipcLog(events.ADD_PROJECT, args);
  let name = args[0];
  let contact = args[1];
  let path = args[2];
  let projectPath = resolve(__dirname, path);

  try {
    // return if folder is already a prose project
    // if (await isProseProject(projectPath)) {
    //   console.log(events.ADD_PROJECT, "already a prose project");
    //   return;
    // }

    // set up .prose folder
    let proseFolder = resolve(projectPath, PROJECT_CONFIG_FOLDER_NAME);
    await fs.mkdirAsync(proseFolder);

    // set up project config file
    let project = {
      projectId: generateUUID(),
      projectName: name,
      projectPath,
      authorContact: contact,
      createdOn: new Date().toISOString()
    };
    await fs.writeFileAsync(
      resolve(proseFolder, "project.json"),
      JSON.stringify(project)
    );

    Log.debugLog(events.ADD_PROJECT, 'project: ' + JSON.stringify(project));

    settings.add(PROJECT_SETTINGS_NAMESPACE, project.projectId, project);
    // TODO: should set up git here
    return project;
  } catch (err) {
    console.log(err);
  }
});
