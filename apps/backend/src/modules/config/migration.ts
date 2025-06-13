// This module is responsible for migrating the config from the old app (umbel-config.json) to the new app (settings.json)

// Previous app's bitcoin-config.json:

// const DEFAULT_ADVANCED_SETTINGS = {
//   // Peer Settings
//   clearnet: true,
//   torProxyForClearnet: false,
//   tor: true,
//   i2p: true,
//   incomingConnections: false,
//   peerblockfilters: true,
//   blockfilterindex: true,
//   peerbloomfilters: false,
//   bantime: 86400,
//   maxconnections: 125,
//   maxreceivebuffer: 5000,
//   maxsendbuffer: 1000,
//   maxtimeadjustment: 4200,
//   peertimeout: 60,
//   timeout: 5000,
//   maxuploadtarget: 0,
//   // Optimization
//   cacheSizeMB: 450,
//   prune: {
//     enabled: false,
//     pruneSizeGB: 300,
//   },
//   mempoolFullRbf: true,
//   datacarrier: true,
//   datacarriersize: 83,
//   permitbaremultisig: true,
//   maxmempool: 300,
//   mempoolexpiry: 336,
//   persistmempool: true,
//   maxorphantx: 100,
//   reindex: false,
//   // RPC/REST
//   rest: false,
//   rpcworkqueue: 128,
//   // Network Selection
//   network: constants.BITCOIN_DEFAULT_NETWORK
// }
