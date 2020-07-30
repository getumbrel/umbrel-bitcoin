/**
 * All Lightning business logic.
 */

/* eslint-disable id-length, max-lines, max-statements */

const LndError = require('models/errors.js').LndError;
const NodeError = require('models/errors.js').NodeError;

const lndService = require('services/lnd.js');
const diskLogic = require('logic/disk');
const bitcoindLogic = require('logic/bitcoind.js');

const constants = require('utils/const.js');
const convert = require('utils/convert.js');

const UNIMPLEMENTED_CODE = 12;

const PENDING_OPEN_CHANNELS = 'pendingOpenChannels';
const PENDING_CLOSING_CHANNELS = 'pendingClosingChannels';
const PENDING_FORCE_CLOSING_CHANNELS = 'pendingForceClosingChannels';
const WAITING_CLOSE_CHANNELS = 'waitingCloseChannels';
const PENDING_CHANNEL_TYPES = [PENDING_OPEN_CHANNELS, PENDING_CLOSING_CHANNELS, PENDING_FORCE_CLOSING_CHANNELS,
  WAITING_CLOSE_CHANNELS];

const MAINNET_GENESIS_BLOCK_TIMESTAMP = 1231035305;
const TESTNET_GENESIS_BLOCK_TIMESTAMP = 1296717402;

const FAST_BLOCK_CONF_TARGET = 1;
const NORMAL_BLOCK_CONF_TARGET = 6;
const SLOW_BLOCK_CONF_TARGET = 24;
const CHEAPEST_BLOCK_CONF_TARGET = 144;

const OPEN_CHANNEL_EXTRA_WEIGHT = 10;

const FEE_RATE_TOO_LOW_ERROR = {
  code: 'FEE_RATE_TOO_LOW',
  text: 'Mempool reject low fee transaction. Increase fee rate.',
};

const INSUFFICIENT_FUNDS_ERROR = {
  code: 'INSUFFICIENT_FUNDS',
  text: 'Lower amount or increase confirmation target.'
};

const INVALID_ADDRESS = {
  code: 'INVALID_ADDRESS',
  text: 'Please validate the Bitcoin address is correct.'
};

const OUTPUT_IS_DUST_ERROR = {
  code: 'OUTPUT_IS_DUST',
  text: 'Transaction output is dust.'
};

// Converts a byte object into a hex string.
function toHexString(byteObject) {
  const bytes = Object.values(byteObject);

  return bytes.map(function (byte) {

    return ('00' + (byte & 0xFF).toString(16)).slice(-2); // eslint-disable-line no-magic-numbers
  }).join('');
}

// Creates a new invoice; more commonly known as a payment request.
async function addInvoice(amt, memo) {
  const invoice = await lndService.addInvoice(amt, memo);
  invoice.rHashStr = toHexString(invoice.rHash);

  return invoice;
}

// Creates a new managed channel.
// async function addManagedChannel(channelPoint, name, purpose) {
//   const managedChannels = await getManagedChannels();

//   // Create a new managed channel. If one exists, it will be rewritten.
//   // However, Lnd should guarantee chanId is always unique.
//   managedChannels[channelPoint] = {
//     name: name, // eslint-disable-line object-shorthand
//     purpose: purpose, // eslint-disable-line object-shorthand
//   };

//   await setManagedChannels(managedChannels);
// }

// Change your lnd password. Wallet must exist and be unlocked.
async function changePassword(currentPassword, newPassword) {
  return await lndService.changePassword(currentPassword, newPassword);
}

// Closes the channel that corresponds to the given channelPoint. Force close is optional.
async function closeChannel(txHash, index, force) {
  return await lndService.closeChannel(txHash, index, force);
}

// Decode the payment request into useful information.
function decodePaymentRequest(paymentRequest) {
  return lndService.decodePaymentRequest(paymentRequest);
}

