const filesHelper = require("../helpers/files");
const fs = require("../helpers/fs");
const { resolve } = require("path");
const PROJECT_CONFIG_FOLDER_NAME = ".prose";
const SNAPSHOT_FILE_NAME = "snapshots.json";
const git = require("../helpers/git");
const Log = require("../helpers/log");
const constants = require("../../src/shared/constants");

class Project {
  constructor(projectID, name, contact, abspath, creationDate, colorClass) {
    this.name = name;
    this.contact = contact;
    this.path = abspath;
    this.projectID = projectID;
    this.snapshots = null;
    this.files = null;
    this.creationDate = creationDate;
    this.colorClass = colorClass;
    this.isSynced = false;
    this.commit = this.commit.bind(this);
  }

  async initialize() {
    let isExistingProject = await git.isGit(this.path);
    Log.debugLog(isExistingProject);
    this.isSynced = !isExistingProject;
    if (!isExistingProject) {
      await git.init(this.path);
    }
    await this.writeConfig([this.getConfigPath()]);
    await this.commit();
    await this.updateFiles();
  }

  getConfigPath() {
    return resolve(this.path, ".prose");
  }

  async writeConfig(excludedFiles) {
    let projectInfo = {
      projectID: this.projectID,
      excludedFiles: excludedFiles
    };
    await fs.writeFileAsync(this.getConfigPath(), JSON.stringify(projectInfo));
  }

  async updateFiles() {
    let fileStatuses = await git.projectStatus(this.path);
    Log.debugLog(JSON.stringify(fileStatuses));
    this.files = fileStatuses;
    if (fs.existsSync(this.getConfigPath())) {
      let config = JSON.parse(fs.readFileSync(this.getConfigPath()));
      Log.debugLog(JSON.stringify(config.excludedFiles));
      config.excludedFiles.forEach(exclude => {
        let existing = this.files.find(f => f.path === exclude);
        if (existing) {
          existing.status = constants.GIT_EXCLUDED;
        } else {
          this.files.push({
            path: exclude,
            status: constants.GIT_EXCLUDED
          });
        }
      });
    }
  }

  async commit() {
    return await git.commit(this.path);
  }

  async addSnapshot() {
    // TODO:
    // 1) new git commit
    // 2) create a Snapshot
    // 3) call the relay
    // 4) (in the background) backup snapshot to snapshots.json
  }

  async getFiles() {
    this.files = await filesHelper.getAllFilesInDirAsync(this.path);
    return this.files;
  }

  async getSnapshots() {
    if (!this.snapshots) {
      let snapshotsRaw = await fs.readFileAsync(
        resolve(this.path, PROJECT_CONFIG_FOLDER_NAME, SNAPSHOT_FILE_NAME)
      );
      this.snapshots = JSON.parse(snapshotsRaw);
    }
    return this.snapshots;
  }
}

module.exports = {
  Project
};
