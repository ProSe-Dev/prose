const { dialog, ipcMain } = require("electron");
const fs = require("./helpers/fs");
const { resolve, basename } = require("path");
const filesHelper = require("./helpers/files");
const { selectDirAsync, selectFileAsync } = require("./helpers/dialog");
const Log = require("./helpers/log");
const { generateUUID } = require("./helpers/id");

const events = require("../src/shared/ipc-events");

const PROJECT_CONFIG_FOLDER_NAME = ".prose";

exports.bootstrap = function() {
  let projectList = {};
  projectList["123"] =
    "/home/gordon/Workspace/School/cpen-442/prose/client/test-projects/prose-test";

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
   * create a new prose project in the give path
   * @param {String} projectPath - path to project
   */
  function createProseProject(projectPath) {
    // create hidden directory to contain config files
    let configFolder = resolve(projectPath, PROJECT_CONFIG_FOLDER_NAME);
    if (!fs.existsSync(configFolder)) {
      fs.mkdirSync(configFolder);
    }

    // TODO: [a04a] should create config files in .prose
    // 1) project.json
    // 2) snapshots.json
    // can probably do this async

    // TODO: [3934] should grab files specified by the directory
    // maybe use fs.Dir?
    // https://nodejs.org/api/fs.html#fs_class_fs_dir

    // get all files in the directory
    // initially the status should all be changed? and all should be included in snapshot
    let files = filesHelper.getAllFilesInDirSync(projectPath).map(filename => ({
      filename,
      status: 0,
      ignore: false
    }));

    let project = {
      // use basename of the directory as name for now
      name: basename(projectPath),
      createdOn: new Date().toISOString(),
      snapshots: [],
      path: projectPath,
      files
    };
    return project;
  }

  ipcMain.handle(events.GET_EXISTING_PROJECTS, (event, args) => {
    return projectList;
  });

  ipcMain.handle(events.GET_PROJECT_INFO, async (event, args) => {
    Log.ipcLog(events.GET_PROJECT_INFO, args);
    let id = args[0];
    let path = projectList[id];
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

  ipcMain.handle(events.ADD_PROJECT, async (event, ...args) => {
    Log.ipcLog(events.ADD_PROJECT, args);
    let name = args[0];
    let contact = args[1];
    let path = args[2];
    let projectPath = resolve(__dirname, path);

    try {
      // return if folder is already a prose project
      if (await isProseProject(projectPath)) {
        console.log(events.ADD_PROJECT, "already a prose project");
        return;
      }

      // set up .prose folder
      let proseFolder = resolve(projectPath, PROJECT_CONFIG_FOLDER_NAME);
      await fs.mkdirAsync(proseFolder);

      // set up project config file
      let projectInfo = {
        name,
        contact,
        createdOn: new Date().toISOString()
      };
      await fs.writeFileAsync(
        resolve(proseFolder, "project.json"),
        JSON.stringify(projectInfo)
      );

      // TODO: should set up git here
    } catch (err) {
      console.log(err);
    }
  });
};
