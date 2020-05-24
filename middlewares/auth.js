const passport = require('passport');
const passportJWT = require('passport-jwt');
const constants = require('utils/const.js');
const NodeError = require('models/errors.js').NodeError;
const diskService = require('services/disk.js');

var JwtStrategy = passportJWT.Strategy;
var ExtractJwt = passportJWT.ExtractJwt;

const JWT_AUTH = 'jwt';

passport.serializeUser(function (user, done) {
  return done(null, user.id);
});

async function createJwtOptions() {
  const pubKey = await diskService.readFile(constants.JWT_PUBLIC_KEY_FILE);
  return {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
    secretOrKey: pubKey,
    algorithm: 'RS256'
  };
}

createJwtOptions().then(function (data) {

  const jwtOptions = data;

  passport.use(JWT_AUTH, new JwtStrategy(jwtOptions, function (jwtPayload, done) {
    return done(null, { id: jwtPayload.id });
  }));

});

function jwt(req, res, next) {
  passport.authenticate(JWT_AUTH, { session: false }, function (error, user) {
    if (error || user === false) {
      return next(new NodeError('Invalid JWT', 401)); // eslint-disable-line no-magic-numbers
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(new NodeError('Unable to authenticate', 401)); // eslint-disable-line no-magic-numbers
      }

      return next(null, user);
    });
  })(req, res, next);
}


module.exports = {
  jwt,
};
