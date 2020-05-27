const express = require('express');
const router = express.Router();

const auth = require('middlewares/auth.js');
const lightning = require('logic/lightning.js');
const safeHandler = require('utils/safeHandler');
const validator = require('utils/validator.js');

router.get('/uris', auth.jwt, safeHandler((req, res) =>
  lightning.getPublicUris()
    .then(uris => res.json(uris))
));

//requires no authentication as it is used to fetch loading status
//which could be fetched at login/signup page
router.get('/status', safeHandler((req, res) =>
  lightning.getStatus()
    .then(status => res.json(status))
));

router.get('/sync', auth.jwt, safeHandler((req, res) =>
  lightning.getSyncStatus()
    .then(status => res.json(status))
));

router.get('/version', auth.jwt, safeHandler((req, res) =>
  lightning.getVersion()
    .then(version => res.json(version))
));

router.get('/alias', auth.jwt, safeHandler((req, res, next) => {

  const pubkey = req.query.pubkey;

  try {
    validator.isAlphanumeric(pubkey);
  } catch (error) {
    return next(error);
  }

  return lightning.getNodeAlias(pubkey)
    .then(alias => res.json(alias));
}));

module.exports = router;
