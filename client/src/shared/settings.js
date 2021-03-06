// keys for settings
module.exports = {
  NAMESPACES: {
    PROJECT: "project",
    APP: "app"
  },
  KEYS: {
    // list of projects
    PROJECTS_LIST: "projectsList",
    // public-private key-pair
    MASTER_KEYS: "masterKeys",
    // relay host address
    RELAY_HOST_ADDRESS: "relayHostAddress",
    // seconds between automatic sync
    SECONDS_BETWEEN_SYNC: "secondsBetweenSync",
    // seconds between project update
    SECONDS_BETWEEN_PROJECT_UPDATE: "secondsBetweenProjectUpdate"
  },
  PRODUCTION: {
    RELAY_LIST_URL: 'https://raw.githubusercontent.com/ProSe-Dev/prose/master/client/relay_addr.json',
  },
  DEFAULTS: {
    RELAY_HOST_ADDRESS: "http://104.42.117.173:8080",
    SECONDS_BETWEEN_SYNC: 15,
    SECONDS_BETWEEN_PROJECT_UPDATE: 5
  }
};
