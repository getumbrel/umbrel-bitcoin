const express = require('express');
const router = express.Router();

const auth = require('middlewares/auth.js');
const lightning = require('logic/lightning.js');
const safeHandler = require('utils/safeHandler');

router.get('/uris', auth.jwt, safeHandler((req, res) =>
  lightning.getPublicUris()
    .then(uris => res.json(uris))
));

router.get('/status', auth.jwt, safeHandler((req, res) =>
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

module.exports = router;
