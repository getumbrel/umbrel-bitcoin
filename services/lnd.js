/* eslint-disable camelcase, max-lines */
const grpc = require('grpc');
const camelizeKeys = require('camelize-keys');

const diskService = require('services/disk');
const LndError = require('models/errors.js').LndError;

const LND_HOST = process.env.LND_HOST || '127.0.0.1';
const TLS_FILE = process.env.TLS_FILE || '/lnd/tls.cert';
const PROTO_FILE = process.env.PROTO_FILE || './resources/rpc.proto';
const LND_PORT = process.env.LND_PORT || 10009; // eslint-disable-line no-magic-numbers
const LND_NETWORK = process.env.LND_NETWORK || 'mainnet'; 

// LND changed the macaroon path to ~/.lnd/data/chain/{chain}/{network}/admin.macaroon. We are currently only
// supporting bitcoind and have that hard coded. However, we are leaving the ability to switch between testnet and
// mainnet. This can be done with the /reset route. LND_NETWORK will be defaulted in /usr/local/casa/applications/.env.
// LND_NETWORK will be overwritten in the settings file.
let MACAROON_FILE = '/lnd/data/chain/bitcoin/' + LND_NETWORK + '/admin.macaroon';

// Developers should overwrite MACAROON_DIR in their .env file or ide. We recommend 'os.homedir() + /lightning-node/'.
if (process.env.MACAROON_DIR) {
  MACAROON_FILE = process.env.MACAROON_DIR + 'admin.macaroon';
}

// TODO move this to volume
const lnrpcDescriptor = grpc.load(PROTO_FILE);
const lnrpc = lnrpcDescriptor.lnrpc;

const DEFAULT_RECOVERY_WINDOW = 250;

// Initialize RPC client will attempt to connect to the lnd rpc with a tls.cert and admin.macaroon. If the wallet has
// not bee created yet, then the client will only be initialized with the tls.cert. There may be times when lnd wallet
// is reset and the tls.cert and admin.macaroon will change.
async function initializeRPCClient() {
  return diskService.readFile(TLS_FILE)
    .then(lndCert => {
      const sslCreds = grpc.credentials.createSsl(lndCert);

      return diskService.readFile(MACAROON_FILE)
        .then(macaroon => {
          // build meta data credentials
          const metadata = new grpc.Metadata();
          metadata.add('macaroon', macaroon.toString('hex'));
          const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
            callback(null, metadata);
          });

          // combine the cert credentials and the macaroon auth credentials
          // such that every call is properly encrypted and authenticated
          return {
            credentials: grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds),
            state: true
          };
        })
        .catch(() => ({ credentials: sslCreds, state: 'WALLET_CREATION_ONLY' }));
    })
    .then(({ credentials, state }) => ({
      lightning: new lnrpc.Lightning(LND_HOST + ':' + LND_PORT, credentials),
      walletUnlocker: new lnrpc.WalletUnlocker(LND_HOST + ':' + LND_PORT, credentials),
      state: state // eslint-disable-line object-shorthand
    }));
}

