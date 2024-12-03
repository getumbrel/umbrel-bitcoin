const bitcoind = require('logic/bitcoind.js');

async function getBitcoinStatsWidgetData() {
  const stats = await bitcoind.nodeStatusSummary();
  // bitcoind.nodeStatusSummary() returns the following format:
  // {
  //   "difficulty": 70343519904866.8,
  //   "size": 619737765556,
  //   "mempool": 264944224,
  //   "connections": 11,
  //   "networkhashps": 516082722091118500000
  // }

  const [hashRateValue, hashRateUnits] = abbreviateHashRate(stats.networkhashps);
  const [blockchainSizeValue, blockchainSizeUnits] = abbreviateSize(stats.size);
  const [mempoolValue, mempoolUnits] = abbreviateSize(stats.mempool);

  const widgetData = {
    type: 'four-stats',
    refresh: '5s',
    link: '',
    items: [
      {title: 'Connections', text: stats.connections, subtext: 'peers'},
      {title: 'Mempool', text: mempoolValue, subtext: mempoolUnits},
      {title: 'Hashrate', text: hashRateValue, subtext: hashRateUnits},
      {title: 'Blockchain size', text: blockchainSizeValue, subtext: blockchainSizeUnits}
    ]
  };

  return widgetData;
}

async function getBitcoinSyncWidgetData() {
  const sync = await bitcoind.getSyncStatus();
  // bitcoind.getSyncStatus() returns the following format:
  // {
  //   "chain": "main",
  //   "percent": 0.9999993962382976,
  //   "currentBlock": 828436,
  //   "headerCount": 828436,
  //   "pruned": false
  // }


  // sync.percent is `verificationprogress` from the getblockchaininfo RPC, which can't reach 1 when the most recent block is in the past.
  // To ensure accurate percentage display during sync:
  //  - When no headers have been downloaded, we set the progress to 0% (this is because sync.percent = 1 when no headers have been downloaded).
  //  - When current block matches header count (indicating sync completion), we set the progress to 100%.
  //  - For other cases, we use the value of `verificationprogress` with 2 decimal places and floor it such that the value is in the range 0% to 99.99%.
  // This allows us to show accurate percentage during initial sync by using the `verificationprogress` value, while also
  // not relying on prematurely rounding to 100% before the sync is actually complete
  let syncPercent = Math.floor(sync.percent * 10000) / 100;
  // If we're synced to the tip, always show 100
  if (sync.currentBlock === sync.headerCount) syncPercent = 100;
  // If no headers have been downloaded, show 0. sync.percent = 1 when no headers have been downloaded.
  if (sync.headerCount === 0) syncPercent = 0;


  const widgetData = {
    type: 'text-with-progress',
    refresh: '2s',
    link: '',
    title: 'Blockchain sync',
    text: `Block Height: ${sync.currentBlock}, ${syncPercent}%`,
    progressLabel: syncPercent === 100 ? 'Synced' : 'In progress',
    progress: syncPercent / 100
  };

  return widgetData;
}

// consider breaking out into a utility and using in both frontend and backend
function abbreviateHashRate(n) {
  if (n < 1e3) return [Number(n.toFixed(1)), 'H/s'];
  if (n >= 1e3 && n < 1e6) return [Number((n / 1e3).toFixed(1)), 'kH/s'];
  if (n >= 1e6 && n < 1e9) return [Number((n / 1e6).toFixed(1)), 'MH/s'];
  if (n >= 1e9 && n < 1e12) return [Number((n / 1e9).toFixed(1)), 'GH/s'];
  if (n >= 1e12 && n < 1e15) return [Number((n / 1e12).toFixed(1)), 'TH/s'];
  if (n >= 1e15 && n < 1e18) return [Number((n / 1e15).toFixed(1)), 'PH/s'];
  if (n >= 1e18 && n < 1e21) return [Number((n / 1e18).toFixed(1)), 'EH/s'];
  if (n >= 1e21) return [Number(+(n / 1e21).toFixed(1)), 'ZH/s'];
}

function abbreviateSize(n) {
  if (n < 1e3) return [Number(n.toFixed(1)), 'Bytes'];
  if (n >= 1e3 && n < 1e6) return [Number((n / 1e3).toFixed(1)), 'KB'];
  if (n >= 1e6 && n < 1e9) return [Number((n / 1e6).toFixed(1)), 'MB'];
  if (n >= 1e9 && n < 1e12) return [Number((n / 1e9).toFixed(1)), 'GB'];
  if (n >= 1e12 && n < 1e15) return [Number((n / 1e12).toFixed(1)), 'TB'];
  if (n >= 1e15) return [Number(+(n / 1e15).toFixed(1)), 'PB'];
}

module.exports = {
  getBitcoinStatsWidgetData,
  getBitcoinSyncWidgetData
};
