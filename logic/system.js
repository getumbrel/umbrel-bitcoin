const constants = require('utils/const.js');

function getRPCConnectionDetails() {
  const apiKey = constants.HSD_API_KEY;
  const port = constants.HSD_PORT;
  const localAddress = constants.DEVICE_DOMAIN_NAME;
  const localConnectionString = `http://x:${apiKey}@${localAddress}:${port}`;

  return {
    apiKey,
    port,
    localAddress,
    localConnectionString,
  };
}

module.exports = {
  getRPCConnectionDetails,
};
