const express = require('express');
const router = express.Router();

const widgetLogic = require('logic/widgets.js');
const safeHandler = require('utils/safeHandler');

router.get('/stats', safeHandler(async(req, res) => {
  const widgetData = await widgetLogic.getBitcoinStatsWidgetData();
  res.json(widgetData);
}));

router.get('/sync', safeHandler(async(req, res) => {
  const widgetData = await widgetLogic.getBitcoinSyncWidgetData();
  res.json(widgetData);
}));

module.exports = router;
