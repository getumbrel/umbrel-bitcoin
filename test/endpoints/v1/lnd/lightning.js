/* eslint-disable max-len,id-length */
/* globals requester, reset */
const sinon = require('sinon');
const LndError = require('../../../../models/errors.js').LndError;
const lndMocks = require('../../../mocks/lnd.js');

describe('v1/lnd/lightning endpoints', () => {
  let token;

  before(async() => {
    reset();

    token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlciIsImlhdCI6MTU3NTIyNjQxMn0.N06esl2dhN1mFqn-0o4KQmmAaDW9OsHA39calpp_N9B3Ig3aXWgl064XAR9YVK0qwX7zMOnK9UrJ48KUZ-Sb4A';
  });

  describe('/forwardingEvents GET', function() {
    let lndForwardingHistory;

    afterEach(() => {
      lndForwardingHistory.restore();
    });

    it('should return forwarding events', done => {

      lndForwardingHistory = sinon.stub(require('../../../../services/lnd.js'), 'getForwardingEvents')
        .resolves(lndMocks.getForwardingEvents());

      requester
        .get('/v1/lnd/lightning/forwardingEvents?startTime=1548178729853&endTime=1548178729853&indexOffset=1548178729853')
        .set('authorization', `JWT ${token}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.have.property('forwardingEvents');
          done();
        });
    });

    it('should 400 with invalid query parameters', done => {

      lndForwardingHistory = sinon.stub(require('../../../../services/lnd.js'), 'getForwardingEvents')
        .resolves(lndMocks.getForwardingEvents());

      requester
        .get('/v1/lnd/lightning/forwardingEvents?startTime=beginingOfUniverse')
        .set('authorization', `JWT ${token}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }

          res.should.have.status(400);
          res.should.be.json;
          done();
        });
    });

    it('should 401 without a valid token', done => {
      requester
        .get('/v1/lnd/lightning/forwardingEvents')
        .set('authorization', 'JWT invalid')
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(401);
          done();
        });
    });

    it('should 500 on lnd error', done => {

      lndForwardingHistory = sinon.stub(require('../../../../services/lnd.js'), 'getForwardingEvents')
        .throws(new LndError('error getting forwarding events'));

      requester
        .get('/v1/lnd/lightning/forwardingEvents?startTime=1548178729853&endTime=1548178729853&indexOffset=1548178729853')
        .set('authorization', `JWT ${token}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(500);
          res.should.be.json;
          done();
        });
    });

  });

});
