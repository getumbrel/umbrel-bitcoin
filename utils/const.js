/* eslint-disable id-length */
module.exports = {
  LN_REQUIRED_CONFIRMATIONS: 3,
  LND_STATUS_CODES: {
    UNAVAILABLE: 14,
    UNKNOWN: 2,
  },
  JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY || 'UNKNOWN',
  MANAGED_CHANNELS_FILE: '/channel-data/managedChannels.json',
  REQUEST_CORRELATION_NAMESPACE_KEY: 'lnapi-request',
  REQUEST_CORRELATION_ID_KEY: 'reqId',
  STATUS_CODES: {
    BAD_GATEWAY: 502,
    FORBIDDEN: 403,
    OK: 200,
  },
};