async function promiseify(rpcObj, rpcFn, payload, description) {
  return new Promise((resolve, reject) => {
    try {
      rpcFn.call(rpcObj, payload, (error, grpcResponse) => {
        if (error) {
          reject(new LndError(`Unable to ${description}`, error));
        } else {
          resolve(camelizeKeys(grpcResponse, '_'));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// an amount, an options memo, and can only be paid to node that created it.
async function addInvoice(amount, memo) {
  const rpcPayload = {
    value: amount,
    memo: memo, // eslint-disable-line object-shorthand
    expiry: 3600 // Should we make this ENV specific for ease of testing?
  };

  const conn = await initializeRPCClient();

  const grpcResponse = await promiseify(conn.lightning, conn.lightning.addInvoice, rpcPayload, 'create new invoice');

  if (grpcResponse && grpcResponse.paymentRequest) {
    return {
      rHash: grpcResponse.rHash,
      paymentRequest: grpcResponse.paymentRequest,
    };
  } else {
    throw new LndError('Unable to parse invoice from lnd');
  }
}

// Change your lnd password. Wallet must exist and be unlocked.
async function changePassword(currentPassword, newPassword) {

  const currentPasswordBuff = Buffer.from(currentPassword, 'utf8');
  const newPasswordBuff = Buffer.from(newPassword, 'utf8');

  const rpcPayload = {
    current_password: currentPasswordBuff,
    new_password: newPasswordBuff,
  };

  const conn = await initializeRPCClient();

  return await promiseify(conn.walletUnlocker, conn.walletUnlocker.changePassword, rpcPayload, 'change password');
}

function closeChannel(fundingTxId, index, force) {
  const rpcPayload = {
    channel_point: {
      funding_txid_str: fundingTxId,
      output_index: index
    },
    force: force // eslint-disable-line object-shorthand
  };

  return initializeRPCClient().then(({ lightning }) => new Promise((resolve, reject) => {
    try {
      const call = lightning.CloseChannel(rpcPayload);

      call.on('data', chan => {
        if (chan.update === 'close_pending') {
          resolve();
        }
      });

      call.on('error', error => {
        reject(new LndError('Unable to close channel', error));
      });
    } catch (error) {
      reject(error);
    }
  }));
}

// Connects this lnd node to a peer.
function connectToPeer(pubKey, ip, port) {
  const rpcPayload = {
    addr: {
      pubkey: pubKey,
      host: ip + ':' + port
    }
  };

  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.ConnectPeer, rpcPayload, 'connect to peer'));
}

function decodePaymentRequest(paymentRequest) {
  const rpcPayload = {
    pay_req: paymentRequest
  };

  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.decodePayReq, rpcPayload, 'decode payment request'))
    .then(invoice => {
      // add on payment request for extra details
      invoice.paymentRequest = paymentRequest;

      return invoice;
    });
}

async function estimateFee(address, amt, confTarget) {
  const addrToAmount = {};
  addrToAmount[address] = amt;

  const rpcPayload = {
    AddrToAmount: addrToAmount,
    target_conf: confTarget,
  };

  const conn = await initializeRPCClient();

  return await promiseify(conn.lightning, conn.lightning.estimateFee, rpcPayload, 'estimate fee request');
}

async function generateAddress() {
  const rpcPayload = {
    type: 0
  };

  const conn = await initializeRPCClient();

  return await promiseify(conn.lightning, conn.lightning.NewAddress, rpcPayload, 'generate address');
}

function generateSeed() {
  return initializeRPCClient().then(({ walletUnlocker, state }) => {
    if (state === true) {
      throw new LndError('Macaroon exists, therefore wallet already exists');
    }

    return promiseify(walletUnlocker, walletUnlocker.GenSeed, {}, 'generate seed');
  });
}

function getChannelBalance() {
  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.ChannelBalance, {}, 'get channel balance'));
}

function getFeeReport() {
  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.FeeReport, {}, 'get fee report'));
}

function getForwardingEvents(startTime, endTime, indexOffset) {
  const rpcPayload = {
    start_time: startTime,
    end_time: endTime,
    index_offset: indexOffset,
  };

  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.ForwardingHistory, rpcPayload, 'get forwarding events'));
}

function getInfo() {
  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.GetInfo, {}, 'get lnd information'));
}

function getNodeInfo(pubkey, includeChannels) {
  const rpcPayload = {
    pub_key: pubkey,
    include_channels: includeChannels
  };
  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.GetNodeInfo, rpcPayload, 'get node information'));
}

// Returns a list of lnd's currently open channels. Channels are considered open by this node and it's directly
// connected peer after three confirmation. After six confirmations, the channel is broadcasted by this node and it's
// directly connected peer to the broader lightning network.
function getOpenChannels() {
  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.ListChannels, {}, 'list channels'))
    .then(grpcResponse => grpcResponse.channels);
}

function getClosedChannels() {
  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.ClosedChannels, {}, 'closed channels'))
    .then(grpcResponse => grpcResponse.channels);
}

// Returns a list of all outgoing payments.
function getPayments() {
  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.ListPayments, {}, 'get payments'));
}

// Returns a list of all lnd's currently connected and active peers.
function getPeers() {
  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.ListPeers, {}, 'get peer information'))
    .then(grpcResponse => {
      if (grpcResponse && grpcResponse.peers) {
        return grpcResponse.peers;
      } else {
        throw new LndError('Unable to parse peer information');
      }
    });
}

// Returns a list of lnd's currently pending channels. Pending channels include, channels that are in the process of
// being opened, but have not reached three confirmations. Channels that are pending closed, but have not reached
// one confirmation. Forced close channels that require potentially hundreds of confirmations.
function getPendingChannels() {
  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.PendingChannels, {}, 'list pending channels'));
}

function getWalletBalance() {
  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.WalletBalance, {}, 'get wallet balance'));
}

