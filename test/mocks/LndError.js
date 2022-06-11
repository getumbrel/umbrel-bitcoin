const LndError = require('../../models/errors.js').LndError;

function connectionFailedError() {
  return new LndError('Unable to change password', {
    Error: 2,
    UNKNOWN: 'Connect Failed',
    code: 14,
    details: 'Connect Failed'
  });
}

function invalidPasswordError() {
  return new LndError('Unable to change password', {
    Error: 2,
    UNKNOWN: 'invalid passphrase for master public key',
    code: 2,
    details: 'invalid passphrase for master public key'
  });
}

module.exports = {
  connectionFailedError,
  invalidPasswordError,
};
