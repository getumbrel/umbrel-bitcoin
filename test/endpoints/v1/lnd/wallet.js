/* eslint-disable max-len,id-length */
/* globals requester, reset */
const sinon = require('sinon');

const lndErrorMocks = require('../../../mocks/LndError.js');

describe('v1/lnd/wallet endpoints', () => {
  let token;

  before(async() => {
    reset();

    token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlciIsImlhdCI6MTU3NTIyNjQxMn0.N06esl2dhN1mFqn-0o4KQmmAaDW9OsHA39calpp_N9B3Ig3aXWgl064XAR9YVK0qwX7zMOnK9UrJ48KUZ-Sb4A';
  });

  describe('/changePassword GET', function() {
    let lndChangePassword;

    afterEach(() => {
      lndChangePassword.restore();
    });

    it('should return 200 on success', done => {

      lndChangePassword = sinon.stub(require('../../../../services/lnd.js'), 'changePassword')
        .resolves({});

      requester
        .post('/v1/lnd/wallet/changePassword')
        .set('authorization', `JWT ${token}`)
        .send({currentPassword: 'currentPassword', newPassword: 'newPassword1'})
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.should.be.json;
          done();
        });
    });

    it('should 400 with invalid currentPassword', done => {

      requester
        .post('/v1/lnd/wallet/changePassword')
        .set('authorization', `JWT ${token}`)
        .send({currentPassword: undefined, newPassword: 'newPassword1'})
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
        .post('/v1/lnd/wallet/changePassword')
        .set('authorization', 'JWT invalid')
        .send({currentPassword: 'currentPassword', newPassword: 'newPassword1'})
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(401);
          done();
        });
    });

    it('should 403 when lnd says current password is wrong', done => {

      lndChangePassword = sinon.stub(require('../../../../services/lnd.js'), 'changePassword')
        .throws(lndErrorMocks.invalidPasswordError());

      requester
        .post('/v1/lnd/wallet/changePassword')
        .set('authorization', `JWT ${token}`)
        .send({currentPassword: 'currentPassword', newPassword: 'newPassword1'})
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(403);
          res.should.be.json;
          done();
        });
    });

    it('should 502 then lnd is restarting', done => {

      lndChangePassword = sinon.stub(require('../../../../services/lnd.js'), 'changePassword')
        .throws(lndErrorMocks.connectionFailedError());

      requester
        .post('/v1/lnd/wallet/changePassword')
        .set('authorization', `JWT ${token}`)
        .send({currentPassword: 'currentPassword', newPassword: 'newPassword1'})
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(502);
          res.should.be.json;
          done();
        });
    });

  });

});
