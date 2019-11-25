// promisify native fs library
// so we don't have to deal with callback hell
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));

module.exports = fs;
