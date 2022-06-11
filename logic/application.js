const bashService = require('services/bash.js');

const LND_DATA_SOURCE_DIRECTORY = '/lnd/';
const LND_BACKUP_DEST_DIRECTORY = '/lndBackup';
const CHANNEL_BACKUP_FILE = process.env.CHANNEL_BACKUP_FILE || '/lnd/data/chain/bitcoin/' + process.env.LND_NETWORK + '/channel.backup'

async function lndBackup() {

  // eslint-disable-next-line max-len
  await bashService.exec('rsync', ['-r', '--delete', LND_DATA_SOURCE_DIRECTORY, LND_BACKUP_DEST_DIRECTORY]);
}

async function lndChannnelBackup() {
  return CHANNEL_BACKUP_FILE;
}

module.exports = {
  lndBackup,
  lndChannnelBackup
};
