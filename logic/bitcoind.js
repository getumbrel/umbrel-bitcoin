const bitcoindService = require('services/bitcoind.js');
const BitcoindError = require('models/errors.js').BitcoindError;

async function getBlockCount() {
  const blockCount = await bitcoindService.getBlockCount();

  return {blockCount: blockCount.result};
}

async function getConnectionsCount() {
  const peerInfo = await bitcoindService.getPeerInfo();

  var outBoundConnections = 0;
  var inBoundConnections = 0;

  peerInfo.result.forEach(function(peer) {
    if (peer.inbound === false) {
      outBoundConnections++;

      return;
    }
    inBoundConnections++;
  });

  const connections = {
    total: inBoundConnections + outBoundConnections,
    inbound: inBoundConnections,
    outbound: outBoundConnections
  };

  return connections;
}

async function getStatus() {
  try {
    await bitcoindService.help();

    return {operational: true};
  } catch (error) {
    if (error instanceof BitcoindError) {
      return {operational: false};
    }

    throw error;
  }
}

// Return the max synced header for all connected peers or -1 if no data is available.
async function getMaxSyncHeader() {
  const peerInfo = (await bitcoindService.getPeerInfo()).result;

  if (peerInfo.length === 0) {
    return -1;
  }

  const maxPeer = peerInfo.reduce(function(prev, current) {
    return prev.syncedHeaders > current.syncedHeaders ? prev : current;
  });

  return maxPeer.syncedHeaders;
}

async function getMempoolInfo() {
  return await bitcoindService.getMempoolInfo();
}

async function getLocalSyncInfo() {
  const info = await bitcoindService.getBlockChainInfo();

  var blockChainInfo = info.result;

  var blockCount = blockChainInfo.blocks;
  var headerCount = blockChainInfo.headers;

  const percentSynced = (Math.trunc(blockCount / headerCount * 10000) / 10000).toFixed(4); // eslint-disable-line no-magic-numbers, max-len

  return {
    percent: percentSynced,
    currentBlock: blockCount,
    headerCount: headerCount // eslint-disable-line object-shorthand
  };
}

async function getSyncStatus() {
  const maxPeerHeader = await getMaxSyncHeader();
  const localSyncInfo = await getLocalSyncInfo();

  if (maxPeerHeader > localSyncInfo.headerCount) {
    localSyncInfo.headerCount = maxPeerHeader;
  }

  return localSyncInfo;
}

async function getVersion() {
  const networkInfo = await bitcoindService.getNetworkInfo();
  const unformattedVersion = networkInfo.result.subversion;

  // Remove all non-digits or decimals.
  const version = unformattedVersion.replace(/[^\d.]/g, '');

  return {version: version}; // eslint-disable-line object-shorthand
}

module.exports = {
  getBlockCount,
  getConnectionsCount,
  getMempoolInfo,
  getStatus,
  getSyncStatus,
  getVersion
};
