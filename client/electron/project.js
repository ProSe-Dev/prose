const { dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const {
  SYNC_CREATE_PROJECT_CH,
  PROJECT_CONFIG_FOLDER_NAME
} = require('../src/shared/constants');

const projects = [];

class Project {
  constructor(name, path) {
    this.name = name;
    this.path = path;
    this.repo = null;
  }

  setRepo(repo) {
    this.repo = repo;
  }
}

exports.bootstrap = function () {
  /**
   * open dialog that lets user selects a directory
   * @return String[] folder path selected by user | null if none is selected
   */
  function selectDirSync() {
    let selectedPaths = dialog.showOpenDialogSync(null, {
      title: 'Select Project Folder',
      defaultPath: './',
      buttonLabel: 'Select',
      properties: ['openDirectory', 'multiSelections']
    });
    return selectedPaths ? selectedPaths[0] : null;
  }

  /**
   * checks if a directory is already a prose project
   * @param projectPath - absolute path to the project folder
   * @return boolean
   */
  function isProseProject(projectPath) {
    let configFolder = path.resolve(projectPath, PROJECT_CONFIG_FOLDER_NAME);
    return fs.existsSync(configFolder);
  }

  /** 
   * create a new prose project in the give path 
   * @param {String} projectPath - path to project
   */
  function createProseProject(projectPath) {
    // create hidden directory to contain config files
    let configFolder = path.resolve(projectPath, PROJECT_CONFIG_FOLDER_NAME);
    if (!fs.existsSync(configFolder)) {
      fs.mkdirSync(configFolder);
    }
    let project = new Project(path.basename(projectPath), projectPath);
    // initialize the directory with git
    console.log('project:', project);
    require('./repository')
      .openRepo(projectPath)
      .then((repo) => {
        console.log('repo set up');
        project.setRepo(repo);
      })
      .catch((err) => {
        console.log(err);
      });

    // TODO: [a04a] should create config files in .prose
    // 1) project.json
    // 2) certificate.json
    // can probably do this async

    // TODO: [3934] should grab files specified by the directory
    // maybe use fs.Dir?
    // https://nodejs.org/api/fs.html#fs_class_fs_dir
    let files = [];

    return project;
  }

  /**
   * given a existing prose project return its info
   * @param {String} projectPath - path to project
   */
  function openProseProject(projectPath) {
    // TODO: [1d64] should read config files in .prose
    // 1) project.json
    // 2) certificate.json

    // TODO: [3934] should grab files specified by the directory
    // maybe use fs.Dir?
    // https://nodejs.org/api/fs.html#fs_class_fs_dir
    let files = [];

    let project = {
      name: path.basename(projectPath),
      certificates: [],
      path: projectPath,
      files
    };

    return project;
  }

  ipcMain.on(SYNC_CREATE_PROJECT_CH, (event, arg) => {
    console.log(event, arg);

    // display pop up for user to select the project folder
    let projectPath = selectDirSync();

    if (!projectPath) {
      console.log('user folder selection');
      event.returnValue = null;
    } else if (isProseProject(projectPath)) {
      let project = openProseProject(projectPath);
      event.returnValue = project;
    } else {
      let project = createProseProject(projectPath);
      event.returnValue = project;
    }
  });
}