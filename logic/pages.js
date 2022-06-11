const lightningLogic = require('logic/lightning.js');
const networkLogic = require('logic/network.js');

async function lndDetails() {

  const calls = [networkLogic.getBitcoindAddresses(),
    lightningLogic.getChannelBalance(),
    lightningLogic.getWalletBalance(),
    lightningLogic.getChannels(),
    lightningLogic.getGeneralInfo()
  ];

  // prevent fail fast, ux will expect a null on failed calls
  const [externalIP, channelBalance, walletBalance, channels, lightningInfo]
    = await Promise.all(calls.map(p => p.catch(err => null))); // eslint-disable-line

  return {
    externalIP: externalIP, // eslint-disable-line object-shorthand
    balance: {
      wallet: walletBalance,
      channel: channelBalance,
    },
    channels: channels, // eslint-disable-line object-shorthand
    lightningInfo: lightningInfo // eslint-disable-line object-shorthand
  };

}

module.exports = {
  lndDetails
};
