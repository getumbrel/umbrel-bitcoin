const bitcoindService = require('services/bitcoind.js');
const bashService = require('services/bash.js');

async function getBitcoindAddresses() {

  const addresses = [];

  // Find standard ip address
  const peerInfo = (await bitcoindService.getPeerInfo()).result;

  if (peerInfo.length === 0) {
    addresses.push(await getExternalIPFromIPInfo());
  } else {

    const mostValidIp = getMostValidatedIP(peerInfo);

    // TODO don't call third party service if running with TOR_ONLY
    if (mostValidIp.includes('onion')) {
      addresses.push(await getExternalIPFromIPInfo());
    } else {
      addresses.push(mostValidIp);
    }
  }

  // Try to find that Tor onion address.
  const networkInfo = (await bitcoindService.getNetworkInfo()).result;

  if (Object.prototype.hasOwnProperty.call(networkInfo, 'localaddresses')
    && networkInfo.localaddresses.length > 0) {

    // If Tor is initialized there should only be one local address
    addresses.push(networkInfo.localaddresses[0].address);
  }

  return addresses; // eslint-disable-line object-shorthand
}

async function getExternalIPFromIPInfo() {

  const options = {};

  // use ipinfo.io to get ip address if unable to from peers
  const data = await bashService.exec('curl', ['https://ipinfo.io/ip'], options);

  // clean return characters
  return data.out.replace(/[^a-zA-Z0-9 .:]/g, '');
}

function getMostValidatedIP(peerInfo) {
  const peerCount = {};
  const mostValidatedExternalIp = {
    count: 0,
    externalIP: 'UNKNOWN'
  };

  for (const peer of peerInfo) {

    // Make sure addrlocal exists, sometimes peers don't supply it
    if (Object.prototype.hasOwnProperty.call(peer, 'addrlocal')) {

      // Use the semi colon to account for ipv4 and ipv6
      const semi = peer.addrlocal.lastIndexOf(':');
      const externalIP = peer.addrlocal.substr(0, semi);

      // Ignore localhost, this is incorrect data from bitcoind
      if (externalIP !== '127.0.0.1' || externalIP !== '0.0.0.0') {

        // Increment the count for this external ip
        if (Object.prototype.hasOwnProperty.call(peerCount, externalIP)) {
          peerCount[externalIP]++;
        } else {
          peerCount[externalIP] = 1;
        }

        // Set the most validated external ip
        if (peerCount[externalIP] > mostValidatedExternalIp.count) {
          mostValidatedExternalIp.count = peerCount[externalIP];
          mostValidatedExternalIp.externalIP = externalIP;
        }
      }
    }
  }

  return mostValidatedExternalIp.externalIP;
}

module.exports = {
  getBitcoindAddresses,
};