// Estimate the cost of opening a channel. We do this by repurposing the existing estimateFee grpc route from lnd. We
// generate our own unused address and then feed that into the existing call. Then we add an extra 10 sats per
// feerateSatPerByte. This is because the actual cost is slightly more than the default one output estimate.
async function estimateChannelOpenFee(amt, confTarget, sweep) {
  const address = (await generateAddress()).address;
  const baseFeeEstimate = await estimateFee(address, amt, confTarget, sweep);

  if (confTarget === 0) {
    const keys = Object.keys(baseFeeEstimate);

    for (const key of keys) {

      if (baseFeeEstimate[key].feeSat) {
        baseFeeEstimate[key].feeSat = String(parseInt(baseFeeEstimate[key].feeSat, 10) + OPEN_CHANNEL_EXTRA_WEIGHT
          * baseFeeEstimate[key].feerateSatPerByte);
      }

    }

  } else if (baseFeeEstimate.feeSat) {
    baseFeeEstimate.feeSat = String(parseInt(baseFeeEstimate.feeSat, 10) + OPEN_CHANNEL_EXTRA_WEIGHT
      * baseFeeEstimate.feerateSatPerByte);
  }

  return baseFeeEstimate;
}

// Estimate an on chain transaction fee.
async function estimateFee(address, amt, confTarget, sweep) {
  const mempoolInfo = (await bitcoindLogic.getMempoolInfo()).result;

  if (sweep) {

    const balance = parseInt((await lndService.getWalletBalance()).confirmedBalance, 10);
    const amtToEstimate = balance;

    if (confTarget === 0) {
      return await estimateFeeGroupSweep(address, amtToEstimate, mempoolInfo.mempoolminfee);
    }

    return await estimateFeeSweep(address, amtToEstimate, mempoolInfo.mempoolminfee, confTarget, 0, amtToEstimate);
  } else {

    try {
      if (confTarget === 0) {
        return await estimateFeeGroup(address, amt, mempoolInfo.mempoolminfee);
      }

      return await estimateFeeWrapper(address, amt, mempoolInfo.mempoolminfee, confTarget);
    } catch (error) {
      return handleEstimateFeeError(error);
    }
  }
}

// Use binary search strategy to determine the largest amount that can be sent.
async function estimateFeeSweep(address, fullAmtToEstimate, mempoolMinFee, confTarget, l, r) {

  const amtToEstimate = l + Math.floor((r - l) / 2); // eslint-disable-line no-magic-numbers

  try {
    const successfulEstimate = await lndService.estimateFee(address, amtToEstimate, confTarget);

    // Return after we have completed our search.
    if (l === amtToEstimate) {
      successfulEstimate.sweepAmount = amtToEstimate;

      if (successfulEstimate.feeSat < convert(mempoolMinFee, 'btc', 'sat', 'Number')) {
        throw new NodeError('FEE_RATE_TOO_LOW');
      }

      return successfulEstimate;
    }

    return await estimateFeeSweep(address, fullAmtToEstimate, mempoolMinFee, confTarget, amtToEstimate, r);

  } catch (error) {

    // Return after we have completed our search.
    if (l === amtToEstimate) {
      return handleEstimateFeeError(error);
    }

    return await estimateFeeSweep(address, fullAmtToEstimate, mempoolMinFee, confTarget, l, amtToEstimate);
  }
}

async function estimateFeeGroupSweep(address, amt, mempoolMinFee) {
  const calls = [estimateFeeSweep(address, amt, mempoolMinFee, FAST_BLOCK_CONF_TARGET, 0, amt),
  estimateFeeSweep(address, amt, mempoolMinFee, NORMAL_BLOCK_CONF_TARGET, 0, amt),
  estimateFeeSweep(address, amt, mempoolMinFee, SLOW_BLOCK_CONF_TARGET, 0, amt),
  estimateFeeSweep(address, amt, mempoolMinFee, CHEAPEST_BLOCK_CONF_TARGET, 0, amt),
  ];

  const [fast, normal, slow, cheapest]
    = await Promise.all(calls.map(p => p.catch(error => handleEstimateFeeError(error))));

  return {
    fast: fast, // eslint-disable-line object-shorthand
    normal: normal, // eslint-disable-line object-shorthand
    slow: slow, // eslint-disable-line object-shorthand
    cheapest: cheapest, // eslint-disable-line object-shorthand
  };
}

