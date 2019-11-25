const uuid = require('uuid/v4');

function generateShortId() {
  return Math.random().toString().substring(2,7);
}

function generateUUID() {
  return uuid();
}

module.exports = {
  generateShortId,
  generateUUID
}
