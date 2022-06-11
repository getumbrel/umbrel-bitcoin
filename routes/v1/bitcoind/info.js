const express = require('express');
const router = express.Router();
const networkLogic = require('logic/network.js');
const bitcoind = require('logic/bitcoind.js');
const safeHandler = require('utils/safeHandler');

router.get('/mempool', safeHandler((req, res) =>
  bitcoind.getMempoolInfo()
    .then(mempool => res.json(mempool.result))
));

router.get('/addresses', safeHandler((req, res) =>
  networkLogic.getBitcoindAddresses()
    .then(addresses => res.json(addresses))
));

router.get('/blockcount', safeHandler((req, res) =>
  bitcoind.getBlockCount()
    .then(blockCount => res.json(blockCount))
));

router.get('/connections', safeHandler((req, res) =>
  bitcoind.getConnectionsCount()
    .then(connections => res.json(connections))
));

router.get('/status', safeHandler((req, res) =>
  bitcoind.getStatus()
    .then(status => res.json(status))
));

router.get('/sync', safeHandler((req, res) =>
  bitcoind.getSyncStatus()
    .then(status => res.json(status))
));

router.get('/version', safeHandler((req, res) =>
  bitcoind.getVersion()
    .then(version => res.json(version))
));

router.get('/statsDump', safeHandler((req, res) =>
  bitcoind.nodeStatusDump()
    .then(statusdump => res.json(statusdump))
));

router.get('/stats', safeHandler((req, res) =>
  bitcoind.nodeStatusSummary()
    .then(statussumarry => res.json(statussumarry))
));

router.get('/block', safeHandler((req, res) => {
  if (req.query.hash !== undefined && req.query.hash !== null) {
    bitcoind.getBlock(req.query.hash)
      .then(blockhash => res.json(blockhash))
  } else if (req.query.height !== undefined && req.query.height !== null) {
    bitcoind.getBlockHash(req.query.height)
      .then(blockhash => res.json(blockhash))
  }
}
));

// /v1/bitcoind/info/block/<hash>
router.get('/block/:id', safeHandler((req, res) =>
  bitcoind.getBlock(req.params.id)
    .then(blockhash => res.json(blockhash))
));

router.get('/blocks', safeHandler((req, res) => {
  const fromHeight = parseInt(req.query.from);
  const toHeight = parseInt(req.query.to);

  if (toHeight - fromHeight > 500) {
    res.status(500).json('Range query must be less than 500');
    return;
  }

  bitcoind.getBlocks(fromHeight, toHeight)
    .then(blocks => res.json(blocks))
}
));

router.get('/txid/:id', safeHandler((req, res) =>
  bitcoind.getTransaction(req.params.id)
    .then(txhash => res.json(txhash))
));

module.exports = router;
