/* eslint-disable max-len,id-length */
/* globals requester, reset */
const sinon = require('sinon');
const LndError = require('../../../../models/errors.js').LndError;

const bitcoindMocks = require('../../../mocks/bitcoind.js');
const lndMocks = require('../../../mocks/lnd.js');

describe('v1/lnd/transaction endpoints', () => {
  let token;

  before(async() => {
    reset();

    token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlciIsImlhdCI6MTU3NTIyNjQxMn0.N06esl2dhN1mFqn-0o4KQmmAaDW9OsHA39calpp_N9B3Ig3aXWgl064XAR9YVK0qwX7zMOnK9UrJ48KUZ-Sb4A';
  });

  describe('/ GET', function() {

    let lndListChainTxns;
    let lndOpenChannels;
    let lndClosedChannels;
    let lndPendingChannels;

    afterEach(() => {
      lndListChainTxns.restore();
      lndOpenChannels.restore();
      lndClosedChannels.restore();
      lndPendingChannels.restore();
    });

    it('should return one of each transaction type', done => {

      const onChainRecieved = lndMocks.getOnChainTransaction();
      const onChainSent = lndMocks.getOnChainTransaction();
      onChainSent.amount = '-1000000';
      const onChainChannelClosed = lndMocks.getOnChainTransaction();
      const onChainChannelOpen = lndMocks.getOnChainTransaction();
      const onChainChannelPreviouslyOpen = lndMocks.getOnChainTransaction();
      const onChainPendingOpen = lndMocks.getOnChainTransaction('c0b7045595f4f5c024af22312055497e99ed8b7b62b0c7e181d16382a07ae58b');
      const onChainPendingClose = lndMocks.getOnChainTransaction('653c87589da62b5fef18538a62ecce154f94236f158d1148efab98136756ed36');

      const openChannels = [lndMocks.getChannelOpen(onChainChannelOpen.txHash)];
      const closedChannel = [lndMocks.getChannelClosed(undefined, onChainChannelClosed.txHash),
        lndMocks.getChannelClosed(onChainChannelPreviouslyOpen.txHash, undefined)];
      const pendingChannels = lndMocks.getPendingChannels();

      lndListChainTxns = sinon.stub(require('../../../../services/lnd.js'), 'getOnChainTransactions')
        .resolves([onChainChannelPreviouslyOpen, onChainPendingClose, onChainPendingOpen, onChainRecieved, onChainSent,
          onChainChannelClosed, onChainChannelOpen]);
      lndOpenChannels = sinon.stub(require('../../../../services/lnd.js'), 'getOpenChannels')
        .resolves(openChannels);
      lndClosedChannels = sinon.stub(require('../../../../services/lnd.js'), 'getClosedChannels')
        .resolves(closedChannel);
      lndPendingChannels = sinon.stub(require('../../../../services/lnd.js'), 'getPendingChannels')
        .resolves(pendingChannels);

      requester
        .get('/v1/lnd/transaction')
        .set('authorization', `JWT ${token}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.should.be.json;

          res.body[0].type.should.equal('CHANNEL_OPEN');
          res.body[1].type.should.equal('CHANNEL_CLOSE');
          res.body[2].type.should.equal('ON_CHAIN_TRANSACTION_SENT');
          res.body[3].type.should.equal('ON_CHAIN_TRANSACTION_RECEIVED');
          res.body[4].type.should.equal('PENDING_OPEN');
          res.body[5].type.should.equal('PENDING_CLOSE');
          res.body[6].type.should.equal('CHANNEL_OPEN');

          done();
        });
    });
  });

  describe('/estimateFee GET', function() {
    let bitcoindMempoolInfo;
    let lndEstimateFee;
    let lndUnspentUtxos;
    let lndWalletBalance;

    afterEach(() => {
      bitcoindMempoolInfo.restore();
      lndEstimateFee.restore();

      if (lndUnspentUtxos) {
        lndUnspentUtxos.restore();
      }

      if (lndWalletBalance) {
        lndWalletBalance.restore();
      }
    });

    it('should return a fee estimate', done => {

      const mempoolInfo = bitcoindMocks.getMempoolInfo();

      bitcoindMempoolInfo = sinon.stub(require('../../../../services/bitcoind.js'), 'getMempoolInfo')
        .resolves(mempoolInfo);

      const estimateFee = lndMocks.getEstimateFee();

      lndEstimateFee = sinon.stub(require('../../../../services/lnd.js'), 'estimateFee')
        .resolves(estimateFee);

      requester
        .get('/v1/lnd/transaction/estimateFee?address=2NFGwqm9N9LomEh9mzQgofr1WGqkwaxPuWg&amt=100000&confTarget=1&sweep=false')
        .set('authorization', `JWT ${token}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.not.have.property('fast');
          res.body.should.not.have.property('normal');
          res.body.should.not.have.property('slow');
          res.body.should.not.have.property('cheapest');
          res.body.should.have.property('feeSat');
          res.body.should.have.property('feerateSatPerByte');

          done();
        });
    });

    it('should return a fee estimate, group', done => {

      const mempoolInfo = bitcoindMocks.getMempoolInfo();

      bitcoindMempoolInfo = sinon.stub(require('../../../../services/bitcoind.js'), 'getMempoolInfo')
        .resolves(mempoolInfo);

      const estimateFee = lndMocks.getEstimateFee();

      lndEstimateFee = sinon.stub(require('../../../../services/lnd.js'), 'estimateFee')
        .resolves(estimateFee);

      requester
        .get('/v1/lnd/transaction/estimateFee?address=2NFGwqm9N9LomEh9mzQgofr1WGqkwaxPuWg&amt=100000&confTarget=0&sweep=false')
        .set('authorization', `JWT ${token}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.have.property('fast');
          res.body.fast.should.have.property('feeSat');
          res.body.fast.should.have.property('feerateSatPerByte');
          res.body.should.have.property('normal');
          res.body.normal.should.have.property('feeSat');
          res.body.normal.should.have.property('feerateSatPerByte');
          res.body.should.have.property('slow');
          res.body.slow.should.have.property('feeSat');
          res.body.slow.should.have.property('feerateSatPerByte');
          res.body.should.have.property('cheapest');
          res.body.cheapest.should.have.property('feeSat');
          res.body.cheapest.should.have.property('feerateSatPerByte');

          done();
        });
    });

    it('should return insufficient funds', done => {

      const mempoolInfo = bitcoindMocks.getMempoolInfo();

      bitcoindMempoolInfo = sinon.stub(require('../../../../services/bitcoind.js'), 'getMempoolInfo')
        .resolves(mempoolInfo);

      lndEstimateFee = sinon.stub(require('../../../../services/lnd.js'), 'estimateFee')
        .throws(new LndError('Unable to estimate fee request', {details: 'insufficient funds available to construct transaction'}));

      requester
        .get('/v1/lnd/transaction/estimateFee?address=2NFGwqm9N9LomEh9mzQgofr1WGqkwaxPuWg&amt=100000&confTarget=1&sweep=false')
        .set('authorization', `JWT ${token}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.have.property('code');
          res.body.code.should.equal('INSUFFICIENT_FUNDS');
          res.body.should.have.property('text');
          res.body.text.should.equal('Lower amount or increase confirmation target.');

          done();
        });
    });

    it('should return output is dust', done => {

      const mempoolInfo = bitcoindMocks.getMempoolInfo();

      bitcoindMempoolInfo = sinon.stub(require('../../../../services/bitcoind.js'), 'getMempoolInfo')
        .resolves(mempoolInfo);

      lndEstimateFee = sinon.stub(require('../../../../services/lnd.js'), 'estimateFee')
        .throws(new LndError('Unable to estimate fee request', {details: 'transaction output is dust'}));

      requester
        .get('/v1/lnd/transaction/estimateFee?address=2NFGwqm9N9LomEh9mzQgofr1WGqkwaxPuWg&amt=100000&confTarget=1&sweep=false')
        .set('authorization', `JWT ${token}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.have.property('code');
          res.body.code.should.equal('OUTPUT_IS_DUST');
          res.body.should.have.property('text');
          res.body.text.should.equal('Transaction output is dust.');

          done();
        });
    });

    it('should return invalid address', done => {

      const mempoolInfo = bitcoindMocks.getMempoolInfo();

      bitcoindMempoolInfo = sinon.stub(require('../../../../services/bitcoind.js'), 'getMempoolInfo')
        .resolves(mempoolInfo);

      lndEstimateFee = sinon.stub(require('../../../../services/lnd.js'), 'estimateFee')
        .throws(new LndError('Unable to estimate fee request', {details: 'checksum mismatch'}));

      requester
        .get('/v1/lnd/transaction/estimateFee?address=2NFGwqm9N9LomEh9mzQgofr1WGqkwaxPuWg&amt=100000&confTarget=1&sweep=false')
        .set('authorization', `JWT ${token}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.have.property('code');
          res.body.code.should.equal('INVALID_ADDRESS');
          res.body.should.have.property('text');
          res.body.text.should.equal('Please validate the Bitcoin address is correct.');

          done();
        });
    });

    it('should return a sweep estimate, group', done => {

      const mempoolInfo = bitcoindMocks.getMempoolInfo();

      bitcoindMempoolInfo = sinon.stub(require('../../../../services/bitcoind.js'), 'getMempoolInfo')
        .resolves(mempoolInfo);

      const estimateFee = lndMocks.getEstimateFee();
      const walletBalance = lndMocks.getWalletBalance();

      lndEstimateFee = sinon.stub(require('../../../../services/lnd.js'), 'estimateFee')
        .resolves(estimateFee);

      lndWalletBalance = sinon.stub(require('../../../../services/lnd.js'), 'getWalletBalance')
        .resolves(walletBalance);

      requester
        .get('/v1/lnd/transaction/estimateFee?address=2NFGwqm9N9LomEh9mzQgofr1WGqkwaxPuWg&amt=100000&confTarget=0&sweep=true')
        .set('authorization', `JWT ${token}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.have.property('fast');
          res.body.fast.should.have.property('feeSat');
          res.body.fast.should.have.property('feerateSatPerByte');
          res.body.should.have.property('normal');
          res.body.normal.should.have.property('feeSat');
          res.body.normal.should.have.property('feerateSatPerByte');
          res.body.should.have.property('slow');
          res.body.slow.should.have.property('feeSat');
          res.body.slow.should.have.property('feerateSatPerByte');
          res.body.should.have.property('cheapest');
          res.body.cheapest.should.have.property('feeSat');
          res.body.cheapest.should.have.property('feerateSatPerByte');
          done();
        });
    });


    it('should return a sweep estimate', done => {

      const mempoolInfo = bitcoindMocks.getMempoolInfo();

      bitcoindMempoolInfo = sinon.stub(require('../../../../services/bitcoind.js'), 'getMempoolInfo')
        .resolves(mempoolInfo);

      const estimateFee = lndMocks.getEstimateFee();
      const walletBalance = lndMocks.getWalletBalance();

      lndEstimateFee = sinon.stub(require('../../../../services/lnd.js'), 'estimateFee')
        .resolves(estimateFee);

      lndWalletBalance = sinon.stub(require('../../../../services/lnd.js'), 'getWalletBalance')
        .resolves(walletBalance);

      requester
        .get('/v1/lnd/transaction/estimateFee?address=2NFGwqm9N9LomEh9mzQgofr1WGqkwaxPuWg&amt=100000&confTarget=1&sweep=true')
        .set('authorization', `JWT ${token}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.not.have.property('fast');
          res.body.should.not.have.property('normal');
          res.body.should.not.have.property('slow');
          res.body.should.not.have.property('cheapest');
          res.body.should.have.property('feeSat');
          res.body.should.have.property('feerateSatPerByte');
          done();
        });
    });

    it('should return insufficient funds for sweep estimate', done => {

      const mempoolInfo = bitcoindMocks.getMempoolInfo();

      bitcoindMempoolInfo = sinon.stub(require('../../../../services/bitcoind.js'), 'getMempoolInfo')
        .resolves(mempoolInfo);

      const walletBalance = lndMocks.getWalletBalance();

      lndEstimateFee = sinon.stub(require('../../../../services/lnd.js'), 'estimateFee')
        .throws(new LndError('Unable to estimate fee request', {details: 'insufficient funds available to construct transaction'}));

      lndWalletBalance = sinon.stub(require('../../../../services/lnd.js'), 'getWalletBalance')
        .resolves(walletBalance);

      requester
        .get('/v1/lnd/transaction/estimateFee?address=2NFGwqm9N9LomEh9mzQgofr1WGqkwaxPuWg&amt=100000&confTarget=1&sweep=true')
        .set('authorization', `JWT ${token}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.have.property('code');
          res.body.code.should.equal('INSUFFICIENT_FUNDS');
          res.body.should.have.property('text');
          res.body.text.should.equal('Lower amount or increase confirmation target.');

          done();
        });
    });

    it('should return a fee rate too low error', done => {

      const mempoolInfo = bitcoindMocks.getMempoolInfo();
      mempoolInfo.result.mempoolminfee = 0.01;

      bitcoindMempoolInfo = sinon.stub(require('../../../../services/bitcoind.js'), 'getMempoolInfo')
        .resolves(mempoolInfo);

      const estimateFee = lndMocks.getEstimateFee();

      lndEstimateFee = sinon.stub(require('../../../../services/lnd.js'), 'estimateFee')
        .resolves(estimateFee);

      requester
        .get('/v1/lnd/transaction/estimateFee?address=2NFGwqm9N9LomEh9mzQgofr1WGqkwaxPuWg&amt=100000&confTarget=1&sweep=false')
        .set('authorization', `JWT ${token}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.not.have.property('fast');
          res.body.should.not.have.property('normal');
          res.body.should.not.have.property('slow');
          res.body.should.not.have.property('cheapest');
          res.body.should.have.property('code');
          res.body.code.should.equal('FEE_RATE_TOO_LOW');
          res.body.should.have.property('text');

          done();
        });
    });

  });

});
