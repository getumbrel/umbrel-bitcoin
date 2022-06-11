const express = require('express');
const router = express.Router();
const pagesLogic = require('logic/pages.js');
const auth = require('middlewares/auth.js');
const safeHandler = require('utils/safeHandler');

router.get('/lnd', auth.jwt, safeHandler((req, res) =>
  pagesLogic.lndDetails()
    .then(address => res.json(address))
));

module.exports = router;