async function estimateFeeWrapper(address, amt, mempoolMinFee, confTarget) {
  const estimate = await lndService.estimateFee(address, amt, confTarget);

  if (estimate.feeSat < convert(mempoolMinFee, 'btc', 'sat', 'Number')) {
    throw new NodeError('FEE_RATE_TOO_LOW');
  }

  return estimate;
}

async function estimateFeeGroup(address, amt, mempoolMinFee) {
  const calls = [estimateFeeWrapper(address, amt, mempoolMinFee, FAST_BLOCK_CONF_TARGET),
  estimateFeeWrapper(address, amt, mempoolMinFee, NORMAL_BLOCK_CONF_TARGET),
  estimateFeeWrapper(address, amt, mempoolMinFee, SLOW_BLOCK_CONF_TARGET),
  estimateFeeWrapper(address, amt, mempoolMinFee, CHEAPEST_BLOCK_CONF_TARGET),
  ];

  const [fast, normal, slow, cheapest]
    = await Promise.all(calls.map(p => p.catch(error => handleEstimateFeeError(error))));

  return {
    fast: fast, // eslint-disable-line object-shorthand
    normal: normal, // eslint-disable-line object-shorthand
    slow: slow, // eslint-disable-line object-shorthand
    cheapest: cheapest, // eslint-disable-line object-shorthand
  };
}

function handleEstimateFeeError(error) {

  if (error.message === 'FEE_RATE_TOO_LOW') {
    return FEE_RATE_TOO_LOW_ERROR;
  } else if (error.error.details === 'transaction output is dust') {
    return OUTPUT_IS_DUST_ERROR;
  } else if (error.error.details === 'insufficient funds available to construct transaction') {
    return INSUFFICIENT_FUNDS_ERROR;
  }

  return INVALID_ADDRESS;
}

// Generates a new on chain segwit bitcoin address.
async function generateAddress() {
  return await lndService.generateAddress();
}

// Generates a new 24 word seed phrase.
async function generateSeed() {

  const lndStatus = await getStatus();

  if (lndStatus.operational) {
    const response = await lndService.generateSeed();

    return { seed: response.cipherSeedMnemonic };
  }

  throw new LndError('Lnd is not operational, therefore a seed cannot be created.');
}

// Returns the total funds in channels and the total pending funds in channels.
function getChannelBalance() {
  return lndService.getChannelBalance();
}

// Returns a count of all open channels.
function getChannelCount() {
  return lndService.getOpenChannels()
    .then(response => ({ count: response.length }));
}

function getChannelPolicy() {
  return lndService.getFeeReport()
    .then(feeReport => feeReport.channelFees);
}

function getForwardingEvents(startTime, endTime, indexOffset) {
  return lndService.getForwardingEvents(startTime, endTime, indexOffset);
}

// Returns a list of all invoices.
async function getInvoices() {
  const invoices = await lndService.getInvoices();

  const reversedInvoices = [];
  for (const invoice of invoices.invoices) {
    reversedInvoices.unshift(invoice);
  }

  return reversedInvoices;
}

// Return all managed channels. Managed channels are channels the user has manually created.
// TODO: how to handle if file becomes corrupt? Suggest simply wiping the file. The channel will still exist.
// function getManagedChannels() {
//   return diskLogic.readManagedChannelsFile();
// }

