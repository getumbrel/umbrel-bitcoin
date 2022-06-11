/* eslint-disable id-length */
module.exports = {
  LN_REQUIRED_CONFIRMATIONS: 3,
  LND_STATUS_CODES: {
    UNAVAILABLE: 14,
    UNKNOWN: 2,
  },
  JWT_PUBLIC_KEY_FILE: process.env.JWT_PUBLIC_KEY_FILE || 'UNKNOWN',
  MANAGED_CHANNELS_FILE: '/channel-data/managedChannels.json',
  LND_WALLET_PASSWORD: process.env.LND_WALLET_PASSWORD || 'moneyprintergobrrr',
  REQUEST_CORRELATION_NAMESPACE_KEY: 'umbrel-middleware-request',
  REQUEST_CORRELATION_ID_KEY: 'reqId',
  STATUS_CODES: {
    BAD_GATEWAY: 502,
    FORBIDDEN: 403,
    OK: 200,
  },
};
