const merge = require('lodash.merge');

const path = require("path");
const constants = require("utils/const.js");
const diskService = require("services/disk");

// TODO - consider moving these unit conversions to utils/const.js
const GB_TO_MiB = 953.674;
const MB_TO_MiB = 0.953674;

const DEFAULT_ADVANCED_SETTINGS = {
  clearnet: true,
  torProxyForClearnet: false,
  tor: true,
  i2p: true,
  incomingConnections: false,
  cacheSizeMB: 450,
  mempoolFullRbf: false,
  rest: false,
  prune: {
    enabled: false,
    pruneSizeGB: 300,
  },
  reindex: false,
  network: constants.BITCOIN_DEFAULT_NETWORK
}

async function getJsonStore() {
  try {
    const jsonStore = await diskService.readJsonFile(constants.JSON_STORE_FILE);
    return merge({}, DEFAULT_ADVANCED_SETTINGS, jsonStore);
  } catch (error) {
    return DEFAULT_ADVANCED_SETTINGS;
  }
}

async function applyCustomBitcoinConfig(bitcoinConfig) {
  await applyBitcoinConfig(bitcoinConfig, false);
}

async function applyDefaultBitcoinConfig() {
  await applyBitcoinConfig(DEFAULT_ADVANCED_SETTINGS, true);
}

async function applyBitcoinConfig(bitcoinConfig, shouldOverwriteExistingFile) {
  await Promise.all([
    updateJsonStore(bitcoinConfig),
    generateUmbrelBitcoinConfig(bitcoinConfig),
    generateBitcoinConfig(shouldOverwriteExistingFile),
  ]);
}

// There's a race condition here if you do two updates in parallel but it's fine for our current use case
async function updateJsonStore(newProps) {
  const jsonStore = await getJsonStore();
  return diskService.writeJsonFile(constants.JSON_STORE_FILE, merge(jsonStore, newProps));
}

// creates umbrel-bitcoin.conf
function generateUmbrelBitcoinConfig(settings) {
  const confString = settingsToMultilineConfString(settings);
  return diskService.writePlainTextFile(constants.UMBREL_BITCOIN_CONF_FILEPATH, confString);
}

// creates bitcoin.conf with includeconf=umbrel-bitcoin.conf
async function generateBitcoinConfig(shouldOverwriteExistingFile = false) {
  const baseName = path.basename(constants.UMBREL_BITCOIN_CONF_FILEPATH);
  const includeConfString = `# Load additional configuration file, relative to the data directory.\nincludeconf=${baseName}`;

  const fileExists = await diskService.fileExists(constants.BITCOIN_CONF_FILEPATH);

  // if bitcoin.conf does not exist or should be overwritten, create it with includeconf=umbrel-bitcoin.conf
  if (!fileExists || shouldOverwriteExistingFile) {
    return await diskService.writePlainTextFile(constants.BITCOIN_CONF_FILEPATH, includeConfString);
  }

  const existingConfContents = await diskService.readUtf8File(constants.BITCOIN_CONF_FILEPATH);
  
  // if bitcoin.conf exists but does not include includeconf=umbrel-bitcoin.conf, add includeconf=umbrel-bitcoin.conf to the top of the file
  if (!existingConfContents.includes(includeConfString)) {
    return await diskService.writePlainTextFile(constants.BITCOIN_CONF_FILEPATH, `${includeConfString}\n${existingConfContents}`);
  }

  // do nothing if bitcoin.conf exists and contains includeconf=umbrel-bitcoin.conf
}

