const fs = require("./fs");
const git = require("isomorphic-git");
const globby = require("globby");
const Log = require("./log");
const path = require("path");

const statusMapping = {
  ignored: "EXCLUDED",
  unmodified: "UNCHANGED",
  "*modified": "CHANGED",
  "*deleted": "REMOVED",
  "*added": "NEW",
  absent: "REMOVED",
  modified: "CHANGED",
  deleted: "REMOVED",
  added: "NEW",
  "*unmodified": "SOMETHING FUCKED UP",
  "*absent": "REMOVED"
};

async function isGit(projectPath) {
  const gitPath = path.join(projectPath, ".git", "HEAD");
  try {
    let stat = await fs.statAsync(gitPath);
    return stat.isFile();
  } catch (err) {
    if (err.code == "ENOENT") {
      // no such file or directory. File really does not exist
      return false;
    }
    throw err; // something else went wrong, we don't have rights, ...
  }
}

/**
 * returns the status of each file in the project directory
 * status include: "modified" / "unmodified"
 * @param {String} projPath
 * @param {String[]} filepaths list of files paths relative to the project directory
 * @return {Promise<Object>} { 'file1': 'modified', 'filed2': 'unmodified' ... }
 */
async function fileStatus(projPath, filepaths) {
  let ret = {};
  try {
    for (const fp of filepaths) {
      let status = await git.status({ fs, dir: projPath, filepath: fp });
      ret[fp] = statusMapping[status];
    }
    return ret;
  } catch (err) {
    Log.debugLog(err);
    throw err;
  }
}

/**
 * initalize a directory into a git repository
 * if directory has already been initialized, nothing happens
 * @param {String} projPath
 */
async function init(projPath) {
  try {
    await git.init({ fs, dir: projPath });
    Log.debugLog("Initialized repo at " + projPath);
    return true;
  } catch (err) {
    Log.debugLog(err);
    throw err;
  }
}

/**
 * stage all modified files, exluding .gitignored files
 * @param {String} projPath
 */
async function addAll(projPath) {
  try {
    Log.debugLog("addAll started");
    const paths = await globby(["./**", "./**/.*", "!node_modules"], {
      gitignore: true,
      cwd: projPath
    });
    Log.debugLog(JSON.stringify(paths));
    for (const filepath of paths) {
      Log.debugLog("addAll", "adding file:" + filepath);
      await git.add({ fs, dir: projPath, filepath });
    }
  } catch (err) {
    Log.error(err);
    throw err;
  }
}

/**
 * commit the current state of the repository
 * will automatically stage all modifcations then commit
 * @param {String} projPath
 * @return {Promise<String>} commitId
 */
async function commit(projPath) {
  if (!(await isGit(projPath))) {
    throw new Error(projPath + " is not a git repository");
  }

  try {
    await addAll(projPath);
    let commitId = await git.commit({
      fs,
      dir: projPath,
      author: {
        name: "Prose Bot",
        email: "bot@prose.org"
      },
      message: "Auto-generated commit message"
    });
    return commitId;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  fileStatus,
  commit,
  init,
  isGit
};