// Returns a list of all on chain transactions.
async function getOnChainTransactions() {
  const transactions = await lndService.getOnChainTransactions();
  const openChannels = await lndService.getOpenChannels();
  const closedChannels = await lndService.getClosedChannels();
  const pendingChannelRPC = await lndService.getPendingChannels();

  const pendingOpeningChannelTransactions = [];
  for (const pendingChannel of pendingChannelRPC.pendingOpenChannels) {
    const pendingTransaction = pendingChannel.channel.channelPoint.split(':').shift();
    pendingOpeningChannelTransactions.push(pendingTransaction);
  }

  const pendingClosingChannelTransactions = [];
  for (const pendingGroup of [
    pendingChannelRPC.pendingClosingChannels,
    pendingChannelRPC.pendingForceClosingChannels,
    pendingChannelRPC.waitingCloseChannels]) {

    if (pendingGroup.length === 0) {
      continue;
    }
    for (const pendingChannel of pendingGroup) {
      pendingClosingChannelTransactions.push(pendingChannel.closingTxid);
    }
  }

  const openChannelTransactions = [];
  for (const channel of openChannels) {
    const openTransaction = channel.channelPoint.split(':').shift();
    openChannelTransactions.push(openTransaction);
  }

  const closedChannelTransactions = [];
  for (const channel of closedChannels) {
    const closedTransaction = channel.closingTxHash.split(':').shift();
    closedChannelTransactions.push(closedTransaction);

    const openTransaction = channel.channelPoint.split(':').shift();
    openChannelTransactions.push(openTransaction);
  }

  const reversedTransactions = [];
  for (const transaction of transactions) {
    const txHash = transaction.txHash;

    if (openChannelTransactions.includes(txHash)) {
      transaction.type = 'CHANNEL_OPEN';
    } else if (closedChannelTransactions.includes(txHash)) {
      transaction.type = 'CHANNEL_CLOSE';
    } else if (pendingOpeningChannelTransactions.includes(txHash)) {
      transaction.type = 'PENDING_OPEN';
    } else if (pendingClosingChannelTransactions.includes(txHash)) {
      transaction.type = 'PENDING_CLOSE';
    } else if (transaction.amount < 0) {
      transaction.type = 'ON_CHAIN_TRANSACTION_SENT';
    } else if (transaction.amount > 0 && transaction.destAddresses.length > 0) {
      transaction.type = 'ON_CHAIN_TRANSACTION_RECEIVED';

      // Positive amounts are either incoming transactions or a WaitingCloseChannel. There is no way to determine which
      // until the transaction has at least one confirmation. Then a WaitingCloseChannel will become a pending Closing
      // channel and will have an associated tx id.
    } else if (transaction.amount > 0 && transaction.destAddresses.length === 0) {
      transaction.type = 'PENDING_CLOSE';
    } else {
      transaction.type = 'UNKNOWN';
    }

    reversedTransactions.unshift(transaction);
  }

  return reversedTransactions;
}

function getTxnHashFromChannelPoint(channelPoint) {
  return channelPoint.split(':')[0];
}

