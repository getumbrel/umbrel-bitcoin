/* eslint-disable no-unused-vars, no-magic-numbers */
const logger = require('utils/logger.js');
const LndError = require('models/errors.js').LndError;

function handleError(error, req, res, next) {

  var statusCode = error.statusCode || 500;
  var route = req.url || '';
  var message = error.message || '';

  if (error instanceof LndError) {
    if (error.error && error.error.code === 12) {
      statusCode = 403;
      message = 'Must unlock wallet';

      // add additional details if available
    } else if (error.error && error.error.details) {
      // this may be too much information to return
      message += ', ' + error.error.details;
    }
  }

  logger.error(message, route, error.stack);

  res.status(statusCode).json(message);
}

module.exports = handleError;
