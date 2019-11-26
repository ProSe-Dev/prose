const filesHelper = require('../helpers/files');
const fs = require('../helpers/fs');
const { resolve } = require('path');
const PROJECT_CONFIG_FOLDER_NAME = '.prose';
const SNAPSHOT_FILE_NAME = 'snapshots.json';

function createProject() {

}

function loadProject(abspath) {
  return new Project('', '', abspath);
}

class Project {
  constructor(name, contact, abspath, projectId) {
    this.name = name;
    this.contact = contact;
    this.path = abspath;
    this.projectId = projectId;
    this.snapshots = null;
    this.files = null;
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
      let snapshotsRaw = await fs.readFileAsync(resolve(this.path, PROJECT_CONFIG_FOLDER_NAME, SNAPSHOT_FILE_NAME));
      this.snapshots = JSON.parse(snapshotsRaw);
    }
    return this.snapshots;
  }
}

module.exports = {
  loadProject,
};