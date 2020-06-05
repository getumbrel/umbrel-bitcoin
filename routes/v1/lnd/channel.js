const express = require('express');
const router = express.Router();
const lightningLogic = require('logic/lightning.js');
const auth = require('middlewares/auth.js');
const ValidationError = require('models/errors.js').ValidationError;
const safeHandler = require('utils/safeHandler');
const validator = require('utils/validator.js');

const DEFAULT_TIME_LOCK_DELTA = 144; // eslint-disable-line no-magic-numbers

router.get('/', auth.jwt, safeHandler((req, res) =>
  lightningLogic.getChannels()
    .then(channels => res.json(channels))
));

router.get('/estimateFee', auth.jwt, safeHandler(async (req, res, next) => {

  const amt = req.query.amt; // Denominated in Satoshi
  const confTarget = req.query.confTarget;
  const sweep = req.query.sweep === 'true';

  try {
    validator.isPositiveIntegerOrZero(confTarget);
    validator.isPositiveInteger(amt);
  } catch (error) {
    return next(error);
  }

  return await lightningLogic.estimateChannelOpenFee(parseInt(amt, 10), parseInt(confTarget, 10), sweep)
    .then(response => res.json(response));
}));

router.get('/pending', auth.jwt, safeHandler((req, res) =>
  lightningLogic.getPendingChannels()
    .then(channels => res.json(channels))
));

router.get('/policy', auth.jwt, safeHandler((req, res) =>
  lightningLogic.getChannelPolicy()
    .then(policies => res.json(policies))
));

router.put('/policy', auth.jwt, safeHandler((req, res, next) => {
  const global = req.body.global || false;
  const chanPoint = req.body.chanPoint;
  const baseFeeMsat = req.body.baseFeeMsat;
  const feeRate = req.body.feeRate;
  const timeLockDelta = req.body.timeLockDelta || DEFAULT_TIME_LOCK_DELTA;
  let fundingTxid;
  let outputIndex;

  try {
    validator.isBoolean(global);

    if (!global) {
      [fundingTxid, outputIndex] = chanPoint.split(':');

      if (fundingTxid === undefined || outputIndex === undefined) {
        throw new ValidationError('Invalid channelPoint.');
      }

      validator.isAlphanumeric(fundingTxid);
      validator.isPositiveIntegerOrZero(outputIndex);
    }

    validator.isPositiveIntegerOrZero(baseFeeMsat);
    validator.isDecimal(feeRate + '');
    validator.isPositiveInteger(timeLockDelta);

  } catch (error) {
    return next(error);
  }

  return lightningLogic.updateChannelPolicy(global, fundingTxid, parseInt(outputIndex, 10), baseFeeMsat, feeRate,
    timeLockDelta)
    .then(res.json());
}));

router.delete('/close', auth.jwt, safeHandler((req, res, next) => {

  const channelPoint = req.body.channelPoint;
  const force = req.body.force;

  const parts = channelPoint.split(':');

  if (parts.length !== 2) { // eslint-disable-line no-magic-numbers
    return next(new Error('Invalid channel point: ' + channelPoint));
  }

  var fundingTxId;
  var index;

  try {
    // TODO: fundingTxId, index
    fundingTxId = parts[0];
    index = parseInt(parts[1], 10);

    validator.isBoolean(force);
  } catch (error) {
    return next(error);
  }

  return lightningLogic.closeChannel(fundingTxId, index, force)
    .then(channel => res.json(channel));
}));

router.get('/count', auth.jwt, safeHandler((req, res) =>
  lightningLogic.getChannelCount()
    .then(count => res.json(count))
));

router.post('/open', auth.jwt, safeHandler((req, res, next) => {

  const pubKey = req.body.pubKey;
  const ip = req.body.ip || '127.0.0.1';
  const port = req.body.port || 9735; // eslint-disable-line no-magic-numbers
  const amt = req.body.amt;
  const satPerByte = req.body.satPerByte;
  const name = req.body.name;
  const purpose = req.body.purpose;

  try {

    // TODO validate ip address as ip4 or ip6 address
    validator.isAlphanumeric(pubKey);
    validator.isPositiveInteger(port);
    validator.isPositiveInteger(amt);
    if (satPerByte) {
      validator.isPositiveInteger(satPerByte);
    }
    validator.isAlphanumericAndSpaces(name);
    validator.isAlphanumericAndSpaces(purpose);
  } catch (error) {
    return next(error);
  }

  return lightningLogic.openChannel(pubKey, ip, port, amt, satPerByte, name, purpose)
    .then(channel => res.json(channel));
}));

module.exports = router;
