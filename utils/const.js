/* eslint-disable id-length */
module.exports = {
  HSD_PORT: process.env.HSD_PORT || 12037,
  HSD_API_KEY: process.env.HSD_API_KEY || 'moneyprintergobrrr',
  DEVICE_DOMAIN_NAME: process.env.DEVICE_DOMAIN_NAME,

  REQUEST_CORRELATION_NAMESPACE_KEY: 'umbrel-manager-request',
  REQUEST_CORRELATION_ID_KEY: 'reqId',
};
