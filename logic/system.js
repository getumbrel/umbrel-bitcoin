const constants = require('utils/const.js');
const NodeError = require('models/errors.js').NodeError;

function getBitcoinP2PConnectionDetails() {
    const address = constants.BITCOIN_P2P_HIDDEN_SERVICE;
    const port = constants.BITCOIN_P2P_PORT;
    const connectionString = `${address}:${port}`;

    return {
      address,
      port,
      connectionString
    };
}

function getBitcoinRPCConnectionDetails() {
  const hiddenService = constants.BITCOIN_RPC_HIDDEN_SERVICE;
  const label = 'My Umbrel';
  const rpcuser = constants.BITCOIN_RPC_USER;
  const rpcpassword = constants.BITCOIN_RPC_PASSWORD;
  const address = hiddenService;
  const port = constants.BITCOIN_RPC_PORT;
  const connectionString = encodeURIComponent(`btcrpc://${rpcuser}:${rpcpassword}@${address}:${port}?label=${label}`);

  return {
    rpcuser,
    rpcpassword,
    address,
    port,
    connectionString
  };
}

module.exports = {
  getBitcoinP2PConnectionDetails,
  getBitcoinRPCConnectionDetails,
};
