const fs = require('./fs');
const git = require('isomorphic-git');
const Log = require('./log');
const dir = '../..';

const statusMapping = {
  'unmodified': '',
  '*unmodified': '',
  '': '',
};

/**
 * returns the status of each file in the project directory
 * status include: "modified" / "unmodified"
 * @param {String} projPath 
 * @param {String[]} filepaths list of files paths relative to the project directory
 * @return {Object} { 'file1': 'modified', 'filed2': 'unmodified' ... }
 */
async function fileStatus(projPath, filepaths) {
  let ret = {}
  for (const fp of filepaths) {
    let status = await git.status({fs, dir: projPath, filepath: fp});
    ret[fp] = status; 
  }
  return ret;
}

async function init(projPath) {
  try {
    await git.init({ fs, dir: projPath });
    return true;
  }
  catch (err) {
    Log.debugLog(err);
    return false;
  }
}

fileStatus('../../..', ['client/package.json', 'README.md', 'client/electron/main.js'])
  .then((status) => {
    console.log(status);
  })
