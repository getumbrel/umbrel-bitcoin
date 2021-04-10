const express = require('express');
const router = express.Router();
const lightningLogic = require('logic/lightning.js');
const auth = require('middlewares/auth.js');
const safeHandler = require('utils/safeHandler');
const constants = require('utils/const.js');
const logger = require('utils/logger.js');
const validator = require('utils/validator.js');
const LndError = require('models/errors.js').LndError;

router.get('/btc', auth.jwt, safeHandler((req, res) =>
  lightningLogic.getWalletBalance()
    .then(balance => res.json(balance))
));

// API endpoint to change your lnd password.
router.post('/changePassword', auth.jwt, safeHandler(async(req, res, next) => {

  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;

  try {
    validator.isString(currentPassword);
    validator.isMinPasswordLength(currentPassword);
    validator.isString(newPassword);
    validator.isMinPasswordLength(newPassword);
  } catch (error) {
    return next(error);
  }

  try {
    await lightningLogic.changePassword(currentPassword, newPassword);

    return res.status(constants.STATUS_CODES.OK).json();
  } catch (error) {
    if (error instanceof LndError && error.message === 'Unable to change password') {

      logger.info(error, 'changePassword');

      // Invalid passphrase for master public key
      if (error.error.code === constants.LND_STATUS_CODES.UNKNOWN) {

        return res.status(constants.STATUS_CODES.FORBIDDEN).json();

      // Connect Failed (lnd is probably restarting)
      } else if (error.error.code === constants.LND_STATUS_CODES.UNAVAILABLE) {

        return res.status(constants.STATUS_CODES.BAD_GATEWAY).json();
      }
    }

    throw error;
  }

}));

// Should not include auth because the user isn't registered yet. Once the user initializes a wallet, that wallet is
// locked and cannot be updated unless a full system reset is initiated.
router.post('/init', safeHandler((req, res) => {

  const password = req.body.password;
  const seed = req.body.seed;

  if (seed.length !== 24) { // eslint-disable-line no-magic-numbers
    throw new Error('Invalid seed length');
  }

  // TODO validate password requirements

  return lightningLogic.initializeWallet(password, seed)
    .then(response => res.json(response));
}));

router.get('/lightning', auth.jwt, safeHandler((req, res) =>
  lightningLogic.getChannelBalance()
    .then(balance => res.json(balance))
));

// Should not include auth because the user isn't registered yet. The user can get a seed phrase as many times as they
// would like until the wallet has been initialized.
router.get('/seed', safeHandler((req, res) =>
  lightningLogic.generateSeed()
    .then(seed => res.json(seed))
));

module.exports = router;
