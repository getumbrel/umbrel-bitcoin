const express = require('express');
const router = express.Router();

const systemLogic = require('logic/system.js');
const safeHandler = require('utils/safeHandler');

router.get('/rpc-connection-details', safeHandler(async(req, res) => {
  const connectionDetails = systemLogic.getRPCConnectionDetails();

  return res.json(connectionDetails);
}));

module.exports = router;