// Returns a list of all open channels.
const getChannels = async () => {
  // const managedChannelsCall = getManagedChannels();
  const openChannelsCall = lndService.getOpenChannels();
  const pendingChannels = await lndService.getPendingChannels();

  const allChannels = [];

  // Combine all pending channel types
  for (const channel of pendingChannels.waitingCloseChannels) {
    channel.type = 'WAITING_CLOSING_CHANNEL';
    allChannels.push(channel);
  }

  for (const channel of pendingChannels.pendingForceClosingChannels) {
    channel.type = 'FORCE_CLOSING_CHANNEL';
    allChannels.push(channel);
  }

  for (const channel of pendingChannels.pendingClosingChannels) {
    channel.type = 'PENDING_CLOSING_CHANNEL';
    allChannels.push(channel);
  }

  for (const channel of pendingChannels.pendingOpenChannels) {
    channel.type = 'PENDING_OPEN_CHANNEL';

    // Make our best guess as to if this channel was created by us.
    if (channel.channel.remoteBalance === '0') {
      channel.initiator = true;
    } else {
      channel.initiator = false;
    }

    // Include commitFee in balance. This helps us avoid the leaky sats issue by making balances more consistent.
    if (channel.initiator) {
      channel.channel.localBalance
        = String(parseInt(channel.channel.localBalance, 10) + parseInt(channel.commitFee, 10));
    } else {
      channel.channel.remoteBalance
        = String(parseInt(channel.channel.remoteBalance, 10) + parseInt(channel.commitFee, 10));
    }

    allChannels.push(channel);
  }

  // If we have any pending channels, we need to call get chain transactions to determine how many confirmations are
  // left for each pending channel. This gets the entire history of on chain transactions.
  // TODO: Once pagination is available, we should develop a different strategy.
  let chainTxnCall = null;
  let chainTxns = null;
  if (allChannels.length > 0) {
    chainTxnCall = lndService.getOnChainTransactions();
  }

  // Combine open channels
  const openChannels = await openChannelsCall;

  for (const channel of openChannels) {
    channel.type = 'OPEN';

    // Include commitFee in balance. This helps us avoid the leaky sats issue by making balances more consistent.
    if (channel.initiator) {
      channel.localBalance
        = String(parseInt(channel.localBalance, 10) + parseInt(channel.commitFee, 10));
    } else {
      channel.remoteBalance
        = String(parseInt(channel.remoteBalance, 10) + parseInt(channel.commitFee, 10));
    }

    allChannels.push(channel);
  }

  // Add additional managed channel data if it exists
  // Call this async, because it reads from disk
  // const managedChannels = await managedChannelsCall;

  if (chainTxnCall !== null) {
    const chainTxnList = await chainTxnCall;

    // Convert list to object for efficient searching
    chainTxns = {};
    for (const txn of chainTxnList) {
      chainTxns[txn.txHash] = txn;
    }
  }

  // Iterate through all channels
  for (const channel of allChannels) {

    // Pending channels have an inner channel object.
    if (channel.channel) {
      // Use remotePubkey for consistency with open channels
      channel.remotePubkey = channel.channel.remoteNodePub;
      channel.channelPoint = channel.channel.channelPoint;
      channel.capacity = channel.channel.capacity;
      channel.localBalance = channel.channel.localBalance;
      channel.remoteBalance = channel.channel.remoteBalance;

      delete channel.channel;

      // Determine the number of confirmation remaining for this channel

      // We might have invalid channels that dne in the onChainTxList. Skip these channels
      const knownChannel = chainTxns[getTxnHashFromChannelPoint(channel.channelPoint)];
      if (!knownChannel) {
        channel.managed = false;
        channel.name = '';
        channel.purpose = '';

        continue;
      }
      const numConfirmations = knownChannel.numConfirmations;

      if (channel.type === 'FORCE_CLOSING_CHANNEL') {

        // BlocksTilMaturity is provided by Lnd for forced closing channels once they have one confirmation
        channel.remainingConfirmations = channel.blocksTilMaturity;
      } else if (channel.type === 'PENDING_CLOSING_CHANNEL') {

        // Lnd seams to be clearing these channels after just one confirmation and thus they never exist in this state.
        // Defaulting to 1 just in case.
        channel.remainingConfirmations = 1;
      } else if (channel.type === 'PENDING_OPEN_CHANNEL') {

        channel.remainingConfirmations = constants.LN_REQUIRED_CONFIRMATIONS - numConfirmations;
      }

    }

    // Fetch remote node alias and set it
    const { alias } = await getNodeAlias(channel.remotePubkey);
    channel.remoteAlias = alias || "";

    // If a managed channel exists, set the name and purpose
    // if (Object.prototype.hasOwnProperty.call(managedChannels, channel.channelPoint)) {
    //   channel.managed = true;
    //   channel.name = managedChannels[channel.channelPoint].name;
    //   channel.purpose = managedChannels[channel.channelPoint].purpose;
    // } else {
    //   channel.managed = false;
    //   channel.name = '';
    //   channel.purpose = '';
    // }
  }

  return allChannels;
};

// Returns a list of all outgoing payments.
async function getPayments() {
  const payments = await lndService.getPayments();

  const reversedPayments = [];
  for (const payment of payments.payments) {
    reversedPayments.unshift(payment);
  }

  return reversedPayments;
}

// Returns the full channel details of a pending channel.
async function getPendingChannelDetails(channelType, pubKey) {
  const pendingChannels = await getPendingChannels();

  // make sure correct type is used
  if (!PENDING_CHANNEL_TYPES.includes(channelType)) {
    throw Error('unknown pending channel type: ' + channelType);
  }

  const typePendingChannel = pendingChannels[channelType];

  for (let index = 0; index < typePendingChannel.length; index++) {
    const curChannel = typePendingChannel[index];
    if (curChannel.channel && curChannel.channel.remoteNodePub && curChannel.channel.remoteNodePub === pubKey) {
      return curChannel.channel;
    }
  }

  throw new Error('Could not find a pending channel for pubKey: ' + pubKey);
}

// Returns a list of all pending channels.
function getPendingChannels() {
  return lndService.getPendingChannels();
}

// Returns all associated public uris for this node.
function getPublicUris() {
  return lndService.getInfo()
    .then(info => info.uris);
}

