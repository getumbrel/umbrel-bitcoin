const express = require('express');
const router = express.Router();
const validator = require('utils/validator.js');
const lightningLogic = require('logic/lightning.js');
const auth = require('middlewares/auth.js');
const safeHandler = require('utils/safeHandler');

router.get('/', auth.jwt, safeHandler((req, res) =>
  lightningLogic.getOnChainTransactions()
    .then(transactions => res.json(transactions))
));

router.post('/', auth.jwt, safeHandler((req, res, next) => {

  const addr = req.body.addr;
  const amt = req.body.amt;
  const satPerByte = req.body.satPerByte;
  const sendAll = req.body.sendAll === true;

  try {
    // TODO: addr
    validator.isPositiveInteger(amt);
    validator.isBoolean(sendAll);
    if (satPerByte) {
      validator.isPositiveInteger(satPerByte);
    }
  } catch (error) {
    return next(error);
  }

  return lightningLogic.sendCoins(addr, amt, satPerByte, sendAll)
    .then(transaction => res.json(transaction));
}));

router.get('/estimateFee', auth.jwt, safeHandler(async(req, res, next) => {

  const address = req.query.address;
  const amt = req.query.amt; // Denominated in Satoshi
  const confTarget = req.query.confTarget;
  const sweep = req.query.sweep === 'true';

  try {
    validator.isAlphanumeric(address);
    validator.isPositiveIntegerOrZero(confTarget);

    if (!sweep) {
      validator.isPositiveInteger(amt);
    }
  } catch (error) {
    return next(error);
  }

  return await lightningLogic.estimateFee(address, parseInt(amt, 10), parseInt(confTarget, 10), sweep)
    .then(response => res.json(response));
}));

module.exports = router;
