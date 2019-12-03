const FUNCTION_FILTER = ['Project.commit', 'Project.initialize'];
const LOG_HEADER = '>>';

function ipcLog(event, args) {
  console.log(LOG_HEADER, 'IPC event:', event, 'is triggered with args:', args);
}

function debugLog(functionName, ...args) {
  // if function filter is set, only print if function name matches the filter
  if (!FUNCTION_FILTER || FUNCTION_FILTER.indexOf(functionName) > -1) {
    console.log(LOG_HEADER, `${functionName}()`, ':::', ...args);
  }
}

function error(err) {
  console.error(err);
}

module.exports = {
  ipcLog,
  debugLog,
  error
};
