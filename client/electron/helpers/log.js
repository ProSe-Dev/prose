const LOG_HEADER = '>>';

function ipcLog(event, args) {
  console.log(LOG_HEADER, 'IPC event:', event, 'is triggered with args:', args);
}

function debugLog(functionName, msg) {
  console.log(LOG_HEADER, `${functionName}()`, ':::', msg);
}

module.exports = {
  ipcLog,
  debugLog
};
