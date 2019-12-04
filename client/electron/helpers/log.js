const log = require('electron-log');
const FUNCTION_BLACK_LIST = ['updateFiles', 'projectStatus'];
const inProduction = !process.env.DEVELOPMENT;

function ipcLog(event, args) {
  if (!inProduction) {
    log.info('IPC event:', event, 'args:', args);
  }
}

function debugLog(functionName, ...args) {
  // if function filter is set, only print if function name matches the filter
  if (FUNCTION_BLACK_LIST.indexOf(functionName) < 0) {
    log.info(`${functionName}()`, ':::', ...args);
  }
}

function error(err) {
  log.error(err);
}

module.exports = {
  ipcLog,
  debugLog,
  error
};
