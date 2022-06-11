const constants = require('utils/const.js');
const diskService = require('services/disk');

function readManagedChannelsFile() {
  return diskService.readJsonFile(constants.MANAGED_CHANNELS_FILE)
    .catch(() => Promise.resolve({}));
}

function writeManagedChannelsFile(data) {
  return diskService.writeJsonFile(constants.MANAGED_CHANNELS_FILE, data);
}

module.exports = {
  readManagedChannelsFile,
  writeManagedChannelsFile,
};