function getGeneralInfo() {
  return lndService.getInfo();
}

// Returns the status on lnd syncing to the current chain.
// LND info returns "best_header_timestamp" from getInfo which is the timestamp of the latest Bitcoin block processed
// by LND. Using known date of the genesis block to roughly calculate a percent processed.
async function getSyncStatus() {
  const info = await lndService.getInfo();

  let percentSynced = null;
  let processedBlocks = null;

  if (!info.syncedToChain) {
    const genesisTimestamp = info.testnet ? TESTNET_GENESIS_BLOCK_TIMESTAMP : MAINNET_GENESIS_BLOCK_TIMESTAMP;

    const currentTime = Math.floor(new Date().getTime() / 1000); // eslint-disable-line no-magic-numbers

    percentSynced = ((info.bestHeaderTimestamp - genesisTimestamp) / (currentTime - genesisTimestamp))
      .toFixed(4); // eslint-disable-line no-magic-numbers

    // let's not return a value over the 100% or when processedBlocks > blockHeight
    if (percentSynced < 1.0) {
      processedBlocks = Math.floor(percentSynced * info.blockHeight);
    } else {
      processedBlocks = info.blockHeight;
      percentSynced = (1).toFixed(4);
    }

  } else {
    percentSynced = (1).toFixed(4); // eslint-disable-line no-magic-numbers
    processedBlocks = info.blockHeight;
  }

  return {
    percent: percentSynced,
    knownBlockCount: info.blockHeight,
    processedBlocks: processedBlocks, // eslint-disable-line object-shorthand
  };
}

// Returns the wallet balance and pending confirmation balance.
function getWalletBalance() {
  return lndService.getWalletBalance();
}

// Creates and initialized a Lightning wallet.
async function initializeWallet(password, seed) {

  const lndStatus = await getStatus();

  if (lndStatus.operational) {

    await lndService.initWallet({
      mnemonic: seed,
      password: password // eslint-disable-line object-shorthand
    });

    return;
  }

  throw new LndError('Lnd is not operational, therefore a wallet cannot be created.');
}

// Opens a channel to the node with the given public key with the given amount.
async function openChannel(pubKey, ip, port, amt, satPerByte, name, purpose) { // eslint-disable-line max-params

  var peers = await lndService.getPeers();

  var existingPeer = false;

  for (const peer of peers) {
    if (peer.pubKey === pubKey) {
      existingPeer = true;
      break;
    }
  }

  if (!existingPeer) {
    await lndService.connectToPeer(pubKey, ip, port);
  }

  // only returns a transactions id
  // TODO: Can we get the channel index from here? The channel point is transaction id:index. It could save us a call
  // to pendingChannelDetails.
  const channel = await lndService.openChannel(pubKey, amt, satPerByte);

  // Lnd only allows one channel to be created with a node per block. By searching pending open channels, we can find
  // a unique identifier for the newly created channe. We will use ChannelPoint.
  const pendingChannel = await getPendingChannelDetails(PENDING_OPEN_CHANNELS, pubKey);

  //No need for disk logic for now
  // await addManagedChannel(pendingChannel.channelPoint, name, purpose);

  return channel;
}

// Pays the given invoice.
async function payInvoice(paymentRequest, amt) {
  const invoice = await decodePaymentRequest(paymentRequest);

  if (invoice.numSatoshis !== '0' && amt) { // numSatoshis is returned from lnd as a string
    throw Error('Payment Request with non zero amount and amt value supplied.');
  }

  if (invoice.numSatoshis === '0' && !amt) { // numSatoshis is returned from lnd as a string
    throw Error('Payment Request with zero amount requires an amt value supplied.');
  }

  return await lndService.sendPaymentSync(paymentRequest, amt);
}

// Removes a managed channel.
// TODO: Figure out when an appropriate time to cleanup closed managed channel data. We need it during the closing
// process to display to users.
/*
async function removeManagedChannel(fundingTxId, index) {
  const managedChannels = await getManagedChannels();

  const channelPoint = fundingTxId + ':' + index;

  if (Object.prototype.hasOwnProperty.call(managedChannels, channelPoint)) {
    delete managedChannels[channelPoint];
  }

  return await setManagedChannels(managedChannels);
}
*/

