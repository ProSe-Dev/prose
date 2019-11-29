const settings = require("electron-settings");
const Log = require("./helpers/log");

let __state;

/**
 * initial setup for settings
 * should be called on start up
 */
function start() {
  __state = settings.getAll();
  console.log(__state);
}

/**
 * stores a key-value pair in a certain namespace
 * @param {String} namespace
 * @param {String} key
 * @param {any} value
 */
function add(namespace, key, value) {
  if (!__state[namespace]) {
    __state[namespace] = {};
  }
  __state[namespace][key] = value;
}

/**
 * returns a namespace
 * @param {String} namespace
 */
function get(namespace) {
  let ns = __state[namespace];

  if (!ns) {
    ns = {};
  }

  return ns;
}

/**
 * returns value
 * @param {String} namespace
 * @param {String} key
 */
function getVal(namespace, key) {
  let ns = __state[namespace];

  if (!ns) {
    return null;
  } else {
    return ns[key];
  }
}

/**
 * closing precedures
 * should be called on close
 */
function end() {
  Log.debugLog("end", "saving state:", __state);
  settings.setAll(__state);
}

module.exports = {
  start,
  add,
  get,
  end,
  getVal
};