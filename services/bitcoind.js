const RpcClient = require('bitcoind-rpc');
const camelizeKeys = require('camelize-keys');

const BitcoindError = require('models/errors.js').BitcoindError;

const RPC_PORT = process.env.HSD_PORT || 12037; // eslint-disable-line no-magic-numbers, max-len
const HOST = process.env.HSD_HOST || '127.0.0.1';
const HSD_API_KEY = process.env.HSD_API_KEY;

const rpcClient = new RpcClient({
  protocol: 'https',
  user: 'x', // eslint-disable-line object-shorthand
  pass: HSD_API_KEY, // eslint-disable-line object-shorthand
  host: HOST,
  port: RPC_PORT,
});

function promiseify(rpcObj, rpcFn, what) {
  return new Promise((resolve, reject) => {
    try {
      rpcFn.call(rpcObj, (err, info) => {
        if (err) {
          reject(new BitcoindError(`Unable to obtain ${what}`, err));
        } else {
          resolve(camelizeKeys(info, '_'));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

function promiseifyParam(rpcObj, rpcFn, param, what) {
  return new Promise((resolve, reject) => {
    try {
      rpcFn.call(rpcObj, param, (err, info) => {
        if (err) {
          reject(new BitcoindError(`Unable to obtain ${what}`, err));
        } else {
          resolve(camelizeKeys(info, '_'));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

function promiseifyParamTwo(rpcObj, rpcFn, param1, param2, what) {
  return new Promise((resolve, reject) => {
    try {
      rpcFn.call(rpcObj, param1, param2, (err, info) => {
        if (err) {
          reject(new BitcoindError(`Unable to obtain ${what}`, err));
        } else {
          resolve(camelizeKeys(info, '_'));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

function getBestBlockHash() {
  return promiseify(rpcClient, rpcClient.getBestBlockHash, 'best block hash');
}

function getBlockHash(height) {
  return promiseifyParam(rpcClient, rpcClient.getBlockHash, height, 'block height');
}

function getBlock(hash) {
  return promiseifyParam(rpcClient, rpcClient.getBlock, hash, 'block info');
}

function getTransaction(txid) {
  return promiseifyParamTwo(rpcClient, rpcClient.getRawTransaction, txid, 1, 'transaction info');
}

function getBlockChainInfo() {
  return promiseify(rpcClient, rpcClient.getBlockchainInfo, 'blockchain info');
}

function getPeerInfo() {
  return promiseify(rpcClient, rpcClient.getPeerInfo, 'peer info');
}

function getBlockCount() {
  return promiseify(rpcClient, rpcClient.getBlockCount, 'block count');
}

function getMempoolInfo() {
  return promiseify(rpcClient, rpcClient.getMemPoolInfo, 'get mempool info');
}

function getNetworkInfo() {
  return promiseify(rpcClient, rpcClient.getNetworkInfo, 'network info');
}

function getMiningInfo() {
  return promiseify(rpcClient, rpcClient.getMiningInfo, 'mining info');
}
function help() {
  // TODO: missing from the library, but can add it not sure how to package.
  // rpc.uptime(function (err, res) {
  //     if (err) {
  //         deferred.reject({status: 'offline'});
  //     } else {
  //         deferred.resolve({status: 'online'});
  //     }
  // });
  return promiseify(rpcClient, rpcClient.help, 'help data');
}

module.exports = {
  getMiningInfo,
  getBestBlockHash,
  getBlockHash,
  getBlock,
  getTransaction,
  getBlockChainInfo,
  getBlockCount,
  getPeerInfo,
  getMempoolInfo,
  getNetworkInfo,
  help,
};
