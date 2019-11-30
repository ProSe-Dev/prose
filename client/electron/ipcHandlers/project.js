const { ipcMain } = require("electron");
const { selectDirAsync, selectFileAsync } = require("../helpers/dialog");
const Log = require("../helpers/log");
const { generateUUID } = require("../helpers/id");
const events = require("../../src/shared/ipc-events");
const color = require("../../src/shared/color");
const s = require("../../src/shared/settings");
const { Project } = require("../models/Project");
const settings = require("electron-settings");
const projectList = settings.get(s.PROJECTS_LIST, []);
const projectIDMap = {};
const projectPathMap = {};
projectList.forEach(p => {
  projectIDMap[p.projectID] = p;
  projectPathMap[p.path] = p;
});

ipcMain.handle(events.GET_EXISTING_PROJECTS, (event, ...args) => {
  Log.ipcLog(events.GET_EXISTING_PROJECTS, args);
  Log.debugLog(JSON.stringify(projectList));
  return projectList;
});

ipcMain.handle(events.GET_PROJECT_INFO, async (event, ...args) => {
  Log.ipcLog(events.GET_PROJECT_INFO, args);
  let id = args[0];
  Log.debugLog("Result: " + JSON.stringify(projectIDMap[id]));
  return projectIDMap[id];
});

ipcMain.handle(events.DELETE_PROJECT, (event, ...args) => {
  Log.ipcLog(events.DELETE_PROJECT, args);
  let id = args[0];
  if (!projectIDMap.hasOwnProperty(id)) {
    return false;
  }
  let index = projectList.indexOf(projectIDMap[id]);
  if (index > -1) {
    projectList.splice(index, 1);
    delete projectPathMap[projectIDMap[id].path];
    delete projectIDMap[id];
  } else {
    return false;
  }
  return true;
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
  let path = args[1];
  let contact = args[2];
  let project = null;

  try {
    // return if folder is already a prose project
    if (projectPathMap.hasOwnProperty(path)) {
      return projectPathMap[path];
    }

    project = new Project(
      generateUUID(),
      name,
      contact,
      path,
      new Date(),
      color.randomColorClass()
    );

    projectList.push(project);
    projectIDMap[project.projectID] = project;
    projectPathMap[project.path] = project;
    settings.set(s.PROJECTS_LIST, projectList);
    Log.debugLog(JSON.stringify(projectIDMap));
    await project.initialize();
  } catch (err) {
    project = null;
    Log.debugLog(err);
  }

  Log.debugLog(JSON.stringify(project));
  return project;
});
