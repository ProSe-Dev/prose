const { readdirSync, statSync, readdirAsync, statAsync } = require('./fs');
const { join } = require('path');
const { debugLog } = require('./log');

/**
 * returns a list of all the files in the directory
 * including the files in sub-directories
 * @param {String} path 
 */
function getAllFilesInDirSync(path) {
  return getAllFilesInDirSyncRecur(path, '');
}

function getAllFilesInDirSyncRecur(root, extend) {
  let path = join(root, extend)
  let items = readdirSync(path);
  let files = [];
  items.forEach(item => {
    let subpath = join(path, item);
    let subextend = join(extend, item);
    let stat = statSync(subpath);
    if (stat.isDirectory()) {
      // this will push a copy of all elements of the second array onto the first
      Array.prototype.push.apply(files, getAllFilesInDirSyncRecur(root, subextend))
    } else {
      files.push(subextend)
    }
  })
  return files;
}

function getAllFilesInDirAsync(path) {
  return getAllFilesInDirAsyncRecur(path, '');
}

async function getAllFilesInDirAsyncRecur(root, extend) {
  let path = join(root, extend);
  let items = await readdirAsync(path);
  let files = [];

  for (let item of items) {
    debugLog('getAllFilesInDirAsyncRecur', item);
    let subpath = join(path, item);
    let subextend = join(extend, item);
    let stats = await statAsync(subpath)
    if (stats.isDirectory()) {
      Array.prototype.push.apply(files, await getAllFilesInDirAsyncRecur(root, subextend))
    } else {
      files.push(subextend)
    }
  }

  return files;
}

module.exports = {
  getAllFilesInDirSync,
  getAllFilesInDirAsync
};
