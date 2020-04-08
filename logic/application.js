const bashService = require('services/bash.js');

const LND_DATA_SOURCE_DIRECTORY = '/lnd/';
const LND_BACKUP_DEST_DIRECTORY = '/lndBackup';
async function lndBackup() {

  // eslint-disable-next-line max-len
  await bashService.exec('rsync', ['-r', '--delete', LND_DATA_SOURCE_DIRECTORY, LND_BACKUP_DEST_DIRECTORY]);
}
module.exports = {
  lndBackup,
};
