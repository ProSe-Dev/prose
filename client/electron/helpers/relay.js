const inProduction = !process.env.DEVELOPMENT;

async function getAddress() {
  if (inProduction) {
    let relayListUrl = require('../../src/shared/settings').PRODUCTION.RELAY_LIST_URL;
    let res = require('node-fetch')(relayListUrl);

    let relayList;
    if (res.status === 200) {
      relayList = await res.json();
    }

    return relayList[0];
  } else {
    return 'http://localhost:8080';
  }
}

module.exports = {
  getAddress
};
