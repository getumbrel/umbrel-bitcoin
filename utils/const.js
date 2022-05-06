/* eslint-disable id-length */
module.exports = {
  REQUEST_CORRELATION_NAMESPACE_KEY: 'umbrel-manager-request',
  REQUEST_CORRELATION_ID_KEY: 'reqId',
  DEVICE_HOSTNAME: process.env.DEVICE_HOSTNAME || 'umbrel.local',
  BITCOIN_P2P_HIDDEN_SERVICE: process.env.BITCOIN_P2P_HIDDEN_SERVICE,
  BITCOIN_P2P_PORT: process.env.BITCOIN_P2P_PORT || 8333,
  BITCOIN_RPC_HIDDEN_SERVICE: process.env.BITCOIN_RPC_HIDDEN_SERVICE,
  BITCOIN_RPC_PORT: process.env.BITCOIN_RPC_PORT || 8332,
  BITCOIN_RPC_USER: process.env.BITCOIN_RPC_USER || 'umbrel',
  BITCOIN_RPC_PASSWORD: process.env.BITCOIN_RPC_PASSWORD || 'moneyprintergobrrr',
};
