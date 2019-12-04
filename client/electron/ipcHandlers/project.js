const { ipcMain } = require("electron");
const { selectDirAsync, selectFileAsync } = require("../helpers/dialog");
const Log = require("../helpers/log");
const git = require("../helpers/git");
const { generateUUID } = require("../helpers/id");
const events = require("../../src/shared/ipc-events");
const color = require("../../src/shared/color");
const s = require("../../src/shared/settings");
const { Project } = require("../models/Project");
const settings = require("../settings");
let loadedProjects =
  settings.getVal(s.NAMESPACES.PROJECT, s.KEYS.PROJECTS_LIST) || [];
const projectList = loadedProjects.map(
  p =>
    new Project(
      p.projectID,
      p.name,
      p.contact,
      p.path,
      p.creationDate,
      p.colorClass,
      p.isSynced,
      p.excludedFiles,
      p.snapshots,
      p.files
    )
);
Log.debugLog("INITIAL PROJECTS: " + JSON.stringify(projectList));
const projectIDMap = {};
const projectPathMap = {};
projectList.forEach(p => {
  projectIDMap[p.projectID] = p;
  projectPathMap[p.path] = p;
});

ipcMain.handle(events.GET_EXISTING_PROJECTS, (event, ...args) => {
  Log.ipcLog(events.GET_EXISTING_PROJECTS, args);
  Log.debugLog(events.GET_EXISTING_PROJECTS, 'existing projects:', JSON.stringify(projectList));
  return projectList;
});

ipcMain.handle(events.GET_PROJECT_INFO, async (event, ...args) => {
  //Log.ipcLog(events.GET_PROJECT_INFO, args);
  let id = args[0];
  //Log.debugLog("Result: " + JSON.stringify(projectIDMap[id]));
  return projectIDMap[id];
});

ipcMain.handle(events.PROJECT_DELETE, (event, ...args) => {
  Log.ipcLog(events.PROJECT_DELETE, args);
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
    projectIDMap[project.projectID] = project;
    projectPathMap[project.path] = project;
    settings.set(s.NAMESPACES.PROJECT, s.KEYS.PROJECTS_LIST, projectList);
    Log.debugLog(JSON.stringify(projectIDMap));
    await project.initialize();
    projectList.push(project);
  } catch (err) {
    project = null;
    Log.debugLog(err);
  }
  Log.debugLog(JSON.stringify(project));
  return project;
});

ipcMain.handle(events.PROJECT_COMMIT, async (event, ...args) => {
  Log.ipcLog(events.PROJECT_COMMIT, args);
  let id = args[0];
  if (!projectIDMap.hasOwnProperty(id)) {
    return false;
  }
  let project = projectIDMap[id];
  await project.commit();
  return true;
});

ipcMain.handle(events.PROJECT_UPDATE_FILES, async (event, ...args) => {
  //Log.ipcLog(events.PROJECT_UPDATE_FILES, args);
  let id = args[0];
  if (!projectIDMap.hasOwnProperty(id)) {
    return [];
  }
  let project = projectIDMap[id];
  await project.updateFiles();
  return project;
});

ipcMain.handle(events.PROJECT_UPDATE_EXCLUDED_FILES, async (event, ...args) => {
  Log.ipcLog(events.PROJECT_UPDATE_EXCLUDED_FILES, args);
  let id = args[0];
  let excludedFiles = args[1];
  if (!projectIDMap.hasOwnProperty(id)) {
    return false;
  }
  let project = projectIDMap[id];
  project.excludedFiles = excludedFiles;
  await project.writeConfig();
  await project.updateFiles();
  return true;
});

ipcMain.handle(events.PROJECT_UPDATE_INFO, async (event, ...args) => {
  Log.ipcLog(events.PROJECT_UPDATE_INFO, args);
  let id = args[0];
  let deltas = args[1];

  if (!projectIDMap.hasOwnProperty(id)) {
    return;
  }
  let project = projectIDMap[id];

  Object.keys(deltas).forEach(dkey => {
    if (project.hasOwnProperty(dkey)) {
      project[dkey] = deltas[dkey];
    }
  });

  return project;
});
