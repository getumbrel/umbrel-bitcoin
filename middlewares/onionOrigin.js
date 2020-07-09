/*
 Tor 9.0.0 does not automatically include the origin header. This causes cross origin errors. This middleware handles
 this bug until Tor releases a bugfix.

 https://trac.torproject.org/projects/tor/ticket/32255
  */
function onionOrigin(req, res, next) {

  // Get just the onion address.
  let hiddenService;
  if (process.env.UMBREL_HIDDEN_SERVICE
    && process.env.UMBREL_HIDDEN_SERVICE.startsWith('http://')) {

    hiddenService = process.env.UMBREL_HIDDEN_SERVICE.substring(7, // eslint-disable-line no-magic-numbers
      process.env.UMBREL_HIDDEN_SERVICE.length);
  }

  // If a hidden service is known and the request has the Tor Browser 9.0.0 bug.
  if (hiddenService
    && req.headers.host.includes(hiddenService)
    && !req.headers.origin) {

    // Manually add hidden service (with http://) to the response header.
    res.setHeader('Access-Control-Allow-Origin', process.env.UMBREL_HIDDEN_SERVICE);
  }

  next();
}

module.exports = onionOrigin;
