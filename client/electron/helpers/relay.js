const Log = require('./log');
const inProduction = !process.env.DEVELOPMENT;

async function getAddress() {
  Log.debugLog('relay.getAddress', 'is production?', inProduction);

  if (inProduction) {
    // app is in production! we should get a remote relay addresses
    let relayListUrl = require('../../src/shared/settings').PRODUCTION.RELAY_LIST_URL;
    Log.debugLog('relay.getAddress', 'fetching from:', relayListUrl);
    let res = await require('node-fetch')(relayListUrl);
    let relayList;
    if (res.ok) {
      relayList = await res.json();
      return relayList[0];
    } else {
      // TODO: fix this, if we get to this point this is really bad!!
      // should not let user continue using the app
      return 'http://localhost:8080';
    }
  } else {
    // this means app is running in development mode
    // use local host
    return 'http://localhost:8080';
  }
}

module.exports = {
  getAddress
};
