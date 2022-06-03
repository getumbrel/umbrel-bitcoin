const express = require('express');
const router = express.Router();
const bitcoind = require('logic/bitcoind.js');
const bitcoindService = require('services/bitcoind.js');
const safeHandler = require('utils/safeHandler');

const aggregates = {
  '1hr': [],
  '6hr': [],
  '12hr': [],
  '1d': [],
  '3d': [],
  '7d': [],
};

const setAggregatesValues = async() => {
  const {result: blockchainInfo} = await bitcoindService.getBlockChainInfo();
  const syncPercent = blockchainInfo.verificationprogress;
  
  // only start caching once sync is getting close to complete
  if (syncPercent > 0.98) { 
    const currentBlock = blockchainInfo.blocks;
    
    const ONE_HOUR_AS_BLOCKS = 6;
    const SIX_HOURS_AS_BLOCKS = 36;
    const TWELVE_HOURS_AS_BLOCKS = 72;
    const ONE_DAY_AS_BLOCKS = 144;
    const THREE_DAY_AS_BLOCKS = 432;
    const SEVEN_DAY_AS_BLOCKS = 1008;

    const ranges = await Promise.all([
      bitcoind.getBlockRangeTransactionChunks(currentBlock - ONE_HOUR_AS_BLOCKS, currentBlock, 1), // 1hr
      bitcoind.getBlockRangeTransactionChunks(currentBlock - SIX_HOURS_AS_BLOCKS, currentBlock, 6), // 6hr
      bitcoind.getBlockRangeTransactionChunks(currentBlock - TWELVE_HOURS_AS_BLOCKS, currentBlock, 36), // 12hr
      bitcoind.getBlockRangeTransactionChunks(currentBlock - ONE_DAY_AS_BLOCKS, currentBlock, 72), // 1d
      bitcoind.getBlockRangeTransactionChunks(currentBlock - THREE_DAY_AS_BLOCKS, currentBlock, 144), // 3d
      bitcoind.getBlockRangeTransactionChunks(currentBlock - SEVEN_DAY_AS_BLOCKS, currentBlock, 432) // 7d
    ]);

    aggregates['1hr'] = ranges[0];
    aggregates['6hr'] = ranges[1];
    aggregates['12hr'] = ranges[2];
    aggregates['1d'] = ranges[3];
    aggregates['3d'] = ranges[4];
    aggregates['7d'] = ranges[5];
    
    
    return aggregates;
  }
};

// Disable indexing as we don't show charts for now

// const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
// const MINUTE_AS_MILLISECONDS = 60000;

// (async () => {
//   while (true) {
//     console.log('Building transaction cache...');
//     try {
//       await setAggregatesValues();
//     } catch (error) {
//       console.log(`Failed to build transaction index: "${error.message}"`);
//     }
//     await delay(MINUTE_AS_MILLISECONDS);
//   }
// })();


router.get('/charts', safeHandler((req, res) => {
  res.json(aggregates);
}
));

module.exports = router;