function settingsToMultilineConfString(settings) {
  const umbrelBitcoinConfig = [];

  // [CHAIN]
  umbrelBitcoinConfig.push("# [chain]"); 
  if (settings.network !== 'main') {
    umbrelBitcoinConfig.push(`chain=${settings.network}`)
  }

  // [CORE]
  umbrelBitcoinConfig.push(""); 
  umbrelBitcoinConfig.push("# [core]"); 

  // dbcache
  umbrelBitcoinConfig.push("# Maximum database cache size in MiB"); 
  umbrelBitcoinConfig.push(`dbcache=${Math.round(settings.cacheSizeMB * MB_TO_MiB)}`); 

  // mempoolfullrbf
  if (settings.mempoolFullRbf) {
    umbrelBitcoinConfig.push("# Allow any transaction in the mempool of Bitcoin Node to be replaced with newer versions of the same transaction that include a higher fee."); 
    umbrelBitcoinConfig.push('mempoolfullrbf=1'); 
  }

  // prune
  if (settings.prune.enabled) {
    umbrelBitcoinConfig.push("# Reduce disk space requirements to this many MiB by enabling pruning (deleting) of old blocks. This mode is incompatible with -txindex and -coinstatsindex. WARNING: Reverting this setting requires re-downloading the entire blockchain. (default: 0 = disable pruning blocks, 1 = allow manual pruning via RPC, greater than or equal to 550 = automatically prune blocks to stay under target size in MiB).");
    umbrelBitcoinConfig.push(`prune=${Math.round(settings.prune.pruneSizeGB * GB_TO_MiB)}`);
  }
  
  // Only enable txindex if pruning is disabled
  const txindexEnabled = settings.prune.enabled ? '0' : '1';
  umbrelBitcoinConfig.push(`txindex=${txindexEnabled}`);

  // reindex
  if (settings.reindex) {
    umbrelBitcoinConfig.push('# Rebuild chain state and block index from the blk*.dat files on disk.');
    umbrelBitcoinConfig.push('reindex=1');  
  }


  // [NETWORK]
  umbrelBitcoinConfig.push(""); 
  umbrelBitcoinConfig.push("# [network]"); 

  // clearnet
  if (settings.clearnet) {
    umbrelBitcoinConfig.push('# Connect to peers over the clearnet.')
    umbrelBitcoinConfig.push('onlynet=ipv4');
    umbrelBitcoinConfig.push('onlynet=ipv6');
  }
  
  if (settings.torProxyForClearnet) {
    umbrelBitcoinConfig.push('# Connect through <ip:port> SOCKS5 proxy.');
    umbrelBitcoinConfig.push(`proxy=${constants.TOR_PROXY_IP}:${constants.TOR_PROXY_PORT}`); 
  }

  // tor
  if (settings.tor) {
    umbrelBitcoinConfig.push('# Use separate SOCKS5 proxy <ip:port> to reach peers via Tor hidden services.');
    umbrelBitcoinConfig.push('onlynet=onion');
    umbrelBitcoinConfig.push(`onion=${constants.TOR_PROXY_IP}:${constants.TOR_PROXY_PORT}`);
    umbrelBitcoinConfig.push('# Tor control <ip:port> and password to use when onion listening enabled.');
    umbrelBitcoinConfig.push(`torcontrol=${constants.TOR_PROXY_IP}:${constants.TOR_PROXY_CONTROL_PORT}`);
    umbrelBitcoinConfig.push(`torpassword=${constants.TOR_PROXY_CONTROL_PASSWORD}`);
  }

  // i2p
  if (settings.i2p) {
    umbrelBitcoinConfig.push('# I2P SAM proxy <ip:port> to reach I2P peers.');
    umbrelBitcoinConfig.push(`i2psam=${constants.I2P_DAEMON_IP}:${constants.I2P_DAEMON_PORT}`);
    umbrelBitcoinConfig.push('onlynet=i2p');
  }

  // incoming connections
  umbrelBitcoinConfig.push('# Enable/disable incoming connections from peers.');
  const listen = settings.incomingConnections ? 1 : 0;
  umbrelBitcoinConfig.push(`listen=1`);
  umbrelBitcoinConfig.push(`listenonion=${listen}`);
  umbrelBitcoinConfig.push(`i2pacceptincoming=${listen}`);

  // whitelist
  umbrelBitcoinConfig.push(`# Whitelist peers connecting from local Umbrel IP range. Whitelisted peers cannot be DoS banned and their transactions are always relayed, even if they are already in the mempool.`);
  umbrelBitcoinConfig.push(`whitelist=10.21.0.0/16`);

  // [RPC]
  umbrelBitcoinConfig.push("");
  umbrelBitcoinConfig.push("# [rpc]"); 
  if (settings.rest) {
    umbrelBitcoinConfig.push("# Accept public REST requests.");
    umbrelBitcoinConfig.push('rest=1');
  }

  umbrelBitcoinConfig.push("");
  umbrelBitcoinConfig.push(`# Required to configure Tor control port properly`);
  umbrelBitcoinConfig.push(`[${settings.network}]`);
  umbrelBitcoinConfig.push(`bind=0.0.0.0:8333`);
  umbrelBitcoinConfig.push(`bind=${constants.BITCOIND_IP}:8334=onion`);

  return umbrelBitcoinConfig.join('\n');
}

module.exports = {
  getJsonStore,
  applyCustomBitcoinConfig,
  applyDefaultBitcoinConfig,
};
