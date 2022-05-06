const express = require('express');
const router = express.Router();

const systemLogic = require('logic/system.js');
const safeHandler = require('utils/safeHandler');

router.get('/bitcoin-p2p-connection-details', safeHandler(async(req, res) => {
  const connectionDetails = systemLogic.getBitcoinP2PConnectionDetails();

  return res.json(connectionDetails);
}));

router.get('/bitcoin-rpc-connection-details', safeHandler(async(req, res) => {
  const connectionDetails = systemLogic.getBitcoinRPCConnectionDetails();

  return res.json(connectionDetails);
}));

module.exports = router;