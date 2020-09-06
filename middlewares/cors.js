const corsOptions = {
  origin: (origin, callback) => {
    const whitelist = [
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost',
      'http://umbrel.local',
      ...process.env.DEVICE_HOSTS.split(",")
    ];

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
