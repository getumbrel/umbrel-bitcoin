function validateSettingsRequest(settings) {
  const errors = [];

  // PEER SETTINGS

  //  outgoing connections to clearnet peers
  checkBooleanSetting({ setting: settings.clearnet, settingName: "Outgoing connections to clearnet peers" });

  // outgoing connections to tor peers
  checkBooleanSetting({ setting: settings.tor, settingName: "Outgoing connections to tor peers" });

  // Make All Outgoing Connections to Clearnet Peers Over Tor
  checkBooleanSetting({ setting: settings.torProxyForClearnet, settingName: "Make All Outgoing Connections to Clearnet Peers Over Tor" });

  // Outgoing Connections to I2P Peers
  checkBooleanSetting({ setting: settings.i2p, settingName: "Outgoing Connections to I2P Peers" });

  // We check that at least one source of outgoing connections is set (Clearnet, Tor, or I2P).
  if (!settings.clearnet && !settings.tor && !settings.i2p) {
    errors.push("You must enable at least one source of outgoing connections (Clearnet, Tor, or I2P).");
  }

  // Incoming Connections
  checkBooleanSetting({ setting: settings.incomingConnections, settingName: "Incoming Connections" });

  // Peer Block Filters
  checkBooleanSetting({ setting: settings.peerblockfilters, settingName: "Peer Block Filters" });
  // blockfilterindex must be enabled if peerblockfilters is enabled for bitcoind to start
  if (settings.peerblockfilters && !settings.blockfilterindex) {
    errors.push("You must enable Block Filter Index if Peer Block Filters is enabled.");
  }

  // Peer Bloom Filters
  checkBooleanSetting({ setting: settings.peerbloomfilters, settingName: "Peer Bloom Filters" });

  // Peer Ban Time
  // min of 1. No max specified 
  checkNumberSetting({ setting: settings.bantime, settingName: "Peer Ban Time", min: 1 });

  // Max Peer Connections
  // min of 0 (no connections allowed). No max specified.
  checkNumberSetting({ setting: settings.maxconnections, settingName: "Max Peer Connections", min: 0 });

  // Max Receive Buffer
  // min of 1. No max specified
  checkNumberSetting({ setting: settings.maxreceivebuffer, settingName: "Max Receive Buffer", min: 1 });

  // Max Send Buffer
  // min of 1. No max specified.
  checkNumberSetting({ setting: settings.maxsendbuffer, settingName: "Max Send Buffer", min: 1 });

  // Max Time Adjustment
  // min of 0 (no adjustment allowed). No max specified.
  checkNumberSetting({ setting: settings.maxtimeadjustment, settingName: "Max Time Adjustment", min: 0 });

  // Peer Timeout
  // min of 1. No max specified.
  checkNumberSetting({ setting: settings.peertimeout, settingName: "Peer Timeout", min: 1 });

  // Connection Timeout
  // min of 1. No max specified.
  checkNumberSetting({ setting: settings.timeout, settingName: "Connection Timeout", min: 1 });

  // Max Upload Target
  // min of 0 (no limit). No max specified.
  checkNumberSetting({ setting: settings.maxuploadtarget, settingName: "Max Upload Target", min: 0 });

  // OPTIMIZATION SETTINGS

  // Cache Size
  // min of 4 (no limit). No max specified.
  checkNumberSetting({ setting: settings.cacheSizeMB, settingName: "Cache Size", min: 4 });

  // Replace-By-Fee (RBF)
  checkBooleanSetting({ setting: settings.mempoolFullRbf, settingName: "Replace-By-Fee" });

  // Prune Old Blocks
  checkBooleanSetting({ setting: settings.prune.enabled, settingName: "Prune Old Blocks" });
  // min of 550 MiB (0.5767168 GB). No max specified.
  checkNumberSetting({ setting: settings.prune.pruneSizeGB, settingName: "Prune Target Size", min: 0.6 });

  // Block Filter Index
  checkBooleanSetting({ setting: settings.blockfilterindex, settingName: "Block Filter Index" });

  // Maximum Mempool Size
  // 5 MiB when blocksonly mode is set, and 300 MiB when blocksonly mode is not set. No max specified.
  checkNumberSetting({ setting: settings.maxmempool, settingName: "Maximum Mempool Size", min: 300 });

  // Mempool Expiration
  // No min or max specified. We have set a practical min of 1 hour.
  checkNumberSetting({ setting: settings.mempoolexpiry, settingName: "Mempool Expiration", min: 1 });

  // Persist Mempool
  checkBooleanSetting({ setting: settings.persistmempool, settingName: "Persist Mempool" });

  // Max Orphan Transactions
  // No min or max specified. 
  checkNumberSetting({ setting: settings.maxorphantx, settingName: "Max Orphan Transactions", min: 0 });

  // Public REST API
  checkBooleanSetting({ setting: settings.rest, settingName: "Public REST API" });

  // RPC Work Queue Size
  // No min or max specified. We have set a practical min of 1.
  checkNumberSetting({ setting: settings.rpcworkqueue, settingName: "RPC Work Queue Size", min: 1 });

  // NETWORK SELECTION
  // custom. settings.network MUST BE one of the following strings: "mainnet", "testnet", "regtest", "signet"
  if (settings.network !== "main" && settings.network !== "test" && settings.network !== "regtest" && settings.network !== "signet") {
    errors.push(`Invalid value for Network chain. Please try toggling it to a different value.`);
  }

  return errors;

  function checkBooleanSetting({ setting, settingName }) {
    if (typeof setting !== "boolean") {
      errors.push(`Invalid value for ${settingName}. Please try toggling it on/off again.`);
    }
  }

  function checkNumberSetting({ setting, settingName, min, max }) {
    if (typeof setting !== "number" || setting < min || (max !== undefined && setting > max)) {
      errors.push(`${settingName} must be ${max ? `between ${min} and ${max}` : `at least ${min}`}.`);
    }
  }

}

module.exports = validateSettingsRequest;