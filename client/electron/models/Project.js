const filesHelper = require("../helpers/files");
const fs = require("../helpers/fs");
const { resolve } = require("path");
const PROJECT_CONFIG_FOLDER_NAME = ".prose";
const SNAPSHOT_FILE_NAME = "snapshots.json";
const git = require("../helpers/git");
const Log = require("../helpers/log");
const constants = require("../../src/shared/constants");
const CONFIG_NAME = ".git/.prose";
const child = require("child_process").execFile;
var isWin = process.platform === "win32";
const crypto = require("crypto");

class Project {
  constructor(
    projectID,
    name,
    contact,
    abspath,
    creationDate,
    colorClass,
    isSynced,
    excludedFiles,
    snapshots,
    files
  ) {
    this.projectID = projectID;
    this.name = name;
    this.contact = contact;
    this.path = abspath;
    this.creationDate = creationDate;
    this.colorClass = colorClass;
    this.isSynced = isSynced || false;
    this.excludedFiles = excludedFiles || [];
    this.snapshots = snapshots || [];
    this.files = files || [];
  }

  async initialize() {
    let isExistingProject = await git.isGit(this.path);
    Log.debugLog(isExistingProject);
    this.isSynced = !isExistingProject;
    if (!isExistingProject) {
      await git.init(this.path);
    }
    await this.writeConfig();
    await this.commit();
    await this.updateFiles();
    // Hacky
    // TODO: figure out how this works when packaging
    let hookFile = isWin ? "hook.exe" : "hook";
    let postCommitFile = isWin ? "post-commit.exe" : "post-commit";
    Log.debugLog(
      "Copying commit hook from " +
        resolve(__dirname, "..", "..", "hook", hookFile) +
        " to " +
        resolve(this.path, ".git", "hooks", postCommitFile)
    );
    fs.copyFileSync(
      resolve(__dirname, "..", "..", "hook", hookFile),
      resolve(this.path, ".git", "hooks", postCommitFile)
    );
  }

  getConfigPath() {
    return resolve(this.path, CONFIG_NAME);
  }

  async getFileHashes() {
    let hashes = [];
    for (let f of this.files) {
      if (f.status === constants.GIT_EXCLUDED) {
        continue;
      }
      let fileContent = await fs.readFileAsync(resolve(this.path, f.path));
      let hash = crypto.createHash("sha256");
      hash.update(fileContent);
      hashes.push(hash.digest("hex"));
    }
    Log.debugLog(
      "Got hashes: " +
        JSON.stringify(hashes) +
        " from files " +
        JSON.stringify(this.files)
    );
    return hashes;
  }

  async writeConfig() {
    let projectInfo = {
      projectID: this.projectID,
      excludedFiles: this.excludedFiles,
      fileHashes: await this.getFileHashes()
    };
    Log.debugLog(JSON.stringify(projectInfo));
    await fs.writeFileAsync(this.getConfigPath(), JSON.stringify(projectInfo));
  }

  async updateFiles() {
    let fileStatuses = await git.projectStatus(this.path);
    Log.debugLog('updateFiles', 'fileStatuses', fileStatuses);
    let files = fileStatuses;
    this.excludedFiles.forEach(exclude => {
      let existing = files.find(f => f.path === exclude);
      if (existing) {
        existing.status = constants.GIT_EXCLUDED;
      } else {
        files.push({
          path: exclude,
          status: constants.GIT_EXCLUDED
        });
      }
    });
    Log.debugLog('updateFiles', 'files:',files);
    this.files = files;
  }

  async commit() {
    Log.debugLog("COMMITING");
    let commitHash = await git.commit(this.path, this.excludedFiles);
    Log.debugLog("Hash was: " + commitHash);
    if (!commitHash) {
      return;
    }
    this.snapshots.push({
      id: commitHash,
      creationDate: new Date()
    });
    await this.writeConfig();
    Log.debugLog("Completed commit");
    // Manually execute the git commit hook
    let executablePath = resolve(this.path, ".git", "hooks", "post-commit");
    Log.debugLog("Executing " + executablePath);
    child(executablePath, function(err, data) {
      if (err) {
        Log.debugLog(err);
        return;
      }
      Log.debugLog(data.toString());
    });
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
