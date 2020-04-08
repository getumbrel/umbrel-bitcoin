const corsOptions = {
  origin: (origin, callback) => {
    const whitelist = [
      'http://localhost:3000',
      'http://casa-node.local',
      'http://debug.keys.casa',
      'chrome-extension://lnaedehiikghclgaikolambpbpeknpef',
      process.env.DEVICE_HOST,
    ];

    // Whitelist hidden service if exists.
    if (process.env.CASA_NODE_HIDDEN_SERVICE) {
      whitelist.push(process.env.CASA_NODE_HIDDEN_SERVICE);
    }

    if (whitelist.indexOf(origin) !== -1 || !origin) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  }
};

module.exports = {
  corsOptions,
};