function initWallet(options) {
  const passwordBuff = Buffer.from(options.password, 'utf8');

  const rpcPayload = {
    wallet_password: passwordBuff,
    cipher_seed_mnemonic: options.mnemonic,
    recovery_window: DEFAULT_RECOVERY_WINDOW
  };

  return initializeRPCClient().then(({ walletUnlocker, state }) => {
    if (state === true) {
      throw new LndError('Macaroon exists, therefore wallet already exists');
    }

    return promiseify(walletUnlocker, walletUnlocker.InitWallet, rpcPayload, 'initialize wallet')
      .then(() => options.mnemonic);
  });
}

// Returns a list of all invoices.
function getInvoices() {
  const rpcPayload = {
    reversed: true, // Returns most recent
    num_max_invoices: 100,
  };

  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.ListInvoices, rpcPayload, 'list invoices'));
}

// Returns a list of all on chain transactions.
function getOnChainTransactions() {
  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.GetTransactions, {}, 'list on-chain transactions'))
    .then(grpcResponse => grpcResponse.transactions);
}

async function listUnspent() {
  const rpcPayload = {
    min_confs: 1,
    max_confs: 10000000, // Use arbitrarily high maximum confirmation limit.
  };

  const conn = await initializeRPCClient();

  return await promiseify(conn.lightning, conn.lightning.listUnspent, rpcPayload, 'estimate fee request');
}

function openChannel(pubKey, amt, satPerByte) {
  const rpcPayload = {
    node_pubkey_string: pubKey,
    local_funding_amount: amt,
  };

  if (satPerByte) {
    rpcPayload.sat_per_byte = satPerByte;
  } else {
    rpcPayload.target_conf = 6;
  }

  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.OpenChannelSync, rpcPayload, 'open channel'));
}

function sendCoins(addr, amt, satPerByte, sendAll) {
  const rpcPayload = {
    addr: addr, // eslint-disable-line object-shorthand
    amount: amt,
    send_all: sendAll,
  };

  if (satPerByte) {
    rpcPayload.sat_per_byte = satPerByte;
  } else {
    rpcPayload.target_conf = 6;
  }

  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.SendCoins, rpcPayload, 'send coins'));
}

function sendPaymentSync(paymentRequest, amt) {
  const rpcPayload = {
    payment_request: paymentRequest,
    amt: amt, // eslint-disable-line object-shorthand
  };

  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.SendPaymentSync, rpcPayload, 'send lightning payment'))
    .then(response => {
      // sometimes the error comes in on the response...
      if (response.paymentError) {
        throw new LndError(`Unable to send lightning payment: ${response.paymentError}`);
      }

      return response;
    });
}

function unlockWallet(password) {
  const passwordBuff = Buffer.from(password, 'utf8');

  const rpcPayload = {
    wallet_password: passwordBuff
  };

  // TODO how to determine if wallet is already unlocked?
  // This will throw code 12 unimplemented, which is not very helpful
  return initializeRPCClient()
    .then(({ walletUnlocker }) => promiseify(walletUnlocker, walletUnlocker.UnlockWallet, rpcPayload, 'unlock wallet'));
}

function updateChannelPolicy(global, fundingTxid, outputIndex, baseFeeMsat, feeRate, timeLockDelta) {
  const rpcPayload = {
    base_fee_msat: baseFeeMsat,
    fee_rate: feeRate,
    time_lock_delta: timeLockDelta,
  };

  if (global) {
    rpcPayload.global = global;
  } else {
    rpcPayload.chan_point = {
      funding_txid_str: fundingTxid,
      output_index: outputIndex,
    };
  }

  return initializeRPCClient()
    .then(({ lightning }) => promiseify(lightning, lightning.UpdateChannelPolicy, rpcPayload,
      'update channel policy coins'));
}

module.exports = {
  addInvoice,
  changePassword,
  closeChannel,
  connectToPeer,
  decodePaymentRequest,
  estimateFee,
  getChannelBalance,
  getClosedChannels,
  getFeeReport,
  getForwardingEvents,
  getInfo,
  getNodeInfo,
  getInvoices,
  getOpenChannels,
  getPayments,
  getPeers,
  getPendingChannels,
  getWalletBalance,
  generateAddress,
  generateSeed,
  getOnChainTransactions,
  initWallet,
  listUnspent,
  openChannel,
  sendCoins,
  sendPaymentSync,
  unlockWallet,
  updateChannelPolicy,
};
