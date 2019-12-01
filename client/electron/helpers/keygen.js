const crypto = require("crypto");

function createKeyPair(secret) {
  let _privateKeyEncoding = {
    type: "pkcs8",
    format: "pem",
  };
  if (secret != null) {
    _privateKeyEncoding.cipher = "aes-256-cbc";
    _privateKeyEncoding.passphrase = secret;
  }
  let result = crypto.generateKeyPairSync("ed25519", {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "pem"
    },
    privateKeyEncoding: _privateKeyEncoding
  });
  return result;
};

module.exports = {
  createKeyPair
};