// Send bitcoins on chain to the given address with the given amount. Sats per byte is optional.
function sendCoins(addr, amt, satPerByte, sendAll) {

  // Lnd requires we ignore amt if sendAll is true.
  if (sendAll) {
    return lndService.sendCoins(addr, undefined, satPerByte, sendAll);
  }

  return lndService.sendCoins(addr, amt, satPerByte, sendAll);
}

// Sets the managed channel data store.
// TODO: How to prevent this from getting out of data with multiple calling threads?
// perhaps create a mutex for reading and writing?
// function setManagedChannels(managedChannelsObject) {
//   return diskLogic.writeManagedChannelsFile(managedChannelsObject);
// }

// Returns if lnd is operation and if the wallet is unlocked.
async function getStatus() {
  const bitcoindStatus = await bitcoindLogic.getStatus();

  // lnd requires bitcoind to be operational.
  if (!bitcoindStatus.operational) {

    return {
      operational: false,
      unlocked: false
    };
  }

  try {
    // The getInfo function requires that the wallet be unlocked in order to succeed. Lnd requires this for all
    // encrypted wallets.
    await lndService.getInfo();

    return {
      operational: true,
      unlocked: true
    };
  } catch (error) {

    // lnd might be active, but not possible to contact
    // using RPC if the wallet is encrypted. If we get
    // error code Unimplemented, it means that lnd is
    // running, but the RPC server is not active yet (only
    // WalletUnlocker server active) and most likely this
    // is because of an encrypted wallet.
    if (error instanceof LndError) {

      if (error.error && error.error.code === UNIMPLEMENTED_CODE) {

        return {
          operational: true,
          unlocked: false
        };
      }

      return {
        operational: false,
        unlocked: false
      };
    }

    throw error;
  }
}

// Unlock and existing wallet.
async function unlockWallet(password) {
  const lndStatus = await getStatus();

  if (lndStatus.operational) {
    try {
      await lndService.unlockWallet(password);

      return;
    } catch (error) {
      // If it's a command for the UnlockerService (like
      // 'create' or 'unlock') but the wallet is already
      // unlocked, then these methods aren't recognized any
      // more because this service is shut down after
      // successful unlock. That's why the code
      // 'Unimplemented' means something different for these
      // two commands.
      if (error instanceof LndError) {

        // wallet is already unlocked
        if (error.error && error.error.code === UNIMPLEMENTED_CODE) {
          return;
        }
      }

      throw error;
    }
  }

  throw new LndError('Lnd is not operational, therefore the wallet cannot be unlocked.');
}

async function getVersion() {
  const info = await lndService.getInfo();
  const unformattedVersion = info.version;

  // Remove all beta/commit info. Fragile, LND may one day GA.
  const version = unformattedVersion.split('-', 1)[0];

  return { version: version }; // eslint-disable-line object-shorthand
}

async function getNodeAlias(pubkey) {
  const includeChannels = false;
  let nodeInfo;
  try {
    nodeInfo = await lndService.getNodeInfo(pubkey, includeChannels);
  } catch (error) {
    return { alias: "" };
  }
  return { alias: nodeInfo.node.alias }; // eslint-disable-line object-shorthand
}

function updateChannelPolicy(global, fundingTxid, outputIndex, baseFeeMsat, feeRate, timeLockDelta) {
  return lndService.updateChannelPolicy(global, fundingTxid, outputIndex, baseFeeMsat, feeRate, timeLockDelta);
}

module.exports = {
  addInvoice,
  changePassword,
  closeChannel,
  decodePaymentRequest,
  estimateChannelOpenFee,
  estimateFee,
  generateAddress,
  generateSeed,
  getNodeAlias,
  getChannelBalance,
  getChannelPolicy,
  getChannelCount,
  getInvoices,
  getChannels,
  getForwardingEvents,
  getOnChainTransactions,
  getPayments,
  getPendingChannels,
  getPublicUris,
  getStatus,
  getSyncStatus,
  getWalletBalance,
  initializeWallet,
  openChannel,
  payInvoice,
  sendCoins,
  unlockWallet,
  getGeneralInfo,
  getVersion,
  updateChannelPolicy,
};
