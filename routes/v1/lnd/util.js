const express = require('express');
const router = express.Router();

const auth = require('middlewares/auth.js');
const applicationLogic = require('logic/application.js');
const safeHandler = require('utils/safeHandler');

router.post('/backup', auth.jwt, safeHandler((req, res) =>
  applicationLogic.lndBackup()
    .then(response => res.json(response))
));

module.exports = router;
